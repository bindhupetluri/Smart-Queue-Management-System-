import React, { useState, useEffect } from 'react';
import { Download, FileArchive } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CustomerKiosk } from './components/CustomerKiosk';
import { MyTicketView } from './components/MyTicketView';
import { PublicDisplayBoard } from './components/PublicDisplayBoard';
import { StaffCounterConsole } from './components/StaffCounterConsole';
import { AdminDashboard } from './components/AdminDashboard';
import { ProjectFolderView } from './components/ProjectFolderView';
import { Department, ServiceItem, ServiceCounter, User, QueueToken, NotificationItem } from './types/queue';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('kiosk');
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    name: 'Dr. Robert Vance (Admin)',
    email: 'admin@queuesmart.io',
    role: 'admin',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [counters, setCounters] = useState<ServiceCounter[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [activeTrackingToken, setActiveTrackingToken] = useState<string | null>(null);

  // Load initial departments, services, and counters from SQLite backend
  const loadMasterData = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.departments) setDepartments(data.departments);
      if (data.services) setServices(data.services);
      if (data.counters) setCounters(data.counters);
    } catch (err) {
      console.warn('Failed to load master departments data:', err);
    }
  };

  // Load user notifications
  const loadNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/notifications/${currentUser.id}`);
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    // Check URL query parameters for token (e.g. from QR code scan)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setActiveTrackingToken(tokenParam);
      setCurrentTab('my-ticket');
    }

    loadMasterData();
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (e) {
      console.error(e);
    }
  };

  // Total waiting & serving counts across all departments
  const totalWaiting = departments.reduce((acc, d) => acc + (d.waiting_count || 0), 0);
  const totalServing = departments.reduce((acc, d) => acc + (d.serving_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col font-sans text-[#142B4A] antialiased">
      {/* If current view is the Public TV board, render clean dedicated screen */}
      {currentTab === 'display' ? (
        <div>
          {/* Subtle back bar for ease of testing */}
          <div className="bg-[#142B4A] px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 border-b border-[#1E3D66]">
            <span className="font-semibold text-white">Live Kiosk Public TV Screen</span>
            <button
              onClick={() => setCurrentTab('kiosk')}
              className="text-[#14B8A6] font-bold hover:text-teal-300 flex items-center space-x-1 cursor-pointer"
            >
              <span>← Exit to Navigation</span>
            </button>
          </div>
          <PublicDisplayBoard
            audioEnabled={audioEnabled}
            setAudioEnabled={setAudioEnabled}
          />
        </div>
      ) : (
        <>
          <Navbar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            currentUser={currentUser}
            onSelectUser={setCurrentUser}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            audioEnabled={audioEnabled}
            setAudioEnabled={setAudioEnabled}
            waitingCount={totalWaiting}
            servingCount={totalServing}
          />

          <main className="flex-1 pb-16">
            {currentTab === 'kiosk' && (
              <CustomerKiosk
                departments={departments}
                services={services}
                currentUser={currentUser}
                onTokenGenerated={(token) => {
                  setActiveTrackingToken(token.token_number);
                  loadMasterData();
                }}
                onGoToTicket={(tokenNumber) => {
                  setActiveTrackingToken(tokenNumber);
                  setCurrentTab('my-ticket');
                }}
              />
            )}

            {currentTab === 'my-ticket' && (
              <MyTicketView
                initialTokenNumber={activeTrackingToken}
                currentUser={currentUser}
                onGoToKiosk={() => setCurrentTab('kiosk')}
              />
            )}

            {currentTab === 'staff' && (
              <StaffCounterConsole
                counters={counters}
                departments={departments}
                currentUser={currentUser}
                onRefreshData={loadMasterData}
              />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard
                departments={departments}
                services={services}
                counters={counters}
                currentUser={currentUser}
                onRefreshData={loadMasterData}
              />
            )}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#142B4A]">Smart Queue Management System</span>
                <span>·</span>
                <span className="text-[#0F766E] font-medium">Enterprise Queue Engine</span>
              </div>
              <div className="flex items-center flex-wrap gap-4">
                <button onClick={() => setCurrentTab('kiosk')} className="hover:text-[#14B8A6] transition-colors cursor-pointer">
                  Customer Kiosk
                </button>
                <button onClick={() => setCurrentTab('display')} className="hover:text-[#14B8A6] transition-colors cursor-pointer">
                  TV Board Kiosk
                </button>
                <button onClick={() => setCurrentTab('admin')} className="hover:text-[#14B8A6] transition-colors cursor-pointer">
                  Operations & Reports
                </button>
                <a
                  href="/api/download-zip"
                  download="smart_queue_management_system.zip"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#142B4A] hover:bg-[#1E3D66] text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  title="Download complete project source code (.zip)"
                >
                  <FileArchive className="w-3.5 h-3.5 text-[#14B8A6]" />
                  <span>Download Project ZIP</span>
                  <Download className="w-3 h-3 text-slate-300 ml-0.5" />
                </a>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

