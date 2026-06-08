# Hiên nhà — Brainstorm ý tưởng

> Ứng dụng nhắn tin riêng cho bạn và người thân — gần gũi, đẹp, linh hoạt theme, và bảo mật đầu cuối (E2E) chỉ khi bạn thật sự cần.

---

## 1. Tầm nhìn

**Hiên nhà** không cạnh tranh với WhatsApp hay Telegram ở quy mô hàng triệu người dùng. Đây là **không gian chat riêng tư** cho một nhóm nhỏ: gia đình, bạn thân thiết, có thể mở rộng thêm vài chục người quen.

| Nguyên tắc | Ý nghĩa |
|---|---|
| **Riêng tư theo thiết kế** | Không feed, không quảng cáo, không thu thập dữ liệu hành vi |
| **Đẹp và cá nhân hóa** | Nhiều theme, cảm giác “của riêng mình” |
| **Bảo mật có chủ đích** | E2E là tính năng nâng cao, bật theo từng cuộc hội thoại — không ép mọi người |
| **Đơn giản cho người lớn tuổi** | Giao diện rõ ràng, chữ to, thao tác ít bước |

---

## 2. Đối tượng người dùng

### Persona chính

1. **Bạn (admin/chủ nhà)** — người xây app, quản lý server, cấu hình bảo mật
2. **Người thân trực tiếp** — bố mẹ, anh chị em: cần app dễ dùng, không cần hiểu mật mã
3. **Người thân xa / bạn thân** — có thể bật E2E cho cuộc trò chuyện nhạy cảm

### Nhu cầu theo nhóm

| Nhóm | Nhu cầu | Gợi ý tính năng |
|---|---|---|
| Gia đình gần | Chat hàng ngày, ảnh, voice | Album ảnh chung, sticker gia đình, nhắc sinh nhật |
| Gia đình xa | Gọi video, chia sẻ vị trí (tùy chọn) | Video call, “đang ở đâu” trong ngày lễ |
| Cuộc trò chuyện nhạy cảm | Tài chính, sức khỏe, chuyện riêng | **E2E per-conversation**, tin tự hủy, khóa bằng PIN |

---

## 3. Kiến trúc tổng quan (đề xuất)

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Mobile / Web)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │   UI +   │  │  Theme   │  │  Crypto Layer (opt.) │ │
│  │  Chat    │  │  Engine  │  │  per conversation    │ │
│  └──────────┘  └──────────┘  └──────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ TLS (luôn bật)
┌───────────────────────────▼─────────────────────────────┐
│                      Backend Server                      │
│  Auth · Routing · Push · Media storage (encrypted blob)  │
│  Server KHÔNG đọc được nội dung E2E                      │
└─────────────────────────────────────────────────────────┘
```

### Hai chế độ tin nhắn

| Chế độ | Mô tả | Server thấy gì |
|---|---|---|
| **Standard** | Mã hóa trên đường truyền (TLS), lưu plaintext trên server (hoặc mã hóa at-rest) | Metadata + nội dung (nếu cần search/backup) |
| **E2E (nâng cao)** | Chỉ thiết bị hai đầu giải mã được | Chỉ blob mã hóa + metadata tối thiểu |

> **Quan trọng:** Chuyển từ Standard → E2E có thể; chuyển ngược cần cảnh báo rõ ràng (tin cũ vẫn mã hóa hoặc bị xóa tùy chính sách).

---

## 4. Bảo mật đầu cuối (E2E) — thiết kế chi tiết

### 4.1. Nguyên tắc “opt-in, per-conversation”

- Mặc định: cuộc hội thoại ở chế độ **Standard** — đủ an toàn cho chat gia đình thường ngày
- Người dùng vào **Cài đặt cuộc trò chuyện → Bảo mật nâng cao → Bật E2E**
- Cả hai (hoặc tất cả thành viên nhóm) phải **xác nhận** trước khi kích hoạt
- UI hiển thị badge rõ ràng: 🔒 cho cuộc E2E, 🔓 cho Standard

### 4.2. Luồng bật E2E (1-1)

```
User A                          Server                         User B
   │                               │                               │
   │── request E2E ───────────────►│── notify B ──────────────────►│
   │                               │                               │
   │◄── B accepts ─────────────────│◄── accept ────────────────────│
   │                               │                               │
   │── exchange pre-keys ─────────►│── relay ─────────────────────►│
   │◄── B's pre-key bundle ────────│◄──────────────────────────────│
   │                               │                               │
   │══ Double Ratchet established ═══════════════════════════════════│
   │── send encrypted msg ────────►│── relay ciphertext ───────────►│
