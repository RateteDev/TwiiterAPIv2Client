import { describe, test, expect, beforeAll } from 'bun:test';
import { createClient, testTweetId, mentionToUsername, mentionFromUsername } from '../setup';
import { TwiiterAPIv2Client } from '../../src/TwiiterAPIv2Client';

let client: TwiiterAPIv2Client;

beforeAll(() => {
    client = createClient();
});

describe('getStructuredMentions', () => {
    test('should fetch mentions with structured format', async () => {
        const mentions = await client.getStructuredMentions(
            mentionToUsername,
            testTweetId,
            [mentionFromUsername]
        );

        // write log file
        Bun.write(`logs/structured_mentions.json/${new Date().toISOString()}.json`, JSON.stringify(mentions, null, 4));

        // verify array structure
        expect(Array.isArray(mentions)).toBe(true);
        expect(mentions.length).toBeGreaterThan(0);

        // verify mention structure
        const mention = mentions[0];
        expect(mention.mention).toBeDefined();
        expect(mention.mention.id).toBeDefined();
        expect(mention.mention.text).toBeDefined();
        expect(mention.mention.author).toBeDefined();
        expect(mention.mention.created_at).toBeDefined();

        // verify author structure
        expect(mention.mention.author.id).toBeDefined();
        expect(mention.mention.author.username).toBeDefined();
        expect(mention.mention.author.name).toBeDefined();

        // verify context structure if exists
        if (mention.context) {
            expect(mention.context.conversation_id).toBeDefined();

            // verify replied_to if exists
            if (mention.context.replied_to) {
                expect(mention.context.replied_to.id).toBeDefined();
                expect(mention.context.replied_to.text).toBeDefined();
                expect(mention.context.replied_to.author).toBeDefined();
                expect(mention.context.replied_to.created_at).toBeDefined();
            }

            // verify quoted if exists
            if (mention.context.quoted) {
                expect(mention.context.quoted.id).toBeDefined();
                expect(mention.context.quoted.text).toBeDefined();
                expect(mention.context.quoted.author).toBeDefined();
                expect(mention.context.quoted.created_at).toBeDefined();
            }
        }
    });
});
