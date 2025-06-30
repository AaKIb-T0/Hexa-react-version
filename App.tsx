
import React, { useEffect } from 'react';
import { useChat } from './hooks/useChat';
import ChatView from './components/ChatView';
import PromptInput from './components/PromptInput';
import { HeaderIcon } from './components/icons';

function App() {
  const { messages, sendMessage, clearChat, isLoading } = useChat([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { action, text } = event.data;
      if (action === 'ask-about-selection' && text) {
        // To avoid chat duplication, check if the last message is the same
        if(messages.length === 0 || messages[messages.length-1].text !== text) {
            sendMessage(text, []);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendMessage, messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-2">
          <HeaderIcon />
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">Hexa</h1>
        </div>
        <button
          onClick={clearChat}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          Clear
        </button>
      </header>

      <ChatView messages={messages} isLoading={isLoading} />

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <PromptInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;
