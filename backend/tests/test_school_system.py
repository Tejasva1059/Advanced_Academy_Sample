import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models import (
    Student,
    ClassEntity,
    Examination,
    Mark,
    SchoolSetting,
    User,
)
from app.auth.security import create_access_token

client = TestClient(app)


def test_seed_classes_count():
    db = SessionLocal()
    try:
        classes = db.query(ClassEntity).all()
        assert len(classes) == 12, f"Expected exactly 12 classes, got {len(classes)}"
        names = [c.class_name for c in classes]
        for expected in ["1st", "2nd", "5th", "10th", "11th", "12th"]:
            assert expected in names, f"Class {expected} missing"
    finally:
        db.close()


def test_seed_students_count():
    db = SessionLocal()
    try:
        students = db.query(Student).all()
        assert len(students) == 120, f"Expected exactly 120 students, got {len(students)}"

        # Check 10 students per class
        classes = db.query(ClassEntity).all()
        for c in classes:
            c_students = db.query(Student).filter(Student.class_id == c.id).all()
            assert len(c_students) == 10, f"Class {c.class_name} has {len(c_students)} students, expected 10"

        # Check unique admission numbers and scholar numbers
        adm_numbers = [s.admission_number for s in students]
        assert len(adm_numbers) == len(set(adm_numbers)), "Duplicate admission numbers found!"

        sch_numbers = [s.scholar_number for s in students]
        assert len(sch_numbers) == len(set(sch_numbers)), "Duplicate scholar numbers found!"
    finally:
        db.close()


def test_seed_examinations_count():
    db = SessionLocal()
    try:
        exams = db.query(Examination).all()
        assert len(exams) >= 2, f"Expected at least 2 examinations, got {len(exams)}"
        types = [e.exam_type for e in exams]
        assert "QUARTERLY" not in types, "Quarterly exam should not exist"
        assert "HALF_YEARLY" in types
        assert "ANNUAL" in types
    finally:
        db.close()


def test_marks_independence():
    """Verify Half-Yearly and Annual marks are distinct independent records."""
    db = SessionLocal()
    try:
        h_exam = db.query(Examination).filter(Examination.exam_type == "HALF_YEARLY").first()
        a_exam = db.query(Examination).filter(Examination.exam_type == "ANNUAL").first()

        first_student = db.query(Student).filter(Student.roll_number == 1, Student.class_id == 1).first()

        h_marks = db.query(Mark).filter(Mark.student_id == first_student.id, Mark.exam_id == h_exam.id).all()
        a_marks = db.query(Mark).filter(Mark.student_id == first_student.id, Mark.exam_id == a_exam.id).all()

        assert len(h_marks) > 0
        assert len(a_marks) > 0

        # Verify obtained marks differ across exams (independent records)
        h_scores = [m.obtained_marks for m in h_marks]
        a_scores = [m.obtained_marks for m in a_marks]
        assert h_scores != a_scores, "Exam scores should be independent and not identical copies"
    finally:
        db.close()


def test_login_authentication():
    # Admin login
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "AdminPassword123!"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert "SUPER_ADMIN" in data["user"]["roles"]

    # Invalid login
    bad_res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "WrongPassword"})
    assert bad_res.status_code == 401


def test_rbac_teacher_class_restriction():
    """
    CRITICAL TEST CASE:
    Teacher assigned to Class 5 attempts to update Class 6.
    Expected: 403 Forbidden.
    """
    # Login as teacher5
    t5_login = client.post("/api/v1/auth/login", json={"username": "teacher5", "password": "TeacherPassword123!"})
    assert t5_login.status_code == 200
    token5 = t5_login.json()["access_token"]
    headers5 = {"Authorization": f"Bearer {token5}"}

    db = SessionLocal()
    try:
        class6 = db.query(ClassEntity).filter(ClassEntity.class_name == "6th").first()
        student_class6 = db.query(Student).filter(Student.class_id == class6.id).first()
        h_exam = db.query(Examination).filter(Examination.exam_type == "HALF_YEARLY").first()
        subj = db.query(Mark).filter(Mark.student_id == student_class6.id).first().subject_id
    finally:
        db.close()

    payload = {
        "academic_session_id": 1,
        "class_id": class6.id,
        "exam_id": h_exam.id,
        "subject_id": subj,
        "marks": [
            {"student_id": student_class6.id, "obtained_marks": 88.0, "remarks": "Unauthorized test"}
        ]
    }

    # Attempt to update Class 6 marks by Class 5 teacher -> 403 Forbidden!
    resp = client.post("/api/v1/marks/bulk", json=payload, headers=headers5)
    assert resp.status_code == 403, f"Expected 403 Forbidden, got {resp.status_code}: {resp.text}"


def test_rbac_view_all_results_permission():
    """
    CRITICAL TEST CASE:
    Teacher assigned to Class 6 with VIEW_ALL_RESULTS attempts to VIEW Class 5 results:
    Expected: Allowed (200 OK).
    Same teacher attempts to UPDATE Class 5 marks:
    Expected: 403 Forbidden.
    """
    t6_login = client.post("/api/v1/auth/login", json={"username": "teacher6", "password": "TeacherPassword123!"})
    assert t6_login.status_code == 200
    token6 = t6_login.json()["access_token"]
    headers6 = {"Authorization": f"Bearer {token6}"}

    db = SessionLocal()
    try:
        class5 = db.query(ClassEntity).filter(ClassEntity.class_name == "5th").first()
        student_class5 = db.query(Student).filter(Student.class_id == class5.id).first()
        h_exam = db.query(Examination).filter(Examination.exam_type == "HALF_YEARLY").first()
        subj = db.query(Mark).filter(Mark.student_id == student_class5.id).first().subject_id
    finally:
        db.close()

    # 1. View Class 5 results (Allowed because of VIEW_ALL_RESULTS permission)
    view_resp = client.get(
        f"/api/v1/results/class?class_id={class5.id}&exam_id={h_exam.id}&session_id=1",
        headers=headers6,
    )
    assert view_resp.status_code == 200, f"Expected 200 OK for viewing, got {view_resp.status_code}"

    # 2. Attempt to UPDATE Class 5 marks (Forbidden because teacher is only assigned to Class 6!)
    payload = {
        "academic_session_id": 1,
        "class_id": class5.id,
        "exam_id": h_exam.id,
        "subject_id": subj,
        "marks": [
            {"student_id": student_class5.id, "obtained_marks": 75.0, "remarks": "Cross-class edit"}
        ]
    }
    update_resp = client.post("/api/v1/marks/bulk", json=payload, headers=headers6)
    assert update_resp.status_code == 403, f"Expected 403 Forbidden for update, got {update_resp.status_code}"


def test_report_card_pdf_generation():
    """Verify ReportLab produces valid application/pdf binary."""
    admin_login = client.post("/api/v1/auth/login", json={"username": "admin", "password": "AdminPassword123!"})
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        student = db.query(Student).first()
        exam = db.query(Examination).first()
    finally:
        db.close()

    pdf_resp = client.get(f"/api/v1/report-cards/{student.id}/{exam.id}/pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    # PDF begins with standard %PDF magic header
    assert pdf_resp.content.startswith(b"%PDF-"), "Generated file does not have valid PDF magic bytes"
