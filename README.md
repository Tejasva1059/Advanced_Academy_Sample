# School Result Management System (Green Valley International School)

A complete, production-ready, dynamic, database-driven School Result Management System built with **FastAPI**, **React 18 + TypeScript**, **Tailwind CSS**, and **SQLAlchemy 2.0**.

Designed from the ground up to be **offline-first** for on-premise local school servers, with native compatibility for **online cloud deployment**. All school branding, student rosters, subject structures, grading scales, and report card designs are dynamic and configurable for seamless replacement with real school data.

---

## Key Features

1. **Academic Classes 1st to 12th**:
   - 12 independent classes with internal database IDs (not name PKs).
   - Exactly 120 initial dummy students (10 per class) with unique Admission and Scholar numbers.
   - Realistic Indian student demographics.
2. **Stream Support (Classes 11th and 12th)**:
   - Full support for **Science**, **Commerce**, and **Arts/Humanities** streams.
   - Different students in Class 11 and 12 take stream-specific subjects.
3. **Class-Specific Subjects**:
   - Classes 1–2: 5 core subjects (English, Hindi, Math, EVS, Computer).
   - Classes 3–5: 6 subjects (+ General Knowledge).
   - Classes 6–8: 7 subjects (+ Sanskrit, Science, Social Science).
   - Classes 9–10: 7 subjects (+ Information Technology).
   - Classes 11–12: Stream-allocated subject packages.
4. **Independent Examinations**:
   - 2 examinations: **Half-Yearly Examination**, **Annual Examination**.
   - Marks for each exam are stored in separate, independent records with a unique constraint `(student_id, subject_id, exam_id, academic_session_id)`.
   - Never averaged or overwritten across examination terms.
5. **Decoupled Result Calculation Service**:
   - `ResultCalculationService` computes Totals, Percentages, Result Status (`PASS`, `FAIL`, `PENDING`), Grades (CBSE 8-point), and Divisions (1st, 2nd, 3rd).
   - If any required subject marks are missing, result is marked as `PENDING` with diagnostics identifying missing subjects.
   - All rules, passing percentages, and grace marks are stored in database configuration and editable via Admin UI.
6. **Role-Based Access Control (RBAC) with Strict Backend Enforcement**:
   - **SUPER_ADMIN**: Full system, school settings, sessions, users, and audit logs.
   - **PRINCIPAL**: Academic oversight, all classes, student profiles, report cards.
   - **CLASS_TEACHER**: Strictly restricted to their assigned class. Attempting to modify marks for other classes triggers `403 Forbidden` at the API layer.
   - **VIEW_ALL_RESULTS Permission**: Allows viewing all class results while restricting mark modifications strictly to assigned class.
7. **Dynamic Report Card & PDF Generation**:
   - Reusable `<ReportCard />` dynamic component.
   - A4 Portrait printing layout with `@media print` CSS rules (zero overflow, print-friendly borders).
   - High-fidelity backend vector PDF generation powered by **ReportLab** (`/api/v1/report-cards/{student_id}/{exam_id}/pdf`).
   - Signature boxes for **Class Teacher**, **Principal**, and **School Seal** remain **strictly BLANK** for physical stamp and signature application.
8. **Real Data Import & Data Replacement**:
   - CSV importer with pre-validation (validates required fields, format, duplicate scholar/admission numbers).
   - Safe wipe utility for purging dummy student and mark records before importing real school data.
9. **Audit Logging**:
   - Every mark entry, mark update, student change, and settings modification is recorded in `audit_logs` with timestamp, user, action, and old/new values.

---

## Demo Login Credentials

| Role | Username | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin` | `AdminPassword123!` | Full administrative access & configuration |
| **Principal** | `principal` | `PrincipalPassword123!` | View all classes, students, results & report cards |
| **Class Teacher (Class 5)** | `teacher5` | `TeacherPassword123!` | Enter and edit marks for Class 5 only (Class 6 is 403 Forbidden) |
| **Class Teacher (Class 6)** | `teacher6` | `TeacherPassword123!` | Assigned to Class 6 with `VIEW_ALL_RESULTS` (can view all classes, only update Class 6) |

---

## Quick Start: Local Offline Mode (Zero Setup)

On any local school Windows PC without requiring Docker or external PostgreSQL:

1. Double-click **`start-offline.bat`** (or run `python -m uvicorn app.main:app` in `backend` and `npm run dev` in `frontend`).
2. The browser will open to `http://localhost:5173`.
3. The database automatically initializes SQLite (`school.db`) and seeds all 120 students and initial marks on first startup.

### Manual Local Commands

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

- **Frontend Portal**: http://localhost:5173
- **Backend Swagger API Docs**: http://127.0.0.1:8000/docs

---

## Online Cloud Deployment (Docker + PostgreSQL)

To deploy to any cloud VPS (Ubuntu, Debian, AWS, DigitalOcean, etc.):

```bash
# Run with Docker Compose
docker compose up -d --build
```

Services started:
- **PostgreSQL 16**: Port 5432 with persistent volume `pgdata`
- **FastAPI Backend**: Port 8000
- **React Frontend (Nginx)**: Port 80

---

## Automated Test Verification

Run the pytest suite to verify all business rules, student counts, independent marks, and RBAC restrictions:

```bash
python -m pytest backend/tests/ -v
```

Tests included:
1. `test_seed_classes_count`: Validates 12 classes exist.
2. `test_seed_students_count`: Validates exactly 120 dummy students exist (10 per class), zero duplicate scholar/admission numbers.
3. `test_seed_examinations_count`: Validates Half-Yearly and Annual exams exist.
4. `test_marks_independence`: Verifies exam marks are independent records.
5. `test_login_authentication`: Validates JWT token issuance and password hashing.
6. `test_rbac_teacher_class_restriction`: Teacher 5 attempting to update Class 6 marks returns **403 Forbidden**.
7. `test_rbac_view_all_results_permission`: Teacher 6 with `VIEW_ALL_RESULTS` viewing Class 5 is **200 OK**, but updating Class 5 is **403 Forbidden**.
8. `test_report_card_pdf_generation`: Validates ReportLab generates valid `%PDF-` binary.

---

## Exact Locations for Future Customizations

When the school provides real school details, actual formulas, and sample report cards:

| Customization Requirement | Files / Locations to Change | Description |
|---|---|---|
| **Actual School Information & Logo** | 1. In Portal: Navigate to **School Settings** (`/settings`)<br/>2. Backend: `backend/app/models/__init__.py` (`SchoolSetting`)<br/>3. Seed: `backend/app/services/seed_service.py` | Update School Name, Address, DISE Code, Institute Code, Principal, Logo, Contact. |
| **Actual Result Formula & Passing Rules** | 1. In Portal: Navigate to **School Settings -> Result Formula**<br/>2. Backend: `backend/app/services/result_calculation_service.py` | Configure pass percentages, subject minimums, grace marks, grade boundaries, or custom formulas. |
| **Actual Report Card Layout** | 1. Frontend: `frontend/src/components/ReportCard.tsx`<br/>2. Backend PDF: `backend/app/services/pdf_service.py` | Update table layout, header text, or field arrangement to match the school's sample format. |
| **Import Real Students** | 1. In Portal: Navigate to **Students -> Import Real Data (CSV)**<br/>2. Endpoint: `POST /api/v1/import/commit` | Download CSV template, fill in real students, and preview/import. Dummy data can be cleared with one click. |
| **Actual Teachers & Assignments** | In Portal: Navigate to **Teachers & Assignments** (`/teachers`) | Add real faculty members and assign them as Class Teachers or Subject Teachers. |
