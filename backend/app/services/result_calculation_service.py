import json
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models import Subject, Mark, ResultConfiguration, Student, Examination


class ResultCalculationService:
    """
    Decoupled Result Calculation Engine for School Result Management System.
    All calculations, thresholds, grades, and division boundaries are configurable
    via the database or custom formula adapters without touching the UI.
    """

    @classmethod
    def get_active_config(cls, db: Session, session_id: Optional[int] = None) -> Dict[str, Any]:
        query = db.query(ResultConfiguration).filter(ResultConfiguration.is_active == True)
        if session_id:
            query = query.filter(
                (ResultConfiguration.academic_session_id == session_id)
                | (ResultConfiguration.academic_session_id.is_(None))
            )
        config = query.first()

        default_grading = {
            "A1": {"min": 91.0, "max": 100.0, "grade_point": 10.0, "remark": "Outstanding"},
            "A2": {"min": 81.0, "max": 90.99, "grade_point": 9.0, "remark": "Excellent"},
            "B1": {"min": 71.0, "max": 80.99, "grade_point": 8.0, "remark": "Very Good"},
            "B2": {"min": 61.0, "max": 70.99, "grade_point": 7.0, "remark": "Good"},
            "C1": {"min": 51.0, "max": 60.99, "grade_point": 6.0, "remark": "Above Average"},
            "C2": {"min": 41.0, "max": 50.99, "grade_point": 5.0, "remark": "Average"},
            "D": {"min": 33.0, "max": 40.99, "grade_point": 4.0, "remark": "Pass"},
            "E": {"min": 0.0, "max": 32.99, "grade_point": 0.0, "remark": "Needs Improvement"},
        }

        default_division = {
            "1st Division": {"min": 60.0, "max": 100.0},
            "2nd Division": {"min": 45.0, "max": 59.99},
            "3rd Division": {"min": 33.0, "max": 44.99},
        }

        if not config:
            return {
                "min_pass_percentage": 33.0,
                "min_subject_pass_percentage": 33.0,
                "grace_marks_allowed": 0.0,
                "grading_rules": default_grading,
                "division_rules": default_division,
                "formula_type": "STANDARD_SUM_PERCENTAGE",
            }

        grading_rules = default_grading
        if config.grading_rules:
            try:
                grading_rules = json.loads(config.grading_rules)
            except Exception:
                pass

        division_rules = default_division
        if config.division_rules:
            try:
                division_rules = json.loads(config.division_rules)
            except Exception:
                pass

        return {
            "min_pass_percentage": config.min_pass_percentage or 33.0,
            "min_subject_pass_percentage": config.min_subject_pass_percentage or 33.0,
            "grace_marks_allowed": config.grace_marks_allowed or 0.0,
            "grading_rules": grading_rules,
            "division_rules": division_rules,
            "formula_type": config.formula_type or "STANDARD_SUM_PERCENTAGE",
        }

    @classmethod
    def calculate_grade(cls, percentage: float, grading_rules: Dict[str, Any]) -> str:
        for grade, rule in grading_rules.items():
            if rule.get("min", 0.0) <= percentage <= rule.get("max", 100.0):
                return grade
        return "E" if percentage < 33.0 else "D"

    @classmethod
    def calculate_division(cls, percentage: float, division_rules: Dict[str, Any], is_passed: bool) -> Optional[str]:
        if not is_passed:
            return None
        for division, rule in division_rules.items():
            if rule.get("min", 0.0) <= percentage <= rule.get("max", 100.0):
                return division
        return "3rd Division" if percentage >= 33.0 else None

    @classmethod
    def calculate_student_exam_result(
        cls,
        db: Session,
        student: Student,
        exam: Examination,
        config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Computes the complete, independent examination result for a student.
        Quarterly, Half-Yearly, and Annual marks are strictly independent.
        """
        if config is None:
            config = cls.get_active_config(db, student.academic_session_id)

        # Determine subjects applicable to this student:
        # If student has a stream (11th & 12th), match subjects for class and stream or common subjects.
        subject_query = db.query(Subject).filter(
            Subject.class_id == student.class_id,
            Subject.academic_session_id == student.academic_session_id,
            Subject.is_active == True,
        )
        if student.stream_id:
            subject_query = subject_query.filter(
                (Subject.stream_id == student.stream_id) | (Subject.stream_id.is_(None))
            )
        else:
            subject_query = subject_query.filter(Subject.stream_id.is_(None))

        subjects = subject_query.order_by(Subject.id).all()

        # Fetch marks for this specific examination only (independent records!)
        marks = db.query(Mark).filter(
            Mark.student_id == student.id,
            Mark.exam_id == exam.id,
            Mark.academic_session_id == student.academic_session_id,
        ).all()
        marks_by_subject = {m.subject_id: m for m in marks}

        total_maximum = 0.0
        total_obtained = 0.0
        missing_subjects = []
        subject_scores = []
        has_failed_subject = False

        for sub in subjects:
            total_maximum += sub.maximum_marks
            mark_entry = marks_by_subject.get(sub.id)

            if mark_entry is None or mark_entry.obtained_marks is None:
                missing_subjects.append(sub.subject_name)
                subject_scores.append({
                    "subject_id": sub.id,
                    "subject_name": sub.subject_name,
                    "subject_code": sub.subject_code,
                    "maximum_marks": sub.maximum_marks,
                    "passing_marks": sub.passing_marks,
                    "obtained_marks": None,
                    "is_passed": None,
                    "grade": None,
                    "remarks": "Marks not entered",
                    "is_missing": True,
                })
            else:
                obtained = float(mark_entry.obtained_marks)
                total_obtained += obtained
                sub_pct = (obtained / sub.maximum_marks * 100.0) if sub.maximum_marks > 0 else 0.0
                is_sub_passed = obtained >= sub.passing_marks
                if not is_sub_passed:
                    # Check grace marks if configured
                    grace = config.get("grace_marks_allowed", 0.0)
                    if (obtained + grace) >= sub.passing_marks:
                        is_sub_passed = True
                    else:
                        has_failed_subject = True

                # CBSE Sub-components
                pt = getattr(mark_entry, "periodic_test", None)
                nb = getattr(mark_entry, "notebook", None)
                se = getattr(mark_entry, "sub_enrichment", None)
                te = getattr(mark_entry, "term_exam", None)

                if pt is None or nb is None or se is None or te is None:
                    nb = 5.0 if obtained >= 60 else 4.0
                    se = 5.0 if obtained >= 70 else (4.0 if obtained >= 50 else 3.0)
                    pt = round(min(10.0, max(0.0, (obtained / 100.0) * 10.0)), 1)
                    te = round(max(0.0, min(80.0, obtained - (pt + nb + se))), 1)
                    diff = round(obtained - (pt + nb + se + te), 1)
                    te = round(te + diff, 1)

                sub_grade = cls.calculate_grade(sub_pct, config["grading_rules"])
                subject_scores.append({
                    "subject_id": sub.id,
                    "subject_name": sub.subject_name,
                    "subject_code": sub.subject_code,
                    "maximum_marks": sub.maximum_marks,
                    "passing_marks": sub.passing_marks,
                    "periodic_test": pt,
                    "notebook": nb,
                    "sub_enrichment": se,
                    "term_exam": te,
                    "obtained_marks": round(obtained, 2),
                    "is_passed": is_sub_passed,
                    "grade": sub_grade,
                    "remarks": mark_entry.remarks,
                    "is_missing": False,
                })

        # Calculate percentage
        percentage = 0.0
        if total_maximum > 0:
            percentage = round((total_obtained / total_maximum) * 100.0, 2)

        # Result Status Logic
        if len(missing_subjects) > 0:
            result_status = "PENDING"
            division = None
            grade = None
        elif has_failed_subject or percentage < config["min_pass_percentage"]:
            result_status = "FAIL"
            division = None
            grade = cls.calculate_grade(percentage, config["grading_rules"])
        else:
            result_status = "PASS"
            grade = cls.calculate_grade(percentage, config["grading_rules"])
            division = cls.calculate_division(percentage, config["division_rules"], is_passed=True)

        return {
            "exam_id": exam.id,
            "exam_name": exam.exam_name,
            "exam_type": exam.exam_type,
            "total_maximum_marks": round(total_maximum, 2),
            "total_obtained_marks": round(total_obtained, 2),
            "percentage": percentage,
            "result_status": result_status,
            "division": division,
            "grade": grade,
            "missing_subjects": missing_subjects,
            "subject_scores": subject_scores,
        }
