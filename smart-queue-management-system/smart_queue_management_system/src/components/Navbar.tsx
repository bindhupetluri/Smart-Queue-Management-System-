import React, { useState } from 'react';
import { 
  Layers, 
  Tv, 
  UserCheck, 
  ShieldCheck, 
  Bell, 
  Volume2, 
  VolumeX, 
  Ticket, 
  Users, 
  CheckCircle2, 
  ChevronDown,
  FolderArchive
} from 'lucide-react';
import { User, NotificationItem } from '../types/queue';
import { soundEffects } from '../utils/audio';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onSelectUser: (user: User | null) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: number) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  waitingCount: number;
  servingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onSelectUser,
  notifications,
  onMarkNotificationRead,
  audioEnabled,
  setAudioEnabled,
  waitingCount,
  servingCount,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const demoUsers: User[] = [
    { id: 1, name: 'Dr. Robert Vance', email: 'admin@queuesmart.io', role: 'admin' },
    { id: 2, name: 'Elena Rostova', email: 'staff1@queuesmart.io', role: 'staff' },
    { id: 4, name: 'Aaliyah Patel', email: 'customer@queuesmart.io', role: 'customer' },
  ];

  const navItems = [
    { id: 'kiosk', label: 'Get Token', icon: Ticket },
    { id: 'my-ticket', label: 'My Ticket', icon: Layers },
    { id: 'display', label: 'Live TV Board', icon: Tv, highlight: true },
    { id: 'staff', label: 'Counter Desk', icon: UserCheck },
    { id: 'admin', label: 'Operations', icon: ShieldCheck },
    { id: 'folder', label: 'Project Folder', icon: FolderArchive },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#142B4A] border-b border-[#1E3D66] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Facility Info */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('kiosk')}>
            <div className="w-10 h-10 rounded-xl bg-[#14B8A6] flex items-center justify-center text-white shadow-md shadow-teal-500/25 font-bold text-lg tracking-wider">
              QS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">SmartQueue</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/40">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">City Metropolitan Center · Live Digital Triage</p>
            </div>
          </div>

          {/* Center Navigation: Clean layout with 6 items, no empty gaps */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#14B8A6] text-white shadow-sm shadow-teal-500/30'
                      : item.highlight
                      ? 'text-teal-300 hover:bg-[#1E3D66] hover:text-white'
                      : 'text-slate-200 hover:bg-[#1E3D66] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Live Queue Counters Badge */}
            <div className="hidden md:flex items-center text-xs font-medium space-x-2 bg-[#0E1E34]/80 px-2.5 py-1.5 rounded-lg border border-[#1E3D66]">
              <span className="flex items-center text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5 animate-pulse" />
                {waitingCount} Waiting
              </span>
              <span className="text-slate-500">|</span>
              <span className="flex items-center text-[#14B8A6]">
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] mr-1.5" />
                {servingCount} Serving
              </span>
            </div>

            {/* Audio Voice Chime Toggle */}
            <button
              onClick={() => {
                const nextState = !audioEnabled;
                setAudioEnabled(nextState);
                if (nextState) {
                  soundEffects.playChime();
                }
              }}
              title={audioEnabled ? 'Audio chime is enabled (click to mute)' : 'Audio chime is muted (click to enable)'}
              className={`p-2 rounded-lg transition-colors border ${
                audioEnabled 
                  ? 'bg-[#14B8A6]/20 border-[#14B8A6]/50 text-[#14B8A6] hover:bg-[#14B8A6]/30' 
                  : 'bg-[#1E3D66] border-[#2A4870] text-slate-300 hover:text-white'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 rounded-lg bg-[#1E3D66] border border-[#2A4870] text-slate-200 hover:text-white transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#14B8A6] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-[#142B4A] rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-sm text-[#142B4A]">Notifications</span>
                    <span className="text-xs text-slate-500">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 mt-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`py-2 px-1 text-xs cursor-pointer hover:bg-slate-50 rounded transition-colors ${
                            !n.is_read ? 'font-medium bg-teal-50/50' : 'text-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[#142B4A] font-semibold">
                            <span>{n.title}</span>
                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />}
                          </div>
                          <p className="text-slate-500 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Account / Role Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-2 bg-[#1E3D66] hover:bg-[#2A4870] px-2.5 py-1.5 rounded-lg border border-[#2A4870] text-xs transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-[#14B8A6] flex items-center justify-center text-white font-bold text-[10px]">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-white leading-none">{currentUser?.name?.split(' ')[0] || 'User'}</div>
                  <div className="text-[10px] text-teal-300 capitalize">{currentUser?.role || 'Guest'}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-[#142B4A] rounded-xl shadow-2xl border border-slate-200 p-2 z-50">
                  <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Quick Role Switcher
                  </div>
                  <div className="space-y-1">
                    {demoUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          currentUser?.email === u.email
                            ? 'bg-teal-50 text-[#0F766E] font-bold'
                            : 'hover:bg-slate-100 text-[#142B4A]'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-[10px] text-slate-500 capitalize">{u.role} ({u.email})</div>
                        </div>
                        {currentUser?.email === u.email && <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        onSelectUser(null);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 font-medium"
                    >
                      Sign Out / Switch to Guest
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-[#1E3D66] text-xs overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center py-1 px-2 rounded-md ${
                  isActive ? 'text-[#14B8A6] font-bold' : 'text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
