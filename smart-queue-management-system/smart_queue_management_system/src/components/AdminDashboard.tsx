import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  RotateCcw, 
  Search, 
  Plus, 
  Building2, 
  Settings, 
  Sliders, 
  AlertTriangle,
  FileSpreadsheet,
  FileArchive
} from 'lucide-react';
import { Department, ServiceItem, ServiceCounter, QueueToken, User } from '../types/queue';

interface AdminDashboardProps {
  departments: Department[];
  services: ServiceItem[];
  counters: ServiceCounter[];
  currentUser: User | null;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  departments,
  services,
  counters,
  currentUser,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'departments' | 'counters' | 'reset'>('tokens');
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [archiveBeforeReset, setArchiveBeforeReset] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Department Form State
  const [newDeptName, setNewDeptName] = useState<string>('');
  const [newDeptCode, setNewDeptCode] = useState<string>('');
  const [newDeptDesc, setNewDeptDesc] = useState<string>('');

  // New Service Form State
  const [newServDeptId, setNewServDeptId] = useState<number>(departments[0]?.id || 1);
  const [newServName, setNewServName] = useState<string>('');
  const [newServDuration, setNewServDuration] = useState<number>(10);

  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      let url = '/api/tokens?limit=150';
      if (filterDept) url += `&department_id=${filterDept}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (e) {
      console.warn('Error fetching tokens:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [filterDept, filterStatus, searchQuery]);

  const handleTokenAction = async (tokenId: number, action: string) => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, staff_id: currentUser?.id || 1 }),
      });
      if (res.ok) {
        setNotification({ text: `Token #${tokenId} updated with action '${action}'`, type: 'success' });
        fetchTokens();
        onRefreshData();
      }
    } catch (err: any) {
      setNotification({ text: err.message, type: 'error' });
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) return;
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName, code: newDeptCode, description: newDeptDesc }),
      });
      if (res.ok) {
        setNotification({ text: 'Department created successfully', type: 'success' });
        setNewDeptName('');
        setNewDeptCode('');
        setNewDeptDesc('');
        onRefreshData();
      }
    } catch (err: any) {
      setNotification({ text: err.message, type: 'error' });
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServName) return;
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_id: newServDeptId,
          name: newServName,
          avg_duration_mins: newServDuration,
        }),
      });
      if (res.ok) {
        setNotification({ text: 'Service created successfully', type: 'success' });
        setNewServName('');
        onRefreshData();
      }
    } catch (err: any) {
      setNotification({ text: err.message, type: 'error' });
    }
  };

  const handleResetQueue = async () => {
    try {
      const res = await fetch('/api/admin/reset-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive_completed: archiveBeforeReset }),
      });
      if (res.ok) {
        setShowResetConfirm(false);
        setNotification({ text: 'Queue system has been safely reset for a new shift.', type: 'success' });
        fetchTokens();
        onRefreshData();
      }
    } catch (err: any) {
      setNotification({ text: err.message, type: 'error' });
    }
  };

  const handleUpdateCounterStatus = async (counterId: number, status: 'open' | 'busy' | 'closed') => {
    try {
      const res = await fetch('/api/counters/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counter_id: counterId, status }),
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics summary
  const totalCount = tokens.length;
  const waitingCount = tokens.filter((t) => t.status === 'waiting').length;
  const servingCount = tokens.filter((t) => t.status === 'serving').length;
  const completedCount = tokens.filter((t) => t.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Admin Title & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-xl bg-[#142B4A] text-[#14B8A6] shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#142B4A]">Administrator Command Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System administration, live token management, department configuration, and queue audit trails
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <a
            href="/api/download-zip"
            download="smart_queue_management_system.zip"
            className="px-4 py-2 bg-[#142B4A] hover:bg-[#1E3D66] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            title="Download full project archive with backend, frontend, database, and configs"
          >
            <FileArchive className="w-4 h-4 text-[#14B8A6]" />
            <span>Download Project ZIP</span>
          </a>

          <a
            href="/api/export/csv"
            download="smart_queue_report.csv"
            className="px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-teal-500/20 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV Audit Log</span>
          </a>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Queue</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between mb-6 ${
          notification.type === 'success' ? 'bg-teal-50 text-[#0F766E] border border-teal-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tokens Today</div>
          <div className="text-3xl font-black text-[#142B4A] mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across all departments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">In Waiting Queue</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{waitingCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Estimated wait ~{waitingCount * 7}m</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-[#14B8A6] uppercase tracking-wider">Currently Serving</div>
          <div className="text-3xl font-black text-[#14B8A6] mt-1">{servingCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">At active counters</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed Service</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{completedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Resolved successfully</div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`pb-3 px-3.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'tokens'
              ? 'border-[#14B8A6] text-[#0F766E]'
              : 'border-transparent text-slate-500 hover:text-[#142B4A]'
          }`}
        >
          Active Tokens Table
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 px-3.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'departments'
              ? 'border-[#14B8A6] text-[#0F766E]'
              : 'border-transparent text-slate-500 hover:text-[#142B4A]'
          }`}
        >
          Departments & Services
        </button>

        <button
          onClick={() => setActiveTab('counters')}
          className={`pb-3 px-3.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'counters'
              ? 'border-[#14B8A6] text-[#0F766E]'
              : 'border-transparent text-slate-500 hover:text-[#142B4A]'
          }`}
        >
          Service Counters
        </button>
      </div>

      {/* Tab 1: Tokens Table */}
      {activeTab === 'tokens' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 bg-[#F4F7FB] border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name, phone, or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-[#142B4A]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-[#142B4A] focus:ring-2 focus:ring-[#14B8A6]"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-[#142B4A] focus:ring-2 focus:ring-[#14B8A6]"
              >
                <option value="">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="serving">Serving</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Tokens List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F7FB] text-[#142B4A] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Department / Service</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Counter</th>
                  <th className="py-3 px-4">Est / Act Wait</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tokens.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No matching queue records found.
                    </td>
                  </tr>
                ) : (
                  tokens.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#142B4A]">{t.token_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#142B4A]">{t.customer_name}</div>
                        {t.customer_phone && <div className="text-[10px] text-slate-400">{t.customer_phone}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{t.department_name}</div>
                        <div className="text-[10px] text-slate-400">{t.service_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        {t.priority_level > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            P{t.priority_level} Priority
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Normal</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'serving'
                            ? 'bg-teal-100 text-[#0F766E]'
                            : t.status === 'waiting'
                            ? 'bg-amber-100 text-amber-800'
                            : t.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {t.counter_number ? `Counter ${t.counter_number}` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[#142B4A] font-semibold">~{t.estimated_wait_mins}m</span>
                        {t.actual_wait_mins !== null && t.actual_wait_mins !== undefined && (
                          <span className="text-[10px] text-slate-400 ml-1">({t.actual_wait_mins}m actual)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {t.status === 'waiting' && (
                          <button
                            onClick={() => handleTokenAction(t.id, 'cancel')}
                            className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold"
                          >
                            Cancel
                          </button>
                        )}
                        {t.status === 'serving' && (
                          <button
                            onClick={() => handleTokenAction(t.id, 'complete')}
                            className="px-2 py-1 rounded bg-teal-50 text-[#0F766E] hover:bg-teal-100 text-[10px] font-bold"
                          >
                            Complete
                          </button>
                        )}
                        {t.status === 'skipped' && (
                          <button
                            onClick={() => handleTokenAction(t.id, 'requeue')}
                            className="px-2 py-1 rounded bg-teal-50 text-[#0F766E] hover:bg-teal-100 text-[10px] font-bold"
                          >
                            Re-Queue
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Departments & Services */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Department Form & List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-base text-[#142B4A] mb-4">Add New Department</h3>
            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#142B4A] mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Radiology & Imaging"
                  className="w-full px-3 py-2 border rounded-xl text-xs text-[#142B4A] focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#142B4A] mb-1">Prefix Code</label>
                  <input
                    type="text"
                    required
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                    placeholder="e.g. RAD"
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-[#142B4A] focus:ring-2 focus:ring-[#14B8A6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#142B4A] mb-1">Description</label>
                  <input
                    type="text"
                    value={newDeptDesc}
                    onChange={(e) => setNewDeptDesc(e.target.value)}
                    placeholder="Brief scope"
                    className="w-full px-3 py-2 border rounded-xl text-xs text-[#142B4A] focus:ring-2 focus:ring-[#14B8A6]"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold text-xs rounded-xl shadow-sm shadow-teal-500/20"
              >
                + Add Department
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Existing Departments</h4>
              <div className="space-y-2">
                {departments.map((d) => (
                  <div key={d.id} className="p-3 bg-[#F4F7FB] rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#142B4A]">{d.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Code: {d.code}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-teal-100 text-[#0F766E] font-bold text-[10px]">
                      {d.waiting_count || 0} Waiting
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Service Form & List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-base text-[#142B4A] mb-4">Add Service to Department</h3>
            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#142B4A] mb-1">Parent Department</label>
                <select
                  value={newServDeptId}
                  onChange={(e) => setNewServDeptId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-[#142B4A] focus:ring-2 focus:ring-[#14B8A6]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#142B4A] mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={newServName}
                  onChange={(e) => setNewServName(e.target.value)}
                  placeholder="e.g. MRI Scan Consultation"
                  className="w-full px-3 py-2 border rounded-xl text-xs text-[#142B4A] focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#142B4A] mb-1">Average Duration (Minutes)</label>
                <input
                  type="number"
                  min="2"
                  max="120"
                  value={newServDuration}
                  onChange={(e) => setNewServDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-[#142B4A] focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold text-xs rounded-xl shadow-sm shadow-teal-500/20"
              >
                + Add Service
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Services</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {services.map((s) => (
                  <div key={s.id} className="p-2.5 bg-[#F4F7FB] rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#142B4A]">{s.name}</div>
                      <div className="text-[10px] text-slate-400">Duration: {s.avg_duration_mins} mins</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Service Counters Desk Management */}
      {activeTab === 'counters' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-base text-[#142B4A] mb-2">Service Counters Configuration</h3>
          <p className="text-xs text-slate-500 mb-6">Manage station operational status and departmental desk assignments</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {counters.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-200 bg-[#F4F7FB]/50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="font-bold text-sm text-[#142B4A]">Counter #{c.counter_number}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    c.status === 'open' ? 'bg-teal-100 text-[#0F766E]' : c.status === 'busy' ? 'bg-[#142B4A]/10 text-[#142B4A]' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="my-3 text-xs">
                  <div className="font-semibold text-[#142B4A]">{c.name}</div>
                  <div className="text-slate-500 mt-1">Staff: {c.staff_name || 'Unassigned'}</div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateCounterStatus(c.id, 'open')}
                    className="flex-1 py-1.5 bg-white hover:bg-teal-50 border border-slate-300 text-[#0F766E] rounded-lg text-xs font-semibold"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleUpdateCounterStatus(c.id, 'closed')}
                    className="flex-1 py-1.5 bg-white hover:bg-red-50 border border-slate-300 text-red-700 rounded-lg text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-[#0E1E34]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#142B4A] text-lg">Safe Queue Shift Reset</h3>
            <p className="text-xs text-slate-600 mt-2">
              This will cancel remaining waiting tokens, mark active stations as complete, and reset queues for the new operational shift.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={archiveBeforeReset}
                  onChange={(e) => setArchiveBeforeReset(e.target.checked)}
                  className="rounded text-[#14B8A6] focus:ring-[#14B8A6]"
                />
                <span className="font-medium text-slate-700">Retain historical records for CSV report exports</span>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetQueue}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Shift Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
