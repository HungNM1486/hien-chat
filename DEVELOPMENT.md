# Hiên nhà — Kế hoạch phát triển từng bước (Web UI · Mobile-first)

> Tài liệu hướng dẫn triển khai chi tiết. Đọc kèm [`BRAINSTORM.md`](./BRAINSTORM.md).
>
> **Quyết định đã chốt:** Phát triển bằng **Web UI**, tối ưu trải nghiệm **điện thoại** (mobile-first), có thể cài như app qua PWA.

---

## Trạng thái sản phẩm (cập nhật 06/2026)

| Phase | Mục tiêu | Trạng thái |
|---|---|---|
| **0** | Monorepo, auth, app shell | ✅ Hoàn thành |
| **1** | Chat 1-1 realtime, read receipts | ✅ Hoàn thành |
| **2** | Theme engine, settings, UX polish | ✅ Hoàn thành (UI refresh *Hiên đêm*) |
| **3** | Nhóm, ảnh, voice, reply, reaction, invite | ✅ Hoàn thành |
| **4** | E2E opt-in 1-1, backup khóa | 🟡 Đang có (crypto package + UI setup) |
| **5** | PWA production, push, deploy | ⬜ Chưa (manifest + offline page có; SW đang tắt dev) |
| **6** | Video call, tính năng gia đình | ⬜ Chưa |

**Stack thực tế:** Next.js 16 · React 19 · Tailwind v4 · Fastify · Drizzle · Zustand · `@phosphor-icons/react` · `@hien-nha/theme` · `@hien-nha/crypto`.

**Theme mặc định:** `midnight` (*Hiên đêm*) — `#12100E` nền, `#C8715A` accent terracotta (không còn palette GitHub clone).

---

## Mục lục

