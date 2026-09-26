import random
import json
from datetime import date
from sqlalchemy.orm import Session
from app.models import (
    SchoolSetting,
    AcademicSession,
    ClassEntity,
    StreamEntity,
    Subject,
    Student,
    Teacher,
    TeacherAssignment,
    Examination,
    Mark,
    ResultConfiguration,
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
)
from app.auth.security import get_password_hash


CLASS_NAMES = [
    "1st", "2nd", "3rd", "4th", "5th", "6th",
    "7th", "8th", "9th", "10th", "11th", "12th"
]

STUDENT_NAMES_BY_CLASS = {
    "1st": [
        "Aarav Sharma", "Vivaan Patel", "Aditya Verma", "Arjun Gupta", "Rohan Mehta",
        "Kabir Joshi", "Vihaan Singh", "Atharv Jain", "Reyansh Agarwal", "Krishna Mishra"
    ],
    "2nd": [
        "Ananya Sharma", "Diya Patel", "Aadhya Verma", "Myra Gupta", "Sara Mehta",
        "Ishita Joshi", "Navya Singh", "Kiara Jain", "Riya Agarwal", "Avni Mishra"
    ],
    "3rd": [
        "Devansh Kapoor", "Shaurya Malhotra", "Tanmay Bhat", "Dhruv Chawla", "Samar Saxena",
        "Prisha Kapoor", "Anvi Kulkarni", "Ira Deshmukh", "Saanvi Rao", "Aanya Hegde"
    ],
    "4th": [
        "Rudra Trivedi", "Omkar Shinde", "Siddharth Nair", "Yashvardhan Roy", "Manan Sethi",
        "Tanvi Chauhan", "Kavya Pandey", "Bhavna Pillai", "Aparna Menon", "Rupali Bose"
    ],
    "5th": [
        "Ayush Choudhary", "Harshvardhan Rathi", "Kushagra Sen", "Nirvaan Goyal", "Tejas Solanki",
        "Meera Iyer", "Nandini Ghosh", "Pooja Bhatt", "Shruti Nambiar", "Sneha Mukherjee"
    ],
    "6th": [
        "Abhimanyu Rathore", "Bhavik Mittal", "Chaitanya Dixit", "Darsh Singhal", "Eklavya Chauhan",
        "Gauri Bansal", "Hamsika Varma", "Janhavi Kothari", "Lavanya Somani", "Mitali Dalal"
    ],
    "7th": [
        "Nikhil Mahajan", "Ojasvi Kaushik", "Pranav Swaminathan", "Raghav Somani", "Sarthak Bajaj",
        "Palak Agnihotri", "Radhika Khemka", "Siddhi Toshniwal", "Tanya Morarka", "Urvi Daga"
    ],
    "8th": [
        "Utkarsh Agarwal", "Varun Sodhi", "Vidyut Kashyap", "Vyom Poddar", "Yuvraj Sisodia",
        "Vaishnavi Birla", "Vidhi Jalan", "Vrinda Ruia", "Yashasvi Goenka", "Zara Singhania"
    ],
    "9th": [
        "Akshat Biyani", "Bhavesh Oswal", "Chinmay Lodha", "Daksh Dhoot", "Farhan Qureshi",
        "Aditi Bangur", "Anushka Taparia", "Divya Kanoria", "Garima Somani", "Khushi Jhunjhunwala"
    ],
    "10th": [
        "Gautam Thapar", "Hardik Jindal", "Ishaan Munjal", "Jaiveer Piramal", "Kartik Godrej",
        "Mahika Nadar", "Niharika Hinduja", "Paridhi Ambani", "Ridhima Wadia", "Suhani Poonawalla"
    ],
    "11th": [
        "Lakshay Murthy", "Madhav Premji", "Naman Tata", "Pranjal Mittal", "Rachit Bajaj",
        "Tanisha Mahindra", "Urvashi Birla", "Vanshika Godrej", "Yamini Lalbhai", "Zoya Kirloskar"
    ],
    "12th": [
        "Samarth Pai", "Tanveer Burman", "Uday Kotak", "Vedant Marico", "Yash Alkem",
        "Anupama Emami", "Bhavika Torrent", "Chaitali Cipla", "Deepika Lupin", "Esha Sun"
    ],
}

