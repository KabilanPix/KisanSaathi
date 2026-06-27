import { LANGUAGES } from '../utils/constants';
import { useLanguage } from '../hooks/useLanguage';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const [language, setLanguage] = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-5 h-5 text-gray-100" />
      <select
        value={language}
        onChange={(e) => {
          setLanguage(e.target.value);
          window.location.reload();
        }}
        className="bg-primary text-white border border-green-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
