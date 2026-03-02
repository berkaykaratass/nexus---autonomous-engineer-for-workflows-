
import { 
  ProjectSettings, 
  UsageStats, 
  AuditLog, 
  RepoSettings, 
  SandboxConfig, 
  DatabaseSettings, 
  Secret, 
  ApiResponse 
} from '../types';
import { dbQuery, dbExec } from './db';

// Defaults
const DEFAULT_USAGE: UsageStats = {
  sandboxMinutesUsed: 0,
  sandboxMinutesLimit: 1000,
  storageUsedMB: 0,
  storageLimitMB: 5000
};

const DEFAULT_SANDBOX: SandboxConfig = {
  enabled: true,
  runtime: 'nodejs-18',
  maxExecutionTimeSec: 60,
  memoryLimitMB: 2048
};

const DEFAULT_DB_SETTINGS: DatabaseSettings = {
  autoDetectOrm: true,
  detectedFramework: 'none', // Default none until run
  dbType: 'postgres',
  dbStatus: 'stopped',
  port: 5432
};

const DEFAULT_REPO: RepoSettings = {
  connectedRepo: 'Not Connected',
  defaultBranch: 'main',
  syncStatus: 'error',
  lastSyncTime: '',
  autoSync: false
};

export const settingsService = {
  
  getProject: async (userId: string): Promise<ApiResponse<ProjectSettings>> => {
    const rows = dbQuery("SELECT data FROM project_settings WHERE userId = ?", [userId]);
    if (rows.length > 0) return { success: true, data: JSON.parse(rows[0].data) };
    
    // Default for new user
    const defaultProj = {
      id: `proj_${Date.now()}`,
      name: 'My Workspace',
      description: 'Autonomous engineering workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbExec("INSERT INTO project_settings VALUES (?, ?)", [userId, JSON.stringify(defaultProj)]);
    return { success: true, data: defaultProj };
  },

  updateProject: async (data: Partial<ProjectSettings>, userId: string): Promise<ApiResponse<ProjectSettings>> => {
    const current = await settingsService.getProject(userId);
    if (!current.data) return { success: false };
    
    const updated = { ...current.data, ...data, updatedAt: new Date().toISOString() };
    dbExec("UPDATE project_settings SET data = ? WHERE userId = ?", [JSON.stringify(updated), userId]);
    
    await settingsService.createAuditLog(userId, 'Update Project Settings');
    return { success: true, data: updated };
  },

  getUsage: async (): Promise<ApiResponse<UsageStats>> => {
    return { success: true, data: DEFAULT_USAGE };
  },

  getAuditLogs: async (userId: string): Promise<ApiResponse<AuditLog[]>> => {
    const rows = dbQuery("SELECT * FROM audit_logs WHERE userId = ? ORDER BY timestamp DESC", [userId]);
    return { success: true, data: rows as AuditLog[] };
  },

  createAuditLog: async (userId: string, action: string, details?: string) => {
    // Need user name, could fetch or pass in. Simulating fetching user for log
    const u = dbQuery("SELECT name FROM users WHERE id = ?", [userId]);
    const name = u.length ? u[0].name : 'Unknown';

    dbExec("INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?)", [
      Date.now().toString(), userId, name, action, details || null, new Date().toISOString()
    ]);
  },

  getRepoSettings: async (): Promise<ApiResponse<RepoSettings>> => {
    return { success: true, data: DEFAULT_REPO };
  },

  resyncRepo: async (userId: string): Promise<ApiResponse<RepoSettings>> => {
    await new Promise(r => setTimeout(r, 2000));
    await settingsService.createAuditLog(userId, 'Resync Repository');
    return { success: true, data: { ...DEFAULT_REPO, lastSyncTime: new Date().toISOString(), syncStatus: 'synced' } };
  },

  getSandboxConfig: async (): Promise<ApiResponse<SandboxConfig>> => {
    return { success: true, data: DEFAULT_SANDBOX };
  },

  resetSandbox: async (userId: string): Promise<ApiResponse<void>> => {
    await new Promise(r => setTimeout(r, 1500));
    await settingsService.createAuditLog(userId, 'Reset Sandbox');
    return { success: true };
  },

  getDatabaseSettings: async (): Promise<ApiResponse<DatabaseSettings>> => {
    return { success: true, data: DEFAULT_DB_SETTINGS };
  },

  runMigrations: async (userId: string): Promise<ApiResponse<string>> => {
    await new Promise(r => setTimeout(r, 2000));
    await settingsService.createAuditLog(userId, 'Run DB Migrations');
    return { success: true, data: 'Applied migrations.' };
  },

  resetDatabase: async (userId: string): Promise<ApiResponse<string>> => {
    await new Promise(r => setTimeout(r, 2000));
    await settingsService.createAuditLog(userId, 'Reset Ephemeral DB');
    return { success: true, data: 'Database dropped.' };
  },

  seedDatabase: async (userId: string): Promise<ApiResponse<string>> => {
    await new Promise(r => setTimeout(r, 1000));
    await settingsService.createAuditLog(userId, 'Seed Database');
    return { success: true, data: 'Seeded.' };
  },

  getSecrets: async (userId: string): Promise<ApiResponse<Secret[]>> => {
    const rows = dbQuery("SELECT * FROM secrets WHERE userId = ?", [userId]);
    return { success: true, data: rows as Secret[] };
  },

  addSecret: async (key: string, value: string, userId: string): Promise<ApiResponse<Secret>> => {
    const newSecret = {
      id: Date.now().toString(),
      key: key.toUpperCase(),
      value,
      createdAt: new Date().toISOString()
    };
    dbExec("INSERT INTO secrets VALUES (?, ?, ?, ?, ?)", [newSecret.id, userId, newSecret.key, newSecret.value, newSecret.createdAt]);
    await settingsService.createAuditLog(userId, 'Add Secret', `Key: ${key}`);
    return { success: true, data: newSecret };
  },

  deleteSecret: async (id: string, userId: string): Promise<ApiResponse<void>> => {
    const s = dbQuery("SELECT key FROM secrets WHERE id = ?", [id]);
    const keyName = s.length ? s[0].key : 'Unknown';
    dbExec("DELETE FROM secrets WHERE id = ?", [id]);
    await settingsService.createAuditLog(userId, 'Delete Secret', `Key: ${keyName}`);
    return { success: true };
  }
};
