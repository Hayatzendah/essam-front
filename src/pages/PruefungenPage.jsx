import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicExams } from "../services/api";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const PROVIDERS = [
  {
    id: "goethe",
    name: "Goethe-Institut",
    icon: "🎓",
    levels: "A1 – C2",
    description:
      "امتحانات معترف فيها عالميًا، مناسبة للدراسة، العمل، والهجرة. بتلاقي نماذج وتدريبات لكل مستوى مع شرح لطريقة الامتحان."
  },
  {
    id: "telc",
    name: "telc",
    icon: "📋",
    levels: "A1 – C1",
    description:
      "امتحانات تركّز على اللغة في الحياة اليومية والعمل، وفي نماذج خاصة للمهاجرين وللشهادات المهنية."
  },
  {
    id: "oesd",
    name: "ÖSD",
    icon: "🏛️",
    levels: "A1 – C1",
    description:
      "نظام امتحانات نمساوي، مناسب للدراسة والعمل في ألمانيا والنمسا وسويسرا، مع تركيز قوي على الفهم والتعبير."
  },
  {
    id: "dtb",
    name: "DTB",
    icon: "💼",
    levels: "A2 – C1",
    description:
      "امتحانات لغة مهنية مخصّصة للعمل في ألمانيا، مع تركيز على مفردات ومواقف من بيئة الشغل."
  },
  {
    id: "dtz",
    name: "DTZ",
    icon: "🏠",
    levels: "A2 – B1",
    description:
      "امتحان مخصص للمهاجرين وبرامج الاندماج، مناسب للحصول على الإقامة الدائمة أو الجنسية."
  },
  {
    id: "ecl",
    name: "ECL",
    icon: "🇪🇺",
    levels: "A2 – C1",
    description:
      "نظام امتحانات أوروبي يركّز على التواصل العملي في المواقف اليومية والرسمية، مع تقييم واضح لكل مهارة."
  }
];

const EXAM_SKILLS = [
  {
    id: "hoeren",
    title: "Hören – الاستماع",
    icon: "🎧",
    description:
      "بتسمعي محادثات، إعلانات، رسائل صوتية أو حوارات، وبتجاوبي على أسئلة اختيار من متعدد أو صح/خطأ. في العادة بيكون في 2–3 Teile داخل قسم الاستماع."
  },
  {
    id: "lesen",
    title: "Lesen – القراءة",
    icon: "📖",
    description:
      "نصوص من الحياة اليومية، رسائل، إيميلات، أو مقالات قصيرة. الأسئلة بتكون اختيار من متعدد، مطابقة، أو تعبئة فراغات، وغالبًا 3–4 Teile حسب نوع الامتحان."
  },
  {
    id: "schreiben",
    title: "Schreiben – الكتابة",
    icon: "✍️",
    description:
      "كتابة رسالة، إيميل، أو نص قصير حسب المستوى. أحيانًا Teil واحد أو اثنين، مع نقاط لازم تغطيها في الإجابة عشان تاخدي العلامة الكاملة."
  },
  {
    id: "sprechen",
    title: "Sprechen – المحادثة",
    icon: "💬",
    description:
      "محادثة مع الممتحِن أو متقدّم ثاني، فيها تعارف بسيط، وصف صور، أو نقاش حول موضوع معيّن، وغالبًا مقسومة إلى 2–3 Teile."
  }
];

