# LevelUp.edu

Ứng dụng web giáo dục (Vite + React, Supabase, API Express nhỏ cho thao tác admin có service role).

## Yêu cầu

- Node.js 20+ (khuyến nghị)
- Tài khoản [Supabase](https://supabase.com) và project đã áp dụng schema trong thư mục `database/`

## Cài đặt

```bash
npm install
```

Sao chép `[.env.example](./.env.example)` thành `.env.local` và điền:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — client React (Vite chỉ đọc biến có tiền tố `VITE_`).
- `SUPABASE_SERVICE_ROLE_KEY` — chỉ dùng cho `npm run server` (không đưa vào frontend, không commit).

Tùy chọn chat Dialogflow: `VITE_DIALOGFLOW_AGENT_ID`, `VITE_DIALOGFLOW_PROJECT_ID`, … (xem `[src/components/DialogflowMessenger.jsx](./src/components/DialogflowMessenger.jsx)`).

## Chạy local

- Chỉ giao diện: `npm run dev`
- Chỉ API: `npm run server` (mặc định port `3001`; proxy Vite đã trỏ `/api` → `localhost:3001`)
- Cả hai: `npm run dev:stack`

## Kiểm tra

```bash
npm test
```

## Đặt lại mật khẩu (Supabase Auth)

Thêm URL đầy đủ trang đặt lại mật khẩu (ví dụ `https://<domain>/dat-lai-mat-khau`) vào **Authentication → URL Configuration → Redirect URLs** trong Supabase. Chi tiết gợi ý có trong `[src/pages/ResetPasswordPage.jsx](./src/pages/ResetPasswordPage.jsx)`.

## Cấu trúc gọn

- `src/` — React SPA, context auth, trang public / admin / giáo viên / học viên
- `server/` — Express: `/api/public`, `/api/me`, `/api/admin`
- `database/` — SQL schema & migration tham chiếu

