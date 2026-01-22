const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Streaming message sender
export async function sendMessageStream(message, region = 'IN', onChunk) {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, region }),
    });

    if (!response.ok) {
        throw new Error('Failed to get response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let latency = 0;

    while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                    return { success: true, latency };
                }
                
                try {
                    const chunk = JSON.parse(data);
                    
                    if (chunk.type === 'final') {
                        onChunk(chunk.content);
                    } else if (chunk.type === 'tool') {
                        // Optional: show tool usage indicator
                        onChunk(null, { tool: chunk.tool });
                    } else if (chunk.type === 'done') {
                        latency = chunk.latency;
                    } else if (chunk.type === 'error') {
                        throw new Error(chunk.content);
                    }
                } catch (e) {
                    if (e.message !== 'Unexpected end of JSON input') {
                        console.error('Parse error:', e);
                    }
                }
            }
        }
    }

    return { success: true, latency };
}

// Non-streaming fallback
export async function sendMessage(message, region = 'IN') {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, region }),
    });

    if (!response.ok) {
        throw new Error('Failed to get response');
    }

    return response.json();
}

export async function clearChat() {
    const response = await fetch(`${API_BASE_URL}/api/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Failed to clear chat');
    }

    return response.json();
}
