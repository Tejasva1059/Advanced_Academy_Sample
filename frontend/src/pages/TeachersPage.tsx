import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Teacher, TeacherAssignment, ClassEntity } from '../types';
import { UserCheck, Plus, Trash2, CheckCircle2, Shield } from 'lucide-react';

export const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [newAssign, setNewAssign] = useState({
    teacher_id: 1,
    class_id: 1,
    assignment_type: 'CLASS_TEACHER',
  });

  const fetchData = async () => {
    try {
      const [tRes, aRes, cRes] = await Promise.all([
        apiClient.get('/teachers'),
        apiClient.get('/teacher-assignments'),
        apiClient.get('/classes'),
      ]);
      setTeachers(tRes.data);
      setAssignments(aRes.data);
      setClasses(cRes.data);
      if (tRes.data.length > 0) setNewAssign((prev) => ({ ...prev, teacher_id: tRes.data[0].id }));
      if (cRes.data.length > 0) setNewAssign((prev) => ({ ...prev, class_id: cRes.data[0].id }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/teacher-assignments', {
        ...newAssign,
        academic_session_id: 1,
      });
      setAssignModalOpen(false);
      fetchData();
      alert('Teacher assignment added successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign teacher');
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!window.confirm('Remove this teacher assignment?')) return;
    try {
      await apiClient.delete(`/teacher-assignments/${id}`);
      fetchData();
    } catch (err: any) {
      alert('Failed to delete assignment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <UserCheck className="w-6 h-6 mr-2 text-blue-900" />
            Teachers & Class Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dynamic teacher profiles and class allocations (enforces backend marks modification restrictions).
          </p>
        </div>

        <button
          onClick={() => setAssignModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Assign Teacher to Class
        </button>
      </div>

      {/* Teachers Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Faculty Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachers.map((t) => (
            <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {t.full_name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{t.full_name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                    {t.employee_code}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{t.designation} • {t.qualification}</p>
                <div className="mt-2 text-xs text-slate-600 flex items-center space-x-2">
                  <span>Assigned:</span>
                  {t.assigned_classes.length > 0 ? (
                    t.assigned_classes.map((cls) => (
                      <span key={cls} className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                        Class {cls}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No class assigned yet</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Assignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800">
          Active Class & Subject Assignments
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Teacher Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Assignment Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900">{a.teacher_name}</td>
                  <td className="py-3 px-4 font-bold text-blue-900">Class {a.class_name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">
                      {a.assignment_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Assign Teacher to Class</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Teacher</label>
                <select
                  value={newAssign.teacher_id}
                  onChange={(e) => setNewAssign({ ...newAssign, teacher_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Class</label>
                <select
                  value={newAssign.class_id}
                  onChange={(e) => setNewAssign({ ...newAssign, class_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Class {c.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assignment Type</label>
                <select
                  value={newAssign.assignment_type}
                  onChange={(e) => setNewAssign({ ...newAssign, assignment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="CLASS_TEACHER">Class Teacher (Full Class Marks Entry)</option>
                  <option value="SUBJECT_TEACHER">Subject Teacher</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;
