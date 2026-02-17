# Ollama Local LLM Integration Setup Guide

This guide explains how to set up and run the Avatar Selector app with Ollama local LLM (phi3 model) integration.

## Prerequisites

- Node.js (v18 or higher - for native fetch support)
- npm or yarn
- Ollama installed and running locally (download from [ollama.ai](https://ollama.ai))

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Ollama:**
   - Install Ollama from [https://ollama.ai](https://ollama.ai)
   - Start Ollama service: `ollama serve`
   - Pull the phi3 model: `ollama pull phi3`
   - Verify it's running: `ollama list` (should show phi3)

3. **Optional - Environment variables:**
   - Create a `.env` file in the root directory if you want to customize:
     ```
     PORT=3001
     OLLAMA_BASE_URL=http://localhost:11434
     ```
   - Default values work if Ollama is running on localhost:11434

## Running the Application

### Option 1: Run Both Frontend and Backend Together (Recommended)

```bash
npm run dev:all
```

This will start:
- Frontend (Vite dev server) on `http://localhost:5173`
- Backend (Express server) on `http://localhost:3001`

### Option 2: Run Separately

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run dev:server
```

## How It Works

### Configuration Flow

1. **Select Avatar:** Choose an AI teacher avatar
2. **Configure Settings:**
   - Teaching Style (step-by-step, activity-based, etc.)
   - Language Level (simple English, Hinglish, etc.)
   - Behavioral Rules (simplify terms, use examples, etc.)
   - Response Structure (short answer, detailed, etc.)
   - Tone (neutral, calm, energetic, etc.)
3. **Save Configuration:** Click "Save Behaviour Rules" to persist settings

### Q&A Flow

1. **Navigate to Speaking View:** Click "Start Teaching →"
2. **Ask Questions:** Type your question in the Q&A panel
3. **Get AI Response:**
   - Backend collects all configuration values
   - Builds a structured prompt using the prompt builder
   - Calls Gemini Flash API (`gemini-1.5-flash`)
   - Returns response that follows all selected behaviors
4. **Display & Speak:** Response is displayed and automatically spoken by the avatar

### API Endpoint

**POST `/api/ask`**

Request body:
```json
{
  "question": "What is photosynthesis?",
  "teachingStyle": "step-by-step",
  "languageLevel": "simple-english",
  "behaviourRules": ["Simplify complex terms", "Use relatable real-life examples"],
  "responseStructure": "intro-explanation-example-quiz-summary",
  "tone": "friendly",
  "avatarName": "South Indian"
}
```

Response:
```json
{
  "response": "Great question! Let me explain photosynthesis step by step..."
}
```

**Note:** The backend calls Ollama's local API at `http://localhost:11434/api/generate` with the phi3 model.

## Project Structure

```
avatar-selector/
├── server.js                 # Express backend server
├── server/
│   └── promptBuilder.js     # Builds structured prompts for Gemini
├── src/
│   ├── App.jsx              # Main React component
│   └── services/            # Behavioral rules services
└── .env                     # Environment variables (not in git)
```

## Key Features

✅ **No Breaking Changes:** All existing functionality preserved
✅ **Modular Backend:** Clean separation of concerns
✅ **Secure API Key:** Stored in `.env`, never exposed to frontend
✅ **Structured Prompts:** Configuration values shape AI responses
✅ **Automatic Speech:** Responses are automatically spoken
✅ **Error Handling:** Graceful error messages for users

## Troubleshooting

### Backend won't start
- Verify port 3001 is not in use
- Check console for error messages

### API calls fail with "Ollama is not running"
- Make sure Ollama is installed: `ollama --version`
- Start Ollama service: `ollama serve`
- Verify it's running: Check `http://localhost:11434` in browser
- Check that port 11434 is not blocked

### "Model phi3 not found" error
- Pull the model: `ollama pull phi3`
- Verify model is available: `ollama list`
- Wait for download to complete (phi3 is ~2.3GB)

### Responses don't follow configuration
- Make sure you've saved the behavioral rules configuration
- Check that all configuration values are being sent in the API request
- Review the prompt builder logic in `server/promptBuilder.js`
- Check backend console logs for the prompt being sent

## Development Notes

- Frontend proxies `/api/*` requests to backend server (configured in `vite.config.js`)
- Backend uses Ollama's `phi3` model (lightweight, optimized for local machines)
- All configuration values are sent to backend and used in prompt construction
- Responses strictly follow selected behavioral rules, tone, and structure
- Backend logs prompts and responses for debugging (check server console)
- Ollama runs locally - no API keys or internet connection required for LLM calls