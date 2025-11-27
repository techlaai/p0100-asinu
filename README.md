# ASINU — Clean Scaffold (Next.js 14.2 + Postgres + Docker)

> GitHub repo: https://github.com/DIABOT-dev/asinu (remote `origin`). Use `git fetch origin main && git status` to sync before making changes.


## 🚀 Quick Start

```bash
# 1️⃣ Clone
git clone https://github.com/<org>/<repo>.git asinu
cd asinu

# 2️⃣ ENV
cp .env.example .env.local
# Điền thông tin Postgres, Viettel S3, API Key, v.v.

# 3️⃣ Local run
pnpm install
pnpm dev

# 4️⃣ Docker run
docker compose up -d --build

# 5️⃣ Test & Typecheck
pnpm test
pnpm typecheck

# 6️⃣ Smoke test
curl -i http://localhost:3000/api/qa/selftest   # expect 200

# 7️⃣ Production build (when native SWC crashes)
NEXT_FORCE_SWC_WASM=1 pnpm build   # forces the wasm binding via patches/next+14.2.7.patch
```

## 📱 Mobile (Expo Router)

- **ASINU Lite** lives under `apps/asinu-lite/` (Expo Router + UI kit). The legacy build has been archived to `archive/mobile-legacy/` and should not be used for new work.
- Install deps & run dev server:

```bash
cd apps/asinu-lite
npm install
npm run start     # or npx expo start
```

- Routing lives in `apps/asinu-lite/app/`, shared UI/components remain in `apps/asinu-lite/src/*`, and data access goes through the `/api/mobile/*` HTTP client. See `docs/ASINU_LITE_REPORT_2025-11-26.md` for endpoint notes.

### Mobile API bridge
- Backend exposes cookie-authenticated routes under `/api/mobile/*` (auth, profile, missions, logs, tree, flags). Responses are `no-store` for easy caching. Use `EXPO_PUBLIC_API_BASE_URL` in the Expo app to point at the correct environment.

### Expo EAS workflows
- The new Lite app reuses Expo defaults; initialize a project ID before running EAS. Update the app slug/name in `apps/asinu-lite/app.json` if you fork to another project space.

## 🔥 Smoke Harness (`npm run smoke`)

Run a full Auth → Mission → Rewards/Donate → Bridge → Healthz sweep with one command:

```bash
# Session cookie (asinu.sid) captured from staging login
export ASINU_SMOKE_SESSION="eyJ...signed..."
# Optional overrides
export SMOKE_BASE_URL="https://staging.asinu.ai"
export SMOKE_ALLOW_WRITES=1              # enable POST /missions/checkin, /rewards/redeem, /donate
export SMOKE_REDEEM_ITEM_ID="..."        # pin a catalog item (else first item)
export SMOKE_DONATE_POINTS=50            # optional points for donate test

npm run smoke
```

Outputs follow the QA checklist A–F with PASS/SKIP/FAIL, and any write test is automatically skipped when `SMOKE_ALLOW_WRITES` is unset. Bring your own `asinu.sid`; otherwise the harness will exit with an explicit error before running the suite.

## 🧪 API Endpoints — Smoke & Examples

### 1. POST Logs (all require JSON, content-type: application/json)

```bash
curl -i -X POST http://localhost:3000/api/log/bg \
  -H "Content-Type: application/json" \
  -d '{"value":123,"unit":"mg/dL","context":"fasting","ts":"2025-10-14T08:00:00Z"}'

curl -i -X POST http://localhost:3000/api/log/water \
  -H "Content-Type: application/json" \
  -d '{"ml":1800,"ts":"2025-10-14T08:00:00Z"}'

curl -i -X POST http://localhost:3000/api/log/weight \
  -H "Content-Type: application/json" \
  -d '{"kg":70,"ts":"2025-10-14T08:00:00Z"}'

curl -i -X POST http://localhost:3000/api/log/bp \
  -H "Content-Type: application/json" \
  -d '{"systolic":120,"diastolic":80,"pulse":70,"ts":"2025-10-14T08:00:00Z"}'

curl -i -X POST http://localhost:3000/api/log/insulin \
  -H "Content-Type: application/json" \
  -d '{"dose":12,"type":"rapid","context":"before meal","ts":"2025-10-14T08:00:00Z","note":"normal"}'

curl -i -X POST http://localhost:3000/api/log/meal \
  -H "Content-Type: application/json" \
  -d '{"meal_type":"lunch","text":"rice and chicken","portion":"medium","ts":"2025-10-14T12:00:00Z","photo_url":"https://example.com/photo.jpg"}'
```

