import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import ClassesPage from './pages/ClassesPage';
import SubjectsPage from './pages/SubjectsPage';
import TeachersPage from './pages/TeachersPage';
import ExaminationsPage from './pages/ExaminationsPage';
import MarksEntryPage from './pages/MarksEntryPage';
import ClassResultsPage from './pages/ClassResultsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import ReportCardPage from './pages/ReportCardPage';
import SettingsPage from './pages/SettingsPage';
import SessionsPage from './pages/SessionsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-medium">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Initializing School Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigate = (view: string, extraData?: any) => {
    if (extraData?.studentId) setSelectedStudentId(extraData.studentId);
    if (extraData?.examId) setSelectedExamId(extraData.examId);
    if (extraData?.classId) setSelectedClassId(extraData.classId);
    setCurrentView(view);
  };

  const openReportCard = (studentId: number, examId: number) => {
    setSelectedStudentId(studentId);
    setSelectedExamId(examId);
    setCurrentView('report-cards');
  };

  const openStudentProfile = (studentId: number) => {
    setSelectedStudentId(studentId);
    setCurrentView('student-profile');
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {currentView === 'students' && (
        <StudentsPage onOpenStudentProfile={openStudentProfile} />
      )}
      {currentView === 'student-profile' && selectedStudentId && (
        <StudentProfilePage
          studentId={selectedStudentId}
          onBack={() => setCurrentView('students')}
          onOpenReportCard={openReportCard}
        />
      )}
      {currentView === 'classes' && (
        <ClassesPage
          onNavigateToResults={(cId) => {
            setSelectedClassId(cId);
            setCurrentView('results');
          }}
        />
      )}
      {currentView === 'subjects' && <SubjectsPage />}
      {currentView === 'teachers' && <TeachersPage />}
      {currentView === 'examinations' && (
        <ExaminationsPage
          onNavigateToMarks={(exId) => {
            setSelectedExamId(exId);
            setCurrentView('marks-entry');
          }}
        />
      )}
      {currentView === 'marks-entry' && <MarksEntryPage />}
      {currentView === 'results' && (
        <ClassResultsPage
          initialClassId={selectedClassId || 1}
          initialExamId={selectedExamId || 1}
          onOpenReportCard={openReportCard}
          onOpenStudentProfile={openStudentProfile}
        />
      )}
      {currentView === 'report-cards' && (
        <ReportCardPage
          initialStudentId={selectedStudentId || undefined}
          initialExamId={selectedExamId || undefined}
          onBack={() => setCurrentView('results')}
        />
      )}
      {currentView === 'settings' && <SettingsPage />}
      {currentView === 'sessions' && <SessionsPage />}
      {currentView === 'users' && <UsersPage />}
      {currentView === 'audit-logs' && <AuditLogsPage />}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
