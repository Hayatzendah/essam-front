import { useNavigate } from 'react-router-dom';

export default function DialogePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-4xl">
          💭
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dialoge</h1>
        <p className="text-slate-600 mb-6">
          حوارات ومواقف يومية للتدرب على المحادثة. القسم قيد الإعداد.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
