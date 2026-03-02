
import React, { useEffect, useState, useRef } from 'react';
import { Job, JobStatus, ChatMessage } from '../types';
import { generatePatchExplanation, chatWithBot } from '../services/geminiService';
import { 
  ArrowLeft, Terminal, GitCommit, Check, X, RefreshCw, 
  MessageSquare, FileCode, CheckCircle2, Shield, Edit2, Save, Send, Sparkles, User, PlayCircle, Loader2
} from 'lucide-react';

interface JobDetailProps {
  job: Job;
  onBack: () => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
  onUpdateDiff?: (id: string, newDiff: string) => void;
}

const JobDetail: React.FC<JobDetailProps> = ({ job, onBack, onUpdateStatus, onUpdateDiff }) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'logs'>('diff');
  const [patchExplanation, setPatchExplanation] = useState<string>('');
  const [isEditingDiff, setIsEditingDiff] = useState(false);
  const [editedDiff, setEditedDiff] = useState(job.diff || '');
  const [chatInput, setChatInput] = useState('');
  // Use messages from props if available to keep in sync
  const [messages, setMessages] = useState<ChatMessage[]>(job.chatHistory || []);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync local messages state with prop updates (crucial for system messages)
    setMessages(job.chatHistory || []);
  }, [job.chatHistory]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (activeTab === 'logs' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [job.logs, activeTab]);

  useEffect(() => {
    if (activeTab === 'diff' && job.diff && !patchExplanation) {
       generatePatchExplanation(job.diff).then(res => setPatchExplanation(res));
    }
    if (job.diff) setEditedDiff(job.diff);
  }, [activeTab, job.diff, patchExplanation]);

  const handleSaveDiff = () => {
    if (onUpdateDiff) {
      onUpdateDiff(job.id, editedDiff);
    }
    setIsEditingDiff(false);
  };

  const handleSendMessage = async () => {
    if(!chatInput.trim()) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Optimistic update
    const updatedHistory = [...messages, newMessage];
    setMessages(updatedHistory);
    setChatInput('');
    setIsTyping(true);

    // Call service
    const response = await chatWithBot(updatedHistory, chatInput, job);
    
    const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        codeSnippet: response.codeSnippet
    };
    
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);

    // If the bot returned a new diff (ChatOps), update the job
    if (response.newDiff && onUpdateDiff) {
       onUpdateDiff(job.id, response.newDiff);
       setPatchExplanation(''); // Reset explanation so it regenerates for new code
       setEditedDiff(response.newDiff);
    }
  };

  const currentStep = job.plan?.find(s => s.status === 'running');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">{job.title}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                job.status === JobStatus.NEEDS_APPROVAL ? 'border-blue-200 text-blue-700 bg-blue-50' :
                job.status === JobStatus.COMPLETED ? 'border-green-200 text-green-700 bg-green-50' :
                job.status === JobStatus.FAILED ? 'border-red-200 text-red-700 bg-red-50' :
                'border-yellow-200 text-yellow-700 bg-yellow-50'
              }`}>
                {job.status === JobStatus.RUNNING && <Loader2 size={10} className="inline animate-spin mr-1"/>}
                {job.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-mono">
              <span className="flex items-center gap-1"><Shield size={12} className="text-gray-400"/> {job.repo}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><GitCommit size={14} /> {job.branch}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {job.status === JobStatus.NEEDS_APPROVAL && (
            <>
              <button className="text-gray-500 hover:text-red-600 font-medium text-sm transition-colors">
                Reject Changes
              </button>
              <button 
                onClick={() => onUpdateStatus(job.id, JobStatus.COMPLETED)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
              >
                <Check size={16} /> Approve & Merge
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area - Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Chat / Conversation */}
        <div className="w-[450px] border-r border-gray-200 flex flex-col bg-gray-50/50">
          
          {/* Live Status Header */}
          {job.status === JobStatus.RUNNING && (
             <div className="bg-blue-50/80 border-b border-blue-100 p-2 flex items-center justify-between px-4 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 text-blue-800 text-xs font-medium">
                   <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                   {currentStep ? currentStep.name : 'Processing...'}
                </div>
                <div className="text-[10px] text-blue-600 font-mono opacity-80">LIVE</div>
             </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
             
             {/* Goal Context */}
             <div className="bg-[#fff9c2] bg-opacity-40 p-4 rounded-xl border border-yellow-200/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-yellow-700 text-xs font-bold uppercase tracking-wider">
                   <Sparkles size={12} /> Goal
                </div>
                <p className="text-gray-800 text-sm leading-relaxed font-medium">{job.description}</p>
             </div>

             {/* Execution Plan Visualization */}
             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Execution Plan</div>
                <div className="space-y-3 relative">
                   <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100 -z-10" />
                   {job.plan?.map((step) => (
                      <div key={step.id} className="flex gap-3 items-start group">
                         <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center bg-white z-10 transition-colors ${
                            step.status === 'completed' ? 'border-green-500 text-green-500' :
                            step.status === 'running' ? 'border-blue-500 border-t-transparent animate-spin' :
                            step.status === 'failed' ? 'border-red-500 text-red-500' :
                            'border-gray-300 text-gray-300'
                         }`}>
                            {step.status === 'completed' && <Check size={10} strokeWidth={4} />}
                            {step.status === 'failed' && <X size={10} strokeWidth={4} />}
                            {step.status === 'pending' && <div className="w-1 h-1 bg-gray-300 rounded-full" />}
                         </div>
                         <div className="text-sm flex-1">
                            <div className={`font-medium transition-colors ${
                               step.status === 'completed' ? 'text-gray-900' : 
                               step.status === 'running' ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                               {step.name}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Timeline / Chat */}
             <div className="space-y-6 pt-4 border-t border-gray-100">
                {messages.map((msg, idx) => {
                    // System Message Style
                    if (msg.role === 'system') {
                       return (
                          <div key={msg.id} className="flex gap-3 items-center justify-center opacity-80">
                             <div className="h-px bg-gray-200 w-12" />
                             <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                                <Terminal size={10} /> {msg.content}
                             </div>
                             <div className="h-px bg-gray-200 w-12" />
                          </div>
                       );
                    }
                    
                    // User/Assistant Message Style
                    return (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                              msg.role === 'assistant' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-900 text-white'
                           }`}>
                              {msg.role === 'assistant' ? <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-sm" /> : <User size={14} />}
                           </div>
                           
                           <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                 msg.role === 'assistant' 
                                   ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' 
                                   : 'bg-blue-600 text-white rounded-tr-none'
                              }`}>
                                 {msg.content}
                              </div>
                              
                              {/* Metadata */}
                              <div className="flex items-center gap-2 mt-1 px-1">
                                 <span className="text-[10px] text-gray-400 font-medium">{msg.role === 'assistant' ? 'Nexus AI' : 'You'}</span>
                                 <span className="text-[10px] text-gray-300">•</span>
                                 <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                              </div>

                              {msg.codeSnippet && (
                                 <div className="mt-2 w-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800 text-xs font-mono shadow-md">
                                    <div className="px-3 py-1.5 bg-[#252526] text-gray-400 border-b border-gray-700 flex justify-between items-center">
                                       <span>{msg.codeSnippet.file}</span>
                                       <span className="text-[10px] bg-gray-700 px-1.5 rounded">{msg.codeSnippet.language}</span>
                                    </div>
                                    <pre className="p-3 text-gray-300 overflow-x-auto custom-scrollbar">
                                       {msg.codeSnippet.code}
                                    </pre>
                                 </div>
                              )}
                           </div>
                        </div>
                    );
                })}
                
                {isTyping && (
                    <div className="flex gap-3">
                       <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-sm" />
                       </div>
                       <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                          <div className="flex gap-1">
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                          </div>
                       </div>
                    </div>
                )}
                <div ref={chatEndRef} />
             </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-200">
             <div className="relative">
                <input 
                   type="text" 
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                   placeholder="Ask Nexus to modify code or explain..."
                   disabled={isTyping}
                   className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all disabled:opacity-50"
                />
                <button 
                   onClick={handleSendMessage}
                   disabled={isTyping || !chatInput.trim()}
                   className="absolute right-2 top-2 p-1.5 bg-gray-900 text-white rounded-md hover:bg-black transition-colors disabled:opacity-50 disabled:bg-gray-300"
                >
                   <Send size={14} />
                </button>
             </div>
             <div className="text-[10px] text-gray-400 mt-2 flex justify-center">
                Tip: Type "@nexus fix this" to trigger an automatic code update.
             </div>
          </div>
        </div>

        {/* Right Panel: Code / Diff */}
        <div className="flex-1 bg-white flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 h-[49px] bg-white">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveTab('diff')} 
                className={`flex items-center gap-2 text-sm py-4 border-b-2 transition-colors ${activeTab === 'diff' ? 'border-black text-black font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <FileCode size={16} /> Changes
              </button>
              <button 
                 onClick={() => setActiveTab('logs')}
                 className={`flex items-center gap-2 text-sm py-4 border-b-2 transition-colors ${activeTab === 'logs' ? 'border-black text-black font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Terminal size={16} /> Console Output
              </button>
            </div>
            {activeTab === 'diff' && (
               <div className="flex items-center gap-2">
                 {isEditingDiff ? (
                    <>
                      <button onClick={() => setIsEditingDiff(false)} className="text-xs text-gray-500 hover:text-gray-900">Cancel</button>
                      <button onClick={handleSaveDiff} className="flex items-center gap-1 text-xs bg-black text-white px-3 py-1.5 rounded-md hover:opacity-80">
                        <Save size={12} /> Save
                      </button>
                    </>
                 ) : (
                    <button onClick={() => setIsEditingDiff(true)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 px-2 py-1 bg-gray-50 rounded border border-gray-200 hover:border-gray-300">
                      <Edit2 size={12} /> Edit
                    </button>
                 )}
               </div>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-[#fafafa]">
             {activeTab === 'diff' ? (
               isEditingDiff ? (
                 <textarea 
                    value={editedDiff}
                    onChange={(e) => setEditedDiff(e.target.value)}
                    className="w-full h-full bg-white text-gray-800 font-mono text-sm p-6 focus:outline-none resize-none"
                    spellCheck={false}
                 />
               ) : (
                 job.diff ? (
                   <div className="relative p-6">
                     <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        {patchExplanation && (
                           <div className="bg-blue-50 border-b border-blue-100 p-3 text-sm text-blue-800 flex gap-2">
                              <Sparkles size={16} className="shrink-0 mt-0.5 text-blue-600" />
                              <p>{patchExplanation}</p>
                           </div>
                        )}
                        <div className="overflow-x-auto">
                           <table className="w-full font-mono text-sm">
                              <tbody>
                                 {job.diff.split('\n').map((line, i) => {
                                    const isAdd = line.startsWith('+');
                                    const isDel = line.startsWith('-');
                                    const isHeader = line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++');
                                    
                                    return (
                                       <tr key={i} className={`${
                                          isAdd ? 'bg-[#e6ffec]' :
                                          isDel ? 'bg-[#ffebe9]' :
                                          isHeader ? 'bg-gray-50 text-gray-500' : 'bg-white'
                                       }`}>
                                          <td className="w-12 text-right pr-3 py-0.5 select-none text-gray-300 text-xs border-r border-gray-100 bg-gray-50">{i+1}</td>
                                          <td className={`pl-4 py-0.5 whitespace-pre-wrap break-all ${
                                             isAdd ? 'text-[#1a7f37]' : isDel ? 'text-[#cf222e]' : 'text-[#24292f]'
                                          }`}>{line}</td>
                                       </tr>
                                    )
                                 })}
                              </tbody>
                           </table>
                        </div>
                     </div>
                   </div>
                 ) : (
                   <div className="h-full flex items-center justify-center text-gray-400 gap-2 flex-col">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                         <Loader2 size={32} className={`text-gray-300 ${job.status === JobStatus.RUNNING ? 'animate-spin' : ''}`} />
                      </div>
                     <span className="font-medium text-gray-900">Waiting for Patch Generation...</span>
                     <span className="text-sm text-gray-400 text-center max-w-xs">
                       Nexus is analyzing your codebase and will generate a diff shortly.
                     </span>
                   </div>
                 )
               )
             ) : (
                <div className="p-6 h-full flex flex-col">
                   <div className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-xs text-gray-300 shadow-sm flex-1 overflow-auto custom-scrollbar">
                      {job.logs.map((log) => (
                        <div key={log.id} className="flex gap-3 py-1 hover:bg-white/5 px-2 rounded -mx-2">
                           <span className="text-gray-500 shrink-0 select-none w-20">{log.timestamp}</span>
                           <span className={`shrink-0 w-16 uppercase font-bold ${
                              log.level === 'error' ? 'text-red-400' :
                              log.level === 'success' ? 'text-green-400' :
                              log.level === 'warn' ? 'text-yellow-400' : 'text-blue-400'
                           }`}>
                              {log.level}
                           </span>
                           <span className="break-all">{log.message}</span>
                        </div>
                      ))}
                      {job.status === JobStatus.RUNNING && (
                         <div className="flex gap-3 py-1 animate-pulse px-2">
                            <span className="text-gray-500 w-20">...</span>
                            <span className="text-blue-400 w-16">INFO</span>
                            <span>Working on task...</span>
                         </div>
                      )}
                      <div ref={logsEndRef} />
                   </div>
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default JobDetail;
