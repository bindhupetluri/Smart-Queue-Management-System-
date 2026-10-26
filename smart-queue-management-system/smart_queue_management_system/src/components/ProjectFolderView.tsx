import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  Info,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Archive
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: string;
  description: string;
  category: 'frontend' | 'server' | 'python' | 'config' | 'doc';
  children?: FileItem[];
  contentPreview?: string;
}

const projectStructure: FileItem = {
  id: 'root',
  name: 'smart_queue_management_system',
  path: 'smart_queue_management_system/',
  type: 'directory',
  description: 'Main project root folder (zip extracted directory)',
  category: 'config',
  children: [
    {
      id: 'src',
      name: 'src',
      path: 'smart_queue_management_system/src/',
      type: 'directory',
      description: 'React 19 + TypeScript frontend application source',
      category: 'frontend',
      children: [
        {
          id: 'src-components',
          name: 'components',
          path: 'smart_queue_management_system/src/components/',
          type: 'directory',
          description: 'Modular UI components & interfaces',
          category: 'frontend',
          children: [
            {
              id: 'kiosk',
              name: 'CustomerKiosk.tsx',
              path: 'smart_queue_management_system/src/components/CustomerKiosk.tsx',
              type: 'file',
              size: '24 KB',
              description: 'Self-service digital token generation kiosk with department & service selection',
              category: 'frontend',
              contentPreview: `// CustomerKiosk.tsx - Digital Token Generation Kiosk
import React, { useState } from 'react';
import { Ticket, Users, Clock, AlertCircle } from 'lucide-react';

export const CustomerKiosk: React.FC<Props> = ({ departments, services, onTokenGenerated }) => {
  // Service selection, priority tagging, customer details
  // Issues digital token (e.g. A-101, B-102) with dynamic wait calculation
  ...
};`
            },
            {
              id: 'display',
              name: 'PublicDisplayBoard.tsx',
              path: 'smart_queue_management_system/src/components/PublicDisplayBoard.tsx',
              type: 'file',
              size: '14 KB',
              description: 'High-contrast Public TV waiting lobby display board with audio chimes & voice synthesis',
              category: 'frontend',
              contentPreview: `// PublicDisplayBoard.tsx - Public TV & Lobby Display Board
import React, { useState, useEffect } from 'react';
import { Tv, Volume2, BellRing } from 'lucide-react';

export const PublicDisplayBoard = ({ audioEnabled }) => {
  // Real-time token calling screen showing Current Serving & Upcoming Next
  // Features Web Audio chime and SpeechSynthesis vocal announcements
  ...
};`
            },
            {
              id: 'staff',
              name: 'StaffCounterConsole.tsx',
              path: 'smart_queue_management_system/src/components/StaffCounterConsole.tsx',
              type: 'file',
              size: '17 KB',
              description: 'Counter agent desk to call Next Token, recall, mark completed, or transfer',
              category: 'frontend',
              contentPreview: `// StaffCounterConsole.tsx - Staff Counter Station
import React, { useState, useEffect } from 'react';
import { UserCheck, PhoneCall, CheckCircle, ArrowRight } from 'lucide-react';

export const StaffCounterConsole = ({ counters, departments }) => {
  // Counter agent console to Call Next Token, Serve, Complete, or Transfer
  ...
};`
            },
            {
              id: 'admin',
              name: 'AdminDashboard.tsx',
              path: 'smart_queue_management_system/src/components/AdminDashboard.tsx',
              type: 'file',
              size: '29 KB',
              description: 'Admin operations, service management, audit trails, and shift reset',
              category: 'frontend',
              contentPreview: `// AdminDashboard.tsx - Operations & Counter Management
import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileSpreadsheet, RotateCcw } from 'lucide-react';

export const AdminDashboard = ({ departments, services, counters }) => {
  // Live token audit, counter statuses, export CSV, and shift reset
  ...
};`
            },
            {
              id: 'ticket',
              name: 'MyTicketView.tsx',
              path: 'smart_queue_management_system/src/components/MyTicketView.tsx',
              type: 'file',
              size: '18 KB',
              description: 'Live mobile/web ticket tracking with real-time queue position and countdown timer',
              category: 'frontend',
              contentPreview: `// MyTicketView.tsx - Customer Live Ticket Tracker
import React, { useState, useEffect } from 'react';
import { QrCode, Clock, Users, ArrowLeft } from 'lucide-react';

export const MyTicketView = ({ initialTokenNumber }) => {
  // Live position tracker, estimated arrival time, and QR code pass
  ...
};`
            },
            {
              id: 'navbar',
              name: 'Navbar.tsx',
              path: 'smart_queue_management_system/src/components/Navbar.tsx',
              type: 'file',
              size: '12 KB',
              description: 'Navy blue & teal navigation header with role switcher and real-time live stats',
              category: 'frontend',
              contentPreview: `// Navbar.tsx - System Header & Navigation
import React from 'react';
import { Ticket, Tv, UserCheck, ShieldCheck, Folder } from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab, currentUser }) => {
  // Navigation tabs with Navy Blue (#142B4A) and Teal (#14B8A6) theme
  ...
};`
            }
          ]
        },
        {
          id: 'app-tsx',
          name: 'App.tsx',
          path: 'smart_queue_management_system/src/App.tsx',
          type: 'file',
          size: '8 KB',
          description: 'Main React application root with view routing and master state management',
          category: 'frontend',
          contentPreview: `// App.tsx - Root Application Component
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerKiosk } from './components/CustomerKiosk';
...`
        },
        {
          id: 'types',
          name: 'types/queue.ts',
          path: 'smart_queue_management_system/src/types/queue.ts',
          type: 'file',
          size: '4 KB',
          description: 'TypeScript data contracts for Tokens, Counters, Departments, and Logs',
          category: 'frontend',
          contentPreview: `// queue.ts - Type Definitions
export interface QueueToken {
  id: number;
  token_number: string;
  department_id: number;
  service_id: number;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  counter_id?: number;
  estimated_wait_mins: number;
  created_at: string;
}`
        },
        {
          id: 'audio',
          name: 'utils/audio.ts',
          path: 'smart_queue_management_system/src/utils/audio.ts',
          type: 'file',
          size: '3 KB',
          description: 'Web Audio API synthesizer chimes and SpeechSynthesis vocal calling module',
          category: 'frontend'
        }
      ]
    },
    {
      id: 'server',
      name: 'server',
      path: 'smart_queue_management_system/server/',
      type: 'directory',
      description: 'Node.js Express + SQLite API engine',
      category: 'server',
      children: [
        {
          id: 'server-routes',
          name: 'routes.ts',
          path: 'smart_queue_management_system/server/routes.ts',
          type: 'file',
          size: '32 KB',
          description: 'RESTful API endpoints for tokens, counter assignments, wait time estimation, and CSV export',
          category: 'server',
          contentPreview: `// routes.ts - Express REST Endpoints
router.post('/tokens/generate', async (req, res) => { ... });
router.get('/tokens/active', async (req, res) => { ... });
router.post('/counters/call-next', async (req, res) => { ... });
router.get('/download-zip', (req, res) => { ... });`
        },
        {
          id: 'server-db',
          name: 'db.ts',
          path: 'smart_queue_management_system/server/db.ts',
          type: 'file',
          size: '12 KB',
          description: 'SQLite database connection, schema migrations, and sample hospital/bank data seed',
          category: 'server'
        }
      ]
    },
    {
      id: 'backend',
      name: 'backend',
      path: 'smart_queue_management_system/backend/',
      type: 'directory',
      description: 'Python Flask + SQLite standalone REST API (Alternative Python backend)',
      category: 'python',
      children: [
        {
          id: 'py-app',
          name: 'app.py',
          path: 'smart_queue_management_system/backend/app.py',
          type: 'file',
          size: '8 KB',
          description: 'Python Flask entrypoint with CORS, blueprint routing, and error handling',
          category: 'python',
          contentPreview: `# backend/app.py - Flask REST API Entrypoint
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import init_db
from queue_service import QueueService

app = Flask(__name__)
CORS(app)

@app.route('/api/tokens', methods=['GET', 'POST'])
def handle_tokens():
    ...`
        },
        {
          id: 'py-queue',
          name: 'queue_service.py',
          path: 'smart_queue_management_system/backend/queue_service.py',
          type: 'file',
          size: '8 KB',
          description: 'Queue management logic, sequential token generator, and counter caller',
          category: 'python'
        },
        {
          id: 'py-analytics',
          name: 'analytics.py',
          path: 'smart_queue_management_system/backend/analytics.py',
          type: 'file',
          size: '4 KB',
          description: 'Pandas & NumPy waiting-time estimation engine with multi-factor congestion algorithms',
          category: 'python'
        },
        {
          id: 'py-db',
          name: 'database.py',
          path: 'smart_queue_management_system/backend/database.py',
          type: 'file',
          size: '9 KB',
          description: 'Python SQLite schema initialization with foreign key constraints',
          category: 'python'
        },
        {
          id: 'py-test',
          name: 'test_queue.py',
          path: 'smart_queue_management_system/backend/test_queue.py',
          type: 'file',
          size: '3 KB',
          description: 'Automated Python unit tests for token generation and queue processing',
          category: 'python'
        }
      ]
    },
    {
      id: 'package-json',
      name: 'package.json',
      path: 'smart_queue_management_system/package.json',
      type: 'file',
      size: '1.2 KB',
      description: 'NPM package configuration, scripts (dev, build, start), and dependencies',
      category: 'config'
    },
    {
      id: 'server-ts',
      name: 'server.ts',
      path: 'smart_queue_management_system/server.ts',
      type: 'file',
      size: '1.5 KB',
      description: 'Unified Express + Vite server entrypoint',
      category: 'server'
    },
    {
      id: 'readme',
      name: 'README.md',
      path: 'smart_queue_management_system/README.md',
      type: 'file',
      size: '5.6 KB',
      description: 'Complete documentation, architecture diagram, installation steps, and API guide',
      category: 'doc'
    },
    {
      id: 'requirements',
      name: 'requirements.txt',
      path: 'smart_queue_management_system/requirements.txt',
      type: 'file',
      size: '120 B',
      description: 'Python dependencies (Flask, pandas, numpy, flask-cors)',
      category: 'python'
    },
    {
      id: 'vite-config',
      name: 'vite.config.ts',
      path: 'smart_queue_management_system/vite.config.ts',
      type: 'file',
      size: '700 B',
      description: 'Vite build tool configuration and Tailwind CSS setup',
      category: 'config'
    }
  ]
};

