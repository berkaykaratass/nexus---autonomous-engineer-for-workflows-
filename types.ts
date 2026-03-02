
export enum JobStatus {
  PENDING = 'PENDING',
  PLANNING = 'PLANNING',
  RUNNING = 'RUNNING',
  NEEDS_APPROVAL = 'NEEDS_APPROVAL',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum JobType {
  BUG_FIX = 'BUG_FIX',
  REFACTOR = 'REFACTOR',
  FEATURE = 'FEATURE',
  TEST_GEN = 'TEST_GEN',
  SECURITY_PATCH = 'SECURITY_PATCH'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface JobStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeSnippet?: {
    file: string;
    code: string;
    language: string;
  };
  // If the bot proposes a new diff based on feedback
  newDiff?: string;
}

export interface DatabaseTable {
  name: string;
  columns: { name: string; type: string }[];
}

export interface DatabaseContext {
  type: 'postgres' | 'mysql' | 'mongodb';
  framework: 'prisma' | 'typeorm' | 'sequelize' | 'django' | 'none';
  status: 'stopped' | 'starting' | 'ready' | 'migrating';
  containerId?: string;
  connectionString?: string;
  tables?: DatabaseTable[];
}

export interface Job {
  id: string;
  title: string;
  repo: string;
  type: JobType;
  status: JobStatus;
  branch: string;
  createdAt: string;
  description: string;
  prLink?: string;
  logs: LogEntry[];
  diff?: string;
  aiAnalysis?: string;
  confidenceScore?: number;
  plan?: JobStep[];
  chatHistory: ChatMessage[];
  triggerSource?: 'manual' | 'sentry' | 'github' | 'slack';
  simulatedFileContent?: {
    fileName: string;
    content: string;
    sha?: string; // GitHub SHA for updates
  };
  databaseContext?: DatabaseContext;
}

export interface Integration {
  id: string;
  name: string;
  type: 'scm' | 'issue' | 'monitoring' | 'ci';
  status: 'connected' | 'disconnected';
  icon: string;
  description: string;
  githubToken?: string; // Store PAT securely in memory
  apiKey?: string; // Generic API key for other services
}

export interface Workflow {
  id: string;
  name: string;
  repo: string;
  trigger: 'cron' | 'event';
  schedule?: string; // e.g., "Every night at 12am"
  event?: string; // e.g., "On PR Created"
  status: 'active' | 'paused';
  lastRun?: string;
}

export interface DashboardStats {
  activeJobs: number;
  prsMerged: number;
  criticalIssues: number;
  hoursSaved: number;
}

// --- SETTINGS API TYPES ---

export interface ProjectSettings {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  sandboxMinutesUsed: number;
  sandboxMinutesLimit: number;
  storageUsedMB: number;
  storageLimitMB: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface RepoSettings {
  connectedRepo: string;
  defaultBranch: string;
  syncStatus: 'synced' | 'syncing' | 'error';
  lastSyncTime: string;
  autoSync: boolean;
}

export interface SandboxConfig {
  enabled: boolean;
  runtime: string; // 'nodejs-18', 'python-3.11'
  maxExecutionTimeSec: number;
  memoryLimitMB: number;
}

export interface DatabaseSettings {
  autoDetectOrm: boolean;
  detectedFramework: 'prisma' | 'typeorm' | 'django' | 'none';
  dbType: 'postgres' | 'mysql';
  dbStatus: 'running' | 'stopped';
  port: number;
}

export interface Secret {
  id: string;
  key: string;
  value: string; // Will be masked on retrieval
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}