import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { ClassEntity, Examination, Subject, MarkGrid, MarkRow } from '../types';
import {
  PenTool,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Search,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle,
} from 'lucide-react';

export const MarksEntryPage: React.FC = () => {
  const { activeSession, user, canAccessClass } = useAuth();
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedExamId, setSelectedExamId] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);

  const [gridData, setGridData] = useState<MarkGrid | null>(null);
  const [marksState, setMarksState] = useState<{ [studentId: number]: { marks: string; remarks: string } }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // 1. Fetch initial classes and examinations
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [clsRes, exRes] = await Promise.all([
          apiClient.get('/classes'),
          apiClient.get('/examinations'),
        ]);
        const isSuperAdmin = user?.roles.includes('SUPER_ADMIN');
        const isPrincipal = user?.roles.includes('PRINCIPAL') && !isSuperAdmin;
        const isClassTeacher = user?.roles.includes('CLASS_TEACHER') && !isSuperAdmin && !isPrincipal;

        const availableClasses = (isClassTeacher && user?.assigned_class_ids?.length)
          ? clsRes.data.filter((c: ClassEntity) => user.assigned_class_ids.includes(c.id))
          : clsRes.data;

        setClasses(availableClasses);
        setExams(exRes.data);
        if (availableClasses.length > 0) {
          if (user?.assigned_class_ids && user.assigned_class_ids.length > 0) {
            setSelectedClassId(user.assigned_class_ids[0]);
          } else {
            setSelectedClassId(availableClasses[0].id);
          }
        }
        if (exRes.data.length > 0) {
          setSelectedExamId(exRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial metadata:', err);
      }
    };
    fetchMetadata();
  }, [user]);

  // 2. Fetch subjects whenever selected class changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClassId || selectedClassId <= 0 || !activeSession) return;
      try {
        const res = await apiClient.get(`/subjects?class_id=${selectedClassId}&session_id=${activeSession.id}`);
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubjectId(res.data[0].id);
        } else {
          setSelectedSubjectId(0);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, [selectedClassId, activeSession]);

  // 3. Fetch grid marks whenever Class, Exam, Subject, or Session changes
  const fetchGrid = async () => {
    if (!activeSession || !selectedClassId || !selectedExamId || !selectedSubjectId || selectedClassId <= 0 || selectedExamId <= 0 || selectedSubjectId <= 0) return;
    setLoading(true);
    setErrorMessage(null);
    setSaveSuccess(null);
    try {
      const res = await apiClient.get('/marks/grid', {
        params: {
          session_id: activeSession.id,
          class_id: selectedClassId,
          exam_id: selectedExamId,
          subject_id: selectedSubjectId,
        },
      });
      setGridData(res.data);

      // Initialize local state
      const initialMap: { [studentId: number]: { marks: string; remarks: string } } = {};
      res.data.students.forEach((row: MarkRow) => {
        initialMap[row.student_id] = {
          marks: row.obtained_marks !== null && row.obtained_marks !== undefined ? String(row.obtained_marks) : '',
          remarks: row.remarks || '',
        };
      });
      setMarksState(initialMap);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setErrorMessage('Access Forbidden: You are only authorized to enter marks for your assigned class.');
      } else {
        setErrorMessage(err.response?.data?.detail || 'Failed to load marks grid');
      }
      setGridData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrid();
  }, [selectedClassId, selectedExamId, selectedSubjectId, activeSession]);

  // Handle Mark Change
  const handleMarkChange = (studentId: number, val: string) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: val,
      },
    }));
  };

  // Handle Remarks Change
  const handleRemarkChange = (studentId: number, val: string) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: val,
      },
    }));
  };

  // Keyboard navigation on Enter or Down Arrow to move to next student input
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  // Save Bulk Marks
  const handleSave = async (andNext: boolean = false) => {
    if (!gridData || !activeSession) return;
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);

    // Validate marks before submitting
    const marksPayload = [];
    const maxMarks = gridData.maximum_marks;

    for (const student of gridData.students) {
      const entry = marksState[student.student_id];
      if (entry && entry.marks.trim() !== '') {
        const num = parseFloat(entry.marks);
        if (isNaN(num)) {
          setErrorMessage(`Invalid mark entered for ${student.student_name}`);
          setSaving(false);
          return;
        }
        if (num < 0) {
          setErrorMessage(`Marks cannot be negative for ${student.student_name}`);
          setSaving(false);
          return;
        }
        if (num > maxMarks) {
          setErrorMessage(`Marks for ${student.student_name} (${num}) exceed Maximum Marks (${maxMarks})`);
          setSaving(false);
          return;
        }

        marksPayload.push({
          student_id: student.student_id,
          obtained_marks: num,
          remarks: entry.remarks.trim() || undefined,
        });
      }
    }

    if (marksPayload.length === 0) {
      setErrorMessage('Please enter marks for at least one student before saving.');
      setSaving(false);
      return;
    }

    try {
      const response = await apiClient.post('/marks/bulk', {
        academic_session_id: activeSession.id,
        class_id: selectedClassId,
        exam_id: selectedExamId,
        subject_id: selectedSubjectId,
        marks: marksPayload,
      });

      setSaveSuccess(response.data.message || 'Marks saved successfully!');

      if (andNext) {
        const currentSubIdx = subjects.findIndex((s) => s.id === selectedSubjectId);
        if (currentSubIdx !== -1 && currentSubIdx + 1 < subjects.length) {
          setSelectedSubjectId(subjects[currentSubIdx + 1].id);
        } else {
          setSaveSuccess('All subjects for this class completed!');
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setErrorMessage('Access Forbidden (403): You are only authorized to enter marks for your assigned class.');
      } else {
        setErrorMessage(err.response?.data?.detail || 'Failed to save marks.');
      }
    } finally {
      setSaving(false);
    }
  };

  const isWriteAllowed = canAccessClass(selectedClassId, true);

  // Dynamic metrics: completion and class average
  const totalStudentsCount = gridData?.students?.length || 0;
  const enteredCount = gridData?.students?.filter((s) => {
    const m = marksState[s.student_id]?.marks;
    return m !== undefined && m !== null && m.trim() !== '';
  }).length || 0;
  const completionPct = totalStudentsCount > 0 ? Math.round((enteredCount / totalStudentsCount) * 100) : 0;

  let marksSum = 0;
  let validMarksCount = 0;
  gridData?.students?.forEach((s) => {
    const m = marksState[s.student_id]?.marks;
    if (m !== undefined && m.trim() !== '') {
      const val = parseFloat(m);
      if (!isNaN(val)) {
        marksSum += val;
        validMarksCount++;
      }
    }
  });
  const classAvg = validMarksCount > 0 ? (marksSum / validMarksCount).toFixed(1) : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>MARKS EVALUATION CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center font-display tracking-tight">
            <PenTool className="w-7 h-7 mr-2 text-emerald-700" />
            Marks Entry Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Select Class, Examination, and Subject to enter and update student marks with instant CBSE grade calculations.
          </p>
        </div>

        {!isWriteAllowed && (
          <div className="inline-flex items-center px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 mr-1.5 text-amber-600" />
            Read-Only (You are not assigned as Class Teacher for this class)
          </div>
        )}
      </div>

      {/* Filter Selection Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.class_name} {c.student_count ? `(${c.student_count} students)` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.exam_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.subject_name} {sub.stream_name ? `(${sub.stream_name})` : ''} (Max: {sub.maximum_marks})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Alerts */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center shadow-xs">
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs sm:text-sm font-semibold flex items-center shadow-xs">
          <AlertCircle className="w-5 h-5 mr-2 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Marks Spreadsheet Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Loading student list & marks...</div>
      ) : gridData ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Live Progress & Context Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-amber-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <span className="font-extrabold text-slate-900 font-display">Class {gridData.class_name}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-emerald-800">{gridData.subject_name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">Maximum: <b className="text-slate-900">{gridData.maximum_marks}</b></span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">Pass: <b className="text-emerald-700">{gridData.passing_marks}</b></span>
            </div>

            {/* Dynamic Completion Meter */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Class Average</span>
                <span className="text-sm font-black text-slate-900">{classAvg} / {gridData.maximum_marks}</span>
              </div>
              <div className="w-32 bg-slate-200 rounded-full h-3 overflow-hidden p-0.5 border border-slate-300">
                <div
                  style={{ width: `${completionPct}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-300 shadow-xs"
                />
              </div>
              <span className="text-xs font-black text-emerald-700">{enteredCount}/{totalStudentsCount}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-16 text-center">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 w-28">Scholar No.</th>
                  <th className="py-3 px-4 w-24 text-center">Max Marks</th>
                  <th className="py-3 px-4 w-56">Obtained & CBSE Grade</th>
                  <th className="py-3 px-4">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gridData.students.map((row, idx) => {
                  const state = marksState[row.student_id] || { marks: '', remarks: '' };
                  const numVal = parseFloat(state.marks);
                  const isInvalid = !isNaN(numVal) && (numVal < 0 || numVal > gridData.maximum_marks);

                  // Calculate reactive grade badge
                  const pct = !isNaN(numVal) && gridData.maximum_marks > 0
                    ? Math.round((numVal / gridData.maximum_marks) * 100)
                    : null;
                  
                  let gradeBadge = null;
                  if (pct !== null) {
                    if (pct >= 91) gradeBadge = { text: 'A1', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                    else if (pct >= 81) gradeBadge = { text: 'A2', color: 'bg-teal-100 text-teal-800 border-teal-300' };
                    else if (pct >= 71) gradeBadge = { text: 'B1', color: 'bg-blue-100 text-blue-800 border-blue-300' };
                    else if (pct >= 61) gradeBadge = { text: 'B2', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
                    else if (pct >= 51) gradeBadge = { text: 'C1', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
                    else if (pct >= 41) gradeBadge = { text: 'C2', color: 'bg-amber-100 text-amber-800 border-amber-300' };
                    else if (pct >= 33) gradeBadge = { text: 'D', color: 'bg-orange-100 text-orange-800 border-orange-300' };
                    else gradeBadge = { text: 'E', color: 'bg-red-100 text-red-800 border-red-300' };
                  }

                  return (
                    <tr key={row.student_id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{row.roll_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {row.student_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{row.scholar_number}</td>
                      <td className="py-3 px-4 text-center text-slate-500 font-semibold">{gridData.maximum_marks}</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center space-x-2">
                          <input
                            ref={(el) => { inputRefs.current[idx] = el; }}
                            type="number"
                            step="0.5"
                            min="0"
                            max={gridData.maximum_marks}
                            disabled={!isWriteAllowed || saving}
                            value={state.marks}
                            onChange={(e) => handleMarkChange(row.student_id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            placeholder="0 - 100"
                            className={`w-24 px-3 py-1.5 border rounded-xl font-bold text-sm focus:outline-none focus:ring-2 ${
                              isInvalid
                                ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-400'
                                : 'border-slate-300 bg-white text-slate-900 focus:ring-emerald-600 shadow-2xs'
                            }`}
                          />
                          {gradeBadge && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black border ${gradeBadge.color}`}>
                              {gradeBadge.text} ({pct}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          disabled={!isWriteAllowed || saving}
                          value={state.remarks}
                          onChange={(e) => handleRemarkChange(row.student_id, e.target.value)}
                          placeholder="Optional remarks"
                          className="w-full max-w-xs px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => fetchGrid()}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset Changes
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSave(false)}
                disabled={!isWriteAllowed || saving}
                className="inline-flex items-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Marks'}
              </button>

              <button
                onClick={() => handleSave(true)}
                disabled={!isWriteAllowed || saving}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <span>Save & Next Subject</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MarksEntryPage;
