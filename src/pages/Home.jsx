import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  FileText,
  BookOpen,
  Pencil,
  MessageCircle,
  Type,
  BookMarked,
  MessageSquare,
} from "lucide-react";
import logoImage from "../images/logo.png";
import heroImage from "../images/hf_20260309_152140_e4bd6756-6707-4ae0-a722-6f3cdd32e424.png";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import { BRAND } from "../constants/brand";
import { useTranslation } from "../contexts/LanguageContext";

// صوت تقليب كتاب حقيقي — ملف محلي أو رابط (Big Sound Bank CC0)
function playPageTurnSound() {
  try {
    const audio = new Audio("/sounds/page-turn.mp3");
    audio.volume = 0.7;
    audio.play().catch(() => {
      const fallback = new Audio("https://bigsoundbank.com/UPLOAD/mp3/0164.mp3");
      fallback.volume = 0.7;
      fallback.play().catch(() => {});
    });
  } catch (_) {}
}

const CARD_ICONS = [HomeIcon, FileText, BookOpen, Pencil, MessageCircle, Type, BookMarked, MessageSquare];
// Card config: to, titleKey, descKey, buttonKey (common_jetztUeben or common_jetztLernen)
const ROTATING_CARDS_CONFIG = [
  { to: '/student/liden', titleKey: 'home_card_liden_title', descKey: 'home_card_liden_desc', buttonKey: 'common_jetztUeben' },
  { to: '/pruefungen', titleKey: 'home_card_pruefungen_title', descKey: 'home_card_pruefungen_desc', buttonKey: 'common_jetztUeben' },
  { to: '/grammatik', titleKey: 'home_card_grammatik_title', descKey: 'home_card_grammatik_desc', buttonKey: 'common_jetztLernen' },
  { to: '/grammatik-training', titleKey: 'home_card_grammatikTraining_title', descKey: 'home_card_grammatikTraining_desc', buttonKey: 'common_jetztUeben' },
  { to: '/wortschatz', titleKey: 'home_card_wortschatz_title', descKey: 'home_card_wortschatz_desc', buttonKey: 'common_jetztLernen' },
  { to: '/derdiedas', titleKey: 'home_card_derdiedas_title', descKey: 'home_card_derdiedas_desc', buttonKey: 'common_jetztUeben' },
  { to: '/lesen-hoeren', titleKey: 'home_card_lesenHoeren_title', descKey: 'home_card_lesenHoeren_desc', buttonKey: 'common_jetztUeben' },
  { to: '/dialoge', titleKey: 'home_card_dialoge_title', descKey: 'home_card_dialoge_desc', buttonKey: 'common_jetztUeben' },
];

