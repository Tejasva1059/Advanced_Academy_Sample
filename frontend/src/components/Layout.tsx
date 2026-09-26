import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  Calendar,
  PenTool,
  Award,
  FileText,
  Clock,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import schoolLogo from '../assets/advanced_academy_logo.png';
import cbseLogo from '../assets/cbse_logo.png';

interface LayoutProps {
  currentView: string;
  onNavigate: (view: string, extraData?: any) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const { user, logout, schoolInfo, activeSession, sessions, setActiveSession } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Dynamic features
  const [tickerVisible, setTickerVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isSuperAdmin = user?.roles.includes('SUPER_ADMIN');
  const isPrincipal = user?.roles.includes('PRINCIPAL') && !isSuperAdmin;
  const isClassTeacher =
    user?.roles.includes('CLASS_TEACHER') &&
    !isSuperAdmin &&
    !isPrincipal;

  // 1. Teacher Navigation: Strictly 5 classroom essentials
  const teacherNav = [
    { id: 'dashboard', label: 'Classroom Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'My Class Students', icon: Users },
    { id: 'marks-entry', label: 'Marks Entry', icon: PenTool },
    { id: 'results', label: 'Class Results', icon: Award },
    { id: 'report-cards', label: 'CBSE Report Cards', icon: FileText, highlight: true },
  ];

  // 2. Principal Navigation: Academic Leadership (No admin/settings/users/audit)
  const principalMainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students Directory', icon: Users },
    { id: 'classes', label: 'Classes (1st-12th)', icon: GraduationCap },
    { id: 'subjects', label: 'Subject Allocations', icon: BookOpen },
  ];
  const principalAcademicNav = [
    { id: 'examinations', label: 'Examinations', icon: Calendar },
    { id: 'marks-entry', label: 'Marks Entry', icon: PenTool },
    { id: 'results', label: 'Class Results', icon: Award },
    { id: 'report-cards', label: 'CBSE Report Cards', icon: FileText, highlight: true },
    { id: 'teachers', label: 'Faculty & Allocations', icon: UserCheck },
    { id: 'sessions', label: 'Academic Sessions', icon: Clock },
  ];

  // 3. Super Admin Navigation: All 13 items across 3 sections
  const adminMainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students Roster', icon: Users },
    { id: 'classes', label: 'Classes (1st-12th)', icon: GraduationCap },
    { id: 'subjects', label: 'Subject Allocations', icon: BookOpen },
  ];
  const adminAcademicNav = [
    { id: 'examinations', label: 'Examinations', icon: Calendar },
    { id: 'marks-entry', label: 'Marks Entry', icon: PenTool },
    { id: 'results', label: 'Class Results', icon: Award },
    { id: 'report-cards', label: 'CBSE Report Cards', icon: FileText, highlight: true },
  ];
  const adminSystemNav = [
    { id: 'teachers', label: 'Faculty & RBAC', icon: UserCheck },
    { id: 'sessions', label: 'Academic Sessions', icon: Clock },
    { id: 'settings', label: 'School Settings', icon: Settings },
    { id: 'users', label: 'Users & Roles', icon: ShieldAlert },
    { id: 'audit-logs', label: 'Audit Trail', icon: Clock },
  ];

  // Active navigation items for mobile drawer
  const mobileNavItems = isClassTeacher
    ? teacherNav
    : isPrincipal
    ? [...principalMainNav, ...principalAcademicNav]
    : [...adminMainNav, ...adminAcademicNav, ...adminSystemNav];

