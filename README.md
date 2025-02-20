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

### Clientの作成
```typescript
import { TwitterAIContext, type OAuthConfig, type BearerTokenConfig } from 'twitter-ai-context';

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_KEY_SECRET = process.env.TWITTER_API_KEY_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// 認証情報の型定義
const oAuthConfig = {
    apiKey: TWITTER_API_KEY,
    apiKeySecret: TWITTER_API_KEY_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessTokenSecret: TWITTER_ACCESS_TOKEN_SECRET
} satisfies OAuthConfig;

const bearerConfig = {
    bearerToken: TWITTER_BEARER_TOKEN
} satisfies BearerTokenConfig;

// クライアントの初期化
const client = new TwitterAIContext(oAuthConfig, bearerConfig);
```

### メンションの取得
```typescript
/**
 * 特定のユーザー宛てのメンション情報をフィルターして取得(Bearer Token認証)
 * @param username 宛先のユーザー名(ex. 'RateteOne')
 * @param sinceId ツイートID, これより新しいメンションが取得される
 * @param allowedUsers 許可するユーザー名の配列(ex. ['RateteSecond', 'RateteThird'])
 * @returns 構造化されたメンション情報の配列
 *
 * @see https://docs.x.com/x-api/posts/recent-search
 */
const mentions = await client.getStructuredMentions(
    'RateteOne',           // 宛先のユーザー名
    '123456789012345678',  // 取得開始するツイートID
    ['RateteSecond', 'RateteThird']       // 許可する送信元ユーザーの配列（省略可能）
);
```

### 返信
```typescript
/**
 * 指定されたツイートに対して返信を行う（OAuth認証）
 * @param tweetId ツイートのID
 * @param message 返信のメッセージ
 * @returns 返信のデータ
 *
 * @see https://docs.x.com/x-api/posts/creation-of-a-post
 */
await client.replyToTweet("123456789012345678", "こんにちは！");
```

## ⚠️ 注意事項

- Twitter APIの無料枠の場合、15分ごとに検索回数の制限があります
- 制限に達した場合、`TooManyRequestsError`が発生し、制限解除までの残り時間が表示されます

## 🚨 エラーハンドリング

```typescript
// レート制限エラーの型定義
interface TooManyRequestsError extends Error {
    remainingTime: number;  // 制限解除までの残り時間（秒）
}

// エラー出力例
TooManyRequestsError: Rate Limit Exceeded. Please wait for 10 minutes, 37 seconds.
remainingTime: 577
```

## 📝 レスポンス例

```typescript
// 構造化されたメンション情報
{
    "mention": {
        "id": "123456789012345678",
        "text": "@RateteOne このライブの予定をカレンダーに追加しておいて！",
        "author": {
            "id": "987654321098765432",
            "name": "RateteSecond",
            "username": "RateteSecond"
        },
        "created_at": "2025-01-01T12:00:00.000Z"
    },
    "context": {
        "replied_to": {
            "id": "123456789012345677",
            "text": "🎸 Crimson Whispers 初ワンマンライブ決定！\n\n📅 2025年3月15日(土)\n🕒 開場18:00 / 開演18:30\n🏟️ Starlight Hall\n\n🎟️ チケット情報\n前売り：¥4,500\n当日：¥5,000\n\n✨ 特典：限定ポスター付き\n\n予約開始：2025年1月15日10:00〜\n#CrystalEchoes #ライブ告知",
            "author": {
                "id": "987654321098765432",
                "name": "RateteSecond",
                "username": "RateteSecond"
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
