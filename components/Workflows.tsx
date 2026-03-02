
import React, { useState } from 'react';
import { Workflow } from '../types';
import { Clock, Zap, MoreHorizontal, Plus, Play, Trash2, Pause, PlayCircle } from 'lucide-react';

interface WorkflowsProps {
   workflows: Workflow[]; 
   onTriggerNewWorkflow: () => void;
   onToggleStatus: (id: string) => void;
   onRunWorkflow: (workflow: Workflow) => void;
   onDeleteWorkflow: (id: string) => void;
}

const Workflows: React.FC<WorkflowsProps> = ({ 
  workflows, 
  onTriggerNewWorkflow, 
  onToggleStatus,
  onRunWorkflow,
  onDeleteWorkflow
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-300 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflows</h2>
          <p className="text-gray-500 text-sm">Automate recurring tasks and event-based triggers.</p>
        </div>
        <button 
          onClick={onTriggerNewWorkflow}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> New Workflow
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Repo</th>
                  <th className="px-6 py-4">Trigger</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Run</th>
                  <th className="px-6 py-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {workflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50 transition-colors group">
                     <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{workflow.name}</div>
                     </td>
                     <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {workflow.repo || 'N/A'}
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                           {workflow.trigger === 'cron' ? <Clock size={16} className="text-gray-400" /> : <Zap size={16} className="text-yellow-500" />}
                           <span>{workflow.trigger === 'cron' ? workflow.schedule : workflow.event}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus(workflow.id);
                              }}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${workflow.status === 'active' ? 'bg-green-500' : 'bg-gray-200'}`}
                           >
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${workflow.status === 'active' ? 'translate-x-5' : 'translate-x-1'}`} />
                           </button>
                           <span className="text-sm text-gray-500 capitalize w-14">{workflow.status}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-sm text-gray-500">
                        {workflow.lastRun || 'Never'}
                     </td>
                     <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => handleMenuClick(e, workflow.id)}
                          className="text-gray-400 hover:text-gray-900 p-1 rounded transition-colors"
                        >
                           <MoreHorizontal size={20} />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === workflow.id && (
                           <div className="absolute right-8 top-8 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                              <button 
                                onClick={() => onRunWorkflow(workflow)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2"
                              >
                                 <PlayCircle size={14} className="text-green-600" /> Run Now
                              </button>
                              <button 
                                onClick={() => onToggleStatus(workflow.id)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2"
                              >
                                 {workflow.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                 {workflow.status === 'active' ? 'Pause' : 'Resume'}
                              </button>
                              <div className="h-px bg-gray-100 my-1" />
                              <button 
                                onClick={() => onDeleteWorkflow(workflow.id)}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                 <Trash2 size={14} /> Delete
                              </button>
                           </div>
                        )}
                     </td>
                  </tr>
               ))}
               {workflows.length === 0 && (
                  <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                        <div className="flex flex-col items-center gap-3">
                           <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Zap className="text-gray-400" size={24} />
                           </div>
                           <p>No active workflows found.</p>
                           <p className="text-xs text-gray-400">Create a new workflow to automate your tasks.</p>
                        </div>
                     </td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Workflows;
