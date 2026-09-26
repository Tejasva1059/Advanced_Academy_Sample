import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Date,
    Text,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class SchoolSetting(Base):
    __tablename__ = "school_settings"

    id = Column(Integer, primary_key=True, index=True)
    school_name = Column(String(255), nullable=False, default="ADVANCED ACADEMY")
    affiliation_no = Column(String(50), nullable=True, default="1030183")
    school_code = Column(String(50), nullable=True, default="50161")
    address = Column(Text, nullable=False, default="ISKCON Vihar Colony, Nipania Road, Indore - 452010 (M.P.) Contact : 7415666676, 7415666686, 9827720868, 9691125004")
    city_office = Column(Text, nullable=True, default="City Office : Baikunthdham, (Near Anand Bazaar), Indore - 452018 Phone : (0731) 2561192, 7415061192")
    city = Column(String(100), nullable=False, default="Indore")
    state = Column(String(100), nullable=False, default="Madhya Pradesh")
    country = Column(String(100), nullable=False, default="India")
    institute_code = Column(String(50), nullable=False, default="50161")
    dise_code = Column(String(50), nullable=False, default="23000000001")
    principal_name = Column(String(150), nullable=False, default="Dr. Anil Sharma")
    contact_number = Column(String(50), nullable=False, default="7415666676, 7415666686")
    email = Column(String(150), nullable=False, default="advancedindore@gmail.com")
    website = Column(String(150), nullable=False, default="www.advancedacademyindore.com")
    logo_url = Column(Text, nullable=True)
    report_card_header_text = Column(String(255), nullable=True, default="Report Card : Annual Exam")
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AcademicSession(Base):
    __tablename__ = "academic_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_name = Column(String(50), unique=True, nullable=False)  # e.g., "2026-27"
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    students = relationship("Student", back_populates="academic_session")
    subjects = relationship("Subject", back_populates="academic_session")
    examinations = relationship("Examination", back_populates="academic_session")


class ClassEntity(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(50), unique=True, nullable=False)  # e.g., "1st", "2nd", ..., "12th"
    numeric_order = Column(Integer, unique=True, nullable=False)  # 1 to 12
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    students = relationship("Student", back_populates="class_entity")
    subjects = relationship("Subject", back_populates="class_entity")
    teacher_assignments = relationship("TeacherAssignment", back_populates="class_entity")


class StreamEntity(Base):
    __tablename__ = "streams"

    id = Column(Integer, primary_key=True, index=True)
    stream_name = Column(String(50), unique=True, nullable=False)  # "SCIENCE", "COMMERCE", "ARTS"
    code = Column(String(20), unique=True, nullable=False)  # "SCI", "COM", "ART"
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    students = relationship("Student", back_populates="stream_entity")
    subjects = relationship("Subject", back_populates="stream_entity")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(50), nullable=False)
    subject_name = Column(String(100), nullable=False)
    short_name = Column(String(20), nullable=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    stream_id = Column(Integer, ForeignKey("streams.id", ondelete="SET NULL"), nullable=True)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="CASCADE"), nullable=False)
    subject_type = Column(String(50), default="THEORY")  # THEORY, PRACTICAL, COMPOSITE
    maximum_marks = Column(Float, default=100.0)
    passing_marks = Column(Float, default=33.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    class_entity = relationship("ClassEntity", back_populates="subjects")
    stream_entity = relationship("StreamEntity", back_populates="subjects")
    academic_session = relationship("AcademicSession", back_populates="subjects")
    marks = relationship("Mark", back_populates="subject")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    admission_number = Column(String(50), unique=True, nullable=False, index=True)
    scholar_number = Column(String(50), unique=True, nullable=False, index=True)
    roll_number = Column(Integer, nullable=False)
    student_name = Column(String(150), nullable=False, index=True)
    father_name = Column(String(150), nullable=False)
    mother_name = Column(String(150), nullable=False)
    date_of_birth = Column(String(20), nullable=False)  # YYYY-MM-DD
    gender = Column(String(20), nullable=False)  # MALE, FEMALE, OTHER
    contact_number = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="RESTRICT"), nullable=False)
    stream_id = Column(Integer, ForeignKey("streams.id", ondelete="SET NULL"), nullable=True)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="RESTRICT"), nullable=False)
    student_status = Column(String(30), default="ACTIVE")  # ACTIVE, INACTIVE, TRANSFERRED, PASSED, LEFT
    date_of_admission = Column(String(20), nullable=True)
    attendance = Column(String(50), nullable=True, default="224/ 241")
    promoted_to_class = Column(String(50), nullable=True)
    teacher_remarks = Column(String(255), nullable=True, default="Excellent! Keep up the good work!")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    class_entity = relationship("ClassEntity", back_populates="students")
    stream_entity = relationship("StreamEntity", back_populates="students")
    academic_session = relationship("AcademicSession", back_populates="students")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_student_class_roll", "class_id", "roll_number", "academic_session_id"),
    )


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    qualification = Column(String(150), nullable=True)
    designation = Column(String(100), default="Teacher")
    is_active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assignments = relationship("TeacherAssignment", back_populates="teacher", cascade="all, delete-orphan")
    user = relationship("User", back_populates="teacher")


