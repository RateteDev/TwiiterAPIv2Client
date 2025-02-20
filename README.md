# twitter-ai-context

TwitterのコンテキストをAIエージェントのために最適化して提供するライブラリ。
リプライチェーンや会話の文脈を構造化し、AIが理解しやすい形式で提供します。

## 主な機能

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

## インストール

```bash
bun add twitter-ai-context
# or
npm install twitter-ai-context
```

## 使用例

```typescript
import { TwitterAIContext } from 'twitter-ai-context';

// クライアントの初期化
const client = new TwitterAIContext(
    {
        apiKey: 'YOUR_API_KEY',
        apiKeySecret: 'YOUR_API_KEY_SECRET',
        accessToken: 'YOUR_ACCESS_TOKEN',
        accessTokenSecret: 'YOUR_ACCESS_TOKEN_SECRET'
    },
    {
        bearerToken: 'YOUR_BEARER_TOKEN'
    }
);

// 構造化されたメンション情報の取得
const mentions = await client.getStructuredMentions('BotName', sinceId);

// AIエージェントへの入力例
const context = mentions[0].context?.replied_to?.text;
const query = mentions[0].mention.text;
const response = await aiAgent.chat(query, { context });

// 返信の送信
await client.replyToTweet(mentions[0].mention.id, response);
```

## レスポンス例

```typescript
// 構造化されたメンション情報
{
    "mention": {
        "id": "1892570591946797469",
        "text": "@RateteBOT テスト用、これのリプライ元のツイートでは何と言ってる？",
        "author": {
            "id": "1777178305877487616",
            "name": "Ratete",
            "username": "RateteDev"
        },
        "created_at": "2025-02-20T13:42:46.000Z"
    },
    "context": {
        "replied_to": {
            "id": "1891897335384318147",
            "text": "Claude振る舞いがめちゃくちゃ人間らしいよね\n他のモデルだとあんまりこういう反応しない",
            "author": {
                "id": "1777178305877487616",
                "name": "Ratete",
                "username": "RateteDev"
            },
            "created_at": "2025-02-18T17:07:29.000Z"
        },
        "conversation_id": "1891897335384318147"
    }
}
```

## 開発

```bash
# 依存関係のインストール
bun install

# テストの実行
bun test

# ビルド
bun run build
```

## ライセンス

MIT

## 作者

RateteDev