```

### 4.3. Giao thức đề xuất

| Thành phần | Gợi ý | Lý do |
|---|---|---|
| Key agreement | **X3DH** (Extended Triple Diffie-Hellman) | Chuẩn Signal, hỗ trợ offline messaging |
| Message encryption | **Double Ratchet** (Signal Protocol) | Forward secrecy + break-in recovery |
| Group E2E | **Sender Keys** hoặc **MLS** (phức tạp hơn) | Sender Keys đủ cho nhóm gia đình nhỏ (<50) |
| Identity | Key fingerprint + QR verify | Người thân gặp nhau verify 1 lần |
| Local keys | Secure Enclave / Keystore / WebCrypto | Khóa private không rời thiết bị |

### 4.4. Thư viện tham khảo (tránh tự viết crypto)

- **libsignal** (Signal) — Rust/JS/Java/Swift
- **@signalapp/libsignal-client**
- Hoặc bọc qua **Matrix Olm/Megolm** nếu muốn federation sau này

### 4.5. Tính năng bảo mật bổ sung (gắn với E2E)

| Tính năng | Mô tả |
|---|---|
| **Tin tự hủy** | 1h / 24h / 7 ngày / sau khi đọc |
| **Khóa cuộc trò chuyện** | Mở app bằng Face ID / PIN riêng cho cuộc E2E |
| **Screenshot cảnh báo** | Thông báo khi có screenshot (mobile, hạn chế trên web) |
| **Verify danh tính** | So sánh mã số 60 chữ số hoặc quét QR khi gặp trực tiếp |
| **Backup khóa** | Export encrypted backup — chỉ user có passphrase |
| **Thiết bị tin cậy** | Quản lý danh sách thiết bị đã đăng nhập, revoke từ xa |

### 4.6. Trade-offs cần nói rõ với người thân

- E2E **không search được nội dung** trên server (chỉ search local)
- **Mất thiết bị + mất backup** = mất lịch sử E2E vĩnh viễn
- Thêm thiết bị mới vào cuộc E2E cần **re-key** hoặc approve từ thiết bị cũ
- Push notification chỉ hiển thị “Bạn có tin nhắn mới”, không preview nội dung E2E

---

## 5. Hệ thống Theme

### 5.1. Phạm vi theme

Theme áp dụng ở nhiều lớp:

```
App Theme (global)
    └── Chat Theme (per-conversation, override một phần)
            └── Bubble Style (compact / rounded / minimal)