1. [Tổng quan & nguyên tắc](#1-tổng-quan--nguyên-tắc)
2. [Trạng thái sản phẩm](#trạng-thái-sản-phẩm-cập-nhật-062026)
3. [Tech stack cố định](#2-tech-stack-cố-định)
4. [Cấu trúc monorepo](#3-cấu-trúc-monorepo)
5. [Mobile-first UI — quy chuẩn bắt buộc](#4-mobile-first-ui--quy-chuẩn-bắt-buộc)
5. [Phase 0 — Nền tảng (Tuần 1–2)](#phase-0--nền-tảng-tuần-12)
6. [Phase 1 — MVP Chat (Tuần 3–5)](#phase-1--mvp-chat-tuần-35)
7. [Phase 2 — Theme & UX (Tuần 6–7)](#phase-2--theme--ux-tuần-67)
8. [Phase 3 — Nhóm & Media (Tuần 8–10)](#phase-3--nhóm--media-tuần-810)
9. [Phase 4 — E2E opt-in (Tuần 11–14)](#phase-4--e2e-opt-in-tuần-1114)
10. [Phase 5 — PWA & Production (Tuần 15–16)](#phase-5--pwa--production-tuần-1516)
11. [Phase 6 — Nâng cao (sau launch)](#phase-6--nâng-cao-sau-launch)
12. [API & WebSocket reference](#12-api--websocket-reference)
13. [Checklist trước khi ship](#13-checklist-trước-khi-ship)

---

## 1. Tổng quan & nguyên tắc

### 1.1. Mục tiêu sản phẩm (MVP web)

| Mục tiêu | Mô tả |
|---|---|
| Chat 1-1 realtime | Gửi/nhận tin text, typing, online status |
| Mobile-first | UI thiết kế cho màn 375–430px, scale lên tablet/desktop |
| Theme | ≥5 theme built-in, đổi global + per-conversation |
| E2E opt-in | Bật theo từng cuộc hội thoại, không mặc định |
| PWA | Add to Home Screen, offline shell, push (sau) |
| Self-host | Docker Compose chạy trên VPS/homelab |

### 1.2. Nguyên tắc phát triển

1. **Mobile trước, desktop sau** — mọi component viết cho điện thoại trước; breakpoint `md:` chỉ mở rộng layout.
2. **Ship từng phase** — mỗi phase có demo chạy được, không chờ hoàn thiện hết.
3. **Standard mode trước E2E** — crypto chỉ bắt đầu Phase 4 khi chat cơ bản ổn định.
4. **Không tự viết crypto** — dùng `@signalapp/libsignal-client` hoặc `@privacyresearch/libsignal-protocol-typescript`.
5. **Tiếng Việt mặc định** — i18n sẵn sàng cho English sau.

### 1.3. Timeline tổng thể

```
Tuần  1–2   Phase 0   Scaffold + Auth + Shell UI
Tuần  3–5   Phase 1   Chat 1-1 realtime
Tuần  6–7   Phase 2   Theme engine + Settings
Tuần  8–10  Phase 3   Nhóm + Ảnh + Voice
Tuần 11–14  Phase 4   E2E per-conversation
Tuần 15–16  Phase 5   PWA + Deploy production
Sau đó      Phase 6   Video call, tính năng gia đình...
```

---

## 2. Tech stack cố định

### 2.1. Frontend (Web · Mobile-first)

| Thành phần | Công nghệ | Lý do |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR nhẹ, routing, API routes proxy |
| UI | **React 19** + **TypeScript** | Type-safe, ecosystem lớn |
| Styling | **Tailwind CSS v4** | Utility-first, CSS variables theme |
| Component | Custom (`components/ui/*`) | BottomSheet, IconButton, UserAvatar |
| Icons | **@phosphor-icons/react** | Nhất quán, thay emoji |
| Font | **Geist Sans + Geist Mono** (`next/font`) | Body + timestamp/badge |
| State | **Zustand** | UI + chat store |
| Realtime client | Native **WebSocket** hook | Kiểm soát reconnect/backoff |
| Form | **React Hook Form** + **Zod** | Validation auth/settings |
| i18n | **next-intl** | Việt + EN sau |
| Virtual list | **@tanstack/react-virtual** | Scroll mượt với nhiều tin |
| PWA | **Serwist** (hoặc `@ducanh2912/next-pwa`) | Service worker Next.js |
| E2E crypto | **@signalapp/libsignal-client** | Chuẩn Signal trên web |

### 2.2. Backend

| Thành phần | Công nghệ | Lý do |
|---|---|---|
| Runtime | **Node.js 22** + **Fastify** | WebSocket native, nhanh |
| ORM | **Drizzle ORM** | Type-safe, migration rõ |
| DB | **PostgreSQL 16** | Relational, JSONB cho settings |
| Cache/PubSub | **Redis 7** | Online status, WS fan-out |
| Media | **MinIO** (S3-compatible) | Self-host ảnh/file |
| Auth | **JWT** (access) + **httpOnly cookie** (refresh) | Bảo mật web |
| Realtime | **WebSocket** (`@fastify/websocket`) | Chat events |
| Validation | **Zod** (shared với frontend) | Single source of truth |

### 2.3. DevOps

| Thành phần | Công nghệ |
|---|---|
| Monorepo | **pnpm workspaces** + **Turborepo** |
| Container | **Docker Compose** |
| CI | GitHub Actions (lint, test, build) |
| Reverse proxy | **Caddy** hoặc **Nginx** (TLS auto) |

---

## 3. Cấu trúc monorepo

```
hien-nha/
├── apps/
│   ├── web/                    # Next.js — UI chính (mobile-first)
│   │   ├── app/
│   │   │   ├── (auth)/         # login, register, invite
│   │   │   ├── (app)/          # chat shell (protected)
│   │   │   │   ├── chats/
│   │   │   │   ├── chats/[id]/
│   │   │   │   └── settings/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── chat/           # MessageList, Composer, Bubble...
│   │   │   ├── layout/         # AppShell, BottomNav, SafeArea
│   │   │   ├── theme/          # ThemeProvider, ThemePicker
│   │   │   └── ui/             # BottomSheet, IconButton, toast...
│   │   ├── hooks/              # useWebSocket, useChat, useTheme
│   │   ├── stores/             # zustand stores
│   │   ├── lib/                # api client, crypto wrapper
│   │   └── public/
│   │       ├── manifest.json
│   │       └── icons/
│   └── server/                 # Fastify API + WebSocket
│       ├── src/
│       │   ├── routes/
│       │   ├── ws/
│       │   ├── services/
│       │   └── db/
│       └── drizzle/
├── packages/
│   ├── shared/                 # Zod schemas, types, constants
│   ├── theme/                  # Design tokens, theme presets
│   └── crypto/                 # E2E wrapper (Phase 4)
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── Caddyfile
├── docs/
│   ├── BRAINSTORM.md
│   └── DEVELOPMENT.md          # file này
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 4. Mobile-first UI — quy chuẩn bắt buộc

> Mọi bước UI trong các Phase dưới đây **phải tuân thủ** section này.

### 4.1. Viewport & layout

```html
<!-- apps/web/app/layout.tsx -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="theme-color" content="var(--color-background)" />
```

| Quy tắc | Giá trị |
|---|---|
| Design width chuẩn | **390px** (iPhone 14) |
| Min touch target | **44×44px** (Apple HIG) |
| Safe area | `env(safe-area-inset-*)` cho notch/home bar |
| Max content width (desktop) | `480px` centered — giữ cảm giác “app điện thoại” |
| Font size body | **16px** minimum (tránh zoom iOS khi focus input) |
| Bottom nav / composer | Fixed bottom + `padding-bottom: env(safe-area-inset-bottom)` |

### 4.2. Layout pattern — “App shell”

```
┌─────────────────────────────┐  ← Status bar (safe-area-top)
│  Header (56px, sticky)    │
├─────────────────────────────┤
│                             │
│  Scrollable content         │  ← flex-1 overflow-y-auto
│  (chat list / messages)     │
│                             │
├─────────────────────────────┤
│  Composer / Bottom nav      │  ← safe-area-bottom
└─────────────────────────────┘
```

**Navigation mobile:**
- Danh sách chat: full screen
- Vào cuộc chat: slide-in từ phải (native feel), nút back ←
- Settings: sheet từ dưới lên (bottom sheet) hoặc push route

**Desktop (`md:` breakpoint ≥768px):**
- Split view: sidebar 320px (chat list) + main (active chat)
- Không dùng bottom nav — sidebar thay thế

### 4.3. Touch & gesture

| Gesture | Hành vi |
|---|---|
| Tap | Mở chat, gửi tin, reaction |
| Long press | Context menu tin nhắn (reply, copy, delete) |
| Swipe right (từ cạnh trái) | Back về danh sách chat |
| Pull down | Refresh danh sách chat |
| Pull up (composer) | Mở attachment picker |

- Dùng `touch-action: manipulation` — tắt delay 300ms
- `-webkit-tap-highlight-color: transparent`
- Haptic: `navigator.vibrate(10)` khi gửi tin (nếu supported)

### 4.4. Performance mobile

- Virtualize message list (`@tanstack/react-virtual`)
- Ảnh: lazy load, `loading="lazy"`, thumbnail trước full-res
- WebSocket: reconnect exponential backoff (1s → 2s → 4s → max 30s)
- Không block main thread khi decrypt E2E — dùng Web Worker (Phase 4)
- Lighthouse mobile target: **Performance ≥85**, **Accessibility ≥90**

### 4.5. CSS tokens (mobile)

```css
/* apps/web/app/globals.css — rút gọn */
:root {
  --background: #12100e;
  --surface: #1c1916;
  --surface-elevated: color-mix(in srgb, var(--surface) 88%, var(--foreground));
  --primary: #c8715a;
  --bubble-sent: #a85d42;
  --bubble-received: #2a2620;
  --shadow-color: 18 14 10;

  --header-height: 56px;
  --composer-min-height: 44px;
  --bottom-nav-height: 64px;
  --touch-target: 44px;
  --radius-bubble: 20px;
  --font-size-base: 16px;
}
```

Theme presets ghi đè các biến trên qua `packages/theme` → `applyThemeToElement()`.

### 4.6. Ngôn ngữ thị giác Hiên nhà

> Áp dụng từ UI refresh 06/2026. Mọi màn mới **phải** dùng pattern dưới đây thay emoji / flat box cũ.

| Thành phần | Quy tắc |
|---|---|
| **Palette** | Một accent terracotta (`--primary`); nền charcoal ấm; tránh clone GitHub/Microsoft |
| **Surfaces** | `.glass-panel` — blur + inner highlight; sheet/modal dùng `BottomSheet` |
| **Avatar** | Squircle (`rounded-[18px]`), gradient ring; component `UserAvatar` |
| **Bubble** | `.bubble-sent` gradient + `.bubble-received` border mờ; group tin liên tiếp, tail góc |
| **Icon** | Phosphor only; `IconButton` với variant ghost/soft/primary |
| **Form** | `.input-field`, `.btn-primary` / `.btn-secondary` / `.btn-danger` |
| **Motion** | `.pressable` scale 0.96; `prefers-reduced-motion` tôn trọng |
| **Grain** | Overlay noise cố định trên `body::before` (pointer-events: none) |

**Component tái sử dụng:**

- `components/ui/bottom-sheet.tsx`
- `components/ui/icon-button.tsx`
- `components/ui/user-avatar.tsx`
- `components/ui/toast-container.tsx`

**Không dùng:** emoji làm icon UI, `✕` text làm nút đóng, card phẳng không shadow trên sheet.

---

## Phase 0 — Nền tảng (Tuần 1–2)

> **Mục tiêu:** Monorepo chạy được, auth cơ bản, app shell mobile trống.

### Bước 0.1 — Khởi tạo monorepo

**Việc cần làm:**

- [ ] `pnpm init` + `pnpm-workspace.yaml`
- [ ] Cài Turborepo: `turbo.json` với tasks `dev`, `build`, `lint`
- [ ] Tạo `apps/web` — `pnpm create next-app` (App Router, TS, Tailwind, ESLint)
- [ ] Tạo `apps/server` — Fastify + TS (`tsx` dev)
- [ ] Tạo `packages/shared` — export types/schemas
- [ ] Root scripts: `"dev": "turbo dev"`, `"build": "turbo build"`

**Deliverables:**
- `pnpm dev` chạy đồng thời web (:3000) + server (:4000)

**Tiêu chí hoàn thành:**
- [ ] Hot reload cả hai app
- [ ] Shared package import được từ web và server

---

### Bước 0.2 — Docker dev environment

**Việc cần làm:**

- [ ] `docker/docker-compose.dev.yml`:
  - PostgreSQL (port 5432)
  - Redis (port 6379)
  - MinIO (port 9000, console 9001)
- [ ] `.env.example` với tất cả biến môi trường
- [ ] Script `pnpm db:up` / `pnpm db:down`

**Deliverables:**
- `docker-compose.dev.yml`
- `.env.example`

**Tiêu chí hoàn thành:**
- [ ] `docker compose up -d` → PG + Redis + MinIO healthy

---

### Bước 0.3 — Database schema & migrations

**Việc cần làm:**

- [ ] Cài Drizzle trong `apps/server`
- [ ] Schema bảng Phase 0:

```typescript
// users
id            uuid PK
email         varchar unique
password_hash varchar nullable  // hoặc chỉ magic link
display_name  varchar
avatar_url    varchar nullable
settings      jsonb default '{}'  // theme, locale, fontSize
created_at    timestamp

// sessions / refresh_tokens
id            uuid PK
user_id       uuid FK
token_hash    varchar
expires_at    timestamp
device_info   jsonb

// conversations (schema sớm, dùng Phase 1)
id            uuid PK
type          enum('direct','group')
name          varchar nullable
created_by    uuid FK
settings      jsonb default '{}'  // encryptionMode, themeOverride
created_at    timestamp

// conversation_members
conversation_id uuid FK
user_id         uuid FK
role            enum('admin','member')
joined_at       timestamp
PK (conversation_id, user_id)
```

- [ ] `pnpm db:migrate` + seed 2 user test

**Deliverables:**
- `apps/server/drizzle/schema.ts`
- Migration files
- `apps/server/src/db/seed.ts`

**Tiêu chí hoàn thành:**
- [ ] Seed tạo user `admin@test.com` và `member@test.com`

---

### Bước 0.4 — Auth API

**Việc cần làm:**

- [ ] `POST /auth/register` — email + password + displayName
- [ ] `POST /auth/login` — trả access JWT (15m) + set httpOnly refresh cookie (7d)
- [ ] `POST /auth/refresh` — rotate refresh token
- [ ] `POST /auth/logout` — xóa session
- [ ] `GET /auth/me` — user hiện tại
- [ ] Middleware `authenticate` cho protected routes
- [ ] Zod schemas trong `packages/shared`

**Deliverables:**
- `apps/server/src/routes/auth.ts`
- `packages/shared/src/schemas/auth.ts`

**Tiêu chí hoàn thành:**
- [ ] Test bằng curl/Postman: register → login → me → refresh → logout
- [ ] Refresh token rotation hoạt động

---

### Bước 0.5 — Mobile app shell (UI trống)

**Việc cần làm:**

- [ ] Cài shadcn/ui, cấu hình Tailwind mobile tokens (§4.5)
- [ ] `AppShell` component:
  - Safe area padding
  - Sticky header 56px
  - Content area scroll
- [ ] Route group `(auth)`: `/login`, `/register`
- [ ] Route group `(app)`: protected layout, redirect nếu chưa login
- [ ] Trang placeholder:
  - `/chats` — “Danh sách chat”
  - `/settings` — “Cài đặt”
- [ ] Bottom nav (mobile): Chats | Settings
- [ ] Auth forms: login/register với React Hook Form + Zod
- [ ] API client: `fetch` wrapper + auto refresh token

**Wireframe `/chats` (mobile):**

```
┌─────────────────────────────┐
│ Hiên nhà              ⚙ 🔔 │
├─────────────────────────────┤
│ 🔍 Tìm kiếm...              │
├─────────────────────────────┤
│                             │
│   (empty state)             │
│   Chưa có cuộc trò chuyện    │
│   [+ Cuộc trò chuyện mới]   │
│                             │
├─────────────────────────────┤
│  💬 Chats        ⚙ Cài đặt  │
└─────────────────────────────┘
```

**Deliverables:**
- `apps/web/components/layout/AppShell.tsx`
- `apps/web/components/layout/BottomNav.tsx`
- `apps/web/components/layout/SafeArea.tsx`
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(app)/chats/page.tsx`
- `apps/web/lib/api-client.ts`

**Tiêu chí hoàn thành:**
- [ ] Login trên Chrome mobile emulation (390px) mượt
- [ ] Safe area không bị che bởi notch (test iPhone preset)
- [ ] Touch target tất cả button ≥44px
- [ ] Desktop: split view skeleton (sidebar + main)

---

### Bước 0.6 — Invite-only registration (tuỳ chọn MVP)

**Việc cần làm:**

- [ ] Bảng `invites`: code, created_by, expires_at, max_uses
- [ ] `POST /invites` (admin) — tạo link `/register?code=xxx`
- [ ] Register bắt buộc có invite code hợp lệ

**Tiêu chí hoàn thành:**
- [ ] Không có code → register bị từ chối

---

## Phase 1 — MVP Chat (Tuần 3–5)

> **Mục tiêu:** Chat 1-1 text realtime, danh sách cuộc trò chuyện.

### Bước 1.1 — Conversation API

**Việc cần làm:**

- [ ] Schema bảng `messages`:

```typescript
id               uuid PK
conversation_id  uuid FK
sender_id        uuid FK
content          text          // plaintext Phase 1
content_type     enum('text')  // mở rộng sau
encrypted        boolean default false
reply_to_id      uuid nullable
created_at       timestamp
edited_at        timestamp nullable
deleted_at       timestamp nullable
```

- [ ] `POST /conversations` — tạo direct chat (2 members)
- [ ] `GET /conversations` — list + last message preview + unread count
- [ ] `GET /conversations/:id` — chi tiết + members
- [ ] `GET /conversations/:id/messages?cursor=&limit=50` — pagination cursor
- [ ] `POST /conversations/:id/messages` — gửi tin
- [ ] `PATCH /messages/:id` — edit (trong 15 phút)
- [ ] `DELETE /messages/:id` — soft delete

**Deliverables:**
- `apps/server/src/routes/conversations.ts`
- `apps/server/src/routes/messages.ts`

**Tiêu chí hoàn thành:**
- [ ] REST API đầy đủ test bằng integration test
- [ ] Pagination cursor hoạt động (load more khi scroll lên)

---

### Bước 1.2 — WebSocket server

**Việc cần làm:**

- [ ] WS endpoint: `ws://server/ws?token=JWT`
- [ ] Auth handshake — reject nếu token invalid
- [ ] Room model: user join room `user:{id}`, conversation join `conv:{id}`
- [ ] Events server → client:

| Event | Payload |
|---|---|
| `message:new` | `{ message }` |
| `message:edit` | `{ message }` |
| `message:delete` | `{ messageId, conversationId }` |
| `typing:start` | `{ conversationId, userId }` |
| `typing:stop` | `{ conversationId, userId }` |
| `presence:update` | `{ userId, status, lastSeen }` |

- [ ] Events client → server:

| Event | Payload |
|---|---|
| `typing:start` | `{ conversationId }` |
| `typing:stop` | `{ conversationId }` |
| `message:read` | `{ conversationId, messageId }` |

- [ ] Redis pub/sub fan-out khi scale (có thể defer nếu single instance)
- [ ] Heartbeat ping/pong 30s, disconnect cleanup

**Deliverables:**
- `apps/server/src/ws/handler.ts`
- `apps/server/src/ws/events.ts`
- `packages/shared/src/ws-events.ts`

**Tiêu chí hoàn thành:**
- [ ] 2 browser tab 2 user → gửi tin realtime <500ms
- [ ] Reconnect sau mất mạng → nhận tin mới

---

### Bước 1.3 — WebSocket client hook

**Việc cần làm:**

- [ ] `useWebSocket()` hook:
  - Connect khi authenticated
  - Exponential backoff reconnect
  - Event emitter / Zustand integration
- [ ] `useChat(conversationId)` hook:
  - Subscribe conversation room
  - Optimistic send
  - Merge WS events vào message list

**Deliverables:**
- `apps/web/hooks/useWebSocket.ts`
- `apps/web/hooks/useChat.ts`
- `apps/web/stores/chat-store.ts`

---

### Bước 1.4 — UI Danh sách chat (mobile)

**Việc cần làm:**

- [ ] `ConversationList` — virtual list nếu >100 items
- [ ] `ConversationItem`:
  - Avatar 48px
  - Tên + thời gian phải
  - Preview tin cuối (1 dòng truncate)
  - Badge unread
  - Badge 🔒 nếu E2E (placeholder Phase 4)
- [ ] Pull-to-refresh
- [ ] FAB hoặc header button “+” → tạo chat mới
- [ ] `NewChatSheet` — bottom sheet chọn contact
- [ ] Search bar filter local

**Tiêu chí hoàn thành:**
- [ ] Tap item → navigate `/chats/[id]`
- [ ] Unread badge cập nhật realtime
- [ ] Scroll mượt 60fps trên mobile

---

### Bước 1.5 — UI Màn hình chat (mobile)

**Việc cần làm:**

- [ ] Layout `/chats/[id]`:

```
┌─────────────────────────────┐
│ ←  Tên người chat      ⋮    │  Header: avatar nhỏ + tên + online dot
├─────────────────────────────┤
│                             │
│  [tin nhận]                 │
│              [tin gửi] ✓✓   │  MessageList (virtualized)
│                             │
├─────────────────────────────┤
│ 📎  [  Nhập tin nhắn... ] ➤│  Composer (fixed bottom)
└─────────────────────────────┘
```

- [ ] `MessageBubble`:
  - Sent: căn phải, màu `--bubble-sent`
  - Received: căn trái, màu `--bubble-received`
  - Timestamp nhóm theo ngày (divider “Hôm nay”, “Hôm qua”)
  - Status icon: ✓ sent, ✓✓ delivered/read
- [ ] `MessageComposer`:
  - Textarea auto-grow (max 5 dòng)
  - Enter gửi (desktop), nút gửi (mobile)
  - Disable khi đang gửi
- [ ] `TypingIndicator` — “Đang nhập...”
- [ ] Long press bubble → bottom sheet (Copy, Reply, Delete)
- [ ] Swipe back ← về list (mobile)
- [ ] Load more khi scroll lên đầu (infinite scroll ngược)
- [ ] Auto scroll xuống cuối khi gửi tin mới

**Deliverables:**
- `apps/web/components/chat/MessageList.tsx`
- `apps/web/components/chat/MessageBubble.tsx`
- `apps/web/components/chat/MessageComposer.tsx`
- `apps/web/components/chat/TypingIndicator.tsx`
- `apps/web/app/(app)/chats/[id]/page.tsx`

**Tiêu chí hoàn thành:**
- [ ] Gửi/nhận realtime giữa 2 user
- [ ] Optimistic UI — tin hiện ngay trước server confirm
- [ ] Keyboard mobile không che composer (visualViewport API)
- [ ] Edit/delete hoạt động

---

### Bước 1.6 — Read receipts & presence

**Việc cần làm:**

- [ ] Bảng `read_receipts`: conversation_id, user_id, last_read_message_id
- [ ] WS `message:read` cập nhật receipt
- [ ] Hiển thị ✓✓ xanh khi đối phương đã đọc
- [ ] Presence: online/away/offline qua WS heartbeat
- [ ] Header chat: “Đang hoạt động” / “Hoạt động 5 phút trước”

**Tiêu chí hoàn thành:**
- [ ] Tab A gửi → Tab B mở → Tab A thấy ✓✓

---

## Phase 2 — Theme & UX (Tuần 6–7)

> **Mục tiêu:** Hệ thống theme hoàn chỉnh, settings, polish UX mobile.

### Bước 2.1 — Theme engine

**Việc cần làm:**

- [ ] Package `packages/theme`:
  - `ThemeTokens` interface
  - 5 presets: `warm-home`, `midnight`, `forest`, `ocean`, `paper`
  - Export JSON tokens
- [ ] `ThemeProvider` — apply CSS variables lên `:root`
- [ ] Persist theme trong `user.settings.theme` (API PATCH)
- [ ] `prefers-color-scheme` fallback nếu theme = `system`

```typescript
// packages/theme/src/presets.ts — midnight (Hiên đêm)
export const midnight: ThemeTokens = {
  id: 'midnight',
  name: 'Hiên đêm',
  colors: {
    background: '#12100E',
    surface: '#1C1916',
    primary: '#C8715A',
    onPrimary: '#FFFAF7',
    bubbleSent: '#A85D42',
    bubbleReceived: '#2A2620',
    // ...
  },
};
```

**Deliverables:**
- `packages/theme/`
- `apps/web/components/theme/ThemeProvider.tsx`

**Tiêu chí hoàn thành:**
- [ ] Đổi theme → toàn app đổi màu ngay, không flash (disable transition lần đầu)
- [ ] Reload giữ theme

---

### Bước 2.2 — Theme picker UI

**Việc cần làm:**

- [ ] `/settings/appearance` page:
  - Grid preview theme (thumbnail màu)
  - Tap chọn → apply instant
  - Font size: Bình thường / Lớn (+25%) / Rất lớn (+50%)
  - Reduce motion toggle
- [ ] Bottom sheet theme picker (có thể mở từ settings hoặc header)

**Tiêu chí hoàn thành:**
- [ ] Font size large → bubble text 20px, touch target tăng
- [ ] WCAG contrast ≥4.5:1 cho text trên bubble

---

### Bước 2.3 — Per-conversation theme

**Việc cần làm:**

- [ ] `conversation.settings.themeOverride` — nullable theme id
- [ ] Chat header ⋮ → “Giao diện cuộc trò chuyện”
- [ ] Override áp dụng scoped CSS variables trên chat container
- [ ] Optional wallpaper: upload ảnh → blur background

**Tiêu chí hoàn thành:**
- [ ] Chat A theme ấm, Chat B theme xanh — độc lập nhau

---

### Bước 2.4 — Settings & Profile

**Việc cần làm:**

- [ ] `/settings` — menu list mobile style:

```
┌─────────────────────────────┐
│  [Avatar]  Tên hiển thị     │
│            email@...         │
├─────────────────────────────┤
│  👤 Hồ sơ                   │
│  🎨 Giao diện               │
│  🔔 Thông báo               │
│  🔒 Quyền riêng tư          │
│  📱 Thiết bị đã đăng nhập   │
│  🚪 Đăng xuất               │
└─────────────────────────────┘
```

- [ ] Edit profile: displayName, avatar upload (MinIO)
- [ ] Privacy: ẩn last seen, tắt read receipts
- [ ] Notification preferences (chuẩn bị Phase 5)

**Tiêu chí hoàn thành:**
- [ ] Upload avatar → hiện trong chat list + bubble

---

### Bước 2.5 — UX polish mobile

**Việc cần làm:**

- [ ] Page transition: slide animation giữa list ↔ chat
- [ ] Skeleton loading cho list và messages
- [ ] Empty states có illustration + CTA
- [ ] Error toast (network error, send failed → retry button)
- [ ] `visualViewport` resize handler — composer không bị keyboard che
- [ ] Focus management — khi vào chat, scroll cuối; không auto-focus input (tránh keyboard bật ngay)

**Tiêu chí hoàn thành:**
- [ ] Lighthouse Accessibility ≥90 trên `/chats`
- [ ] Test thật trên iPhone Safari + Android Chrome

---

## Phase 3 — Nhóm & Media (Tuần 8–10)

> **Mục tiêu:** Group chat, gửi ảnh, voice message.

### Bước 3.1 — Group conversation

**Việc cần làm:**

- [ ] `POST /conversations` type=`group` — name, members[]
- [ ] Group avatar, rename (admin only)
- [ ] `POST /conversations/:id/members` — thêm member
- [ ] `DELETE /conversations/:id/members/:userId` — xóa (admin) / leave
- [ ] UI: bubble hiện tên sender trong group
- [ ] `GroupInfoSheet` — danh sách members, role badge

**Tiêu chí hoàn thành:**
- [ ] Nhóm 5 người chat realtime ổn định

---

### Bước 3.2 — Media upload

**Việc cần làm:**

- [ ] MinIO bucket `hiennha-media`
- [ ] `POST /media/upload` — presigned URL hoặc multipart
- [ ] Client nén ảnh trước upload (`browser-image-compression`):
  - Max 1920px cạnh dài
  - Target ~200KB JPEG
- [ ] Message type `image`: content = URL, thumbnail URL
- [ ] UI: `ImageBubble` — tap mở lightbox fullscreen swipe
- [ ] Progress bar khi upload

**Tiêu chí hoàn thành:**
- [ ] Gửi ảnh 5MB → nén → upload → hiện trong chat <3s (4G)

---

### Bước 3.3 — Voice message

**Việc cần làm:**

- [ ] Record audio: `MediaRecorder API` (webm/opus)
- [ ] UI composer: giữ nút mic 🎤 hoặc tap toggle record
  - Recording overlay: waveform animation + timer + slide cancel
- [ ] Upload → message type `voice`
- [ ] `VoiceBubble` — play/pause, progress bar, duration
- [ ] Max duration 2 phút

**Tiêu chí hoàn thành:**
- [ ] Record → gửi → play trên thiết bị kia
- [ ] Permission mic được xin rõ ràng

---

### Bước 3.4 — Reply & Reaction

**Việc cần làm:**

- [ ] Reply: `reply_to_id`, UI preview strip trên bubble
- [ ] Composer reply mode — hiện quote + nút X hủy
- [ ] Reaction: bảng `message_reactions` (message_id, user_id, emoji)
- [ ] Long press → emoji picker nhanh (❤️ 👍 😂 😮 😢)
- [ ] WS events: `reaction:add`, `reaction:remove`

---

### Bước 3.5 — Invite link & QR

**Việc cần làm:**

- [ ] `POST /invites` → link `https://app/invite/{code}`
- [ ] Trang `/invite/[code]` — accept → join hoặc register
- [ ] QR generate client-side (`qrcode.react`) — admin share cho người thân
- [ ] Invite expires 24h, max 10 uses

**Tiêu chí hoàn thành:**
- [ ] Quét QR trên điện thoại → onboarding → vào nhóm gia đình

---

## Phase 4 — E2E opt-in (Tuần 11–14)

> **Mục tiêu:** Bảo mật đầu cuối bật theo từng cuộc hội thoại 1-1.

### Bước 4.1 — Crypto package setup

**Việc cần làm:**

- [ ] Package `packages/crypto` — wrapper `@signalapp/libsignal-client`
- [ ] Key generation on register:
  - Identity key pair
  - Signed pre-key
  - One-time pre-keys (batch 100)
- [ ] Lưu public keys server-side; **private keys chỉ IndexedDB** (local)
- [ ] `POST /keys/upload` — upload pre-key bundle
- [ ] `GET /keys/:userId` — fetch bundle để establish session

**IndexedDB stores:**
```
identityKeys
sessions
preKeys
trustedIdentities
```

**Tiêu chí hoàn thành:**
- [ ] User mới register → keys được tạo và upload
- [ ] Private key không xuất hiện trong network tab

---

### Bước 4.2 — E2E session establishment

**Việc cần làm:**

- [ ] Luồng bật E2E (1-1):

```
1. User A toggle E2E trong chat settings
2. Server gửi WS: e2e:request → User B
3. User B thấy dialog: "Bật mã hóa đầu cuối?" → Accept / Decline
4. Cả hai accept → exchange pre-key bundles
5. Client establish Double Ratchet session
6. conversation.settings.encryptionMode = 'e2e'
7. WS broadcast: e2e:enabled
```

- [ ] UI badge 🔒 trên chat list + header
- [ ] Tin mới: encrypt trước gửi → server lưu ciphertext
- [ ] Tin cũ (standard) vẫn hiển thị bình thường — không re-encrypt

**Deliverables:**
- `packages/crypto/src/session.ts`
- `packages/crypto/src/encrypt.ts`
- `apps/web/components/chat/E2ESetupDialog.tsx`

**Tiêu chí hoàn thành:**
- [ ] Server chỉ thấy base64 ciphertext — không decode được
- [ ] 2 client decrypt và hiển thị đúng nội dung

---

### Bước 4.3 — E2E UI & warnings

**Việc cần làm:**

- [ ] Chat settings → section Bảo mật:

```
┌─────────────────────────────┐
│  Bảo mật đầu cuối (E2E)  🔒 │
│  [====toggle====]           │
│  Chỉ bạn và người nhận đọc  │
│  được tin nhắn              │
├─────────────────────────────┤
│  Xác minh danh tính         │
│  Mã: 04827 15839 88471...   │
│  [Hiện QR]                  │
├─────────────────────────────┤
│  Tin tự hủy        Tắt  ▼  │
│  Khóa cuộc trò chuyện  Tắt  │
└─────────────────────────────┘
```

- [ ] Verify QR: hiển thị QR fingerprint, quét chéo 2 điện thoại
- [ ] Cảnh báo khi tắt E2E: “Tin mới sẽ không được mã hóa”
- [ ] Encrypted message placeholder trên list: “🔒 Tin mã hóa”
- [ ] E2E fail decrypt: “Không thể giải mã — thử xác minh lại khóa”

---

### Bước 4.4 — E2E media & backup

**Việc cần làm:**

- [ ] Ảnh/voice trong cuộc E2E: encrypt blob trước upload
- [ ] Server lưu encrypted blob — không biết loại file
- [ ] Encrypted key backup:
  - User đặt passphrase
  - Export encrypted identity key → download `.hien-nha-backup`
  - Restore on new device

**Tiêu chí hoàn thành:**
- [ ] Gửi ảnh E2E → server blob vô nghĩa → client kia xem được
- [ ] Restore backup trên browser mới → đọc được tin E2E cũ

---

### Bước 4.5 — Web Worker cho crypto

**Việc cần làm:**

- [ ] Move encrypt/decrypt sang Web Worker — không block UI scroll
- [ ] Queue messages decrypt khi mở cuộc E2E chat lần đầu
- [ ] Loading skeleton khi decrypt batch

---

## Phase 5 — PWA & Production (Tuần 15–16)

> **Mục tiêu:** Cài lên màn hình điện thoại, deploy production.

### Bước 5.1 — PWA setup

**Việc cần làm:**

- [ ] `manifest.json`:
  - `name`: Hiên nhà
  - `short_name`: Hiên nhà
  - `display`: standalone
  - `orientation`: portrait
  - Icons: 192px, 512px, maskable
- [ ] Service worker (Serwist):
  - Precache app shell
  - Runtime cache static assets
  - **Không** cache API responses chat (luôn network)
- [ ] Offline fallback page: “Mất kết nối — tin sẽ gửi khi có mạng”
- [ ] Install prompt banner (Android) + hướng dẫn Add to Home Screen (iOS)

**Tiêu chí hoàn thành:**
- [ ] Android Chrome → “Cài đặt ứng dụng” → icon màn hình → mở standalone
- [ ] iOS Safari → Add to Home Screen → không có URL bar

---

### Bước 5.2 — Push notifications (web)

**Việc cần làm:**

- [ ] Web Push API + VAPID keys
- [ ] `POST /push/subscribe` — lưu subscription
- [ ] Server gửi push khi có tin mới (user offline)
- [ ] E2E conversation: body = “Bạn có tin nhắn mới” (không preview)
- [ ] Tap notification → deep link `/chats/[id]`

**Tiêu chí hoàn thành:**
- [ ] Đóng tab → nhận push → mở đúng cuộc chat

---

### Bước 5.3 — Docker production

**Việc cần làm:**

- [ ] `docker-compose.yml` production:
  - `web` (Next.js standalone build)
  - `server` (Fastify)
  - `postgres`, `redis`, `minio`
  - `caddy` (auto TLS)
- [ ] Health checks tất cả services
- [ ] Volume persist cho PG, MinIO
- [ ] `.env.production.example`
- [ ] Script deploy: `pnpm build && docker compose up -d`

**Tiêu chí hoàn thành:**
- [ ] VPS Ubuntu → clone → env → docker up → HTTPS accessible

---

### Bước 5.4 — Security hardening

**Việc cần làm:**

- [ ] Rate limit auth endpoints (10 req/min/IP)
- [ ] CORS chỉ allow domain production
- [ ] CSP headers
- [ ] Helmet.js security headers
- [ ] Input sanitization XSS cho message content
- [ ] File upload: whitelist mime, max size 10MB
- [ ] Audit log admin actions

---

### Bước 5.5 — Testing & QA mobile

**Việc cần làm:**

- [ ] Playwright e2e tests:
  - Login flow
  - Send message
  - Toggle theme
  - E2E enable flow (mock crypto)
- [ ] Manual test matrix:

| Device | Browser | Status |
|---|---|---|
| iPhone 14 | Safari | ☐ |
| iPhone SE | Safari | ☐ |
| Pixel 7 | Chrome | ☐ |
| Samsung A54 | Chrome | ☐ |
| iPad | Safari split view | ☐ |
| Desktop | Chrome 480px column | ☐ |

---

## Phase 6 — Nâng cao (sau launch)

> Không chặn MVP. Phát triển khi Phase 5 ổn định.

| Feature | Mô tả ngắn | Ưu tiên |
|---|---|---|
| E2E group | Sender Keys cho nhóm ≤50 | Cao |
| Video/voice call | WebRTC + coturn TURN | Trung bình |
| Custom theme editor | Export/import `.hien-nha-theme.json` | Trung bình |
| Pin message | Pin trong group | Thấp |
| Poll | “Ăn gì tối nay?” | Thấp |
| Lịch gia đình | Sinh nhật, nhắc | Thấp |
| Album ảnh | Star ảnh trong chat | Thấp |
| Check-in “Về nhà rồi” | Nút nhanh | Thấp |
| On this day | Kỷ niệm tin cũ | Thấp |
| Disappearing messages | Timer 1h/24h/7d | Trung bình |
| Conversation lock | PIN local cho cuộc E2E | Trung bình |
| Full-text search | Local index (Dexie.js) | Trung bình |
| English i18n | next-intl | Thấp |

---

## 12. API & WebSocket reference

### 12.1. REST endpoints tổng hợp

```
Auth
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout
  GET    /auth/me

Users
  PATCH  /users/me
  POST   /users/me/avatar

Conversations
  GET    /conversations
  POST   /conversations
  GET    /conversations/:id
  PATCH  /conversations/:id
  POST   /conversations/:id/members
  DELETE /conversations/:id/members/:userId

Messages
  GET    /conversations/:id/messages
  POST   /conversations/:id/messages
  PATCH  /messages/:id
  DELETE /messages/:id

Media
  POST   /media/upload
  GET    /media/:id

Keys (E2E)
  POST   /keys/upload
  GET    /keys/:userId

Invites
  POST   /invites
  GET    /invites/:code
  POST   /invites/:code/accept

Push
  POST   /push/subscribe
  DELETE /push/subscribe
```

### 12.2. WebSocket events tổng hợp

```
Client → Server
  typing:start | typing:stop
  message:read
  e2e:accept | e2e:decline

Server → Client
  message:new | message:edit | message:delete
  typing:start | typing:stop
  presence:update
  reaction:add | reaction:remove
  e2e:request | e2e:enabled | e2e:disabled
  conversation:update
```

---

## 13. Checklist trước khi ship

### Functional
- [ ] Register / Login / Logout
- [ ] Chat 1-1 text realtime
- [ ] Group chat
- [ ] Gửi ảnh + voice
- [ ] ≥5 theme, đổi global + per-chat
- [ ] E2E opt-in 1-1 hoạt động
- [ ] Invite link / QR
- [ ] PWA installable

### Mobile UX
- [ ] Touch target ≥44px
- [ ] Safe area notch/home bar
- [ ] Keyboard không che composer
- [ ] Scroll message list mượt (virtualized)
- [ ] Font size large mode cho người lớn tuổi

### Security
- [ ] HTTPS everywhere
- [ ] httpOnly refresh cookie
- [ ] Rate limiting
- [ ] E2E private keys chỉ local
- [ ] CSP + XSS sanitization

### DevOps
- [ ] Docker Compose production
- [ ] Backup script PostgreSQL
- [ ] Monitoring cơ bản (health endpoint)
- [ ] README deploy instructions

---

## Phụ lục A — Lệnh thường dùng

```bash
# Dev
pnpm install
pnpm db:up          # docker compose dev
pnpm db:migrate
pnpm db:seed
pnpm dev            # web :3000 + server :4000

# Build
pnpm build
pnpm test

# Production
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
```

---

## Phụ lục B — Thứ tự file nên tạo (quick reference)

```
1.  pnpm-workspace.yaml, turbo.json
2.  apps/web (Next.js)
3.  apps/server (Fastify)
4.  packages/shared
5.  docker-compose.dev.yml
6.  drizzle schema + migrate
7.  auth routes + login UI
8.  AppShell + BottomNav
9.  conversation + message routes
10. WebSocket handler + useWebSocket hook
11. Chat UI (list + detail + composer)
12. packages/theme + ThemeProvider
13. settings pages
14. media upload + image/voice bubbles
15. group chat
16. packages/crypto + E2E flow
17. PWA manifest + service worker
18. docker-compose production
```

---

*Cập nhật file này khi hoàn thành từng bước — đánh dấu `[x]` trong checklist tương ứng.*
