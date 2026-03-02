
import { INITIAL_JOBS, INTEGRATIONS, MOCK_WORKFLOWS } from '../utils/mockData';

// Declare sql.js global type
declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;
let isMockMode = false; // Fallback if WASM fails

// Initialize the Database
export const initDB = async (): Promise<boolean> => {
  if (db || isMockMode) return true;

  // Retry logic for slow connections
  let attempts = 0;
  while (typeof window.initSqlJs !== 'function' && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 200));
    attempts++;
  }

  if (typeof window.initSqlJs !== 'function') {
    console.warn("SQL.js not loaded. Switching to Mock Mode (In-Memory).");
    isMockMode = true;
    return true; // Return true to allow app to load
  }

  try {
    const SQL = await window.initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    // Check for existing DB in LocalStorage - KEY CHANGED TO FORCE RESET FOR V2 SCHEMA
    const savedDb = localStorage.getItem('nexus_sqlite_db_v2');
    if (savedDb) {
      const u8 = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(u8);
    } else {
      db = new SQL.Database();
      await seedDatabase();
    }
    
    return true;
  } catch (e) {
    console.error("Failed to init DB", e);
    // Fallback to mock mode on error to prevent white screen
    isMockMode = true;
    return true;
  }
};

// Seed initial data
const seedDatabase = async () => {
  if (!db) return;

  // 1. Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, 
    name TEXT, 
    email TEXT, 
    password TEXT,
    avatarUrl TEXT
  )`);

  // Insert Demo User
  const insertSafe = (sql: string, params: any[]) => {
      const stmt = db.prepare(sql);
      const sanitized = params.map(val => val === undefined ? null : val);
      stmt.run(sanitized);
      stmt.free();
  };

  insertSafe(`INSERT INTO users VALUES (?, ?, ?, ?, ?)`, [
    'user_1', 'Darren Baldwin', 'darren@nexus.ai', 'password', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Darren'
  ]);

  // 2. Jobs Table (Added userId)
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    repo TEXT,
    type TEXT,
    status TEXT,
    branch TEXT,
    createdAt TEXT,
    description TEXT,
    prLink TEXT,
    logs TEXT,
    diff TEXT,
    plan TEXT,
    chatHistory TEXT,
    triggerSource TEXT,
    simulatedFileContent TEXT,
    databaseContext TEXT
  )`);

  // Seed Jobs for Demo User ONLY
  INITIAL_JOBS.forEach(job => {
    insertSafe(`INSERT INTO jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      job.id, 'user_1', job.title, job.repo, job.type, job.status, job.branch, job.createdAt, job.description,
      job.prLink || null,
      JSON.stringify(job.logs || []),
      job.diff || null,
      JSON.stringify(job.plan || []),
      JSON.stringify(job.chatHistory || []),
      job.triggerSource || null,
      JSON.stringify(job.simulatedFileContent || null),
      JSON.stringify(job.databaseContext || null)
    ]);
  });

  // 3. Workflows Table (Added userId)
  db.run(`CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT,
    repo TEXT,
    trigger TEXT,
    schedule TEXT,
    event TEXT,
    status TEXT,
    lastRun TEXT
  )`);

  // Seed Workflows for Demo User ONLY
  MOCK_WORKFLOWS.forEach(wf => {
    insertSafe(`INSERT INTO workflows VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      wf.id, 'user_1', wf.name, wf.repo, wf.trigger, wf.schedule || null, wf.event || null, wf.status, wf.lastRun || null
    ]);
  });

  // 4. Integrations Table (Added userId)
  db.run(`CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT,
    type TEXT,
    status TEXT,
    icon TEXT,
    description TEXT,
    githubToken TEXT,
    apiKey TEXT
  )`);

  // Seed Integrations for Demo User ONLY
  INTEGRATIONS.forEach(int => {
     // FIXED: Removed extra '?' (was 10, now 9 to match columns)
     insertSafe(`INSERT INTO integrations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
       int.id + '_user_1', 'user_1', int.name, int.type, int.status, int.icon, int.description, int.githubToken || null, int.apiKey || null
     ]);
  });

  // 5. Settings Tables (Added userId/keyed by userId)
  db.run(`CREATE TABLE IF NOT EXISTS project_settings (userId TEXT PRIMARY KEY, data TEXT)`);
  insertSafe(`INSERT INTO project_settings VALUES (?, ?)`, [
    'user_1',
    JSON.stringify({
      id: 'proj_demo_123',
      name: 'nexus-platform-v1',
      description: 'Main autonomous engineering dashboard.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  ]);

  db.run(`CREATE TABLE IF NOT EXISTS secrets (id TEXT PRIMARY KEY, userId TEXT, key TEXT, value TEXT, createdAt TEXT)`);
  insertSafe(`INSERT INTO secrets VALUES (?, ?, ?, ?, ?)`, ['sec_1', 'user_1', 'DATABASE_URL', 'postgres://nexus:pass@sandbox-db:5432/app', new Date().toISOString()]);

  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, userId TEXT, userName TEXT, action TEXT, details TEXT, timestamp TEXT)`);

  saveDB();
};

// Save DB to LocalStorage
const saveDB = () => {
  if (!db) return;
  try {
    const data = db.export();
    localStorage.setItem('nexus_sqlite_db_v2', JSON.stringify(Array.from(data)));
  } catch (e) {
    console.warn("LocalStorage full, cannot save DB state persistence.");
  }
};

// Generic Query Wrapper
export const dbQuery = (sql: string, params: any[] = []): any[] => {
  if (isMockMode) return []; // Mock mode returns empty for reads usually, or we could return mock data
  if (!db) return [];
  try {
    const stmt = db.prepare(sql);
    const sanitized = params.map(val => val === undefined ? null : val);
    stmt.bind(sanitized);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (e) {
    console.error("SQL Error:", e);
    return [];
  }
};

// Generic Exec Wrapper
export const dbExec = (sql: string, params: any[] = []): boolean => {
  if (isMockMode) return true; // Pretend it worked
  if (!db) return false;
  try {
    const stmt = db.prepare(sql);
    const sanitized = params.map(val => val === undefined ? null : val);
    stmt.run(sanitized);
    stmt.free();
    saveDB(); // Auto-save on writes
    return true;
  } catch (e) {
    console.error("SQL Exec Error:", e);
    return false;
  }
};
