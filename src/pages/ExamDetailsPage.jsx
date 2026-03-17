import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createAttempt } from "../services/api";
import { useTranslation } from "../contexts/LanguageContext";

/**
 * Exam details page: redirects to start the exam (no details UI).
 * On /pruefungen/exam/:examId a new attempt is created and user is sent to the exam page.
 */
export default function ExamDetailsPage() {
  const { examId } = useParams();
  const t = useTranslation();
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(true);
  const navigate = useNavigate();
  const didStart = useRef(false);

  useEffect(() => {
    if (!examId || didStart.current) return;
    didStart.current = true;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(`/pruefungen/exam/${examId}`)}`);
      return;
    }

    (async () => {
      try {
        setRedirecting(true);
        setError("");
        const data = await createAttempt(examId, "exam");
        if (data?.attemptId) {
          navigate(`/student/exam/${data.attemptId}?examId=${examId}`, { replace: true });
          return;
        }
        setError("حدث خطأ أثناء بدء الامتحان.");
      } catch (err) {
        console.error("Error starting exam:", err);
        if (err.response?.status === 401) {
          navigate(`/login?redirect=${encodeURIComponent(`/pruefungen/exam/${examId}`)}`);
          return;
        }
        const msg = err.response?.data?.message || err.response?.data?.error || "Fehler beim Starten der Prüfung. Bitte versuche es erneut.";
        setError(msg);
      } finally {
        setRedirecting(false);
      }
    })();
  }, [examId, navigate]);

  if (redirecting && !error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-red-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Prüfung wird gestartet…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/pruefungen")}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            {t('examDetails_backToExams')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
