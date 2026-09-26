from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime, date


# ==============================
# AUTH SCHEMAS
# ==============================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    roles: List[str] = []
    permissions: List[str] = []


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    roles: List[str]
    permissions: List[str]
    teacher_id: Optional[int] = None
    assigned_class_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


# ==============================
# SCHOOL & SESSION SCHEMAS
# ==============================
class SchoolSettingBase(BaseModel):
    school_name: str
    affiliation_no: Optional[str] = "1030183"
    school_code: Optional[str] = "50161"
    address: str
    city_office: Optional[str] = "City Office : Baikunthdham, (Near Anand Bazaar), Indore - 452018 Phone : (0731) 2561192, 7415061192"
    city: str
    state: str
    country: str
    institute_code: str
    dise_code: str
    principal_name: str
    contact_number: str
    email: str
    website: str
    logo_url: Optional[str] = None
    report_card_header_text: Optional[str] = "Report Card : Annual Exam"
    is_demo: bool = True


class SchoolSettingUpdate(BaseModel):
    school_name: Optional[str] = None
    affiliation_no: Optional[str] = None
    school_code: Optional[str] = None
    address: Optional[str] = None
    city_office: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    institute_code: Optional[str] = None
    dise_code: Optional[str] = None
    principal_name: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    report_card_header_text: Optional[str] = None
    is_demo: Optional[bool] = None


