import { describe, test, expect, beforeAll } from 'bun:test';
import { TwiiterAPIv2Client } from '../src/TwiiterAPIv2Client';

let client: TwiiterAPIv2Client;
const testTweetId = '1892209493624422551';
const mentionToUsername = 'RateteBOT';      // メンション先のユーザー（BOT）
const mentionFromUsername = 'RateteDev';    // メンションを送信するユーザー

// setup client
beforeAll(() => {
    // check env
    if (!process.env.TWITTER_API_KEY) throw new Error('Not set TWITTER_API_KEY in env');
    if (!process.env.TWITTER_API_KEY_SECRET) throw new Error('Not set TWITTER_API_KEY_SECRET in env');
    if (!process.env.TWITTER_ACCESS_TOKEN) throw new Error('Not set TWITTER_ACCESS_TOKEN in env');
    if (!process.env.TWITTER_ACCESS_TOKEN_SECRET) throw new Error('Not set TWITTER_ACCESS_TOKEN_SECRET in env');
    if (!process.env.TWITTER_BEARER_TOKEN) throw new Error('Not set TWITTER_BEARER_TOKEN in env');

    // create client
    client = new TwiiterAPIv2Client(
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
});

// test
describe('Twitter API Client', () => {
    test('searchRecentMentionsToUser', async () => {
        /**
         * Get mentions to RateteBOT
         * Conditions:
         * 1. From RateteDev
         * 2. Posted after Tweet(ID:1892178130493944087)
         */
        const mentions = await client.searchRecentMentionsToUser(
            mentionToUsername,
            testTweetId,
            [mentionFromUsername]
        );

        // write log file
        Bun.write(`logs/mentions.json/${new Date().toISOString()}.json`, JSON.stringify(mentions, null, 4));

        // verify response structure
        expect(mentions).toBeDefined();
        expect(mentions.data).toBeDefined();
        expect(Array.isArray(mentions.data)).toBe(true);

        // verify data content
        if (mentions.data && mentions.data.length > 0) {
            const tweet = mentions.data[0];
            expect(tweet.id).toBeDefined();
            expect(tweet.text).toBeDefined();
            expect(tweet.author_id).toBeDefined();
            expect(tweet.created_at).toBeDefined();
        }

        // includesの構造を検証
        if (mentions.includes?.users) {
            expect(Array.isArray(mentions.includes.users)).toBe(true);
            if (mentions.includes.users.length > 0) {
                const user = mentions.includes.users[0];
                expect(user.id).toBeDefined();
                expect(user.username).toBeDefined();
            }
        }
    });

    test('replyToTweet', async () => {
        const timestamp = new Date().toISOString();
        const reply = await client.replyToTweet(
            testTweetId,
            `Test reply\n(${timestamp})`
        );

        // write log file
        Bun.write(`logs/reply.json/${new Date().toISOString()}.json`, JSON.stringify(reply, null, 4));

        // verify response structure
        expect(reply).toBeDefined();
        expect(reply.data).toBeDefined();
        expect(reply.data.id).toBeDefined();
        expect(reply.data.text).toBeDefined();
        expect(reply.data.edit_history_tweet_ids).toBeDefined();
        expect(Array.isArray(reply.data.edit_history_tweet_ids)).toBe(true);
    });
});
