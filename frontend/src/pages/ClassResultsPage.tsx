import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { ClassEntity, Examination, ClassResultResponse, StudentResult } from '../types';
import {
  Award,
  Filter,
  FileText,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  User,
  Search,
  Trophy,
  Medal,
  Sparkles,
  Star,
  ChevronRight,
} from 'lucide-react';

interface ClassResultsPageProps {
  initialClassId?: number;
  initialExamId?: number;
  onOpenReportCard: (studentId: number, examId: number) => void;
  onOpenStudentProfile: (studentId: number) => void;
}

export const ClassResultsPage: React.FC<ClassResultsPageProps> = ({
  initialClassId,
  initialExamId,
  onOpenReportCard,
  onOpenStudentProfile,
}) => {
  const { activeSession, canAccessClass, user, hasPermission } = useAuth();
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(initialClassId || 1);
  const [selectedExamId, setSelectedExamId] = useState<number>(initialExamId || 1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [data, setData] = useState<ClassResultResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
          } else if (!initialClassId) {
            setSelectedClassId(availableClasses[0].id);
          }
        }
        if (!initialExamId && exRes.data.length > 0) {
          setSelectedExamId(exRes.data[0].id);
        }
      } catch (e) {
        console.error('Failed to load class/exam metadata:', e);
      }
    };
    fetchMeta();
  }, [user]);

  const fetchResults = async () => {
    if (!activeSession || !selectedClassId || !selectedExamId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/results/class', {
        params: {
          class_id: selectedClassId,
          exam_id: selectedExamId,
          session_id: activeSession.id,
        },
      });
      setData(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access Forbidden: You are not authorized to view results for this class.');
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch class results.');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedClassId, selectedExamId, activeSession]);

  // Compute Ranks based on total obtained percentage
  const sortedStudents = [...(data?.results || [])].sort((a, b) => b.percentage - a.percentage);
  const rankMap = new Map<number, number>();
  sortedStudents.forEach((st, idx) => {
    rankMap.set(st.student_id, idx + 1);
  });

  const top1 = sortedStudents[0];
  const top2 = sortedStudents[1];
  const top3 = sortedStudents[2];

  // Filter results by search query
  const filteredResults = (data?.results || []).filter((st) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.student_name.toLowerCase().includes(q) ||
      st.scholar_number.toLowerCase().includes(q) ||
      String(st.roll_number).includes(q)
    );
  });

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.class_name || '';
  const selectedExamName = exams.find((e) => e.id === selectedExamId)?.exam_name || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>ACADEMIC PERFORMANCE & CBSE RESULT COMPILATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center font-display tracking-tight">
            <Award className="w-7 h-7 mr-2 text-emerald-700" />
            Class Results & Performance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Comprehensive exam performance, grades, pass percentages, and report card generator for Class {selectedClassName}.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.class_name} ({c.student_count || 10} students)
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.exam_name} ({ex.exam_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs sm:text-sm font-semibold flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 3 Podium Showcase (When Data Exists) */}
      {data && sortedStudents.length >= 3 && (
        <div>
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700">
            <span className="flex items-center">
              <Trophy className="w-4 h-4 mr-1.5 text-amber-500" />
              Class {selectedClassName} Academic Podium ({selectedExamName})
            </span>
            <span className="text-slate-400">Top 3 Scholastic Ranks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rank 2 - Silver */}
            {top2 && (
              <div className="podium-silver rounded-2xl p-4 text-center relative overflow-hidden transition-all hover:scale-102">
                <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black text-sm flex items-center justify-center mx-auto mb-2 border border-slate-400 shadow-xs">
                  🥈
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Rank #2 • Silver</span>
                <h4 className="font-extrabold text-slate-900 text-base mt-1">{top2.student_name}</h4>
                <div className="text-xs text-slate-600">Scholar: {top2.scholar_number} • Roll: {top2.roll_number}</div>
                <div className="mt-3 flex items-center justify-center space-x-2">
                  <span className="text-xl font-black text-slate-900">{top2.percentage}%</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Grade {top2.grade}
                  </span>
                </div>
                <button
                  onClick={() => onOpenReportCard(top2.student_id, selectedExamId)}
                  className="mt-3 text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  View CBSE Report Card →
                </button>
              </div>
            )}

            {/* Rank 1 - Gold (Center, Elevated) */}
            {top1 && (
              <div className="podium-gold glow-pulse-gold rounded-2xl p-5 text-center relative overflow-hidden transition-all hover:scale-105 border-2 border-amber-500 shadow-xl">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 font-black text-lg flex items-center justify-center mx-auto mb-2 border-2 border-amber-600 shadow-md">
                  🥇
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">Rank #1 • Class Valedictorian</span>
                <h4 className="font-black text-slate-950 text-lg mt-1 font-display">{top1.student_name}</h4>
                <div className="text-xs text-amber-950 font-semibold">Scholar: {top1.scholar_number} • Roll: {top1.roll_number}</div>
                <div className="mt-3 flex items-center justify-center space-x-2">
                  <span className="text-2xl font-black text-slate-950">{top1.percentage}%</span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-800 text-white shadow-xs">
                    Grade {top1.grade}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onOpenReportCard(top1.student_id, selectedExamId);
                  }}
                  className="mt-3 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>Open Winner's Report Card</span>
                </button>
              </div>
            )}

            {/* Rank 3 - Bronze */}
            {top3 && (
              <div className="podium-bronze rounded-2xl p-4 text-center relative overflow-hidden transition-all hover:scale-102">
                <div className="w-8 h-8 rounded-full bg-orange-300 text-orange-950 font-black text-sm flex items-center justify-center mx-auto mb-2 border border-orange-400 shadow-xs">
                  🥉
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-900">Rank #3 • Bronze</span>
                <h4 className="font-extrabold text-slate-900 text-base mt-1">{top3.student_name}</h4>
                <div className="text-xs text-orange-900">Scholar: {top3.scholar_number} • Roll: {top3.roll_number}</div>
                <div className="mt-3 flex items-center justify-center space-x-2">
                  <span className="text-xl font-black text-slate-900">{top3.percentage}%</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-200 text-orange-900">
                    Grade {top3.grade}
                  </span>
                </div>
                <button
                  onClick={() => onOpenReportCard(top3.student_id, selectedExamId)}
                  className="mt-3 text-xs font-bold text-orange-900 hover:underline cursor-pointer"
                >
                  View CBSE Report Card →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistical Summary Cards */}
      {data?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center card-interactive">
            <span className="text-xs text-slate-500 block">Total Students</span>
            <span className="text-xl font-extrabold text-slate-900 font-display">{data.stats.total_students}</span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-center card-interactive">
            <span className="text-xs text-emerald-800 block font-bold">Passed</span>
            <span className="text-xl font-black text-emerald-700 font-display">{data.stats.passed_count}</span>
          </div>

          <div className="bg-red-50/60 p-4 rounded-xl border border-red-200 text-center card-interactive">
            <span className="text-xs text-red-800 block font-bold">Failed</span>
            <span className="text-xl font-black text-red-700 font-display">{data.stats.failed_count}</span>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-center card-interactive">
            <span className="text-xs text-amber-800 block font-bold">Pending Marks</span>
            <span className="text-xl font-black text-amber-700 font-display">{data.stats.pending_count}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center card-interactive">
            <span className="text-xs text-slate-500 block">Average %</span>
            <span className="text-xl font-black text-blue-900 font-display">{data.stats.average_percentage}%</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center card-interactive">
            <span className="text-xs text-slate-500 block">Highest %</span>
            <span className="text-xl font-black text-emerald-700 font-display">{data.stats.highest_percentage}%</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center card-interactive">
            <span className="text-xs text-slate-500 block">Lowest %</span>
            <span className="text-xl font-black text-slate-700 font-display">{data.stats.lowest_percentage}%</span>
          </div>
        </div>
      )}

      {/* Results Table Section */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Calculating results...</div>
      ) : data ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student, scholar, or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <b className="text-slate-800">{filteredResults.length}</b> of {data.results.length} students
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4 w-14 text-center">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 w-28">Scholar No.</th>
                  <th className="py-3 px-4 text-center">Total Max</th>
                  <th className="py-3 px-4 text-center">Obtained</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Division</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((st) => {
                  const rank = rankMap.get(st.student_id) || 0;
                  return (
                    <tr key={st.student_id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-4 text-center">
                        {rank === 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            🥇 #1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-800 border border-slate-300">
                            🥈 #2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-900 border border-orange-300">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">#{rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{st.roll_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {st.student_name}
                        {st.stream_name && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-normal">
                            {st.stream_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{st.scholar_number}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{st.total_maximum_marks}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{st.total_obtained_marks}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-emerald-950">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200">
                          {st.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            st.result_status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.result_status === 'FAIL'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {st.result_status === 'PASS' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />}
                          {st.result_status === 'FAIL' && <XCircle className="w-3 h-3 mr-1 text-red-600" />}
                          {st.result_status === 'PENDING' && <HelpCircle className="w-3 h-3 mr-1 text-amber-600" />}
                          {st.result_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700 font-medium">{st.division || '-'}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-slate-800">{st.grade || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onOpenStudentProfile(st.student_id)}
                            title="View Student Profile"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <User className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenReportCard(st.student_id, selectedExamId)}
                            className="inline-flex items-center px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                            Report Card
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ClassResultsPage;