class SchoolSettingResponse(SchoolSettingBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AcademicSessionBase(BaseModel):
    session_name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = False
    is_archived: bool = False


class AcademicSessionCreate(AcademicSessionBase):
    pass


class AcademicSessionResponse(AcademicSessionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==============================
# CLASS & STREAM SCHEMAS
# ==============================
class ClassResponse(BaseModel):
    id: int
    class_name: str
    numeric_order: int
    description: Optional[str] = None
    is_active: bool
    student_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class StreamResponse(BaseModel):
    id: int
    stream_name: str
    code: str
    description: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ==============================
# SUBJECT SCHEMAS
# ==============================
class SubjectBase(BaseModel):
    subject_code: str
    subject_name: str
    short_name: Optional[str] = None
    class_id: int
    stream_id: Optional[int] = None
    academic_session_id: int
    subject_type: str = "THEORY"
    maximum_marks: float = 100.0
    passing_marks: float = 33.0
    is_active: bool = True


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    subject_name: Optional[str] = None
    short_name: Optional[str] = None
    maximum_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    is_active: Optional[bool] = None


class SubjectResponse(SubjectBase):
    id: int
    class_name: Optional[str] = None
    stream_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==============================
# STUDENT SCHEMAS
# ==============================
class StudentBase(BaseModel):
    admission_number: str
    scholar_number: str
    roll_number: int
    student_name: str
    father_name: str
    mother_name: str
    date_of_birth: str
    gender: str
    contact_number: Optional[str] = None
    address: Optional[str] = None
    class_id: int
    stream_id: Optional[int] = None
    academic_session_id: int
    student_status: str = "ACTIVE"
    date_of_admission: Optional[str] = None
    attendance: Optional[str] = "224/ 241"
    promoted_to_class: Optional[str] = None
    teacher_remarks: Optional[str] = "Excellent! Keep up the good work!"


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    roll_number: Optional[int] = None
    student_name: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    class_id: Optional[int] = None
    stream_id: Optional[int] = None
    student_status: Optional[str] = None


class StudentResponse(StudentBase):
    id: int
    class_name: Optional[str] = None
    stream_name: Optional[str] = None
    session_name: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StudentListResponse(BaseModel):
    total: int
    students: List[StudentResponse]


# ==============================
# TEACHER SCHEMAS
# ==============================
class TeacherBase(BaseModel):
    employee_code: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    qualification: Optional[str] = None
    designation: Optional[str] = "Teacher"
    is_active: bool = True


class TeacherCreate(TeacherBase):
    user_id: Optional[int] = None


class TeacherResponse(TeacherBase):
    id: int
    user_id: Optional[int] = None
    assigned_classes: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class TeacherAssignmentCreate(BaseModel):
    teacher_id: int
    class_id: int
    subject_id: Optional[int] = None
    academic_session_id: int
    assignment_type: str = "CLASS_TEACHER"


class TeacherAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    teacher_name: str
    class_id: int
    class_name: str
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    assignment_type: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ==============================
# EXAMINATION SCHEMAS
# ==============================
class ExaminationBase(BaseModel):
    exam_name: str
    exam_type: str
    academic_session_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str = "COMPLETED"
    is_active: bool = True


class ExaminationCreate(ExaminationBase):
    pass


class ExaminationResponse(ExaminationBase):
    id: int
    session_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==============================
# MARKS SCHEMAS
# ==============================
class MarkItem(BaseModel):
    student_id: int
    obtained_marks: float
    remarks: Optional[str] = None


class BulkMarksEntryRequest(BaseModel):
    academic_session_id: int
    class_id: int
    exam_id: int
    subject_id: int
    marks: List[MarkItem]


class MarkRowResponse(BaseModel):
    mark_id: Optional[int] = None
    student_id: int
    roll_number: int
    scholar_number: str
    student_name: str
    maximum_marks: float
    obtained_marks: Optional[float] = None
    remarks: Optional[str] = None


class MarkGridResponse(BaseModel):
    academic_session_id: int
    class_id: int
    class_name: str
    exam_id: int
    exam_name: str
    subject_id: int
    subject_name: str
    maximum_marks: float
    passing_marks: float
    students: List[MarkRowResponse]


# ==============================
# RESULT & REPORT CARD SCHEMAS
# ==============================
class SubjectScore(BaseModel):
    subject_id: int
    subject_name: str
    subject_code: str
    maximum_marks: float
    passing_marks: float
    periodic_test: Optional[float] = None
    notebook: Optional[float] = None
    sub_enrichment: Optional[float] = None
    term_exam: Optional[float] = None
    obtained_marks: Optional[float] = None
    is_passed: Optional[bool] = None
    grade: Optional[str] = None
    remarks: Optional[str] = None
    is_missing: bool = False


class TermAssessment(BaseModel):
    exam_id: int
    exam_name: str
    term_label: str  # "Term I (100 marks)" or "Term II (100 marks)"
    exam_column_label: str  # "Half Yearly Exam" or "Annual Exam"
    subjects: List[SubjectScore]
    total_maximum_marks: float
    total_obtained_marks: float
    percentage: float
    grade: Optional[str] = None


class CoScholasticItem(BaseModel):
    name: str
    grade_term1: str
    grade_term2: str


class DisciplineItem(BaseModel):
    name: str
    grade_term1: str
    grade_term2: str


class GradingScaleRange(BaseModel):
    range_str: str
    grade: str


class ExamResultSummary(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: str
    total_maximum_marks: float
    total_obtained_marks: float
    percentage: float
    result_status: str  # PASS, FAIL, PENDING
    division: Optional[str] = None
    grade: Optional[str] = None
    missing_subjects: List[str] = []
    subject_scores: List[SubjectScore]


class StudentResultProfile(BaseModel):
    student: StudentResponse
    school: SchoolSettingResponse
    exams: List[ExamResultSummary]


class ClassResultItem(BaseModel):
    student_id: int
    roll_number: int
    scholar_number: str
    student_name: str
    stream_name: Optional[str] = None
    total_maximum_marks: float
    total_obtained_marks: float
    percentage: float
    result_status: str
    division: Optional[str] = None
    grade: Optional[str] = None
    missing_subjects_count: int = 0


class ClassResultStats(BaseModel):
    total_students: int
    passed_count: int
    failed_count: int
    pending_count: int
    average_percentage: float
    highest_percentage: float
    lowest_percentage: float


class ClassResultResponse(BaseModel):
    class_id: int
    class_name: str
    exam_id: int
    exam_name: str
    academic_session_id: int
    session_name: str
    stats: ClassResultStats
    results: List[ClassResultItem]


class ReportCardData(BaseModel):
    school: SchoolSettingResponse
    session: AcademicSessionResponse
    student: StudentResponse
    exam: ExaminationResponse
    term_1: Optional[TermAssessment] = None
    term_2: Optional[TermAssessment] = None
    co_scholastic: List[CoScholasticItem] = []
    discipline: List[DisciplineItem] = []
    attendance: str = "224/ 241"
    class_teacher_remark: str = "Excellent! Keep up the good work!"
    promoted_to_class: str = "IX D"
    date_str: str = "March 24, 2023"
    grading_scale: List[GradingScaleRange] = []
    subject_scores: List[SubjectScore]
    total_maximum_marks: float
    total_obtained_marks: float
    percentage: float
    result_status: str
    division: Optional[str] = None
    grade: Optional[str] = None
    missing_subjects: List[str] = []
    generated_at: str


class ResultConfigResponse(BaseModel):
    id: int
    min_pass_percentage: float
    min_subject_pass_percentage: float
    grace_marks_allowed: float
    grading_rules: Dict[str, Any]
    division_rules: Dict[str, Any]
    formula_type: str


class ResultConfigUpdate(BaseModel):
    min_pass_percentage: Optional[float] = None
    min_subject_pass_percentage: Optional[float] = None
    grace_marks_allowed: Optional[float] = None
    grading_rules: Optional[Dict[str, Any]] = None
    division_rules: Optional[Dict[str, Any]] = None


# ==============================
# AUDIT LOG SCHEMAS
# ==============================
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

