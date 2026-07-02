import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../hooks/useLanguage';
import VoiceInput from '../components/VoiceInput';
import { Send, User, Bot, Sprout } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import TypewriterText from '../components/TypewriterText';

const WELCOME_MESSAGES = {
  en: "Namaste! I am KisanSaathi. How can I help with your farming questions today?",
  hi: "नमस्ते! मैं किसानसाथी हूँ। आज मैं खेती से जुड़े आपके सवालों में कैसे मदद कर सकता हूँ?",
  mr: "नमस्ते! मी किसानसाथी आहे. आज मी तुमच्या शेतीच्या प्रश्नांमध्ये कशी मदत करू शकतो?",
  ta: "நமஸ்தே! நான் கிசான்சாதி. இன்று உங்கள் விவசாய கேள்விகளுக்கு நான் எவ்வாறு உதவ முடியும்?",
  pa: "ਨਮਸਤੇ! ਮੈਂ ਕਿਸਾਨਸਾਥੀ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੇ ਖੇਤੀਬਾੜੀ ਦੇ ਸਵਾਲਾਂ ਵਿੱਚ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
  te: "నమస్తే! నేను కిసాన్‌సాథిని. ఈరోజు మీ వ్యవసాయ ప్రశ్నలకు నేను ఎలా సహాయపడగలను?",
  kn: "ನಮಸ್ತೆ! ನಾನು ಕಿಸಾನ್‌ಸಾಥಿ. ಇಂದು ನಿಮ್ಮ ಕೃಷಿ ಪ್ರಶ್ನೆಗಳಿಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
  bn: "নমস্তে! আমি কিসানসাথী। আজ আমি আপনার চাষাবাদের প্রশ্নগুলিতে কীভাবে সাহায্য করতে পারি?",
  ml: "നമസ്‌തേ! ഞാൻ കിസാൻസാത്തിയാണ്. ഇന്ന് നിങ്ങളുടെ കാർഷിക ചോദ്യങ്ങളിൽ എനിക്ക് എങ്ങനെ സഹായിക്കാനാകും?"
};

export default function Advisory() {
  const { t } = useTranslation();
  const [language] = useLanguage();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME_MESSAGES['en'], isWelcome: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize correct language on mount
  useEffect(() => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[0].isWelcome) {
        newMessages[0].content = WELCOME_MESSAGES[language] || WELCOME_MESSAGES.en;
      }
      return newMessages;
    });
  }, [language]);

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
      
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response, isTyping: true }]);
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
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] md:h-[80vh] flex flex-col">
      <div className="bg-white p-3 sm:p-4 rounded-t-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-full shrink-0">
          <Sprout className="text-white w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{t('AI Crop Advisory')}</h1>
          <p className="text-[10px] sm:text-sm text-gray-500 truncate">{t('Powered by Gemini - Ask in your language')}</p>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 border-x border-gray-100 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 flex gap-2 sm:gap-3 shadow-sm ${
              msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
            }`}>
              {msg.role === 'assistant' && <Bot className="w-6 h-6 shrink-0 mt-1 text-primary" />}
              <div className={`prose prose-sm sm:prose-base max-w-none break-words overflow-hidden ${msg.role === 'user' ? 'prose-invert prose-p:text-white prose-headings:text-white' : ''}`}>
                {msg.isTyping ? (
                  <TypewriterText text={msg.content} onComplete={() => {
                    setMessages(prev => {
                      const newMessages = [...prev];
                      if (newMessages[idx]) newMessages[idx].isTyping = false;
                      return newMessages;
                    });
                  }} />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                )}
              </div>
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

      <div className="bg-white p-3 sm:p-4 rounded-b-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <div className="shrink-0">
            <VoiceInput onResult={handleVoiceResult} />
          </div>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('Type your question...')}
            className="flex-1 min-w-0 p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-primary hover:bg-green-700 disabled:bg-gray-400 text-white p-2 sm:p-3 rounded-xl transition-colors flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
