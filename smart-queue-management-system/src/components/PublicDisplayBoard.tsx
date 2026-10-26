import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Clock, 
  Users, 
  CheckCircle2
} from 'lucide-react';
import { DisplayFeedData } from '../types/queue';
import { soundEffects } from '../utils/audio';

interface PublicDisplayBoardProps {
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
}

export const PublicDisplayBoard: React.FC<PublicDisplayBoardProps> = ({
  audioEnabled,
  setAudioEnabled,
}) => {
  const [feed, setFeed] = useState<DisplayFeedData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [lastCalledTokenId, setLastCalledTokenId] = useState<number | null>(null);

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live display feed
  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/display-feed');
      const data: DisplayFeedData = await res.json();
      
      // Check if a new token was called to announce it
      if (data.serving && data.serving.length > 0) {
        const newest = data.serving[0];
        if (lastCalledTokenId !== null && newest.id !== lastCalledTokenId) {
          if (audioEnabled) {
            soundEffects.speakToken(newest.token_number, newest.counter_number);
          }
        }
        setLastCalledTokenId(newest.id);
      }

      setFeed(data);
    } catch (err) {
      console.warn('Failed to fetch display feed:', err);
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 3500); // 3.5s live polling
    return () => clearInterval(interval);
  }, [audioEnabled, lastCalledTokenId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 5 Counter slots (fill with serving data or show Open/Ready)
  const counters = [1, 2, 3, 4, 5].map((counterNum) => {
    const activeServing = feed?.serving.find((s) => s.counter_number === counterNum);
    return {
      counterNum,
      serving: activeServing || null,
    };
  });

  return (
    <div className="min-h-screen bg-[#0E1E34] text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between selection:bg-[#14B8A6] selection:text-white">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-[#1E3D66] gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#14B8A6] flex items-center justify-center font-black text-xl shadow-lg shadow-teal-500/25 text-[#142B4A]">
            QS
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                ST. JUDE CIVIC & HEALTHCARE CENTER
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30 text-xs font-bold uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] mr-1.5 animate-pulse" />
                Live Kiosk
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Central Digital Triage & Public Queue Board · Please proceed to your counter when called
            </p>
          </div>
        </div>

        {/* Date, Clock & Screen Controls */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#14B8A6] tracking-wider">
              {currentTime}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {currentDate}
            </div>
          </div>

          <div className="flex items-center space-x-2 border-l border-[#1E3D66] pl-4">
            <button
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                if (next) soundEffects.playChime();
              }}
              title={audioEnabled ? 'Audio chime on' : 'Audio chime off'}
              className={`p-2.5 rounded-xl border transition-all ${
                audioEnabled
                  ? 'bg-[#14B8A6]/20 border-[#14B8A6]/50 text-[#14B8A6]'
                  : 'bg-[#142B4A] border-[#1E3D66] text-slate-400 hover:text-slate-200'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen TV Mode"
              className="p-2.5 rounded-xl bg-[#142B4A] hover:bg-[#1E3D66] border border-[#1E3D66] text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Public Counters Display Grid */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#14B8A6] animate-ping" />
            <h2 className="text-lg font-extrabold tracking-wider uppercase text-slate-200">
              Now Serving Counters
            </h2>
          </div>
          <span className="text-xs text-slate-400">Audio chime rings when updated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {counters.map(({ counterNum, serving }) => {
            const isJustCalled = serving && serving.id === lastCalledTokenId;
            return (
              <div
                key={counterNum}
                className={`relative rounded-2xl p-5 border text-center transition-all flex flex-col justify-between min-h-[220px] ${
                  serving
                    ? isJustCalled
                      ? 'bg-[#142B4A] border-[#14B8A6] shadow-2xl shadow-teal-500/30 animate-glow'
                      : 'bg-[#142B4A]/90 border-[#1E3D66] shadow-lg'
                    : 'bg-[#142B4A]/40 border-[#1E3D66]/60 opacity-80'
                }`}
              >
                {/* Counter Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1E3D66]">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                    Counter {counterNum}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    serving ? 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30' : 'bg-[#0E1E34] text-slate-400'
                  }`}>
                    {serving ? 'Active' : 'Ready'}
                  </span>
                </div>

                {/* Main Large Token Number */}
                <div className="my-4">
                  {serving ? (
                    <>
                      <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-white drop-shadow-md">
                        {serving.token_number}
                      </div>
                      <div className="text-xs text-teal-300 font-semibold truncate mt-2">
                        {serving.customer_name}
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-slate-500 font-mono text-xl uppercase tracking-widest font-semibold">
                      Waiting for Next
                    </div>
                  )}
                </div>

                {/* Department Info Footer */}
                <div className="pt-3 border-t border-[#1E3D66] text-[11px] text-slate-300 truncate">
                  {serving ? (
                    <span className="text-slate-200 font-medium">
                      {serving.department_name}
                    </span>
                  ) : (
                    <span>Station Available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lower Section: Next in Line & Recently Completed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next in Line (Waiting List) */}
        <div className="lg:col-span-2 bg-[#142B4A]/80 rounded-2xl p-5 border border-[#1E3D66] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                Upcoming Tokens in Queue
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {feed?.upcoming?.length || 0} waiting next
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {(!feed?.upcoming || feed.upcoming.length === 0) ? (
              <div className="col-span-4 text-center py-8 text-xs text-slate-400">
                Queue is clear. No waiting customers.
              </div>
            ) : (
              feed.upcoming.map((token, idx) => (
                <div
                  key={token.id}
                  className="bg-[#0E1E34]/80 p-3 rounded-xl border border-[#1E3D66] flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-black text-white">{token.token_number}</span>
                    <span className="text-[10px] font-bold text-teal-300 bg-[#1E3D66] px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-200 font-medium truncate mt-1">
                    {token.customer_name}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#1E3D66] flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{token.department_code}</span>
                    <span className="text-amber-400 font-semibold font-mono">~{token.estimated_wait_mins}m</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Completed */}
        <div className="bg-[#142B4A]/80 rounded-2xl p-5 border border-[#1E3D66] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#14B8A6]" />
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                  Recently Served
                </h3>
              </div>
              <span className="text-xs text-slate-400">Last completed</span>
            </div>

            <div className="space-y-2">
              {(!feed?.recentlyCompleted || feed.recentlyCompleted.length === 0) ? (
                <p className="text-xs text-slate-400 py-6 text-center">No completed tokens yet today</p>
              ) : (
                feed.recentlyCompleted.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 px-3 bg-[#0E1E34]/70 rounded-xl border border-[#1E3D66] text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-200">{t.token_number}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 truncate max-w-[120px]">{t.department_name}</span>
                    </div>
                    <span className="text-[10px] text-[#14B8A6] font-mono">
                      Done ({t.service_duration_mins || 8}m)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E3D66] text-center">
            <span className="text-[11px] text-slate-400">
              Screen updates automatically every 3.5 seconds
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
