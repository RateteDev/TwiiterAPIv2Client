import { describe, test, expect, beforeAll } from 'bun:test';
import { createClient, testTweetId } from '../setup';
import { TwiiterAPIv2Client } from '../../src/TwiiterAPIv2Client';

let client: TwiiterAPIv2Client;

beforeAll(() => {
    client = createClient();
});

describe('replyToTweet', () => {
    test('should post a reply to tweet', async () => {
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
