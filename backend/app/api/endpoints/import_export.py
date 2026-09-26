import io
import csv
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import Student, ClassEntity, StreamEntity, AcademicSession, Mark, User
from app.auth.dependencies import require_role
from app.services.audit_service import log_audit

router = APIRouter(prefix="/import", tags=["Data Import & Migration"])


@router.get("/template")
def download_student_template():
    """Returns a CSV template for importing real school students."""
    headers = [
        "student_name", "admission_number", "scholar_number", "roll_number",
        "father_name", "mother_name", "date_of_birth", "gender",
        "contact_number", "address", "class_name", "stream_code",
    ]
    sample_row = [
        "Rohan Gupta", "ADM-2026-901", "SCH-20001", "1",
        "Suresh Gupta", "Meena Gupta", "2015-05-12", "MALE",
        "+91 98765 43210", "12 Park Lane, Indore", "5th", "",
    ]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerow(sample_row)

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="student_import_template.csv"'},
    )


@router.post("/preview")
async def preview_student_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Dict[str, Any]:
    """
    Parses and validates uploaded CSV before committing to database.
    Checks required fields, existing duplicates, and valid classes.
    """
    contents = await file.read()
    decoded = contents.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(decoded))

    classes = {c.class_name.lower(): c.id for c in db.query(ClassEntity).all()}
    streams = {s.code.lower(): s.id for s in db.query(StreamEntity).all()}

    existing_admissions = set(r[0] for r in db.query(Student.admission_number).all())
    existing_scholars = set(r[0] for r in db.query(Student.scholar_number).all())

    active_session = db.query(AcademicSession).filter(AcademicSession.is_active == True).first()
    session_id = active_session.id if active_session else 1

    valid_records = []
    invalid_records = []

    file_admissions = set()
    file_scholars = set()

    for idx, row in enumerate(reader, start=2):
        row_errors = []

        name = row.get("student_name", "").strip()
        adm = row.get("admission_number", "").strip()
        sch = row.get("scholar_number", "").strip()
        roll_raw = row.get("roll_number", "").strip()
        cname = row.get("class_name", "").strip().lower()
        stream_code = row.get("stream_code", "").strip().lower()

        if not name:
            row_errors.append("Student Name is required")
        if not adm:
            row_errors.append("Admission Number is required")
        if not sch:
            row_errors.append("Scholar Number is required")

        roll = None
        try:
            roll = int(roll_raw)
            if roll <= 0:
                row_errors.append("Roll number must be a positive integer")
        except Exception:
            row_errors.append("Roll number must be a valid number")

        if cname not in classes:
            row_errors.append(f"Class '{cname}' not found. Valid classes: {list(classes.keys())}")

        if adm in existing_admissions:
            row_errors.append(f"Admission Number '{adm}' already exists in database")
        if adm in file_admissions:
            row_errors.append(f"Duplicate Admission Number '{adm}' in uploaded file")
        file_admissions.add(adm)

        if sch in existing_scholars:
            row_errors.append(f"Scholar Number '{sch}' already exists in database")
        if sch in file_scholars:
            row_errors.append(f"Duplicate Scholar Number '{sch}' in uploaded file")
        file_scholars.add(sch)

        stream_id = streams.get(stream_code) if stream_code else None

        record_data = {
            "row_index": idx,
            "student_name": name,
            "admission_number": adm,
            "scholar_number": sch,
            "roll_number": roll,
            "father_name": row.get("father_name", "").strip(),
            "mother_name": row.get("mother_name", "").strip(),
            "date_of_birth": row.get("date_of_birth", "2015-01-01").strip(),
            "gender": row.get("gender", "MALE").strip().upper(),
            "contact_number": row.get("contact_number", "").strip(),
            "address": row.get("address", "").strip(),
            "class_id": classes.get(cname),
            "class_name": row.get("class_name", "").strip(),
            "stream_id": stream_id,
            "academic_session_id": session_id,
        }

        if row_errors:
            invalid_records.append({**record_data, "errors": row_errors})
        else:
            valid_records.append(record_data)

    return {
        "total_rows": len(valid_records) + len(invalid_records),
        "valid_count": len(valid_records),
        "invalid_count": len(invalid_records),
        "valid_records": valid_records,
        "invalid_records": invalid_records,
    }


@router.post("/commit")
def commit_student_import(
    records: List[Dict[str, Any]],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Dict[str, Any]:
    """Inserts verified student records into the database."""
    inserted = 0
    for r in records:
        st = Student(
            student_name=r["student_name"],
            admission_number=r["admission_number"],
            scholar_number=r["scholar_number"],
            roll_number=r["roll_number"],
            father_name=r.get("father_name", ""),
            mother_name=r.get("mother_name", ""),
            date_of_birth=r.get("date_of_birth", "2015-01-01"),
            gender=r.get("gender", "MALE"),
            contact_number=r.get("contact_number"),
            address=r.get("address"),
            class_id=r["class_id"],
            stream_id=r.get("stream_id"),
            academic_session_id=r["academic_session_id"],
            student_status="ACTIVE",
            date_of_admission="2026-04-01",
        )
        db.add(st)
        inserted += 1

    db.commit()

    log_audit(
        db=db,
        action="STUDENTS_BULK_IMPORTED",
        entity="Student",
        entity_id=None,
        new_value=f"Imported {inserted} real students from CSV",
        user_id=current_user.id,
        username=current_user.username,
    )

    return {"message": f"Successfully imported {inserted} students", "inserted_count": inserted}


@router.post("/clear-dummy-students")
def clear_dummy_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
) -> Dict[str, Any]:
    """Allows Super Admin to wipe dummy students and marks to prepare for real school data."""
    deleted_marks = db.query(Mark).delete()
    deleted_students = db.query(Student).delete()
    db.commit()

    log_audit(
        db=db,
        action="DUMMY_DATA_CLEARED",
        entity="Student/Mark",
        entity_id=None,
        old_value=f"Deleted {deleted_students} students, {deleted_marks} marks",
        user_id=current_user.id,
        username=current_user.username,
    )

    return {
        "message": f"Cleared {deleted_students} students and {deleted_marks} marks records.",
        "deleted_students": deleted_students,
        "deleted_marks": deleted_marks,
    }
