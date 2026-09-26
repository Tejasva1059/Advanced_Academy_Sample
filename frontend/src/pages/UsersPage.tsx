import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { User } from '../types';
import { ShieldCheck, User as UserIcon, CheckCircle2 } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/users').then((res) => {
      setUsers(res.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <ShieldCheck className="w-6 h-6 mr-2 text-blue-900" />
          Users & Role-Based Access Control
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enforces role-based permissions: Super Admin (all), Principal (all academic view/edit), and Class Teachers (restricted to assigned classes).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-base flex-shrink-0">
              {u.full_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">{u.full_name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  {u.roles[0]?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{u.email} • @{u.username}</p>

              <div className="mt-3 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-semibold block mb-1">Permissions:</span>
                <div className="flex flex-wrap gap-1">
                  {u.permissions.length > 0 ? (
                    u.permissions.map((p) => (
                      <span key={p} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Default Class Teacher Role</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;
