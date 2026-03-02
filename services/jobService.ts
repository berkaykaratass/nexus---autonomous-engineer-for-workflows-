
import { Job, LogEntry, ChatMessage, ApiResponse } from '../types';
import { dbQuery, dbExec } from './db';

export const jobService = {
  
  getAllJobs: async (userId: string): Promise<ApiResponse<Job[]>> => {
    const rows = dbQuery("SELECT * FROM jobs WHERE userId = ? ORDER BY createdAt DESC", [userId]);
    
    // Hydrate JSON fields
    const jobs = rows.map((row: any) => ({
      ...row,
      logs: JSON.parse(row.logs || '[]'),
      plan: JSON.parse(row.plan || '[]'),
      chatHistory: JSON.parse(row.chatHistory || '[]'),
      simulatedFileContent: row.simulatedFileContent ? JSON.parse(row.simulatedFileContent) : undefined,
      databaseContext: row.databaseContext ? JSON.parse(row.databaseContext) : undefined
    }));

    return { success: true, data: jobs };
  },

  getJobById: async (id: string): Promise<ApiResponse<Job>> => {
    // We assume ID is unique enough, but could check user if strict
    const rows = dbQuery("SELECT * FROM jobs WHERE id = ?", [id]);
    if (rows.length === 0) return { success: false, error: 'Job not found' };
    
    const row = rows[0];
    const job = {
      ...row,
      logs: JSON.parse(row.logs || '[]'),
      plan: JSON.parse(row.plan || '[]'),
      chatHistory: JSON.parse(row.chatHistory || '[]'),
      simulatedFileContent: row.simulatedFileContent ? JSON.parse(row.simulatedFileContent) : undefined,
      databaseContext: row.databaseContext ? JSON.parse(row.databaseContext) : undefined
    };

    return { success: true, data: job };
  },

  createJob: async (job: Job, userId: string): Promise<ApiResponse<Job>> => {
    const success = dbExec(`INSERT INTO jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      job.id, userId, job.title, job.repo, job.type, job.status, job.branch, job.createdAt, job.description,
      job.prLink || null,
      JSON.stringify(job.logs || []),
      job.diff || null,
      JSON.stringify(job.plan || []),
      JSON.stringify(job.chatHistory || []),
      job.triggerSource || null,
      JSON.stringify(job.simulatedFileContent || null),
      JSON.stringify(job.databaseContext || null)
    ]);
    
    return success ? { success: true, data: job } : { success: false, error: 'DB Error' };
  },

  updateJob: async (id: string, updates: Partial<Job>): Promise<ApiResponse<Job>> => {
    // Construct dynamic SQL update
    const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'userId');
    if (keys.length === 0) return { success: true };

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => {
       const val = (updates as any)[k];
       return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
    });

    const success = dbExec(`UPDATE jobs SET ${setClause} WHERE id = ?`, [...values, id]);
    
    if (success) {
      // Return updated job
      return jobService.getJobById(id);
    }
    return { success: false, error: 'Update failed' };
  },

  addLog: async (jobId: string, log: LogEntry): Promise<ApiResponse<void>> => {
    const jobRes = await jobService.getJobById(jobId);
    if (!jobRes.success || !jobRes.data) return { success: false };
    
    const newLogs = [...jobRes.data.logs, log];
    dbExec("UPDATE jobs SET logs = ? WHERE id = ?", [JSON.stringify(newLogs), jobId]);
    return { success: true };
  },

  addChatMessage: async (jobId: string, message: ChatMessage): Promise<ApiResponse<void>> => {
    const jobRes = await jobService.getJobById(jobId);
    if (!jobRes.success || !jobRes.data) return { success: false };

    const newHistory = [...jobRes.data.chatHistory, message];
    dbExec("UPDATE jobs SET chatHistory = ? WHERE id = ?", [JSON.stringify(newHistory), jobId]);
    return { success: true };
  }
};
