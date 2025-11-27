# ASINU Lite Delivery Report (2025-11-26)

## Tóm tắt
- Khởi tạo dự án Expo Router TypeScript mới tại `apps/asinu-lite/` theo kiến trúc trong ASINU_LITE_SPEC_v1.1.
- Port UI từ template vào bộ `ui-kit`/`components`, dựng router bottom tabs (Home, Missions, Tree, Profile), màn Logs/Settings/Login đầy đủ.
- Tạo lớp truy cập API `/api/mobile/*` (auth, missions, logs, tree, flags, profile) với store Zustand + React Query provider, kèm fallback dữ liệu demo.
- Đánh dấu mobile cũ là legacy (di chuyển `apps/mobile` vào `archive/mobile-legacy/`), cập nhật README và thêm báo cáo này.

## Màn hình & tuyến
- `app/index`: splash chuyển hướng login/home.
- `app/login`: form đăng nhập cơ bản (email/password).
- `(tabs)/home`: hero banner, metric cards, top missions, cây sức khoẻ, trend chart, logs gần đây, FAB ghi nhanh.
- `(tabs)/missions`: danh sách nhiệm vụ với optimistic toggle.
- `(tabs)/tree`: điểm cây + biểu đồ 7 ngày.
- `(tabs)/profile`: hồ sơ, feature flags, lối vào Settings/Logout.
- `logs/*`: chọn loại log + form Glucose / Huyết áp / Medication.
- `settings`: toggles cơ bản + logout.

## API `/api/mobile/*` đang dùng
- Auth: `POST /api/mobile/auth/login`, `GET /api/mobile/profile`, `POST /api/mobile/auth/logout`.
- Missions: `GET /api/mobile/missions`, `POST /api/mobile/missions/:id/complete` (optimistic UI).
- Logs: `GET /api/mobile/logs`, `POST /api/mobile/logs/glucose`, `POST /api/mobile/logs/blood-pressure`, `POST /api/mobile/logs/medication`.
- Tree: `GET /api/mobile/tree`, `GET /api/mobile/tree/history`.
- Flags: `GET /api/mobile/flags`.

Shape request/response (kỳ vọng tối thiểu):
- Auth login: `{ email, password }` → `{ token?: string, profile?: Profile }`.
- Profile: `{ id, name, email?, phone?, relationship?, avatarUrl? }`.
- Mission: `{ id, title, description?, scheduledAt?, completed, points?, category? }`.
- Log entry: `{ id, type, recordedAt, value? | systolic?/diastolic? | medication?/dose?, tags?, notes? }`.
- Tree summary: `{ score, streakDays, completedThisWeek, totalMissions? }`; history: array `{ label, value }`.
- Flags: boolean map `FEATURE_MOOD_TRACKER`, `FEATURE_JOURNAL`, `FEATURE_AUDIO`, `FEATURE_DAILY_CHECKIN`, `FEATURE_AI_FEED`, `FEATURE_AI_CHAT`.

## Mock/ghi chú
- Nếu API chưa sẵn: stores tự động fallback dữ liệu demo (missions/logs/tree) và log cảnh báo console.
- Dev bypass: `EXPO_PUBLIC_DEV_BYPASS_AUTH=1` sẽ bỏ qua login, sinh profile giả trong `auth.dev-bypass.ts`.

## Cách chạy local
```bash
cd apps/asinu-lite
npm install
npx expo start
```
- Cấu hình API: đặt `EXPO_PUBLIC_API_BASE_URL` trỏ tới server `/api/mobile/*` (mặc định `http://localhost:3000`).
- Hot reload hoạt động cho web/ios/android theo expo.

## Rủi ro & TODO
- Chưa có EAS projectId mới cho Lite (cần chạy `eas init` nếu build cloud).
- Fallback dữ liệu chỉ dành cho demo; cần kiểm tra shape thật khi backend hoàn thiện.
- Chưa thêm routing cho experimental flags (Mood/Journal/Audio) nhưng flags store đã sẵn sàng.
