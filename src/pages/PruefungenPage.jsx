import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, FileText, Building2, Briefcase, Home, Globe, Headphones, BookOpen, PenLine, MessageCircle, Puzzle, FileCheck } from "lucide-react";
import { getPublicExams, getProviderSkills, createAttempt } from "../services/api";
import { useLevels } from "../hooks/useLevels";
import { BRAND } from "../constants/brand";
import { useTranslation } from "../contexts/LanguageContext";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

const PROVIDER_ICONS = { goethe: GraduationCap, telc: FileText, oesd: Building2, dtb: Briefcase, dtz: Home, ecl: Globe };
const SKILL_ICONS = { hoeren: Headphones, lesen: BookOpen, schreiben: PenLine, sprechen: MessageCircle, sprachbausteine: Puzzle };

const PROVIDERS = [
  { id: "goethe", name: "Goethe-Institut", levels: "A1 – C1", allowedLevels: ["A1", "A2", "B1", "B2", "C1"], description: "Weltweit anerkannte Prüfungen für Studium, Arbeit und Migration. Mit Modelltests und Übungen für jedes Niveau." },
  { id: "telc", name: "telc", levels: "A1 – C1", allowedLevels: ["A1", "A2", "B1", "B2", "C1"], description: "Prüfungen für Alltag und Beruf, mit speziellen Formaten für Zuwanderer und berufliche Zertifikate." },
  { id: "oesd", name: "ÖSD", levels: "A1 – C1", allowedLevels: ["A1", "A2", "B1", "B2", "C1"], description: "Österreichisches Prüfungssystem für Studium und Arbeit in D-A-CH, mit starkem Fokus auf Verstehen und Ausdruck." },
  { id: "dtb", name: "DTB", levels: "A2 – C1", allowedLevels: ["A2", "B1", "B2", "C1"], description: "Berufssprachliche Prüfungen für die Arbeit in Deutschland, mit Fokus auf Wortschatz und Situationen im Beruf." },
  { id: "dtz", name: "DTZ", levels: "B1", allowedLevels: ["B1"], description: "Prüfung für Zuwanderer und Integrationskurse, u. a. für Niederlassung oder Einbürgerung." },
  { id: "ecl", name: "ECL", levels: "A2 – C1", allowedLevels: ["A2", "B1", "B2", "C1"], description: "Europäisches Prüfungssystem mit Fokus auf praktische Kommunikation in Alltag und Beruf." }
];

const EXAM_SKILLS = [
  { id: "hoeren", title: "Hören", description: "Dialoge, Anzeigen, Nachrichten oder Gespräche anhören und Multiple-Choice- oder Richtig/Falsch-Fragen beantworten. Meist 2–3 Teile." },
  { id: "lesen", title: "Lesen", description: "Texte aus dem Alltag, Briefe, E-Mails oder kurze Artikel. Aufgaben als Multiple Choice, Zuordnung oder Lückentext, oft 3–4 Teile." },
  { id: "schreiben", title: "Schreiben", description: "Brief, E-Mail oder kurzer Text je nach Niveau. Oft ein oder zwei Teile mit klaren Bewertungskriterien." },
  { id: "sprechen", title: "Sprechen", description: "Gespräch mit Prüfer oder anderem Kandidaten: Vorstellung, Bildbeschreibung, Diskussion. Meist 2–3 Teile." },
  { id: "sprachbausteine", title: "Sprachbausteine", description: "Übungen zur richtigen Wortwahl und Grammatik in Lückentexten oder Sätzen." }
];

