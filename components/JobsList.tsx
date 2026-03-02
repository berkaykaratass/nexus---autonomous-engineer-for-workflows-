import React from 'react';
import { Job, JobStatus, JobType } from '../types';
import { GitPullRequest, AlertCircle, CheckCircle2, Clock, Plus } from 'lucide-react';

interface JobsListProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onTriggerNewJob?: () => void;
}

const JobsList: React.FC<JobsListProps> = ({ jobs, onSelectJob, onTriggerNewJob }) => {
  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={12} /> Completed</span>;
      case JobStatus.FAILED:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"><AlertCircle size={12} /> Failed</span>;
      case JobStatus.NEEDS_APPROVAL:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><GitPullRequest size={12} /> Review</span>;
      case JobStatus.PLANNING:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"><Clock size={12} /> Planning</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200"><Clock size={12} /> Running</span>;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflows</h2>
          <p className="text-gray-500 text-sm">Manage your autonomous agents and tasks.</p>
        </div>
        <button 
          onClick={onTriggerNewJob}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={16} />
          New Workflow
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="px-6 py-3 font-medium">Job Details</th>
              <th className="px-6 py-3 font-medium">Repository</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job) => (
              <tr 
                key={job.id} 
                onClick={() => onSelectJob(job)}
                className="hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 group-hover:text-primary-600">{job.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{job.id}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{job.repo}</td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                    {job.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(job.status)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">
                  {new Date(job.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No active jobs found.
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsList;