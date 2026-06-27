import { MSP_2024_25 } from '../utils/constants';
import { useTranslation } from '../hooks/useTranslation';

export default function MSPComparisonTable() {
  const { t } = useTranslation();
  const commodities = Object.keys(MSP_2024_25);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-gray-800">{t('MSP Rates (2024-25)')}</h3>
      </div>
      <div className="overflow-x-auto h-96">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3">{t('Commodity')}</th>
              <th className="px-6 py-3">{t('MSP (₹ / QUINTAL)')}</th>
            </tr>
          </thead>
          <tbody>
            {commodities.map((item, idx) => (
              <tr key={item} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-3 font-medium text-gray-900">{item}</td>
                <td className="px-6 py-3 text-primary font-semibold">₹{MSP_2024_25[item]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
