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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('Live Mandi Prices')}</h1>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((record, idx) => (
                <MandiPriceCard key={idx} data={record} />
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
