# CLAUDE.md — 狂小說網・通勤文學速讀

## 專案簡介

**狂小說網**（MRTnovels）是一個以「通勤文學速讀」為主題的中文小說平台，讀者可在捷運通勤時間內讀完一篇故事。網站提供閱讀進度記錄、收藏、按讚、留言等功能，並以 Keystatic CMS 管理內容。

---

## 你的環境

| 項目 | 版本 / 服務 |
|---|---|
| Node.js | 22.x（`engines.node` 鎖定；20.x 已 EOL，且新版 supabase-js 需要 Node 22 的原生 WebSocket） |
| 套件管理 | npm（**不要用 yarn 或 pnpm**） |
| 框架 | Astro 5 SSR（`output: 'server'`） |
| 部署平台 | Vercel（`@astrojs/vercel`） |
| 認證 | Clerk（`@clerk/astro`） |
| 資料庫 | Supabase（`@supabase/supabase-js`） |
| CMS | Keystatic（`@keystatic/astro`，`@keystatic/core`） |
| UI 框架 | Tailwind CSS v3 + Preact（islands） |
| TypeScript | 全專案使用，`src/env.d.ts` 宣告環境變數型別 |

### 開發指令

```bash
npm run dev       # 本地開發 (localhost:4321)
npm run build     # 正式建置
npm run preview   # 預覽建置結果
```

### 環境變數（`.env`，參考 `.env.example`）

```
PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_SITE_URL=
# Keystatic GitHub 模式（正式環境）
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
KEYSTATIC_SECRET=
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=
```

---

## 專案架構

```
MRTnovels/
├── src/
│   ├── content/
│   │   ├── config.ts          # Zod schema 定義（stories collection）
│   │   └── stories/           # 所有故事 .md 檔（83 篇以上）
│   ├── lib/
│   │   ├── auth.ts            # getUserId() / requireAuth()
│   │   ├── supabase.ts        # supabase（service role）、supabaseAnon
│   │   └── tags.ts            # getTags() helper
│   ├── pages/
│   │   ├── index.astro        # 首頁（SSR + 客戶端 stats 注入）
│   │   ├── about.astro
│   │   ├── upload-story.astro
│   │   ├── api/               # API 路由
│   │   │   ├── bookmarks.ts
│   │   │   ├── comments.ts
│   │   │   ├── like.ts
│   │   │   ├── progress.ts
│   │   │   ├── stats.ts       # GET /api/stats?slugs=...（批次 stats）
│   │   │   ├── upload-story.ts
│   │   │   └── view.ts
│   │   ├── member/            # 會員頁面
│   │   │   ├── index.astro
│   │   │   ├── bookmarks.astro
│   │   │   ├── history.astro
│   │   │   ├── likes.astro
│   │   │   └── [slug].astro
│   │   └── stories/
│   │       ├── index.astro    # 故事目錄（依標籤分類）
│   │       └── [slug].astro   # 故事閱讀頁
│   ├── components/
│   │   ├── story/
│   │   │   └── StoryCard.astro
│   │   ├── reader/
│   │   ├── comments/
│   │   ├── member/
│   │   └── ui/
│   └── middleware.ts           # Clerk 認證 middleware
├── keystatic.config.ts         # Keystatic CMS 設定
├── astro.config.mjs
├── tailwind.config.mjs
└── .env.example
```

---

## 核心設計規範

### 1. 故事 Frontmatter 格式

```yaml
---
title: "故事標題"
publishDate: 2026-04-08
author: 站長
tags: [散文, 成長]          # 文體標籤（從 Keystatic 預設選項選）
themeTags: [社會, 財經]     # 主題標籤（從 Keystatic 預設選項選）
customTags: []              # 自訂標籤（自由輸入）
access: public              # public | member | paid
summary: "一句話摘要"
cover: https://picsum.photos/seed/slug-name/800/400
---
```

- `cover` 使用 `picsum.photos/seed/{slug}/{w}/{h}`，seed 固定為故事 slug
- Slug 命名規則：英文、數字、`-` 組成，無中文（由 Keystatic 產生）
- `publishDate` 格式：`YYYY-MM-DD`

### 2. 標籤系統

標籤分三個欄位，**統一透過 `getTags()` 合併使用**：

```ts
import { getTags } from '@/lib/tags';

const tags = getTags(story.data);
// 等於 [...tags, ...themeTags, ...customTags] 去重
```

