import io
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


def generate_report_card_pdf(data: dict) -> io.BytesIO:
    """
    Generates an exact-match, publication-grade A4 Portrait CBSE Report Card PDF
    matching the Advanced Academy Term I + Term II format.
    """
    buffer = io.BytesIO()
    # Usable width: 595.27 - 50 = 545.27 points
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=25,
        rightMargin=25,
        topMargin=20,
        bottomMargin=20,
    )

    styles = getSampleStyleSheet()

    # Typography styles
    school_title_style = ParagraphStyle(
        "SchoolTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=17,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1a4329"),
    )
    affil_style = ParagraphStyle(
        "AffilStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#b45309"),
    )
    addr_style = ParagraphStyle(
        "AddrStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=6.5,
        leading=8.5,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1e293b"),
    )
    session_title_style = ParagraphStyle(
        "SessionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.black,
    )
    student_label = ParagraphStyle(
        "StudentLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.black,
    )
    student_val = ParagraphStyle(
        "StudentVal",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.black,
    )
    th_title = ParagraphStyle(
        "THTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        alignment=TA_CENTER,
        textColor=colors.black,
    )
    th_sub = ParagraphStyle(
        "THSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=6.5,
        leading=8,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#334155"),
    )
    td_left = ParagraphStyle(
        "TDLeft",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        alignment=TA_LEFT,
        textColor=colors.black,
    )
    td_center = ParagraphStyle(
        "TDCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        alignment=TA_CENTER,
        textColor=colors.black,
    )
    td_center_bold = ParagraphStyle(
        "TDCenterBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        alignment=TA_CENTER,
        textColor=colors.black,
    )
    grade_scale_text = ParagraphStyle(
        "GradeScaleText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=colors.black,
    )

    story = []

    school = data.get("school", {})
    student = data.get("student", {})
    session = data.get("session", {})
    term_1 = data.get("term_1")
    term_2 = data.get("term_2")
    subject_scores = data.get("subject_scores", [])

    # Path to logos
    base_dir = os.path.dirname(os.path.dirname(__file__))
    cbse_logo_path = os.path.join(base_dir, "static", "cbse_logo.png")
    school_logo_path = os.path.join(base_dir, "static", "advanced_academy_logo.png")

    cbse_img = None
    if os.path.exists(cbse_logo_path):
        cbse_img = Image(cbse_logo_path, width=0.85 * inch, height=0.85 * inch)

    school_img = None
    if os.path.exists(school_logo_path):
        school_img = Image(school_logo_path, width=0.85 * inch, height=0.85 * inch)

    # 1. School Header Table (3 columns: CBSE Logo, Details, School Logo)
    center_elements = [
        Paragraph(school.get("school_name", "ADVANCED ACADEMY").upper(), school_title_style),
        Spacer(1, 1),
        Paragraph(
            f"C.B.S.E. AFFILIATION No. : {school.get('affiliation_no', '1030183')} – SCHOOL CODE : {school.get('school_code', '50161')}",
            affil_style,
        ),
        Spacer(1, 1),
        Paragraph(school.get("address", ""), addr_style),
        Paragraph(school.get("city_office", ""), addr_style),
        Paragraph(
            f"E-mail : {school.get('email', 'advancedindore@gmail.com')}, Website : {school.get('website', 'www.advancedacademyindore.com')}",
            addr_style,
        ),
    ]

    header_table_data = [
        [cbse_img or "", center_elements, school_img or ""]
    ]

    header_table = Table(header_table_data, colWidths=[65, 415, 65])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("ALIGN", (2, 0), (2, 0), "CENTER"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.75, colors.black),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 3))

    # 2. Session and Title
    session_name = session.get("session_name", "2022 - 2023")
    story.append(Paragraph(f"Academic Session : {session_name}", session_title_style))
    story.append(Paragraph("Report Card : Annual Exam", session_title_style))
    story.append(Spacer(1, 4))

    # 3. Student Details Table
    class_str = student.get("class_name", "")
    roman_map = {
        "1st": "I A", "2nd": "II A", "3rd": "III A", "4th": "IV A", "5th": "V A",
        "6th": "VI A", "7th": "VII A", "8th": "VIII E", "9th": "IX A", "10th": "X A",
        "11th": "XI", "12th": "XII"
    }
    display_class = roman_map.get(class_str, class_str)
    stream_str = student.get("stream_name")
    if stream_str:
        display_class += f" ({stream_str})"

    att_str = data.get("attendance") or student.get("attendance") or "224/ 241"

    student_box_data = [
        [
            Paragraph("Student Name :", student_label),
            Paragraph(student.get("student_name", "").upper(), student_val),
            Paragraph("Scholar No. :", student_label),
            Paragraph(str(student.get("scholar_number", "")), student_val),
        ],
        [
            Paragraph("Father's Name :", student_label),
            Paragraph(student.get("father_name", "").upper(), student_val),
            Paragraph("Roll No. :", student_label),
            Paragraph(str(student.get("roll_number", "")), student_val),
        ],
        [
            Paragraph("Mother's Name :", student_label),
            Paragraph(student.get("mother_name", "").upper(), student_val),
            Paragraph("Class & Sec :", student_label),
            Paragraph(display_class, student_val),
        ],
        [
            Paragraph("Date of Birth :", student_label),
            Paragraph(str(student.get("date_of_birth", "")), student_val),
            Paragraph("Attendance :", student_label),
            Paragraph(att_str, student_val),
        ],
    ]

    student_table = Table(student_box_data, colWidths=[80, 192, 75, 198])
    student_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.transparent),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(student_table)
    story.append(Spacer(1, 4))

    # 4. Scholastic Areas Table
    t1_subs = (term_1.get("subjects") if term_1 else None) or subject_scores
    t2_subs = (term_2.get("subjects") if term_2 else None) or subject_scores

    t1_map = {s["subject_name"]: s for s in t1_subs}
    t2_map = {s["subject_name"]: s for s in t2_subs}

    all_subjects = []
    seen = set()
    for s in t1_subs + t2_subs:
        sname = s["subject_name"]
        if sname not in seen:
            all_subjects.append(sname)
            seen.add(sname)

    # Column widths: 115 + (32+32+35+42+42+32) + (32+32+35+42+42+32) = 115 + 215 + 215 = 545
    col_widths = [115, 32, 32, 35, 42, 42, 32, 32, 32, 35, 42, 42, 32]

    # Header Row 1: Groups
    header_r1 = [
        Paragraph("<b>Scholastic Areas:</b><br/>Subjects", td_left),
        Paragraph("<b>Term I (100 marks)</b>", th_title), "", "", "", "", "",
        Paragraph("<b>Term II (100 marks)</b>", th_title), "", "", "", "", ""
    ]

    # Header Row 2: Sub-columns
    header_r2 = [
        "",
        Paragraph("Per<br/>Test<br/><font size=5.5>10</font>", th_sub),
        Paragraph("Note<br/>Book<br/><font size=5.5>5</font>", th_sub),
        Paragraph("Sub<br/>Enrich<br/><font size=5.5>5</font>", th_sub),
        Paragraph("Half<br/>Yearly<br/><font size=5.5>80</font>", th_sub),
        Paragraph("Marks<br/>Obt.<br/><font size=5.5>100</font>", th_sub),
        Paragraph("Grade", th_title),
        Paragraph("Per<br/>Test<br/><font size=5.5>10</font>", th_sub),
        Paragraph("Note<br/>Book<br/><font size=5.5>5</font>", th_sub),
        Paragraph("Sub<br/>Enrich<br/><font size=5.5>5</font>", th_sub),
        Paragraph("Annual<br/>Exam<br/><font size=5.5>80</font>", th_sub),
        Paragraph("Marks<br/>Obt.<br/><font size=5.5>100</font>", th_sub),
        Paragraph("Grade", th_title),
    ]

    scholastic_rows = [header_r1, header_r2]

    for sname in all_subjects:
        t1 = t1_map.get(sname, {})
        t2 = t2_map.get(sname, {})

        t1_pt = str(t1.get("periodic_test", "-")) if t1.get("periodic_test") is not None else "-"
        t1_nb = str(t1.get("notebook", "-")) if t1.get("notebook") is not None else "-"
        t1_se = str(t1.get("sub_enrichment", "-")) if t1.get("sub_enrichment") is not None else "-"
        t1_te = str(t1.get("term_exam", "-")) if t1.get("term_exam") is not None else "-"
        t1_tot = str(t1.get("obtained_marks", "-")) if t1.get("obtained_marks") is not None else "-"
        t1_gr = t1.get("grade", "-") or "-"

        t2_pt = str(t2.get("periodic_test", "-")) if t2.get("periodic_test") is not None else "-"
        t2_nb = str(t2.get("notebook", "-")) if t2.get("notebook") is not None else "-"
        t2_se = str(t2.get("sub_enrichment", "-")) if t2.get("sub_enrichment") is not None else "-"
        t2_te = str(t2.get("term_exam", "-")) if t2.get("term_exam") is not None else "-"
        t2_tot = str(t2.get("obtained_marks", "-")) if t2.get("obtained_marks") is not None else "-"
        t2_gr = t2.get("grade", "-") or "-"

        row = [
            Paragraph(sname.upper(), td_left),
            Paragraph(t1_pt, td_center),
            Paragraph(t1_nb, td_center),
            Paragraph(t1_se, td_center),
            Paragraph(t1_te, td_center),
            Paragraph(t1_tot, td_center_bold),
            Paragraph(t1_gr, td_center_bold),
            Paragraph(t2_pt, td_center),
            Paragraph(t2_nb, td_center),
            Paragraph(t2_se, td_center),
            Paragraph(t2_te, td_center),
            Paragraph(t2_tot, td_center_bold),
            Paragraph(t2_gr, td_center_bold),
        ]
        scholastic_rows.append(row)

    scholastic_table = Table(scholastic_rows, colWidths=col_widths)
    scholastic_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.6, colors.black),
        ("SPAN", (0, 0), (0, 1)),
        ("SPAN", (1, 0), (6, 0)),
        ("SPAN", (7, 0), (12, 0)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("BACKGROUND", (0, 0), (-1, 1), colors.HexColor("#f8fafc")),
    ]))
    story.append(scholastic_table)
    story.append(Spacer(1, 4))

    # 5. Co-Scholastic Areas Table
    co_scholastic_data = [
        [
            Paragraph("<b>Co-Scholastic Areas : Term-1 [on a 3 point (A-C) grading Scale]</b>", td_left),
            Paragraph("<b>Grade</b>", th_title),
            Paragraph("<b>Co-Scholastic Areas : Term-2 [on a 3 point (A-C) grading Scale]</b>", td_left),
            Paragraph("<b>Grade</b>", th_title),
        ],
        [
            Paragraph("WORK EDUCATION", td_left),
            Paragraph("A", td_center_bold),
            Paragraph("WORK EDUCATION", td_left),
            Paragraph("A", td_center_bold),
        ],
        [
            Paragraph("ART EDUCATION", td_left),
            Paragraph("B", td_center_bold),
            Paragraph("ART EDUCATION", td_left),
            Paragraph("B", td_center_bold),
        ],
        [
            Paragraph("HEALTH & PHYSICAL EDUCATION", td_left),
            Paragraph("A", td_center_bold),
            Paragraph("HEALTH & PHYSICAL EDUCATION", td_left),
            Paragraph("A", td_center_bold),
        ],
    ]

    co_table = Table(co_scholastic_data, colWidths=[225, 47.5, 225, 47.5])
    co_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.6, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
    ]))
    story.append(co_table)
    story.append(Spacer(1, 4))

    # 6. Discipline Table
    discipline_data = [
        [
            Paragraph("<b>DISCIPLINE : Term-1 [on a 3 point (A-C) grading scale]</b>", td_left),
            Paragraph("A", td_center_bold),
            Paragraph("<b>DISCIPLINE : Term-2 [on a 3 point (A-C) grading scale]</b>", td_left),
            Paragraph("A", td_center_bold),
        ]
    ]
    disc_table = Table(discipline_data, colWidths=[225, 47.5, 225, 47.5])
    disc_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.6, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(disc_table)
    story.append(Spacer(1, 4))

    # 7. Teacher Remarks & Promotion
    teacher_remark = data.get("class_teacher_remark") or "Excellent! Keep up the good work!"
    promoted_class = data.get("promoted_to_class") or "IX D"

    remarks_data = [
        [Paragraph(f"<b>Class Teacher's Remark :</b>  {teacher_remark}", td_left)],
        [Paragraph(f"<b>Promoted to Class :</b>  <u>{promoted_class}</u>", td_left)],
    ]
    remarks_table = Table(remarks_data, colWidths=[545])
    remarks_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(remarks_table)
    story.append(Spacer(1, 8))

    # 8. Date and Signatures
    date_val = data.get("date_str") or "March 24, 2023"
    sig_data = [
        [
            Paragraph(f"<b>Date :</b> {date_val}", td_left),
            Paragraph("<b>Class Teacher</b>", th_title),
            Paragraph("<b>Principal</b>", ParagraphStyle("RightSig", parent=th_title, alignment=TA_RIGHT)),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[180, 185, 180])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 6))

    # 9. 8-Point Grading Scale Table at Bottom
    story.append(
        Paragraph(
            "<b>Grading scale for scholastic areas:</b> Grades are awarded on an 8 point grading scale as follows -",
            grade_scale_text,
        )
    )
    story.append(Spacer(1, 2))

    scale_headers = ["Range (%)", "91-100", "81-90", "71-80", "61-70", "51-60", "41-50", "33-40", "00-32"]
    scale_grades = ["Grade", "A1", "A2", "B1", "B2", "C1", "C2", "D", "E\n(Needs Imp.)"]

    scale_table_data = [
        [Paragraph(f"<b>{h}</b>", td_center) for h in scale_headers],
        [Paragraph(f"<b>{g}</b>", td_center) for g in scale_grades],
    ]
    # 545 / 9 = ~60.5
    scale_table = Table(scale_table_data, colWidths=[65, 60, 60, 60, 60, 60, 60, 60, 60])
    scale_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
    ]))
    story.append(scale_table)

    doc.build(story)
    buffer.seek(0)
    return buffer
