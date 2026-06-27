import { useState, useEffect } from 'react';
import { Sun, CloudRain, Cloud, CloudLightning, MapPin, AlertCircle, ThermometerSun } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import api from '../utils/api';

export default function WeatherWidget() {
  const { t, language } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchWeather = async (lat, lon) => {
      try {
        const res = await api.get(`/weather/alert?lat=${lat}&lon=${lon}&lang=${language}`);
        if (mounted) {
          setData(res.data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(t('Failed to load weather data'));
          setLoading(false);
        }
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          if (mounted) {
            setError(t('Location access denied'));
            setLoading(false);
          }
        }
      );
    } else {
      if (mounted) {
        setError(t('Geolocation not supported'));
        setLoading(false);
      }
    }

    return () => { mounted = false; };
  }, [language, t]);

  const Icon = ({ condition }) => {
    switch(condition) {
      case 'Clear': return <Sun className="w-10 h-10 text-yellow-500" />;
      case 'Rain': return <CloudRain className="w-10 h-10 text-blue-500" />;
      case 'Thunderstorm': return <CloudLightning className="w-10 h-10 text-purple-500" />;
      default: return <Cloud className="w-10 h-10 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-center animate-pulse shadow-sm max-w-4xl mx-auto mb-8">
        <MapPin className="w-6 h-6 text-blue-400 mr-2" />
        <span className="text-blue-800 font-medium">{t('Locating and fetching smart weather alerts...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex items-center shadow-sm max-w-4xl mx-auto mb-8">
        <AlertCircle className="w-6 h-6 text-orange-500 mr-3 shrink-0" />
        <p className="text-orange-800 font-medium">{t(error)}. {t('Please allow location access to see hyper-local farming alerts.')}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm max-w-4xl mx-auto mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
        {t('Smart Alert')}
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
        <div className="flex items-center gap-4 bg-white/60 p-4 rounded-xl border border-white/50 shrink-0 min-w-[200px]">
          <Icon condition={data?.condition} />
          <div>
            <div className="flex items-center gap-1">
              <ThermometerSun className="w-4 h-4 text-gray-600" />
              <span className="text-2xl font-bold text-gray-900">{data?.temperature}°C</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-indigo-500" />
              <p className="text-sm font-medium text-gray-700 capitalize truncate max-w-[120px]">{data?.locationName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-indigo-900 mb-1 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 p-1 rounded"><AlertCircle className="w-4 h-4" /></span>
            {t('Farming Recommendation')}
          </h3>
          <p className="text-indigo-800 leading-relaxed font-medium">
            {t(data?.recommendation || 'Check your crops regularly.')}
          </p>
        </div>
      </div>
    </div>
  );
}
