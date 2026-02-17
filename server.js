/**
 * Backend Server for Avatar Selector
 * 
 * Provides API endpoint /ask that integrates with Ollama local LLM (phi3 model)
 * to generate AI responses based on student questions and configuration.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { buildPrompt } from './server/promptBuilder.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = 'phi3';

// Middleware
app.use(cors());
app.use(express.json());

/**
 * POST /ask
 * 
 * Receives student question and configuration, calls Ollama local LLM (phi3),
 * and returns AI-generated response that follows the selected behavior.
 * 
 * Request body:
 * {
 *   question: string,
 *   teachingStyle: string,
 *   languageLevel: string,
 *   behaviourRules: string[],
 *   responseStructure: string,
 *   tone: string,
 *   avatarName: string
 * }
 * 
 * Response:
 * {
 *   response: string,
 *   error?: string
 * }
 */
app.post('/ask', async (req, res) => {
  try {
    // Extract request data
    const {
      question,
      teachingStyle,
      languageLevel,
      behaviourRules = [],
      responseStructure,
      tone,
      avatarName
    } = req.body;

    // Validate required fields
    if (!question || !question.trim()) {
      return res.status(400).json({
        error: 'Question is required'
      });
    }

    // Build structured prompt using configuration values
    // This uses the same prompt builder that works with behavioral rules
    const builtPrompt = buildPrompt({
      question: question.trim(),
      teachingStyle,
      languageLevel,
      behaviourRules,
      responseStructure,
      tone,
      avatarName
    });

    // Log the prompt being sent to Ollama for debugging
    console.log('📝 Sending prompt to Ollama:');
    console.log('---');
    console.log(builtPrompt.substring(0, 500) + (builtPrompt.length > 500 ? '...' : ''));
    console.log('---');

    // Call Ollama API
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: builtPrompt,
        stream: false
      }),
    });

    // Check if Ollama is running
    if (!ollamaResponse.ok) {
      if (ollamaResponse.status === 404 || ollamaResponse.status === 0) {
        throw new Error('OLLAMA_NOT_RUNNING');
      }
      const errorText = await ollamaResponse.text();
      throw new Error(`Ollama API error: ${ollamaResponse.status} - ${errorText}`);
    }

    // Parse Ollama response
    const ollamaData = await ollamaResponse.json();

    // Log the response received for debugging
    console.log('✅ Received response from Ollama:');
    console.log('---');
    console.log(ollamaData.response?.substring(0, 200) + (ollamaData.response?.length > 200 ? '...' : ''));
    console.log('---');

    // Extract response text from Ollama
    // Ollama returns: { model, created_at, response, done, ... }
    const responseText = ollamaData.response || '';

    if (!responseText || !responseText.trim()) {
      throw new Error('Empty response from Ollama');
    }

    // Return the response in the same format as before
    // Frontend API contract remains unchanged
    res.json({
      response: responseText.trim()
    });

  } catch (error) {
    console.error('🔥 Error calling Ollama:', error);
    
    // Handle specific error types
    if (error.message === 'OLLAMA_NOT_RUNNING' || 
        error.message?.includes('fetch failed') ||
        error.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: 'Ollama is not running. Please start Ollama service on localhost:11434. ' +
               'Install from: https://ollama.ai or run: ollama serve'
      });
    }

    if (error.message?.includes('model')) {
      return res.status(404).json({
        error: `Model "${OLLAMA_MODEL}" not found. Please pull it first: ollama pull ${OLLAMA_MODEL}`
      });
    }

    res.status(500).json({
      error: 'Failed to generate response. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`\n🤖 Ollama Configuration:`);
  console.log(`   Base URL: ${OLLAMA_BASE_URL}`);
  console.log(`   Model: ${OLLAMA_MODEL}`);
  console.log(`\n💡 Make sure Ollama is running:`);
  console.log(`   1. Install from: https://ollama.ai`);
  console.log(`   2. Start Ollama: ollama serve`);
  console.log(`   3. Pull model: ollama pull ${OLLAMA_MODEL}`);
});
