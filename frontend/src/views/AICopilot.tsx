import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';
import type { Project, ChatMessage, AISuggestedTask } from '../types';

export const AICopilot: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: "Hello! I'm your TaskFlow AI Copilot. Let me help you build, organize, and accelerate your project execution. Type a prompt or click one of the quick suggestions below to generate specialized task checklists!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<AISuggestedTask[]>([]);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch projects list
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const response = await axiosClient.get('/api/v1/projects/');
      return response.data;
    },
  });

  React.useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const presetPrompts = [
    { label: '🔒 Auth setup', prompt: 'Setup JWT authentication and views for React and Django' },
    { label: '🗄️ Database config', prompt: 'Configure PostgreSQL database schema, migrations and backups' },
    { label: '🐳 Docker compose', prompt: 'Setup Docker and docker-compose deployment files' },
    { label: '🤖 AI integration', prompt: 'Implement LLM API copilot assistant integration in backend and frontend' },
  ];

  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    if (!selectedProjectId) {
      alert('Please create a project workspace first before prompting AI.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);
    setSuccessMessage(null);

    try {
      const response = await axiosClient.post('/api/v1/ai/copilot/', {
        prompt: textToSend,
        project_id: selectedProjectId,
      });

      const { message, suggestions } = response.data;

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setActiveSuggestions(suggestions);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error communicating with the AI services. Please verify your connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBulkAdd = async () => {
    if (activeSuggestions.length === 0 || !selectedProjectId) return;
    setBulkAdding(true);
    setSuccessMessage(null);

    try {
      // Loop through suggestions and create them
      const promises = activeSuggestions.map((task) =>
        axiosClient.post('/api/v1/tasks/', {
          project: selectedProjectId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status || 'todo',
        })
      );

      await Promise.all(promises);
      
      setSuccessMessage(`Successfully added ${activeSuggestions.length} tasks to your active workspace! 🎉`);
      setActiveSuggestions([]);
    } catch (e) {
      alert('Failed to import some tasks. Please try again.');
    } finally {
      setBulkAdding(false);
    }
  };

  return (
    <div className="ai-copilot-container">
      {/* Chat Section */}
      <div className="chat-section">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.role}`}>
              <div className="bubble-content">{msg.content}</div>
              <span className="bubble-time">{msg.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          )}
        </div>

        {/* Action inputs */}
        <div className="chat-input-area">
          <div className="presets-container">
            {presetPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(p.prompt)}
                disabled={isTyping || !selectedProjectId}
                className="preset-pill"
              >
                {p.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputPrompt);
            }}
            className="chat-input-form"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="e.g. Generate tasks to configure PostgreSQL database..."
              disabled={isTyping || !selectedProjectId}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={isTyping || !inputPrompt.trim() || !selectedProjectId}
              className="chat-send-btn"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Suggested Tasks Panel */}
      <div className="ai-suggestions-panel">
        <div className="ai-suggestions-title">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5" style={{ color: 'var(--primary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096A9.75 9.75 0 0 1 3.104 15 9.75 9.75 0 0 1 8 3.104 9.75 9.75 0 0 1 12.896 15a9.75 9.75 0 0 1-3.083.904ZM15.75 6.75h6.75M19.125 3.375v6.75M16.5 18.75h3M18 17.25v3" />
          </svg>
          <span>AI Suggestions</span>
        </div>
        <p className="ai-suggestions-desc">
          Tasks recommended based on your chat prompt. Choose your target project and import them.
        </p>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="filter-select"
            style={{ width: '100%', padding: '10px' }}
          >
            {projects.length === 0 && <option value="">No Projects Found</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {successMessage && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#a7f3d0', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', fontWeight: 500 }}>
            {successMessage}
          </div>
        )}

        <div className="suggestions-list">
          {activeSuggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '12px' }}>
              No suggested tasks active. Send a prompt to get tasks from the AI Copilot.
            </div>
          ) : (
            <>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeSuggestions.map((s, idx) => (
                  <div key={idx} className="suggestion-item-card">
                    <span className="suggestion-item-title">{s.title}</span>
                    <p className="suggestion-item-desc">{s.description}</p>
                    <div className="suggestion-item-footer">
                      <span className={`priority-badge ${s.priority}`} style={{ fontSize: '9px' }}>{s.priority}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>To Do</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="suggestion-actions">
                <button
                  onClick={handleBulkAdd}
                  disabled={bulkAdding}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {bulkAdding ? 'Importing Tasks...' : `Import ${activeSuggestions.length} Tasks`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