export default function PruefungenPage() {
  const t = useTranslation();
  const { levelNames } = useLevels('pruefungen');
  const [activeLevel, setActiveLevel] = useState("A1");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startingExamId, setStartingExamId] = useState(null);
  const navigate = useNavigate();

  // Load skills when provider is selected (or level changes)
  useEffect(() => {
    if (selectedProvider && !selectedSkill) {
      loadSkills();
    }
  }, [activeLevel, selectedProvider]);

  // Load exams when skill is selected
  useEffect(() => {
    if (selectedProvider && selectedSkill) {
      loadExams();
    }
  }, [activeLevel, selectedProvider, selectedSkill]);

  const loadSkills = async () => {
    try {
      setLoadingSkills(true);
      setError("");
      const data = await getProviderSkills(selectedProvider, activeLevel);
      const allowedSkills = ["hoeren", "lesen", "schreiben", "sprechen", "sprachbausteine"];
      setSkills((data.skills || []).filter(s => allowedSkills.includes(s.skill)));
    } catch (err) {
      console.error("Error loading skills:", err);
      setError(t("pruefungen_errorSkills"));
    } finally {
      setLoadingSkills(false);
    }
  };

  const loadExams = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPublicExams({
        level: activeLevel,
        provider: selectedProvider,
        mainSkill: selectedSkill,
      });
      const rawExams = data.items || data || [];
      rawExams.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setExams(rawExams);
    } catch (err) {
      console.error("Error loading exams:", err);
      if (err.response?.status === 401) {
        navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      } else if (err.response?.status === 404) {
        setError(t("pruefungen_noExamsForSkill"));
      } else {
        setError(t("pruefungen_errorLoad"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderClick = (providerId) => {
    setSelectedProvider(providerId);
    setSelectedSkill(null);
    setSkills([]);
    setExams([]);
    // تحديث المستوى تلقائي لأول مستوى متاح للمزود
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (provider && !provider.allowedLevels.includes(activeLevel)) {
      setActiveLevel(provider.allowedLevels[0]);
    }
  };

  const handleSkillClick = (skillId) => {
    setSelectedSkill(skillId);
    setExams([]);
  };

  const handleExamClick = async (examId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    try {
      setStartingExamId(examId);
      setError("");
      const data = await createAttempt(examId, "exam");
      if (data?.attemptId) {
        navigate(`/student/exam/${data.attemptId}?examId=${examId}`);
      } else {
        setError(t("pruefungen_errorStart"));
      }
    } catch (err) {
      console.error("Error starting exam:", err);
      if (err.response?.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent("/pruefungen")}`);
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || t("pruefungen_errorStart"));
      }
    } finally {
      setStartingExamId(null);
    }
  };

  const handleBackToSkills = () => {
    setSelectedSkill(null);
    setExams([]);
  };

  const handleBackToProviders = () => {
    setSelectedProvider(null);
    setSelectedSkill(null);
    setSkills([]);
    setExams([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">
            <span style={{ color: BRAND.red }}>{t('pruefungen_title')}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('pruefungen_subtitle')}
          </p>
        </div>

        <p className="text-center text-slate-700 dark:text-slate-200 font-semibold mb-3">{t('pruefungen_chooseLevel')}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(selectedProvider
            ? PROVIDERS.find(p => p.id === selectedProvider)?.allowedLevels || levelNames
            : levelNames
          ).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => { setActiveLevel(level); setSelectedSkill(null); setExams([]); }}
              className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-base transition ${
                activeLevel === level
                  ? "text-white border-transparent shadow-md"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-[#DD0000] hover:text-[#DD0000]"
              }`}
              style={activeLevel === level ? { background: BRAND.red } : {}}
            >
              {level}
            </button>
          ))}
        </div>

        {/* إذا ما في جهة مختارة - عرض كروت الجهات */}
        {!selectedProvider && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t('pruefungen_chooseProvider')}
              </h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                {t('pruefungen_chooseProviderDesc')}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {PROVIDERS.filter(p => p.allowedLevels.includes(activeLevel)).map((provider) => {
                const IconComponent = PROVIDER_ICONS[provider.id] || FileText;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleProviderClick(provider.id)}
                    className="group text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${BRAND.red}18` }}>
                        <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: BRAND.red }} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {t('provider_' + provider.id)}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('pruefungen_levels')}: {provider.levels}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                      {t('provider_' + provider.id + '_desc')}
                    </p>
                    <span className="inline-flex items-center gap-1 text-base font-semibold group-hover:underline" style={{ color: BRAND.red }}>
                      {t('pruefungen_viewExams')}
                      <span>→</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* إذا في جهة مختارة بدون مهارة - عرض المهارات */}
        {selectedProvider && !selectedSkill && (
          <div className="mb-12">
            <button
              onClick={handleBackToProviders}
              className="mb-6 text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-2"
            >
              ← {t('pruefungen_backToProviders')}
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {t('provider_' + selectedProvider)} – {activeLevel}
              </h2>
              <p className="text-base text-slate-500 dark:text-slate-400">
                {t('pruefungen_choosePart')}
              </p>
            </div>

            {loadingSkills && (
              <div className="text-center text-slate-500 text-base mt-10">
                {t('pruefungen_loading')}
              </div>
            )}

            {error && !loadingSkills && (
              <div className="text-center rounded-xl py-4 px-4 border-2" style={{ color: BRAND.red, backgroundColor: `${BRAND.red}12`, borderColor: BRAND.red }}>
                <p className="font-medium">{error}</p>
              </div>
            )}

            {!loadingSkills && !error && skills.length === 0 && (
              <div className="text-center text-slate-500 dark:text-slate-400 text-base mt-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl py-8">
                {t('pruefungen_noSkills')}
              </div>
            )}

            {!loadingSkills && !error && skills.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {skills.map((skill) => {
                  const info = EXAM_SKILLS.find((s) => s.id === skill.skill);
                  const SkillIcon = SKILL_ICONS[skill.skill] || FileCheck;
                  return (
                    <button
                      key={skill.skill}
                      type="button"
                      onClick={() => handleSkillClick(skill.skill)}
                      className="group text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                      <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${BRAND.red}18` }}>
                        <SkillIcon className="w-7 h-7" style={{ color: BRAND.red }} strokeWidth={1.8} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {skill.label || t('skill_' + skill.skill) || skill.skill}
                      </h3>
                      <p className="text-base text-slate-500 dark:text-slate-400 mb-3">
                        {skill.count} {skill.count === 1 ? t('pruefungen_oneExam') : t('pruefungen_exams')}
                      </p>
                      <span className="text-lg font-semibold group-hover:underline" style={{ color: BRAND.red }}>
                        {t('pruefungen_viewExamsArrow')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* إذا في جهة ومهارة مختارة - عرض الامتحانات */}
        {selectedProvider && selectedSkill && (
          <div className="mb-12">
            <button
              onClick={handleBackToSkills}
              className="mb-6 text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-2"
            >
              ← {t('pruefungen_backToParts')}
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {t('skill_' + selectedSkill) || selectedSkill}
              </h2>
              <p className="text-base text-slate-500 dark:text-slate-400">
                {t('provider_' + selectedProvider)} — {activeLevel}
              </p>
            </div>

            {loading && (
              <div className="text-center text-slate-500 text-base mt-10">
                {t('pruefungen_examsLoading')}
              </div>
            )}

            {error && !loading && (
              <div className="text-center rounded-xl py-4 px-4 border-2 mt-10" style={{ color: BRAND.red, backgroundColor: `${BRAND.red}12`, borderColor: BRAND.red }}>
                <p className="font-medium">{error}</p>
              </div>
            )}

            {!loading && !error && exams.length === 0 && (
              <div className="text-center text-slate-500 dark:text-slate-400 text-base mt-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl py-8">
                {t('pruefungen_noExamsForSkill')}
              </div>
            )}

            {!loading && !error && exams.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" dir="ltr">
                {exams.map((exam) => {
                  const examId = exam.id || exam._id;
                  const isStarting = startingExamId === examId;
                  return (
                  <button
                    key={examId}
                    type="button"
                    onClick={() => handleExamClick(examId)}
                    disabled={isStarting}
                    className="group text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait disabled:hover:translate-y-0"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${BRAND.red}18` }}>
                        <FileCheck className="w-6 h-6" style={{ color: BRAND.red }} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                          {exam.title}
                        </h3>
                        <p className="text-base text-slate-500 dark:text-slate-400 mt-0.5">
                          {exam.level} • {exam.provider}
                        </p>
                      </div>
                    </div>
                    <p className="text-base text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                      {exam.description || t('pruefungen_modellpruefung')}
                    </p>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-slate-500 dark:text-slate-400">
                        {exam.timeLimitMin ? `${exam.timeLimitMin} ${t('pruefungen_min')}` : t('pruefungen_noTimeLimit')}
                      </span>
                      <span className="font-semibold group-hover:underline text-lg" style={{ color: BRAND.red }}>
                        {isStarting ? t('pruefungen_wirdGestartet') : t('pruefungen_jetztStarten')}
                      </span>
                    </div>
                  </button>
                );
                })}
              </div>
            )}
          </div>
        )}

      </div>
      <AppFooter />
    </div>
  );
}
