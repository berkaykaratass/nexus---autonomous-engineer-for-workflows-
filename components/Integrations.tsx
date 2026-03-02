
import React, { useState } from 'react';
import { Integration } from '../types';
import { Check, Plus, ExternalLink, Github, AlertCircle, Trello, MessageSquare, Zap, Link, X, Loader2, Lock, Key } from 'lucide-react';
import { githubService } from '../services/githubService';

interface IntegrationsProps {
  integrations: Integration[];
  onToggle: (id: string, token?: string) => void;
}

const Integrations: React.FC<IntegrationsProps> = ({ integrations, onToggle }) => {
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'github': return <Github size={24} />;
      case 'sentry': return <AlertCircle size={24} />;
      case 'linear': return <Trello size={24} />;
      case 'slack': return <MessageSquare size={24} />;
      case 'notion': return <div className="font-serif font-bold text-xl">N</div>;
      default: return <Zap size={24} />;
    }
  };

  const handleConnect = async () => {
    if (!configuringId) return;
    
    const integration = integrations.find(i => i.id === configuringId);
    
    if (integration?.name === 'GitHub') {
       if (!tokenInput.startsWith('ghp_') && !tokenInput.startsWith('github_pat_')) {
          // Just a warning
       }

       setIsValidating(true);
       setError('');
       
       const isValid = await githubService.validateToken(tokenInput);
       setIsValidating(false);

       if (isValid) {
          onToggle(configuringId, tokenInput);
          setConfiguringId(null);
          setTokenInput('');
       } else {
          setError('Invalid GitHub token. Please check your permissions.');
       }
    } else if (integration?.name === 'Linear') {
       // Mock validation for Linear
       if (!tokenInput.startsWith('lin_')) {
          setError('Invalid Linear API Key (should start with lin_).');
          return;
       }
       onToggle(configuringId, tokenInput);
       setConfiguringId(null);
       setTokenInput('');
    } else {
       // Mock connection for others
       onToggle(configuringId);
       setConfiguringId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h2>
        <p className="text-gray-500">Connect Nexus to your existing stack to enable autonomous workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-56">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl border ${
                  integration.name === 'GitHub' ? 'bg-gray-50 border-gray-200 text-gray-900' :
                  integration.name === 'Sentry' ? 'bg-red-50 border-red-100 text-red-600' :
                  integration.name === 'Linear' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                  'bg-gray-50 border-gray-100 text-gray-600'
                }`}>
                  {getIcon(integration.name)}
                </div>
                {integration.status === 'connected' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                    <Check size={10} strokeWidth={3} /> Connected
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{integration.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{integration.description}</p>
            </div>

            <div className="pt-4 mt-auto">
              <button 
                onClick={() => {
                   if (integration.status === 'connected') {
                      onToggle(integration.id); // Disconnect
                   } else {
                      setConfiguringId(integration.id);
                   }
                }}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  integration.status === 'connected' 
                  ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50' 
                  : 'bg-gray-900 text-white hover:bg-black hover:shadow-lg'
                }`}
              >
                {integration.status === 'connected' ? (
                   <>Disconnect</>
                ) : (
                   <><Link size={14} /> Connect</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {configuringId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-gray-900">Configure {integrations.find(i => i.id === configuringId)?.name}</h3>
                 <button onClick={() => setConfiguringId(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>

              {integrations.find(i => i.id === configuringId)?.name === 'GitHub' ? (
                 <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                       To enable <b>Real GitHub Actions</b> (Branching, Commits, PRs), we need a Personal Access Token (PAT).
                    </div>
                    
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Personal Access Token</label>
                       <div className="relative">
                          <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input 
                             type="password" 
                             value={tokenInput}
                             onChange={(e) => setTokenInput(e.target.value)}
                             placeholder="ghp_..."
                             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                          />
                       </div>
                       <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                          Create a Classic Token (repo scope required)
                       </a>
                    </div>

                    {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

                    <button 
                       onClick={handleConnect}
                       disabled={isValidating || !tokenInput}
                       className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                       {isValidating ? <Loader2 className="animate-spin" size={16} /> : 'Verify & Connect'}
                    </button>
                 </div>
              ) : integrations.find(i => i.id === configuringId)?.name === 'Linear' ? (
                 <div className="space-y-4">
                     <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                       We need a Linear API Key to read issues and update statuses.
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Linear API Key</label>
                       <div className="relative">
                          <Key className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input 
                             type="password" 
                             value={tokenInput}
                             onChange={(e) => setTokenInput(e.target.value)}
                             placeholder="lin_..."
                             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                          />
                       </div>
                    </div>
                    {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
                    <button 
                       onClick={handleConnect}
                       className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-black transition-colors"
                    >
                       Connect Linear
                    </button>
                 </div>
              ) : (
                 <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Click below to simulate a connection.</p>
                    <button 
                       onClick={handleConnect}
                       className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-black transition-colors"
                    >
                       Connect Simulation
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
