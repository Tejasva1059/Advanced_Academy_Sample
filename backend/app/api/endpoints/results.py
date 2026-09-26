import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import (
    Student,
    ClassEntity,
    Examination,
    AcademicSession,
    SchoolSetting,
    ResultConfiguration,
    User,
)
from app.schemas import (
    ClassResultResponse,
    ClassResultItem,
    ClassResultStats,
    StudentResultProfile,
    StudentResponse,
    SchoolSettingResponse,
    ExamResultSummary,
    ResultConfigResponse,
    ResultConfigUpdate,
)
from app.auth.dependencies import get_current_user, check_teacher_class_access, require_role
from app.services.result_calculation_service import ResultCalculationService
from app.services.audit_service import log_audit

router = APIRouter(prefix="/results", tags=["Results"])


@router.get("/class", response_model=ClassResultResponse)
def get_class_results(
    class_id: int = Query(...),
    exam_id: int = Query(...),
    session_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # Strict Authorization check
    # Class teacher can view only if assigned to this class OR has VIEW_ALL_RESULTS permission
    check_teacher_class_access(current_user, class_id=class_id, is_write=False, db=db)

    class_obj = db.query(ClassEntity).filter(ClassEntity.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    exam_obj = db.query(Examination).filter(Examination.id == exam_id).first()
    if not exam_obj:
        raise HTTPException(status_code=404, detail="Examination not found")

    session_obj = db.query(AcademicSession).filter(AcademicSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Academic Session not found")

    students = db.query(Student).filter(
        Student.class_id == class_id,
        Student.academic_session_id == session_id,
        Student.student_status == "ACTIVE",
    ).order_by(Student.roll_number).all()

    config = ResultCalculationService.get_active_config(db, session_id=session_id)

    results_list = []
    passed_count = 0
    failed_count = 0
    pending_count = 0
    total_pct_sum = 0.0
    highest_pct = 0.0
    lowest_pct = 100.0 if students else 0.0
    evaluated_count = 0

    for st in students:
        res = ResultCalculationService.calculate_student_exam_result(
            db=db,
            student=st,
            exam=exam_obj,
            config=config,
        )

        status = res["result_status"]
        pct = res["percentage"]

        if status == "PASS":
            passed_count += 1
            evaluated_count += 1
            total_pct_sum += pct
            highest_pct = max(highest_pct, pct)
            lowest_pct = min(lowest_pct, pct)
        elif status == "FAIL":
            failed_count += 1
            evaluated_count += 1
            total_pct_sum += pct
            highest_pct = max(highest_pct, pct)
            lowest_pct = min(lowest_pct, pct)
        else:
            pending_count += 1

        results_list.append(ClassResultItem(
            student_id=st.id,
            roll_number=st.roll_number,
            scholar_number=st.scholar_number,
            student_name=st.student_name,
            stream_name=st.stream_entity.stream_name if st.stream_entity else None,
            total_maximum_marks=res["total_maximum_marks"],
            total_obtained_marks=res["total_obtained_marks"],
            percentage=pct,
            result_status=status,
            division=res["division"],
            grade=res["grade"],
            missing_subjects_count=len(res["missing_subjects"]),
        ))

    avg_pct = round(total_pct_sum / evaluated_count, 2) if evaluated_count > 0 else 0.0
    if evaluated_count == 0:
        lowest_pct = 0.0

    stats = ClassResultStats(
        total_students=len(students),
        passed_count=passed_count,
        failed_count=failed_count,
        pending_count=pending_count,
        average_percentage=avg_pct,
        highest_percentage=highest_pct,
        lowest_percentage=lowest_pct,
    )

    return ClassResultResponse(
        class_id=class_obj.id,
        class_name=class_obj.class_name,
        exam_id=exam_obj.id,
        exam_name=exam_obj.exam_name,
        academic_session_id=session_obj.id,
        session_name=session_obj.session_name,
        stats=stats,
        results=results_list,
    )


@router.get("/student/{student_id}", response_model=StudentResultProfile)
def get_student_result_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    st = db.query(Student).filter(Student.id == student_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")

    # Authorize viewing for class
    check_teacher_class_access(current_user, class_id=st.class_id, is_write=False, db=db)

    school = db.query(SchoolSetting).first()
    if not school:
        school = SchoolSetting()

    config = ResultCalculationService.get_active_config(db, session_id=st.academic_session_id)

    # Fetch all examinations for this student's academic session
    exams = db.query(Examination).filter(
        Examination.academic_session_id == st.academic_session_id,
        Examination.is_active == True,
    ).order_by(Examination.id).all()

    exam_results = []
    for ex in exams:
        calc = ResultCalculationService.calculate_student_exam_result(
            db=db,
            student=st,
            exam=ex,
            config=config,
        )
        exam_results.append(ExamResultSummary(
            exam_id=ex.id,
            exam_name=ex.exam_name,
            exam_type=ex.exam_type,
            total_maximum_marks=calc["total_maximum_marks"],
            total_obtained_marks=calc["total_obtained_marks"],
            percentage=calc["percentage"],
            result_status=calc["result_status"],
            division=calc["division"],
            grade=calc["grade"],
            missing_subjects=calc["missing_subjects"],
            subject_scores=calc["subject_scores"],
        ))

    student_resp = StudentResponse(
        id=st.id,
        admission_number=st.admission_number,
        scholar_number=st.scholar_number,
        roll_number=st.roll_number,
        student_name=st.student_name,
        father_name=st.father_name,
        mother_name=st.mother_name,
        date_of_birth=st.date_of_birth,
        gender=st.gender,
        contact_number=st.contact_number,
        address=st.address,
        class_id=st.class_id,
        stream_id=st.stream_id,
        academic_session_id=st.academic_session_id,
        student_status=st.student_status,
        date_of_admission=st.date_of_admission,
        class_name=st.class_entity.class_name if st.class_entity else None,
        stream_name=st.stream_entity.stream_name if st.stream_entity else None,
        session_name=st.academic_session.session_name if st.academic_session else None,
        created_at=st.created_at,
    )

    school_resp = SchoolSettingResponse(
        id=school.id or 1,
        school_name=school.school_name,
        address=school.address,
        city=school.city,
        state=school.state,
        country=school.country,
        institute_code=school.institute_code,
        dise_code=school.dise_code,
        principal_name=school.principal_name,
        contact_number=school.contact_number,
        email=school.email,
        website=school.website,
        logo_url=school.logo_url,
        report_card_header_text=school.report_card_header_text,
        is_demo=school.is_demo,
    )

    return StudentResultProfile(
        student=student_resp,
        school=school_resp,
        exams=exam_results,
    )


@router.get("/config", response_model=ResultConfigResponse)
def get_result_configuration(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    active_cfg = ResultCalculationService.get_active_config(db)
    cfg_record = db.query(ResultConfiguration).first()
    cfg_id = cfg_record.id if cfg_record else 1
    return ResultConfigResponse(
        id=cfg_id,
        min_pass_percentage=active_cfg["min_pass_percentage"],
        min_subject_pass_percentage=active_cfg["min_subject_pass_percentage"],
        grace_marks_allowed=active_cfg["grace_marks_allowed"],
        grading_rules=active_cfg["grading_rules"],
        division_rules=active_cfg["division_rules"],
        formula_type=active_cfg["formula_type"],
    )


@router.put("/config", response_model=ResultConfigResponse)
def update_result_configuration(
    payload: ResultConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
) -> Any:
    cfg = db.query(ResultConfiguration).first()
    if not cfg:
        cfg = ResultConfiguration(formula_type="STANDARD_SUM_PERCENTAGE")
        db.add(cfg)

    if payload.min_pass_percentage is not None:
        cfg.min_pass_percentage = payload.min_pass_percentage
    if payload.min_subject_pass_percentage is not None:
        cfg.min_subject_pass_percentage = payload.min_subject_pass_percentage
    if payload.grace_marks_allowed is not None:
        cfg.grace_marks_allowed = payload.grace_marks_allowed
    if payload.grading_rules is not None:
        cfg.grading_rules = json.dumps(payload.grading_rules)
    if payload.division_rules is not None:
        cfg.division_rules = json.dumps(payload.division_rules)

    db.commit()
    db.refresh(cfg)

    log_audit(
        db=db,
        action="RESULT_CONFIG_UPDATED",
        entity="ResultConfiguration",
        entity_id=str(cfg.id),
        new_value=json.dumps(payload.model_dump(exclude_unset=True)),
        user_id=current_user.id,
        username=current_user.username,
    )

    active_cfg = ResultCalculationService.get_active_config(db)
    return ResultConfigResponse(
        id=cfg.id,
        min_pass_percentage=active_cfg["min_pass_percentage"],
        min_subject_pass_percentage=active_cfg["min_subject_pass_percentage"],
        grace_marks_allowed=active_cfg["grace_marks_allowed"],
        grading_rules=active_cfg["grading_rules"],
        division_rules=active_cfg["division_rules"],
        formula_type=active_cfg["formula_type"],
    )
