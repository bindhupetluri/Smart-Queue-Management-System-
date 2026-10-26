import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  Play, 
  UserX, 
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ServiceCounter, Department, QueueToken, User } from '../types/queue';
import { soundEffects } from '../utils/audio';

interface StaffCounterConsoleProps {
  counters: ServiceCounter[];
  departments: Department[];
  currentUser: User | null;
  onRefreshData: () => void;
}

export const StaffCounterConsole: React.FC<StaffCounterConsoleProps> = ({
  counters,
  departments,
  currentUser,
  onRefreshData,
}) => {
  const [selectedCounterId, setSelectedCounterId] = useState<number>(counters[0]?.id || 1);
  const [activeServingToken, setActiveServingToken] = useState<QueueToken | null>(null);
  const [waitingTokens, setWaitingTokens] = useState<QueueToken[]>([]);
  const [elapsedServiceSeconds, setElapsedServiceSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const currentCounter = counters.find((c) => c.id === selectedCounterId);

  // Timer for active service
  useEffect(() => {
    let timer: any;
    if (activeServingToken) {
      timer = setInterval(() => {
        setElapsedServiceSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedServiceSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeServingToken]);

  // Fetch current serving and waiting tokens for selected counter
  const fetchCounterState = async () => {
    if (!selectedCounterId) return;
    try {
      // Fetch serving token for this counter
      const resTokens = await fetch(`/api/tokens?status=serving`);
      const data = await resTokens.json();
      const myServing = (data.tokens || []).find((t: QueueToken) => t.counter_id === selectedCounterId);
      setActiveServingToken(myServing || null);

      // Fetch waiting tokens in queue
      const deptParam = currentCounter?.department_id ? `&department_id=${currentCounter.department_id}` : '';
      const resWaiting = await fetch(`/api/tokens?status=waiting${deptParam}`);
      const dataWaiting = await resWaiting.json();
      setWaitingTokens(dataWaiting.tokens || []);
    } catch (err) {
      console.warn('Error fetching counter state:', err);
    }
  };

  useEffect(() => {
    fetchCounterState();
    const interval = setInterval(fetchCounterState, 4000);
    return () => clearInterval(interval);
  }, [selectedCounterId, currentCounter?.department_id]);

  const handleCallNext = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/tokens/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counter_id: selectedCounterId,
          department_id: currentCounter?.department_id || null,
          staff_id: currentUser?.id || 2,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to call next token');
      }

      setActiveServingToken(data.token);
      setElapsedServiceSeconds(0);

      // Sound announcement
      soundEffects.speakToken(data.token.token_number, currentCounter?.counter_number || 1);

      setMessage({ text: `Called Token ${data.token.token_number} to Counter ${currentCounter?.counter_number}!`, type: 'success' });
      fetchCounterState();
      onRefreshData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: 'complete' | 'skip' | 'recall' | 'cancel') => {
    if (!activeServingToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tokens/${activeServingToken.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          staff_id: currentUser?.id || 2,
          notes: action === 'complete' ? `Served at Counter ${currentCounter?.counter_number}` : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Action failed');
      }

      if (action === 'complete') {
        confetti({ particleCount: 35, spread: 50, colors: ['#14B8A6', '#0D9488', '#142B4A'] });
        setMessage({ text: `Token ${activeServingToken.token_number} completed successfully!`, type: 'success' });
        setActiveServingToken(null);
      } else if (action === 'recall') {
        soundEffects.speakToken(activeServingToken.token_number, currentCounter?.counter_number);
        setMessage({ text: `Re-announced Token ${activeServingToken.token_number}`, type: 'success' });
      } else if (action === 'skip') {
        setMessage({ text: `Token ${activeServingToken.token_number} marked as no-show / skipped`, type: 'success' });
        setActiveServingToken(null);
      }

      fetchCounterState();
      onRefreshData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Console Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] animate-pulse" />
              <h1 className="text-xl font-bold text-[#142B4A]">Service Counter Operator Console</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Station workstation for managing customer calls, consultations, and triage actions
            </p>
          </div>

          {/* Counter Switcher */}
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-[#142B4A]">Select Counter:</label>
            <select
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(Number(e.target.value))}
              className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-[#142B4A] bg-slate-50 focus:ring-2 focus:ring-[#14B8A6] cursor-pointer"
            >
              {counters.map((c) => (
                <option key={c.id} value={c.id}>
                  Counter {c.counter_number} · {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between mb-6 ${
          message.type === 'success' ? 'bg-teal-50 text-[#0F766E] border border-teal-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">×</button>
        </div>
      )}

      {/* Main Console Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Serving Customer & Actions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Station Status</span>
                <span className="font-bold text-xs px-2.5 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-[#14B8A6]/30">
                  Counter {currentCounter?.counter_number}
                </span>
              </div>

              {activeServingToken && (
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#142B4A] bg-slate-100 px-3 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-[#14B8A6] animate-spin" />
                  <span>Session: {formatTimer(elapsedServiceSeconds)}</span>
                </div>
              )}
            </div>

            {/* Serving Details or Empty State */}
            {activeServingToken ? (
              <div className="py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#0F766E] uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/60">
                      Now Serving
                    </span>
                    <div className="text-5xl font-black font-mono tracking-wider text-[#142B4A] mt-2">
                      {activeServingToken.token_number}
                    </div>
                    <div className="text-lg font-bold text-[#142B4A] mt-1">
                      {activeServingToken.customer_name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {activeServingToken.department_name} · {activeServingToken.service_name}
                    </div>
                    {activeServingToken.customer_phone && (
                      <div className="text-xs text-slate-400 flex items-center mt-1">
                        <Phone className="w-3 h-3 mr-1 text-[#14B8A6]" />
                        {activeServingToken.customer_phone}
                      </div>
                    )}
                  </div>

                  {activeServingToken.priority_level > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-left max-w-xs">
                      <div className="text-xs font-bold text-amber-900 flex items-center">
                        <ShieldCheck className="w-4 h-4 mr-1 text-amber-600" />
                        Priority Customer
                      </div>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        {activeServingToken.priority_reason || 'Authorized Priority Service'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Counter Action Buttons */}
                <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleAction('complete')}
                    disabled={isLoading}
                    className="py-3 px-4 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold rounded-xl shadow-md shadow-teal-500/25 flex items-center justify-center space-x-2 cursor-pointer transition-transform active:scale-95 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Service</span>
                  </button>

                  <button
                    onClick={() => handleAction('recall')}
                    disabled={isLoading}
                    className="py-3 px-4 bg-[#142B4A] hover:bg-[#1E3D66] text-white font-bold rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-colors text-xs"
                  >
                    <Volume2 className="w-4 h-4 text-teal-300" />
                    <span>Recall / Announce</span>
                  </button>

                  <button
                    onClick={() => handleAction('skip')}
                    disabled={isLoading}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-colors text-xs"
                  >
                    <UserX className="w-4 h-4 text-slate-500" />
                    <span>Mark No-Show</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-teal-50 text-[#14B8A6] rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#142B4A]">Counter is Ready & Idle</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the button below to automatically call the next highest priority customer in the waiting line.
                </p>
              </div>
            )}
          </div>

          {/* Big Prominent "CALL NEXT" Button in Navy + Teal */}
          <div className="bg-[#142B4A] rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#1E3D66]">
            <div>
              <h3 className="text-lg font-black tracking-tight">Call Next Customer</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Automatically triages priority customers first, then standard FIFO order.
              </p>
            </div>
            <button
              onClick={handleCallNext}
              disabled={isLoading || waitingTokens.length === 0}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-teal-500/30 transition-transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoading ? 'Calling...' : `Call Next (${waitingTokens.length} Waiting)`}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Waiting Queue List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-[#142B4A]">Waiting Line</h3>
                <p className="text-xs text-slate-500">In this department</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200 text-xs font-bold">
                {waitingTokens.length} In Queue
              </span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {waitingTokens.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No customers waiting currently.
                </p>
              ) : (
                waitingTokens.map((t, idx) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      t.priority_level > 0
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-[#142B4A]">{t.token_number}</span>
                      {t.priority_level > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                          Priority {t.priority_level}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">#{idx + 1} in line</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-[#142B4A] mt-1 truncate">{t.customer_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t.service_name}</div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Wait: ~{t.estimated_wait_mins}m</span>
                      <span>{new Date(t.issue_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Auto-syncs every 4 seconds
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
