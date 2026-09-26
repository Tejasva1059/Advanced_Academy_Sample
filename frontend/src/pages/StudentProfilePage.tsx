import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { StudentResultProfile, ExamResultSummary } from '../types';
import {
  User,
  ArrowLeft,
  Calendar,
  FileText,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface StudentProfilePageProps {
  studentId: number;
  onBack: () => void;
  onOpenReportCard: (studentId: number, examId: number) => void;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({
  studentId,
  onBack,
  onOpenReportCard,
}) => {
  const [profile, setProfile] = useState<StudentResultProfile | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/results/student/${studentId}`);
        setProfile(res.data);
        if (res.data.exams && res.data.exams.length > 0) {
          setSelectedExamId(res.data.exams[0].exam_id);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load student result profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [studentId]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading student profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error || 'Student not found'}
        </div>
      </div>
    );
  }

  const { student, exams, school } = profile;
  const currentExamSummary: ExamResultSummary | undefined = exams.find((e) => e.exam_id === selectedExamId);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to List
      </button>

      {/* Student Demographic Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {student.student_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                {student.student_name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Class: {student.class_name}</span>
                {student.stream_name && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                    {student.stream_name} Stream
                  </span>
                )}
                <span>•</span>
                <span>Roll No: <b className="text-slate-800">{student.roll_number}</b></span>
                <span>•</span>
                <span>Scholar No: <b className="text-slate-800">{student.scholar_number}</b></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {selectedExamId && (
              <button
                onClick={() => onOpenReportCard(student.id, selectedExamId)}
                className="inline-flex items-center px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                View Full Report Card
              </button>
            )}
          </div>
        </div>

        {/* Detailed Demographics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-slate-400 block text-xs">Father's Name</span>
            <span className="font-semibold text-slate-800">{student.father_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Mother's Name</span>
            <span className="font-semibold text-slate-800">{student.mother_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Date of Birth</span>
            <span className="font-semibold text-slate-800">{student.date_of_birth}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Gender</span>
            <span className="font-semibold text-slate-800">{student.gender}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Admission Number</span>
            <span className="font-mono text-slate-800">{student.admission_number}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Contact</span>
            <span className="text-slate-800">{student.contact_number || 'N/A'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 block text-xs">Address</span>
            <span className="text-slate-800">{student.address || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Examination Independent Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-900" />
            Independent Examination Results
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Marks are independent and not averaged across terms
          </span>
        </div>

        <div className="flex space-x-2 border-b border-slate-200">
          {exams.map((ex) => {
            const isActive = ex.exam_id === selectedExamId;
            return (
              <button
                key={ex.exam_id}
                onClick={() => setSelectedExamId(ex.exam_id)}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {ex.exam_name}
              </button>
            );
          })}
        </div>

        {/* Selected Examination Performance Detail */}
        {currentExamSummary ? (
          <div className="space-y-4">
            {/* Top Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Total Maximum</span>
                <span className="text-lg font-bold text-slate-800">{currentExamSummary.total_maximum_marks}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Total Obtained</span>
                <span className="text-lg font-bold text-blue-900">{currentExamSummary.total_obtained_marks}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Percentage</span>
                <span className="text-lg font-extrabold text-slate-900">{currentExamSummary.percentage}%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Result Status</span>
                <span className={`text-lg font-extrabold ${
                  currentExamSummary.result_status === 'PASS' ? 'text-emerald-600' :
                  currentExamSummary.result_status === 'FAIL' ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {currentExamSummary.result_status}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Division</span>
                <span className="text-lg font-bold text-slate-800">{currentExamSummary.division || 'N/A'}</span>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4 text-center">Max Marks</th>
                    <th className="py-3 px-4 text-center">Passing Marks</th>
                    <th className="py-3 px-4 text-center">Marks Obtained</th>
                    <th className="py-3 px-4 text-center">Grade</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentExamSummary.subject_scores.map((sub, idx) => (
                    <tr key={sub.subject_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{sub.subject_name}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{sub.maximum_marks}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{sub.passing_marks}</td>
                      <td className="py-3 px-4 text-center font-bold">
                        {sub.obtained_marks !== null ? (
                          <span className={sub.is_passed ? 'text-slate-900' : 'text-red-600'}>
                            {sub.obtained_marks}
                          </span>
                        ) : (
                          <span className="text-amber-600 italic font-semibold">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{sub.grade || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {sub.remarks || (sub.is_passed ? 'Passed' : sub.obtained_marks !== null ? 'Needs Improvement' : 'Pending Entry')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default StudentProfilePage;
