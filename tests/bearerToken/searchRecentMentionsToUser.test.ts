import { describe, test, expect, beforeAll } from 'bun:test';
import { createClient, testTweetId, mentionToUsername, mentionFromUsername } from '../setup';
import { TwiiterAPIv2Client } from '../../src/TwiiterAPIv2Client';

let client: TwiiterAPIv2Client;

beforeAll(() => {
    client = createClient();
});

describe('searchRecentMentionsToUser', () => {
    test('should fetch mentions with raw response format', async () => {
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
            expect(tweet.in_reply_to_user_id).toBeDefined();
            expect(tweet.conversation_id).toBeDefined();
        }

        // verify includes structure
        if (mentions.includes?.users) {
            expect(Array.isArray(mentions.includes.users)).toBe(true);
            if (mentions.includes.users.length > 0) {
                const user = mentions.includes.users[0];
                expect(user.id).toBeDefined();
                expect(user.username).toBeDefined();
            }
        }

        // verify referenced tweets
        if (mentions.includes?.tweets) {
            expect(Array.isArray(mentions.includes.tweets)).toBe(true);
            if (mentions.includes.tweets.length > 0) {
                const referencedTweet = mentions.includes.tweets[0];
                expect(referencedTweet.id).toBeDefined();
                expect(referencedTweet.text).toBeDefined();
            }
        }
    });
});
