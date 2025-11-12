# FamilyLink - Nguoi nha nhap ho & theo doi

**Status:** Feature flag controlled (RELATIVE_ENABLED)
**Version:** MVP Lite v0.2
**QA Freeze Compatibility:** OFF by default for 0.9.0

---

## Muc tieu & Pham vi

FamilyLink cho phep nguoi nha duoc lien ket voi tai khoan chu de:
- **Viewer**: Xem dashboard va log (BG, meal, water, BP, weight, insulin)
- **Editor**: Xem va nhap ho tat ca cac log type

**Kien truc module hoa:** Co the bat/tat qua feature flag ma khong anh huong luong hien tai.

**RLS an toan:** User chi thay du lieu cua minh; relative chi thay/ghi cho user da lien ket.

---

## Feature Flag

### 1. Bang feature_flags

```sql
INSERT INTO feature_flags (key, value, updated_at)
VALUES ('RELATIVE_ENABLED', 'false', now())
ON CONFLICT (key) DO NOTHING;
```

### 2. Service doc flag

```typescript
import { getFeatureFlag } from '@/config/feature-flags';

const isEnabled = getFeatureFlag('RELATIVE_ENABLED');
```

### 3. Gate tai API/UI

- **API**: `/api/relative/*` tra 404 neu flag OFF
- **UI**: An toan bo muc FamilyLink neu flag OFF

---

## Database Schema & RLS

### 1. Bang relatives

```sql
CREATE TABLE relatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relative_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relation_type relation_type NOT NULL,
  role relative_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, relative_id),
  CONSTRAINT no_self_link CHECK (user_id != relative_id)
);
```

**Custom Types:**
- `relation_type`: father, mother, son, daughter, spouse, sibling, other
- `relative_role`: viewer (read-only), editor (can log on behalf)

### 2. RLS Policies

**Owner policies:**
- Owner can read/create/delete links
- Owner controls who has access and with what role

**Relative policies:**
- Relative can read links where they are the relative_id
- Relative with 'viewer' role can SELECT logs of user_id
- Relative with 'editor' role can INSERT logs via stored procedures

**Helper functions:**
```sql
can_access_user_data(accessor_id, target_user_id) -> boolean
has_editor_role(accessor_id, target_user_id) -> boolean
```

---

## API Endpoints

### POST /api/relative/add

Them nguoi nha vao lien ket.

**Request:**
```json
{
  "relative_id": "uuid",
  "relation_type": "father|mother|son|daughter|spouse|sibling|other",
  "role": "viewer|editor"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "current-user-id",
    "relative_id": "uuid",
    "relation_type": "father",
    "role": "viewer",
    "created_at": "2025-10-01T..."
  }
}
```

**Response (404 if flag OFF):**
```json
{
  "error": "Feature not available",
  "code": "FEATURE_DISABLED",
  "flag": "RELATIVE_ENABLED"
}
```

---

### GET /api/relative/dashboard?user_id=uuid

Xem dashboard cua nguoi than (neu co quyen).

