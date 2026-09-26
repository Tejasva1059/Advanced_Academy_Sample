import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Examination } from '../types';
import { Calendar, Plus, CheckCircle2, ArrowRight } from 'lucide-react';

interface ExaminationsPageProps {
  onNavigateToMarks: (examId: number) => void;
}

export const ExaminationsPage: React.FC<ExaminationsPageProps> = ({ onNavigateToMarks }) => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/examinations').then((res) => {
      setExams(res.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-blue-900" />
          Examinations Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Independent examinations: Half-Yearly and Annual marks are stored separately and not averaged.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {exams.map((ex) => (
          <div key={ex.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                  {ex.exam_type}
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Independent Record
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900">{ex.exam_name}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Marks for this exam are preserved independently from other exam terms without automatic overwrite.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div>Start Date: <b>{ex.start_date || 'N/A'}</b></div>
                <div>End Date: <b>{ex.end_date || 'N/A'}</b></div>
                <div>Session: <b>{ex.session_name || '2026-27'}</b></div>
              </div>
            </div>

            <div className="pt-5 flex items-center justify-end">
              <button
                onClick={() => onNavigateToMarks(ex.id)}
                className="inline-flex items-center px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Enter Exam Marks
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExaminationsPage;
