import React from 'react';
import { ReportCardData } from '../types';
import { Printer, Download } from 'lucide-react';
import apiClient from '../api/client';
import cbseLogo from '../assets/cbse_logo.png';
import schoolLogo from '../assets/advanced_academy_logo.png';

interface ReportCardProps {
  data: ReportCardData;
  onPrint?: () => void;
  showActions?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({ data, onPrint, showActions = true }) => {
  const {
    school,
    session,
    student,
    exam,
    term_1,
    term_2,
    co_scholastic,
    discipline,
    attendance,
    class_teacher_remark,
    promoted_to_class,
    date_str,
    subject_scores,
  } = data;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await apiClient.get(`/report-cards/${student.id}/${exam.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ReportCard_${student.scholar_number}_${exam.exam_type}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to generate PDF. Please try printing or check server connection.');
    }
  };

  // Combine subjects from Term I and Term II or fallback to subject_scores
  const t1Subjects = term_1?.subjects || subject_scores;
  const t2Subjects = term_2?.subjects || subject_scores;

  const allSubjectNames = Array.from(
    new Set([...t1Subjects.map((s) => s.subject_name), ...t2Subjects.map((s) => s.subject_name)])
  );

  const t1Map = new Map(t1Subjects.map((s) => [s.subject_name, s]));
  const t2Map = new Map(t2Subjects.map((s) => [s.subject_name, s]));

  const coScholasticList = co_scholastic && co_scholastic.length > 0 ? co_scholastic : [
    { name: 'WORK EDUCATION', grade_term1: 'A', grade_term2: 'A' },
    { name: 'ART EDUCATION', grade_term1: 'B', grade_term2: 'B' },
    { name: 'HEALTH & PHYSICAL EDUCATION', grade_term1: 'A', grade_term2: 'A' },
  ];

  const disciplineGradeT1 = discipline && discipline.length > 0 ? discipline[0].grade_term1 : 'A';
  const disciplineGradeT2 = discipline && discipline.length > 0 ? discipline[0].grade_term2 : 'A';

  const defaultGradingScale = [
    { range: '91-100', grade: 'A1' },
    { range: '81-90', grade: 'A2' },
    { range: '71-80', grade: 'B1' },
    { range: '61-70', grade: 'B2' },
    { range: '51-60', grade: 'C1' },
    { range: '41-50', grade: 'C2' },
    { range: '33-40', grade: 'D' },
    { range: '00-32', grade: 'E\n(Needs Improvement)' },
  ];

  return (
    <div className="flex flex-col items-center w-full">
      {showActions && (
        <div className="w-full max-w-4xl flex items-center justify-between mb-4 no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-600 font-medium">
              Student: <b className="text-slate-900">{student.student_name}</b> ({student.class_name})
            </span>
            <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded-full border border-emerald-200">
              CBSE Annual Report Card
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print (A4)
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      )}

      {/* A4 Report Card Sheet */}
      <div className="report-card-container bg-white w-full max-w-4xl p-6 sm:p-10 border border-slate-400 rounded-lg shadow-xl text-black font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        
        {/* Yellow Header Banner matching photo */}
        <div className="w-full h-2.5 print:h-2 bg-[#f6d860] rounded-t mb-3 print:mb-1" />

        {/* 1. Header with CBSE Logo, School Details, School Logo */}
        <div className="flex items-center justify-between border-b border-black pb-3 mb-3 print:pb-1.5 print:mb-1">
          {/* Left CBSE Logo */}
          <div className="w-20 sm:w-24 print:w-16 flex-shrink-0 flex justify-center">
            <img
              src={cbseLogo}
              alt="CBSE Logo"
              className="w-18 sm:w-22 h-18 sm:h-22 print:w-14 print:h-14 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Center School Details */}
          <div className="flex-1 text-center px-2">
            <h1 className="text-2xl sm:text-3xl print:text-xl font-black tracking-wider text-[#1a4329] uppercase leading-tight font-sans">
              {school.school_name || 'ADVANCED ACADEMY'}
            </h1>
            <div className="text-[11px] sm:text-xs print:text-[8.5px] font-bold text-amber-800 tracking-wide mt-0.5 print:mt-0">
              C.B.S.E. AFFILIATION No. : {school.affiliation_no || '1030183'} – SCHOOL CODE : {school.school_code || '50161'}
            </div>
            <p className="text-[9px] sm:text-[10px] print:text-[7.5px] text-slate-800 leading-tight mt-1 print:mt-0.5 font-medium">
              {school.address || 'ISKCON Vihar Colony, Nipania Road, Indore - 452010 (M.P.) Contact : 7415666676, 7415666686, 9827720868, 9691125004'}
            </p>
            <p className="text-[9px] sm:text-[10px] print:text-[7.5px] text-slate-800 leading-tight font-medium">
              {school.city_office || 'City Office : Baikunthdham, (Near Anand Bazaar), Indore - 452018 Phone : (0731) 2561192, 7415061192'}
            </p>
            <p className="text-[9px] sm:text-[10px] print:text-[7.5px] text-slate-800 leading-tight font-medium">
              E-mail : {school.email || 'advancedindore@gmail.com'}, Website : {school.website || 'www.advancedacademyindore.com'}
            </p>
          </div>

          {/* Right Advanced Academy Logo */}
          <div className="w-20 sm:w-24 print:w-16 flex-shrink-0 flex justify-center">
            <img
              src={schoolLogo}
              alt="School Logo"
              className="w-18 sm:w-22 h-18 sm:h-22 print:w-14 print:h-14 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* 2. Academic Session & Report Card Heading */}
        <div className="text-center my-2 print:my-1 space-y-0.5 print:space-y-0">
          <div className="text-sm sm:text-base print:text-xs font-bold text-black font-serif leading-tight">
            Academic Session : {session.session_name || '2022 - 2023'}
          </div>
          <div className="text-sm sm:text-base print:text-xs font-bold text-black font-serif leading-tight">
            Report Card : Annual Exam
          </div>
        </div>

        {/* 3. Student Details Box with Dotted Underline */}
        <div className="border border-black p-2.5 print:p-1.5 my-2.5 print:my-1 text-xs print:text-[9px] text-black">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 print:gap-x-4 print:gap-y-0.5">
            {/* Left Column */}
            <div className="flex items-center">
              <span className="w-28 print:w-24 font-bold flex-shrink-0">Student Name</span>
              <span className="mr-2 print:mr-1 font-bold">:</span>
              <span className="flex-1 font-bold uppercase border-b border-dotted border-black pb-0.5 print:pb-0 truncate">
                {student.student_name}
              </span>
            </div>
            {/* Right Column */}
            <div className="flex items-center">
              <span className="w-28 print:w-24 font-bold flex-shrink-0">Scholar No.</span>
              <span className="mr-2 print:mr-1 font-bold">:</span>
              <span className="flex-1 font-bold border-b border-dotted border-black pb-0.5 print:pb-0">
                {student.scholar_number}
              </span>
            </div>

            <div className="flex items-center">
              <span className="w-28 print:w-24 font-bold flex-shrink-0">Father's Name</span>
              <span className="mr-2 print:mr-1 font-bold">:</span>
              <span className="flex-1 font-bold uppercase border-b border-dotted border-black pb-0.5 print:pb-0 truncate">
                {student.father_name}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-28 print:w-24 font-bold flex-shrink-0">Roll No.</span>
              <span className="mr-2 print:mr-1 font-bold">:</span>
              <span className="flex-1 font-bold border-b border-dotted border-black pb-0.5 print:pb-0">
                {student.roll_number}
              </span>
            </div>

            <div className="flex items-center">
              <span className="w-28 print:w-24 font-bold flex-shrink-0">Mother's Name</span>
              <span className="mr-2 print:mr-1 font-bold">:</span>
              <span className="flex-1 font-bold uppercase border-b border-dotted border-black pb-0.5 print:pb-0 truncate">
                {student.mother_name}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-28 print:w-24 font-bold flex-shrink-0">Class & Sec</span>
              <span className="mr-2 print:mr-1 font-bold">:</span>
              <span className="flex-1 font-bold border-b border-dotted border-black pb-0.5 print:pb-0">
                {((c) => {
                  const m: Record<string, string> = {
                    '1st': 'I A', '2nd': 'II A', '3rd': 'III A', '4th': 'IV A', '5th': 'V A',
                    '6th': 'VI A', '7th': 'VII A', '8th': 'VIII E', '9th': 'IX A', '10th': 'X A',
                    '11th': 'XI', '12th': 'XII'
                  };
                  return (c && m[c]) || c || 'VIII E';
                })(student.class_name)} {student.stream_name ? `(${student.stream_name})` : ''}
              </span>
            </div>

            <div className="flex items-center">
              <span className="w-28 print:w-24 font-bold flex-shrink-0">Date of Birth</span>
              <span className="mr-2 print:mr-1 font-bold">:</span>
              <span className="flex-1 font-bold border-b border-dotted border-black pb-0.5 print:pb-0">
                {student.date_of_birth}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-28 print:w-24 font-bold flex-shrink-0">Attendance</span>
              <span className="mr-2 print:mr-1 font-bold">:</span>
              <span className="flex-1 font-bold border-b border-dotted border-black pb-0.5 print:pb-0">
                {attendance || student.attendance || '224/ 241'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Scholastic Areas Table */}
        <div className="overflow-x-auto my-2.5 print:my-1">
          <table className="w-full text-center border-collapse border border-black text-[11px] sm:text-xs print:text-[8.5px]">
            <thead>
              {/* Row 1: Groups */}
              <tr className="border-b border-black">
                <th
                  rowSpan={2}
                  className="border-r border-black p-1.5 print:p-0.5 print:px-1 text-left font-bold align-bottom w-36 print:w-28 bg-slate-50/50"
                >
                  <div className="text-[10px] print:text-[7.5px] text-slate-700">Scholastic Areas:</div>
                  <div className="text-xs print:text-[8.5px] font-bold text-black mt-1 print:mt-0">Subjects</div>
                </th>
                <th colSpan={6} className="border-r border-black p-1 print:p-0.5 font-bold text-center bg-slate-50/50 print:text-[8.5px]">
                  Term I (100 marks)
                </th>
                <th colSpan={6} className="p-1 print:p-0.5 font-bold text-center bg-slate-50/50 print:text-[8.5px]">
                  Term II (100 marks)
                </th>
              </tr>
              {/* Row 2: Sub-columns */}
              <tr className="border-b border-black text-[10px] print:text-[7.5px]">
                {/* Term I subheaders */}
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-11 print:w-9 print:leading-tight">
                  <div>Per</div>
                  <div>Test</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">10</div>
                </th>
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-11 print:w-9 print:leading-tight">
                  <div>Note</div>
                  <div>Book</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">5</div>
                </th>
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-12 print:w-10 print:leading-tight">
                  <div>Sub</div>
                  <div>Enrich</div>
                  <div>ment</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">5</div>
                </th>
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-13 print:w-11 print:leading-tight">
                  <div>Half</div>
                  <div>Yearly</div>
                  <div>Exam</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">80</div>
                </th>
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-14 print:w-12 print:leading-tight">
                  <div>Marks</div>
                  <div>Obtained</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">100</div>
                </th>
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-11 print:w-9 align-middle">
                  <div>Grade</div>
                </th>

                {/* Term II subheaders */}
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-11 print:w-9 print:leading-tight">
                  <div>Per</div>
                  <div>Test</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">10</div>
                </th>
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-11 print:w-9 print:leading-tight">
                  <div>Note</div>
                  <div>Book</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">5</div>
                </th>
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-12 print:w-10 print:leading-tight">
                  <div>Sub</div>
                  <div>Enrich</div>
                  <div>ment</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">5</div>
                </th>
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-13 print:w-11 print:leading-tight">
                  <div>Annual</div>
                  <div>Exam</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">80</div>
                </th>
                <th className="border-r border-black p-1 print:p-0.5 font-bold w-14 print:w-12 print:leading-tight">
                  <div>Marks</div>
                  <div>Obtained</div>
                  <div className="text-[9px] print:text-[7px] font-normal text-slate-600 border-t border-black/30 mt-0.5 print:mt-0">100</div>
                </th>
                <th className="p-1 print:p-0.5 font-bold w-11 print:w-9 align-middle">
                  <div>Grade</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {allSubjectNames.map((sname) => {
                const t1 = t1Map.get(sname);
                const t2 = t2Map.get(sname);

                return (
                  <tr key={sname} className="border-b border-black hover:bg-slate-50/50">
                    <td className="border-r border-black p-1.5 print:p-0.5 print:px-1 text-left font-semibold uppercase print:text-[8px]">
                      {sname}
                    </td>

                    {/* Term I Values */}
                    <td className="border-r border-black p-1 print:p-0.5 print:text-[8px]">
                      {t1?.periodic_test !== undefined && t1?.periodic_test !== null ? t1.periodic_test : '-'}
                    </td>
                    <td className="border-r border-black p-1 print:p-0.5 print:text-[8px]">
                      {t1?.notebook !== undefined && t1?.notebook !== null ? t1.notebook : '-'}
                    </td>
                    <td className="border-r border-black p-1 print:p-0.5 print:text-[8px]">
                      {t1?.sub_enrichment !== undefined && t1?.sub_enrichment !== null ? t1.sub_enrichment : '-'}
                    </td>
                    <td className="border-r border-black p-1 print:p-0.5 print:text-[8px]">
                      {t1?.term_exam !== undefined && t1?.term_exam !== null ? t1.term_exam : '-'}
                    </td>
                    <td className="border-r border-black p-1 print:p-0.5 font-bold print:text-[8px]">
                      {t1?.obtained_marks !== undefined && t1?.obtained_marks !== null ? t1.obtained_marks : '-'}
                    </td>
                    <td className="border-r border-black p-1 print:p-0.5 font-bold print:text-[8px]">
                      {t1?.grade || '-'}
                    </td>

                    {/* Term II Values */}
                    <td className="border-r border-black p-1 print:p-0.5 print:text-[8px]">
                      {t2?.periodic_test !== undefined && t2?.periodic_test !== null ? t2.periodic_test : '-'}
                    </td>
                    <td className="border-r border-black p-1 print:p-0.5 print:text-[8px]">
                      {t2?.notebook !== undefined && t2?.notebook !== null ? t2.notebook : '-'}
                    </td>
                    <td className="border-r border-black p-1 print:p-0.5 print:text-[8px]">
                      {t2?.sub_enrichment !== undefined && t2?.sub_enrichment !== null ? t2.sub_enrichment : '-'}
                    </td>
                    <td className="border-r border-black p-1 print:p-0.5 print:text-[8px]">
                      {t2?.term_exam !== undefined && t2?.term_exam !== null ? t2.term_exam : '-'}
                    </td>
                    <td className="border-r border-black p-1 print:p-0.5 font-bold print:text-[8px]">
                      {t2?.obtained_marks !== undefined && t2?.obtained_marks !== null ? t2.obtained_marks : '-'}
                    </td>
                    <td className="p-1 print:p-0.5 font-bold print:text-[8px]">
                      {t2?.grade || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 5. Co-Scholastic Areas Table (Side-by-Side Term 1 & Term 2) */}
        <div className="overflow-x-auto my-2.5 print:my-1">
          <table className="w-full border-collapse border border-black text-[11px] sm:text-xs print:text-[8px]">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="border-r border-black p-1.5 print:p-0.5 print:px-1 text-left w-5/12 bg-slate-50/50 print:text-[8px]">
                  Co-Scholastic Areas : Term-1 [on a 3 point (A-C) grading Scale]
                </th>
                <th className="border-r border-black p-1.5 print:p-0.5 text-center w-1/12 bg-slate-50/50 print:text-[8px]">
                  Grade
                </th>
                <th className="border-r border-black p-1.5 print:p-0.5 print:px-1 text-left w-5/12 bg-slate-50/50 print:text-[8px]">
                  Co-Scholastic Areas : Term-2 [on a 3 point (A-C) grading Scale]
                </th>
                <th className="p-1.5 print:p-0.5 text-center w-1/12 bg-slate-50/50 print:text-[8px]">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody>
              {coScholasticList.map((item) => (
                <tr key={item.name} className="border-b border-black">
                  <td className="border-r border-black p-1.5 print:p-0.5 print:px-1 text-left font-semibold uppercase print:text-[8px]">
                    {item.name}
                  </td>
                  <td className="border-r border-black p-1.5 print:p-0.5 text-center font-bold print:text-[8px]">
                    {item.grade_term1}
                  </td>
                  <td className="border-r border-black p-1.5 print:p-0.5 print:px-1 text-left font-semibold uppercase print:text-[8px]">
                    {item.name}
                  </td>
                  <td className="p-1.5 print:p-0.5 text-center font-bold print:text-[8px]">
                    {item.grade_term2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 6. Discipline Table (Term 1 & Term 2) */}
        <div className="overflow-x-auto my-2.5 print:my-1">
          <table className="w-full border-collapse border border-black text-[11px] sm:text-xs print:text-[8px]">
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1.5 print:p-0.5 print:px-1 text-left font-bold w-5/12 print:text-[8px]">
                  DISCIPLINE : Term-1 [on a 3 point (A-C) grading scale]
                </td>
                <td className="border-r border-black p-1.5 print:p-0.5 text-center font-bold w-1/12 print:text-[8px]">
                  {disciplineGradeT1}
                </td>
                <td className="border-r border-black p-1.5 print:p-0.5 print:px-1 text-left font-bold w-5/12 print:text-[8px]">
                  DISCIPLINE : Term-2 [on a 3 point (A-C) grading scale]
                </td>
                <td className="p-1.5 print:p-0.5 text-center font-bold w-1/12 print:text-[8px]">
                  {disciplineGradeT2}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 7. Teacher's Remarks & Promotion */}
        <div className="border border-black p-2.5 print:p-1.5 my-2.5 print:my-1 text-xs print:text-[9px] text-black space-y-2 print:space-y-0.5">
          <div className="flex items-center">
            <span className="font-bold flex-shrink-0 mr-2">Class Teacher's Remark :</span>
            <span className="font-semibold text-slate-900">
              {class_teacher_remark || 'Excellent! Keep up the good work!'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-bold flex-shrink-0 mr-2">Promoted to Class :</span>
            <span className="font-bold underline decoration-dotted px-2">
              {promoted_to_class || 'IX D'}
            </span>
          </div>
        </div>

        {/* 8. Date and Signatures */}
        <div className="flex items-end justify-between px-2 pt-6 pb-2 print:pt-2 print:pb-0.5 text-xs print:text-[9px] font-bold text-black">
          <div className="w-1/3">
            <span>Date : </span>
            <span className="underline decoration-dotted">{date_str || 'March 24, 2023'}</span>
          </div>
          <div className="w-1/3 text-center">
            <div className="h-10 print:h-4"></div>
            <span>Class Teacher</span>
          </div>
          <div className="w-1/3 text-right">
            <div className="h-10 print:h-4"></div>
            <span>Principal</span>
          </div>
        </div>

        {/* 9. Grading Scale for Scholastic Areas (8 point scale) */}
        <div className="mt-3 print:mt-1 text-[10px] print:text-[7.5px] text-black">
          <div className="mb-1 print:mb-0.5 font-medium print:text-[7.5px]">
            <b>Grading scale for scholastic areas:</b> Grades are awarded on an 8 point grading scale as follows -
          </div>
          <table className="w-full border-collapse border border-black text-center text-[9px] sm:text-[10px] print:text-[7px]">
            <tbody>
              <tr className="border-b border-black font-bold">
                <td className="border-r border-black p-1 print:p-0.5 bg-slate-50/50 w-20 print:w-16">Range (%)</td>
                {defaultGradingScale.map((item, idx) => (
                  <td
                    key={item.range}
                    className={`border-r border-black p-1 print:p-0.5 last:border-r-0 ${
                      idx === defaultGradingScale.length - 1 ? 'w-28 print:w-24' : ''
                    }`}
                  >
                    {item.range}
                  </td>
                ))}
              </tr>
              <tr className="font-bold">
                <td className="border-r border-black p-1 print:p-0.5 bg-slate-50/50">Grade</td>
                {defaultGradingScale.map((item, idx) => (
                  <td
                    key={item.range}
                    className={`border-r border-black p-1 print:p-0.5 last:border-r-0 whitespace-pre-line leading-tight ${
                      idx === defaultGradingScale.length - 1 ? 'w-28 print:w-24 text-[8px] sm:text-[9px] print:text-[6.5px]' : ''
                    }`}
                  >
                    {item.grade}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default ReportCard;
