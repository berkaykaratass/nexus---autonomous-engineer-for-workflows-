
import React, { useState, useEffect } from 'react';
import { JobType, Integration } from '../types';
import { X, ArrowRight, Github, AlertCircle, Trello, MessageSquare, Clock, Lock, Zap, Loader2 } from 'lucide-react';
import { generateJobPlan } from '../services/geminiService';
import { githubService } from '../services/githubService';

interface CreateJobModalProps {
  onClose: () => void;
  onCreate: (jobData: any) => void;
  integrations: Integration[];
  onConnectIntegration?: (id: string) => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ onClose, onCreate, integrations, onConnectIntegration }) => {
  const [repo, setRepo] = useState('');
  const [type, setType] = useState<JobType>(JobType.BUG_FIX);
  const [description, setDescription] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [frequency, setFrequency] = useState('trigger');
  
  // Real Repo State
  const [userRepos, setUserRepos] = useState<string[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);

  const githubIntegration = integrations.find(i => i.name === 'GitHub');
  const isGithubConnected = githubIntegration?.status === 'connected';
  const githubToken = githubIntegration?.githubToken;

  // Fetch real repos when connected
  useEffect(() => {
    if (isGithubConnected && githubToken) {
      setIsLoadingRepos(true);
      githubService.getUserRepos(githubToken)
        .then(repos => {
          setUserRepos(repos);
          if (repos.length > 0) setRepo(repos[0]);
        })
        .finally(() => setIsLoadingRepos(false));
    }
  }, [isGithubConnected, githubToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !repo) return;

    setIsPlanning(true);
    try {
      // Real AI planning phase for execution jobs
      // For cron jobs, we might skip detailed planning or plan simply
      let plan = [];
      if (frequency === 'trigger') {
         plan = await generateJobPlan(description, repo);
      }
      
      onCreate({
        repo,
        type,
        description,
        plan,
        frequency // Pass this up so App.tsx knows whether to make a Job or a Workflow
      });
    } catch (error) {
      console.error("Planning failed", error);
      const fallbackPlan = [
         { name: 'Analyze', description: 'Analyze requirements', status: 'pending' },
         { name: 'Execute', description: 'Perform changes', status: 'pending' }
      ];
      onCreate({
        repo,
        type,
        description,
        plan: fallbackPlan,
        frequency
      });
    } finally {
      setIsPlanning(false);
    }
  };

  const getIcon = (name: string) => {
      const size = 14;
      switch (name.toLowerCase()) {
        case 'github': return <Github size={size} />;
        case 'sentry': return <AlertCircle size={size} />;
        case 'linear': return <Trello size={size} />; 
        case 'slack': return <MessageSquare size={size} />;
        case 'notion': return <div className="font-serif font-bold text-[10px]">N</div>;
        default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
      }
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl ring-1 ring-gray-200 animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-semibold text-gray-900">New Workflow</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8">
             {/* Goal Input */}
             <div className="space-y-2">
               <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Goal</label>
               <div className="relative group">
                 <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you want the agent to do..."
                    className="w-full bg-transparent text-xl font-medium text-gray-900 placeholder-gray-300 focus:outline-none resize-none h-24 z-10 relative bg-yellow-50/50 focus:bg-yellow-50 p-3 rounded-lg transition-colors -ml-3 border border-transparent focus:border-yellow-200"
                    style={{ background: description ? '#fefce8' : undefined }} 
                 />
                 {!description && (
                   <div className="absolute top-3 left-0 pointer-events-none text-xl font-medium text-gray-300 pl-0">
                     Generate a weekly changelog...
                   </div>
                 )}
               </div>
             </div>

             {/* Workflow Details Grid */}
             <div className="grid grid-cols-[120px_1fr] gap-y-6 items-center text-sm">
                
                {/* Properties Row */}
                <div className="text-gray-500 font-medium">Properties</div>
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden ring-1 ring-gray-100">
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Darren" alt="User" />
                   </div>
                   <span className="text-gray-900 font-medium">Darren Baldwin</span>
                </div>

                {/* Repository Row */}
                <div className="text-gray-500 font-medium">Repository</div>
                <div className="flex items-center gap-2">
                   {!isGithubConnected ? (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 w-full">
                         <Lock size={14} />
                         <span className="text-xs font-medium">GitHub integration required</span>
                         <button 
                           onClick={() => onConnectIntegration && githubIntegration && onConnectIntegration(githubIntegration.id)}
                           className="ml-auto text-xs bg-white border border-amber-200 px-2 py-1 rounded shadow-sm hover:bg-amber-100 font-semibold"
                         >
                            Connect
                         </button>
                      </div>
                   ) : (
                      <>
                        {isLoadingRepos ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 size={14} className="animate-spin"/> Loading repos...
                          </div>
                        ) : (
                          <>
                            <select 
                               value={repo}
                               onChange={(e) => setRepo(e.target.value)}
                               className="bg-white border border-gray-200 rounded px-2 py-1.5 text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-gray-100 focus:outline-none transition-all shadow-sm max-w-[200px]"
                            >
                               {userRepos.length === 0 && <option disabled>No repos found</option>}
                               {userRepos.map(r => (
                                 <option key={r} value={r}>{r}</option>
                               ))}
                            </select>
                            <span className="text-gray-300">›</span>
                            <span className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-500 text-xs font-mono">main</span>
                          </>
                        )}
                      </>
                   )}
                </div>

                {/* Agent Row */}
                <div className="text-gray-500 font-medium">Agent</div>
                <div>
                   <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded px-2.5 py-1.5 shadow-sm text-gray-700">
                      <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-sm flex items-center justify-center text-white text-[8px] font-bold">AI</div>
                      <span className="font-medium">Gemini Code: Pro 3.0</span>
                   </div>
                </div>

                {/* Run Workflow On Row */}
                <div className="text-gray-500 font-medium">Run on</div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setFrequency('trigger')}
                     className={`px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-all ${
                       frequency === 'trigger' 
                       ? 'bg-gray-900 border-gray-900 text-white shadow-sm ring-2 ring-offset-1 ring-gray-900' 
                       : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                     }`}
                   >
                      <Zap size={12} className={frequency === 'trigger' ? 'text-yellow-400 fill-yellow-400' : ''} /> Trigger
                   </button>
                   <button 
                     onClick={() => setFrequency('daily')}
                     className={`px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-all ${
                       frequency === 'daily' 
                       ? 'bg-gray-900 border-gray-900 text-white shadow-sm ring-2 ring-offset-1 ring-gray-900' 
                       : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                     }`}
                   >
                      <Clock size={12} /> Daily
                   </button>
                </div>

                {/* Connected Apps Row */}
                <div className="text-gray-500 font-medium">Connected</div>
                <div className="flex flex-wrap gap-2 items-center">
                   {integrations.filter(i => i.status === 'connected').map(app => (
                      <div key={app.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                         {getIcon(app.name)}
                         {app.name}
                      </div>
                   ))}
                   <div className="text-xs text-gray-400 pl-1 border border-dashed border-gray-300 rounded-full px-2 py-0.5 hover:bg-gray-50 cursor-pointer transition-colors">
                      + Add App
                   </div>
                </div>

             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100 mt-auto">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
           >
             Cancel
           </button>
           <button 
              onClick={handleSubmit}
              disabled={isPlanning || !description || !repo || !isGithubConnected}
              className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
              {isPlanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building Plan...
                </>
              ) : (
                <>Create Workflow <ArrowRight size={14} /></>
              )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;
