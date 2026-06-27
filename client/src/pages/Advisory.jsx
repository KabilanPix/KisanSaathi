import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../hooks/useLanguage';
import VoiceInput from '../components/VoiceInput';
import { Send, User, Bot, Sprout } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

export default function Advisory() {
  const { t } = useTranslation();
  const [language] = useLanguage();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! I am KisanSaathi. How can I help with your farming questions today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const historyForApi = messages.filter(m => m.role !== 'system');
      const res = await api.post('/advisory/ask', {
        question: userMessage,
        language: language,
        history: historyForApi
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      toast.error('Failed to get advisory. Please try again.');
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceResult = (transcript) => {
    setInput(transcript);
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col">
      <div className="bg-white p-4 rounded-t-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-full">
          <Sprout className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('AI Crop Advisory')}</h1>
          <p className="text-sm text-gray-500">{t('Powered by Gemini - Ask in your language')}</p>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 border-x border-gray-100 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 flex gap-3 shadow-sm ${
              msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
            }`}>
              {msg.role === 'assistant' && <Bot className="w-6 h-6 shrink-0 mt-1 text-primary" />}
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.role === 'user' && <User className="w-6 h-6 shrink-0 mt-1" />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 text-gray-500 rounded-2xl rounded-tl-sm p-4 flex gap-2 items-center shadow-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 rounded-b-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <VoiceInput onResult={handleVoiceResult} />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('Type your question...')}
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-primary hover:bg-green-700 disabled:bg-gray-400 text-white p-3 rounded-xl transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
