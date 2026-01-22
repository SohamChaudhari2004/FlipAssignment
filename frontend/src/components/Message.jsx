import ReactMarkdown from 'react-markdown';
import './Message.css';

/**
 * Extract text content from various response formats
 */
function extractTextContent(content) {
  // If it's already a string, return as-is
  if (typeof content === 'string') {
    // Check if string is JSON array that needs parsing
    if (content.startsWith('[') || content.startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        return extractTextContent(parsed);
      } catch {
        return content;
      }
    }
    return content;
  }
  
  // If it's an array (like chunked response with text/reference types)
  if (Array.isArray(content)) {
    return content
      .filter(item => item && item.type === 'text' && item.text)
      .map(item => item.text)
      .join('');
  }
  
  // If it's an object
  if (content && typeof content === 'object') {
    if (content.text) return content.text;
    if (content.content) return extractTextContent(content.content);
  }
  
  // If null/undefined
  if (content == null) return '';
  
  // Fallback
  return JSON.stringify(content, null, 2);
}

export function Message({ content, role, metrics }) {
  const isUser = role === 'user';
  const textContent = extractTextContent(content);

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-content">
        {isUser ? (
          textContent
        ) : (
          <ReactMarkdown>{textContent || 'No response received'}</ReactMarkdown>
        )}
      </div>
      {metrics && (
        <div className="message-metrics">
          ⚡ {metrics.agentLatency}ms | Total: {metrics.totalLatency}ms
        </div>
      )}
    </div>
  );
}
