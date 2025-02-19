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
 *
 */
export class TwiiterAPIv2Client {
    private apiKey: string;
    private apiKeySecret: string;
    private accessToken: string;
    private accessTokenSecret: string;

    constructor(apiKey: string, apiKeySecret: string, accessToken: string, accessTokenSecret: string) {
        this.apiKey = apiKey;
        this.apiKeySecret = apiKeySecret;
        this.accessToken = accessToken;
        this.accessTokenSecret = accessTokenSecret;
    }

    private async checkResponse(response: Response) {
        const responseBody = await response.text(); // レスポンスボディを取得

        // レート制限に引っかかったらエラーを投げる
        if (response.status === 429) throw new TooManyRequestsError(parseInt(response.headers.get('x-rate-limit-reset') || '0'));

        // 認証エラー
        if (response.status === 401) throw new AuthenticationError(`認証エラーが発生しました。詳細: ${responseBody}`);

        // 認可エラー
        if (response.status === 403) throw new AuthorizationError(`権限エラーが発生しました。詳細: ${responseBody}`);
    }

    private async generateOAuthHeader(method: string, url: string): Promise<string> {
        const oauth = new OAuth({
            consumer: { key: this.apiKey, secret: this.apiKeySecret },
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
                key: this.accessToken,
                secret: this.accessTokenSecret,
            }
        );

        return oauth.toHeader(authorization)['Authorization'];
    }

    /**
     * 指定ユーザーに対して指定したツイートIDより新しいメンションを取得する
     * @param username ユーザー名(ex. 'RateteDev')
     * @param sinceId ツイートID(ex. '1892178130493944087')
     * @returns APIのレスポンスボディ
     *
     * @see https://docs.x.com/x-api/posts/recent-search
     */
    public async searchRecentMentionsToUser(username: string, sinceId: string) {
        // リクエスト先のURLを作成
        const query = encodeURIComponent(`@${username}`);
        const url = `https://api.x.com/2/tweets/search/recent?query=${query}&since_id=${sinceId}`;
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

        // レスポンスのチェック
        await this.checkResponse(response);

        // 成功時
        const data = await response.json();
        return data;
    }

    /**
     * 指定されたツイートに対して返信を行う
     * @param tweetId ツイートのID
     * @param message 返信のメッセージ
     * @returns 返信のデータ
     *
     * @see https://docs.x.com/x-api/posts/creation-of-a-post
     */
    public async replyToTweet(tweetId: string, message: string) {
        // リクエスト先のURLを作成
        const url = 'https://api.x.com/2/tweets';
        // リクエストオプションの設定
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

        // レスポンスのチェック
        await this.checkResponse(response);

        // 成功時
        return await response.json();
    }
}
