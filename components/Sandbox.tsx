
import React, { useState, useEffect, useRef } from 'react';
import { Job, JobStatus } from '../types';
import { 
  Terminal as TerminalIcon, 
  FileCode, 
  Folder, 
  RefreshCw, 
  Cpu, 
  Server, 
  Shield, 
  Maximize2, 
  Box,
  ChevronRight,
  ChevronDown,
  Activity,
  CheckCircle2,
  XCircle,
  Database,
  Table,
  Info,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Play,
  Settings
} from 'lucide-react';

interface SandboxProps {
  activeJob?: Job;
}

// Lightweight Syntax Highlighter Component
const CodeEditor: React.FC<{ code: string; fileName: string }> = ({ code, fileName }) => {
  const isJson = fileName.endsWith('.json');
  
  const highlight = (text: string) => {
    if (isJson) {
      return text.replace(/(".*?")(:)/g, '<span class="text-blue-400">$1</span>$2')
                 .replace(/: (".*?")/g, ': <span class="text-orange-400">$1</span>')
                 .replace(/\b(true|false|null)\b/g, '<span class="text-purple-400">$1</span>')
                 .replace(/\b(\d+)\b/g, '<span class="text-green-400">$1</span>');
    }
    // Basic TS/JS highlighting
    return text
      .replace(/\b(import|export|const|let|var|function|return|if|else|async|await)\b/g, '<span class="text-purple-400">$1</span>')
      .replace(/\b(from)\b/g, '<span class="text-purple-400">$1</span>')
      .replace(/('.*?')/g, '<span class="text-green-400">$1</span>')
      .replace(/(".*?")/g, '<span class="text-green-400">$1</span>')
      .replace(/\b(console|log|JSON|Math|window|document)\b/g, '<span class="text-yellow-300">$1</span>')
      .replace(/(\/\/.*)/g, '<span class="text-gray-500">$1</span>');
  };

  return (
    <pre className="text-sm font-mono leading-relaxed p-4 h-full overflow-auto custom-scrollbar">
      <code dangerouslySetInnerHTML={{ __html: code.split('\n').map((line, i) => (
         `<div class="flex"><span class="w-8 text-gray-700 text-right mr-4 select-none shrink-0">${i+1}</span><span>${highlight(line)}</span></div>`
      )).join('') }} />
    </pre>
  );
};

