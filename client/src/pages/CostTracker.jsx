import { useState, useEffect } from 'react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calculator, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../hooks/useLanguage';
import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticides', 'Labour', 'Irrigation', 'Machinery', 'Other'];
const COLORS = ['#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

export default function CostTracker() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem('kisan_session') || crypto.randomUUID());
  const [language] = useLanguage();
  
  useEffect(() => {
    localStorage.setItem('kisan_session', sessionId);
    fetchData();
  }, [sessionId]);

  const fetchCoreData = async () => {
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        api.get(`/costs/entries?session_id=${sessionId}`),
        api.get(`/costs/summary?session_id=${sessionId}`)
      ]);
      setEntries(entriesRes.data.entries);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAiAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const adviceRes = await api.get(`/costs/ai-advice?session_id=${sessionId}&language=${language}`);
      setAiAdvice(adviceRes.data.advice || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdvice(false);
    }
  };

  const fetchData = () => {
    fetchCoreData();
    fetchAiAdvice();
  };

  const [form, setForm] = useState({ category: CATEGORIES[0], item_name: '', quantity: '', unit: 'kg', cost_per_unit: '' });
  const [projection, setProjection] = useState({ yield: '', price: '', unit: 'Quintals' });

  const totalCost = summary.reduce((acc, curr) => acc + curr.total, 0);
  const projectedRevenue = (parseFloat(projection.yield) || 0) * (parseFloat(projection.price) || 0);
  const estimatedProfit = projectedRevenue - totalCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total_cost = parseFloat(form.quantity) * parseFloat(form.cost_per_unit);
    if (!total_cost) {
      toast.error('Invalid quantity or cost');
      return;
    }

    try {
      await api.post('/costs/entry', { ...form, total_cost, session_id: sessionId, crop_season: 'Current' });
      toast.success('Cost added successfully');
      setForm({ ...form, item_name: '', quantity: '', cost_per_unit: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to add cost');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/costs/entry/${id}`);
      toast.success('Entry deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Calculator className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('Input Cost Tracker')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{t('Add Expense')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('Category')}</label>
                <select className="w-full p-2 border rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('Item Name')}</label>
                <input type="text" required className="w-full p-2 border rounded" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} placeholder={t("e.g. Urea")} />
              </div>
              <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">{t('Quantity')}</label>
                  <input type="number" required min="0.1" step="0.1" className="w-full p-2 border rounded" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">{t('Unit')}</label>
                  <input type="text" className="w-full p-2 border rounded" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder={t("kg, L, etc")} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('Cost per Unit (₹)')}</label>
                <input type="number" required min="1" step="1" className="w-full p-2 border rounded" value={form.cost_per_unit} onChange={e => setForm({...form, cost_per_unit: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-colors font-medium">{t('Add Expense')}</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{t('Yield Projection')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('Expected Yield')}</label>
                <div className="flex gap-2">
                  <input type="number" className="flex-1 p-2 border rounded" value={projection.yield} onChange={e => setProjection({...projection, yield: e.target.value})} />
                  <select className="p-2 border rounded bg-gray-50 text-sm font-medium" value={projection.unit} onChange={e => setProjection({...projection, unit: e.target.value})}>
                    <option value="Quintals">{t('Quintals')}</option>
                    <option value="kg">{t('kg')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('Expected Selling Price')} (₹/{projection.unit === 'Quintals' ? t('Qtl') : t('kg')})</label>
                <input type="number" className="w-full p-2 border rounded" value={projection.price} onChange={e => setProjection({...projection, price: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
              <p className="text-red-800 text-sm font-semibold mb-1">{t('Total Expenses')}</p>
              <p className="text-3xl font-bold text-red-900">₹{totalCost.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <p className="text-green-800 text-sm font-semibold mb-1">{t('Projected Revenue')}</p>
              <p className="text-3xl font-bold text-green-900">₹{projectedRevenue.toFixed(2)}</p>
            </div>
            <div className={`p-6 rounded-2xl border ${estimatedProfit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
              <p className={`text-sm font-semibold mb-1 ${estimatedProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{t('Estimated Profit/Loss')}</p>
              <p className={`text-3xl font-bold ${estimatedProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                {estimatedProfit >= 0 ? '+' : '-'}₹{Math.abs(estimatedProfit).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{t('Expense Breakdown')}</h2>
            {summary.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary}>
                    <XAxis dataKey="category" tickFormatter={(val) => t(val)} />
                    <YAxis />
                    <Tooltip cursor={{fill: '#f3f4f6'}} labelFormatter={(val) => t(val)} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {summary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">{t('No expenses logged yet.')}</p>
            )}
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 p-6 rounded-2xl shadow-sm border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-purple-900">{t('AI Cost Optimization')}</h2>
            </div>
            {aiAdvice ? (
              <div className="text-purple-900 prose prose-sm sm:prose-base max-w-none prose-headings:text-purple-900 prose-a:text-purple-700 prose-strong:text-purple-900 overflow-hidden">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{aiAdvice}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-purple-600 italic text-sm">{t('Loading AI suggestions...')}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
               <h3 className="font-bold text-gray-800">{t('Recent Entries')}</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                   <tr>
                     <th className="px-6 py-3">{t('Date')}</th>
                     <th className="px-6 py-3">{t('Category')}</th>
                     <th className="px-6 py-3">{t('Item')}</th>
                     <th className="px-6 py-3 text-right">{t('Amount')}</th>
                     <th className="px-6 py-3"></th>
                   </tr>
                 </thead>
                 <tbody>
                   {entries.map(entry => (
                     <tr key={entry.id} className="border-b border-gray-50">
                       <td className="px-6 py-3">{new Date(entry.entry_date).toLocaleDateString()}</td>
                       <td className="px-6 py-3">{t(entry.category)}</td>
                       <td className="px-6 py-3">{entry.item_name}</td>
                       <td className="px-6 py-3 text-right font-semibold">₹{parseFloat(entry.total_cost).toFixed(2)}</td>
                       <td className="px-6 py-3 text-right">
                         <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                   {entries.length === 0 && (
                     <tr>
                       <td colSpan="5" className="px-6 py-8 text-center text-gray-500">{t('No recent entries')}</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
