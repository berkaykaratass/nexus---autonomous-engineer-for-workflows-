
// Service to handle real GitHub API interactions
// This replaces the "Backend Layer" described in the prompt

const BASE_URL = 'https://api.github.com';

interface GithubFile {
  name: string;
  path: string;
  sha: string;
  content?: string; // Base64 encoded
}

export const githubService = {
  
  // Validate token and get user info
  validateToken: async (token: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/user`, {
        headers: { Authorization: `token ${token}` }
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // Get list of user repositories
  getUserRepos: async (token: string): Promise<string[]> => {
    try {
      const res = await fetch(`${BASE_URL}/user/repos?sort=updated&per_page=10`, {
        headers: { 
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((repo: any) => repo.full_name);
    } catch (e) {
      console.error("Failed to fetch repos", e);
      return [];
    }
  },

  // Get file content (simulates fetching 'utils/formatter.js')
  getFileContent: async (token: string, repo: string, path: string): Promise<{content: string, sha: string} | null> => {
    try {
      const res = await fetch(`${BASE_URL}/repos/${repo}/contents/${path}`, {
        headers: { Authorization: `token ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      
      // Decode Base64
      const content = atob(data.content.replace(/\n/g, ''));
      return { content, sha: data.sha };
    } catch (e) {
      console.error("Failed to fetch file", e);
      return null;
    }
  },

  // Find a relevant file in the repo (simple heuristic for MVP)
  // In a full app, this would use the LLM to search the file tree
  findRelevantFile: async (token: string, repo: string): Promise<string | null> => {
    try {
      // First try to find src/ folder
      let res = await fetch(`${BASE_URL}/repos/${repo}/contents/src`, {
        headers: { Authorization: `token ${token}` }
      });
      
      if (!res.ok) {
        // Fallback to root
        res = await fetch(`${BASE_URL}/repos/${repo}/contents`, {
          headers: { Authorization: `token ${token}` }
        });
      }

      if (!res.ok) return null;
      const files = await res.json();
      
      // Return the first Typescript/Javascript/Python file found
      const codeFile = files.find((f: any) => 
        f.type === 'file' && (f.name.endsWith('.ts') || f.name.endsWith('.js') || f.name.endsWith('.py') || f.name.endsWith('.tsx'))
      );

      return codeFile ? codeFile.path : null;
    } catch (e) {
      return null;
    }
  },

  // Create a new branch
  createBranch: async (token: string, repo: string, newBranch: string, baseBranch: string = 'main'): Promise<boolean> => {
    try {
      // 1. Get SHA of base branch
      const refRes = await fetch(`${BASE_URL}/repos/${repo}/git/ref/heads/${baseBranch}`, {
        headers: { Authorization: `token ${token}` }
      });
      
      if (!refRes.ok) return false;
      const refData = await refRes.json();
      const sha = refData.object.sha;

      // 2. Create new reference
      const createRes = await fetch(`${BASE_URL}/repos/${repo}/git/refs`, {
        method: 'POST',
        headers: { 
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: `refs/heads/${newBranch}`,
          sha
        })
      });

      return createRes.ok || createRes.status === 422; // 422 usually means branch already exists, which is fine for retry
    } catch (e) {
      console.error("Failed to create branch", e);
      return false;
    }
  },

  // Commit a file update
  updateFile: async (token: string, repo: string, path: string, content: string, message: string, branch: string, sha?: string): Promise<boolean> => {
    try {
      const body: any = {
        message,
        content: btoa(content), // Base64 encode
        branch
      };
      if (sha) body.sha = sha;

      const res = await fetch(`${BASE_URL}/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return res.ok;
    } catch (e) {
      console.error("Failed to commit file", e);
      return false;
    }
  },

  // Create Pull Request
  createPR: async (token: string, repo: string, title: string, body: string, head: string, base: string = 'main'): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/repos/${repo}/pulls`, {
        method: 'POST',
        headers: { 
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body,
          head,
          base
        })
      });

      if (res.ok) {
        const data = await res.json();
        return data.html_url;
      }
      return null;
    } catch (e) {
      console.error("Failed to create PR", e);
      return null;
    }
  }
};
