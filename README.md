# 🤖 twitter-ai-context

TwitterのコンテキストをAIエージェントのために最適化して提供するライブラリ。
リプライチェーンや会話の文脈を構造化し、AIが理解しやすい形式で提供します。

## 🎯 主な機能

1. コンテキストの構造化
   - リプライチェーンの自動追跡
   - 会話の文脈を階層的に整理
   - 関連ユーザー情報の統合

2. AI最適化
   - 文脈を失わない情報構造
   - 必要な情報のみを効率的に抽出
   - 一貫した型定義による安全性

3. 効率的なAPI利用
   - レート制限を考慮した設計
   - 必要最小限のAPI呼び出し
   - キャッシュ機構の活用

## 📦 インストール

```bash
bun add twitter-ai-context
# or
npm install twitter-ai-context
```

## 💡 使用例

```typescript
import { TwitterAIContext } from 'twitter-ai-context';

// クライアントの初期化
const client = new TwitterAIContext(
    {
        apiKey: 'API_KEY_XXXXX',
        apiKeySecret: 'API_KEY_SECRET_XXXXX',
        accessToken: 'ACCESS_TOKEN_XXXXX',
        accessTokenSecret: 'ACCESS_TOKEN_SECRET_XXXXX'
    },
    {
        bearerToken: 'BEARER_TOKEN_XXXXX'
    }
);

// 構造化されたメンション情報の取得
const mentions = await client.getStructuredMentions('AssistantBot', '123456789');

// AIエージェントへの入力例
const context = mentions[0].context?.replied_to?.text;
const query = mentions[0].mention.text;
const response = await aiAgent.chat(query, { context });

// 返信の送信
await client.replyToTweet(mentions[0].mention.id, response);
```

## 📝 レスポンス例

```typescript
// 構造化されたメンション情報
{
    "mention": {
        "id": "123456789012345678",
        "text": "@AssistantBot こんにちは！前回の会話の続きをお願いします。",
        "author": {
            "id": "987654321098765432",
            "name": "Example User",
            "username": "example_user"
        },
        "created_at": "2025-01-01T12:00:00.000Z"
    },
    "context": {
        "replied_to": {
            "id": "123456789012345677",
            "text": "今日は素晴らしい天気ですね。散歩に行きませんか？",
            "author": {
                "id": "987654321098765432",
                "name": "Example User",
                "username": "example_user"
            },
            "created_at": "2025-01-01T11:55:00.000Z"
        },
        "conversation_id": "123456789012345677"
    }
}
```

## 🛠️ 開発

```bash
# 依存関係のインストール
bun install

# テストの実行
bun test

# ビルド
bun run build
```

## 📄 ライセンス

MIT

## 👤 作者

Ratete ([@RateteDev](https://twitter.com/RateteDev) / [GitHub](https://github.com/RateteDev))
