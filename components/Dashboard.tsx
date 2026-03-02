
import React from 'react';
import { Job, JobStatus, DashboardStats } from '../types';
import { Activity, GitMerge, CheckCircle2, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  jobs: Job[];
  stats: DashboardStats | null;
  onNavigateToJob: (job: Job) => void;
}

const data = [
  { name: 'Mon', jobs: 4, automated: 2 },
  { name: 'Tue', jobs: 7, automated: 5 },
  { name: 'Wed', jobs: 5, automated: 4 },
  { name: 'Thu', jobs: 12, automated: 10 },
  { name: 'Fri', jobs: 9, automated: 7 },
  { name: 'Sat', jobs: 3, automated: 3 },
  { name: 'Sun', jobs: 2, automated: 2 },
];

const Dashboard: React.FC<DashboardProps> = ({ jobs, stats, onNavigateToJob }) => {
  const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  if (!stats) {
     return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32}/></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Good morning, Darren</h2>
          <p className="text-gray-500">Here is what your AI engineers are working on today.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm font-medium">Active Workflows</span>
            <Activity className="text-gray-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.activeJobs}</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm font-medium">Pending Review</span>
            <GitMerge className="text-gray-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.criticalIssues}</div>
          {stats.criticalIssues > 0 && <div className="text-blue-600 text-xs mt-2 font-medium">Requires attention</div>}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm font-medium">Hours Saved</span>
            <Zap className="text-gray-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.hoursSaved}h</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm font-medium">PRs Merged</span>
            <CheckCircle2 className="text-gray-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.prsMerged}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-900">Recent Workflow Activity</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentJobs.map(job => (
              <div 
                key={job.id} 
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
                onClick={() => onNavigateToJob(job)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    job.status === JobStatus.COMPLETED ? 'bg-green-50 border-green-200 text-green-600' :
                    job.status === JobStatus.NEEDS_APPROVAL ? 'bg-blue-50 border-blue-200 text-blue-600' :
                    job.status === JobStatus.FAILED ? 'bg-red-50 border-red-200 text-red-600' : 
                    'bg-yellow-50 border-yellow-200 text-yellow-600'
                  }`}>
                    {job.status === JobStatus.COMPLETED ? <CheckCircle2 size={16} /> : <Activity size={16} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      {job.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{job.repo}</span>
                      <span>•</span>
                      <span>{job.branch}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</span>
                  <ArrowRight className="text-gray-300 group-hover:text-gray-500 transition-colors w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">Automation Velocity</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="jobs" fill="#e5e7eb" radius={[4, 4, 4, 4]} name="Total Tasks" />
                <Bar dataKey="automated" fill="#111827" radius={[4, 4, 4, 4]} name="Fully Automated" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