### 2. GET Chart 7d (demo fallback if no data)

```bash
curl -s http://localhost:3000/api/chart/7d
```

### 3. QA Selftest (health check)

```bash
curl -i http://localhost:3000/api/qa/selftest
```

## 🔐 Native Auth (Email · Phone OTP · OAuth)

1. **Email / Phone (password)**
   ```bash
   # Register (contactType=email|phone)
   curl -i -X POST http://localhost:3000/api/auth/email/register \
     -H "Content-Type: application/json" \
     -d '{"contactType":"email","email":"demo@example.com","password":"Secure123","confirmPassword":"Secure123","agreeTerms":true,"agreeAI":true}'

   # Login
   curl -i -X POST "http://localhost:3000/api/auth/email/login?next=/dashboard" \
     -H "Content-Type: application/json" \
     -d '{"contactType":"email","email":"demo@example.com","password":"Secure123"}'
   ```
   Successful requests issue an `asinu.sid` HTTP-only cookie backed by the `auth_session` table.

2. **Phone OTP (static `123456` for internal testing)**
   ```bash
   curl -i -X POST http://localhost:3000/api/auth/phone/send \
     -H "Content-Type: application/json" \
     -d '{"phone":"0912345678"}'

   curl -i -X POST http://localhost:3000/api/auth/phone/verify \
     -H "Content-Type: application/json" \
     -d '{"phone":"0912345678","otp":"123456"}'
   ```
  The backend stores OTPs in `auth_otp_store` with a 5-minute TTL and auto-creates users on first verify.
  - UI: tại `/auth/login` chọn tab **“OTP (SMS)”** để gửi mã và xác thực trực tiếp, không cần rời trang.
  - Dọn dẹp OTP hết hạn: chạy tay `npm run otp:cleanup` hoặc cài cron `0 * * * * /opt/asinu/ops/otp_cleanup_cron.sh >> /var/log/asinu/otp_cleanup.log 2>&1`

3. **OAuth (Google / Zalo)**
   - Configure environment variables:
     ```
     GOOGLE_OAUTH_CLIENT_ID=placeholder
     GOOGLE_OAUTH_CLIENT_SECRET=placeholder
     GOOGLE_OAUTH_REDIRECT_URI=https://app.asinu.ai/api/auth/google   # optional override
     ZALO_OAUTH_APP_ID=placeholder
     ZALO_OAUTH_APP_SECRET=placeholder
     ZALO_OAUTH_REDIRECT_URI=https://app.asinu.ai/api/auth/zalo       # optional override
     ```
   - Visit `/api/auth/google` or `/api/auth/zalo` to start the flow; on success the user is provisioned (or linked) and redirected to `/`.

4. **Sessions**
   - All auth flows create rows in `auth_session` and set `asinu.sid=<session_id>` (httpOnly, secure).
   - `/api/auth/logout` and `/api/auth/session` clear the cookie and delete the DB record.

## 🌱 Mission Lite (Daily Actions)

1. Enable the feature:
   ```bash
   export FEATURE_MISSION=true
   export NEXT_PUBLIC_FEATURE_MISSION=true
   ```
2. Apply the latest migrations (includes `missions`, `user_missions`, `mission_log`).
3. Hit the APIs with a valid `asinu.sid` session cookie:
   ```bash
   curl -i --cookie "asinu.sid=..." http://localhost:3000/api/missions/today
   curl -i --cookie "asinu.sid=..." -X POST http://localhost:3000/api/missions/checkin \
     -H "Content-Type: application/json" \
     -d '{"mission_id":"<uuid-from-today>"}'
   ```
4. Visit `/dashboard` to see the “Today's Missions” checklist update live.

## 🎁 Rewards & Donate (flagged)

1. Enable the flags (Tree ledger is required for the catalog gate):
   ```bash
   export TREE_ENABLED=true
   export REWARDS_ENABLED=true
   export NEXT_PUBLIC_REWARDS=true
   ```
