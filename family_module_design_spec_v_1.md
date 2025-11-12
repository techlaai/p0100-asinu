# Asinu Family Module – Full Design Specification (V1)

## 1. Mục tiêu & Triết lý thiết kế
Tính năng Family là một mở rộng chiến lược cho Asinu, nhằm kết nối các thành viên trong gia đình và chia sẻ dữ liệu sức khỏe một cách an toàn, có kiểm soát, minh bạch.

> Triết lý: "Chăm sóc không phải là một hành động cá nhân – đó là sức mạnh của gia đình."

Tính năng Family giúp:
- Tăng kết nối, khuyến khích tương tác trong gia đình.
- Tạo ra luồng dữ liệu mới (ghi hộ, theo dõi chéo) phục vụ huấn luyện và khuyến khích.
- Mở đường cho mô hình Family Subscription trong Asinu.

---

## 2. Tổng quan tính năng (User Story)

### User types:
- **Owner**: người được theo dõi (ví dụ: Mẹ, Bố).
- **Relative**: người theo dõi hoặc hỗ trợ (ví dụ: Con trai, Vợ, Bạn).

### Roles:
| Role | Quyền hạn |
|------|------------------|
| **Viewer** | Xem dashboard, xem log, không được ghi hộ. |
| **Editor** | Ghi hộ dữ liệu, xem dashboard, có thể nhập log thay owner. |

### User Stories:
1. **Thêm người thân**: A thêm B vào danh sách Family.
2. **Xem dashboard**: B (viewer/editor) xem dữ liệu của A.
3. **Ghi log hộ**: B (editor) nhập đường huyết cho A, hệ thống gán `logged_by = B`.
4. **Thu hồi quyền**: A có thể gỡ liên kết bất kỳ lúc nào.
5. **Cảnh báo (tương lai)**: Hệ thống cảnh báo khi A không ghi log >24h.

---

## 3. Luồng người dùng & sơ đồ luồng

### 3.1 Flow tổng quan (ASCII)
```
+-------------+        +-----------------+         +-----------------+
|   Owner A   | <----> |   Relatives DB  | <---->  |   Relative B    |
|  (Người được) |        | (owner,relative,role) |         | (Người xem/hỗ trợ) |
+-------------+        +-----------------+         +-----------------+
       |                        ^                             |
       |                        |                             |
       v                        |                             v
   [Dashboard A] ---------> [API /api/relative/*] <------ [Dashboard B]
                               (Flag kiểm soát)
```

### 3.2 Flow chi tiết: Ghi hộ log
```
Relative B (editor)
   |
   |-- Chọn: "Ghi đường huyết cho Mẹ"
   |---> POST /api/relative/log/bg
          { user_id: A, bg_value: 125 }

Backend kiểm tra:
   - RELATIVE_ENABLED = true?
   - B có role = editor với A?

Nếu OK:
   - Ghi log_bg(user_id=A, logged_by=B, bg_value=125)
   - Trả về { success: true, logged_by: B }
```

---

## 4. Kiến trúc kỹ thuật tổng thể

### 4.1 API Overview
| Endpoint | Mô tả | Quyền |
|-----------|---------------|------------|
| `POST /api/relative/add` | Tạo liên kết gia đình | Owner |
| `GET /api/relative/dashboard?user_id=` | Xem dashboard người thân | Viewer/Editor |
| `POST /api/relative/log/:type` | Ghi log hộ | Editor |

### 4.2 Database Schema
- Bảng `relatives`
  ```sql
  CREATE TYPE relation_type AS ENUM ('father','mother','son','daughter','husband','wife','brother','sister','grandfather','grandmother','grandson','granddaughter','uncle','aunt','cousin','other');
  CREATE TYPE relative_role AS ENUM ('viewer','editor');

  CREATE TABLE relatives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL,
    relative_user_id uuid NOT NULL,
    relation relation_type NOT NULL,
    role relative_role NOT NULL DEFAULT 'viewer',
    created_at timestamptz DEFAULT now(),
    UNIQUE(owner_user_id, relative_user_id),
    CHECK(owner_user_id <> relative_user_id)
  );
  ```
- Thêm cột `logged_by` cho mọi bảng log.

### 4.3 RLS & Security
```sql
ALTER TABLE relatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_manage ON relatives
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY relative_view ON relatives
  FOR SELECT USING (relative_user_id = auth.uid());
```

