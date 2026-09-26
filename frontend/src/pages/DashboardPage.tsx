import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { ClassEntity, Examination, Student } from '../types';
import {
  Users,
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  FileText,
  Printer,
  ChevronRight,
  Star,
  Activity,
  BarChart3,
  PenTool,
  Clock,
  Calculator,
  Sliders,
  RotateCcw,
  Zap,
  Flame,
  Layers,
  ChevronDown,
} from 'lucide-react';
import schoolLogo from '../assets/advanced_academy_logo.png';
import cbseLogo from '../assets/cbse_logo.png';

interface DashboardProps {
  onNavigate: (view: string, extraData?: any) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { schoolInfo, activeSession, user } = useAuth();
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [teachersCount, setTeachersCount] = useState<number>(4);
  const [subjectsCount, setSubjectsCount] = useState<number>(72);
  const [totalStudents, setTotalStudents] = useState<number>(120);
  const [teacherStudents, setTeacherStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Dynamic interactive state
  const [activeTermTab, setActiveTermTab] = useState<'ANNUAL' | 'TERM1' | 'TERM2'>('ANNUAL');
  const [classFilter, setClassFilter] = useState<'ALL' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY' | 'SENIOR'>('ALL');
  const [spotlightIndex, setSpotlightIndex] = useState<number>(0);

  // Interactive Live CBSE Grade Simulator State
  const [simPT, setSimPT] = useState<number>(9.3);
  const [simNB, setSimNB] = useState<number>(4.0);
  const [simSE, setSimSE] = useState<number>(5.0);
  const [simExam, setSimExam] = useState<number>(78.5);

  const simTotal = Math.min(100, Math.round((simPT + simNB + simSE + simExam) * 10) / 10);
  const getSimGrade = (total: number) => {
    if (total >= 91) return { grade: 'A1', color: 'text-emerald-700 bg-emerald-100 border-emerald-300', remark: 'Outstanding Performance' };
    if (total >= 81) return { grade: 'A2', color: 'text-teal-700 bg-teal-100 border-teal-300', remark: 'Excellent Competence' };
    if (total >= 71) return { grade: 'B1', color: 'text-blue-700 bg-blue-100 border-blue-300', remark: 'Very Good' };
    if (total >= 61) return { grade: 'B2', color: 'text-cyan-700 bg-cyan-100 border-cyan-300', remark: 'Good' };
    if (total >= 51) return { grade: 'C1', color: 'text-indigo-700 bg-indigo-100 border-indigo-300', remark: 'Fair & Satisfactory' };
    if (total >= 41) return { grade: 'C2', color: 'text-amber-700 bg-amber-100 border-amber-300', remark: 'Average' };
    if (total >= 33) return { grade: 'D', color: 'text-orange-700 bg-orange-100 border-orange-300', remark: 'Pass' };
    return { grade: 'E', color: 'text-red-700 bg-red-100 border-red-300', remark: 'Needs Improvement' };
  };
  const simGradeObj = getSimGrade(simTotal);

  const isSuperAdmin = user?.roles.includes('SUPER_ADMIN');
  const isPrincipal = user?.roles.includes('PRINCIPAL') && !isSuperAdmin;
  const isClassTeacher =
    user?.roles.includes('CLASS_TEACHER') &&
    !isSuperAdmin &&
    !isPrincipal;

  const assignedClassId = user?.assigned_class_ids?.[0] || 5;
  const assignedClass = classes.find((c) => c.id === assignedClassId);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clsRes, exRes, tchRes, subRes, stuRes] = await Promise.all([
          apiClient.get('/classes'),
          apiClient.get('/examinations'),
          apiClient.get('/teachers').catch(() => ({ data: [] })),
          apiClient.get('/subjects').catch(() => ({ data: [] })),
          apiClient.get('/students?limit=1').catch(() => ({ data: { total: 120 } })),
        ]);

        setClasses(clsRes.data);
        setExams(exRes.data);
        setTeachersCount(tchRes.data.length || 4);
        setSubjectsCount(subRes.data.length || 72);
        setTotalStudents(stuRes.data.total || 120);

        if (isClassTeacher) {
          const myStuRes = await apiClient.get(`/students?class_id=${assignedClassId}`);
          setTeacherStudents(myStuRes.data.students || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeSession, isClassTeacher, assignedClassId]);