**Response (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "data": {
    "glucose": {
      "latest": 120,
      "avg_7d": 118,
      "readings": []
    },
    "meals": {
      "today": 2,
      "avg_calories": 1800,
      "recent": []
    },
    "water": {
      "today_ml": 1500,
      "goal_ml": 2000,
      "percentage": 75
    },
    "bp": {
      "latest": { "systolic": 120, "diastolic": 80 },
      "trend": "normal"
    },
    "weight": {
      "latest_kg": 70,
      "trend": "stable"
    },
    "insulin": {
      "today_units": 24,
      "doses": []
    }
  }
}
```

---

### POST /api/relative/log/:type

Nhap ho log (yeu cau role 'editor').

**Types:** bg, meal, water, bp, weight, insulin

**Request:**
```json
{
  "user_id": "uuid",
  "value_mgdl": 120,
  "tag": "fasting",
  "taken_at": "2025-10-01T08:00:00Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "bg log created on behalf",
  "data": {
    "id": "log-uuid",
    "user_id": "target-user-id",
    "type": "bg",
    "logged_by": "relative-id",
    "created_at": "2025-10-01T..."
  }
}
```

---

## UI/UX

### 1. ProfilePage

Toggle "Nguoi nha" (an neu flag OFF):
- Hien danh sach relatives
- Nut "Them nguoi nha"
- Hien relation_type va role
- Chuc nang xoa lien ket

### 2. Log Form

Dropdown "Toi / Nguoi than" (an neu khong co relatives):
- Mac dinh: "Toi"
- Neu co relatives voi role='editor': hien danh sach
- Khi chon nguoi than: goi `/api/relative/log/:type` thay vi `/api/log/:type`

### 3. Dashboard

Filter xem log theo profile hoac relative:
- Mac dinh: "Cua toi"
- Neu co relatives: dropdown "Cua toi / [Ten nguoi than]"
- Fetch data tu `/api/relative/dashboard?user_id=...`

---

## Che do Canh bao 2 chieu (Emergency Mode 24h)

**Trang thai:** Tuong lai, chua implement trong MVP Lite

### Muc tieu

Khi nguoi benh thay suc khoe khong on:
1. Bam nut kich hoat "Bao ve 24h"
2. Trong 24h: he thong check-in dinh ky
3. Neu khong phan hoi → canh bao cho nguoi nha

### Quy tac thoi gian

- Check-in mac dinh: 3h/lan (ban ngay 06:00-21:00)
- Diem chot 21:00: gui "Kiem tra cuoi ngay"
  - User chon: Duy tri bao ve qua dem (Night Guard ON) hoac Khong can qua dem (OFF)
  - Neu khong phan hoi truoc 21:15 → mac dinh OFF

### Night Guard (khi ON)

- 1 check-in im lang trong dem (vi du 02:30)
- Khong phan hoi → khong leo thang; sang hom sau hoi lai

### Ngay hom sau

- 06:00 noi lai check-in 3h/lan
- Neu dem qua no-answer → hien thi banner xac nhan

### Leo thang (ban ngay)

- Neu no-answer 15': nhac lai → SMS/WhatsApp → Call (neu cho phep)
- Neu hazard cao: call ngay nguoi benh (IVR), sau do nguoi nha

### Du lieu can them

```sql
CREATE TABLE alert_sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  activated_at timestamptz,
  deactivated_at timestamptz,
  night_guard_enabled boolean DEFAULT false,
  status text -- 'active' | 'completed' | 'escalated'
);

CREATE TABLE alert_events (
  id uuid PRIMARY KEY,
  session_id uuid REFERENCES alert_sessions(id),
  event_type text, -- 'check_in' | 'no_answer' | 'confirmed' | 'escalated'
  created_at timestamptz
);
```

---

## QA Scope

### OFF-mode (Pre-Freeze 0.9.0)

✅ Tat ca `/api/relative/*` tra 404
✅ UI khong hien FamilyLink section
✅ App khong crash
✅ Existing features van hoat dong binh thuong

### ON-mode (Post-Freeze, QA rieng)

- Test RLS isolation: relative chi thay data cua user da lien ket
- Test log ho: editor nhap ho 6 log types thanh cong
- Test dashboard relative: fetch data dung user_id
- Test alert_sessions (tuong lai): Emergency Mode 24h
- **Crash-free >= 99.5%**

### 4. QA Phase B Snapshot (12/11/2025)
- ✅ API `/api/relative/list|add|remove|dashboard` hoạt động khi `RELATIVE_ENABLED=true`, trả 404 khi OFF.
- ✅ UI Profile hiển thị `RelativesPanel` (client) – thêm/xóa relative, auto ẩn khi flag OFF.
- ⏸ Phase C (log hộ + emergency) chưa bật; route `/api/relative/log/:type` vẫn stub.

---

## Ket qua mong doi

✅ Co thiet ke DB, API, UI co ban cho module FamilyLink
✅ Co flag de bat/tat de dang
✅ Co kich ban demo "Canh bao 2 chieu" trung lap, khong lam phien ban dem tru khi duoc opt-in
✅ Chuan bi cho use-case ban hang: con cai mua Premium cho cha me, nguoi than nhap ho log va theo doi canh bao an toan
