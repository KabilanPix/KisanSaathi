import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
}
