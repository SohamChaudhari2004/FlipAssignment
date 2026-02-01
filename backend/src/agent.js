import { ChatMistralAI } from '@langchain/mistralai';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

import { config } from './config.js';
import { AGENT_CONFIG } from './constants.js';
import { getSystemPrompt } from './prompts.js';

let agentExecutor = null;
let currentRegion = AGENT_CONFIG.defaultRegion;

// Simple in-memory conversation history
let chatHistory = [];

/**
 * Initialize the AI agent with Mistral and Tavily
 * @returns {Promise<boolean>} Success status
 */
export async function initializeAgent() {
    try {
        const model = new ChatMistralAI({
            model: AGENT_CONFIG.model,
            temperature: AGENT_CONFIG.temperature,
            apiKey: config.mistralApiKey,
            streaming: true,
        });

        // Create Tavily web search tool for real-time information
        const tavilySearch = new TavilySearchResults({
            apiKey: config.tavilyApiKey,
            maxResults: AGENT_CONFIG.maxResults,
        });

        const tools = [tavilySearch];

        // Store tools and model for dynamic prompt creation
        agentExecutor = { model, tools };

        console.error('Agent initialized successfully with Tavily web search, memory, and streaming');
        return true;
    } catch (error) {
        console.error('Failed to initialize agent:', error.message);
        return false;
    }
}

/**
 * Create agent executor with region-specific prompt
 * @param {string} region - Country code
 * @returns {Promise<AgentExecutor>} Configured agent executor
 */
async function createRegionAgent(region) {
    const { model, tools } = agentExecutor;

    const prompt = ChatPromptTemplate.fromMessages([
        ['system', getSystemPrompt(region)],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}'],
    ]);

    const agent =  createToolCallingAgent({
        llm: model,
        tools,
        prompt,
    });

    return new AgentExecutor({
        agent,
        tools,
        verbose: false,
        maxIterations: AGENT_CONFIG.maxIterations,
    });
}

/**
 * Clear conversation memory
 */
export function clearMemory() {
    chatHistory = [];
    currentRegion = AGENT_CONFIG.defaultRegion;
    console.log('Conversation memory cleared');
}

/**
 * Extract string content from various response formats
 * @param {*} content - Content in various formats
 * @returns {string} Extracted string content
 */
function extractStringContent(content) {
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return content
            .filter(item => item?.type === 'text' && item?.text)
            .map(item => item.text)
            .join('');
    }
    if (content?.text) return content.text;
    if (content?.content) return extractStringContent(content.content);
    return content ? JSON.stringify(content) : '';
}

/**
 * Add exchange to chat history with size limit
 * @param {string} userMessage - User's message
 * @param {*} assistantMessage - Assistant's response (can be various formats)
 */
function addToHistory(userMessage, assistantMessage) {
    // Ensure both messages are valid strings
    const userContent = typeof userMessage === 'string' ? userMessage : String(userMessage);
    const assistantContent = extractStringContent(assistantMessage);

    // Only add if we have valid content
    if (userContent && assistantContent) {
        chatHistory.push(new HumanMessage(userContent));
        chatHistory.push(new AIMessage(assistantContent));

        // Limit history size to prevent token overflow
        if (chatHistory.length > AGENT_CONFIG.historyLimit) {
            chatHistory = chatHistory.slice(-AGENT_CONFIG.historyLimit);
        }
    } else {
        console.warn('Skipping history entry: invalid content');
    }
}

/**
 * Handle region change - clears history if region changed
 * @param {string} region - New region code
 */
function handleRegionChange(region) {
    if (region !== currentRegion) {
        chatHistory = [];
        currentRegion = region;
        console.log(`Region changed to ${region}, cleared history`);
    }
}

/**
 * Process query with streaming response
 * @param {string} userMessage - User's message
 * @param {string} region - Country code
 * @yields {object} Streaming chunks
 */
export async function* processQueryStream(userMessage, region = AGENT_CONFIG.defaultRegion) {
    const startTime = Date.now();

    try {
        if (!agentExecutor) {
            throw new Error('Agent not initialized');
        }

        handleRegionChange(region);

        const executor = await createRegionAgent(region);
        let fullResponse = '';

        // Stream the response
        const stream = await executor.stream({
            input: userMessage,
            chat_history: chatHistory,
        });

        for await (const chunk of stream) {
            if (chunk.output) {
                fullResponse = chunk.output;
                yield { type: 'final', content: chunk.output };
            } else if (chunk.intermediateSteps) {
                for (const step of chunk.intermediateSteps) {
                    yield { type: 'tool', tool: step.action.tool, content: 'Searching...' };
                }
            }
        }

        // Add to history
        if (fullResponse) {
            addToHistory(userMessage, fullResponse);
        }

        const latency = Date.now() - startTime;
        yield { type: 'done', latency };

    } catch (error) {
        console.error('Agent error:', error);
        yield { type: 'error', content: error.message };
    }
}

/**
 * Process query without streaming (backwards compatible)
 * @param {string} userMessage - User's message
 * @param {string} region - Country code
 * @returns {Promise<object>} Response with latency and success status
 */
export async function processQuery(userMessage, region = AGENT_CONFIG.defaultRegion) {
    const startTime = Date.now();

    try {
        if (!agentExecutor) {
            throw new Error('Agent not initialized');
        }

        handleRegionChange(region);

        const executor = await createRegionAgent(region);

        const result = await executor.invoke({
            input: userMessage,
            chat_history: chatHistory,
        });

        addToHistory(userMessage, result.output);

        const latency = Date.now() - startTime;

        return {
            response: result.output,
            latency,
            success: true,
        };
    } catch (error) {
        console.error('Agent error:', error);
        const latency = Date.now() - startTime;
        return {
            response: `Error: ${error.message}`,
            latency,
            success: false,
        };
    }
}
