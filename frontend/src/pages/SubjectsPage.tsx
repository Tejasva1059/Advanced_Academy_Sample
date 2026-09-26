import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Subject, ClassEntity } from '../types';
import { BookOpen, Plus, Filter, CheckCircle2 } from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/classes').then((res) => setClasses(res.data)).catch(console.error);
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const url = selectedClassId ? `/subjects?class_id=${selectedClassId}` : '/subjects';
      const res = await apiClient.get(url);
      setSubjects(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [selectedClassId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-blue-900" />
            Class-Wise Subjects ({subjects.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Subjects are database-driven and class-specific (5 for Classes 1-2, 6 for 3-5, 7 for 6-10, stream-specific for 11-12).
          </p>
        </div>

        <div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.class_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-20">Class</th>
                <th className="py-3 px-4 w-28">Subject Code</th>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Stream</th>
                <th className="py-3 px-4 text-center w-24">Max Marks</th>
                <th className="py-3 px-4 text-center w-24">Pass Marks</th>
                <th className="py-3 px-4 text-center w-24">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-blue-900">{s.class_name}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">{s.subject_code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.subject_name}</td>
                  <td className="py-3 px-4">
                    {s.stream_name ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold text-[10px]">
                        {s.stream_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">General / Core</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">{s.maximum_marks}</td>
                  <td className="py-3 px-4 text-center text-slate-600">{s.passing_marks}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                      {s.subject_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;
