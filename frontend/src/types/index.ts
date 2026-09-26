export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string[];
  permissions: string[];
  teacher_id?: number | null;
  assigned_class_ids: number[];
}

export interface SchoolSetting {
  id: number;
  school_name: string;
  affiliation_no?: string | null;
  school_code?: string | null;
  address: string;
  city_office?: string | null;
  city: string;
  state: string;
  country: string;
  institute_code: string;
  dise_code: string;
  principal_name: string;
  contact_number: string;
  email: string;
  website: string;
  logo_url?: string | null;
  report_card_header_text?: string | null;
  is_demo: boolean;
}

export interface AcademicSession {
  id: number;
  session_name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  is_archived: boolean;
}

export interface ClassEntity {
  id: number;
  class_name: string;
  numeric_order: number;
  description?: string | null;
  is_active: boolean;
  student_count?: number;
}

export interface StreamEntity {
  id: number;
  stream_name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
}

export interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  short_name?: string | null;
  class_id: number;
  stream_id?: number | null;
  academic_session_id: number;
  subject_type: string;
  maximum_marks: number;
  passing_marks: number;
  is_active: boolean;
  class_name?: string | null;
  stream_name?: string | null;
}

export interface Student {
  id: number;
  admission_number: string;
  scholar_number: string;
  roll_number: number;
  student_name: string;
  father_name: string;
  mother_name: string;
  date_of_birth: string;
  gender: string;
  contact_number?: string | null;
  address?: string | null;
  class_id: number;
  stream_id?: number | null;
  academic_session_id: number;
  student_status: string;
  date_of_admission?: string | null;
  attendance?: string | null;
  promoted_to_class?: string | null;
  teacher_remarks?: string | null;
  class_name?: string | null;
  stream_name?: string | null;
  session_name?: string | null;
}

export interface Teacher {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string | null;
  qualification?: string | null;
  designation?: string | null;
  is_active: boolean;
  user_id?: number | null;
  assigned_classes: string[];
}

export interface TeacherAssignment {
  id: number;
  teacher_id: number;
  teacher_name: string;
  class_id: number;
  class_name: string;
  subject_id?: number | null;
  subject_name?: string | null;
  assignment_type: string;
  is_active: boolean;
}

export interface Examination {
  id: number;
  exam_name: string;
  exam_type: string;
  academic_session_id: number;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  is_active: boolean;
  session_name?: string | null;
}

export interface MarkRow {
  mark_id?: number | null;
  student_id: number;
  roll_number: number;
  scholar_number: string;
  student_name: string;
  maximum_marks: number;
  obtained_marks?: number | null;
  remarks?: string | null;
}

export interface MarkGrid {
  academic_session_id: number;
  class_id: number;
  class_name: string;
  exam_id: number;
  exam_name: string;
  subject_id: number;
  subject_name: string;
  maximum_marks: number;
  passing_marks: number;
  students: MarkRow[];
}

export interface SubjectScore {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  maximum_marks: number;
  passing_marks: number;
  periodic_test?: number | null;
  notebook?: number | null;
  sub_enrichment?: number | null;
  term_exam?: number | null;
  obtained_marks?: number | null;
  is_passed?: boolean | null;
  grade?: string | null;
  remarks?: string | null;
  is_missing: boolean;
}

export interface TermAssessment {
  exam_id: number;
  exam_name: string;
  term_label: string;
  exam_column_label: string;
  subjects: SubjectScore[];
  total_maximum_marks: number;
  total_obtained_marks: number;
  percentage: number;
  grade?: string | null;
}

export interface CoScholasticItem {
  name: string;
  grade_term1: string;
  grade_term2: string;
}

export interface DisciplineItem {
  name: string;
  grade_term1: string;
  grade_term2: string;
}

export interface GradingScaleRange {
  range_str: string;
  grade: string;
}

export interface ExamResultSummary {
  exam_id: number;
  exam_name: string;
  exam_type: string;
  total_maximum_marks: number;
  total_obtained_marks: number;
  percentage: number;
  result_status: string;
  division?: string | null;
  grade?: string | null;
  missing_subjects: string[];
  subject_scores: SubjectScore[];
}

export interface ClassResultItem {
  student_id: number;
  roll_number: number;
  scholar_number: string;
  student_name: string;
  stream_name?: string | null;
  total_maximum_marks: number;
  total_obtained_marks: number;
  percentage: number;
  result_status: string;
  division?: string | null;
  grade?: string | null;
  missing_subjects_count: number;
}

export interface ClassResultStats {
  total_students: number;
  passed_count: number;
  failed_count: number;
  pending_count: number;
  average_percentage: number;
  highest_percentage: number;
  lowest_percentage: number;
}

export interface ClassResultResponse {
  class_id: number;
  class_name: string;
  exam_id: number;
  exam_name: string;
  academic_session_id: number;
  session_name: string;
  stats: ClassResultStats;
  results: ClassResultItem[];
}

export interface StudentResultProfile {
  student: Student;
  school: SchoolSetting;
  exams: ExamResultSummary[];
}

export interface ReportCardData {
  school: SchoolSetting;
  session: AcademicSession;
  student: Student;
  exam: Examination;
  term_1?: TermAssessment | null;
  term_2?: TermAssessment | null;
  co_scholastic?: CoScholasticItem[];
  discipline?: DisciplineItem[];
  attendance?: string;
  class_teacher_remark?: string;
  promoted_to_class?: string;
  date_str?: string;
  grading_scale?: GradingScaleRange[];
  subject_scores: SubjectScore[];
  total_maximum_marks: number;
  total_obtained_marks: number;
  percentage: number;
  result_status: string;
  division?: string | null;
  grade?: string | null;
  missing_subjects: string[];
  generated_at: string;
}

export interface ResultConfig {
  id: number;
  min_pass_percentage: number;
  min_subject_pass_percentage: number;
  grace_marks_allowed: number;
  grading_rules: Record<string, any>;
  division_rules: Record<string, any>;
  formula_type: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  username?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  ip_address?: string | null;
  created_at: string;
}
