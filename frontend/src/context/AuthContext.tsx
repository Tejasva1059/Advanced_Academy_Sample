import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import { User, SchoolSetting, AcademicSession } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  schoolInfo: SchoolSetting | null;
  activeSession: AcademicSession | null;
  sessions: AcademicSession[];
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessClass: (classId: number, isWrite: boolean) => boolean;
  setActiveSession: (session: AcademicSession) => void;
  refreshSchoolInfo: () => Promise<void>;
  refreshSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('school_token'));
  const [schoolInfo, setSchoolInfo] = useState<SchoolSetting | null>(null);
  const [activeSession, setActiveSessionState] = useState<AcademicSession | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInitialData = async () => {
    try {
      if (token) {
        const meRes = await apiClient.get('/auth/me');
        setUser(meRes.data);
      }
      const [settingsRes, sessionsRes] = await Promise.all([
        apiClient.get('/settings').catch(() => null),
        apiClient.get('/sessions').catch(() => null),
      ]);

      if (settingsRes?.data) {
        setSchoolInfo(settingsRes.data);
      }
      if (sessionsRes?.data) {
        setSessions(sessionsRes.data);
        const active = sessionsRes.data.find((s: AcademicSession) => s.is_active);
        if (active) {
          setActiveSessionState(active);
        } else if (sessionsRes.data.length > 0) {
          setActiveSessionState(sessionsRes.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load initial context data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('school_token', newToken);
    localStorage.setItem('school_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('school_token');
    localStorage.removeItem('school_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.roles.includes(role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.permissions.includes(permission);
  };

  const canAccessClass = (classId: number, isWrite: boolean): boolean => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('PRINCIPAL')) return true;
    if (isWrite) {
      return user.assigned_class_ids.includes(classId);
    } else {
      if (hasPermission('VIEW_ALL_RESULTS')) return true;
      return user.assigned_class_ids.includes(classId);
    }
  };

  const setActiveSession = (session: AcademicSession) => {
    setActiveSessionState(session);
  };

  const refreshSchoolInfo = async () => {
    try {
      const res = await apiClient.get('/settings');
      setSchoolInfo(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshSessions = async () => {
    try {
      const res = await apiClient.get('/sessions');
      setSessions(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        schoolInfo,
        activeSession,
        sessions,
        loading,
        login,
        logout,
        hasRole,
        hasPermission,
        canAccessClass,
        setActiveSession,
        refreshSchoolInfo,
        refreshSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
