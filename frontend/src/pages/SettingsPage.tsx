import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { SchoolSetting, ResultConfig } from '../types';
import {
  Settings,
  School,
  Calculator,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { schoolInfo, refreshSchoolInfo, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'school' | 'formula'>('school');

  // School profile form state
  const [schoolForm, setSchoolForm] = useState<SchoolSetting>({
    id: 1,
    school_name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    institute_code: '',
    dise_code: '',
    principal_name: '',
    contact_number: '',
    email: '',
    website: '',
    logo_url: '',
    report_card_header_text: '',
    is_demo: true,
  });

  // Result formula form state
  const [formulaForm, setFormulaForm] = useState<ResultConfig>({
    id: 1,
    min_pass_percentage: 33.0,
    min_subject_pass_percentage: 33.0,
    grace_marks_allowed: 0.0,
    grading_rules: {},
    division_rules: {},
    formula_type: 'STANDARD_SUM_PERCENTAGE',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (schoolInfo) {
      setSchoolForm(schoolInfo);
    }
    // Fetch result config
    apiClient.get('/results/config').then((res) => {
      setFormulaForm(res.data);
    }).catch(console.error);
  }, [schoolInfo]);

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await apiClient.put('/settings', schoolForm);
      await refreshSchoolInfo();
      setSuccessMsg('School profile updated successfully! All report cards will reflect this instantly.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update school settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await apiClient.put('/results/config', {
        min_pass_percentage: formulaForm.min_pass_percentage,
        min_subject_pass_percentage: formulaForm.min_subject_pass_percentage,
        grace_marks_allowed: formulaForm.grace_marks_allowed,
      });
      setSuccessMsg('Result calculation rules updated successfully! Results and report cards will recalculate based on these rules.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update result configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Settings className="w-6 h-6 mr-2 text-blue-900" />
          Settings & Formula Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure real school branding, institutional codes, result thresholds, and grading systems.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('school')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center ${
            activeTab === 'school'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <School className="w-4 h-4 mr-1.5" />
          School Branding & Profile
        </button>

        <button
          onClick={() => setActiveTab('formula')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center ${
            activeTab === 'formula'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4 mr-1.5" />
          Result Formula & Passing Rules
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs sm:text-sm font-semibold flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: School Profile */}
      {activeTab === 'school' && (
        <form onSubmit={handleSaveSchool} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start">
            <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>
              All fields below are completely dynamic. When real school details are provided, update them here to update all reports and report cards system-wide.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">School Name</label>
              <input
                type="text"
                required
                value={schoolForm.school_name}
                onChange={(e) => setSchoolForm({ ...schoolForm, school_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Principal's Name</label>
              <input
                type="text"
                required
                value={schoolForm.principal_name}
                onChange={(e) => setSchoolForm({ ...schoolForm, principal_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Full School Address</label>
              <input
                type="text"
                required
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={schoolForm.city}
                onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={schoolForm.state}
                onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Institute Code</label>
              <input
                type="text"
                value={schoolForm.institute_code}
                onChange={(e) => setSchoolForm({ ...schoolForm, institute_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">DISE Code</label>
              <input
                type="text"
                value={schoolForm.dise_code}
                onChange={(e) => setSchoolForm({ ...schoolForm, dise_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={schoolForm.contact_number}
                onChange={(e) => setSchoolForm({ ...schoolForm, contact_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={schoolForm.email}
                onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || !hasRole('SUPER_ADMIN')}
              className="inline-flex items-center px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save School Details'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Formula & Rules */}
      {activeTab === 'formula' && (
        <form onSubmit={handleSaveFormula} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start">
            <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>
              The calculation service is decoupled from the UI. Update passing percentages and grace marks here. When actual school formula rules are provided, they plug in dynamically.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Overall Minimum Pass Percentage (%)</label>
              <input
                type="number"
                step="0.5"
                value={formulaForm.min_pass_percentage}
                onChange={(e) => setFormulaForm({ ...formulaForm, min_pass_percentage: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject Minimum Pass Percentage (%)</label>
              <input
                type="number"
                step="0.5"
                value={formulaForm.min_subject_pass_percentage}
                onChange={(e) => setFormulaForm({ ...formulaForm, min_subject_pass_percentage: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Grace Marks Allowed</label>
              <input
                type="number"
                step="0.5"
                value={formulaForm.grace_marks_allowed}
                onChange={(e) => setFormulaForm({ ...formulaForm, grace_marks_allowed: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
              />
            </div>
          </div>

          {/* Active Grading System Preview */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Configured Grading Scale (CBSE 8-Point)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 border rounded-lg"><b>A1:</b> 91% - 100% (Outstanding)</div>
              <div className="p-2 bg-slate-50 border rounded-lg"><b>A2:</b> 81% - 90.9% (Excellent)</div>
              <div className="p-2 bg-slate-50 border rounded-lg"><b>B1:</b> 71% - 80.9% (Very Good)</div>
              <div className="p-2 bg-slate-50 border rounded-lg"><b>B2:</b> 61% - 70.9% (Good)</div>
              <div className="p-2 bg-slate-50 border rounded-lg"><b>C1:</b> 51% - 60.9% (Above Average)</div>
              <div className="p-2 bg-slate-50 border rounded-lg"><b>C2:</b> 41% - 50.9% (Average)</div>
              <div className="p-2 bg-slate-50 border rounded-lg"><b>D:</b> 33% - 40.9% (Pass)</div>
              <div className="p-2 bg-slate-50 border rounded-lg"><b>E:</b> &lt; 33% (Needs Improvement)</div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || !hasRole('SUPER_ADMIN')}
              className="inline-flex items-center px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Calculation Rules'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsPage;
