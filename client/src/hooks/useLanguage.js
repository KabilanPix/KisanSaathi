import { useState, useEffect } from 'react';

export function useLanguage() {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('kisan_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('kisan_language', language);
  }, [language]);

  return [language, setLanguage];
}