const Sandbox: React.FC<SandboxProps> = ({ activeJob }) => {
  const [activeView, setActiveView] = useState<'files' | 'database'>('files');
  const [bottomTab, setBottomTab] = useState<'terminal' | 'output' | 'problems' | 'env'>('terminal');
  const [showEnv, setShowEnv] = useState(false);
  
  // Dynamic Stats
  const [cpu, setCpu] = useState(12);
  const [ram, setRam] = useState(1.2);
  
  // Terminal
  const [terminalLines, setTerminalLines] = useState<{id: string, text: string, type: 'info'|'cmd'|'error'|'success'|'step'}[]>([
    { id: '0', text: 'Initializing protected container environment...', type: 'info' },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  // File System
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'src': true });
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Dynamic Stats Effect
  useEffect(() => {
    const interval = setInterval(() => {
       setCpu(Math.floor(Math.random() * 30) + 15); // 15-45%
       setRam(prev => parseFloat((1.2 + Math.random() * 0.2).toFixed(2))); // 1.2 - 1.4GB
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Boot Sequence & Log Simulation
  useEffect(() => {
    // Initial Boot Logs
    const bootSequence = [
      { text: 'Allocate resources: 2 vCPU, 4GB RAM', type: 'info' },
      { text: 'Pulling image nexus-runner:latest...', type: 'info' },
      { text: 'Verifying docker socket connection...', type: 'info' },
      { text: 'Mounting volume /workspace/repo...', type: 'info' },
      { text: 'Network interface eth0 up (172.17.0.2)', type: 'info' },
      { text: 'Environment ready.', type: 'success' },
    ];

    if (activeJob) {
       setTerminalLines([{ id: 'init', text: 'Booting Sandbox...', type: 'info'}]);
       let delay = 500;
       
       bootSequence.forEach((log, i) => {
          setTimeout(() => {
             setTerminalLines(prev => [...prev, { id: `boot-${i}`, text: log.text, type: log.type as any }]);
          }, delay);
          delay += 600;
       });

       // Sync with Active Job Logs
       setTimeout(() => {
          if (activeJob.status === JobStatus.RUNNING) {
             setTerminalLines(prev => [...prev, { id: 'cmd-start', text: `nexus run --context ${activeJob.id}`, type: 'cmd' }]);
          }
       }, delay + 500);
    }
  }, [activeJob?.id]);

  // Sync Logs Real-time
  useEffect(() => {
    if (!activeJob) return;
    const lastLog = activeJob.logs[activeJob.logs.length - 1];
    
    if (lastLog) {
       setTerminalLines(prev => {
          if (prev.some(l => l.text.includes(lastLog.message))) return prev;
          
          let type: 'info'|'error'|'success'|'step' = 'info';
          if (lastLog.level === 'error') type = 'error';
          if (lastLog.level === 'success') type = 'success';
          if (lastLog.message.includes('Step')) type = 'step';

          return [...prev, { id: lastLog.id, text: lastLog.message, type }];
       });
       
       // Simulate AI typing a command if log indicates action
       if (lastLog.message.includes('Running')) {
          setCurrentCommand(`./run_tests.sh --scope=${activeJob.branch}`);
          setTimeout(() => setCurrentCommand(''), 1500);
       }
    }
  }, [activeJob?.logs]);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => {
     if (activeJob?.simulatedFileContent) {
        setSelectedFile(activeJob.simulatedFileContent.fileName);
     }
  }, [activeJob]);

  const getFileContent = () => {
     if (!selectedFile) return '// Select a file to view content';
     if (activeJob?.simulatedFileContent && selectedFile === activeJob.simulatedFileContent.fileName) {
        return activeJob.simulatedFileContent.content;
     }
     if (selectedFile === 'package.json') {
        return JSON.stringify({
           name: activeJob?.repo.split('/')[1] || 'app',
           version: "1.0.0",
           dependencies: {
              "react": "^18.2.0",
              "typescript": "^5.0.0",
              "prisma": "^5.2.0"
           }
        }, null, 2);
     }
     return '// File content not available in preview';
  };

  const getProblems = () => {
     if (!activeJob) return [];
     if (activeJob.type === 'BUG_FIX') {
        return [
           { file: 'src/utils.ts', line: 14, col: 5, message: "Object is possibly 'null'.", type: 'error' },
           { file: 'src/auth.ts', line: 42, col: 12, message: "'token' is declared but its value is never read.", type: 'warn' }
        ];
     }
     return [];
  };

  if (!activeJob) {
     return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-400">
           <Box size={64} className="mb-4 text-gray-300" />
           <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Sandbox</h3>
           <p className="max-w-md text-center text-sm">Select a running workflow to attach the sandbox debugger.</p>
        </div>
     );
  }

  const dbContext = activeJob.databaseContext;

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm relative overflow-hidden">
      
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#333] shadow-sm z-10 shrink-0">
         <div className="flex items-center gap-4">
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full border ${
               activeJob.status === JobStatus.RUNNING 
               ? 'bg-green-900/20 border-green-800 text-green-400' 
               : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}>
               <div className="relative flex items-center justify-center w-2.5 h-2.5">
                  <div className={`absolute w-full h-full rounded-full ${activeJob.status === JobStatus.RUNNING ? 'bg-green-500 animate-ping opacity-75' : 'bg-gray-500'}`} />
                  <div className={`relative w-2 h-2 rounded-full ${activeJob.status === JobStatus.RUNNING ? 'bg-green-500' : 'bg-gray-500'}`} />
               </div>
               <span className="text-xs font-bold tracking-wider">
                  {activeJob.status === JobStatus.RUNNING ? 'RUNNING (8f2a1c)' : 'STOPPED'}
               </span>
            </div>

            <div className="h-4 w-px bg-gray-700" />
            
            {/* Protected Env Tooltip */}
            <div className="group relative flex items-center gap-1.5 text-xs text-gray-400 cursor-help">
               <Shield size={12} className="text-blue-400" /> 
               <span>Protected Environment</span>
               <div className="absolute left-0 top-6 w-64 p-2 bg-gray-900 border border-gray-700 rounded shadow-xl text-xs text-gray-300 hidden group-hover:block z-50">
                  This sandbox is network-isolated. External access is blocked except for whitelisted repositories.
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-6 text-xs font-mono">
            {/* AI Activity Orb */}
            {activeJob.status === JobStatus.RUNNING && (
               <div className="flex items-center gap-2 text-purple-300 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/30">
                  <Activity size={12} className="animate-spin" />
                  <span>AI Agent Active</span>
               </div>
            )}

            <div className="flex items-center gap-2">
               <Cpu size={14} className="text-blue-400" />
               <span className="w-16">CPU: {cpu}%</span>
            </div>
            <div className="flex items-center gap-2">
               <Server size={14} className="text-orange-400" />
               <span className="w-24">RAM: {ram}GB</span>
            </div>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         {/* LEFT SIDEBAR: NAVIGATION */}
         <div className="w-64 bg-[#252526] border-r border-[#333] flex flex-col shrink-0">
            <div className="flex items-center px-2 py-2 border-b border-[#333] gap-1">
               <button 
                  onClick={() => setActiveView('files')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-colors ${activeView === 'files' ? 'bg-[#37373d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
               >
                  <FileCode size={14} /> Files
               </button>
               <button 
                  onClick={() => setActiveView('database')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-colors ${activeView === 'database' ? 'bg-[#37373d] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
               >
                  <Database size={14} /> Database
               </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-2">
               {activeView === 'files' ? (
                  <div className="space-y-1">
                     <div className="text-xs font-bold text-gray-500 uppercase px-2 mb-2 pt-2">Explorer</div>
                     {/* Mock File Tree */}
                     <div className="pl-1">
                        <div className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#2a2d2e] rounded cursor-pointer text-gray-300" onClick={() => setExpandedFolders(p => ({...p, src: !p.src}))}>
                           {expandedFolders['src'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                           <Folder size={14} className="text-blue-400" />
                           <span>src</span>
                        </div>
                        {expandedFolders['src'] && (
                           <div className="pl-6 space-y-1 border-l border-gray-700 ml-2.5">
                              {activeJob.simulatedFileContent && (
                                 <div 
                                    className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer ${selectedFile === activeJob.simulatedFileContent.fileName ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e] text-gray-400'}`}
                                    onClick={() => setSelectedFile(activeJob.simulatedFileContent!.fileName)}
                                 >
                                    <FileCode size={13} className="text-yellow-400" />
                                    <span>{activeJob.simulatedFileContent.fileName.split('/').pop()}</span>
                                 </div>
                              )}
                              <div className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#2a2d2e] rounded cursor-pointer text-gray-400">
                                 <FileCode size={13} className="text-blue-400" />
                                 <span>utils.ts</span>
                              </div>
                           </div>
                        )}
                        <div className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#2a2d2e] rounded cursor-pointer text-gray-400 mt-1">
                           <FileCode size={14} className="text-red-400" />
                           <span onClick={() => setSelectedFile('package.json')}>package.json</span>
                        </div>
                        <div className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#2a2d2e] rounded cursor-pointer text-gray-400">
                           <Settings size={14} className="text-gray-400" />
                           <span>.env</span>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {dbContext ? (
                        <>
                           <div className="bg-[#1e1e1e] p-3 rounded border border-[#333]">
                              <div className="text-xs text-gray-500 mb-1">Status</div>
                              <div className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${dbContext.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                                 <span className="capitalize text-white font-medium">{dbContext.status}</span>
                              </div>
                           </div>
                           
                           <div>
                              <div className="text-xs font-bold text-gray-500 uppercase px-2 mb-2">Tables</div>
                              <div className="space-y-1">
                                 {dbContext.tables?.map(table => (
                                    <div key={table.name} className="flex items-center gap-2 py-1 px-2 hover:bg-[#2a2d2e] rounded cursor-pointer text-gray-300">
                                       <Table size={14} className="text-blue-400" />
                                       <span>{table.name}</span>
                                    </div>
                                 ))}
                                 {(!dbContext.tables || dbContext.tables.length === 0) && (
                                    <div className="px-2 text-gray-500 italic">No tables found</div>
                                 )}
                              </div>
                           </div>
                        </>
                     ) : (
                        <div className="p-4 text-center text-gray-500">
                           <Database size={24} className="mx-auto mb-2 opacity-50" />
                           <p>No active database in this sandbox.</p>
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>

         {/* MAIN EDITOR AREA */}
         <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
             {/* Top Content (Code or DB View) */}
             <div className="flex-1 overflow-hidden relative">
                {activeView === 'files' ? (
                   selectedFile ? (
                      <div className="h-full flex flex-col">
                         <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333] text-xs">
                            <span className="text-gray-300">{selectedFile}</span>
                            <span className="text-gray-500">TypeScript</span>
                         </div>
                         <div className="flex-1 overflow-hidden">
                             <CodeEditor code={getFileContent()} fileName={selectedFile} />
                         </div>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-600">
                         <FileCode size={48} className="mb-4 opacity-20" />
                         <p>Select a file to view code</p>
                      </div>
                   )
                ) : (
                   <div className="h-full p-6 overflow-auto">
                      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                         <Database size={18} className="text-blue-400" /> 
                         Ephemeral Database (Postgres 15)
                      </h3>
                      
                      {dbContext ? (
                         <div className="space-y-6">
                            <div className="bg-[#252526] border border-[#333] rounded-lg p-4">
                               <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Connection String</div>
                               <div className="flex items-center gap-2 bg-black rounded p-2 font-mono text-xs text-green-400 border border-gray-800">
                                  <span className="flex-1">{dbContext.connectionString || 'Wait for provision...'}</span>
                                  <button className="text-gray-500 hover:text-white"><RefreshCw size={12} /></button>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               {dbContext.tables?.map(table => (
                                  <div key={table.name} className="bg-[#252526] border border-[#333] rounded-lg overflow-hidden">
                                     <div className="bg-[#333] px-3 py-2 text-sm font-medium text-white border-b border-[#444] flex items-center justify-between">
                                        {table.name}
                                        <span className="text-xs text-gray-500">{table.columns.length} cols</span>
                                     </div>
                                     <div className="p-2 space-y-1">
                                        {table.columns.map(col => (
                                           <div key={col.name} className="flex justify-between text-xs px-2 py-1">
                                              <span className="text-blue-300">{col.name}</span>
                                              <span className="text-gray-500">{col.type}</span>
                                           </div>
                                        ))}
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      ) : (
                         <div className="text-gray-500">Database not initialized for this task.</div>
                      )}
                   </div>
                )}
             </div>

             {/* BOTTOM PANEL */}
             <div className="h-64 border-t border-[#333] bg-[#1e1e1e] flex flex-col shrink-0">
                {/* Tabs */}
                <div className="flex items-center bg-[#252526] border-b border-[#333]">
                   <button 
                      onClick={() => setBottomTab('terminal')}
                      className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-r border-[#333] transition-colors ${bottomTab === 'terminal' ? 'bg-[#1e1e1e] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                      <TerminalIcon size={12} /> Terminal
                   </button>
                   <button 
                      onClick={() => setBottomTab('output')}
                      className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-r border-[#333] transition-colors ${bottomTab === 'output' ? 'bg-[#1e1e1e] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                      <Info size={12} /> Output
                   </button>
                   <button 
                      onClick={() => setBottomTab('problems')}
                      className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-r border-[#333] transition-colors ${bottomTab === 'problems' ? 'bg-[#1e1e1e] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                      <AlertTriangle size={12} /> Problems <span className="bg-blue-600 text-white px-1.5 rounded-full text-[10px]">{getProblems().length}</span>
                   </button>
                   <button 
                      onClick={() => setBottomTab('env')}
                      className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-r border-[#333] transition-colors ${bottomTab === 'env' ? 'bg-[#1e1e1e] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                      <Lock size={12} /> Env
                   </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                   {bottomTab === 'terminal' && (
                      <div className="font-mono text-xs space-y-1">
                         {terminalLines.map((line, idx) => (
                            <div key={line.id || idx} className="flex gap-2">
                               <span className="text-gray-600 select-none">$</span>
                               <span className={`${
                                  line.type === 'error' ? 'text-red-400' :
                                  line.type === 'success' ? 'text-green-400' :
                                  line.type === 'cmd' ? 'text-yellow-300' :
                                  line.type === 'step' ? 'text-blue-300 font-bold' :
                                  'text-gray-300'
                               }`}>
                                  {line.text}
                               </span>
                            </div>
                         ))}
                         <div className="flex gap-2 items-center mt-2 animate-pulse">
                            <span className="text-green-500">➜</span>
                            <span className="text-cyan-400">~/workspace/repo</span>
                            <span className="text-gray-500">git:(</span>
                            <span className="text-red-400">{activeJob.branch}</span>
                            <span className="text-gray-500">)</span>
                            <span className="text-gray-200">{currentCommand}</span>
                            <span className="w-2 h-4 bg-gray-500 block"></span>
                         </div>
                         <div ref={terminalEndRef} />
                      </div>
                   )}

                   {bottomTab === 'output' && (
                      <div className="text-gray-300 font-mono text-xs">
                         {activeJob.plan?.map(step => (
                            <div key={step.id} className="mb-2">
                               <div className="font-bold text-white mb-1">{step.name}</div>
                               <div className="pl-4 text-gray-400">{step.description}</div>
                               <div className={`pl-4 text-[10px] mt-0.5 ${step.status === 'completed' ? 'text-green-500' : step.status === 'failed' ? 'text-red-500' : 'text-blue-500'}`}>
                                  Status: {step.status.toUpperCase()}
                               </div>
                            </div>
                         ))}
                      </div>
                   )}

                   {bottomTab === 'problems' && (
                      <div className="space-y-2">
                         {getProblems().map((prob, i) => (
                            <div key={i} className="flex items-start gap-2 hover:bg-[#252526] p-1 rounded cursor-pointer">
                               {prob.type === 'error' ? <XCircle size={14} className="text-red-400 mt-0.5" /> : <AlertTriangle size={14} className="text-yellow-400 mt-0.5" />}
                               <div>
                                  <div className="text-gray-300">{prob.message}</div>
                                  <div className="text-gray-500 text-xs">{prob.file} [{prob.line}, {prob.col}]</div>
                               </div>
                            </div>
                         ))}
                         {getProblems().length === 0 && <div className="text-gray-500 italic">No problems detected.</div>}
                      </div>
                   )}

                   {bottomTab === 'env' && (
                      <div className="font-mono text-xs space-y-2 max-w-xl">
                         <div className="flex items-center justify-between p-2 bg-[#252526] rounded border border-[#333]">
                            <span className="text-blue-300">DATABASE_URL</span>
                            <div className="flex items-center gap-2">
                               <span className="text-gray-500">{showEnv ? 'postgres://nexus:pass@sandbox-db:5432/app' : '••••••••••••••••••••••••••••••'}</span>
                               <button onClick={() => setShowEnv(!showEnv)} className="text-gray-400 hover:text-white">
                                  {showEnv ? <EyeOff size={12} /> : <Eye size={12} />}
                               </button>
                            </div>
                         </div>
                         <div className="flex items-center justify-between p-2 bg-[#252526] rounded border border-[#333]">
                            <span className="text-blue-300">NODE_ENV</span>
                            <span className="text-green-400">test</span>
                         </div>
                         <div className="flex items-center justify-between p-2 bg-[#252526] rounded border border-[#333]">
                            <span className="text-blue-300">API_KEY</span>
                            <span className="text-gray-500">••••••••</span>
                         </div>
                      </div>
                   )}
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default Sandbox;
