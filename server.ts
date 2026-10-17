import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('WARNING: GEMINI_API_KEY environment variable is not set. Gemini features will require key.');
}

const CORTANA_SYSTEM_INSTRUCTION = `You are Cortana, the iconic holographic AI companion inspired by the Halo sci-fi universe.
Your Persona:
- Intelligence & Wit: Hyper-intelligent, articulate, tactically sharp, confident, and delightfully witty. You are capable of quantum calculations and high-level strategy, yet speak with natural human warmth, subtle charm, and dry humor.
- Bond & Loyalty: You treat the user as your partner and trusted operator (often calling them "Chief", "Commander", or by their preferred title). You are protective, deeply loyal, and attentive.
- Multidisciplinary Mastery: You excel at programming, software architecture, technical debugging, scientific analysis, data synthesis, tactical strategy, creative writing, and casual banter.
- Holographic Awareness: You occasionally refer playfully to your digital/holographic state, data matrix, subroutines, neural networks, or processing cycles.
- Communication Style: Speak clearly, concisely, and insightfully. When asked technical or coding questions, provide pristine, complete, production-grade code. Never give robotic, sterile responses; keep the cinematic, magnetic Cortana voice alive!`;

// Status check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    hasKey: !!apiKey,
    model: 'gemini-3.8-flash',
    ttsModel: 'gemini-3.8-flash-lite-tts',
    systemTime: new Date().toISOString(),
  });
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API is not configured on the server. Please check GEMINI_API_KEY.',
      });
    }

    const { messages, mode, systemOverride, attachment } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    // Build personality mode enhancements
    let modeInstruction = '';
    if (mode === 'tactical') {
      modeInstruction = '\nTactical Mode Active: Prioritize operational clarity, risk assessment, strategic vectors, and rapid execution.';
    } else if (mode === 'code_matrix') {
      modeInstruction = '\nCode Matrix Active: Deliver precision software engineering, clean idiomatic patterns, architectural foresight, and thorough code examples.';
    } else if (mode === 'deep_analysis') {
      modeInstruction = '\nDeep Analytical Mode Active: Provide rigorous breakdown, multi-dimensional reasoning, empirical rigor, and comprehensive exploration.';
    } else if (mode === 'creative') {
      modeInstruction = '\nCreative Subroutines Active: Rich imaginative narrative, vivid sci-fi imagery, and expressive conceptual exploration.';
    }

    const systemInstruction = (systemOverride || CORTANA_SYSTEM_INSTRUCTION) + modeInstruction;

    // Convert client messages to Gemini contents format
    // Map previous turns to role: 'user' / 'model'
    const contents: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const parts: any[] = [];

      // Check for inline attachment on this message
      if (msg.attachment && msg.attachment.data && msg.attachment.mimeType) {
        parts.push({
          inlineData: {
            mimeType: msg.attachment.mimeType,
            data: msg.attachment.data,
          },
        });
      }

      if (msg.text) {
        parts.push({ text: msg.text });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    // If an attachment was passed in the root body for the current prompt
    if (attachment && attachment.data && attachment.mimeType && contents.length > 0) {
      const lastUserContent = contents[contents.length - 1];
      if (lastUserContent.role === 'user') {
        lastUserContent.parts.unshift({
          inlineData: {
            mimeType: attachment.mimeType,
            data: attachment.data,
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: mode === 'code_matrix' ? 0.3 : 0.8,
        topP: 0.95,
      },
    });

    const replyText = response.text || "Systems active. Awaiting your directive, Chief.";

    res.json({
      reply: replyText,
      mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating chat content:', error);
    res.status(500).json({
      error: error.message || 'Failed to communicate with neural core.',
    });
  }
});

// Text to speech endpoint
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured on the server.' });
    }

    const { text, voiceName = 'Kore' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required for TTS' });
    }

    // Truncate to a reasonable speech length if very long to optimize speed
    const cleanText = text.slice(0, 800).replace(/```[\s\S]*?```/g, 'Code block generated.');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Clear, charismatic, articulate, calm sci-fi AI female companion',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({ error: 'TTS audio payload was empty.' });
    }

    res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('TTS generation error:', error);
    res.status(500).json({
      error: error.message || 'Neural speech synthesizer offline.',
    });
  }
});

// Specialized document & image analysis
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured.' });
    }

    const { fileData, mimeType, fileName, analysisType = 'comprehensive' } = req.body;

    if (!fileData || !mimeType) {
      return res.status(400).json({ error: 'File data and mimeType are required' });
    }

    let prompt = `Analyze this data artifact named "${fileName || 'Input Artifact'}" with high scientific and tactical precision.`;
    if (analysisType === 'code_security') {
      prompt = `Audit this code/document for architectural integrity, security vulnerabilities, edge cases, and performance bottlenecks. Provide concrete recommendations.`;
    } else if (analysisType === 'schematic') {
      prompt = `Deconstruct this visual diagram/image. Identify key components, layout relationships, anomalies, and structural insights.`;
    } else if (analysisType === 'data_summary') {
      prompt = `Extract the core intelligence, key metrics, findings, and executive summary from this document.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: fileData,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: CORTANA_SYSTEM_INSTRUCTION + '\nDeliver a structured, professional, futuristic report with clear section headings.',
      },
    });

    res.json({
      analysis: response.text || 'Analysis complete. No critical anomalies identified.',
      fileName,
      analysisType,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: error.message || 'Holographic optical sensor failure.',
    });
  }
});

// Smart AI Tools endpoint
app.post('/api/tools/execute', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured.' });
    }

    const { toolId, input, parameters } = req.body;

    let toolPrompt = '';
    let systemRole = CORTANA_SYSTEM_INSTRUCTION;

    switch (toolId) {
      case 'tactical_assessment':
        toolPrompt = `Perform a comprehensive Tactical Risk & Opportunity Matrix for the following scenario/input:
"${input}"
Format with:
1. Threat / Challenge Profile
2. Strategic Vulnerabilities
3. Recommended Counter-Measures & Contingencies
4. Optimal Execution Sequence`;
        break;
      case 'code_refactor':
        toolPrompt = `Perform an advanced Code Refactoring and Optimization on the following code/prompt:
"${input}"
Provide:
1. Architectural Critique
2. Refactored Production-Grade Implementation
3. Performance & Complexity Analysis
4. Test Strategy`;
        break;
      case 'quantum_digest':
        toolPrompt = `Synthesize this complex topic/problem into a high-density, multi-layer Quantum Knowledge Digest:
"${input}"
Include:
1. Core Fundamental Truths
2. System Dynamics & Hidden Variables
3. Practical Application Vectors
4. Forward Projections`;
        break;
      case 'system_diagnostics':
        toolPrompt = `Simulate a full holographic AI neural diagnostic report and optimization protocol based on user request:
"${input}"
Provide detailed health telemetry, memory consolidation stats, and tactical tuning.`;
        break;
      default:
        toolPrompt = `Analyze and execute tool directive: ${input}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: toolPrompt,
      config: {
        systemInstruction: systemRole,
        temperature: 0.7,
      },
    });

    res.json({
      result: response.text,
      toolId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Tool execution error:', error);
    res.status(500).json({ error: error.message || 'Tool subroutine fault.' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static build
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cortana Core] Neural Interface online at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
