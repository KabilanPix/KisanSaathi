import { Link } from 'react-router-dom';
import { IndianRupee, MessageSquareText, ShieldCheck, Calculator } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import WeatherWidget from '../components/WeatherWidget';

export default function Home() {
  const { t } = useTranslation();
  const features = [
    {
      title: t('Mandi Prices'),
      desc: t('Check live crop prices & MSP'),
      icon: <IndianRupee className="w-8 h-8 text-primary" />,
      link: '/mandi',
      color: 'bg-green-50'
    },
    {
      title: t('AI Advisory'),
      desc: t('Ask questions in your language'),
      icon: <MessageSquareText className="w-8 h-8 text-blue-600" />,
      link: '/advisory',
      color: 'bg-blue-50'
    },
    {
      title: t('Crop Insurance'),
      desc: t('Get PMFBY scheme guidance'),
      icon: <ShieldCheck className="w-8 h-8 text-amber-600" />,
      link: '/insurance',
      color: 'bg-amber-50'
    },
    {
      title: t('Cost Tracker'),
      desc: t('Track expenses & estimate profit'),
      icon: <Calculator className="w-8 h-8 text-purple-600" />,
      link: '/costs',
      color: 'bg-purple-50'
    }
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('Empowering Indian Farmers')}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('KisanSaathi is your one-stop platform for live mandi prices, AI-driven farming advice, insurance guidance, and expense tracking.')}
        </p>
      </div>

      <WeatherWidget />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {features.map((f, i) => (
          <Link key={i} to={f.link} className="block group">
            <div className={`p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full ${f.color}`}>
              <div className="bg-white w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                {f.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{f.title}</h2>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
