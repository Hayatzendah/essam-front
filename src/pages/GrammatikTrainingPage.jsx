import { useNavigate } from 'react-router-dom';

export default function GrammatikTrainingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-lime-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-4xl">
          ✏️
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Grammatik-Training</h1>
        <p className="text-slate-600 mb-6">
          تدرب على القواعد: تمارين تفاعلية للمستويات A1 – C1. القسم قيد الإعداد.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/grammatik')}
            className="px-6 py-2.5 bg-lime-600 hover:bg-lime-700 text-white rounded-lg font-medium transition-colors"
          >
            عرض Grammatik
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
