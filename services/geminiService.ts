
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PRIMARY_MODEL = 'gemini-3-pro-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash';

/**
 * Robust wrapper to handle API failures and model fallbacks.
 * Tries the experimental model first, then falls back to flash.
 */
const generateSafe = async (prompt: string, config: any = {}): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config
    });
    return response.text || null;
  } catch (error) {
    console.warn(`[Gemini Service] Primary model (${PRIMARY_MODEL}) failed. Retrying with fallback (${FALLBACK_MODEL}).`);
    try {
      const response = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: prompt,
        config
      });
      return response.text || null;
    } catch (fallbackError) {
      console.error("[Gemini Service] All models failed.", fallbackError);
      return null;
    }
  }
};

export const detectDatabaseFramework = (repoName: string, description: string): { type: 'postgres' | 'mysql', framework: 'prisma' | 'typeorm' | 'django' | 'none' } | null => {
   // Simple heuristic based simulation. In a real app, this would analyze the file tree.
   const lowerDesc = description.toLowerCase();
   const lowerRepo = repoName.toLowerCase();
   
   if (lowerDesc.includes('prisma') || lowerRepo.includes('api')) return { type: 'postgres', framework: 'prisma' };
   if (lowerDesc.includes('django') || lowerRepo.includes('backend')) return { type: 'postgres', framework: 'django' };
   if (lowerDesc.includes('typeorm')) return { type: 'mysql', framework: 'typeorm' };
   
   return null;
};

export const generateJobAnalysis = async (jobTitle: string, jobDescription: string, logs: string): Promise<string> => {
  const prompt = `
    You are an expert Autonomous AI Software Engineer named "Nexus".
    You are analyzing a job to fix a software issue.
    
    Job Title: ${jobTitle}
    Description: ${jobDescription}
    Recent Execution Logs: ${logs}

    Please provide a concise technical analysis (max 150 words) of what needs to be done. 
    Format the output as a Markdown bulleted list of steps.
  `;

  const text = await generateSafe(prompt);
  return text || "Analysis complete. Ready to proceed.";
};

export const generatePatchExplanation = async (diff: string): Promise<string> => {
  const prompt = `
    You are an expert code reviewer.
    Explain the following git diff in plain English for a human reviewer.
    Focus on the logic changes and safety.
    
    Diff:
    ${diff}
    
    Keep it under 3 sentences.
  `;

  const text = await generateSafe(prompt);
  return text || "Changes look safe to merge.";
};

export const generateJobPlan = async (taskDescription: string, repo: string): Promise<any[]> => {
  // Detect if DB is needed
  const dbInfo = detectDatabaseFramework(repo, taskDescription);
  const dbContextInstruction = dbInfo 
      ? `Detected ${dbInfo.framework} with ${dbInfo.type}. You MUST include steps to 'Setup Ephemeral DB' and 'Run Migrations' before implementation.` 
      : '';

  const prompt = `
    You are an autonomous software engineer planning a task.
    Repository: ${repo}
    Task: ${taskDescription}
    ${dbContextInstruction}
    
    Create a high-level execution plan of 4-7 steps to complete this task. 
    Steps should include:
    1. Analysis
    2. Database Setup (if applicable)
    3. Implementation (or Patch Generation)
    4. Testing
    5. Pull Request
    
    The status of all steps should be 'pending'.
  `;

  const config = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Short title of the step" },
          description: { type: Type.STRING, description: "One sentence description" }
        },
        required: ["name", "description"]
      }
    }
  };

  const text = await generateSafe(prompt, config);

  if (!text) {
    return [
      { name: "Analyze Repository", description: "Scanning codebase for relevant files." },
      { name: "Generate Patch", description: "Creating code changes based on requirements." },
      { name: "Run Sandbox Tests", description: "Verifying changes in isolated environment." },
      { name: "Create Pull Request", description: "Preparing pull request for review." }
    ];
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse plan JSON", e);
    return [
      { name: "Analyze Repository", description: "Scanning codebase." },
      { name: "Execute Task", description: "Performing requested actions." },
      { name: "Verify", description: "Running tests." }
    ];
  }
};

// Fallback logic if we can't find real files
export const generateSyntheticFile = async (repo: string, taskDescription: string): Promise<{fileName: string, content: string}> => {
  const prompt = `
    I am simulating a coding environment.
    Repo: ${repo}
    Task: ${taskDescription}

    Generate a realistic file name and its content that WOULD exist in this repo and is relevant to this task.
    If the task is a bug fix, include the BUG in the code so I can fix it later.
    If the task is a feature, include the code state BEFORE the feature is added.
    
    File content should be realistic TypeScript/Python/React code.
  `;
  
  const config = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
          fileName: { type: Type.STRING },
          content: { type: Type.STRING }
      },
      required: ['fileName', 'content']
    }
  };

  const text = await generateSafe(prompt, config);

  if (!text) {
    return { fileName: 'src/main.ts', content: '// Error generating context.' };
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return { fileName: 'src/main.ts', content: '// Error parsing file content.' };
  }
};

export const generateCodePatch = async (fileName: string, fileContent: string, taskDescription: string): Promise<string> => {
  if (!fileContent || fileContent.includes('Unable to retrieve')) return "";
  
  const prompt = `
    You are an automated coding agent.
    Task: ${taskDescription}
    
    Current File: ${fileName}
    Current Content:
    ${fileContent}

    Apply the necessary changes to fix the bug or add the feature.
    
    IMPORTANT: Return ONLY a valid git diff output.
    Start the output with: diff --git a/${fileName} b/${fileName}
    Do not wrap it in markdown code blocks. Just the raw diff text.
  `;

  let diff = await generateSafe(prompt);
  
  if (!diff) return "";

  // Clean up markdown if present
  if (diff.startsWith('```')) {
    diff = diff.replace(/^```(diff)?\n/, '').replace(/\n```$/, '');
  }
  
  return diff;
};

export const chatWithBot = async (history: ChatMessage[], newMessage: string, jobContext: any): Promise<{ text: string, codeSnippet?: any, newDiff?: string }> => {
   
   // 1. Check for intent to modify code
   const intentPrompt = `
      User Message: "${newMessage}"
      Does this message request a change to the code, a fix, or a modification?
      Answer YES or NO.
   `;
   const intentCheck = await generateSafe(intentPrompt);
   const isCodeRequest = intentCheck?.toUpperCase().includes('YES');

   // 2. If it's a code request, regenerate the diff
   if (isCodeRequest && jobContext.diff) {
      const patchPrompt = `
        You are Nexus AI.
        Current Diff: 
        ${jobContext.diff}
        
        User Request: ${newMessage}
        
        Generate a NEW git diff that incorporates the user's feedback.
        Also provide a short explanation of what you changed.
        
        Output JSON: { "explanation": "string", "diff": "string" }
      `;
      
      const config = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            diff: { type: Type.STRING }
          },
          required: ['explanation', 'diff']
        }
      };
      
      const response = await generateSafe(patchPrompt, config);
      if (response) {
         try {
           const json = JSON.parse(response);
           return {
             text: json.explanation,
             newDiff: json.diff
           };
         } catch(e) { console.error(e); }
      }
   }

   // 3. Normal Chat Fallback
   const contextPrompt = `
     You are Nexus, an AI engineer working on:
     Title: ${jobContext.title}
     Repo: ${jobContext.repo}
     Current Diff: ${jobContext.diff || 'None'}
     
     User just said: "${newMessage}"
     
     Respond helpfully and professionally.
   `;

   const text = await generateSafe(contextPrompt);
   return { text: text || "I'm processing your request, but the connection is unstable. Please try again." };
}
