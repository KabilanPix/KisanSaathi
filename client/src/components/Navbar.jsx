import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex justify-between items-center max-w-7xl">
        <Link to="/" className="flex items-center gap-1 sm:gap-2 hover:opacity-90 transition-opacity">
          <Sprout className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />
          <span className="text-lg sm:text-xl font-bold truncate">KisanSaathi</span>
        </Link>
        <LanguageSelector />
      </div>
    </nav>
  );
}