**文體標籤（`tags`）可選值：**
散文、驚悚、推理、愛情、幽默、諷刺、青春、成長、科幻、奇幻

**主題標籤（`themeTags`）可選值：**
社會、職場、環保、財經、科技、政治、家庭、都市、歷史、心理

### 3. 認證模式（API 路由）

```ts
import { requireAuth, getUserId } from '@/lib/auth';

// 需要登入：
const userId = requireAuth(context); // 未登入自動 throw 401 Response

// 可選登入：
const userId = getUserId(context);   // 未登入回傳 null
```

### 4. Supabase 使用規則

- **`supabase`（service role）**：只在 API 路由（server-side）使用，繞過 RLS
- **`supabaseAnon`**：客戶端使用，受 RLS 保護

所有查詢使用**參數化 query**，不拼接字串。

```ts
import { supabase } from '@/lib/supabase';

const { data } = await supabase
  .from('story_stats')
  .select('views, likes')
  .eq('story_slug', storySlug)  // 參數化，非字串插值
  .single();
```

### 5. Slug 驗證（API 路由）

所有接受 `storySlug` 的 API 路由使用以下驗證，允許中文 slug：

```ts
if (!storySlug || storySlug.length > 200 || /[/\\.]/.test(storySlug)) {
  return new Response(JSON.stringify({ error: 'Invalid slug' }), { status: 400 });
}
```

### 6. 首頁效能架構

- 首頁 SSR **不查詢 Supabase stats**，改由客戶端 fetch `/api/stats?slugs=...` 批次注入
- 未登入用戶加 `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- Stats span 格式：`<span class="story-stats" data-slug={slug}></span>`

### 7. 安全規範

- **不刪除任何 debug endpoint**（已確認不存在）
- Redirect 驗證：只允許 `/` 開頭且非 `//` 開頭的相對路徑
- 上傳故事 API 的 `access` 欄位使用白名單：`['public', 'member', 'paid']`
- `publishDate` 使用 regex 驗證格式：`/^\d{4}-\d{2}-\d{2}$/`

---

## Supabase 資料表

| 資料表 | 主要欄位 |
|---|---|
| `story_stats` | `story_slug`, `views`, `likes` |
| `reading_progress` | `user_id`, `story_slug`, `pct`, `updated_at` |
| `bookmarks` | `user_id`, `story_slug`, `created_at` |
| `likes` | `user_id`, `story_slug` |
| `comments` | `id`, `user_id`, `story_slug`, `body`, `created_at` |

Supabase Functions（RPC）：
- `increment_story_views({ slug })` — 累加 views
- `increment_likes({ slug })` / `decrement_likes({ slug })` — 累加/減 likes
- 「讀完」定義：`pct >= 70`

---

## Git 規範

- **開發分支**：`claude/novel-sharing-platform-9JS9N`
- **不可** push 到 `main`
- Commit message 使用英文，格式：`Add story: 標題` / `Fix: 問題描述` / `Update: 功能描述`
- Push 指令：`git push -u origin claude/novel-sharing-platform-9JS9N`

---

## Keystatic CMS

- 本地開發：`http://localhost:4321/keystatic`（local storage 模式）
- 正式環境：GitHub 模式（需設定 `KEYSTATIC_GITHUB_*` 環境變數）
- 設定檔：`keystatic.config.ts`
- Story slug 由 Keystatic 自動產生（使用標題中文轉拼音或手動輸入）

---

## 常見問題

**Q: 新增故事文體標籤 / 主題標籤選項**
→ 修改 `keystatic.config.ts` 中的 `TAG_OPTIONS_GENRE` 或 `TAG_OPTIONS_THEME`，同時更新 `src/content/config.ts` 中的 Zod schema（若要嚴格驗證）。

**Q: 故事 build 時 "Field validation failed: tags"**
→ 故事 frontmatter 的 `tags` 值必須符合 Keystatic 定義的選項。主題類標籤放 `themeTags`，不要放 `tags`。

**Q: API 路由回傳 400 "Invalid slug"**
→ Slug 不可包含 `/`、`\`、`.`，且長度不超過 200 字元。中文 slug 允許。

**Q: 首頁 stats 沒有顯示**
→ 確認 `StoryCard.astro` 有輸出 `<span class="story-stats" data-slug={slug}>`，首頁 client-side script 會自動填入。