### 4.4 Feature Flags
Bảng `feature_flags(name, enabled)`.
```sql
INSERT INTO feature_flags(name, enabled) VALUES ('RELATIVE_ENABLED', false);
```

### 4.5 Logging & Audit
- Mỗi log_* bảng thêm cột `logged_by`.
- Audit truy cập có thể dùng trigger ghi vào `audit_logs`.

---

## 5. Thiết kế giao diện (UI/UX)

### 5.1 Profile
- Danh sách người thân (avatar + quan hệ + vai trò).
- Nút [Thêm người thân].
- Nút [Thu hồi liên kết].

### 5.2 Dashboard integration
- Dropdown chọn: `Của tôi / [Người thân]`.
- Khi chọn người thân → gọi `/api/relative/dashboard?user_id=`.
- Badge: "Đang xem: [Tên người thân]".

### 5.3 Log Form integration
- Dropdown: `Ghi cho: Tôi / [Người thân]`.
- Khi chọn người thân, gọi `/api/relative/log/:type`.

### 5.4 Consent & revoke flow
- **Mời**: Owner gửi link invite (QR/code).
- **Xác nhận**: Relative chấp nhận + chọn role.
- **Thu hồi**: Owner có thể gỡ bất kỳ lúc nào.

---

## 6. Triển khai theo giai đoạn

### Giai đoạn A: Nền tảng (trước MVP)
- Tạo migration (relatives, logged_by).
- Thêm RLS khung.
- Thêm feature flag RELATIVE_ENABLED = false.
- API stub `/api/relative/*` → 404 khi OFF.
- Ẩn toàn bộ UI Family.

### Giai đoạn B: Viewer-only (sau MVP)
- Mở flag.
- Thêm luồng invite + consent 2 chiều.
- Dashboard hiển thị người thân (read-only).

### Giai đoạn C: Full (Editor + Emergency)
- Bật ghi hộ.
- Ghi logged_by.
- Tích hợp emergency alert (alert_sessions, alert_events).

---

## 7. Quy tắc bảo mật & quyền riêng tư
- Có consent rõ ràng, thu hồi dễ.
- Mỗi hành động ghi hộ phải lưu logged_by.
- Dữ liệu mã hóa AES-256, chỉ xem trong context cho phép.
- Có chức năng xoá liên kết.

---

## 8. Chuẩn bị phát hành (Play Store + App Store)
- Bản trước MVP: khai RELATIVE_ENABLED=false.
- Khi bật: khai dữ liệu sức khỏe trong Data Safety / App Privacy.
- Thêm Privacy Policy URL.
- Bản iOS: tuân theo App Review 5.1, có consent đối với dữ liệu sức khỏe.

---

## 9. Test plan & QA matrix
| Trường hợp | Kết quả mong đợi |
|----------------|-----------------------|
| Flag OFF | Mọi đường `/api/relative/*` → 404 |
| Thêm người thân | Chỉ owner thực hiện được |
| Viewer xem dashboard | Xem được dữ liệu owner |
| Editor ghi hộ | Log ghi vào user_id=owner, logged_by=relative |
| Thu hồi quyền | Liên kết biến mất ngay |
| RLS test | Relative không xem được log người khác |

---

## 10. Checklist triển khai cho Codex (Pre-MVP focus)
- [ ] Tạo migration relatives + logged_by.
- [ ] Thêm policy RLS.
- [ ] Thêm feature flag.
- [ ] Scaffold API stub 404.
- [ ] Ẩn UI Family.
- [ ] Viết test case flag OFF.

---

## 11. Appendix
### JSON Example: Relative Link
```json
{
  "owner_user_id": "uuid-A",
  "relative_user_id": "uuid-B",
  "relation": "mother",
  "role": "editor"
}
```

### Example: Log entry ghi hộ
```json
{
  "user_id": "uuid-A",
  "logged_by": "uuid-B",
  "bg_value": 125,
  "timestamp": "2025-11-12T10:00:00Z"
}
```

---

**Kết luận:**
> Module Family được xem là một cấp độ mở rộng của Asinu sau MVP, nhưng hạ tầng nên được thiết lập từ sớm vì liên quan trực tiếp đến kiến trúc RLS và log. Trước MVP: flag OFF, UI ẩn hoàn toàn, API stub sẵn sàng. Sau MVP: mở Viewer-only, cuối cùng bật Editor + Emergency sau khi hoàn thiện privacy & consent flow.

