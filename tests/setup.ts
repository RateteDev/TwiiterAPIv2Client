import { TwitterAIContext } from '../src/TwitterAIContext';

export function createClient(): TwitterAIContext {
    // check env
    if (!process.env.TWITTER_API_KEY) throw new Error('Not set TWITTER_API_KEY in env');
    if (!process.env.TWITTER_API_KEY_SECRET) throw new Error('Not set TWITTER_API_KEY_SECRET in env');
    if (!process.env.TWITTER_ACCESS_TOKEN) throw new Error('Not set TWITTER_ACCESS_TOKEN in env');
    if (!process.env.TWITTER_ACCESS_TOKEN_SECRET) throw new Error('Not set TWITTER_ACCESS_TOKEN_SECRET in env');
    if (!process.env.TWITTER_BEARER_TOKEN) throw new Error('Not set TWITTER_BEARER_TOKEN in env');

    // create client
    return new TwitterAIContext(
        // oAuthConfig
        {
            apiKey: process.env.TWITTER_API_KEY,
            apiKeySecret: process.env.TWITTER_API_KEY_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
        },
        // bearerTokenConfig
        {
            bearerToken: process.env.TWITTER_BEARER_TOKEN
        }
    );
}

export const testTweetId = '1892209493624422551';
export const mentionToUsername = 'RateteBOT';      // メンション先のユーザー（BOT）
export const mentionFromUsername = 'RateteDev';    // メンションを送信するユーザー
