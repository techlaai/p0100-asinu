# ASINU - FINAL HANDOVER SPEC V1.5

## 1. Overview

This document provides the final technical specifications for the Asinu Mobile application, intended for the outsourced development team. It includes an analysis of core logic, a map of required integrations, and a summary of the existing codebase.

## 2. Core Logic

### 2.1. Care Pulse & Escalation Protocol [LOGIC LOCKED]

**File Chính:** `src/features/care-pulse/engine/carePulse.machine.ts`

Logic "Care Pulse" là một state machine quản lý trạng thái sức khỏe của người dùng. Trạng thái có thể là `NORMAL`, `TIRED`, hoặc `EMERGENCY`.

**Cơ chế Leo thang (Escalation) 20 phút:**

Cơ chế này được thiết kế để tự động gửi cảnh báo nếu người dùng không phản hồi khi đang ở trong trạng thái khẩn cấp. Dựa vào các hằng số và logic trong state machine, một sự kiện leo thang sẽ được kích hoạt khi **tất cả** các điều kiện sau được thỏa mãn:

1.  **Trạng thái là Khẩn cấp:** `currentStatus` phải là `'EMERGENCY'`.
2.  **Cảnh báo được Kích hoạt:** Cờ `emergencyArmed` phải là `true`.
3.  **Người dùng "Im lặng":** `silenceCount` (số lần không phản hồi) phải lớn hơn hoặc bằng `2`.
4.  **Hết thời gian chờ:** Đã trôi qua ít nhất **20 phút** (`EMERGENCY_ESCALATION_DELAY_MS`) kể từ lần cuối cùng hệ thống hỏi người dùng (`lastAsk`).

Đội outsource cần đảm bảo service bắt được sự kiện leo thang này để thực hiện các hành động tiếp theo (ví dụ: gửi thông báo cho người thân).

### 2.2. Social Authentication

**File UI Chính:** `app/login/email.tsx`

Hệ thống đã có sẵn bộ khung UI (skeleton) hoàn chỉnh cho các chức năng đăng nhập, bao gồm:

*   **Phone Auth:** Giao diện nhập số điện thoại và nút "Tiếp tục".
*   **Social Auth:** Các nút bấm "Tiếp tục với Google", "Tiếp tục với Apple", và "Tiếp tục với Zalo".

Tất cả các component này đã được kết nối với store (`useAuthStore`) và service (`auth.service.ts`).

## 3. Integration Points

### 3.1. Required API Keys & Placeholders

Đây là các điểm tích hợp **bắt buộc** mà đội outsource phải hoàn thiện để kích hoạt tính năng.

**File:** `src/features/auth/auth.service.ts`

Trong file này, có 2 vị trí được đánh dấu `// TODO:` tương ứng với 2 chức năng cần kết nối backend:

1.  **Zezo-OTP Phone Authentication (L29):**
    *   **Vị trí:** `// TODO: Replace with backend endpoint when zero-OTP phone auth is available.`
    *   **Nhiệm vụ:** Thay thế logic giả lập bằng lời gọi API thật tới endpoint đăng nhập bằng số điện thoại.

2.  **Social Authentication (L40):**
    *   **Vị trí:** `// TODO: Replace with backend endpoint when social zero-OTP auth is available.`
    *   **Nhiệm vụ:** Tích hợp API backend để xác thực và đăng nhập người dùng thông qua Google, Apple, Zalo. Đội outsource sẽ cần xử lý việc lấy token từ các nền tảng social và gửi về backend tại đây.

## 4. Build & CI/CD

## 4. Build & CI/CD

### 4.1. CI/CD Pipeline Status & Required Fixes

**File:** `.github/workflows/ci.yml`
**Trạng thái:** 🔴 **Failing**

**Phân tích:**
Workflow "Core CI" (`core` job) hiện đang thất bại khi chạy trên `push` hoặc `pull_request`.

**Nguyên nhân gốc rễ:**
Job `core` cố gắng thực thi 2 npm script **không tồn tại** trong file `package.json`:
1.  `npm test` (trong bước "Unit & integration tests")
2.  `npm run build:ci` (trong bước "Build (CI mode)")

**Hành động khắc phục (Điều kiện nghiệm thu):**
Đội outsource **bắt buộc** phải thực hiện các công việc sau để quy trình CI/CD hoạt động trở lại:
1.  **Bổ sung Unit & Integration Tests:** Xây dựng bộ test cho các tính năng core và định nghĩa script `"test"` trong `package.json` để thực thi chúng.
2.  **Bổ sung Script Build CI:** Tạo một script build phù hợp cho môi trường CI (ví dụ: build web, kiểm tra bundle, v.v.) và định nghĩa nó với tên `"build:ci"` trong `package.json`.

Đây là một phần quan trọng của việc đảm bảo chất lượng code và là điều kiện cần để nghiệm thu dự án.

## 5. Project Setup

### 5.1. Required Libraries

*This section lists all necessary dependencies for the project.*

**Dependencies:**
```json
"dependencies": {
    "@expo/vector-icons": "~14.0.4",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-navigation/drawer": "^7.1.1",
    "@react-navigation/native": "^7.0.14",
    "@tanstack/react-query": "^5.62.8",
    "clsx": "^2.1.0",
    "expo": "~52.0.25",
    "expo-asset": "~11.0.5",
    "expo-constants": "~17.0.5",
    "expo-dev-client": "~5.0.20",
    "expo-font": "~13.0.4",
    "expo-linear-gradient": "~14.0.2",
    "expo-linking": "~7.0.5",
    "expo-router": "~4.0.17",
    "expo-secure-store": "~14.0.1",
    "expo-splash-screen": "~0.29.24",
    "expo-status-bar": "~2.0.1",
    "expo-system-ui": "~4.0.7",
    "nativewind": "^4.0.1",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.9",
    "react-native-gesture-handler": "~2.20.2",
    "react-native-reanimated": "~3.16.1",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "react-native-svg": "15.8.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss": "^3.3.2",
    "victory-native": "^36.6.11",
    "zustand": "^5.0.3"
  }
```

**Dev Dependencies:**
```json
"devDependencies": {
    "@babel/core": "^7.20.0",
    "@react-native-community/eslint-config": "^3.2.0",
    "@tsconfig/react-native": "^3.0.2",
    "@types/jest": "29.5.14",
    "@types/react": "~18.3.12",
    "@types/react-dom": "~18.3.1",
    "eslint": "^8.57.0",
    "husky": "^9.1.6",
    "typescript": "~5.3.3"
  }
```

The team must run `npm install` to set up the project environment.