FATHER_NAMES = [
    "Rajesh", "Sanjay", "Manoj", "Alok", "Vikram", "Sunil", "Ramesh", "Deepak", "Anil", "Pankaj"
]

MOTHER_NAMES = [
    "Sunita", "Anita", "Pooja", "Rekha", "Kavita", "Geeta", "Seema", "Shobha", "Meenakshi", "Sangeeta"
]

AVANEESH_T1 = {
    "English": {"pt": 6.7, "nb": 4.0, "se": 4.0, "te": 68.0, "tot": 82.7},
    "Hindi": {"pt": 7.9, "nb": 5.0, "se": 5.0, "te": 64.0, "tot": 81.9},
    "Mathematics": {"pt": 9.8, "nb": 5.0, "se": 5.0, "te": 73.0, "tot": 92.8},
    "Science": {"pt": 9.1, "nb": 5.0, "se": 5.0, "te": 77.0, "tot": 96.1},
    "Social Science": {"pt": 9.9, "nb": 5.0, "se": 5.0, "te": 68.0, "tot": 87.9},
    "Sanskrit/French": {"pt": 9.8, "nb": 5.0, "se": 5.0, "te": 71.0, "tot": 90.8},
    "Computer Sc.": {"pt": 0.0, "nb": 5.0, "se": 5.0, "te": 72.0, "tot": 82.0},
}

AVANEESH_T2 = {
    "English": {"pt": 8.1, "nb": 5.0, "se": 5.0, "te": 65.5, "tot": 83.6},
    "Hindi": {"pt": 9.0, "nb": 5.0, "se": 5.0, "te": 69.5, "tot": 88.5},
    "Mathematics": {"pt": 9.6, "nb": 5.0, "se": 4.0, "te": 73.5, "tot": 92.1},
    "Science": {"pt": 9.5, "nb": 5.0, "se": 5.0, "te": 76.5, "tot": 96.0},
    "Social Science": {"pt": 8.9, "nb": 5.0, "se": 5.0, "te": 72.0, "tot": 90.9},
    "Sanskrit/French": {"pt": 9.3, "nb": 5.0, "se": 5.0, "te": 77.0, "tot": 96.3},
    "Computer Sc.": {"pt": 9.3, "nb": 4.0, "se": 5.0, "te": 78.5, "tot": 96.8},
}


