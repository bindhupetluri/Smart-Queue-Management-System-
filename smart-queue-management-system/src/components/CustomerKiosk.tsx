import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  QrCode, 
  Stethoscope, 
  HeartPulse, 
  Receipt, 
  Pill, 
  FileText, 
  ArrowRight,
  ShieldAlert,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Department, ServiceItem, User, QueueToken } from '../types/queue';

interface CustomerKioskProps {
  departments: Department[];
  services: ServiceItem[];
  currentUser: User | null;
  onTokenGenerated: (token: QueueToken) => void;
  onGoToTicket: (tokenNumber: string) => void;
}

export const CustomerKiosk: React.FC<CustomerKioskProps> = ({
  departments,
  services,
  currentUser,
  onTokenGenerated,
  onGoToTicket,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(departments[0]?.id || 1);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [priorityLevel, setPriorityLevel] = useState<number>(0);
  const [priorityReason, setPriorityReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success state modal
  const [generatedToken, setGeneratedToken] = useState<QueueToken | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const deptServices = services.filter((s) => s.department_id === selectedDeptId);

  // Synchronize department when master list loads
  useEffect(() => {
    if (departments.length > 0 && !selectedDeptId) {
      setSelectedDeptId(departments[0].id);
    }
  }, [departments, selectedDeptId]);

  // FIX: Automatically pre-select first service of department whenever department or services change
  useEffect(() => {
    if (selectedDeptId && services.length > 0) {
      const available = services.filter((s) => s.department_id === selectedDeptId);
      const isCurrentValid = available.some((s) => s.id === selectedServiceId);
      if (!isCurrentValid && available.length > 0) {
        setSelectedServiceId(available[0].id);
        setErrorMessage(null);
      }
    }
  }, [selectedDeptId, services]);

  // Icon mapping helper
  const getDeptIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Stethoscope': return Stethoscope;
      case 'HeartPulse': return HeartPulse;
      case 'Receipt': return Receipt;
      case 'Pill': return Pill;
      case 'FileText': return FileText;
      default: return Building2;
    }
  };

  const handleSelectDepartment = (deptId: number) => {
    setSelectedDeptId(deptId);
    setErrorMessage(null);
    const available = services.filter((s) => s.department_id === deptId);
    if (available.length > 0) {
      setSelectedServiceId(available[0].id);
    }
  };

  const handleSelectService = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setErrorMessage(null);
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const activeDeptId = selectedDeptId || (departments.length > 0 ? departments[0].id : null);
    if (!activeDeptId) {
      setErrorMessage('Please select a department');
      return;
    }

    // FIX: Fallback to first service in current department if not explicitly set
    let effectiveServiceId = selectedServiceId;
    if (!effectiveServiceId && deptServices.length > 0) {
      effectiveServiceId = deptServices[0].id;
      setSelectedServiceId(effectiveServiceId);
    }

    if (!effectiveServiceId) {
      setErrorMessage('Please choose a specific service');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter customer full name');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tokens/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || null,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          department_id: activeDeptId,
          service_id: effectiveServiceId,
          priority_level: priorityLevel,
          priority_reason: priorityLevel > 0 ? priorityReason : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to issue token');
      }

      const token: QueueToken = data.token;
      setGeneratedToken(token);
      onTokenGenerated(token);

      // Generate QR Code containing token verification link
      const qrUrl = await QRCode.toDataURL(
        `${window.location.origin}/?token=${token.token_number}&ref=qr_ticket`,
        { width: 220, margin: 1 }
      );
      setQrCodeDataUrl(qrUrl);

      // Trigger celebratory confetti in teal theme
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#14B8A6', '#0D9488', '#142B4A', '#CCFBF1'],
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating token');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Intro Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1 bg-teal-50 text-[#0F766E] rounded-full border border-[#14B8A6]/30 mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
          <span>Self-Service Digital Ticket Desk</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#142B4A] tracking-tight">
          Welcome to Smart Queue Check-in
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Select your destination and receive an instant digital token. Track your queue position live on your phone without waiting in physical lines.
        </p>
      </div>

      {/* Main Kiosk Form */}
      <form onSubmit={handleGenerateToken} className="space-y-8">
        {/* Step 1: Select Department */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#142B4A] text-white flex items-center justify-center text-sm font-bold">1</span>
              <h2 className="text-lg font-bold text-[#142B4A]">Select Department</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((dept) => {
              const Icon = getDeptIcon(dept.icon);
              const isSelected = selectedDeptId === dept.id;
              return (
                <div
                  key={dept.id}
                  onClick={() => handleSelectDepartment(dept.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#14B8A6] bg-teal-50/50 ring-2 ring-[#14B8A6]/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#142B4A] text-[#14B8A6]' : 'bg-slate-100 text-[#142B4A]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      isSelected 
                        ? 'bg-[#14B8A6]/10 text-[#0F766E] border-[#14B8A6]/30' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {dept.code}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#142B4A] mt-3">{dept.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
                  
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                    <span className="text-amber-600 flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1" />
                      {dept.waiting_count || 0} Waiting
                    </span>
                    <span className="text-[#0F766E] font-semibold flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-[#14B8A6]" />
                      ~{((dept.waiting_count || 0) * 8)}m est.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Specific Service */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#142B4A] text-white flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <h2 className="text-lg font-bold text-[#142B4A]">Choose Requested Service</h2>
                <p className="text-xs text-slate-500">Pick from available options below (first option is automatically selected)</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">Step 2 of 3</span>
          </div>

          {deptServices.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Please select a department above to view services</p>
          ) : (
            <div>
              {/* Service Cards Grid with clear Teal active highlights and radio indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {deptServices.map((serv) => {
                  const isSelected = selectedServiceId === serv.id;
                  return (
                    <div
                      key={serv.id}
                      onClick={() => handleSelectService(serv.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#14B8A6] bg-teal-50/50 ring-2 ring-[#14B8A6]/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-[#14B8A6] border-[#14B8A6] text-white shadow-xs'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-sm text-[#142B4A]">{serv.name}</h4>
                            {serv.base_priority > 0 && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                Fast Track
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{serv.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-xs font-bold text-[#142B4A]">{serv.avg_duration_mins} mins</div>
                        <div className="text-[10px] text-slate-400">Avg Duration</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Dropdown Fallback to Guarantee 100% Reliability */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Or select from dropdown:</span>
                <select
                  value={selectedServiceId || (deptServices[0]?.id || '')}
                  onChange={(e) => handleSelectService(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#142B4A] bg-white focus:ring-2 focus:ring-[#14B8A6] focus:outline-none"
                >
                  {deptServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.avg_duration_mins} mins)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Customer Details & Priority Options */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#142B4A] text-white flex items-center justify-center text-sm font-bold">3</span>
              <h2 className="text-lg font-bold text-[#142B4A]">Customer Details & Priority</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Step 3 of 3</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Maria Johnson"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] bg-white text-[#142B4A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-1.5">
                Phone Number (for SMS & Tracking)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +1 (555) 234-5678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] bg-white text-[#142B4A]"
              />
            </div>
          </div>

          {/* Priority Rules Selection */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <label className="block text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-2">
              Priority Classification
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPriorityLevel(0)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  priorityLevel === 0
                    ? 'border-[#14B8A6] bg-teal-50/60 ring-1 ring-[#14B8A6] text-[#0F766E] font-semibold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold text-[#142B4A]">Standard Queue</div>
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">FIFO order (First In, First Out)</div>
              </button>

              <button
                type="button"
                onClick={() => setPriorityLevel(1)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  priorityLevel === 1
                    ? 'border-amber-500 bg-amber-50/80 ring-1 ring-amber-500 text-amber-900 font-semibold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold flex items-center text-[#142B4A]">
                  <span>Senior / Differently Abled</span>
                  <span className="ml-1.5 text-[10px] px-1 bg-amber-200 text-amber-900 rounded font-semibold">Level 1</span>
                </div>
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">Priority triage for elderly & accessible care</div>
              </button>

              <button
                type="button"
                onClick={() => setPriorityLevel(2)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  priorityLevel === 2
                    ? 'border-red-600 bg-red-50/80 ring-1 ring-red-500 text-red-900 font-semibold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold flex items-center text-red-700">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  <span>Medical Emergency / Critical</span>
                </div>
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">Immediate counter callout triage</div>
              </button>
            </div>

            {priorityLevel > 0 && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Reason for Priority Authorization:
                </label>
                <input
                  type="text"
                  value={priorityReason}
                  onChange={(e) => setPriorityReason(e.target.value)}
                  placeholder={priorityLevel === 2 ? 'e.g. Acute chest pain, trauma' : 'e.g. Senior Citizen 74 years old'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#14B8A6] hover:bg-[#0D9488] disabled:bg-teal-300 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] cursor-pointer"
          >
            {isSubmitting ? (
              <span>Generating Secure Digital Token...</span>
            ) : (
              <>
                <span>Issue My Digital Token</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* SUCCESS MODAL DIALOG */}
      {generatedToken && (
        <div className="fixed inset-0 z-50 bg-[#0E1E34]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-50 text-[#14B8A6] rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#142B4A]">Your Token is Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please save your digital token card or scan the QR code to track your queue status in real time.
              </p>
            </div>

            {/* Ticket Card */}
            <div className="mt-5 p-5 rounded-xl bg-[#F0FDFA] border-2 border-[#14B8A6]/40 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 font-mono text-[10px] text-[#0F766E] font-bold uppercase tracking-wider bg-teal-100 px-2 py-0.5 rounded">
                {generatedToken.department_name}
              </div>

              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-1">Token Number</div>
              <div className="text-4xl font-extrabold text-[#142B4A] font-mono tracking-wider my-2">
                {generatedToken.token_number}
              </div>

              <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-dashed border-[#14B8A6]/30 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                  <div className="text-slate-400 font-medium">Estimated Wait</div>
                  <div className="font-bold text-[#0F766E] text-sm mt-0.5">~{generatedToken.estimated_wait_mins} mins</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                  <div className="text-slate-400 font-medium">Position Ahead</div>
                  <div className="font-bold text-[#142B4A] text-sm mt-0.5">{generatedToken.customers_ahead || 0} People</div>
                </div>
              </div>

              {/* QR Code */}
              {qrCodeDataUrl && (
                <div className="mt-2 flex flex-col items-center">
                  <img src={qrCodeDataUrl} alt="Token QR Code" className="w-32 h-32 rounded-lg border border-slate-200 shadow-xs bg-white" />
                  <span className="text-[10px] text-slate-400 mt-1">Scan with phone to track anywhere</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  onGoToTicket(generatedToken.token_number);
                  setGeneratedToken(null);
                }}
                className="flex-1 py-2.5 px-4 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center space-x-1 shadow-md shadow-teal-500/20"
              >
                <span>Track Live Queue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setGeneratedToken(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