```

### 5.2. Danh mục theme gợi ý

#### Theme có sẵn (built-in)

| ID | Tên | Phong cách | Palette gợi ý |
|---|---|---|---|
| `warm-home` | Ấm Cúng | Gia đình, pastel ấm | #FFF8F0 · #E8A598 · #5C4033 |
| `midnight` | Đêm Khuya | Dark mode mặc định | #0D1117 · #58A6FF · #C9D1D9 |
| `forest` | Rừng Xanh | Thiên nhiên, dịu mắt | #1B4332 · #95D5B2 · #F1FAEE |
| `ocean` | Đại Dương | Xanh biển, sáng | #0077B6 · #CAF0F8 · #023E8A |
| `lavender` | Oải Hương | Nhẹ nhàng, nữ tính | #E6E6FA · #9370DB · #4A4E69 |
| `retro` | Hoài Cổ | Pixel / 90s nostalgia | #2D2D2D · #FF6B6B · #FFE66D |
| `paper` | Giấy Note | Minimal, đen trắng | #FAFAF8 · #1A1A1A · #888 |
| `festive` | Ngày Lễ | Tết, Noel — seasonal | Dynamic theo lịch |

#### Theme động / đặc biệt

- **Theo thời gian:** sáng/tối tự chuyển theo hệ thống hoặc theo giờ
- **Theo cuộc trò chuyện:** nhóm “Gia đình” dùng theme ấm, chat riêng với bạn dùng theme khác
- **Custom theme:** chọn màu accent, wallpaper, font size — export/import file `.hien-nha-theme.json`
- **Wallpaper:** ảnh nền mờ cho từng cuộc chat (blur + overlay để bubble vẫn đọc được)

### 5.3. Token thiết kế (Design tokens)

```json
{
  "colors": {
    "background": "#0D1117",
    "surface": "#161B22",
    "primary": "#58A6FF",
    "onPrimary": "#FFFFFF",
    "bubbleSent": "#238636",
    "bubbleReceived": "#21262D",
    "textPrimary": "#C9D1D9",
    "textSecondary": "#8B949E",
    "accent": "#F78166"
  },
  "typography": {
    "fontFamily": "Inter, system-ui",
    "fontSizeBase": 16,
    "fontSizeLarge": 20
  },
  "radius": {
    "bubble": 18,
    "card": 12
  },
  "spacing": {
    "compact": 8,
    "comfortable": 16
  }
}
```

### 5.4. Accessibility

- **Chế độ chữ lớn** (+25%, +50%) — quan trọng cho bố mẹ
- **High contrast** theme riêng
- **Reduce motion** — tắt animation chuyển theme
- **Color blind safe** — không dựa chỉ vào màu để phân biệt sent/received

---

## 6. Tính năng cốt lõi

### 6.1. Chat cơ bản

- [ ] Tin nhắn text (markdown nhẹ: **bold**, _italic_, `code`)
- [ ] Reply, forward, edit (trong 15 phút), delete for me / for everyone
- [ ] Reaction emoji
- [ ] Typing indicator, online/last seen (có thể tắt privacy)
- [ ] Đã gửi / đã nhận / đã đọc (read receipts — tắt được)

### 6.2. Đa phương tiện

- [ ] Ảnh, video (nén thông minh trước upload)
- [ ] Voice message (giữ nút hoặc tap toggle)
- [ ] File đính kèm (PDF, doc) — giới hạn dung lượng hợp lý
- [ ] GIF / sticker pack (pack “Gia đình” tự tạo)

### 6.3. Cuộc gọi

- [ ] Voice call 1-1 (WebRTC)
- [ ] Video call 1-1 và nhóm nhỏ (≤6 người)
- [ ] E2E cho cuộc gọi (SRTP + DTLS) khi cuộc chat đang bật E2E

### 6.4. Nhóm & tổ chức

- [ ] Chat 1-1
- [ ] Nhóm (tối đa ~50 người — đủ cho họ hàng)
- [ ] **Không cần** public channel / discover — chỉ invite bằng link hoặc QR nội bộ
- [ ] Role đơn giản: Admin / Member
- [ ] Pin tin, poll đơn giản (“ăn gì tối nay?”)

### 6.5. Tính năng “gia đình”

| Tính năng | Mô tả |
|---|---|
| **Lịch chung** | Sinh nhật, ngày giỗ, họp mặt — sync với chat |
| **Album ảnh** | Ảnh được “star” trong chat tự vào album nhóm |
| **Check-in an toàn** | Nút “Về nhà rồi” gửi nhanh cho nhóm gia đình |
| **Ghi chú shared** | List mua sắm, link hay — pinned trong nhóm |
| **Kỷ niệm** | “On this day” — ảnh/tin cũ cùng ngày năm trước |

---

## 7. Trải nghiệm người dùng (UX)

### 7.1. Onboarding

1. Admin tạo “Nhà” (Home) — tên gia đình, avatar
2. Gửi **invite link** hoặc **QR** (hết hạn 24h)
3. Người mới: đặt tên hiển thị, chọn avatar, chọn theme yêu thích
4. Tutorial 3 bước: chat → gửi ảnh → (tuỳ chọn) bật E2E

### 7.2. Màn hình chính

```
┌──────────────────────────────┐
│  Hiên nhà          [🔔] [⚙] │
│  ─────────────────────────── │
│  🔍 Tìm cuộc trò chuyện...   │
│                              │
│  👨‍👩‍👧 Gia đình          14:32 │
│     Mai đi chợ nhé 🛒        │
│                              │
│  🔒 Mẹ · riêng tư     Hôm qua │
│     [Tin mã hóa]             │
│                              │
│  👤 Anh Hai            T2     │
│     Ok em                  │
└──────────────────────────────┘
```

### 7.3. Cài đặt E2E trong cuộc chat

```
Cài đặt cuộc trò chuyện
├── Thông tin
├── Theme cuộc này
├── Thông báo
└── Bảo mật
    ├── [ ] Bảo mật đầu cuối (E2E)     ← toggle
    ├── Verify danh tính (QR)
    ├── Tin tự hủy: Tắt ▼
    └── Khóa cuộc trò chuyện: Tắt
