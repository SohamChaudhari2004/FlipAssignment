# AI Chat Application

A React + Node.js chat application powered by Mistral AI with web search capabilities, Chain of Thought prompting, and latency monitoring.

## Features

- **Mistral AI Integration** with LangChain orchestration
- **Web Search Tool** for real-time information
- **Chain of Thought (CoT) Prompting** for accurate, focused responses
- **Categorical Constraints** - Answers stay on-topic (iPhone question = iPhone answers only)
- **Geopolitical Awareness** - Mentions regional restrictions/bans
- **Latency Monitoring** - Displays response time for each query

## Setup

### 1. Get a Mistral API Key

1. Go to [console.mistral.ai](https://console.mistral.ai)
2. Create an account or sign in
3. Generate an API key

### 2. Configure Backend

```bash
cd backend

# Add your API key to .env file
# Edit backend/.env and set MISTRAL_API_KEY=your_key_here

# Install dependencies
npm install

# Start server
npm run dev
```

### 3. Start Frontend

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

### 4. Open App

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Testing the Features

1. **Categorical Constraint**: Ask "What is the latest iPhone?" - Should only discuss iPhones
2. **Geopolitical Restriction**: Ask "Can I buy Huawei phones in India?" - Should mention restrictions

## Architecture

```
backend/
├── src/
│   ├── config.js    # Environment configuration
│   ├── agent.js     # LangChain + Mistral AI agent with CoT
│   └── index.js     # Express server with latency monitoring

frontend/
├── src/
│   ├── components/
│   │   ├── ChatContainer.jsx  # Main chat UI
│   │   └── Message.jsx        # Message component
│   ├── services/
│   │   └── api.js             # Backend API calls
│   └── App.tsx                # Root component
```

## Latency Metrics

Each response shows:
- **Agent Latency**: Time for AI processing
- **Total Latency**: End-to-end request time