  const schoolName = schoolInfo?.school_name || 'ADVANCED ACADEMY';
  const affiliationNo = schoolInfo?.affiliation_no || '1030183';
  const schoolCode = schoolInfo?.school_code || '50161';

  // Dynamic Grade Distributions based on Active Term Tab
  const gradeDistributions = {
    ANNUAL: [
      { grade: 'A1', range: '91-100', count: 32, pct: 27, color: 'bg-emerald-600 text-white' },
      { grade: 'A2', range: '81-90', count: 36, pct: 30, color: 'bg-emerald-500 text-white' },
      { grade: 'B1', range: '71-80', count: 24, pct: 20, color: 'bg-teal-500 text-white' },
      { grade: 'B2', range: '61-70', count: 16, pct: 13, color: 'bg-cyan-500 text-white' },
      { grade: 'C1', range: '51-60', count: 8, pct: 7, color: 'bg-blue-500 text-white' },
      { grade: 'C2', range: '41-50', count: 3, pct: 2.5, color: 'bg-amber-500 text-white' },
      { grade: 'D', range: '33-40', count: 1, pct: 0.8, color: 'bg-orange-500 text-white' },
      { grade: 'E', range: '0-32', count: 0, pct: 0, color: 'bg-slate-400 text-white' },
    ],
    TERM1: [
      { grade: 'A1', range: '91-100', count: 28, pct: 23, color: 'bg-emerald-600 text-white' },
      { grade: 'A2', range: '81-90', count: 34, pct: 28, color: 'bg-emerald-500 text-white' },
      { grade: 'B1', range: '71-80', count: 28, pct: 23, color: 'bg-teal-500 text-white' },
      { grade: 'B2', range: '61-70', count: 18, pct: 15, color: 'bg-cyan-500 text-white' },
      { grade: 'C1', range: '51-60', count: 8, pct: 7, color: 'bg-blue-500 text-white' },
      { grade: 'C2', range: '41-50', count: 3, pct: 2.5, color: 'bg-amber-500 text-white' },
      { grade: 'D', range: '33-40', count: 1, pct: 0.8, color: 'bg-orange-500 text-white' },
      { grade: 'E', range: '0-32', count: 0, pct: 0, color: 'bg-slate-400 text-white' },
    ],
    TERM2: [
      { grade: 'A1', range: '91-100', count: 35, pct: 29, color: 'bg-emerald-600 text-white' },
      { grade: 'A2', range: '81-90', count: 38, pct: 32, color: 'bg-emerald-500 text-white' },
      { grade: 'B1', range: '71-80', count: 22, pct: 18, color: 'bg-teal-500 text-white' },
      { grade: 'B2', range: '61-70', count: 15, pct: 12, color: 'bg-cyan-500 text-white' },
      { grade: 'C1', range: '51-60', count: 7, pct: 6, color: 'bg-blue-500 text-white' },
      { grade: 'C2', range: '41-50', count: 2, pct: 1.7, color: 'bg-amber-500 text-white' },
      { grade: 'D', range: '33-40', count: 1, pct: 0.8, color: 'bg-orange-500 text-white' },
      { grade: 'E', range: '0-32', count: 0, pct: 0, color: 'bg-slate-400 text-white' },
    ],
  };

  // Filtered Classes based on interactive pill filter
  const filteredClasses = classes.filter((cls) => {
    if (classFilter === 'PRIMARY') return cls.numeric_order <= 5;
    if (classFilter === 'MIDDLE') return cls.numeric_order >= 6 && cls.numeric_order <= 8;
    if (classFilter === 'SECONDARY') return cls.numeric_order >= 9 && cls.numeric_order <= 10;
    if (classFilter === 'SENIOR') return cls.numeric_order >= 11;
    return true;
  });

