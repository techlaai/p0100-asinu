📌 FILE 1 — TASK_MOBILE_P0_PREP.md (FULL VERSION)
# TASK_MOBILE_P0_PREP.md
### Nhiệm vụ: Chuẩn bị nền tảng kỹ thuật chung để đưa Asinu lên CH Play & App Store

## Mục tiêu chính
Thiết lập toàn bộ nền tảng trong repo để:
- Backend có smoke test tự động.
- CI build được Android (không cần keystore thật).
- App Android build được AAB release.
- Có skeleton tài liệu pháp lý (Privacy / Terms).
- Có docs release cho Android & iOS.
- Không commit secret.

---

# P0 – VIỆC CHUNG

## 1. Tạo Smoke Test Backend

### File cần tạo:
`scripts/smoke_backend.sh`

### Script yêu cầu:
- Gọi: `GET /api/ping`
- Tạo user test (email random)
- Login user test
- Log 1 sự kiện (vd: log nước hoặc log_bg)
- Nếu lỗi → `exit 1`

### Update package.json:
```json
"scripts": {
  "smoke:backend": "bash scripts/smoke_backend.sh"
}

Update CI:

Tạo job smoke chạy sau job build.

Job fail nếu smoke test fail.

2. CI Build Android (không keystore)
Yêu cầu:

Trong .github/workflows/ci.yml:

Job: build-android

Chạy trên Ubuntu

Cài Node + JDK + Android SDK hoặc EAS

Build app:

cd android
./gradlew assembleRelease || ./gradlew bundleRelease


Mục tiêu: Đảm bảo Android build không crash trong CI.

3. Skeleton pháp lý

Tạo các file sau trong docs/:

privacy-policy.vi.md
privacy-policy.en.md
terms-of-use.vi.md

Nội dung skeleton:

Giới thiệu

Dữ liệu thu thập

Mục đích sử dụng

Lưu trữ & bảo mật

Quyền người dùng

Chia sẻ dữ liệu

Liên hệ

Thời điểm hiệu lực

P1 – ANDROID
4. Lock package name

Cập nhật:

android/app/build.gradle

app.json hoặc app.config.js

Gía trị chuẩn:
com.diabot.asinu

5. Chuẩn hóa version code / version name

Trong Android config:

versionName = "0.1.0"
versionCode = 1


Tạo file:
docs/RELEASE_ANDROID.md

Nội dung:

Cách tăng versionCode/Name

Ghi vị trí file cấu hình version

6. Thiết lập signing (không commit secret)
File mẫu:

android/keystore.properties.example

storePassword=
keyPassword=
keyAlias=asinu
storeFile=asinu-release.keystore

Update build.gradle:

Nếu có keystore.properties → dùng signing release

Nếu không → fallback debug signing

.gitignore:
android/keystore.properties
android/app/asinu-release.keystore

7. Script build AAB

Trong package.json:

"build:android:release": "cd android && ./gradlew bundleRelease"


Update docs/RELEASE_ANDROID.md:

Tạo keystore

Tạo keystore.properties

Lệnh build release

Đường dẫn output

P2 – iOS
8. Tạo docs/RELEASE_IOS.md

Nội dung cần có:

Cài Xcode

Mở workspace

Chọn automatic signing

Product → Archive

Upload lên App Store Connect

TestFlight

9. Skeleton job iOS trong CI

Trong .github/workflows/ci.yml thêm:

# TODO: Enable when Apple Developer certificates are ready.
# build-ios:
#   runs-on: macos-latest
#   steps:
#     # TODO: install deps and build archive

Kết quả kỳ vọng

CI có build-android + smoke

Repo sạch secret

Android build release được

Docs đầy đủ cho mobile releases
