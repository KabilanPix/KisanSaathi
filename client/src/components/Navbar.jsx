import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  return (
    <nav className="bg-primary/95 backdrop-blur-md text-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center max-w-7xl gap-2">
        <Link to="/" className="flex items-center gap-1 sm:gap-2 hover:opacity-90 transition-opacity min-w-0">
          <Sprout className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />
          <span className="text-lg sm:text-xl font-bold truncate">KisanSaathi</span>
        </Link>
        <div className="shrink-0">
          <LanguageSelector />
        </div>
      </div>
    </nav>
  );
}
