import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Student, ClassEntity, StreamEntity } from '../types';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  Trash2,
  Edit2,
  FileText,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface StudentsPageProps {
  onOpenStudentProfile: (studentId: number) => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({ onOpenStudentProfile }) => {
  const { activeSession, hasRole, user } = useAuth();
  const isSuperAdmin = user?.roles.includes('SUPER_ADMIN');
  const isPrincipal = user?.roles.includes('PRINCIPAL') && !isSuperAdmin;
  const isClassTeacher = user?.roles.includes('CLASS_TEACHER') && !isSuperAdmin && !isPrincipal;

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [streams, setStreams] = useState<StreamEntity[]>([]);

  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    isClassTeacher && user?.assigned_class_ids?.[0] ? String(user.assigned_class_ids[0]) : ''
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // New Student modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_name: '',
    admission_number: '',
    scholar_number: '',
    roll_number: 1,
    father_name: '',
    mother_name: '',
    date_of_birth: '2015-05-10',
    gender: 'MALE',
    contact_number: '+91 98000 00000',
    address: 'Indore, MP',
    class_id: 1,
    stream_id: null,
  });

  const fetchClassesAndStreams = async () => {
    try {
      const clsRes = await apiClient.get('/classes');
      if (isClassTeacher && user?.assigned_class_ids?.length) {
        const myCls = clsRes.data.filter((c: ClassEntity) => user.assigned_class_ids.includes(c.id));
        setClasses(myCls);
        if (myCls.length > 0) {
          setSelectedClassId(String(myCls[0].id));
        }
      } else {
        setClasses(clsRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: 200,
      };
      if (search) params.search = search;
      if (isClassTeacher && user?.assigned_class_ids?.length) {
        params.class_id = user.assigned_class_ids[0];
      } else if (selectedClassId) {
        params.class_id = Number(selectedClassId);
      }
      if (selectedStatus) params.status = selectedStatus;
      if (activeSession) params.session_id = activeSession.id;

      const res = await apiClient.get('/students', { params });
      setStudents(res.data.students);
      setTotalCount(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndStreams();
  }, [user]);

  useEffect(() => {
    fetchStudents();
  }, [search, selectedClassId, selectedStatus, activeSession, user]);

  // Handle CSV Preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);
      setImportSuccess(null);

      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await apiClient.post('/import/preview', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPreviewData(res.data);
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to parse CSV file');
      }
    }
  };

  // Commit CSV Import
  const handleCommitImport = async () => {
    if (!previewData || !previewData.valid_records.length) return;
    setImporting(true);
    try {
      const res = await apiClient.post('/import/commit', previewData.valid_records);
      setImportSuccess(res.data.message);
      setPreviewData(null);
      setImportFile(null);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to import students');
    } finally {
      setImporting(false);
    }
  };

  // Download Template
  const handleDownloadTemplate = () => {
    window.open(`${apiClient.defaults.baseURL}/import/template`, '_blank');
  };

  // Clear Dummy Data (Super Admin)
  const handleClearDummyData = async () => {
    if (!window.confirm('WARNING: This will permanently remove dummy student and mark records to prepare for real school data. Proceed?')) {
      return;
    }
    try {
      const res = await apiClient.post('/import/clear-dummy-students');
      alert(res.data.message);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Action failed');
    }
  };

  // Create Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    try {
      await apiClient.post('/students', {
        ...newStudent,
        academic_session_id: activeSession.id,
        student_status: 'ACTIVE',
      });
      setAddModalOpen(false);
      fetchStudents();
      alert('Student created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display flex items-center">
            <Users className="w-6 h-6 mr-2 text-emerald-700" />
            {isClassTeacher
              ? `My Class Students (${totalCount} Enrolled)`
              : `Student Directory (${totalCount} Enrolled)`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {isClassTeacher
              ? `Student roster for your assigned classroom. View individual profiles and generate CBSE report cards.`
              : `Manage student records, demographics, roll numbers, and batch import real school data.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasRole('SUPER_ADMIN') && (
            <button
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              Import Real Data (CSV)
            </button>
          )}

          {!isClassTeacher && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Student
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Scholar No, Admission No, Father's Name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.class_name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="PASSED">Passed</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Loading student roster...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-16">Class</th>
                  <th className="py-3 px-4 w-14 text-center">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Scholar No.</th>
                  <th className="py-3 px-4">Admission No.</th>
                  <th className="py-3 px-4">Father's Name</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  // Generate vibrant gradient avatar
                  const gradients = [
                    'from-emerald-500 to-teal-700',
                    'from-blue-500 to-indigo-700',
                    'from-purple-500 to-pink-700',
                    'from-amber-500 to-orange-700',
                    'from-rose-500 to-red-700',
                    'from-cyan-500 to-blue-700',
                  ];
                  let hash = 0;
                  for (let i = 0; i < st.student_name.length; i++) hash += st.student_name.charCodeAt(i);
                  const gradient = gradients[hash % gradients.length];
                  const initials = st.student_name.split(' ').map((n) => n[0]).slice(0, 2).join('');

                  return (
                    <tr key={st.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-emerald-900">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                          {st.class_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{st.roll_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${gradient} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                            {initials}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900 text-sm leading-tight">
                              {st.student_name}
                            </span>
                            {st.stream_name && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-normal inline-block mt-0.5">
                                {st.stream_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 font-semibold">{st.scholar_number}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{st.admission_number}</td>
                      <td className="py-3 px-4 text-slate-600">{st.father_name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {st.student_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenStudentProfile(st.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                          <span>CBSE Card</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-900" />
                Import Real School Student Data (CSV)
              </h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Upload real student information via CSV. Download the official CSV template first, fill in your real student details, and upload here. All rows are validated before any data is written to the database.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download CSV Template
              </button>

              {hasRole('SUPER_ADMIN') && (
                <button
                  onClick={handleClearDummyData}
                  className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Wipe Initial Dummy Data
                </button>
              )}
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <input type="file" accept=".csv" onChange={handleFileChange} className="text-xs text-slate-500 cursor-pointer" />
            </div>

            {/* Validation Preview */}
            {previewData && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">CSV Validation Report:</span>
                  <div className="space-x-2 font-bold">
                    <span className="text-emerald-700">{previewData.valid_count} Valid</span>
                    <span className="text-red-700">{previewData.invalid_count} Invalid</span>
                  </div>
                </div>

                {previewData.invalid_records.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-800 max-h-36 overflow-y-auto space-y-1">
                    {previewData.invalid_records.map((r: any, i: number) => (
                      <div key={i} className="text-[11px]">
                        Row {r.row_index} ({r.student_name || 'Empty'}): {r.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                )}

                {previewData.valid_count > 0 && (
                  <button
                    onClick={handleCommitImport}
                    disabled={importing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {importing ? 'Importing...' : `Confirm & Import ${previewData.valid_count} Students`}
                  </button>
                )}
              </div>
            )}

            {importSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                <span>{importSuccess}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Single Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add New Student</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.student_name}
                    onChange={(e) => setNewStudent({ ...newStudent, student_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class</label>
                  <select
                    value={newStudent.class_id}
                    onChange={(e) => setNewStudent({ ...newStudent, class_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Class {c.class_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission No.</label>
                  <input
                    type="text"
                    required
                    value={newStudent.admission_number}
                    onChange={(e) => setNewStudent({ ...newStudent, admission_number: e.target.value })}
                    placeholder="ADM-2026-xxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Scholar No.</label>
                  <input
                    type="text"
                    required
                    value={newStudent.scholar_number}
                    onChange={(e) => setNewStudent({ ...newStudent, scholar_number: e.target.value })}
                    placeholder="SCH-xxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll No.</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newStudent.roll_number}
                    onChange={(e) => setNewStudent({ ...newStudent, roll_number: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.father_name}
                    onChange={(e) => setNewStudent({ ...newStudent, father_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.mother_name}
                    onChange={(e) => setNewStudent({ ...newStudent, mother_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors cursor-pointer mt-4"
              >
                Save Student
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
