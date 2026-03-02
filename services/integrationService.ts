
import { Integration, ApiResponse } from '../types';
import { INTEGRATIONS } from '../utils/mockData';
import { dbQuery, dbExec } from './db';

export const integrationService = {
  getIntegrations: async (userId: string): Promise<ApiResponse<Integration[]>> => {
    const rows = dbQuery("SELECT * FROM integrations WHERE userId = ?", [userId]);
    
    if (rows.length === 0) {
       // New user: Seed default integrations (disconnected)
       const defaults = INTEGRATIONS.map(i => ({...i, id: `${i.id}_${userId}`, status: 'disconnected' as const}));
       
       defaults.forEach(int => {
          // FIXED: Removed extra '?' to match 9 columns
          dbExec("INSERT INTO integrations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
             int.id, userId, int.name, int.type, int.status, int.icon, int.description, null, null
          ]);
       });
       return { success: true, data: defaults as Integration[] };
    }

    return { success: true, data: rows as Integration[] };
  },

  toggleConnection: async (id: string, token?: string): Promise<ApiResponse<Integration>> => {
    const rows = dbQuery("SELECT * FROM integrations WHERE id = ?", [id]);
    if (rows.length === 0) return { success: false, error: 'Not found' };
    
    const int = rows[0] as Integration;
    const newStatus = int.status === 'connected' ? 'disconnected' : 'connected';
    
    let newToken = int.githubToken;
    let newKey = int.apiKey;

    if (newStatus === 'connected' && token) {
       if (int.name === 'GitHub') newToken = token;
       else newKey = token;
    }

    dbExec("UPDATE integrations SET status = ?, githubToken = ?, apiKey = ? WHERE id = ?", [
       newStatus, newToken, newKey, id
    ]);

    return { 
       success: true, 
       data: { ...int, status: newStatus, githubToken: newToken, apiKey: newKey } 
    };
  }
};
