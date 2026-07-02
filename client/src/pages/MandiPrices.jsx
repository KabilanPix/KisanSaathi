import { useState, useEffect } from 'react';
import api from '../utils/api';
import MandiPriceCard from '../components/MandiPriceCard';
import MSPComparisonTable from '../components/MSPComparisonTable';
import SMSPreview from '../components/SMSPreview';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchableSelect from '../components/SearchableSelect';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

export default function MandiPrices() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [bestMarket, setBestMarket] = useState(null);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [commodities, setCommodities] = useState([]);

  const [form, setForm] = useState({ state: '', district: '', commodity: '' });

  useEffect(() => {
    // Fetch dropdown options initially
    api.get('/mandi/states').then(res => setStates(res.data.states)).catch(() => {});
    api.get('/mandi/commodities').then(res => setCommodities(res.data.commodities)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.state) {
      api.get(`/mandi/districts?state=${form.state}`).then(res => {
        setDistricts(res.data.districts);
      }).catch(() => {});
    } else {
      setDistricts([]);
    }
  }, [form.state]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!form.state || !form.district || !form.commodity) {
      toast.error('Please select all fields');
      return;
    }
    
    setLoading(true);
    setBestMarket(null);
    try {
      const res = await api.get('/mandi/prices', { params: form });
      setData(res.data.records || []);
      setBestMarket(res.data.bestNearbyMarket || null);
      toast.success('Prices fetched successfully');
    } catch (err) {
      toast.error('Failed to fetch prices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-1 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('Live Mandi Prices')}</h1>
      </div>
      
      {/* Telegram Bot Promotion Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm mx-1 sm:mx-0">
        <div className="flex items-start sm:items-center gap-3">
          <div className="bg-blue-500 text-white p-2.5 rounded-xl shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.32-2.74 7.59-3.27 3.61-1.5 4.36-1.76 4.85-1.77.11 0 .35.03.5.16.13.12.17.27.18.42 0 .07-.01.19-.02.26z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-base sm:text-lg">{t('Get Mandi Prices on Telegram')}</h3>
            <p className="text-sm text-blue-700 mt-0.5">
              {t('Get instant updates, ask queries and check crop prices directly via our Telegram Bot.')}
            </p>
          </div>
        </div>
        <a 
          href="https://t.me/MandiPrice_bot" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow transition-all duration-200 shrink-0 text-sm text-center w-full md:w-auto"
        >
          {t('Open Telegram Bot')}
        </a>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div>
            <SearchableSelect 
              label={t('State')}
              placeholder="Select State"
              options={states}
              value={form.state}
              onChange={(val) => setForm({...form, state: val, district: ''})}
            />
          </div>
          <div>
            <SearchableSelect 
              label={t('District')}
              placeholder="Select District"
              options={districts}
              value={form.district}
              onChange={(val) => setForm({...form, district: val})}
            />
          </div>
          <div>
            <SearchableSelect 
              label={t('Commodity')}
              placeholder="Select Crop"
              options={commodities}
              value={form.commodity}
              onChange={(val) => setForm({...form, commodity: val})}
            />
          </div>
          <button type="submit" className="bg-primary hover:bg-green-700 text-white p-2 rounded transition-colors w-full md:w-auto h-10 font-medium">
            {t('Search Prices')}
          </button>
        </form>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && data && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">{t('Live Mandi Prices')}</h2>
            <div className="flex overflow-x-auto pb-4 snap-x snap-mandatory gap-4 -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible no-scrollbar">
              {data.map((record, idx) => (
                <div key={idx} className="min-w-[85vw] sm:min-w-0 snap-center shrink-0">
                  <MandiPriceCard data={record} />
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <MSPComparisonTable />
            </div>

            {bestMarket && data.length > 0 && (() => {
              const localLowestPrice = Math.min(...data.map(d => parseFloat(d.modal_price) || 0));
              const extraProfit = parseFloat(bestMarket.modal_price) - localLowestPrice;
              
              if (extraProfit <= 0) return null;

              return (
              <div className="mt-8 bg-green-50 p-6 rounded-2xl border border-green-200 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-xl font-bold text-xs">
                  SUGGESTED MARKET
                </div>
                <h3 className="text-lg font-bold text-green-900 mb-2">💡 Best Nearby Market</h3>
                <p className="text-green-800 text-sm mb-4">
                  We found a better price for <strong>{bestMarket.commodity}</strong> in <strong>{bestMarket.market}, {bestMarket.district}</strong>!
                </p>
                
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-green-100">
                  <div>
                    <p className="text-xs text-gray-500">Local Lowest Price</p>
                    <p className="text-lg font-bold text-gray-700">₹{(localLowestPrice / 100).toFixed(2)}/kg</p>
                  </div>
                  <div className="text-center px-4">
                    <span className="text-green-600 font-bold text-lg">➔</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{bestMarket.market} Price</p>
                    <p className="text-2xl font-bold text-green-600">₹{(bestMarket.modal_price / 100).toFixed(2)}/kg</p>
                  </div>
                </div>
                
                <p className="text-center mt-3 text-sm font-semibold text-green-700">
                  Potential Extra Profit: ₹{(extraProfit / 100).toFixed(2)} per kg
                </p>
              </div>
            )})()}
          </div>
          
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-6">SMS Alert Preview</h2>
            <SMSPreview data={data[0]} />
            
            <div className="mt-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Send Alert to Farmer</label>
              <div className="flex gap-2">
                <input 
                  type="tel" 
                  placeholder="Enter 10-digit number"
                  className="flex-1 p-2 border rounded focus:ring-primary focus:border-primary text-sm"
                  id="sms-phone"
                />
                <button 
                  onClick={async () => {
                    const phone = document.getElementById('sms-phone').value;
                    if (!phone || phone.length < 10) return toast.error('Enter valid phone number');
                    const msg = `KisanSaathi Update:\nMarket: ${data[0].market}\nCrop: ${data[0].commodity}\nPrice: Rs ${(data[0].modal_price / 100).toFixed(2)}/kg\nMin: Rs ${(data[0].min_price / 100).toFixed(2)}, Max: Rs ${(data[0].max_price / 100).toFixed(2)}`;
                    try {
                      await api.post('/sms/send', { phone, message: msg });
                      toast.success('SMS Sent Successfully!');
                    } catch (e) {
                      toast.error('Failed to send SMS');
                    }
                  }}
                  className="bg-primary hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && data && data.length === 0 && (
        <div className="text-center p-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">{t('No prices found for the selected combination.')}</p>
        </div>
      )}
    </div>
  );
}
