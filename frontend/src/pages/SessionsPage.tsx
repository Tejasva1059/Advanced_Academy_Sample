import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { AcademicSession } from '../types';
import { Clock, Plus, CheckCircle2 } from 'lucide-react';

export const SessionsPage: React.FC = () => {
  const { sessions, refreshSessions, hasRole } = useAuth();
  const [newSessionName, setNewSessionName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleActivate = async (id: number) => {
    try {
      await apiClient.put(`/sessions/${id}/activate`);
      await refreshSessions();
      alert('Academic session activated!');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to activate session');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName) return;
    setCreating(true);
    try {
      await apiClient.post('/sessions', {
        session_name: newSessionName,
        is_active: false,
      });
      setNewSessionName('');
      await refreshSessions();
      alert('Session created successfully!');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-blue-900" />
          Academic Session Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Support multiple academic sessions (e.g. 2025-26, 2026-27, 2027-28) with active session selection.
        </p>
      </div>

      {hasRole('SUPER_ADMIN') && (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <input
            type="text"
            required
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="e.g. 2027-28"
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-xs font-semibold"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer"
          >
            Create New Session
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
              s.is_active ? 'bg-blue-50/50 border-blue-400' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-slate-900">{s.session_name}</span>
                {s.is_active ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                  </span>
                ) : s.is_archived ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    Archived
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                All classes, students, subjects, exams and marks link to their designated session.
              </p>
            </div>

            {!s.is_active && hasRole('SUPER_ADMIN') && (
              <div className="pt-4 mt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleActivate(s.id)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  Set as Active Session
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionsPage;