export default function Home() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [cardIndex, setCardIndex] = useState(0);
  const autoFlipTimerRef = useRef(null);

  const ROTATING_CARDS = useMemo(
    () => ROTATING_CARDS_CONFIG.map((c) => ({
      to: c.to,
      title: t(c.titleKey),
      desc: t(c.descKey),
      buttonText: t(c.buttonKey),
    })),
    [t]
  );

  const goToPrevCard = () => {
    setCardIndex((i) => (i - 1 + ROTATING_CARDS.length) % ROTATING_CARDS.length);
    playPageTurnSound();
  };
  const goToNextCard = () => {
    setCardIndex((i) => (i + 1) % ROTATING_CARDS.length);
    playPageTurnSound();
  };

  useEffect(() => {
    if (autoFlipTimerRef.current) clearInterval(autoFlipTimerRef.current);
    autoFlipTimerRef.current = setInterval(() => {
      setTimeout(() => {
        setCardIndex((i) => (i + 1) % ROTATING_CARDS.length);
      }, 350);
    }, 5000);
    return () => {
      if (autoFlipTimerRef.current) clearInterval(autoFlipTimerRef.current);
    };
  }, [ROTATING_CARDS.length]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />

      {/* صورة (نفس المقاس) + منطقة البطاقة بالمسافة الباقية — بطاقة واحدة دوارة كل 5 ثوانٍ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 bg-white dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-center lg:items-stretch">
          {/* الصورة — نفس الحجم، ما بتصغر */}
          <div className="w-full lg:w-[55%] xl:w-[58%] flex-shrink-0">
            <div className="sticky top-6 overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-3 sm:p-4 flex justify-center items-center">
              <img
                src={heroImage}
                alt={t('home_heroAlt')}
                className="w-full h-auto max-h-[420px] sm:max-h-[480px] lg:max-h-[520px] object-contain object-center bg-white"
              />
            </div>
          </div>

          {/* منطقة البطاقة — تاخد المسافة الباقية، بطاقة واحدة مع انيميشن قلبت صفحة + سهمين */}
          <div className="flex-1 min-w-0 flex items-center justify-center gap-2 lg:gap-3">
            <button
              type="button"
              onClick={goToPrevCard}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFCE00]"
              style={{ background: 'linear-gradient(135deg, #000000, #DD0000)', color: '#FFCE00' }}
              aria-label={t('home_prevCard')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="flex-1 min-w-0 flex justify-center" style={{ perspective: '1000px' }}>
              {/* شكل كتاب — عمود فقري + صفحة مفتوحة */}
              <div
                key={cardIndex}
                onClick={() => navigate(ROTATING_CARDS[cardIndex].to)}
                className="animate-flip-page group cursor-pointer w-full max-w-md flex rounded-2xl overflow-hidden shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-shadow"
                style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
              >
                {/* سلك الكتاب — لون اللوجو: أسود + سلك ذهبي */}
                <div
                  className="w-6 sm:w-7 flex-shrink-0 rounded-l-md rounded-r-sm relative overflow-hidden"
                  style={{
                    background: BRAND.black,
                    boxShadow: 'inset 2px 0 6px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.08)',
                  }}
                >
                  {/* السلك الذهبي في الوسط */}
                  <div
                    className="absolute top-0 bottom-0 w-1 left-1/2 -translate-x-1/2 z-10"
                    style={{
                      background: `linear-gradient(180deg, #b38600 0%, ${BRAND.gold} 30%, #ffe44d 50%, ${BRAND.gold} 70%, #b38600 100%)`,
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.3), inset 0 0 6px rgba(255,255,255,0.4)',
                    }}
                  />
                  {/* الثقوب — لون الصفحة يظهر من خلالها */}
                  <div
                    className="absolute inset-0 dark:opacity-0"
                    style={{
                      backgroundImage: 'radial-gradient(circle at center, #faf9f7 2px, transparent 2.5px)',
                      backgroundSize: '100% 14px',
                      backgroundPosition: '0 6px',
                    }}
                    aria-hidden
                  />
                  <div
                    className="absolute inset-0 opacity-0 dark:opacity-100"
                    style={{
                      backgroundImage: 'radial-gradient(circle at center, rgb(71 85 105) 2px, transparent 2.5px)',
                      backgroundSize: '100% 14px',
                      backgroundPosition: '0 6px',
                    }}
                    aria-hidden
                  />
                </div>
                {/* صفحة الكتاب */}
                <div className="flex-1 min-w-0 bg-[#faf9f7] dark:bg-slate-700 border border-slate-200 dark:border-slate-600 border-l-0 border-r-0 rounded-none rounded-tl-sm rounded-bl-sm p-6 sm:p-8 lg:p-10 flex flex-col items-center text-center shadow-inner min-h-[280px]">
                  {(() => {
                    const IconComponent = CARD_ICONS[cardIndex];
                    return (
                      <div className="mb-5 flex items-center justify-center text-[#DD0000] dark:text-[#FFCE00]">
                        <IconComponent className="w-14 h-14 sm:w-16 sm:h-16" strokeWidth={1.5} />
                      </div>
                    );
                  })()}
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">{ROTATING_CARDS[cardIndex].title}</h3>
                  <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-6 italic font-medium">{ROTATING_CARDS[cardIndex].desc}</p>
                  <span className="text-[#DD0000] dark:text-[#FFCE00] font-semibold text-lg group-hover:underline">{ROTATING_CARDS[cardIndex].buttonText}</span>
                </div>
                {/* حافة الصفحات من الجهة الثانية — يمين البطاقة ككتاب مفتوح */}
                <div className="w-3 sm:w-4 flex-shrink-0 rounded-r-2xl relative overflow-hidden" aria-hidden>
                  <div
                    className="absolute inset-0 dark:opacity-0"
                    style={{
                      background: `repeating-linear-gradient(90deg, #f5f4f2 0px, #f5f4f2 1px, #e8e6e3 1px, #e8e6e3 2px)`,
                      boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.06)',
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 dark:opacity-100"
                    style={{
                      background: 'repeating-linear-gradient(90deg, #475569 0px, #475569 1px, #334155 1px, #334155 2px)',
                      boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={goToNextCard}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFCE00]"
              style={{ background: 'linear-gradient(135deg, #DD0000, #FFCE00)', color: '#fff' }}
              aria-label={t('home_nextCard')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
