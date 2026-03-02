
import { DashboardStats, JobStatus, ApiResponse } from '../types';
import { jobService } from './jobService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dashboardService = {
  getStats: async (userId: string): Promise<ApiResponse<DashboardStats>> => {
    await delay(400);
    
    // Get actual jobs from DB for this user
    const jobsRes = await jobService.getAllJobs(userId);
    const jobs = jobsRes.data || [];

    const active = jobs.filter(j => j.status === JobStatus.RUNNING || j.status === JobStatus.PENDING || j.status === JobStatus.PLANNING).length;
    const merged = jobs.filter(j => j.status === JobStatus.COMPLETED).length;
    const critical = jobs.filter(j => j.status === JobStatus.NEEDS_APPROVAL).length;
    
    // Calculate hours saved: Assume avg 2.5 hours saved per completed job
    const hoursSaved = merged * 2.5; 

    return {
      success: true,
      data: {
        activeJobs: active,
        prsMerged: merged,
        criticalIssues: critical,
        hoursSaved: Math.floor(hoursSaved)
      }
    };
  }
};
