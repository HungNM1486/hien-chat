# @hien-nha/web

Next.js app — giao diện chính của Hiên nhà (mobile-first, PWA-ready).

## Chạy

```bash
# Từ root monorepo
pnpm dev

# Chỉ web (cần server :4000 đang chạy)
pnpm --filter @hien-nha/web dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Cấu trúc chính

```
app/
  (auth)/          login, register
  (app)/           shell bảo vệ: chats, settings
components/
  chat/            bubble, composer, sheets
  layout/          AppShell, header, bottom nav
  theme/           ThemeProvider, picker
  ui/              BottomSheet, IconButton, UserAvatar, toast
```

## Design system

- **Font:** Geist Sans + Geist Mono (timestamp, badge)
- **Icon:** `@phosphor-icons/react`
- **Theme mặc định:** `midnight` (*Hiên đêm*) — xem `packages/theme`
- **CSS utilities:** `globals.css` — `.glass-panel`, `.input-field`, `.btn-*`, `.bubble-*`

Chi tiết quy chuẩn UI: [DEVELOPMENT.md §4](../../DEVELOPMENT.md#4-mobile-first-ui--quy-chuẩn-bắt-buộc).