export default function PruefungenPage() {
  const [activeLevel, setActiveLevel] = useState("A1");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedProvider) {
      loadExams();
    }
  }, [activeLevel, selectedProvider]);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPublicExams({
        level: activeLevel,
        provider: selectedProvider,
      });
      console.log('📊 Received exams data:', data);
      console.log('📊 First exam (if exists):', data.items?.[0] || data?.[0]);
      setExams(data.items || data || []);
    } catch (err) {
      console.error("Error loading exams:", err);

      // رسالة خطأ أوضح
      if (err.response?.status === 401) {
        // المستخدم مش مسجل دخول - وديه على اللوجن
        navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      } else if (err.response?.status === 404) {
        setError("لا توجد امتحانات متاحة لهذا المستوى والجهة.");
      } else {
        setError("حدث خطأ أثناء تحميل الامتحانات. حاول مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderClick = (providerId) => {
    setSelectedProvider(providerId);
    setExams([]);
  };

  const handleExamClick = (examId) => {
    console.log('🎯 handleExamClick called with examId:', examId);
    console.log('🎯 Type of examId:', typeof examId);
    navigate(`/pruefungen/exam/${examId}`);
  };

  const handleBackToProviders = () => {
    setSelectedProvider(null);
    setExams([]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* شريط أعلى بسيط */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← العودة للرئيسية
          </button>
          <span className="text-xs font-semibold text-rose-500">
            Deutsch Learning App
          </span>
        </div>

        {/* العنوان الرئيسي */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            الامتحانات الرسمية <span className="text-rose-500">Prüfungen</span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
            من خلال هذا القسم بتقدري تجهزي لامتحانات Goethe, TELC, ÖSD, DTB, DTZ, ECL
            وتشوفي شكل الامتحان، تقسيمه لمهارات الاستماع، القراءة، الكتابة،
            والمحادثة، مع تدريبات عملية لكل مستوى. 📝
          </p>
        </div>

        {/* Tabs للمستويات */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveLevel(level)}
              className={`px-4 py-2 text-sm rounded-full border transition ${
                activeLevel === level
                  ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-rose-400 hover:text-rose-600"
              }`}
            >
              مستوى {level}
            </button>
          ))}
        </div>

        {/* إذا ما في جهة مختارة - عرض كروت الجهات */}
        {!selectedProvider && (
          <>
            {/* عنوان قسم الجهات */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                اختاري الجهة المنظمة للامتحان
              </h2>
              <p className="text-xs text-slate-500 max-w-xl mx-auto">
                كل جهة إلها طريقة خاصة في الامتحان وتقسيم الدرجات، لكن الكل
                بيعتمد على المهارات الأربع الأساسية.
              </p>
            </div>

            {/* كروت الجهات الممتحنة */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleProviderClick(provider.id)}
                  className="group text-right bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-xl">
                      {provider.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {provider.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        المستويات: {provider.levels}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    {provider.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-rose-600">
                    <span className="font-semibold group-hover:underline">
                      عرض امتحانات {provider.name}
                    </span>
                    <span>↗</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* إذا في جهة مختارة - عرض الامتحانات */}
        {selectedProvider && (
          <div className="mb-12">
            {/* زر الرجوع */}
            <button
              onClick={handleBackToProviders}
              className="mb-6 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-2"
            >
              ← الرجوع لاختيار جهة أخرى
            </button>

            {/* عنوان الجهة المختارة */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                امتحانات {PROVIDERS.find((p) => p.id === selectedProvider)?.name}
              </h2>
              <p className="text-sm text-slate-500">
                المستوى: <span className="font-semibold text-slate-800">{activeLevel}</span>
              </p>
            </div>

            {/* حالة التحميل */}
            {loading && (
              <div className="text-center text-slate-500 text-sm mt-10">
                جاري تحميل الامتحانات…
              </div>
            )}

            {/* حالة الخطأ */}
            {error && !loading && (
              <div className="text-center text-rose-600 text-sm mt-10 bg-rose-50 border border-rose-100 rounded-xl py-4">
                {error}
              </div>
            )}

            {/* لا توجد امتحانات */}
            {!loading && !error && exams.length === 0 && (
              <div className="text-center text-slate-500 text-sm mt-10 bg-slate-50 border border-slate-200 rounded-xl py-8">
                لا توجد امتحانات متاحة حاليًا لهذا المستوى والجهة.
              </div>
            )}

            {/* قائمة الامتحانات */}
            {!loading && !error && exams.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exams.map((exam) => (
                  <button
                    key={exam.id || exam._id}
                    type="button"
                    onClick={() => handleExamClick(exam.id || exam._id)}
                    className="group text-right bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                        📝
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {exam.title}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {exam.level} • {exam.provider}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                      {exam.description || "امتحان تجريبي شامل"}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {exam.timeLimitMin ? `${exam.timeLimitMin} دقيقة` : "بدون وقت محدد"}
                      </span>
                      <span className="text-rose-600 font-semibold group-hover:underline">
                        ابدأ الامتحان ↗
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* قسم بنية الامتحان */}
        {!selectedProvider && (
          <>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-8 mb-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  كيف بيكون شكل الامتحان؟
                </h2>
                <p className="text-sm text-slate-600 max-w-2xl mx-auto">
                  أغلب الامتحانات الرسمية بتتكوّن من أربع مهارات رئيسية، وكل مهارة ممكن
                  تكون مقسومة لأجزاء (Teile) بعدد معيّن حسب الجهة والمستوى.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {EXAM_SKILLS.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-2xl mb-3">
                      {skill.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">
                      {skill.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* قسم كيف تستخدمي */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  كيف تستخدمي قسم الامتحانات؟
                </h2>
              </div>

              <div className="max-w-2xl mx-auto">
                <ol className="space-y-4">
                  {[
                    'من الصفحة الرئيسية اضغطي على بطاقة "Prüfungen".',
                    "اختاري الجهة المنظمة للامتحان من الكروت الموجودة فوق.",
                    "اختاري المستوى المناسب إلك (A1, A2, B1, B2, C1...).",
                    "اطّلعي على شكل الامتحان وتقسيمه لكل مهارة مع الأمثلة.",
                    "ابدئي حل تدريبات محاكية للامتحان الحقيقي عن طريق الكويزات.",
                  ].map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
