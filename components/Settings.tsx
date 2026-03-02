
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RotateCcw, 
  Trash2, 
  Github, 
  Database, 
  Lock, 
  Box, 
  Shield, 
  Terminal, 
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  ProjectSettings, 
  UsageStats, 
  AuditLog, 
  RepoSettings, 
  SandboxConfig, 
  DatabaseSettings, 
  Secret,
  User 
} from '../types';
import { settingsService } from '../services/settingsService';

type Tab = 'general' | 'repository' | 'sandbox' | 'database' | 'secrets';

interface SettingsProps {
  user: User;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Data State
  const [project, setProject] = useState<ProjectSettings | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [repoSettings, setRepoSettings] = useState<RepoSettings | null>(null);
  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig | null>(null);
  const [dbSettings, setDbSettings] = useState<DatabaseSettings | null>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);

  // Form State
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Initial Fetch based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'general') {
          const [p, u, a] = await Promise.all([
            settingsService.getProject(user.id),
            settingsService.getUsage(),
            settingsService.getAuditLogs(user.id)
          ]);
          if (p.data) setProject(p.data);
          if (u.data) setUsage(u.data);
          if (a.data) setAuditLogs(a.data);
        } 
        else if (activeTab === 'repository') {
          const r = await settingsService.getRepoSettings();
          if (r.data) setRepoSettings(r.data);
        }
        else if (activeTab === 'sandbox') {
          const s = await settingsService.getSandboxConfig();
          if (s.data) setSandboxConfig(s.data);
        }
        else if (activeTab === 'database') {
          const d = await settingsService.getDatabaseSettings();
          if (d.data) setDbSettings(d.data);
        }
        else if (activeTab === 'secrets') {
          const s = await settingsService.getSecrets(user.id);
          if (s.data) setSecrets(s.data);
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, user.id]);

  const handleUpdateProject = async () => {
    if (!project) return;
    setActionLoading('project');
    await settingsService.updateProject(project, user.id);
    setActionLoading(null);
  };

  const handleResyncRepo = async () => {
    setActionLoading('resync');
    const res = await settingsService.resyncRepo(user.id);
    if (res.data) setRepoSettings(res.data);
    setActionLoading(null);
  };

  const handleResetSandbox = async () => {
    setActionLoading('resetSandbox');
    await settingsService.resetSandbox(user.id);
    setActionLoading(null);
  };

  const handleDbAction = async (action: 'migrate' | 'reset' | 'seed') => {
    setActionLoading(action);
    if (action === 'migrate') await settingsService.runMigrations(user.id);
    if (action === 'reset') await settingsService.resetDatabase(user.id);
    if (action === 'seed') await settingsService.seedDatabase(user.id);
    setActionLoading(null);
  };

  const handleAddSecret = async () => {
    if (!newKey || !newValue) return;
    setActionLoading('addSecret');
    const res = await settingsService.addSecret(newKey, newValue, user.id);
    if (res.data) setSecrets([...secrets, res.data]);
    setNewKey('');
    setNewValue('');
    setActionLoading(null);
  };

  const handleDeleteSecret = async (id: string) => {
    setActionLoading(`deleteSecret-${id}`);
    await settingsService.deleteSecret(id, user.id);
    setSecrets(secrets.filter(s => s.id !== id));
    setActionLoading(null);
  };

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTabContent = () => {
    if (loading) {
       return <div className="flex h-64 items-center justify-center text-gray-400"><Loader2 className="animate-spin" size={32} /></div>;
    }

    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Project Identity */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-900">Project Settings</h3>
                <span className="text-xs text-gray-500 font-mono">ID: {project?.id}</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input 
                      type="text" 
                      value={project?.name || ''} 
                      onChange={(e) => setProject(prev => prev ? {...prev, name: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <input type="text" disabled value={new Date(project?.createdAt || '').toLocaleString()} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500" />
                  </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      value={project?.description || ''} 
                      onChange={(e) => setProject(prev => prev ? {...prev, description: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none h-20 resize-none" 
                    />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                 <button 
                    onClick={handleUpdateProject} 
                    disabled={actionLoading === 'project'}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-70"
                 >
                    {actionLoading === 'project' ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} Save Changes
                 </button>
              </div>
            </div>

            {/* Usage & Billing */}
            {usage && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                 <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={16} /> Usage & Limits
                 </h3>
                 <div className="space-y-4">
                    <div>
                       <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">Sandbox Execution Minutes</span>
                          <span className="text-gray-500">{usage.sandboxMinutesUsed} / {usage.sandboxMinutesLimit} mins</span>
                       </div>
                       <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(usage.sandboxMinutesUsed / usage.sandboxMinutesLimit) * 100}%` }}></div>
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">Storage</span>
                          <span className="text-gray-500">{usage.storageUsedMB}MB / {usage.storageLimitMB}MB</span>
                       </div>
                       <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(usage.storageUsedMB / usage.storageLimitMB) * 100}%` }}></div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Audit Logs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-sm font-semibold text-gray-900">Audit Logs</h3>
               </div>
               <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                     <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3 text-right">Time</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {auditLogs.map(log => (
                       <tr key={log.id}>
                          <td className="px-6 py-3 flex items-center gap-2">
                             <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold">{log.userName.charAt(0)}</div> 
                             {log.userName}
                          </td>
                          <td className="px-6 py-3">
                             {log.action} 
                             {log.details && <span className="ml-2 text-gray-400 text-xs">({log.details})</span>}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-200 rounded-xl overflow-hidden">
               <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                  <h3 className="text-sm font-bold text-red-800">Danger Zone</h3>
               </div>
               <div className="p-6 bg-white flex items-center justify-between">
                  <div>
                     <h4 className="font-medium text-gray-900 text-sm">Delete Project</h4>
                     <p className="text-xs text-gray-500 mt-1">This will permanently delete the project, all sandboxes, and databases.</p>
                  </div>
                  <button className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors">
                     Delete Project
                  </button>
               </div>
            </div>
          </div>
        );

      case 'repository':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between">
                   <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                         <Github size={24} />
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-900">Connected Repository</h3>
                         {repoSettings && (
                           <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700">{repoSettings.connectedRepo}</span>
                              <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                 <CheckCircle2 size={10} /> Connected
                              </span>
                           </div>
                         )}
                      </div>
                   </div>
                   <div className="flex flex-col gap-2">
                      <button className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                         Change Repo
                      </button>
                      <button className="text-xs text-red-600 hover:underline">Disconnect</button>
                   </div>
                </div>

                {repoSettings && (
                   <div className="mt-8 grid grid-cols-2 gap-8">
                      <div>
                         <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sync Status</label>
                         <div className="flex items-center gap-2 text-sm text-gray-700">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Auto-Sync {repoSettings.autoSync ? 'Enabled' : 'Disabled'}
                         </div>
                         <p className="text-xs text-gray-400 mt-1">Last synced {new Date(repoSettings.lastSyncTime).toLocaleTimeString()}</p>
                      </div>
                      <div>
                         <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Default Branch</label>
                         <select defaultValue={repoSettings.defaultBranch} className="bg-gray-50 border border-gray-200 rounded text-sm px-2 py-1 focus:outline-none w-full">
                            <option>main</option>
                            <option>develop</option>
                            <option>staging</option>
                         </select>
                      </div>
                   </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100">
                   <h4 className="text-sm font-medium text-gray-900 mb-2">Actions</h4>
                   <div className="flex gap-3">
                      <button 
                        onClick={handleResyncRepo}
                        disabled={actionLoading === 'resync'}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                         <RefreshCw size={14} className={actionLoading === 'resync' ? 'animate-spin' : ''} /> 
                         {actionLoading === 'resync' ? 'Syncing...' : 'Force Resync'}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'sandbox':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            {sandboxConfig && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Execution Environment</h3>
                    {sandboxConfig.enabled && (
                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded border border-green-200">Sandbox Active</span>
                    )}
                 </div>
                 
                 <div className="p-6 grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Container Runtime</label>
                          <select defaultValue={sandboxConfig.runtime} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                             <option value="nodejs-18">Node.js 18.x (Standard)</option>
                             <option value="python-3.11">Python 3.11</option>
                             <option value="go-1.21">Go 1.21</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Isolation Level</label>
                          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                             <Shield size={16} className="text-blue-600" />
                             <div className="flex-1">
                                <div className="text-sm font-medium text-blue-900">Protected</div>
                                <div className="text-xs text-blue-700">No external network access allowed.</div>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Execution Time</label>
                          <div className="flex items-center gap-2">
                             <input type="number" defaultValue={sandboxConfig.maxExecutionTimeSec} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                             <span className="text-gray-500 text-sm">seconds</span>
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Memory Limit</label>
                          <div className="flex items-center gap-2">
                             <input type="number" defaultValue={sandboxConfig.memoryLimitMB} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                             <span className="text-gray-500 text-sm">MB</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Allowed Commands</h4>
                    <div className="flex gap-2">
                       {['npm install', 'npm test', 'node *', 'prisma migrate'].map(cmd => (
                          <span key={cmd} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono text-gray-600">
                             {cmd}
                          </span>
                       ))}
                    </div>
                 </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-red-100 bg-red-50/30">
                  <h3 className="text-sm font-bold text-red-800">Maintenance</h3>
               </div>
               <div className="p-6 flex items-center justify-between">
                  <div>
                     <h4 className="font-medium text-gray-900 text-sm">Reset Sandbox</h4>
                     <p className="text-xs text-gray-500 mt-1">Stops running containers, clears temp files, and resets ephemeral DBs.</p>
                  </div>
                  <button 
                    onClick={handleResetSandbox}
                    disabled={actionLoading === 'resetSandbox'}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                     <RotateCcw size={14} className={actionLoading === 'resetSandbox' ? 'animate-spin' : ''} /> 
                     {actionLoading === 'resetSandbox' ? 'Resetting...' : 'Reset Environment'}
                  </button>
               </div>
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-6">
                   <div className="flex gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100 text-blue-600">
                         <Database size={24} />
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-900">Database Automation</h3>
                         <p className="text-sm text-gray-500 mt-1">Configure how Nexus handles ephemeral databases.</p>
                      </div>
                   </div>
                   {dbSettings && (
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Auto-Detect ORM</span>
                        <button className={`w-10 h-5 rounded-full relative ${dbSettings.autoDetectOrm ? 'bg-green-500' : 'bg-gray-300'}`}>
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${dbSettings.autoDetectOrm ? 'right-1' : 'left-1'}`}></div>
                        </button>
                     </div>
                   )}
                </div>

                {dbSettings && (
                  <div className="space-y-6">
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detected Frameworks</label>
                        <div className="flex gap-3">
                           {['prisma', 'typeorm', 'django'].map(fw => (
                              <div key={fw} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                                dbSettings.detectedFramework === fw 
                                  ? 'bg-gray-900 text-white border-gray-900' 
                                  : 'bg-white text-gray-400 border-gray-200 opacity-50'
                              }`}>
                                 {dbSettings.detectedFramework === fw && <CheckCircle2 size={16} className="text-green-400" />} 
                                 {fw.charAt(0).toUpperCase() + fw.slice(1)}
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Database Engine</label>
                           <select defaultValue={dbSettings.dbType} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                              <option value="postgres">PostgreSQL 15 (Recommended)</option>
                              <option value="mysql">MySQL 8.0</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Default Port</label>
                           <input type="text" disabled defaultValue={dbSettings.port} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500" />
                        </div>
                     </div>

                     <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Manual Actions</h4>
                        <div className="flex gap-3">
                           <button 
                              onClick={() => handleDbAction('migrate')}
                              disabled={!!actionLoading}
                              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                           >
                              {actionLoading === 'migrate' && <RefreshCw className="animate-spin" size={12}/>} Run Migrations
                           </button>
                           <button 
                              onClick={() => handleDbAction('seed')}
                              disabled={!!actionLoading}
                              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                           >
                               {actionLoading === 'seed' && <RefreshCw className="animate-spin" size={12}/>} Seed Test Data
                           </button>
                           <button 
                              onClick={() => handleDbAction('reset')}
                              disabled={!!actionLoading}
                              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                           >
                               {actionLoading === 'reset' && <RefreshCw className="animate-spin" size={12}/>} Reset Database
                           </button>
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        );

      case 'secrets':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-900">Environment Variables</h3>
               <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Lock size={14} /> Encrypted & Secure
               </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="grid grid-cols-[1fr_2fr_50px] bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div>Key</div>
                  <div>Value</div>
                  <div className="text-right">Action</div>
               </div>
               
               <div className="divide-y divide-gray-100">
                  {secrets.map((secret) => (
                     <div key={secret.id} className="grid grid-cols-[1fr_2fr_50px] px-4 py-3 items-center hover:bg-gray-50 group transition-colors">
                        <div className="font-mono text-sm font-medium text-gray-700">{secret.key}</div>
                        <div className="font-mono text-sm text-gray-500 flex items-center gap-2">
                           <span className="truncate max-w-md">
                              {showSecrets[secret.id] ? secret.value : '•'.repeat(24)}
                           </span>
                           <button onClick={() => toggleSecret(secret.id)} className="text-gray-400 hover:text-gray-600">
                              {showSecrets[secret.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                           </button>
                        </div>
                        <div className="text-right">
                           <button 
                              onClick={() => handleDeleteSecret(secret.id)} 
                              disabled={actionLoading === `deleteSecret-${secret.id}`}
                              className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                           >
                              {actionLoading === `deleteSecret-${secret.id}` ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16} />}
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
               
               <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 grid grid-cols-[1fr_2fr_auto] gap-4 items-center">
                  <input 
                     type="text" 
                     placeholder="NEW_KEY" 
                     value={newKey}
                     onChange={(e) => setNewKey(e.target.value)}
                     className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:outline-none uppercase" 
                  />
                  <input 
                     type="password" 
                     placeholder="Value" 
                     value={newValue}
                     onChange={(e) => setNewValue(e.target.value)}
                     className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:outline-none" 
                  />
                  <button 
                     onClick={handleAddSecret}
                     disabled={!newKey || !newValue || actionLoading === 'addSecret'}
                     className="bg-gray-900 text-white p-2 rounded-lg hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center w-10"
                  >
                     {actionLoading === 'addSecret' ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  </button>
               </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex h-full bg-white">
      {/* Settings Sidebar */}
      <div className="w-64 border-r border-gray-200 p-6 flex flex-col shrink-0">
         <h2 className="text-2xl font-bold text-gray-900 mb-1">Settings</h2>
         <p className="text-gray-500 text-sm mb-8">Manage workspace configuration.</p>
         
         <nav className="space-y-1">
            <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
               <Terminal size={18} /> General
            </button>
            <button onClick={() => setActiveTab('repository')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'repository' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
               <Github size={18} /> Repository
            </button>
            <button onClick={() => setActiveTab('sandbox')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sandbox' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
               <Box size={18} /> Sandbox
            </button>
            <button onClick={() => setActiveTab('database')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'database' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
               <Database size={18} /> Database
            </button>
            <button onClick={() => setActiveTab('secrets')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'secrets' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
               <Lock size={18} /> Secrets
            </button>
         </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-12 bg-[#fdfdfd]">
         <div className="max-w-4xl mx-auto">
            {renderTabContent()}
         </div>
      </div>
    </div>
  );
};

export default Settings;
    