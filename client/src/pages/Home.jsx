import React from 'react';
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
      <div className="text-center mb-8 sm:mb-12 px-2 sm:px-0">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-4 leading-tight">{t('Empowering Indian Farmers')}</h1>
        <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
          {t('KisanSaathi is your one-stop platform for live mandi prices, AI-driven farming advice, insurance guidance, and expense tracking.')}
        </p>
      </div>

      <WeatherWidget />

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto px-2 sm:px-0">
        {features.map((f, i) => (
          <Link key={i} to={f.link} className="block group">
            <div className={`p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col ${f.color}`}>
              <div className="bg-white w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                {/* Clone element to adjust icon size for mobile */}
                {React.cloneElement(f.icon, { className: 'w-6 h-6 sm:w-8 sm:h-8 ' + f.icon.props.className.replace('w-8 h-8 ', '') })}
              </div>
              <h2 className="text-base sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">{f.title}</h2>
              <p className="text-xs sm:text-base text-gray-600 line-clamp-2 sm:line-clamp-none">{f.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-center">
        <a href="https://t.me/MandiPrice_bot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <MessageSquareText className="w-4 h-4 mr-1.5" />
          {t('Also available on Telegram:')} <span className="font-medium ml-1 text-blue-600">@MandiPrice_bot</span>
        </a>
      </div>
    </div>
  );
}
