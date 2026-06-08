# Hiên nhà

**Chuyện nhà trên hiên** — ứng dụng nhắn tin riêng cho gia đình, self-host, mobile-first.

> Repo: `hien-nha` · Packages: `@hien-nha/*`

## Sản phẩm

Hiên nhà là không gian chat riêng cho nhóm nhỏ (gia đình, bạn thân), không quảng cáo, không feed. Thiết kế cho điện thoại trước, có thể cài như app qua PWA.

| Tính năng | Trạng thái |
|---|---|
| Chat 1-1 & nhóm realtime | Có |
| Ảnh, voice, reply, reaction | Có |
| 5 theme + theme riêng từng cuộc chat | Có |
| E2E opt-in (1-1) | Có (beta) |
| Push notification | Sắp ra mắt (Phase 5) |

**Giao diện:** palette ấm *Hiên đêm* (charcoal + terracotta), glass surfaces, icon Phosphor, bubble có chiều sâu và group tin liên tiếp. Chi tiết trong [DEVELOPMENT.md §4.6](./DEVELOPMENT.md#46-ngôn-ngữ-thị-giác-hiên-nhà).

## Yêu cầu

- Node.js 20+
- pnpm 10+
- Docker (PostgreSQL, Redis, MinIO)

## Bắt đầu nhanh

```bash
# Cài dependencies
pnpm install

# Khởi động database
pnpm db:up

# Tạo bảng + seed dữ liệu test
pnpm db:migrate
pnpm db:seed

# Chạy dev (web :3000 + server :4000)
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) — đăng nhập bằng tài khoản test bên dưới.

## Tài khoản test

| Email | Mật khẩu |
|---|---|
| admin@test.com | password123 |
| member@test.com | password123 |

Mã mời đăng ký: `WELCOME2024`

## Cấu trúc

| Path | Mô tả |
|---|---|
| `apps/web` | Next.js UI (mobile-first, PWA-ready) |
| `apps/server` | Fastify API + WebSocket |
| `packages/shared` | Zod schemas & types |
| `packages/theme` | Design tokens & theme presets |
| `packages/crypto` | E2E wrapper (Signal protocol) |

## Deploy production (Docker)

Stack production nằm ở [`docker/docker-compose.prod.yml`](./docker/docker-compose.prod.yml): PostgreSQL, Redis, MinIO, Fastify server, Next.js web. Nginx reverse proxy cấu hình sẵn tại [`docker/nginx/hiennha.conf`](./docker/nginx/hiennha.conf) (Cloudflare origin TLS).

```bash
# 1. Cấu hình
cp .env.production.example .env
# Sửa POSTGRES_PASSWORD, JWT_SECRET, WEB_PUBLIC_URL, ...

# 2. Network chung với nginx (tên mặc định legal-shared-network)
docker network create legal-shared-network

# 3. Build & chạy
docker compose -f docker/docker-compose.prod.yml up -d --build

# 4. Migrate DB (lần đầu)
docker compose -f docker/docker-compose.prod.yml --profile setup run --rm migrate
```

**Lưu ý:** `NEXT_PUBLIC_API_URL` được nhúng lúc build image `web`. Đổi domain cần rebuild: `docker compose -f docker/docker-compose.prod.yml build web --no-cache`.

Compose dev/local đơn giản (kèm Caddy): `docker/docker-compose.yml`.

## Tài liệu

- [BRAINSTORM.md](./BRAINSTORM.md) — tầm nhìn, persona, roadmap ý tưởng
- [DEVELOPMENT.md](./DEVELOPMENT.md) — kế hoạch triển khai, trạng thái phase, quy chuẩn UI