export const ProjectFolderView: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<FileItem>(projectStructure);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'root': true,
    'src': true,
    'src-components': true,
    'server': true,
    'backend': true
  });
  const [copied, setCopied] = useState(false);

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderTree = (item: FileItem, depth: number = 0) => {
    const isDir = item.type === 'directory';
    const isExpanded = expandedFolders[item.id];
    const isSelected = selectedItem.id === item.id;

    return (
      <div key={item.id} className="select-none">
        <div
          onClick={() => {
            setSelectedItem(item);
            if (isDir) {
              setExpandedFolders(prev => ({ ...prev, [item.id]: !prev[item.id] }));
            }
          }}
          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
            isSelected 
              ? 'bg-[#142B4A] text-white font-semibold' 
              : 'hover:bg-slate-100 text-[#142B4A]'
          }`}
          style={{ paddingLeft: `${depth * 16 + 10}px` }}
        >
          {isDir ? (
            <>
              <button 
                onClick={(e) => toggleFolder(item.id, e)} 
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" />
              {item.name.endsWith('.tsx') || item.name.endsWith('.ts') ? (
                <FileCode className="w-4 h-4 text-[#14B8A6] shrink-0" />
              ) : item.name.endsWith('.py') ? (
                <FileCode className="w-4 h-4 text-sky-500 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </>
          )}

          <span className="truncate">{item.name}</span>

          {item.size && (
            <span className={`text-[10px] ml-auto shrink-0 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
              {item.size}
            </span>
          )}
        </div>

        {isDir && isExpanded && item.children && (
          <div className="space-y-0.5">
            {item.children.map(child => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title & Download Banner */}
      <div className="bg-gradient-to-r from-[#142B4A] to-[#1E3D66] rounded-2xl p-6 text-white shadow-xl mb-8 border border-teal-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#14B8A6]/20 border border-[#14B8A6]/40 text-[#14B8A6] text-xs font-bold uppercase tracking-wider">
              <Archive className="w-3.5 h-3.5" />
              <span>ప్రాజెక్ట్ ఫోల్డర్ ప్యాకేజ్ (Project Folder Archive)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Smart Queue Management System
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              మీ ప్రాజెక్ట్ ఫైళ్ళన్నీ <strong>'smart_queue_management_system'</strong> అనే మెయిన్ ఫోల్డర్ లో ఒకే చోట చక్కగా అమర్చబడ్డాయి. ఈ జిప్ (ZIP) ఫైల్ ను డౌన్లోడ్ చేసి Extract చేస్తే నేరుగా ఫోల్డర్ రూపంలో మీ కంప్యూటర్ లో లభిస్తుంది.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href="/api/download-zip"
              download="smart_queue_management_system.zip"
              className="px-6 py-3.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>ఫోల్డర్ జిప్ డౌన్లోడ్ (Download ZIP)</span>
            </a>
          </div>
        </div>

        {/* Folder Highlights & Telugu Instructions */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start space-x-2.5 bg-white/5 rounded-xl p-3 border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">ఏకీకృత రూట్ ఫోల్డర్ (Root Folder)</p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Extract చేసినప్పుడు విడివిడి ఫైల్స్ కాకుండా <code className="bg-[#142B4A] px-1 py-0.5 rounded text-teal-300">smart_queue_management_system/</code> అనే ఫోల్డర్ లోపలే అన్నీ ఉంటాయి.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 bg-white/5 rounded-xl p-3 border border-white/5">
            <Terminal className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">రెండు బ్యాకెండ్ ఆప్షన్లు (2 Backends)</p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Node.js Express backend (<code className="text-teal-300">server/</code>) మరియు Python Flask API (<code className="text-teal-300">backend/</code>) రెండూ సిద్ధంగా ఉన్నాయి.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 bg-white/5 rounded-xl p-3 border border-white/5">
            <Layers className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">పూర్తి ప్రాజెక్ట్ సోర్స్ కోడ్</p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                React 19, SQLite డేటాబేస్, డిపార్ట్మెంట్ కియోస్క్, టీవీ లైవ్ బోర్డ్, స్టాఫ్ కౌంటర్ డెస్క్ అన్నీ ఉన్నాయి.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer + Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Tree Explorer */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-[#142B4A]" />
              <h2 className="font-bold text-sm text-[#142B4A]">ప్రాజెక్ట్ ఫోల్డర్ ట్రీ (Folder Structure)</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">28 Files · 4 Dirs</span>
          </div>

          <p className="text-[11px] text-slate-500 mb-3">
            క్రింది ఫోల్డర్లను క్లిక్ చేసి ఫైల్స్ వివరాలు, సైజు మరియు కోడ్ ప్రివ్యూ చూడండి:
          </p>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
            {renderTree(projectStructure)}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Archive size: ~60 KB</span>
            <a
              href="/api/download-zip"
              download="smart_queue_management_system.zip"
              className="text-[#14B8A6] hover:text-[#0D9488] font-bold flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>డౌన్లోడ్ .ZIP</span>
            </a>
          </div>
        </div>

        {/* Right Column: File Details & Preview */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-slate-100 text-[#142B4A]">
                {selectedItem.type === 'directory' ? (
                  <Folder className="w-5 h-5 text-amber-500" />
                ) : (
                  <FileCode className="w-5 h-5 text-[#14B8A6]" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-[#142B4A]">{selectedItem.name}</h3>
                <p className="text-xs font-mono text-slate-400">{selectedItem.path}</p>
              </div>
            </div>

            {selectedItem.contentPreview && (
              <button
                onClick={() => handleCopyCode(selectedItem.contentPreview!)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            )}
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">వివరణ (Description)</h4>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {selectedItem.description}
            </p>
          </div>

          {selectedItem.type === 'directory' ? (
            <div className="flex-1 flex flex-col">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">ఫోల్డర్ లోని అంశాలు (Contents)</h4>
              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                {selectedItem.children && selectedItem.children.length > 0 ? (
                  selectedItem.children.map(child => (
                    <div
                      key={child.id}
                      onClick={() => setSelectedItem(child)}
                      className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 hover:border-[#14B8A6] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        {child.type === 'directory' ? (
                          <Folder className="w-4 h-4 text-amber-500" />
                        ) : (
                          <FileCode className="w-4 h-4 text-[#14B8A6]" />
                        )}
                        <span className="text-xs font-mono font-bold text-[#142B4A]">{child.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{child.size || 'dir'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No files in directory.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">కోడ్ స్నిప్పెట్ ప్రివ్యూ (Code Preview)</h4>
              <div className="flex-1 bg-[#142B4A] text-slate-200 p-4 rounded-xl font-mono text-xs overflow-y-auto shadow-inner leading-relaxed border border-slate-800">
                <pre>{selectedItem.contentPreview || `// File: ${selectedItem.path}\n// Standard production component for Smart Queue Management System.`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Setup Instructions in Telugu & English */}
      <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-base text-[#142B4A] mb-3 flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-[#14B8A6]" />
          <span>జిప్ డౌన్లోడ్ చేశాక రన్ చేసే విధానం (How to Run after Extraction)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-[#142B4A] text-sm flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#14B8A6]"></span>
              <span>Option 1: Full-Stack React + Node.js (Recommended)</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
              <li>జిప్ ఫైల్ ను Extract చేయండి: <code className="bg-slate-200 px-1 py-0.5 rounded text-[#142B4A]">smart_queue_management_system</code> ఫోల్డర్ వస్తుంది.</li>
              <li>టర్మినల్ లో ఫోల్డర్ లోకి వెళ్ళండి: <code className="bg-slate-200 px-1 py-0.5 rounded text-[#142B4A]">cd smart_queue_management_system</code></li>
              <li>డిపెండెన్సీలను ఇన్స్టాల్ చేయండి: <code className="bg-slate-200 px-1 py-0.5 rounded text-[#142B4A]">npm install</code></li>
              <li>సర్వర్ రన్ చేయండి: <code className="bg-slate-200 px-1 py-0.5 rounded text-[#142B4A]">npm run dev</code></li>
              <li>బ్రౌజర్ లో <code className="text-[#14B8A6] font-bold">http://localhost:3000</code> ఓపెన్ చేయండి.</li>
            </ol>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-[#142B4A] text-sm flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#142B4A]"></span>
              <span>Option 2: Standalone Python Flask API</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
              <li>ఫోల్డర్ లోని backend డైరెక్టరీకి వెళ్ళండి: <code className="bg-slate-200 px-1 py-0.5 rounded text-[#142B4A]">cd backend</code></li>
              <li>పైథాన్ ప్యాకేజీలు ఇన్స్టాల్ చేయండి: <code className="bg-slate-200 px-1 py-0.5 rounded text-[#142B4A]">pip install -r ../requirements.txt</code></li>
              <li>పైథాన్ ఫ్లాస్క్ యాప్ ప్రారంభించండి: <code className="bg-slate-200 px-1 py-0.5 rounded text-[#142B4A]">python app.py</code></li>
              <li>యూనిట్ టెస్టులు రన్ చేయడానికి: <code className="bg-slate-200 px-1 py-0.5 rounded text-[#142B4A]">python test_queue.py</code></li>
              <li>ఫ్లాస్క్ API <code className="text-[#14B8A6] font-bold">http://localhost:5000/api</code> లో అందుబాటులో ఉంటుంది.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
