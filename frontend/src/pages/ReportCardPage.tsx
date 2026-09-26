import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { ReportCardData, ClassEntity, Examination, Student } from '../types';
import ReportCard from '../components/ReportCard';
import { ArrowLeft, FileText, Search } from 'lucide-react';

interface ReportCardPageProps {
  initialStudentId?: number;
  initialExamId?: number;
  onBack?: () => void;
}

export const ReportCardPage: React.FC<ReportCardPageProps> = ({
  initialStudentId,
  initialExamId,
  onBack,
}) => {
  const { user, hasPermission } = useAuth();
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(initialStudentId || 0);
  const [selectedExamId, setSelectedExamId] = useState<number>(initialExamId || 0);

  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load classes and exams on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [clsRes, exRes] = await Promise.all([
          apiClient.get('/classes'),
          apiClient.get('/examinations'),
        ]);
        const isSuperAdmin = user?.roles.includes('SUPER_ADMIN');
        const isPrincipal = user?.roles.includes('PRINCIPAL') && !isSuperAdmin;
        const isClassTeacher = user?.roles.includes('CLASS_TEACHER') && !isSuperAdmin && !isPrincipal;
        const canViewAll = isSuperAdmin || isPrincipal || hasPermission('VIEW_ALL_RESULTS');

        const availableClasses = (!canViewAll && isClassTeacher && user?.assigned_class_ids?.length)
          ? clsRes.data.filter((c: ClassEntity) => user.assigned_class_ids.includes(c.id))
          : clsRes.data;

        setClasses(availableClasses);
        setExams(exRes.data);
        if (availableClasses.length > 0) {
          if (!canViewAll && user?.assigned_class_ids?.length) {
            setSelectedClassId(user.assigned_class_ids[0]);
          } else if (!initialStudentId) {
            setSelectedClassId(availableClasses[0].id);
          }
        }
        if (!initialExamId && exRes.data.length > 0) {
          setSelectedExamId(exRes.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeta();
  }, [user]);

  // When class changes, fetch students for that class
  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!selectedClassId || selectedClassId <= 0) return;
      try {
        const res = await apiClient.get(`/students?class_id=${selectedClassId}`);
        setStudents(res.data.students || []);
        if (res.data.students?.length > 0) {
          // If the initial student isn't in this class, pick first
          const found = res.data.students.find((s: Student) => s.id === selectedStudentId);
          if (!found) {
            setSelectedStudentId(res.data.students[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClassStudents();
  }, [selectedClassId]);

  // If initialStudentId was passed, set class accordingly
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      apiClient.get(`/students/${initialStudentId}`).then((res) => {
        setSelectedClassId(res.data.class_id);
      }).catch(console.error);
    }
  }, [initialStudentId]);

  // Fetch report card data whenever student or exam changes
  useEffect(() => {
    const fetchReportCard = async () => {
      if (!selectedStudentId || !selectedExamId || selectedStudentId <= 0 || selectedExamId <= 0) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/report-cards/${selectedStudentId}/${selectedExamId}`);
        setReportCardData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to generate report card');
        setReportCardData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReportCard();
  }, [selectedStudentId, selectedExamId]);

  return (
    <div className="space-y-6">
      {/* Header Controls (Hidden during print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 font-display flex items-center">
                <FileText className="w-6 h-6 mr-2 text-emerald-700" />
                CBSE Report Card Generator
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Official A4 Progress Report with Term I & Term II scholastic components, co-scholastic grading, and physical rubber seal areas.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={() => {
                setSelectedClassId(8);
                setSelectedStudentId(71);
                setSelectedExamId(3);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm hover:scale-105 active:scale-95 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>⚡ Load Sample: Avaneesh Mahawar (Class VIII E)</span>
            </button>
          </div>
        </div>

        {/* Selection Strip */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  Roll {s.roll_number}: {s.student_name} ({s.scholar_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Examination</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.exam_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error or Loading */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 font-medium">Generating dynamic report card...</div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm font-semibold text-center">
          {error}
        </div>
      ) : reportCardData ? (
        <ReportCard data={reportCardData} />
      ) : null}
    </div>
  );
};

export default ReportCardPage;
