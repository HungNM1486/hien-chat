# Hiên nhà

**Chuyện nhà trên hiên** — ứng dụng nhắn tin riêng cho gia đình, self-host, mobile-first.

> Repo: `hien-nha` · Packages: `@hien-nha/*`

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

## Tài khoản test

| Email | Mật khẩu |
|---|---|
| admin@test.com | password123 |
| member@test.com | password123 |

Mã mời đăng ký: `WELCOME2024`

## Cấu trúc

- `apps/web` — Next.js UI (mobile-first)
- `apps/server` — Fastify API
- `packages/shared` — Zod schemas & types

## Tài liệu

- [BRAINSTORM.md](./BRAINSTORM.md) — ý tưởng sản phẩm
- [DEVELOPMENT.md](./DEVELOPMENT.md) — kế hoạch phát triển chi tiết
