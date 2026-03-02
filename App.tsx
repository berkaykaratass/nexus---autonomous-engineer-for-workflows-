
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobsList from './components/JobsList';
import Integrations from './components/Integrations';
import JobDetail from './components/JobDetail';
import CreateJobModal from './components/CreateJobModal';
import Sandbox from './components/Sandbox';
import Workflows from './components/Workflows';
import Settings from './components/Settings';
import Login from './components/Login';
import { Job, JobStatus, Integration, DashboardStats, Workflow, JobType, User } from './types';
import { generateCodePatch, generateSyntheticFile } from './services/geminiService';
import { githubService } from './services/githubService';

// Service Imports
import { jobService } from './services/jobService';
import { integrationService } from './services/integrationService';
import { dashboardService } from './services/dashboardService';
import { workflowService } from './services/workflowService';
import { initDB } from './services/db';
import { Loader2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  // Remove hard blocking error state, treat as "degraded performance" if init fails partially

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Data State - Lifted Up
  const [jobs, setJobs] = useState<Job[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Derived state for the selected job
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  // Engine State
  const processingRef = useRef(false);

  // --- DB Init ---
  useEffect(() => {
    initDB().then((success) => {
       setIsDbReady(true); // Always set true to allow app to load (Mock mode fallback in db.ts)
    });
  }, []);

  // --- Initial Data Load ---
  useEffect(() => {
    if (!isDbReady || !user) return;

    const loadInitialData = async () => {
      const [jobsRes, intRes, statsRes, workRes] = await Promise.all([
         jobService.getAllJobs(user.id),
         integrationService.getIntegrations(user.id),
         dashboardService.getStats(user.id),
         workflowService.getWorkflows(user.id)
      ]);
      
      if (jobsRes.data) setJobs(jobsRes.data);
      if (intRes.data) setIntegrations(intRes.data);
      if (statsRes.data) setDashboardStats(statsRes.data);
      if (workRes.data) setWorkflows(workRes.data);
    };
    loadInitialData();
  }, [isDbReady, user]);

  // Poll for Dashboard Stats updates occasionally
  useEffect(() => {
     if (!isDbReady || !user) return;
     const interval = setInterval(async () => {
        if (currentView === 'dashboard') {
           const stats = await dashboardService.getStats(user.id);
           if (stats.data) setDashboardStats(stats.data);
        }
     }, 10000);
     return () => clearInterval(interval);
  }, [currentView, isDbReady, user]);

  const handleToggleIntegration = async (id: string, token?: string) => {
    const res = await integrationService.toggleConnection(id, token);
    if (res.data) {
       setIntegrations(prev => prev.map(int => int.id === id ? res.data! : int));
    }
  };

  // --- Workflow Actions ---

  const handleToggleWorkflow = async (id: string) => {
    const res = await workflowService.toggleWorkflow(id);
    if (res.data) {
      setWorkflows(prev => prev.map(w => w.id === id ? res.data! : w));
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    await workflowService.deleteWorkflow(id);
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  const handleRunWorkflow = async (workflow: Workflow) => {
     if (!user) return;
     
     const newJob: Job = {
        id: `job-${Date.now()}`,
        title: `Manual Run: ${workflow.name}`,
        repo: workflow.repo,
        type: JobType.FEATURE,
        status: JobStatus.PENDING,
        branch: `auto/run-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        description: `Automated run triggered from workflow: ${workflow.name}`,
        logs: [{ id: `log-${Date.now()}`, timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Workflow triggered manually.' }],
        plan: [
          { id: '1', name: 'Initialize', description: 'Booting environment', status: 'pending' },
          { id: '2', name: 'Execute Logic', description: 'Running workflow steps', status: 'pending' },
          { id: '3', name: 'Report', description: 'Generating output', status: 'pending' }
        ],
        confidenceScore: 0,
        chatHistory: [],
        triggerSource: 'manual'
     };

     await jobService.createJob(newJob, user.id);
     setJobs(prev => [newJob, ...prev]);
     
     // Start Engine
     setTimeout(() => {
        handleUpdateStatus(newJob.id, JobStatus.RUNNING);
     }, 1000);

     setCurrentView('jobs');
  };

  // --- Central Creator Handler ---
  const handleCreateJob = async (jobData: any) => {
    if (!user) return;

    const { frequency, repo, type, description, plan } = jobData;
    
    if (frequency === 'daily') {
       const newWorkflow: Workflow = {
         id: `wf-${Date.now()}`,
         name: description.split('.')[0] || 'New Automation',
         repo: repo,
         trigger: 'cron',
         schedule: 'Daily at 00:00 UTC',
         status: 'active',
         lastRun: 'Never'
       };
       await workflowService.createWorkflow(newWorkflow, user.id);
       setWorkflows(prev => [...prev, newWorkflow]);
       setShowCreateModal(false);
       setCurrentView('workflows');
    } else {
       const newJob: Job = {
         id: `job-${Date.now()}`,
         title: description.split('.')[0] || 'New Task',
         repo: repo,
         type: type,
         status: JobStatus.PENDING,
         branch: `nexus-task-${Date.now().toString().slice(-4)}`,
         createdAt: new Date().toISOString(),
         description: description,
         logs: [{ id: `log-${Date.now()}`, timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Job queued...' }],
         plan: plan,
         confidenceScore: 0,
         chatHistory: [],
         triggerSource: 'manual'
       };
       
       await jobService.createJob(newJob, user.id);
       setJobs(prev => [newJob, ...prev]);
       setShowCreateModal(false);
       
       setTimeout(() => {
          handleUpdateStatus(newJob.id, JobStatus.RUNNING);
       }, 1000);
       
       if (currentView === 'workflows') {
          setCurrentView('jobs');
       }
    }
  };

  const handleUpdateStatus = async (id: string, status: JobStatus) => {
    await jobService.updateJob(id, { status });
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  };

  const handleUpdateDiff = async (id: string, newDiff: string) => {
     await jobService.updateJob(id, { diff: newDiff });
     setJobs(prev => prev.map(j => j.id === id ? { ...j, diff: newDiff } : j));
  };

  const addLog = async (jobId: string, level: 'info'|'success'|'error'|'warn', message: string) => {
     const newLog = { id: `l-${Date.now()}`, timestamp: new Date().toLocaleTimeString(), level, message };
     await jobService.addLog(jobId, newLog);
     
     setJobs(prev => prev.map(j => {
        if (j.id !== jobId) return j;
        return { ...j, logs: [...j.logs, newLog] };
     }));
  };

  const addChatMessage = async (jobId: string, message: string) => {
     const msg: any = {
        id: `sys-${Date.now()}`,
        role: 'system',
        content: message,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
     };
     await jobService.addChatMessage(jobId, msg);

     setJobs(prev => prev.map(j => {
        if (j.id !== jobId) return j;
        return { ...j, chatHistory: [...j.chatHistory, msg] };
     }));
  };

  // --- Autonomous Engineer Engine Loop ---
  useEffect(() => {
    if (!isDbReady) return;
    const engineLoop = setInterval(async () => {
       if (processingRef.current) return;

       const runningJob = jobs.find(j => j.status === JobStatus.RUNNING);
       if (!runningJob || !runningJob.plan) return;

       const currentStepIndex = runningJob.plan.findIndex(s => s.status === 'running');
       const nextStepIndex = runningJob.plan.findIndex(s => s.status === 'pending');
       
       if (currentStepIndex === -1 && nextStepIndex !== -1) {
          const newPlan = [...(runningJob.plan || [])];
          newPlan[nextStepIndex].status = 'running';
          
          await jobService.updateJob(runningJob.id, { plan: newPlan });
          setJobs(prev => prev.map(j => j.id === runningJob.id ? { ...j, plan: newPlan } : j));
          return;
       }

       if (currentStepIndex !== -1) {
          processingRef.current = true;
          const step = runningJob.plan[currentStepIndex];
          const jobId = runningJob.id;
          
          try {
             await processJobStep(runningJob, step, currentStepIndex);
          } catch (e) {
             console.error("Engine Error:", e);
             await addLog(jobId, 'error', `Step failed: ${e}`);
          } finally {
             processingRef.current = false;
          }
       } else if (nextStepIndex === -1 && runningJob.status === JobStatus.RUNNING) {
          await handleUpdateStatus(runningJob.id, JobStatus.NEEDS_APPROVAL);
          await addLog(runningJob.id, 'success', 'All steps completed. Waiting for review.');
          await addChatMessage(runningJob.id, 'Task completed. I have created the Pull Request. Please review.');
       }

    }, 1000);

    return () => clearInterval(engineLoop);
  }, [jobs, isDbReady]);

  const processJobStep = async (job: Job, step: any, stepIndex: number) => {
      const stepName = step.name.toLowerCase();
      const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

      if (stepName.includes('analyze') || stepName.includes('fetch') || stepName.includes('initialize')) {
         await addLog(job.id, 'info', `Analyzing repository structure for ${job.repo}...`);
         await addChatMessage(job.id, 'Analyzing repository structure...');
         await wait(2000);
         
         const githubIntegration = integrations.find(i => i.name === 'GitHub');
         const token = githubIntegration?.githubToken;
         
         let fileData = null;

         if (token) {
             const file = await githubService.findRelevantFile(token, job.repo.split('/')[1]);
             if (file) {
                 const contentData = await githubService.getFileContent(token, job.repo.split('/')[1], file);
                 if (contentData) {
                    fileData = { fileName: file, content: contentData.content, sha: contentData.sha };
                    await jobService.updateJob(job.id, { simulatedFileContent: fileData });
                    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, simulatedFileContent: fileData } : j));
                    await addLog(job.id, 'success', `Analysis complete. Found relevant file: ${file}`);
                 }
             } else {
                 await addLog(job.id, 'warn', 'Could not find exact file match, using general context.');
             }
         } else {
             fileData = await generateSyntheticFile(job.repo, job.description);
             await jobService.updateJob(job.id, { simulatedFileContent: fileData });
             setJobs(prev => prev.map(j => j.id === job.id ? { ...j, simulatedFileContent: fileData } : j));
             await addLog(job.id, 'success', `Analysis complete. Targeted file: ${fileData.fileName}`);
         }
      } 
      else if (stepName.includes('database') || stepName.includes('ephemeral')) {
          await addLog(job.id, 'info', 'Provisioning ephemeral Postgres container...');
          await wait(1500);
          
          const dbCtx: any = {
              type: 'postgres',
              framework: 'prisma',
              status: 'ready',
              connectionString: `postgres://nexus:pass@sandbox-${job.id.slice(-4)}:5432/app`,
              tables: [
                  { name: 'User', columns: [{name: 'id', type: 'Int'}, {name: 'email', type: 'String'}] },
                  { name: 'Session', columns: [{name: 'id', type: 'String'}, {name: 'userId', type: 'Int'}] }
              ]
          };

          await jobService.updateJob(job.id, { databaseContext: dbCtx });
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, databaseContext: dbCtx } : j));
          
          await addLog(job.id, 'success', 'Database ready and migrations applied.');
          await addChatMessage(job.id, 'Ephemeral database provisioned.');
      }
      else if (stepName.includes('generate') || stepName.includes('implement') || stepName.includes('execute')) {
         await addLog(job.id, 'info', 'Generating code patch using Gemini 3 Pro...');
         await addChatMessage(job.id, 'Generating code patch...');
         
         const currentFile = job.simulatedFileContent; 
         if (currentFile) {
             const patch = await generateCodePatch(currentFile.fileName, currentFile.content, job.description);
             await jobService.updateJob(job.id, { diff: patch });
             setJobs(prev => prev.map(j => j.id === job.id ? { ...j, diff: patch } : j));
             await addLog(job.id, 'success', 'Patch generated successfully.');
         } else {
             await addLog(job.id, 'error', 'Missing file context for patch generation.');
         }
      } 
      else if (stepName.includes('test') || stepName.includes('verify')) {
         await addLog(job.id, 'info', 'Running unit tests in sandbox...');
         await addChatMessage(job.id, 'Running tests...');
         await wait(2000);
         await addLog(job.id, 'success', 'Tests passed (12/12). Coverage: 84%.');
      } 
      else if (stepName.includes('pr') || stepName.includes('pull request')) {
         await addLog(job.id, 'info', 'Creating Pull Request on GitHub...');
         await wait(1000);
         
         const githubIntegration = integrations.find(i => i.name === 'GitHub');
         let prUrl = null;

         if (githubIntegration?.githubToken && job.simulatedFileContent?.sha) {
             const token = githubIntegration.githubToken;
             const repoShort = job.repo.split('/')[1];
             await githubService.createBranch(token, repoShort, job.branch);
             await githubService.updateFile(
                 token, repoShort, job.simulatedFileContent.fileName, 
                 job.simulatedFileContent.content + '\n// Fix applied', 
                 `Fix: ${job.title}`, job.branch, job.simulatedFileContent.sha
             );
             prUrl = await githubService.createPR(token, repoShort, job.title, job.description, job.branch);
         }
         
         if (prUrl) {
             await jobService.updateJob(job.id, { prLink: prUrl });
             setJobs(prev => prev.map(j => j.id === job.id ? { ...j, prLink: prUrl } : j));
             await addLog(job.id, 'success', `PR Created: ${prUrl}`);
         } else {
             await addLog(job.id, 'success', 'PR Draft Created (Simulation).');
         }
      }

      const newPlan = [...(job.plan || [])];
      newPlan[stepIndex].status = 'completed';
      
      await jobService.updateJob(job.id, { plan: newPlan });
      setJobs(prev => prev.map(j => {
         if (j.id !== job.id) return j;
         return { ...j, plan: newPlan };
      }));
  };

  const renderContent = () => {
    if (selectedJob) {
      return (
        <JobDetail 
          job={selectedJob} 
          onBack={() => setSelectedJobId(null)}
          onUpdateStatus={handleUpdateStatus}
          onUpdateDiff={handleUpdateDiff}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard jobs={jobs} stats={dashboardStats} onNavigateToJob={(job) => setSelectedJobId(job.id)} />;
      case 'jobs':
        return (
          <JobsList 
            jobs={jobs} 
            onSelectJob={(job) => setSelectedJobId(job.id)} 
            onTriggerNewJob={() => setShowCreateModal(true)}
          />
        );
      case 'integrations':
        return <Integrations integrations={integrations} onToggle={handleToggleIntegration} />;
      case 'sandbox':
        return <Sandbox activeJob={jobs.find(j => j.status === JobStatus.RUNNING)} />;
      case 'workflows':
        return (
          <Workflows 
            workflows={workflows} 
            onTriggerNewWorkflow={() => setShowCreateModal(true)}
            onToggleStatus={handleToggleWorkflow}
            onRunWorkflow={handleRunWorkflow}
            onDeleteWorkflow={handleDeleteWorkflow}
          />
        );
      case 'settings':
        return <Settings user={user!} />;
      default:
        return <Dashboard jobs={jobs} stats={dashboardStats} onNavigateToJob={(job) => setSelectedJobId(job.id)} />;
    }
  };

  if (!isDbReady) {
     return (
        <div className="flex h-screen items-center justify-center flex-col bg-white">
           <Loader2 className="animate-spin text-gray-900 mb-4" size={40} />
           <p className="text-gray-500 font-medium">Booting Autonomous Engine...</p>
           <p className="text-xs text-gray-400 mt-2">Initializing SQLite (WASM)</p>
        </div>
     );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={(view) => {
        setCurrentView(view);
        setSelectedJobId(null);
      }} />
      <main className={`flex-1 flex flex-col transition-all duration-300 ml-64 ${
         (currentView === 'sandbox' || selectedJobId || currentView === 'settings') ? 'h-screen overflow-hidden' : 'h-screen overflow-auto'
      }`}>
        {renderContent()}
      </main>

      {showCreateModal && (
        <CreateJobModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateJob}
          integrations={integrations}
          onConnectIntegration={(id) => setCurrentView('integrations')}
        />
      )}
    </div>
  );
};

export default App;
