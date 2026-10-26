import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Clock, 
  Users, 
  Building2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RotateCw, 
  Printer, 
  Calendar, 
  User as UserIcon,
  Search
} from 'lucide-react';
import QRCode from 'qrcode';
import { QueueToken, User } from '../types/queue';
import { soundEffects } from '../utils/audio';

interface MyTicketViewProps {
  initialTokenNumber?: string | null;
  currentUser: User | null;
  onGoToKiosk: () => void;
}

export const MyTicketView: React.FC<MyTicketViewProps> = ({
  initialTokenNumber,
  currentUser,
  onGoToKiosk,
}) => {
  const [tokenSearchInput, setTokenSearchInput] = useState<string>(initialTokenNumber || 'OPD-108');
  const [activeToken, setActiveToken] = useState<QueueToken | null>(null);
  const [peopleAhead, setPeopleAhead] = useState<number>(0);
  const [servingNow, setServingNow] = useState<{ token_number: string; counter_number: number; counter_name: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customerHistory, setCustomerHistory] = useState<QueueToken[]>([]);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Fetch token status
  const fetchTokenDetails = async (identifier: string) => {
    if (!identifier) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/tokens/track/${encodeURIComponent(identifier.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Token not found');
      }

      setActiveToken(data.token);
      setPeopleAhead(data.peopleAhead || 0);
      setServingNow(data.servingNow);

      // Generate QR Code
      const qr = await QRCode.toDataURL(
        `${window.location.origin}/?token=${data.token.token_number}&verified=true`,
        { width: 220, margin: 1 }
      );
      setQrCodeUrl(qr);

      // Trigger audio prompt if status is serving
      if (data.token.status === 'serving') {
        soundEffects.speakToken(data.token.token_number, data.token.counter_number || 1);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not locate token');
      setActiveToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's token history if logged in or by user ID
  const fetchUserHistory = async () => {
    try {
      const userIdParam = currentUser?.id ? `?user_id=${currentUser.id}` : '';
      const res = await fetch(`/api/tokens${userIdParam}`);
      const data = await res.json();
      if (data.tokens) {
        setCustomerHistory(data.tokens);
      }
    } catch (e) {
      console.warn('History fetch error:', e);
    }
  };

  useEffect(() => {
    if (initialTokenNumber) {
      setTokenSearchInput(initialTokenNumber);
      fetchTokenDetails(initialTokenNumber);
    } else {
      fetchTokenDetails(tokenSearchInput);
    }
    fetchUserHistory();
  }, [initialTokenNumber, currentUser]);

  // Periodic polling to keep position updated every 5 seconds
  useEffect(() => {
    if (!activeToken || activeToken.status === 'completed' || activeToken.status === 'cancelled') return;

    const interval = setInterval(() => {
      fetchTokenDetails(activeToken.token_number);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeToken?.token_number, activeToken?.status]);

  const handleCancelToken = async () => {
    if (!activeToken) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/tokens/${activeToken.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', notes: 'Cancelled by customer' }),
      });
      if (res.ok) {
        setShowCancelModal(false);
        fetchTokenDetails(activeToken.token_number);
        fetchUserHistory();
      }
    } catch (err) {
      console.error('Cancel failed', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const printToken = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#142B4A]">Track Digital Token</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your token number or search by phone to check live queue progress
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchTokenDetails(tokenSearchInput);
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tokenSearchInput}
                onChange={(e) => setTokenSearchInput(e.target.value.toUpperCase())}
                placeholder="e.g. OPD-108"
                className="pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-semibold uppercase focus:ring-2 focus:ring-[#14B8A6] focus:outline-none w-36 sm:w-44 bg-slate-50 text-[#142B4A]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-teal-500/20"
            >
              {isLoading ? 'Checking...' : 'Lookup'}
            </button>
          </form>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={onGoToKiosk}
            className="font-bold underline hover:text-red-800"
          >
            Generate New Token
          </button>
        </div>
      )}

      {/* Main Digital Ticket Display */}
      {activeToken && (
        <div className="bg-white rounded-2xl border-2 border-[#14B8A6]/40 shadow-xl overflow-hidden mb-8">
          {/* Top Banner based on Status */}
          <div className={`px-6 py-4 flex items-center justify-between ${
            activeToken.status === 'serving'
              ? 'bg-[#14B8A6] text-white animate-pulse'
              : activeToken.status === 'completed'
              ? 'bg-slate-700 text-white'
              : activeToken.status === 'cancelled'
              ? 'bg-red-600 text-white'
              : 'bg-[#142B4A] text-white'
          }`}>
            <div className="flex items-center space-x-2">
              {activeToken.status === 'serving' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-teal-100" />
                  <span className="font-bold text-sm tracking-wide">
                    IT IS YOUR TURN! PROCEED TO COUNTER {activeToken.counter_number || 1}
                  </span>
                </>
              ) : activeToken.status === 'waiting' ? (
                <>
                  <Clock className="w-5 h-5 text-teal-300" />
                  <span className="font-bold text-sm tracking-wide">WAITING IN QUEUE</span>
                </>
              ) : activeToken.status === 'completed' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-slate-300" />
                  <span className="font-bold text-sm tracking-wide">SERVICE COMPLETED</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-200" />
                  <span className="font-bold text-sm tracking-wide">TICKET CANCELLED</span>
                </>
              )}
            </div>

            <button
              onClick={() => fetchTokenDetails(activeToken.token_number)}
              title="Refresh Queue Status"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Ticket Body */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Token Main Identifier */}
              <div className="md:col-span-2 text-left">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Building2 className="w-4 h-4 text-[#14B8A6]" />
                  <span>{activeToken.department_name} · {activeToken.service_name}</span>
                </div>

                <div className="text-5xl sm:text-6xl font-black font-mono tracking-wider text-[#142B4A] my-2">
                  {activeToken.token_number}
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-600 mb-6">
                  <span className="flex items-center">
                    <UserIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {activeToken.customer_name}
                  </span>
                  <span>·</span>
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Issued {new Date(activeToken.issue_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Queue Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F0FDFA] border border-teal-100">
                    <div className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider">Ahead of You</div>
                    <div className="text-2xl font-extrabold text-[#14B8A6] mt-0.5">
                      {activeToken.status === 'waiting' ? peopleAhead : 0}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {peopleAhead === 0 && activeToken.status === 'waiting' ? 'You are next in line!' : 'Waiting customers'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Est. Wait Time</div>
                    <div className="text-2xl font-extrabold text-[#142B4A] mt-0.5">
                      {activeToken.status === 'waiting' ? `~${Math.max(1, peopleAhead * 7)}m` : '0m'}
                    </div>
                    <div className="text-[10px] text-slate-400">Dynamic queue wait estimation</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Now Serving</div>
                    <div className="text-lg font-bold font-mono text-[#14B8A6] mt-1 truncate">
                      {servingNow ? `${servingNow.token_number} (C${servingNow.counter_number})` : 'Active'}
                    </div>
                    <div className="text-[10px] text-slate-400">In this department</div>
                  </div>
                </div>
              </div>

              {/* QR Code and Actions */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#F4F7FB] rounded-2xl border border-slate-200/80 text-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Token QR" className="w-36 h-36 rounded-xl border border-slate-200 bg-white p-1 shadow-xs" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center bg-white rounded-xl border">
                    <QrCode className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="text-[11px] font-medium text-slate-500 mt-2">
                  Scan QR for instant mobile ticket
                </div>

                <div className="mt-4 flex items-center space-x-2 w-full">
                  <button
                    onClick={printToken}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-[#142B4A] text-xs font-semibold rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print</span>
                  </button>

                  {activeToken.status === 'waiting' && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Token History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-[#142B4A]">Your Recent Queue History</h3>
            <p className="text-xs text-slate-500">Previously issued tokens for this session</p>
          </div>
          <button
            onClick={onGoToKiosk}
            className="text-xs font-bold text-[#14B8A6] hover:text-[#0D9488]"
          >
            + Get Another Token
          </button>
        </div>

        {customerHistory.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No previous token history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F7FB] text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerHistory.slice(0, 8).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#142B4A]">{t.token_number}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.department_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.service_name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'serving'
                          ? 'bg-teal-100 text-[#0F766E]'
                          : t.status === 'waiting'
                          ? 'bg-amber-100 text-amber-800'
                          : t.status === 'completed'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(t.issue_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => fetchTokenDetails(t.token_number)}
                        className="text-[#14B8A6] font-semibold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-[#0E1E34]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-[#142B4A] text-base">Cancel this Token?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to cancel token <strong className="font-mono text-[#142B4A]">{activeToken?.token_number}</strong>? You will lose your current queue position.
            </p>
            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                No, Keep Ticket
              </button>
              <button
                onClick={handleCancelToken}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Token'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
