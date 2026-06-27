import { Mic, Square } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useLanguage } from '../hooks/useLanguage';
import { useEffect } from 'react';

export default function VoiceInput({ onResult }) {
  const [language] = useLanguage();
  const { isListening, transcript, startListening, stopListening, setTranscript } = useVoice(language);

  useEffect(() => {
    if (!isListening && transcript) {
      onResult(transcript);
      setTranscript('');
    }
  }, [isListening, transcript, onResult, setTranscript]);

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`p-3 rounded-full transition-colors ${
        isListening 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
          : 'bg-green-100 hover:bg-green-200 text-primary'
      }`}
      title={isListening ? 'Stop listening' : 'Start voice input'}
    >
      {isListening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}
