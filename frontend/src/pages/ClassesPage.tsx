import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { ClassEntity, Subject } from '../types';
import { GraduationCap, BookOpen, Users, ArrowUpRight } from 'lucide-react';

interface ClassesPageProps {
  onNavigateToResults: (classId: number) => void;
}

export const ClassesPage: React.FC<ClassesPageProps> = ({ onNavigateToResults }) => {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/classes').then((res) => {
      setClasses(res.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <GraduationCap className="w-6 h-6 mr-2 text-blue-900" />
          Academic Classes (1st to 12th)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Database-driven class configuration with independent subject mappings and stream specialization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 font-extrabold flex items-center justify-center text-base border border-blue-200">
                  {cls.numeric_order}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                  Standard {cls.class_name}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">Class {cls.class_name}</h3>
              <p className="text-xs text-slate-500 mt-1">{cls.description}</p>

              <div className="flex items-center space-x-4 mt-4 py-3 border-y border-slate-100 text-xs">
                <div className="flex items-center text-slate-700 font-semibold">
                  <Users className="w-4 h-4 mr-1 text-slate-400" />
                  {cls.student_count || 10} Students
                </div>
                {cls.numeric_order >= 11 && (
                  <div className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    Science / Commerce / Arts
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                onClick={() => onNavigateToResults(cls.id)}
                className="inline-flex items-center text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                View Class Results
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassesPage;
