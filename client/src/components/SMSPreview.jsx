import { Smartphone } from 'lucide-react';

export default function SMSPreview({ data }) {
  if (!data) return null;

  const date = new Date().toLocaleDateString('en-IN');
  
  const smsText = `KisanSaathi Update:\nMarket: ${data.market}, ${data.district}\nCrop: ${data.commodity}\nPrice: Rs ${(data.modal_price / 100).toFixed(2)}/kg\nMin: Rs ${(data.min_price / 100).toFixed(2)}, Max: Rs ${(data.max_price / 100).toFixed(2)}\nDate: ${date}`;

  return (
    <div className="bg-gray-50 rounded-3xl p-4 border-8 border-gray-800 w-full max-w-sm mx-auto shadow-xl relative aspect-[1/2] flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-800 rounded-b-xl"></div>
      
      <div className="flex items-center gap-2 mt-4 mb-4 pb-2 border-b border-gray-200">
        <Smartphone className="w-5 h-5 text-gray-500" />
        <span className="font-semibold text-gray-700 text-sm">Messages</span>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto flex-1 pb-4">
        <div className="flex flex-col items-start">
            <div className="bg-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm whitespace-pre-wrap font-sans shadow-sm inline-block max-w-[90%]">
                {smsText}
            </div>
            <div className="text-xs text-gray-400 mt-1 ml-1">Just now • SMS</div>
        </div>
      </div>
    </div>
  );
}