2. Run the latest migrations (`115_tree_ledger.sql` + `117_reward_wallet.sql`).
3. Smoke the APIs with a valid `asinu.sid`:
   ```bash
   curl -i --cookie "asinu.sid=..." http://localhost:3000/api/rewards/catalog
   curl -i --cookie "asinu.sid=..." http://localhost:3000/api/rewards/redemptions
   curl -i --cookie "asinu.sid=..." -X POST http://localhost:3000/api/rewards/redeem \
     -H "Content-Type: application/json" \
     -d '{"item_id":"11111111-2222-4aaa-8888-000000000001"}'
   curl -i --cookie "asinu.sid=..." -X POST http://localhost:3000/api/donate \
     -H "Content-Type: application/json" \
     -d '{"provider":"vnpay","amount_points":60}'
   ```
4. Visit `/rewards` to see the catalog, ladder, donation buttons, and redemption history update instantly.
5. (Optional) Donation/deposit features stay OFF for MVP—only set `DONATION_ENABLED=true` / `NEXT_PUBLIC_DONATION=true` later when payments are approved.

## 🌉 Dia Brain Bridge

Set the following environment variables to stream anonymized events to Dia Brain:

```bash
export BRIDGE_URL="https://bridge.example.com/v1/events"
export BRIDGE_KEY="paste-issued-key"
export BRIDGE_HASH_SECRET="per-env-random-secret"
```

The bridge client automatically hashes `user_id`, signs short-lived JWTs, and records all attempts in `bridge_log`.

## 🧠 Architecture

```
src/
 ├─ domain/          → entities, schemas, usecases
 ├─ application/     → services, DTO, validators
 ├─ infrastructure/  → db adapters, schedulers
 └─ interfaces/      → api routes, ui/pages, hooks, components
```

- API → Application → Domain (Clean Architecture)
- RLS (Postgres) bắt buộc; không phụ thuộc BaaS/runtime bên thứ ba
- Feature flags điều khiển AI, chart, rewards, v.v.

## 🛡️ Safety & Rules

- ❌ Không commit secret hoặc khoá dịch vụ bên thứ ba
- 🔒 .env.example chỉ chứa placeholder, không secret thực
- ✅ Mọi PR phải qua CI và QA Smoke pass
- 🚫 Không force-push lên main

## 🧩 Team & License

Tech Lead: Trần Quang Tùng  
QA Lead: Đặng Tuấn Anh  
Product Owner: Trần Hoàng Nam

© 2025 CÔNG TY CỔ PHẦN ASINU — All rights reserved.

Dưới đây là 3 khung luật chơi ông chỉ việc copy đưa cho Codex. Không code, không lệnh, chỉ mục tiêu & nguyên tắc.