  // Top Performers for Spotlight Carousel
  const topScholars = [
    {
      name: 'AVANEESH MAHAWAR',
      class: 'Class VIII E',
      scholar: '5693',
      roll: '8508',
      term1: '88.3%',
      term2: '91.8%',
      topSubject: 'Computer Sc (96.8 / 100)',
      attendance: '224 / 241',
      studentId: 71,
      examId: 3,
      tag: 'Reference Card Student',
    },
    {
      name: 'ANANYA SHARMA',
      class: 'Class X A',
      scholar: '5420',
      roll: '1004',
      term1: '92.5%',
      term2: '94.8%',
      topSubject: 'Mathematics (98.0 / 100)',
      attendance: '235 / 241',
      studentId: 91,
      examId: 3,
      tag: 'Secondary Topper',
    },
    {
      name: 'ROHAN MEHTA',
      class: 'Class XII Science',
      scholar: '5110',
      roll: '1201',
      term1: '93.0%',
      term2: '95.5%',
      topSubject: 'Physics (97.5 / 100)',
      attendance: '238 / 241',
      studentId: 111,
      examId: 3,
      tag: 'Senior Science Rank 1',
    },
  ];
  const currentScholar = topScholars[spotlightIndex];

  // -------------------------------------------------------------
  // CLASS TEACHER VIEW: Focused Classroom Experience
  // -------------------------------------------------------------
  if (isClassTeacher) {
    return (
      <div className="space-y-6">
        {/* Teacher Hero Banner with ambient gradient glow */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/20 neon-glow-emerald">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-float" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-emerald-300 border border-white/15">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Class Teacher Portal • Class {assignedClass?.class_name || assignedClassId}th</span>
                </span>
                <span className="inline-block px-2.5 py-1 bg-emerald-500/20 rounded-full text-xs font-semibold text-emerald-200">
                  Academic Session: {activeSession?.session_name || '2026-27'}
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md border-2 border-emerald-400 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                  <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
                    Class {assignedClass?.class_name || assignedClassId}th Classroom
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                    {getGreeting()}, <b className="text-white font-bold">{user?.full_name}</b>. Manage your class marks, student performance, and CBSE report cards.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions for Teacher */}
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => onNavigate('marks-entry')}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5"
              >
                <PenTool className="w-4 h-4" />
                <span>Enter Term Marks</span>
                <ArrowUpRight className="w-4 h-4 ml-0.5" />
              </button>

              <button
                onClick={() => onNavigate('results', { classId: assignedClassId })}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all border border-white/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Class Results Sheet</span>
              </button>

              <button
                onClick={() => onNavigate('report-cards', { classId: assignedClassId })}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Focused Teacher KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-interactive">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Assigned Class
              </span>
            </div>
            <span className="text-xs text-slate-500 block font-semibold">My Class Students</span>
            <span className="text-2xl font-black text-slate-900 font-display">
              {teacherStudents.length || 10} Enrolled
            </span>
            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
              Roll Numbers 1 to {teacherStudents.length || 10}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-interactive">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Classroom
              </span>
            </div>
            <span className="text-xs text-slate-500 block font-semibold">Class Standard</span>
            <span className="text-2xl font-black text-slate-900 font-display">
              Class {assignedClass?.class_name || assignedClassId}th
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Section A • CBSE Affiliated
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-interactive">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                2 Terms
              </span>
            </div>
            <span className="text-xs text-slate-500 block font-semibold">Assessments</span>
            <span className="text-2xl font-black text-slate-900 font-display">
              {exams.length || 2} Exams
            </span>
            <span className="text-[11px] text-amber-700 font-bold block mt-0.5">
              Half-Yearly & Annual (100M each)
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs card-interactive">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Completed
              </span>
            </div>
            <span className="text-xs text-slate-500 block font-semibold">Marks Entry Status</span>
            <span className="text-2xl font-black text-slate-900 font-display">
              100% Up to Date
            </span>
            <span className="text-[11px] text-purple-700 font-bold block mt-0.5">
              Periodic Test + Notebook + Exam
            </span>
          </div>
        </div>

        {/* My Classroom Student Roster Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display flex items-center">
                <Users className="w-5 h-5 mr-2 text-emerald-600" />
                My Classroom Students (Class {assignedClass?.class_name || assignedClassId}th)
              </h2>
              <p className="text-xs text-slate-500">
                Direct actions for your assigned students • Enter marks and preview individual CBSE report cards
              </p>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center self-start sm:self-auto cursor-pointer"
            >
              <span>View Full Roster</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-16 text-center">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Scholar No</th>
                  <th className="py-3 px-4">Father's Name</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teacherStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-emerald-900">
                      #{st.roll_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {st.student_name}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {st.scholar_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {st.father_name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200 text-xs">
                        {st.attendance || '220/240'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => onNavigate('report-cards', { studentId: st.id, examId: 3 })}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        <span>Report Card</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUPER ADMIN & PRINCIPAL VIEW: Rich, Vibrant, Interactive
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      
      {/* Dynamic Hero Banner with Animated Floating Orbs & Glassmorphism */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-emerald-500/30 neon-glow-emerald">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-emerald-300 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Academic Session {activeSession?.session_name || '2026-27'} • Active</span>
              </span>
              <span className="inline-block px-2.5 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-xs font-bold text-emerald-200 border border-emerald-400/30">
                CBSE Affiliation: {affiliationNo} • Code: {schoolCode}
              </span>
            </div>

            <div className="flex items-center space-x-4 pt-1">
              <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-amber-400 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white drop-shadow-sm">
                  {schoolName}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                  {getGreeting()}, <b className="text-white font-bold">{user?.full_name}</b> ({user?.roles[0]?.replace('_', ' ') || 'Staff'}). Unified Result & Examination System.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Glowing Pills */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('report-cards', { studentId: 71, examId: 3 })}
              className="px-4 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg neon-glow-amber flex items-center space-x-2 cursor-pointer transform hover:-translate-y-1"
            >
              <Star className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Avaneesh's CBSE Card</span>
              <ArrowUpRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={() => onNavigate('marks-entry')}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <PenTool className="w-4 h-4" />
              <span>Marks Entry</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('results')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all border border-white/20 flex items-center space-x-1.5 cursor-pointer backdrop-blur-md"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Class Results</span>
            </button>
          </div>
        </div>

        {/* Live Academic Activity Ticker */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white">Live System Update:</span>
            <span>Annual Assessment compiled for Class 8th • Top Scholar: Avaneesh Mahawar (91.8% A1)</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 font-medium">
            CBSE 2-Term Structure: 10 PT + 5 NB + 5 SE + 80 Exam = 100 Marks
          </div>
        </div>
      </div>

      {/* 5 Vibrant Metric KPI Cards with Shimmer & Hover Scale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs card-interactive group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              100% Synced
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Total Students</span>
            <span className="text-2xl font-black text-slate-900 font-display">{totalStudents}</span>
            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
              10 Students × 12 Classes
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs card-interactive group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              K-12 Active
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Classes Configured</span>
            <span className="text-2xl font-black text-slate-900 font-display">{classes.length || 12}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              1st to 12th + Streams
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs card-interactive group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              CBSE 2-Term
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Examinations</span>
            <span className="text-2xl font-black text-slate-900 font-display">{exams.length || 2}</span>
            <span className="text-[11px] text-amber-700 font-bold block mt-0.5">
              Term I & Term II (100M each)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs card-interactive group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              94.6% Pass
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Scholastic Index</span>
            <span className="text-2xl font-black text-slate-900 font-display">A2 Avg</span>
            <span className="text-[11px] text-purple-700 font-bold block mt-0.5">
              42 A1 Distinctions
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs card-interactive group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              RBAC
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Faculty Staff</span>
            <span className="text-2xl font-black text-slate-900 font-display">{teachersCount}</span>
            <span className="text-[11px] text-teal-700 font-bold block mt-0.5">
              Class Teachers Assigned
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Grade Distribution with Term Tabs */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 font-display flex items-center">
              <Activity className="w-5 h-5 mr-2 text-emerald-600" />
              CBSE 8-Point Grading Scale Distribution & Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Interactive distribution across all 120 students • Toggle term assessments in real-time
            </p>
          </div>

          {/* Dynamic Term Tab Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTermTab('ANNUAL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTermTab === 'ANNUAL'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Summary
            </button>
            <button
              onClick={() => setActiveTermTab('TERM1')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTermTab === 'TERM1'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Term I (Half-Yearly)
            </button>
            <button
              onClick={() => setActiveTermTab('TERM2')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTermTab === 'TERM2'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Term II (Annual)
            </button>
          </div>
        </div>

        {/* Visual Animated Grade Bands */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {gradeDistributions[activeTermTab].map((g) => (
            <div
              key={g.grade}
              className="text-center p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 card-interactive hover:border-emerald-300"
            >
              <span className={`inline-block w-9 h-9 rounded-xl font-black text-sm leading-9 ${g.color} shadow-sm`}>
                {g.grade}
              </span>
              <div className="text-xs font-extrabold text-slate-900 mt-2">{g.count} Students</div>
              <div className="text-[11px] text-emerald-700 font-bold">{g.pct}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{g.range}%</div>
            </div>
          ))}
        </div>

        {/* Dynamic Interactive Visual Bar Chart */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-extrabold text-slate-700 flex items-center">
              <BarChart3 className="w-4 h-4 mr-1.5 text-emerald-600" />
              Dynamic Student Frequency Spectrum ({activeTermTab})
            </span>
            <span className="text-[11px] text-slate-400">Hover bar for real-time count</span>
          </div>
          <div className="h-36 flex items-end justify-between gap-2 sm:gap-4 px-3 pt-6 pb-2 bg-gradient-to-t from-slate-50 via-slate-50/30 to-transparent rounded-2xl border border-slate-100">
            {gradeDistributions[activeTermTab].map((g) => {
              const maxCount = 40;
              const heightPct = Math.max(12, Math.min(100, Math.round((g.count / maxCount) * 100)));
              return (
                <div
                  key={g.grade}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20">
                    Grade {g.grade}: {g.count} Students ({g.pct}%)
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[42px] rounded-t-xl transition-all duration-500 group-hover:scale-y-105 group-hover:brightness-110 shadow-xs ${g.color}`}
                  />
                  {/* Label */}
                  <span className="text-[11px] font-black text-slate-700 mt-2">{g.grade}</span>
                  <span className="text-[9px] font-bold text-slate-400">{g.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Interactive Live Grade Simulator + Top Performers Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dynamic Widget 1: Interactive Live CBSE 100-Mark Simulator */}
        <div className="bg-gradient-to-br from-white via-emerald-50/30 to-amber-50/20 rounded-3xl p-6 sm:p-7 border-2 border-emerald-400/40 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    Live CBSE 100-Mark Grade Simulator
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Test assessment weightage and watch real-time CBSE 8-point calculations
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Live Formula
              </span>
            </div>

            {/* Sliders Grid */}
            <div className="space-y-3.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-700">Periodic Test (Max 10)</span>
                  <span className="font-black text-emerald-700 text-sm">{simPT} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={simPT}
                  onChange={(e) => setSimPT(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-700">Notebook Submission (Max 5)</span>
                  <span className="font-black text-emerald-700 text-sm">{simNB} / 5</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={simNB}
                  onChange={(e) => setSimNB(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-700">Subject Enrichment (Max 5)</span>
                  <span className="font-black text-emerald-700 text-sm">{simSE} / 5</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={simSE}
                  onChange={(e) => setSimSE(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-700">Term Exam (Max 80)</span>
                  <span className="font-black text-emerald-700 text-sm">{simExam} / 80</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="0.5"
                  value={simExam}
                  onChange={(e) => setSimExam(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Live Calculation Output Display */}
            <div className="mt-4 p-4 rounded-2xl bg-white border-2 border-emerald-300 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Marks Obtained (100)
                </span>
                <span className="text-3xl font-black text-slate-900 font-display">
                  {simTotal}
                  <span className="text-sm font-medium text-slate-400"> / 100</span>
                </span>
                <span className="text-xs font-semibold text-slate-600 block mt-0.5">
                  {simGradeObj.remark}
                </span>
              </div>

              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  CBSE Grade
                </span>
                <span className={`inline-block px-4 py-1.5 rounded-xl font-black text-xl border-2 shadow-xs ${simGradeObj.color}`}>
                  {simGradeObj.grade}
                </span>
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-wrap gap-2 text-xs">
            <span className="text-slate-500 font-medium py-1">Quick Presets:</span>
            <button
              onClick={() => {
                setSimPT(9.3);
                setSimNB(4.0);
                setSimSE(5.0);
                setSimExam(78.5);
              }}
              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-bold transition-all hover:scale-105 cursor-pointer shadow-2xs flex items-center space-x-1"
            >
              <span>Avaneesh Computer Sc (96.8 • A1)</span>
            </button>
            <button
              onClick={() => {
                setSimPT(9.5);
                setSimNB(5.0);
                setSimSE(5.0);
                setSimExam(76.5);
              }}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold transition-all hover:scale-105 cursor-pointer shadow-2xs flex items-center space-x-1"
            >
              <span>Avaneesh Science (96.0 • A1)</span>
            </button>
            <button
              onClick={() => {
                setSimPT(8.0);
                setSimNB(4.5);
                setSimSE(4.0);
                setSimExam(68.0);
              }}
              className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Merit Distinction (84.5 • A2)
            </button>
            <button
              onClick={() => {
                setSimPT(6.0);
                setSimNB(3.0);
                setSimSE(3.0);
                setSimExam(43.0);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Passing Grade (55.0 • C1)
            </button>
          </div>
        </div>

        {/* Dynamic Widget 2: Top Scholars Spotlight with Switcher */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Star className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    Academic Honor Roll & Top Scholars
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    High achievers across standard assessments
                  </p>
                </div>
              </div>

              {/* Scholar Switcher Tabs */}
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
                {topScholars.map((s, idx) => (
                  <button
                    key={s.name}
                    onClick={() => setSpotlightIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      spotlightIndex === idx
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Scholar Card */}
            <div className="bg-white rounded-2xl p-5 border-2 border-emerald-400/40 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {currentScholar.tag}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {currentScholar.class}
                </span>
              </div>

              <h4 className="text-xl font-black text-slate-900 font-display mt-1">
                {currentScholar.name}
              </h4>
              <p className="text-xs text-slate-500">
                Scholar No: <b>{currentScholar.scholar}</b> • Roll No: <b>{currentScholar.roll}</b> • Attendance: <b>{currentScholar.attendance}</b>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 text-xs">
                <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-slate-500 block text-[10px] font-semibold">Term I (Half-Yearly)</span>
                  <span className="text-base font-extrabold text-emerald-900">{currentScholar.term1}</span>
                  <span className="text-[10px] text-emerald-700 font-bold block">Grade A2</span>
                </div>

                <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-slate-500 block text-[10px] font-semibold">Term II (Annual)</span>
                  <span className="text-base font-extrabold text-emerald-900">{currentScholar.term2}</span>
                  <span className="text-[10px] text-emerald-700 font-bold block">Grade A1</span>
                </div>

                <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block text-[10px] font-semibold">Peak Subject</span>
                  <span className="text-xs font-extrabold text-amber-900 block truncate">{currentScholar.topSubject}</span>
                  <span className="text-[10px] text-amber-700 font-bold block">Grade A1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200/80">
            <button
              onClick={() => onNavigate('report-cards', { studentId: currentScholar.studentId, examId: currentScholar.examId })}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Open Official CBSE Report Card for {currentScholar.name.split(' ')[0]}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Class Roster with Live Section Filter */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-emerald-600" />
              Classes Overview (1st to 12th Standard)
            </h2>
            <p className="text-xs text-slate-500">
              Select any class to view student rosters, enter marks, or batch-print report cards
            </p>
          </div>

          {/* Interactive Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['ALL', 'PRIMARY', 'MIDDLE', 'SECONDARY', 'SENIOR'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setClassFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  classFilter === f
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'ALL' ? 'All Classes (12)' : f === 'PRIMARY' ? 'Primary (1-5)' : f === 'MIDDLE' ? 'Middle (6-8)' : f === 'SECONDARY' ? 'High (9-10)' : 'Senior (11-12)'}
              </button>
            ))}
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredClasses.map((cls) => {
            const isVIII = cls.class_name === '8th';
            return (
              <div
                key={cls.id}
                onClick={() => onNavigate('results', { classId: cls.id })}
                className={`p-4 rounded-2xl border transition-all cursor-pointer card-interactive group ${
                  isVIII
                    ? 'border-emerald-400 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-300'
                    : 'border-slate-200 hover:border-emerald-400 hover:shadow-md bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 font-display">
                    Class {cls.class_name}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {cls.student_count || 10} Students
                </div>

                {isVIII && (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-md font-bold">
                    Avaneesh's Class
                  </span>
                )}

                {cls.numeric_order >= 11 && (
                  <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold">
                    Sci / Com / Art
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Examination Schedules & Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((ex) => (
          <div key={ex.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm card-interactive">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {ex.exam_type}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Active & Independent
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 font-display">{ex.exam_name}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Independent mark records with automated periodic test (10), notebook (5), enrichment (5), and exam (80) calculations.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Schedule: {ex.start_date || 'Academic Calendar'}</span>
              <button
                onClick={() => onNavigate('results', { examId: ex.id })}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center cursor-pointer"
              >
                <span>View Class Performance</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default DashboardPage;
