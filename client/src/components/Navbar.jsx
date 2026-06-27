import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-7xl">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Sprout className="w-8 h-8 text-accent" />
          <span className="text-xl font-bold">KisanSaathi</span>
        </Link>
        <LanguageSelector />
      </div>
    </nav>
  );
}
