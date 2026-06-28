import { useState } from 'react';
import api from '../utils/api';
import { useLanguage } from '../hooks/useLanguage';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import indiaData from '../data/states.json';

export default function Insurance() {
  const { t } = useTranslation();
  const [language] = useLanguage();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  
  const [form, setForm] = useState({
    state: '',
    district: '',
    crop: '',
    season: 'Kharif',
    acres: ''
  });

  const selectedStateData = indiaData.states.find(s => s.state === form.state);
  const districts = selectedStateData ? selectedStateData.districts : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.state || !form.district || !form.crop || !form.acres) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/insurance/advise', { ...form, language });
      setAdvice(res.data);
      toast.success('Insurance advice generated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to get insurance advice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('Crop Insurance Advisor')}</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('State')}</label>
            <input type="text" list="states-list" required value={form.state} 
              onChange={e => setForm({...form, state: e.target.value, district: ''})}
              className="w-full p-2 border rounded focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. Maharashtra" />
            <datalist id="states-list">
              {indiaData.states.map(s => (
                <option key={s.state} value={s.state} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('District')}</label>
            <input type="text" list="districts-list" required value={form.district} 
              onChange={e => setForm({...form, district: e.target.value})}
              className="w-full p-2 border rounded focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. Pune" disabled={!form.state} />
            <datalist id="districts-list">
              {districts.map(d => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Commodity')}</label>
            <input type="text" required value={form.crop} onChange={e => setForm({...form, crop: e.target.value})}
              className="w-full p-2 border rounded focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. Cotton" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Season')}</label>
            <select value={form.season} onChange={e => setForm({...form, season: e.target.value})}
              className="w-full p-2 border rounded focus:ring-amber-500 focus:border-amber-500">
              <option value="Kharif">{t('Kharif')}</option>
              <option value="Rabi">{t('Rabi')}</option>
              <option value="Zaid">{t('Zaid')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Land Holding (Acres)')}</label>
            <input type="number" required min="0.1" step="0.1" value={form.acres} onChange={e => setForm({...form, acres: e.target.value})}
              className="w-full p-2 border rounded focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. 5" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-lg font-medium transition-colors disabled:bg-gray-400">
              {loading ? t('Getting Advice...') : t('Get Insurance Guidance')}
            </button>
          </div>
        </form>
      </div>

      {loading && <LoadingSpinner message="Analyzing PMFBY schemes..." />}

      {!loading && advice && (
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-amber-900">{t('Your Insurance Guide')}</h2>
            {advice.risk_level && (
              <span className={`px-4 py-1 rounded-full text-sm font-bold shadow-sm border ${
                advice.risk_level === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                advice.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-green-100 text-green-800 border-green-200'
              }`}>
                {t('Risk Level')}: {t(advice.risk_level)}
              </span>
            )}
          </div>
          <div className="text-amber-900 whitespace-pre-wrap leading-relaxed">
            {advice.advice}
          </div>
        </div>
      )}
    </div>
  );
}