def seed_database(db: Session, force_reset: bool = False):
    """
    Complete idempotent seed pipeline.
    Creates 1 school, 1 active session (2026-27), 12 classes, class-wise subjects,
    streams for 11th & 12th, 120 students (10 per class), 2 examinations (Half-Yearly & Annual),
    independent marks for all 120 students across both exams, roles, permissions,
    and seed users.
    """
    # Fast-path check: If database is already seeded, skip immediately for instantaneous startup
    if db.query(Student).first() and db.query(User).first() and db.query(AcademicSession).first():
        return

    # 1. School Settings
    school = db.query(SchoolSetting).first()
    if not school:
        school = SchoolSetting()
        db.add(school)
    
    school.school_name = "ADVANCED ACADEMY"
    school.affiliation_no = "1030183"
    school.school_code = "50161"
    school.address = "ISKCON Vihar Colony, Nipania Road, Indore - 452010 (M.P.) Contact : 7415666676, 7415666686, 9827720868, 9691125004"
    school.city_office = "City Office : Baikunthdham, (Near Anand Bazaar), Indore - 452018 Phone : (0731) 2561192, 7415061192"
    school.city = "Indore"
    school.state = "Madhya Pradesh"
    school.country = "India"
    school.institute_code = "50161"
    school.dise_code = "23000000001"
    school.principal_name = "Dr. Anil Sharma"
    school.contact_number = "7415666676, 7415666686"
    school.email = "advancedindore@gmail.com"
    school.website = "www.advancedacademyindore.com"
    school.report_card_header_text = "Report Card : Annual Exam"
    school.is_demo = True
    db.commit()

    # 2. Academic Sessions
    session_2026 = db.query(AcademicSession).filter(AcademicSession.session_name == "2026-27").first()
    if not session_2026:
        session_2026 = AcademicSession(
            session_name="2026-27",
            start_date=date(2026, 4, 1),
            end_date=date(2027, 3, 31),
            is_active=True,
            is_archived=False,
        )
        db.add(session_2026)
        # Add past and future sessions
        db.add(AcademicSession(
            session_name="2025-26",
            start_date=date(2025, 4, 1),
            end_date=date(2026, 3, 31),
            is_active=False,
            is_archived=True,
        ))
        db.add(AcademicSession(
            session_name="2027-28",
            start_date=date(2027, 4, 1),
            end_date=date(2028, 3, 31),
            is_active=False,
            is_archived=False,
        ))
        db.commit()
        db.refresh(session_2026)

    # 3. Result Configuration
    res_cfg = db.query(ResultConfiguration).first()
    if not res_cfg:
        res_cfg = ResultConfiguration(
            academic_session_id=session_2026.id,
            min_pass_percentage=33.0,
            min_subject_pass_percentage=33.0,
            grace_marks_allowed=0.0,
            formula_type="STANDARD_SUM_PERCENTAGE",
            is_active=True,
        )
        db.add(res_cfg)
        db.commit()

    # 4. Classes 1st to 12th
    class_map = {}
    for idx, cname in enumerate(CLASS_NAMES, start=1):
        c = db.query(ClassEntity).filter(ClassEntity.class_name == cname).first()
        if not c:
            c = ClassEntity(class_name=cname, numeric_order=idx, description=f"Standard {cname}")
            db.add(c)
            db.commit()
            db.refresh(c)
        class_map[cname] = c

    # 5. Streams for Class 11 and 12
    streams_data = [
        ("SCIENCE", "SCI", "Science Stream (Physics, Chemistry, Math, CS)"),
        ("COMMERCE", "COM", "Commerce Stream (Accounts, Business, Economics, Math)"),
        ("ARTS", "ART", "Arts / Humanities Stream (History, Political Science, Geography)"),
    ]
    stream_map = {}
    for sname, scode, sdesc in streams_data:
        st = db.query(StreamEntity).filter(StreamEntity.code == scode).first()
        if not st:
            st = StreamEntity(stream_name=sname, code=scode, description=sdesc)
            db.add(st)
            db.commit()
            db.refresh(st)
        stream_map[scode] = st

    # 6. Subjects Management (Class-wise)
    # Check if subjects exist
    existing_subjects_count = db.query(Subject).count()
    if existing_subjects_count == 0:
        subjects_to_create = []

        # Classes 1-2
        for cname in ["1st", "2nd"]:
            cid = class_map[cname].id
            for code, name in [
                ("ENG", "English"), ("HIN", "Hindi"), ("MAT", "Mathematics"),
                ("EVS", "Environmental Studies"), ("CMP", "Computer")
            ]:
                subjects_to_create.append(Subject(
                    subject_code=f"{cname[:2].upper()}-{code}",
                    subject_name=name,
                    short_name=code,
                    class_id=cid,
                    academic_session_id=session_2026.id,
                    maximum_marks=100.0,
                    passing_marks=33.0,
                ))

        # Classes 3-5
        for cname in ["3rd", "4th", "5th"]:
            cid = class_map[cname].id
            for code, name in [
                ("ENG", "English"), ("HIN", "Hindi"), ("MAT", "Mathematics"),
                ("EVS", "Environmental Studies"), ("CMP", "Computer"), ("GK", "General Knowledge")
            ]:
                subjects_to_create.append(Subject(
                    subject_code=f"{cname[:2].upper()}-{code}",
                    subject_name=name,
                    short_name=code,
                    class_id=cid,
                    academic_session_id=session_2026.id,
                    maximum_marks=100.0,
                    passing_marks=33.0,
                ))

        # Classes 6-8
        for cname in ["6th", "7th", "8th"]:
            cid = class_map[cname].id
            for code, name in [
                ("ENG", "English"), ("HIN", "Hindi"), ("MAT", "Mathematics"),
                ("SCI", "Science"), ("SST", "Social Science"), ("SKT", "Sanskrit/French"), ("CS", "Computer Sc.")
            ]:
                subjects_to_create.append(Subject(
                    subject_code=f"{cname[:2].upper()}-{code}",
                    subject_name=name,
                    short_name=code,
                    class_id=cid,
                    academic_session_id=session_2026.id,
                    maximum_marks=100.0,
                    passing_marks=33.0,
                ))

        # Classes 9-10
        for cname in ["9th", "10th"]:
            cid = class_map[cname].id
            for code, name in [
                ("ENG", "English"), ("HIN", "Hindi"), ("MAT", "Mathematics"),
                ("SCI", "Science"), ("SST", "Social Science"), ("SKT", "Sanskrit"), ("IT", "Information Technology")
            ]:
                subjects_to_create.append(Subject(
                    subject_code=f"{cname[:2].upper()}-{code}",
                    subject_name=name,
                    short_name=code,
                    class_id=cid,
                    academic_session_id=session_2026.id,
                    maximum_marks=100.0,
                    passing_marks=33.0,
                ))

        # Classes 11-12 with stream differentiation
        for cname in ["11th", "12th"]:
            cid = class_map[cname].id
            # Science Stream
            for code, name in [
                ("ENG", "English Core"), ("PHY", "Physics"), ("CHE", "Chemistry"),
                ("MAT", "Mathematics"), ("CS", "Computer Science")
            ]:
                subjects_to_create.append(Subject(
                    subject_code=f"{cname[:2].upper()}-SCI-{code}",
                    subject_name=name,
                    short_name=code,
                    class_id=cid,
                    stream_id=stream_map["SCI"].id,
                    academic_session_id=session_2026.id,
                    maximum_marks=100.0,
                    passing_marks=33.0,
                ))
            # Commerce Stream
            for code, name in [
                ("ENG", "English Core"), ("ACC", "Accountancy"), ("BST", "Business Studies"),
                ("ECO", "Economics"), ("MAT", "Mathematics")
            ]:
                subjects_to_create.append(Subject(
                    subject_code=f"{cname[:2].upper()}-COM-{code}",
                    subject_name=name,
                    short_name=code,
                    class_id=cid,
                    stream_id=stream_map["COM"].id,
                    academic_session_id=session_2026.id,
                    maximum_marks=100.0,
                    passing_marks=33.0,
                ))
            # Arts Stream
            for code, name in [
                ("ENG", "English Core"), ("HIS", "History"), ("POL", "Political Science"),
                ("GEO", "Geography"), ("ECO", "Economics")
            ]:
                subjects_to_create.append(Subject(
                    subject_code=f"{cname[:2].upper()}-ART-{code}",
                    subject_name=name,
                    short_name=code,
                    class_id=cid,
                    stream_id=stream_map["ART"].id,
                    academic_session_id=session_2026.id,
                    maximum_marks=100.0,
                    passing_marks=33.0,
                ))

        db.bulk_save_objects(subjects_to_create)
        db.commit()

    # 7. Examinations (Half-Yearly, Annual)
    # Purge any legacy Quarterly Examination and its marks
    legacy_quarterly = db.query(Examination).filter(Examination.exam_type == "QUARTERLY").all()
    for lq in legacy_quarterly:
        db.query(Mark).filter(Mark.exam_id == lq.id).delete()
        db.delete(lq)
    if legacy_quarterly:
        db.commit()

    exams = {}
    exam_specs = [
        ("Half-Yearly Examination", "HALF_YEARLY", "2026-12-05", "2026-12-18"),
        ("Annual Examination", "ANNUAL", "2027-03-01", "2027-03-15"),
    ]
    for name, etype, sdate, edate in exam_specs:
        ex = db.query(Examination).filter(
            Examination.exam_type == etype,
            Examination.academic_session_id == session_2026.id,
        ).first()
        if not ex:
            ex = Examination(
                exam_name=name,
                exam_type=etype,
                academic_session_id=session_2026.id,
                start_date=sdate,
                end_date=edate,
                status="COMPLETED",
            )
            db.add(ex)
            db.commit()
            db.refresh(ex)
        exams[etype] = ex

    # 8. Students (Exactly 12 classes × 10 students = 120 dummy students)
    student_count = db.query(Student).count()
    if student_count < 120:
        # Clear if partial
        db.query(Mark).delete()
        db.query(Student).delete()
        db.commit()

        overall_seq = 1
        students_to_add = []

        for c_idx, cname in enumerate(CLASS_NAMES, start=1):
            class_obj = class_map[cname]
            names_list = STUDENT_NAMES_BY_CLASS.get(cname, [])

            for roll_num, sname in enumerate(names_list, start=1):
                adm_no = f"ADM-2026-{overall_seq:03d}"
                sch_no = f"SCH-{10000 + overall_seq}"
                f_name = f"{random.choice(FATHER_NAMES)} {sname.split()[-1]}"
                m_name = f"{random.choice(MOTHER_NAMES)} {sname.split()[-1]}"

                # Gender approximation from name
                female_keywords = ["Ananya", "Diya", "Aadhya", "Myra", "Sara", "Ishita", "Navya",
                                   "Kiara", "Riya", "Avni", "Prisha", "Anvi", "Ira", "Saanvi", "Aanya",
                                   "Tanvi", "Kavya", "Bhavna", "Aparna", "Rupali", "Meera", "Nandini",
                                   "Pooja", "Shruti", "Sneha", "Gauri", "Hamsika", "Janhavi", "Lavanya",
                                   "Mitali", "Palak", "Radhika", "Siddhi", "Tanya", "Urvi", "Vaishnavi",
                                   "Vidhi", "Vrinda", "Yashasvi", "Zara", "Aditi", "Anushka", "Divya",
                                   "Garima", "Khushi", "Mahika", "Niharika", "Paridhi", "Ridhima", "Suhani",
                                   "Tanisha", "Urvashi", "Vanshika", "Yamini", "Zoya", "Anupama", "Bhavika",
                                   "Chaitali", "Deepika", "Esha"]
                is_female = any(sname.startswith(kw) for kw in female_keywords)
                gender = "FEMALE" if is_female else "MALE"

                # Calculate DOB based on class standard (approximate age 5 + class order)
                birth_year = 2026 - (5 + c_idx)
                dob = f"{birth_year}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"

                # Stream allocation for 11th and 12th: 5 Science, 3 Commerce, 2 Arts
                student_stream_id = None
                if cname in ["11th", "12th"]:
                    if roll_num <= 5:
                        student_stream_id = stream_map["SCI"].id
                    elif roll_num <= 8:
                        student_stream_id = stream_map["COM"].id
                    else:
                        student_stream_id = stream_map["ART"].id

                # Promotion map
                promoted_map = {
                    "1st": "II A", "2nd": "III A", "3rd": "IV A", "4th": "V A", "5th": "VI A",
                    "6th": "VII A", "7th": "VIII A", "8th": "IX D", "9th": "X A", "10th": "XI (Science/Commerce)",
                    "11th": "XII", "12th": "PASSED / GRADUATED"
                }

                # Special reference student in Class 8th matching the user's photo
                if cname == "8th" and roll_num == 1:
                    sname = "Avaneesh Mahawar"
                    adm_no = "ADM-2026-071"
                    sch_no = "5693"
                    roll_to_use = 8508
                    f_name = "Bhupesh Mahawar"
                    m_name = "Priyanka Mahawar"
                    dob = "2009-02-11"
                    att = "224/ 241"
                    prom = "IX D"
                    t_rem = "Excellent! Keep up the good work!"
                else:
                    roll_to_use = roll_num
                    att = f"{210 + (overall_seq * 3) % 25}/ 241"
                    prom = promoted_map.get(cname, "Promoted to Next Class")
                    t_rem = "Excellent! Keep up the good work!"

                st_obj = Student(
                    admission_number=adm_no,
                    scholar_number=sch_no,
                    roll_number=roll_to_use,
                    student_name=sname,
                    father_name=f_name,
                    mother_name=m_name,
                    date_of_birth=dob,
                    gender=gender,
                    contact_number=f"+91 {9800000000 + overall_seq}",
                    address=f"{100 + overall_seq}, Sector-{c_idx}, Indore, MP",
                    class_id=class_obj.id,
                    stream_id=student_stream_id,
                    academic_session_id=session_2026.id,
                    student_status="ACTIVE",
                    date_of_admission="2026-04-05",
                    attendance=att,
                    promoted_to_class=prom,
                    teacher_remarks=t_rem,
                )
                students_to_add.append(st_obj)
                overall_seq += 1

        db.add_all(students_to_add)
        db.commit()

    # 9. Marks Generation for all 120 students across both examinations (Half-Yearly & Annual)
    existing_marks_count = db.query(Mark).count()
    if existing_marks_count == 0:
        all_students = db.query(Student).all()
        random.seed(42)  # Deterministic seed for reproducible testing

        marks_to_create = []

        for st in all_students:
            # Get applicable subjects for this student
            subj_query = db.query(Subject).filter(
                Subject.class_id == st.class_id,
                Subject.academic_session_id == session_2026.id,
            )
            if st.stream_id:
                subj_query = subj_query.filter(
                    (Subject.stream_id == st.stream_id) | (Subject.stream_id.is_(None))
                )
            else:
                subj_query = subj_query.filter(Subject.stream_id.is_(None))

            student_subjects = subj_query.all()

            # Base capability for student (between 50 and 95)
            base_score = 55 + (st.roll_number * 3.5) % 40

            # 1. Half-Yearly Exam Marks (Demonstrate independence: different scores)
            for sub_idx, sub in enumerate(student_subjects):
                if st.student_name == "Avaneesh Mahawar" and sub.subject_name in AVANEESH_T1:
                    m_dict = AVANEESH_T1[sub.subject_name]
                    pt, nb, se, te, score = m_dict["pt"], m_dict["nb"], m_dict["se"], m_dict["te"], m_dict["tot"]
                    rem = "Excellent performance"
                elif st.class_id == class_map["5th"].id and st.roll_number == 10 and sub_idx == 0:
                    score = 24.0  # Fail mark (< 33)
                    pt, nb, se, te = 2.0, 2.0, 2.0, 18.0
                    rem = "Needs Improvement"
                else:
                    score = min(99.0, max(34.0, round(base_score + random.uniform(-6, 12), 1)))
                    nb = 5.0 if score >= 60 else 4.0
                    se = 5.0 if score >= 70 else (4.0 if score >= 50 else 3.0)
                    pt = round(min(10.0, max(0.0, (score / 100.0) * 10.0)), 1)
                    te = round(max(0.0, min(80.0, score - (pt + nb + se))), 1)
                    diff = round(score - (pt + nb + se + te), 1)
                    te = round(te + diff, 1)
                    rem = "Satisfactory"

                marks_to_create.append(Mark(
                    student_id=st.id,
                    class_id=st.class_id,
                    subject_id=sub.id,
                    exam_id=exams["HALF_YEARLY"].id,
                    academic_session_id=session_2026.id,
                    maximum_marks=sub.maximum_marks,
                    periodic_test=pt,
                    notebook=nb,
                    sub_enrichment=se,
                    term_exam=te,
                    obtained_marks=score,
                    remarks=rem,
                ))

            # 2. Annual Exam Marks (Independent scores + demonstrate PENDING scenario)
            for sub_idx, sub in enumerate(student_subjects):
                # Demonstrate PENDING scenario: omit last subject for roll 9 in Class 1 and Class 11
                if st.roll_number == 9 and (st.class_id == class_map["1st"].id or st.class_id == class_map["11th"].id) and sub_idx == len(student_subjects) - 1:
                    continue

                if st.student_name == "Avaneesh Mahawar" and sub.subject_name in AVANEESH_T2:
                    m_dict = AVANEESH_T2[sub.subject_name]
                    pt, nb, se, te, score = m_dict["pt"], m_dict["nb"], m_dict["se"], m_dict["te"], m_dict["tot"]
                    rem = "Excellent! Keep up the good work!"
                else:
                    score = min(100.0, max(36.0, round(base_score + random.uniform(-4, 15), 1)))
                    nb = 5.0 if score >= 60 else 4.0
                    se = 5.0 if score >= 70 else (4.0 if score >= 50 else 3.0)
                    pt = round(min(10.0, max(0.0, (score / 100.0) * 10.0)), 1)
                    te = round(max(0.0, min(80.0, score - (pt + nb + se))), 1)
                    diff = round(score - (pt + nb + se + te), 1)
                    te = round(te + diff, 1)
                    rem = "Excellent performance"

                marks_to_create.append(Mark(
                    student_id=st.id,
                    class_id=st.class_id,
                    subject_id=sub.id,
                    exam_id=exams["ANNUAL"].id,
                    academic_session_id=session_2026.id,
                    maximum_marks=sub.maximum_marks,
                    periodic_test=pt,
                    notebook=nb,
                    sub_enrichment=se,
                    term_exam=te,
                    obtained_marks=score,
                    remarks=rem,
                ))

        db.bulk_save_objects(marks_to_create)
        db.commit()

    # 10. Roles & Permissions
    roles_dict = {}
    for rname, rdesc in [
        ("SUPER_ADMIN", "Full system and administrative control"),
        ("PRINCIPAL", "Academic head, view all students, classes, results, update marks"),
        ("CLASS_TEACHER", "Class teacher, view and edit assigned class"),
    ]:
        r = db.query(Role).filter(Role.name == rname).first()
        if not r:
            r = Role(name=rname, description=rdesc)
            db.add(r)
            db.commit()
            db.refresh(r)
        roles_dict[rname] = r

    perms_dict = {}
    for pname, pdesc in [
        ("VIEW_ALL_RESULTS", "Permission to view results across all classes"),
        ("MANAGE_MARKS", "Permission to enter and edit marks"),
        ("MANAGE_STUDENTS", "Permission to manage student records"),
        ("MANAGE_SETTINGS", "Permission to update school and formula configurations"),
    ]:
        p = db.query(Permission).filter(Permission.name == pname).first()
        if not p:
            p = Permission(name=pname, description=pdesc)
            db.add(p)
            db.commit()
            db.refresh(p)
        perms_dict[pname] = p

    # Assign permissions to roles
    # PRINCIPAL has VIEW_ALL_RESULTS, MANAGE_MARKS, MANAGE_STUDENTS
    principal_role = roles_dict["PRINCIPAL"]
    for perm_key in ["VIEW_ALL_RESULTS", "MANAGE_MARKS", "MANAGE_STUDENTS"]:
        rp = db.query(RolePermission).filter(
            RolePermission.role_id == principal_role.id,
            RolePermission.permission_id == perms_dict[perm_key].id,
        ).first()
        if not rp:
            db.add(RolePermission(role_id=principal_role.id, permission_id=perms_dict[perm_key].id))
    db.commit()

    # 11. Teachers & Users
    # User 1: Super Admin
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@greenvalley.edu",
            hashed_password=get_password_hash("AdminPassword123!"),
            full_name="System Administrator",
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        db.add(UserRole(user_id=admin_user.id, role_id=roles_dict["SUPER_ADMIN"].id))
        db.commit()

    # User 2: Principal
    principal_user = db.query(User).filter(User.username == "principal").first()
    if not principal_user:
        principal_user = User(
            username="principal",
            email="principal@greenvalley.edu",
            hashed_password=get_password_hash("PrincipalPassword123!"),
            full_name="Dr. Anil Sharma",
            is_active=True,
        )
        db.add(principal_user)
        db.commit()
        db.refresh(principal_user)
        db.add(UserRole(user_id=principal_user.id, role_id=roles_dict["PRINCIPAL"].id))
        db.commit()

    # User 3: Class 5 Teacher (Only Class 5 access)
    t5_user = db.query(User).filter(User.username == "teacher5").first()
    if not t5_user:
        t5_user = User(
            username="teacher5",
            email="teacher5@greenvalley.edu",
            hashed_password=get_password_hash("TeacherPassword123!"),
            full_name="Sunita Deshmukh",
            is_active=True,
        )
        db.add(t5_user)
        db.commit()
        db.refresh(t5_user)
        db.add(UserRole(user_id=t5_user.id, role_id=roles_dict["CLASS_TEACHER"].id))
        db.commit()

    # Teacher 5 profile
    t5_teacher = db.query(Teacher).filter(Teacher.employee_code == "TCH-005").first()
    if not t5_teacher:
        t5_teacher = Teacher(
            employee_code="TCH-005",
            full_name="Sunita Deshmukh",
            email="teacher5@greenvalley.edu",
            phone="+91 98200 50005",
            qualification="M.Sc., B.Ed.",
            designation="Senior Class Teacher",
            user_id=t5_user.id,
        )
        db.add(t5_teacher)
        db.commit()
        db.refresh(t5_teacher)

    # Assign Teacher 5 to Class 5
    assign_5 = db.query(TeacherAssignment).filter(
        TeacherAssignment.teacher_id == t5_teacher.id,
        TeacherAssignment.class_id == class_map["5th"].id,
    ).first()
    if not assign_5:
        db.add(TeacherAssignment(
            teacher_id=t5_teacher.id,
            class_id=class_map["5th"].id,
            academic_session_id=session_2026.id,
            assignment_type="CLASS_TEACHER",
        ))
        db.commit()

    # User 4: Class 6 Teacher with VIEW_ALL_RESULTS permission
    t6_user = db.query(User).filter(User.username == "teacher6").first()
    if not t6_user:
        t6_user = User(
            username="teacher6",
            email="teacher6@greenvalley.edu",
            hashed_password=get_password_hash("TeacherPassword123!"),
            full_name="Vikram Rathore",
            is_active=True,
        )
        db.add(t6_user)
        db.commit()
        db.refresh(t6_user)

        # Create a custom role or assign VIEW_ALL_RESULTS permission
        t6_role = db.query(Role).filter(Role.name == "TEACHER_WITH_VIEW_ALL").first()
        if not t6_role:
            t6_role = Role(name="TEACHER_WITH_VIEW_ALL", description="Class Teacher with View All Results permission")
            db.add(t6_role)
            db.commit()
            db.refresh(t6_role)
            db.add(RolePermission(role_id=t6_role.id, permission_id=perms_dict["VIEW_ALL_RESULTS"].id))
            db.commit()

        db.add(UserRole(user_id=t6_user.id, role_id=t6_role.id))
        db.commit()

    t6_teacher = db.query(Teacher).filter(Teacher.employee_code == "TCH-006").first()
    if not t6_teacher:
        t6_teacher = Teacher(
            employee_code="TCH-006",
            full_name="Vikram Rathore",
            email="teacher6@greenvalley.edu",
            phone="+91 98200 60006",
            qualification="M.A., B.Ed.",
            designation="Class Teacher & Coordinator",
            user_id=t6_user.id,
        )
        db.add(t6_teacher)
        db.commit()
        db.refresh(t6_teacher)

    assign_6 = db.query(TeacherAssignment).filter(
        TeacherAssignment.teacher_id == t6_teacher.id,
        TeacherAssignment.class_id == class_map["6th"].id,
    ).first()
    if not assign_6:
        db.add(TeacherAssignment(
            teacher_id=t6_teacher.id,
            class_id=class_map["6th"].id,
            academic_session_id=session_2026.id,
            assignment_type="CLASS_TEACHER",
        ))
        db.commit()

    print("Database seeding completed successfully!")
