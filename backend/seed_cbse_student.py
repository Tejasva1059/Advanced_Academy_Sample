import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models import SchoolSetting, AcademicSession, ClassEntity, Subject, Student, Examination, Mark

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

def seed_cbse():
    db = SessionLocal()
    try:
        # 1. School settings
        school = db.query(SchoolSetting).first()
        if school:
            school.school_name = "ADVANCED ACADEMY"
            school.affiliation_no = "1030183"
            school.school_code = "50161"
            school.address = "ISKCON Vihar Colony, Nipania Road, Indore - 452010 (M.P.) Contact : 7415666676, 7415666686, 9827720868, 9691125004"
            school.city_office = "City Office : Baikunthdham, (Near Anand Bazaar), Indore - 452018 Phone : (0731) 2561192, 7415061192"
            school.email = "advancedindore@gmail.com"
            school.website = "www.advancedacademyindore.com"
            school.report_card_header_text = "Report Card : Annual Exam"
            db.commit()
            print("Updated school settings to ADVANCED ACADEMY!")

        session = db.query(AcademicSession).filter(AcademicSession.session_name == "2026-27").first()
        if not session:
            session = db.query(AcademicSession).first()

        class8 = db.query(ClassEntity).filter(ClassEntity.class_name == "8th").first()
        if not class8:
            print("Class 8th not found!")
            return

        # 2. Update subjects for Class 8
        subj_map = {
            "Sanskrit": "Sanskrit/French",
            "Computer": "Computer Sc.",
        }
        for sub in db.query(Subject).filter(Subject.class_id == class8.id).all():
            if sub.subject_name in subj_map:
                sub.subject_name = subj_map[sub.subject_name]
                db.commit()

        # 3. Find or update Avaneesh Mahawar in Class 8
        avaneesh = db.query(Student).filter(
            (Student.scholar_number == "5693") | (Student.student_name == "Avaneesh Mahawar")
        ).first()

        if not avaneesh:
            # Update first student in Class 8
            avaneesh = db.query(Student).filter(Student.class_id == class8.id).order_by(Student.id).first()

        if avaneesh:
            avaneesh.student_name = "AVANEESH MAHAWAR"
            avaneesh.scholar_number = "5693"
            avaneesh.roll_number = 8508
            avaneesh.father_name = "BHUPESH MAHAWAR"
            avaneesh.mother_name = "PRIYANKA MAHAWAR"
            avaneesh.date_of_birth = "11/02/2009"
            avaneesh.attendance = "224/ 241"
            avaneesh.promoted_to_class = "IX D"
            avaneesh.teacher_remarks = "Excellent! Keep up the good work!"
            db.commit()
            print(f"Avaneesh Mahawar configured (ID: {avaneesh.id}, Scholar: {avaneesh.scholar_number})!")

        # 4. Insert / Update exact marks for Avaneesh
        half_yearly = db.query(Examination).filter(Examination.exam_type == "HALF_YEARLY").first()
        annual = db.query(Examination).filter(Examination.exam_type == "ANNUAL").first()

        class8_subjects = db.query(Subject).filter(Subject.class_id == class8.id).all()
        s_by_name = {s.subject_name: s for s in class8_subjects}

        if avaneesh and half_yearly and annual:
            # Delete old marks for Avaneesh
            db.query(Mark).filter(Mark.student_id == avaneesh.id).delete()
            db.commit()

            # Insert Term 1 (Half-Yearly)
            for sname, mvals in AVANEESH_T1.items():
                s_obj = s_by_name.get(sname)
                if s_obj:
                    db.add(Mark(
                        student_id=avaneesh.id,
                        class_id=class8.id,
                        subject_id=s_obj.id,
                        exam_id=half_yearly.id,
                        academic_session_id=session.id,
                        maximum_marks=100.0,
                        periodic_test=mvals["pt"],
                        notebook=mvals["nb"],
                        sub_enrichment=mvals["se"],
                        term_exam=mvals["te"],
                        obtained_marks=mvals["tot"],
                        remarks="Excellent",
                    ))

            # Insert Term 2 (Annual)
            for sname, mvals in AVANEESH_T2.items():
                s_obj = s_by_name.get(sname)
                if s_obj:
                    db.add(Mark(
                        student_id=avaneesh.id,
                        class_id=class8.id,
                        subject_id=s_obj.id,
                        exam_id=annual.id,
                        academic_session_id=session.id,
                        maximum_marks=100.0,
                        periodic_test=mvals["pt"],
                        notebook=mvals["nb"],
                        sub_enrichment=mvals["se"],
                        term_exam=mvals["te"],
                        obtained_marks=mvals["tot"],
                        remarks="Excellent! Keep up the good work!",
                    ))

            db.commit()
            print("Exact marks inserted for Avaneesh Mahawar across Term I and Term II!")

        # 5. Populate breakdown for all remaining marks
        all_marks = db.query(Mark).filter(Mark.periodic_test.is_(None)).all()
        for m in all_marks:
            score = float(m.obtained_marks)
            nb = 5.0 if score >= 60 else 4.0
            se = 5.0 if score >= 70 else (4.0 if score >= 50 else 3.0)
            pt = round(min(10.0, max(0.0, (score / 100.0) * 10.0)), 1)
            te = round(max(0.0, min(80.0, score - (pt + nb + se))), 1)
            diff = round(score - (pt + nb + se + te), 1)
            te = round(te + diff, 1)

            m.periodic_test = pt
            m.notebook = nb
            m.sub_enrichment = se
            m.term_exam = te

        # 6. Populate default attendance / promotion for students without them
        all_students = db.query(Student).all()
        promoted_map = {
            "1st": "II A", "2nd": "III A", "3rd": "IV A", "4th": "V A", "5th": "VI A",
            "6th": "VII A", "7th": "VIII A", "8th": "IX D", "9th": "X A", "10th": "XI (Science/Commerce)",
            "11th": "XII", "12th": "PASSED / GRADUATED"
        }
        for st in all_students:
            if not st.attendance:
                st.attendance = f"{215 + (st.id * 3) % 25}/ 241"
            if not st.promoted_to_class:
                cname = st.class_entity.class_name if st.class_entity else "8th"
                st.promoted_to_class = promoted_map.get(cname, "Promoted to Next Class")
            if not st.teacher_remarks:
                st.teacher_remarks = "Excellent! Keep up the good work!"

        db.commit()
        print(f"Updated breakdown for {len(all_marks)} marks and metadata for {len(all_students)} students!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_cbse()
    # Sync root school.db
    import shutil
    shutil.copy2("school.db", "../school.db")
    print("Synced root school.db!")
