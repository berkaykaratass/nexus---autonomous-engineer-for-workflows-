
import { Job, JobStatus, JobType, Integration, Workflow } from '../types';

export const MOCK_LOGS = [
  { id: '1', timestamp: '10:00:01', level: 'info' as const, message: 'Job initialized. Cloning repository...' },
  { id: '2', timestamp: '10:00:05', level: 'info' as const, message: 'Repository cloned. Analyzing dependency tree.' },
  { id: '3', timestamp: '10:00:12', level: 'info' as const, message: 'Detected framework: Next.js v14' },
  { id: '4', timestamp: '10:00:15', level: 'success' as const, message: 'Environment verification passed.' },
];

export const MOCK_DIFF = `diff --git a/src/auth/session.ts b/src/auth/session.ts
index 83a12f..92b11a 100644
--- a/src/auth/session.ts
+++ b/src/auth/session.ts
@@ -14,7 +14,9 @@ export const getSession = async (req: Request) => {
   
   const token = req.headers.get('authorization');
-  if (!token) return null;
+  if (!token || !token.startsWith('Bearer ')) {
+    return null;
+  }
 
-  const session = await verifyToken(token);
+  const session = await verifyToken(token.split(' ')[1]);
   return session;
 }`;

export const MOCK_WORKFLOWS: Workflow[] = [
  { id: '1', name: 'Nightly Security Scan', repo: 'nexus-io/platform-api', trigger: 'cron', schedule: 'Every day at 02:00 UTC', status: 'active', lastRun: '2 hours ago' },
  { id: '2', name: 'Auto-Fix Linear Issues', repo: 'nexus-io/frontend', trigger: 'event', event: 'Issue labeled "bug"', status: 'active', lastRun: '10 mins ago' },
  { id: '3', name: 'Dependency Update', repo: 'nexus-io/backend', trigger: 'cron', schedule: 'Weekly on Monday', status: 'paused', lastRun: '5 days ago' },
  { id: '4', name: 'Database Optimization', repo: 'nexus-io/core-api', trigger: 'cron', schedule: 'Every Sunday at 00:00', status: 'active', lastRun: '3 days ago' }
];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-123',
    title: 'Fix NullPointerException in Auth Middleware',
    repo: 'nexus-io/platform-api',
    type: JobType.BUG_FIX,
    status: JobStatus.NEEDS_APPROVAL,
    branch: 'fix/auth-npe-882',
    createdAt: '2023-10-27T09:30:00Z',
    description: 'Sentry Issue #4421: NPE occurs when authorization header is malformed. The agent has identified the missing check and proposed a patch.',
    prLink: 'https://github.com/acme/platform-api/pull/882',
    confidenceScore: 94,
    chatHistory: [
      {
        id: 'c1',
        role: 'user',
        content: '@nexus can you fix this issue?',
        timestamp: '10:30 AM'
      },
      {
        id: 'c2',
        role: 'assistant',
        content: 'I analyzed the Sentry trace. It seems `token` can be null or malformed in `session.ts`. I have added a guard clause to handle the `Bearer` prefix validation.',
        timestamp: '10:31 AM',
        codeSnippet: {
          file: 'src/auth/session.ts',
          language: 'typescript',
          code: '+ if (!token || !token.startsWith(\'Bearer \')) {\n+   return null;\n+ }'
        }
      }
    ],
    plan: [
      { id: '1', name: 'Reproduce Issue', status: 'completed', description: 'Created reproduction script repro.ts' },
      { id: '2', name: 'Analyze Root Cause', status: 'completed', description: 'Identified missing null check in session.ts' },
      { id: '3', name: 'Generate Patch', status: 'completed', description: 'Applied safe navigation checks' },
      { id: '4', name: 'Run Sandbox Tests', status: 'completed', description: 'Passed 14/14 unit tests' },
      { id: '5', name: 'Create Pull Request', status: 'completed', description: 'PR #882 created for review' }
    ],
    logs: [
        ...MOCK_LOGS,
        { id: '5', timestamp: '10:00:20', level: 'info' as const, message: 'Running reproduction script...' },
        { id: '6', timestamp: '10:00:25', level: 'success' as const, message: 'Issue reproduced. Creating fix...' },
        { id: '7', timestamp: '10:00:40', level: 'info' as const, message: 'Running unit tests against sandbox...' },
        { id: '8', timestamp: '10:01:00', level: 'success' as const, message: 'All tests passed. PR created.' },
    ],
    diff: MOCK_DIFF
  },
  {
    id: 'job-124',
    title: 'Generate weekly changelog',
    repo: 'nexus-io/docs',
    type: JobType.FEATURE,
    status: JobStatus.RUNNING,
    branch: 'chore/changelog-update',
    createdAt: '2023-10-27T10:15:00Z',
    description: 'Generate a weekly changelog from merged PRs.',
    confidenceScore: 85,
    chatHistory: [],
    plan: [
      { id: '1', name: 'Fetch Merged PRs', status: 'completed', description: 'Retrieved 12 PRs from GitHub' },
      { id: '2', name: 'Categorize Changes', status: 'running', description: 'Grouping by Feature, Bugfix, Chore' },
      { id: '3', name: 'Update Notion', status: 'pending', description: 'Write to Engineering Wiki' }
    ],
    logs: [
        { id: '1', timestamp: '10:15:01', level: 'info' as const, message: 'Connecting to GitHub API...' },
        { id: '2', timestamp: '10:15:10', level: 'info' as const, message: 'Filtering PRs by merge date > last_week' },
    ]
  },
  {
    id: 'job-125',
    title: 'Add tests for BillingService',
    repo: 'nexus-io/billing-worker',
    type: JobType.TEST_GEN,
    status: JobStatus.COMPLETED,
    branch: 'test/billing-coverage',
    createdAt: '2023-10-26T14:00:00Z',
    description: 'Coverage was below 50%. Agent generated tests for edge cases in currency conversion.',
    prLink: '#',
    confidenceScore: 98,
    chatHistory: [],
    logs: []
  },
  {
    id: 'job-126',
    title: 'Optimize User Query Performance',
    repo: 'nexus-io/core-api',
    type: JobType.REFACTOR,
    status: JobStatus.RUNNING,
    branch: 'perf/user-query-idx',
    createdAt: '2023-10-27T11:00:00Z',
    description: 'Detected slow query in GET /users. Analyzing schema for missing indices.',
    confidenceScore: 92,
    chatHistory: [],
    plan: [
       { id: '1', name: 'Analyze Query Plan', status: 'completed', description: 'Identified Seq Scan on users table' },
       { id: '2', name: 'Setup Ephemeral DB', status: 'completed', description: 'Provisioning Postgres 15 container' },
       { id: '3', name: 'Run Migrations', status: 'running', description: 'Applying Prisma migrations to sandbox DB' },
       { id: '4', name: 'Benchmark', status: 'pending', description: 'Running k6 load test' },
       { id: '5', name: 'Implement Index', status: 'pending', description: 'Adding index to email column' }
    ],
    logs: [
       { id: '1', timestamp: '11:00:05', level: 'info' as const, message: 'Detected framework: Prisma ORM' },
       { id: '2', timestamp: '11:00:10', level: 'info' as const, message: 'Starting sandbox database container...' },
       { id: '3', timestamp: '11:00:15', level: 'success' as const, message: 'Database ready. Connection: postgres://nexus:***@localhost:5432/core' },
    ],
    databaseContext: {
       type: 'postgres',
       framework: 'prisma',
       status: 'starting',
       connectionString: 'postgres://nexus:pass@sandbox-db:5432/core',
       tables: [
          { name: 'User', columns: [{ name: 'id', type: 'Int' }, { name: 'email', type: 'String' }] },
          { name: 'Post', columns: [{ name: 'id', type: 'Int' }, { name: 'title', type: 'String' }] }
       ]
    }
  }
];

export const INTEGRATIONS: Integration[] = [
  { id: '1', name: 'GitHub', type: 'scm', status: 'connected', icon: 'github', description: 'Sync repositories, issues, and pull requests.' },
  { id: '2', name: 'Linear', type: 'issue', status: 'disconnected', icon: 'linear', description: 'Sync issues and project status.' },
  { id: '3', name: 'Notion', type: 'issue', status: 'disconnected', icon: 'notion', description: 'Read/Write documentation and wikis.' },
  { id: '4', name: 'Slack', type: 'monitoring', status: 'connected', icon: 'slack', description: 'Notifications and chat-ops commands.' },
  { id: '5', name: 'Sentry', type: 'monitoring', status: 'connected', icon: 'sentry', description: 'Trigger fixes from error events.' },
];