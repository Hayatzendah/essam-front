import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExamDetails, createAttempt, fixExamSections } from "../services/api";

export default function ExamDetailsPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExamDetails();
  }, [examId]);

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getExamDetails(examId);
      setExam(data);
    } catch (err) {
      console.error("Error loading exam details:", err);

      // إذا الخطأ 401 - المستخدم مش مسجل دخول
      if (err.response?.status === 401) {
        // وديه مباشرة للوجن
        const currentPath = `/pruefungen/exam/${examId}`;
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      } else {
        setError("حدث خطأ أثناء تحميل تفاصيل الامتحان. حاول مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFixExam = async () => {
    try {
      setStarting(true);
      const result = await fixExamSections(examId);
      console.log('✅ Exam sections fixed:', result);
      alert('✅ تم إصلاح الامتحان بنجاح! جرب الآن.');
      // إعادة تحميل تفاصيل الامتحان
      await loadExamDetails();
    } catch (err) {
      console.error('Error fixing exam:', err);
      if (err.response?.status === 403) {
        alert('❌ ليس لديك صلاحية لإصلاح الامتحانات (admin only)');
      } else {
        alert('❌ حدث خطأ أثناء إصلاح الامتحان');
      }
    } finally {
      setStarting(false);
    }
  };

  const handleStartExam = async () => {
    // تحقق من تسجيل الدخول
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // إذا مش مسجل دخول، وديه على صفحة اللوجن
      const currentPath = `/pruefungen/exam/${examId}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    try {
      setStarting(true);
      const data = await createAttempt(examId, "exam");
      // الانتقال لصفحة حل الامتحان
      navigate(`/student/exam/${data.attemptId}`);
    } catch (err) {
      console.error("Error starting exam:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      // إذا الخطأ 401 (Unauthorized)، وديه على اللوجن
      if (err.response?.status === 401) {
        const currentPath = `/pruefungen/exam/${examId}`;
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      } else if (err.response?.data?.code === 'NO_QUESTIONS_FOR_SECTION') {
        // إذا المشكلة هي sections فاضية، عرض زر الإصلاح
        const shouldFix = window.confirm(
          '⚠️ هذا الامتحان يحتوي على أقسام فارغة.\n\n' +
          'هل تريد إصلاحه تلقائياً؟ (يتطلب صلاحيات admin)'
        );
        if (shouldFix) {
          await handleFixExam();
        }
      } else {
        const errorMsg = err.response?.data?.message || "حدث خطأ أثناء بدء الامتحان. حاول مرة أخرى.";
        alert(errorMsg);
      }
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-slate-600">جاري تحميل تفاصيل الامتحان...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-rose-600 mb-4">{error || "لم يتم العثور على الامتحان"}</p>
          <button
            onClick={() => navigate("/pruefungen")}
            className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition"
          >
            العودة للامتحانات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* شريط أعلى بسيط */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/pruefungen")}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← العودة للامتحانات
          </button>
          <span className="text-xs font-semibold text-rose-500">
            Deutsch Learning App
          </span>
        </div>

        {/* تفاصيل الامتحان */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                📝
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {exam.title}
                </h1>
                <p className="text-rose-100 text-sm">
                  {exam.provider} • {exam.level}
                </p>
              </div>
            </div>
            {exam.description && (
              <p className="text-white/90 text-sm leading-relaxed">
                {exam.description}
              </p>
            )}
          </div>

          {/* معلومات الامتحان */}
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl mb-2">⏱️</div>
                <p className="text-xs text-slate-500 mb-1">المدة</p>
                <p className="text-sm font-semibold text-slate-900">
                  {exam.timeLimitMin ? `${exam.timeLimitMin} دقيقة` : "مفتوح"}
                </p>
              </div>

              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-xs text-slate-500 mb-1">المستوى</p>
                <p className="text-sm font-semibold text-slate-900">
                  {exam.level}
                </p>
              </div>

              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl mb-2">🏛️</div>
                <p className="text-xs text-slate-500 mb-1">الجهة</p>
                <p className="text-sm font-semibold text-slate-900">
                  {exam.provider}
                </p>
              </div>

              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-xs text-slate-500 mb-1">الحالة</p>
                <p className="text-sm font-semibold text-green-600">
                  متاح
                </p>
              </div>
            </div>

            {/* أقسام الامتحان */}
            {exam.sections && exam.sections.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  أقسام الامتحان
                </h2>
                <div className="space-y-3">
                  {exam.sections.map((section, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-rose-100 rounded-lg flex items-center justify-center text-xl">
                          {section.skill === "hoeren" && "🎧"}
                          {section.skill === "lesen" && "📖"}
                          {section.skill === "schreiben" && "✍️"}
                          {section.skill === "sprechen" && "💬"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {section.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {section.numParts} {section.numParts === 1 ? "Teil" : "Teile"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {section.maxPoints} نقطة
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تعليمات */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span>💡</span>
                تعليمات مهمة
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>تأكدي من وجود اتصال إنترنت مستقر قبل البدء</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>اختاري مكان هادئ للتركيز على الامتحان</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>إذا كان الامتحان محدد بوقت، سيبدأ العد التنازلي فور البدء</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>يمكنك حفظ إجاباتك والعودة للامتحان لاحقًا</span>
                </li>
              </ul>
            </div>

            {/* أزرار البدء والإصلاح */}
            <div className="space-y-3">
              <button
                onClick={handleStartExam}
                disabled={starting}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    جاري التحضير...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>🚀</span>
                    ابدأ الامتحان الآن
                  </span>
                )}
              </button>

              {/* زر الإصلاح للـ admin */}
              <button
                onClick={handleFixExam}
                disabled={starting}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm shadow hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>🔧</span>
                  إصلاح الامتحان (admin)
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