```

### 7.4. Ngôn ngữ & localization

- Tiếng Việt là ngôn ngữ chính
- English secondary (cho người thân ở nước ngoài)

---

## 8. Tech stack đề xuất

### Option A — Cross-platform nhanh (đề xuất cho solo dev)

| Layer | Công nghệ |
|---|---|
| Mobile | **Flutter** hoặc **React Native** |
| Web | **Next.js** hoặc **Expo Web** |
| Backend | **Go** hoặc **Node.js (Fastify)** |
| Realtime | **WebSocket** + Redis pub/sub |
| DB | **PostgreSQL** (metadata) + **S3/MinIO** (media) |
| Push | FCM (Android) + APNs (iOS) |
| E2E | libsignal (qua FFI / native module) |

### Option B — Native-first (performance + crypto tốt nhất)

| Layer | Công nghệ |
|---|---|
| iOS | Swift + SwiftUI |
| Android | Kotlin + Compose |
| Web | React |
| Shared crypto | Rust core + uniffi |

### Option C — Self-host friendly

- Docker Compose: `api + postgres + redis + minio + coturn (WebRTC)`
- Deploy trên VPS nhỏ (~$5/tháng) hoặc **homelab** (Raspberry Pi / NAS)
- Domain riêng: `chat.ten-gia-dinh.com`

---

## 9. Mô hình dữ liệu (sơ bộ)

```
User
├── id, displayName, avatarUrl
├── publicIdentityKey (cho E2E)
├── preKeys[]
├── settings { theme, locale, privacy... }
└── devices[]

Conversation
├── id, type (direct | group)
├── members[]
├── encryptionMode (standard | e2e)
├── e2eSessionState (per member pair / sender key)
├── themeOverride?
└── settings { disappearingTimer, lockEnabled... }

Message
├── id, conversationId, senderId
├── content (plaintext OR ciphertext blob)
├── contentType (text | image | voice | file...)
├── encrypted (boolean)
├── createdAt, editedAt?, expiresAt?
└── reactions[], replyToId?
```

---

## 10. Lộ trình phát triển (Roadmap)

### Phase 0 — Foundation (2–4 tuần)
- [ ] Monorepo structure
- [ ] Auth (email/phone + OTP hoặc magic link)
- [ ] WebSocket chat 1-1, Standard mode
- [ ] 2 theme: Light + Dark

### Phase 1 — MVP gia đình (4–6 tuần)
- [ ] Nhóm chat
- [ ] Ảnh, voice message
- [ ] Push notification
- [ ] 5+ built-in themes
- [ ] Invite link / QR

### Phase 2 — E2E (6–8 tuần)
- [ ] libsignal integration
- [ ] E2E 1-1, opt-in per conversation
- [ ] Key verification (QR)
- [ ] Encrypted backup

### Phase 3 — Nâng cao (ongoing)
- [ ] E2E group (sender keys)
- [ ] Video/voice call
- [ ] Custom theme editor
- [ ] Tính năng gia đình (lịch, album, kỷ niệm)
- [ ] Desktop app (Electron hoặc Tauri)

---

## 11. Tên & thương hiệu (brainstorm nhanh)

| Tên | Ý nghĩa |
|---|---|
| **Hiên nhà** | Tên chính thức — hiên nhà, chuyện gia đình |
| **Nhà Mình** | Ấm, gia đình |
| **Gần** | Gần gũi, không xa cách |
| **Riêng** | Riêng tư, exclusive |
| **Cùng Nhau** | Tinh thần kết nối |

Logo gợi ý: bubble chat + ngôi nhà nhỏ, hoặc hai vòng tròn giao nhau (kết nối).

---

## 12. Rủi ro & cách giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Tự implement crypto sai | Dùng libsignal, audit checklist |
| Người lớn tuổi không dùng được | UX test sớm, chữ lớn, onboarding video |
| Mất dữ liệu E2E | Backup encrypted + giáo dục user |
| Server tốn chi phí media | Giới hạn dung lượng, nén ảnh/video |
| Scope creep | Roadmap rõ, ship MVP trước E2E |
| Chỉ mình maintain | Code sạch, Docker, tài liệu deploy |

---

## 13. Câu hỏi mở — cần quyết định

1. **Self-host** hay dùng cloud managed (Supabase, Fly.io)?
2. **Đăng ký** bằng số điện thoại, email, hay chỉ invite-only?
3. **iOS App Store** — có chịu $99/năm và review Apple không?
4. **Web-only trước** rồi mobile sau — có chấp nhận không?
5. E2E group ngay từ đầu hay **chỉ 1-1 trước**?
6. Có cần **federation** (kết nối với server gia đình khác) không?

---

## 14. Bước tiếp theo đề xuất

1. Trả lời các câu hỏi mở ở mục 13
2. Chọn tech stack (Option A/B/C)
3. Tạo `DESIGN.md` — wireframe + design tokens cho 2 theme đầu tiên
4. Tạo `ARCHITECTURE.md` — API spec, WebSocket events, crypto flow
5. Scaffold monorepo và ship **Phase 0** trong 2 tuần

---

*Tài liệu brainstorm — có thể cập nhật khi ý tưởng evolve.*
