
import { Workflow, ApiResponse } from '../types';
import { dbQuery, dbExec } from './db';

export const workflowService = {
  getWorkflows: async (userId: string): Promise<ApiResponse<Workflow[]>> => {
    const rows = dbQuery("SELECT * FROM workflows WHERE userId = ?", [userId]);
    return { success: true, data: rows as Workflow[] };
  },

  toggleWorkflow: async (id: string): Promise<ApiResponse<Workflow>> => {
    const rows = dbQuery("SELECT * FROM workflows WHERE id = ?", [id]);
    if (rows.length === 0) return { success: false, error: 'Not found' };
    
    const wf = rows[0] as Workflow;
    const newStatus = wf.status === 'active' ? 'paused' : 'active';
    
    dbExec("UPDATE workflows SET status = ? WHERE id = ?", [newStatus, id]);
    return { success: true, data: { ...wf, status: newStatus } };
  },

  createWorkflow: async (workflow: Workflow, userId: string): Promise<ApiResponse<Workflow>> => {
    const success = dbExec("INSERT INTO workflows VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      workflow.id, userId, workflow.name, workflow.repo, workflow.trigger, 
      workflow.schedule || null, workflow.event || null, workflow.status, workflow.lastRun || null
    ]);
    return success ? { success: true, data: workflow } : { success: false, error: 'DB Error' };
  },

  deleteWorkflow: async (id: string): Promise<ApiResponse<void>> => {
    dbExec("DELETE FROM workflows WHERE id = ?", [id]);
    return { success: true };
  }
};
