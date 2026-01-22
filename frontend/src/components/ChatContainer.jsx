import { useState } from 'react';
import { Message } from './Message';
import { sendMessage, clearChat, sendMessageStream } from '../services/api';
import './ChatContainer.css';

// Common countries with their display names
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
];

export function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState('IN');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await sendMessage(userMessage, region);
      // Ensure content is a string (not an object)
      let messageContent = response?.message || response?.response || 'No response received';
      if (typeof messageContent !== 'string') {
        messageContent = JSON.stringify(messageContent, null, 2);
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: messageContent,
        metrics: response?.metrics,
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response. Please try again.'}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    setMessages([]);
    try {
      await clearChat();
    } catch (e) {
      console.error('Failed to clear server memory:', e);
    }
  };

  const selectedCountry = COUNTRIES.find(c => c.code === region);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <h1>AI Chat Assistant</h1>
          <p>Powered by Mistral AI with Web Search</p>
        </div>
        <div className="header-controls">
          <div className="region-selector">
            <label>Region:</label>
            <select 
              value={region} 
              onChange={(e) => setRegion(e.target.value)}
              disabled={loading}
            >
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
          <button 
            className="clear-btn" 
            onClick={handleClearChat}
            disabled={loading || messages.length === 0}
            title="Clear conversation"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="region-indicator">
        {selectedCountry?.flag} Showing results for <strong>{selectedCountry?.name}</strong>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Ask me anything! I'll provide information specific to <strong>{selectedCountry?.name}</strong>.</p>
            <div className="chat-examples">
              <button onClick={() => setInput('What is the latest iPhone model?')}>
                Latest iPhone
              </button>
              <button onClick={() => setInput('What are the prices of iPhone 17?')}>
                iPhone Prices
              </button>
              <button onClick={() => setInput('Can I buy Huawei phones here?')}>
                Huawei Availability
              </button>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <Message key={i} {...msg} />
        ))}
        {loading && (
          <div className="chat-loading">
            <span></span><span></span><span></span>
          </div>
        )}
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about products in ${selectedCountry?.name}...`}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
