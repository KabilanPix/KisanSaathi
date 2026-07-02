import { NavLink } from 'react-router-dom';
import { Home, IndianRupee, MessageSquareText, ShieldCheck, Calculator } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function BottomNav() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { to: '/mandi', icon: <IndianRupee className="w-5 h-5" />, label: 'Mandi' },
    { to: '/advisory', icon: <MessageSquareText className="w-5 h-5" />, label: 'Advisory' },
    { to: '/insurance', icon: <ShieldCheck className="w-5 h-5" />, label: 'Insurance' },
    { to: '/costs', icon: <Calculator className="w-5 h-5" />, label: 'Costs' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex justify-around items-center h-[60px] px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-900'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium truncate w-full text-center px-0.5 leading-none">
              {t(item.label)}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
