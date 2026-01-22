import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initializeAgent, processQuery, processQueryStream, clearMemory } from './agent.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Clear conversation memory
app.post('/api/clear', (req, res) => {
    clearMemory();
    res.json({ success: true, message: 'Conversation memory cleared' });
});

// Streaming chat endpoint using Server-Sent Events
app.post('/api/chat/stream', async (req, res) => {
    const requestStart = Date.now();

    try {
        const { message, region = 'IN' } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`[${new Date().toISOString()}] [${region}] [STREAM] Processing: "${message.substring(0, 50)}..."`);

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders();

        // Stream the response
        for await (const chunk of processQueryStream(message, region)) {
            const data = JSON.stringify(chunk);
            res.write(`data: ${data}\n\n`);

            if (chunk.type === 'done') {
                const totalLatency = Date.now() - requestStart;
                console.log(`[Latency] Agent: ${chunk.latency}ms | Total: ${totalLatency}ms`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Stream error:', error.message);
        res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
        res.end();
    }
});

// Non-streaming chat endpoint (backwards compatible)
app.post('/api/chat', async (req, res) => {
    const requestStart = Date.now();

    try {
        const { message, region = 'IN' } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`[${new Date().toISOString()}] [${region}] Processing: "${message.substring(0, 50)}..."`);

        const result = await processQuery(message, region);

        const totalLatency = Date.now() - requestStart;

        console.log(`[Latency] Agent: ${result.latency}ms | Total: ${totalLatency}ms`);

        res.json({
            message: result.response,
            metrics: {
                agentLatency: result.latency,
                totalLatency,
            },
            success: result.success,
        });
    } catch (error) {
        const totalLatency = Date.now() - requestStart;
        console.error('Chat error:', error.message);
        res.status(500).json({
            error: 'Failed to process message',
            metrics: { totalLatency },
        });
    }
});

async function startServer() {
    // Initialize the agent before starting the server
    const initialized = await initializeAgent();

    if (!initialized) {
        console.error('Failed to initialize agent. Check your API keys.');
        process.exit(1);
    }

    app.listen(config.port, () => {
        console.log(`Server running on http://localhost:${config.port}`);
        console.log('Endpoints:');
        console.log(`  POST /api/chat - Send messages (non-streaming)`);
        console.log(`  POST /api/chat/stream - Send messages (streaming)`);
        console.log(`  POST /api/clear - Clear conversation`);
        console.log(`  GET /health - Health check`);
    });
}

startServer();