🔹 KHUNG 1 – Luật chơi cho Mobile Contracts /api/mobile/*

Mục tiêu: Backend mobile và Asinu Mobile phải đi chung một “bản đồ”, không được tự chế thêm.

Yêu cầu cho Codex:

ASINU_MOBILE_SCREEN_ARCHITECTURE và ASINU_MOBILE_CONTRACTS là “nguồn sự thật” cho toàn bộ mobile.

Mọi route /api/mobile/* phải bám đúng bảng contract hiện tại.

Không được tự ý đổi tên endpoint, đổi shape response nếu chưa cập nhật lại contract.

Khi cần thêm endpoint mới cho mobile:

Bước 1: Bổ sung rõ ràng vào bảng contracts (mô tả, request, response, error).

Bước 2: Sau đó mới được tạo route backend và hook mobile tương ứng.

Không được “code trước, sửa docs sau”.

Mọi màn P0 phải luôn có:

Route mobile rõ ràng (đường dẫn /api/mobile/... dùng thật).

Request shape và response shape khớp bảng.

Trạng thái lỗi: 401, 404, 409, 500… phải bám đúng mô tả, không bịa thêm mã lỗi lạ.

Khi phát hiện backend hiện tại khác với contracts:

Phải ghi lại chênh lệch trong REPORT_2025-11-HISTORY.md và đề xuất sửa về phía nào (docs hay code), không tự “vá tạm”.

🔹 KHUNG 2 – Luật chơi cho Feature Flag (Dia Brain × Mobile)

Mục tiêu: Flag rõ ràng, ít nhưng chất, mobile chỉ đọc – không tự sáng tạo.

Yêu cầu cho Codex:

Danh sách flag lõi cho mobile (ví dụ, có thể điều chỉnh nhưng không được tự thêm lung tung):

TREE_ENABLED

REWARDS_ENABLED

DONATE_ENABLED

FAMILY_ENABLED

AI_CHAT_ENABLED

NOTIFICATIONS_ENABLED

Với mỗi flag, luôn phải trả lời được 2 câu:

Khi flag = bật: màn nào xuất hiện, hành vi gì mở ra?

Khi flag = tắt: màn nào ẩn hoặc fallback sang trạng thái gì (empty, offline, message giải thích)?

Nguồn dữ liệu flag:

Mobile chỉ đọc từ session hoặc một endpoint config (ví dụ /api/mobile/session hoặc /api/mobile/app-config).

Không set flag từ local storage một cách tùy tiện.

Mọi quyết định bật/tắt tính năng phải xuất phát từ server/Dia Brain.

Khi muốn thêm flag mới:

Bước 1: Ghi vào tài liệu flag (table mô tả tên flag, ý nghĩa, hành vi).

Bước 2: Cập nhật contracts/session để trả flag đó xuống mobile.

Bước 3: Sau đó mới chỉnh UI để phản ánh flag.

Không được:

Tạo flag mới trong code mà không có docs.

Ẩn màn bằng cách “comment UI” thay vì điều khiển bằng flag.

🔹 KHUNG 3 – Luật chơi cho Smoke Flow “hạnh phúc” trên Asinu Mobile

Mục tiêu: Mọi test, mọi QA, mọi wiring check-in/redeem/donate đều phải xoay quanh một vòng trải nghiệm chuẩn của người nhà bệnh nhân tiểu đường, không chỉ là test kỹ thuật.

Yêu cầu cho Codex:

Xây dựng và duy trì một vòng smoke flow chuẩn, với nhân vật là người con chăm bố/mẹ tiểu đường, gồm ít nhất các bước:

Mở app → Splash đọc session và feature flags.

Nếu chưa đăng nhập → đi qua một trong hai:

Login email/password

Hoặc OTP điện thoại

Sau đăng nhập → vào Home Dashboard, thấy:

Nhiệm vụ hôm nay

Năng lượng cây

Rewards/Donate CTA hiển thị đúng flag.

Vào Missions → hoàn thành ít nhất một mission (check-in)

Thấy trạng thái mission đổi

Thấy tổng quan trên home hoặc tree thay đổi tương ứng (energy/VP).

Vào Rewards → xem danh sách phần thưởng → mở chi tiết một reward.

Thực hiện một lần redeem (nếu flag bật) → kiểm tra:

Balance thay đổi

Lịch sử redeem có thêm dòng mới.

Vào Donate → xem được options → tạo một donate intent (dù là mock) → thấy trạng thái được ghi nhận.

Vào Family → thấy danh sách người thân (kể cả empty state nếu chưa có).

Vào Profile/Settings → xem thông tin cá nhân, có thể chỉnh một tuỳ chọn nhỏ.

Tắt mạng hoặc mô phỏng offline → màn Offline phải hiện đúng, có nút retry.

Quay lại online, logout → quay về đúng luồng auth.

Mọi unit/UI test cho screen Expo phải bám theo vòng này:

Test không chỉ check “component render” mà phải check luồng câu chuyện:

Sau check-in mission → dashboard thay đổi thích hợp.

Sau redeem → balance và history thay đổi.

Sau donate → donate history ghi nhận.

Khi bổ sung test mới:

Phải trả lời được câu hỏi: “Bước này trong hành trình của người nhà là bước số mấy? Nó giúp họ yên tâm hơn chỗ nào?”

Nếu không map được vào hành trình thực tế → test đó là phụ, không phải test cốt lõi.

Bất cứ khi nào smoke flow bị gãy:

Phải ghi log lại rõ trong REPORT_2025-11-HISTORY.md (hoặc file history tháng hiện tại):

Gãy ở bước nào trong 11 bước trên

Do flag, do API, hay do UI.