  // Global search keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get('/students', {
          params: { search: searchQuery, limit: 8 },
        });
        setSearchResults(res.data.students || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const schoolName = schoolInfo?.school_name || 'ADVANCED ACADEMY';
  const affiliationNo = schoolInfo?.affiliation_no || '1030183';
  const schoolCode = schoolInfo?.school_code || '50161';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80 font-sans">
      
      {/* Dynamic Live Announcement / CBSE Bulletin Marquee */}
      {tickerVisible && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white text-xs border-b border-emerald-500/20 py-1.5 px-4 flex items-center justify-between overflow-hidden relative no-print select-none shadow-inner">
          <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-4">
            <div className="flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>CBSE LIVE</span>
            </div>
            <div className="overflow-hidden whitespace-nowrap text-[11px] text-slate-200">
              <span className="inline-block animate-marquee font-medium">
                🎓 <b className="text-white">ADVANCED ACADEMY (Indore)</b> • CBSE Affiliation No. 1030183 • School Code: 50161 &nbsp;&nbsp;&nbsp;&nbsp;
                ⭐ <b className="text-amber-300">Avaneesh Mahawar</b> (Class VIII E, Scholar #5693) scored 91.0% (A1 Grade) &nbsp;&nbsp;&nbsp;&nbsp;
                📊 <b className="text-emerald-300">120 Students Enrolled</b> across 12 Classes (1st to 12th) &nbsp;&nbsp;&nbsp;&nbsp;
                🏆 <b className="text-white">Annual Examination 2023-24</b> Two-Term Assessment Moderation Active &nbsp;&nbsp;&nbsp;&nbsp;
                ⚡ <b className="text-amber-200">Scholastic (PT+NB+SE+Exam)</b> and Co-Scholastic Integrated
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 text-[10px]">
            <span className="hidden sm:inline text-emerald-400 font-mono font-bold bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">
              {currentTime} IST
            </span>
            <button
              onClick={() => setTickerVisible(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10"
              title="Hide Bulletin"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 no-print shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          
          {/* Left Brand Area */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => onNavigate('dashboard')}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md border-2 border-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <img src={schoolLogo} alt="School Crest" className="w-full h-full object-contain" />
                </div>
                <div className="w-4 h-4 rounded-full bg-white p-0.5 shadow-xs border border-slate-200 absolute -bottom-1 -right-1 flex items-center justify-center">
                  <img src={cbseLogo} alt="CBSE" className="w-full h-full object-contain" />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight font-display tracking-tight group-hover:text-emerald-800 transition-colors">
                    {schoolName}
                  </span>
                  <span className="hidden md:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    CBSE
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Affiliation No: {affiliationNo} • Code: {schoolCode} • Indore
                </span>
              </div>
            </div>
          </div>

          {/* Center / Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Global Search Trigger Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-100/90 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200/80 rounded-xl text-xs text-slate-600 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>Search student, roll...</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-500 shadow-2xs">
                Ctrl K
              </kbd>
            </button>

            {/* Session Selector with pulsing indicator */}
            <div className="flex items-center space-x-1.5 bg-emerald-50/70 border border-emerald-200/90 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-900 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-800/80 text-[11px] hidden md:inline">Session:</span>
              <select
                value={activeSession?.id || ''}
                onChange={(e) => {
                  const s = sessions.find((item) => item.id === Number(e.target.value));
                  if (s) setActiveSession(s);
                }}
                className="bg-transparent font-bold text-emerald-950 focus:outline-none cursor-pointer"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.session_name} {s.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors relative cursor-pointer"
                title="Academic Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 absolute top-1.5 right-1.5 ring-2 ring-white" />
              </button>

              {/* Notification Drawer Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                      Academic Notifications
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                      Live
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    <div
                      className="p-3 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setNotificationsOpen(false);
                        onNavigate('report-cards');
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-emerald-900">
                          Annual Report Card Generated
                        </span>
                        <span className="text-[10px] text-slate-400">Just now</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Class VIII E • <b>Avaneesh Mahawar</b> Term I (88.3%) & Term II (91.8%) ready for print.
                      </p>
                    </div>

                    <div className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          CBSE Two-Term Framework Active
                        </span>
                        <span className="text-[10px] text-slate-400">Today</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        10 PT + 5 NB + 5 SE + 80 Exam marks breakdown configured across all subjects.
                      </p>
                    </div>

                    <div className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-slate-800">
                          120 Student Records Verified
                        </span>
                        <span className="text-[10px] text-slate-400">Synced</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Classes 1st to 12th seeded with unique scholar and admission numbers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  {user?.full_name}
                </span>
                <span className="inline-block text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {user?.roles[0]?.replace('_', ' ') || 'Staff'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              title="Sign Out of Portal"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Vibrant Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-slate-300 flex-shrink-0 no-print border-r border-slate-800 shadow-xl justify-between">
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* 1. Class Teacher View: Strictly 5 classroom essentials */}
            {isClassTeacher ? (
              <div>
                <div className="px-3 pb-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                  <span>My Classroom</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    Class Teacher
                  </span>
                </div>
                <div className="space-y-1">
                  {teacherNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                          {item.label}
                        </div>
                        {item.highlight && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                            CBSE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : isPrincipal ? (
              /* 2. Principal View: Academic Leadership & Oversight (No Admin Settings/Users/Audit) */
              <>
                <div>
                  <div className="px-3 pb-2 text-[10px] font-bold text-emerald-400/90 uppercase tracking-widest">
                    Main Portal
                  </div>
                  <div className="space-y-1">
                    {principalMainNav.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onNavigate(item.id)}
                          className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="px-3 pb-2 text-[10px] font-bold text-amber-400/90 uppercase tracking-widest">
                    Academics & Oversight
                  </div>
                  <div className="space-y-1">
                    {principalAcademicNav.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onNavigate(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-amber-400'}`} />
                            {item.label}
                          </div>
                          {item.highlight && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                              CBSE
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* 3. Super Admin View: Full System Authority (All 13 items) */
              <>
                <div>
                  <div className="px-3 pb-2 text-[10px] font-bold text-emerald-400/90 uppercase tracking-widest">
                    Main Portal
                  </div>
                  <div className="space-y-1">
                    {adminMainNav.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onNavigate(item.id)}
                          className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="px-3 pb-2 text-[10px] font-bold text-amber-400/90 uppercase tracking-widest">
                    Academics & Results
                  </div>
                  <div className="space-y-1">
                    {adminAcademicNav.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onNavigate(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-amber-400'}`} />
                            {item.label}
                          </div>
                          {item.highlight && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                              CBSE
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Administration
                  </div>
                  <div className="space-y-1">
                    {adminSystemNav.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onNavigate(item.id)}
                          className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Context Card: Role-Aware */}
          <div className="p-4 border-t border-slate-800/80 bg-black/20">
            {isClassTeacher ? (
              <div className="bg-gradient-to-br from-emerald-900/60 to-emerald-950/80 rounded-2xl p-3 border border-emerald-500/30 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-3 h-3 mr-1 text-emerald-400" />
                    My Classroom
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                    Class {user?.assigned_class_ids?.[0] || 'Teacher'}
                  </span>
                </div>
                <div className="font-extrabold text-white text-sm">Classroom Records</div>
                <div className="text-[11px] text-slate-300">Enter marks & print report cards</div>
                <button
                  onClick={() => onNavigate('marks-entry')}
                  className="mt-2.5 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                >
                  <span>Quick Marks Entry</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-900/60 to-emerald-950/80 rounded-2xl p-3 border border-emerald-500/30 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                    Featured Sample
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                    Class VIII
                  </span>
                </div>
                <div className="font-extrabold text-white text-sm">Avaneesh Mahawar</div>
                <div className="text-[11px] text-slate-300">Scholar No: 5693 • Roll: 8508</div>
                <button
                  onClick={() => onNavigate('report-cards', { studentId: 71, examId: 3 })}
                  className="mt-2.5 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                >
                  <span>Open CBSE Card</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex no-print">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-gradient-to-b from-slate-950 to-emerald-950 text-slate-300 p-4 space-y-4 z-50 flex flex-col h-full shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <img src={schoolLogo} alt="Logo" className="w-7 h-7 object-contain" />
                  <span className="font-bold text-white text-sm font-display">{schoolName}</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-4">
                <div className="px-2 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  {isClassTeacher ? 'My Classroom' : isPrincipal ? 'Principal Oversight' : 'System Administration'}
                </div>
                {mobileNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Global Search Dialog Modal (Ctrl+K) */}
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm no-print">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50/70">
                <Search className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type student name (e.g. Avaneesh), scholar no (5693), or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none placeholder-slate-400"
                />
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-500 font-bold">
                    ESC
                  </kbd>
                </button>
              </div>

              {/* Live Search Results */}
              <div className="max-h-80 overflow-y-auto p-2">
                {searching ? (
                  <div className="py-8 text-center text-xs text-slate-400">Searching records...</div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((stu) => (
                      <div
                        key={stu.id}
                        className="p-3 hover:bg-emerald-50/70 rounded-2xl flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{stu.student_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                              Roll #{stu.roll_number}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Scholar No: <b className="text-slate-700">{stu.scholar_number}</b> • Class: {stu.class_name || 'Standard'}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSearchModalOpen(false);
                              onNavigate('report-cards', { studentId: stu.id });
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center"
                          >
                            <span>Report Card</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No students found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Suggested Quick Searches
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => setSearchQuery('Avaneesh')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      >
                        ⚡ Avaneesh Mahawar (Class VIII)
                      </button>
                      <button
                        onClick={() => setSearchQuery('5693')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      >
                        Scholar: 5693
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-vibrant-mesh relative">
          {/* Subtle floating ambient glow orbs for luxury depth */}
          <div className="absolute top-8 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none animate-float" />
          <div className="absolute bottom-16 right-1/4 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
