# 🐦 TwiiterAPIv2Client

Twitter API v2のシンプルなTypeScriptクライアント実装です。

## 🚀 特徴

- TypeScript/JavaScript両対応
- OAuth 1.0a認証サポート
- シンプルなAPI
- bunランタイム対応

## 📦 インストール

```bash
bun add github:RateteDev/TwiiterAPIv2Client
```

## 🔧 使い方

### クライアントの初期化

```typescript
import TwiiterAPIv2Client from 'twiiter-api-v2-client';

const client = new TwiiterAPIv2Client(
    process.env.API_KEY,
    process.env.API_KEY_SECRET,
    process.env.ACCESS_TOKEN,
    process.env.ACCESS_TOKEN_SECRET
);
```

### メンションの取得

```typescript
// 指定したツイートID以降のメンションを取得
const mentions = await client.searchRecentMentionsToUser('username', 'tweetId');
console.log(mentions);
```

### ツイートへの返信

```typescript
// 指定したツイートに返信
const reply = await client.replyToTweet('tweetId', '返信メッセージ');
console.log(reply);
```

## ⚠️ エラーハンドリング

クライアントは以下の種類のエラーをスローします：

- `TooManyRequestsError`: レート制限に達した場合
- `AuthenticationError`: 認証エラー（401）
- `AuthorizationError`: 認可エラー（403）

## 📝 ライセンス

MITライセンスで提供されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。
