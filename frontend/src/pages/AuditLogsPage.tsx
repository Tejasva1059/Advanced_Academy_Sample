import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { AuditLog } from '../types';
import { Clock, ShieldCheck, User } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/audit-logs?limit=100').then((res) => {
      setLogs(res.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-blue-900" />
          Audit & Security Activity Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Tracks marks entry, updates, student modifications, teacher assignments, and administrative setting adjustments.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-40">Timestamp</th>
                <th className="py-3 px-4 w-32">User</th>
                <th className="py-3 px-4 w-40">Action</th>
                <th className="py-3 px-4 w-32">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">
                    {log.username || 'system'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-blue-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans">{log.entity}</td>
                  <td className="py-2.5 px-4 text-slate-700 font-sans truncate max-w-md">
                    {log.new_value || log.old_value || '-'}
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

export default AuditLogsPage;
