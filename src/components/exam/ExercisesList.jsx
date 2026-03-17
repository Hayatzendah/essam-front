import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';

/**
 * ExercisesList - قائمة التمارين لقسم معين
 * يعرض بطاقات التمارين مع التقدم ومعلومات الصوت
 */
function ExercisesList({ exercises, onSelectExercise, answers, questionIdToItemIndex }) {
  const t = useTranslation();
  if (!exercises || exercises.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm bg-slate-50 border border-slate-200 rounded-xl py-8 mb-6">
        {t('exam_noExercisesInSection')}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
      {exercises.map((exercise) => {
        // كل تمرين = وحدة واحدة — مكتمل لما تُجاب كل أسئلته الحقيقية
        const realQs = (exercise.questions || []).filter((q) => !q.contentOnly);
        const total = 1;
        const allDone = realQs.length > 0 && questionIdToItemIndex && realQs.every((q) => {
          const idx = questionIdToItemIndex.get(q.questionId);
          return idx !== undefined && answers[idx] !== undefined;
        });
        const answeredCount = allDone ? 1 : 0;
        const percent = allDone ? 100 : 0;
        const isComplete = allDone;

        return (
          <button
            key={exercise.exerciseIndex ?? exercise.exerciseNumber ?? exercise.listeningClipId}
            onClick={() => onSelectExercise(exercise)}
            className="w-full text-left bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-5 hover:border-red-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {/* دائرة التقدم */}
              <div className="relative flex-shrink-0 w-11 h-11 sm:w-14 sm:h-14">
                <svg className="w-11 h-11 sm:w-14 sm:h-14 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none" stroke="#e2e8f0" strokeWidth="2.5"
                  />
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    stroke={isComplete ? '#22c55e' : '#ef4444'}
                    strokeWidth="2.5"
                    strokeDasharray={`${percent} ${100 - percent}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold text-slate-700">
                  {exercise.exerciseIndex ?? exercise.exerciseNumber ?? '?'}
                </span>
              </div>

              {/* معلومات التمرين */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {t('exam_exercise')} {exercise.exerciseIndex ?? exercise.exerciseNumber}
                </h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-slate-500">
                    {answeredCount} {t('exam_of')} {total} {total === 1 ? t('exam_question') : t('exam_questions')}
                  </span>
                  {exercise.audioUrl && (
                    <span className="text-xs text-blue-500 flex items-center gap-1">
                      🎧 {t('exam_audio')}
                    </span>
                  )}
                  {(exercise.readingPassage || (exercise.readingCards && exercise.readingCards.length > 0)) && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      📖 Text
                    </span>
                  )}
                  {exercise.contentBlocks && exercise.contentBlocks.length > 0 && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      🗣 {t('exam_content')}
                    </span>
                  )}
                </div>
              </div>

              {/* علامة الاكتمال */}
              {isComplete ? (
                <span className="text-green-500 text-xl flex-shrink-0">✓</span>
              ) : (
                <span className="text-slate-300 text-lg flex-shrink-0">›</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ExercisesList;
