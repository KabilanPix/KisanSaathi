import { TrendingUp, TrendingDown, MapPin, Volume2 } from 'lucide-react';
import { MSP_2024_25 } from '../utils/constants';
import { useTranslation } from '../hooks/useTranslation';

const LANG_MAP = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', pa: 'pa-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', bn: 'bn-IN', ml: 'ml-IN'
};

export default function MandiPriceCard({ data }) {
  const { t, language } = useTranslation();
  const msp = MSP_2024_25[data.commodity] || null;
  const price = parseFloat(data.modal_price);
  const isAboveMsp = msp ? price >= msp : null;

  const handleListen = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Construct text using translation keys so it actually changes based on the selected language!
    const text = `${data.commodity}. ${data.market}, ${data.district}. ${t('Modal Price')}: ${data.modal_price}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set the language accent. If a voice for this language is installed on the user's OS, it will use it.
    utterance.lang = LANG_MAP[language] || 'hi-IN';
    utterance.rate = 0.9;
    
    // Optional: Try to explicitly find a voice that matches the language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.startsWith(utterance.lang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative">
      <div className="flex justify-between items-start mb-4">
        <div className="pr-12">
          <h3 className="text-lg font-bold text-gray-800">{data.commodity}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4" />
            {data.market}, {data.district}
          </p>
        </div>
        
        {msp && (
          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
            isAboveMsp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isAboveMsp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isAboveMsp ? 'Above MSP' : 'Below MSP'}
          </div>
        )}
        
        <button 
          onClick={handleListen}
          className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
          title="Listen"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">{t('Modal Price')}</p>
          <p className="text-xl font-bold text-primary">₹{(data.modal_price / 100).toFixed(2)}<span className="text-sm font-normal text-gray-500">/kg</span></p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">MSP (2024-25)</p>
          <p className="text-xl font-bold text-gray-700">{msp ? `₹${(msp / 100).toFixed(2)}` : 'N/A'}<span className="text-sm font-normal text-gray-500">{msp ? '/kg' : ''}</span></p>
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500 border-t pt-3">
        <span>Min: ₹{(data.min_price / 100).toFixed(2)}/kg</span>
        <span>Max: ₹{(data.max_price / 100).toFixed(2)}/kg</span>
      </div>
    </div>
  );
}