class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="CASCADE"), nullable=False)
    assignment_type = Column(String(50), default="CLASS_TEACHER")  # CLASS_TEACHER, SUBJECT_TEACHER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    teacher = relationship("Teacher", back_populates="assignments")
    class_entity = relationship("ClassEntity", back_populates="teacher_assignments")


class Examination(Base):
    __tablename__ = "examinations"

    id = Column(Integer, primary_key=True, index=True)
    exam_name = Column(String(150), nullable=False)
    exam_type = Column(String(50), nullable=False)  # QUARTERLY, HALF_YEARLY, ANNUAL, UNIT_TEST, etc.
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    status = Column(String(30), default="COMPLETED")  # UPCOMING, ONGOING, COMPLETED, PUBLISHED
    maximum_marks_config = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    academic_session = relationship("AcademicSession", back_populates="examinations")
    marks = relationship("Mark", back_populates="examination", cascade="all, delete-orphan")


class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    exam_id = Column(Integer, ForeignKey("examinations.id", ondelete="CASCADE"), nullable=False)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="CASCADE"), nullable=False)
    maximum_marks = Column(Float, nullable=False, default=100.0)
    periodic_test = Column(Float, nullable=True)    # Periodic Test (Max 10)
    notebook = Column(Float, nullable=True)         # Notebook (Max 5)
    sub_enrichment = Column(Float, nullable=True)   # Subject Enrichment (Max 5)
    term_exam = Column(Float, nullable=True)        # Half-Yearly / Annual Exam (Max 80)
    obtained_marks = Column(Float, nullable=False)  # Total Marks Obtained (Max 100)
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")
    examination = relationship("Examination", back_populates="marks")

    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", "exam_id", "academic_session_id", name="uq_student_subject_exam_session"),
        Index("ix_marks_lookup", "student_id", "exam_id"),
        Index("ix_marks_class_exam", "class_id", "exam_id", "subject_id"),
    )


class ResultConfiguration(Base):
    __tablename__ = "result_configurations"

    id = Column(Integer, primary_key=True, index=True)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="SET NULL"), nullable=True)
    min_pass_percentage = Column(Float, default=33.0)
    min_subject_pass_percentage = Column(Float, default=33.0)
    grace_marks_allowed = Column(Float, default=0.0)
    grading_rules = Column(Text, nullable=True)  # JSON string
    division_rules = Column(Text, nullable=True)  # JSON string
    formula_type = Column(String(50), default="STANDARD_SUM_PERCENTAGE")
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    teacher = relationship("Teacher", back_populates="user", uselist=False)
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # SUPER_ADMIN, PRINCIPAL, CLASS_TEACHER
    description = Column(String(255), nullable=True)

    user_roles = relationship("UserRole", back_populates="role")
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # e.g., "VIEW_ALL_RESULTS", "MANAGE_MARKS"
    description = Column(String(255), nullable=True)

    role_permissions = relationship("RolePermission", back_populates="permission")


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)

    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False)  # e.g. "MARKS_ENTERED", "SETTINGS_UPDATED"
    entity = Column(String(100), nullable=False)  # e.g. "Mark", "Student", "SchoolSetting"
    entity_id = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
