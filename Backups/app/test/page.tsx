'use client';

import { useState } from 'react';

export default function Test() {
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', content: string, timestamp: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user' as const, content: input, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log('Sending message with sessionId:', sessionId);
      const response = await fetch('/api/test-ai-studio/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          sessionId: sessionId 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage = { 
          type: 'ai' as const, 
          content: data.response, 
          timestamp: new Date().toLocaleTimeString() 
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Store session ID for future requests
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFileContent(content);
        setInput(content);
      };
      reader.readAsText(file);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setFileContent('');
    setInput('');
  };

  const resetSession = () => {
    setSessionId(null);
    setMessages([]);
    setInput('');
    setUploadedFile(null);
    setFileContent('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🧪 AI Studio Test Terminal</h1>
        
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Test Instructions</h2>
            {sessionId && (
              <button
                onClick={resetSession}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Reset Session
              </button>
            )}
          </div>
          <p className="text-sm text-gray-300">
            This test uses conversation sessions like Google AI Studio.
            <br />
            Upload your seed data files and type "start" to begin the campaign setup process.
          </p>
          {sessionId && (
            <p className="text-xs text-green-400 mt-2">
              ✅ Active session: {sessionId.substring(0, 20)}...
            </p>
          )}
        </div>

        {/* File Upload Section */}
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">📁 File Upload</h2>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".txt,.md,.json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer transition-colors"
            >
              Choose File
            </label>
            {uploadedFile && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">
                  📄 {uploadedFile.name} ({uploadedFile.size} bytes)
                </span>
                <button
                  onClick={clearFile}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {fileContent && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold mb-2">File Preview:</h3>
              <div className="max-h-32 overflow-y-auto bg-gray-700 p-2 rounded text-xs">
                <pre className="whitespace-pre-wrap">{fileContent.substring(0, 500)}{fileContent.length > 500 ? '...' : ''}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Chat Terminal */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">💬 AI Studio Test Terminal</h2>
          
          {/* Messages */}
          <div className="h-96 overflow-y-auto bg-gray-900 p-4 rounded mb-4 font-mono text-sm">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Type "start" to begin testing with the AI Studio approach...
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`mb-3 ${msg.type === 'user' ? 'text-blue-400' : 'text-green-400'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">
                      {msg.type === 'user' ? '👤 You' : '🤖 AI'}
                    </span>
                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))
            )}
            {loading && (
              <div className="text-yellow-400">🤖 AI is thinking...</div>
            )}
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={fileContent ? "File content loaded - edit if needed..." : "Type your message here... (Press Enter to send)"}
              className="flex-1 p-3 bg-gray-700 rounded border border-gray-600 resize-none"
              rows={3}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          {fileContent && (
            <div className="mt-2 text-xs text-gray-400">
              💡 File content loaded. You can edit the text above before sending.
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="text-xs text-gray-400 text-center">
          <p>🤖 Using conversation sessions like Google AI Studio</p>
          <p>💬 Session state maintained between requests</p>
          <p>📝 System prompt and tools match Google AI Studio exactly</p>
        </div>
      </div>
    </div>
  );
}
