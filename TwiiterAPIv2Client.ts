import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

/**
 * レート制限エラー
 */
class TooManyRequestsError extends Error {
    remainingTime: number;

    constructor(resetTime: number) {
        const remainingSeconds = resetTime - Math.floor(Date.now() / 1000);
        const message = `レート制限に達しました。解除まで約${Math.ceil(remainingSeconds / 60)}分待ってください。`;
        super(message);
        this.name = 'TooManyRequestsError';
        this.remainingTime = remainingSeconds;
    }
}

/**
 * 認証エラー
 */
class AuthenticationError extends Error {
    constructor(message: string = '認証エラーが発生しました。Bearer Tokenが正しいか確認してください。') {
        super(message);
        this.name = 'AuthenticationError';  // 401用
    }
}

/**
 * 認可エラー
 */
class AuthorizationError extends Error {
    constructor(message: string = '権限エラーが発生しました。アカウントの状態やAPIの権限を確認してください。') {
        super(message);
        this.name = 'AuthorizationError';  // 403用
    }
}

/**
 * OAuth認証の設定
 */
interface OAuthConfig {
    apiKey: string;
    apiKeySecret: string;
    accessToken: string;
    accessTokenSecret: string;
}

/**
 * Bearer Token認証の設定
 */
interface BearerTokenConfig {
    bearerToken: string;
}

/**
 * 認証モード
 */
type AuthMode = 'oauth' | 'bearer';

/**
 * Twitter API v2クライアント
 */
export class TwiiterAPIv2Client {
    private readonly oAuthConfig: OAuthConfig;
    private readonly bearerToken: string;

    /**
     * Twitter API v2クライアントを初期化
     * @param oAuthConfig OAuth認証情報（書き込み操作用）
     * @param bearerConfig Bearer Token認証情報（読み取り操作用）
     */
    constructor(oAuthConfig: OAuthConfig, bearerConfig: BearerTokenConfig) {
        this.oAuthConfig = oAuthConfig;
        this.bearerToken = bearerConfig.bearerToken;
    }

    /**
     * Bearer Token認証ヘッダーを生成（読み取り操作用）
     */
    private getBearerHeader(): string {
        return `Bearer ${this.bearerToken}`;
    }

    /**
     * OAuth認証ヘッダーを生成（書き込み操作用）
     */
    private async generateOAuthHeader(method: string, url: string): Promise<string> {
        const oauth = new OAuth({
            consumer: { key: this.oAuthConfig.apiKey, secret: this.oAuthConfig.apiKeySecret },
            signature_method: 'HMAC-SHA1',
            hash_function(baseString, key) {
                return crypto
                    .createHmac('sha1', key)
                    .update(baseString)
                    .digest('base64');
            },
        });

        const authorization = oauth.authorize(
            {
                url,
                method,
            },
            {
                key: this.oAuthConfig.accessToken,
                secret: this.oAuthConfig.accessTokenSecret,
            }
        );

        return oauth.toHeader(authorization)['Authorization'];
    }

    private async checkResponse(response: Response) {
        const responseBody = await response.json(); // JSONとしてパース

        // レート制限に引っかかったらエラーを投げる
        if (response.status === 429) throw new TooManyRequestsError(parseInt(response.headers.get('x-rate-limit-reset') || '0'));

        // 認証エラー
        if (response.status === 401) throw new AuthenticationError(`認証エラーが発生しました。詳細: ${JSON.stringify(responseBody)}`);

        // 認可エラー
        if (response.status === 403) throw new AuthorizationError(`権限エラーが発生しました。詳細: ${JSON.stringify(responseBody)}`);

        // 成功時はパース済みのボディを返す
        return responseBody;
    }

    /**
     * 指定ユーザーに対して指定したツイートIDより新しいメンションを取得する（Bearer Token認証）
     * @param username ユーザー名(ex. 'RateteDev')
     * @param sinceId ツイートID(ex. '1892178130493944087')
     * @param allowedUsers 許可するユーザー名の配列(ex. ['RateteDev', 'AnotherUser'])
     * @returns APIのレスポンスボディ
     *
     * @see https://docs.x.com/x-api/posts/recent-search
     */
    public async searchRecentMentionsToUser(username: string, sinceId: string, allowedUsers: string[] = []) {
        // 許可ユーザーからのツイートのクエリを構築
        const fromQuery = allowedUsers.length > 0
            ? allowedUsers.map(user => `from:${user}`).join(' OR ')
            : '';

        // メンションと許可ユーザーのクエリを組み合わせ
        const query = allowedUsers.length > 0
            ? `(@${username}) (${fromQuery})`
            : `@${username}`;

        // リクエスト先のURLを作成
        const params = new URLSearchParams({
            'query': query,
            'since_id': sinceId,
            'tweet.fields': 'text,referenced_tweets,author_id,created_at',
            'expansions': 'referenced_tweets.id,author_id',
            'user.fields': 'username'
        });
        const url = `https://api.x.com/2/tweets/search/recent?${params.toString()}`;

        // リクエストオプションの設定（Bearer Token認証固定）
        const options = {
            method: 'GET',
            headers: {
                'Authorization': this.getBearerHeader(),
            },
        };

        // リクエストを投げる
        const response = await fetch(url, options);

        // レスポンスのチェックと同時にJSONを取得
        return await this.checkResponse(response);
    }

    /**
     * 指定されたツイートに対して返信を行う（OAuth認証）
     * @param tweetId ツイートのID
     * @param message 返信のメッセージ
     * @returns 返信のデータ
     *
     * @see https://docs.x.com/x-api/posts/creation-of-a-post
     */
    public async replyToTweet(tweetId: string, message: string) {
        // リクエスト先のURLを作成
        const url = 'https://api.x.com/2/tweets';

        // リクエストオプションの設定（OAuth認証固定）
        const authHeader = await this.generateOAuthHeader('POST', url);
        const options = {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: message,
                reply: {
                    in_reply_to_tweet_id: tweetId
                }
            })
        };

        // リクエストを投げる
        const response = await fetch(url, options);

        // レスポンスのチェックと同時にJSONを取得
        return await this.checkResponse(response);
    }

    /**
     * 指定された条件でツイートを検索する
     * @param query 検索クエリ
     * @returns APIのレスポンスボディ
     *
     * @see https://docs.x.com/x-api/posts/recent-search
     */
    public async searchTweets(query: string) {
        // クエリパラメータを設定
        const params = new URLSearchParams({
            'query': query,
            'tweet.fields': 'conversation_id,id,in_reply_to_user_id,referenced_tweets,context_annotations,created_at,text,author_id',
            'expansions': 'referenced_tweets.id,referenced_tweets.id.author_id,in_reply_to_user_id,author_id',
            'user.fields': 'username,name,verified,protected'
        });

        // リクエスト先のURLを作成
        const url = `https://api.x.com/2/tweets/search/recent?${params.toString()}`;

        // リクエストオプションの設定
        const authHeader = await this.generateOAuthHeader('GET', url);
        const options = {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
            },
        };

        // リクエストを投げる
        const response = await fetch(url, options);

        // レスポンスのチェックと同時にJSONを取得
        return await this.checkResponse(response);
    }
}
