import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

/**
 * レート制限エラー
 */
export class TooManyRequestsError extends Error {
    remainingTime: number;

    constructor(resetTime: number) {
        const remainingSeconds = resetTime - Math.floor(Date.now() / 1000);
        const message = `Rate Limit Exceeded. Please wait for ${Math.ceil(remainingSeconds / 60)} minutes, ${Math.ceil(remainingSeconds % 60)} seconds.`;
        super(message);
        this.name = 'TooManyRequestsError';
        this.remainingTime = remainingSeconds;
    }
}

/**
 * 認証エラー
 * 401エラー
 */
export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

/**
 * 認可エラー
 * 403エラー
 */
export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

/**
 * ツイートの型定義
 */
export interface Tweet {
    id: string;
    text: string;
    author_id: string;
    created_at: string;
    referenced_tweets?: {
        type: string;
        id: string;
    }[];
    in_reply_to_user_id?: string;
    conversation_id?: string;
}

/**
 * ユーザーの型定義
 */
export interface User {
    id: string;
    username: string;
    name: string;
}

/**
 * メンション検索のレスポンス型
 */
export interface SearchResponse {
    data: Tweet[];
    includes?: {
        users: User[];
        tweets: Tweet[];
    };
    meta: {
        newest_id: string;
        oldest_id: string;
        result_count: number;
        next_token?: string;
    };
}

/**
 * リプライ投稿のレスポンス型
 */
export interface ReplyResponse {
    data: {
        id: string;
        text: string;
        edit_history_tweet_ids: string[];
    };
}

/**
 * OAuth認証の設定
 */
export interface OAuthConfig {
    apiKey: string;
    apiKeySecret: string;
    accessToken: string;
    accessTokenSecret: string;
}

/**
 * Bearer Token認証の設定
 */
export interface BearerTokenConfig {
    bearerToken: string;
}

/**
 * 認証モード
 */
export type AuthMode = 'oauth' | 'bearer';

/**
 * 構造化されたメンション情報
 */
export interface StructuredMention {
    mention: {
        id: string;
        text: string;
        author: User;
        created_at: string;
    };
    context?: {
        replied_to?: {
            id: string;
            text: string;
            author: User;
            created_at: string;
        };
        quoted?: {
            id: string;
            text: string;
            author: User;
            created_at: string;
        };
        conversation_id: string;
    };
}

/**
 * Twitter AIコンテキストプロバイダー
 * TwitterのコンテキストをAIエージェントのために最適化して提供するクラス
 */
export class TwitterAIContext {
    private readonly oAuthConfig: OAuthConfig;
    private readonly bearerToken: string;

    /**
     * Twitter AIコンテキストプロバイダーを初期化
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

    private async checkResponse(response: Response): Promise<any> {
        const responseBody = await response.json(); // JSONとしてパース

        // レート制限に引っかかったらエラーを投げる
        if (response.status === 429) throw new TooManyRequestsError(parseInt(response.headers.get('x-rate-limit-reset') || '0'));

        // 認証エラー
        if (response.status === 401) throw new AuthenticationError(`Authentication Error: ${JSON.stringify(responseBody)}`);

        // 認可エラー
        if (response.status === 403) throw new AuthorizationError(`Authorization Error: ${JSON.stringify(responseBody)}`);

        // 成功時はパース済みのボディを返す
        return responseBody;
    }

    private async searchRecentMentionsToUser(username: string, sinceId: string, allowedUsers: string[] = []): Promise<SearchResponse> {
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
            'tweet.fields': 'text,referenced_tweets,author_id,created_at,in_reply_to_user_id,conversation_id',
            'expansions': 'referenced_tweets.id,author_id,in_reply_to_user_id,referenced_tweets.id.author_id',
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
    public async replyToTweet(tweetId: string, message: string): Promise<ReplyResponse> {
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
     * 特定のユーザー宛てのメンション情報をフィルターして取得(Bearer Token認証)
     * @param username 宛先のユーザー名(ex. 'RateteOne')
     * @param sinceId ツイートID, これより新しいメンションが取得される
     * @param allowedUsers 許可するユーザー名の配列(ex. ['RateteSecond', 'RateteThird'])
     * @returns 構造化されたメンション情報の配列
     *
     * @see https://docs.x.com/x-api/posts/recent-search
     */
    public async getStructuredMentions(
        username: string,
        sinceId: string,
        allowedUsers: string[] = []
    ): Promise<StructuredMention[]> {
        const response = await this.searchRecentMentionsToUser(username, sinceId, allowedUsers);

        return response.data.map(tweet => {
            // ユーザー情報の取得
            const getUser = (userId: string): User => {
                const user = response.includes?.users.find(u => u.id === userId);
                if (!user) throw new Error(`User not found: ${userId}`);
                return user;
            };

            // ツイート情報の取得
            const getTweet = (tweetId: string) => {
                const referencedTweet = response.includes?.tweets.find(t => t.id === tweetId);
                if (!referencedTweet) throw new Error(`Tweet not found: ${tweetId}`);
                return referencedTweet;
            };

            // 基本的なメンション情報
            const structured: StructuredMention = {
                mention: {
                    id: tweet.id,
                    text: tweet.text,
                    author: getUser(tweet.author_id),
                    created_at: tweet.created_at
                }
            };

            // コンテキスト情報の追加
            if (tweet.conversation_id || tweet.referenced_tweets) {
                structured.context = {
                    conversation_id: tweet.conversation_id || tweet.id
                };

                // リプライ元の情報
                const replyTo = tweet.referenced_tweets?.find(ref => ref.type === 'replied_to');
                if (replyTo) {
                    const replyToTweet = getTweet(replyTo.id);
                    structured.context.replied_to = {
                        id: replyToTweet.id,
                        text: replyToTweet.text,
                        author: getUser(replyToTweet.author_id),
                        created_at: replyToTweet.created_at
                    };
                }

                // 引用元の情報
                const quote = tweet.referenced_tweets?.find(ref => ref.type === 'quoted');
                if (quote) {
                    const quotedTweet = getTweet(quote.id);
                    structured.context.quoted = {
                        id: quotedTweet.id,
                        text: quotedTweet.text,
                        author: getUser(quotedTweet.author_id),
                        created_at: quotedTweet.created_at
                    };
                }
            }

            return structured;
        });
    }
}
