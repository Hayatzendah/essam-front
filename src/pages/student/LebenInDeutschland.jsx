import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/usersAPI';
import { examsAPI } from '../../services/examsAPI';
import { authAPI } from '../../services/api';
import StateSelectionModal from './StateSelectionModal';
import './LebenInDeutschland.css';

function LebenInDeutschland() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [availableExams, setAvailableExams] = useState([]);
  const [error, setError] = useState('');
  const [showStateModal, setShowStateModal] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await usersAPI.getMe();
      setUser(userData);

      // إذا لم يكن لدى المستخدم ولاية محددة، نعرض Modal
      if (!userData.state) {
        setShowStateModal(true);
      } else {
        // جلب الامتحانات المتاحة فقط (بدون جلب الأسئلة مباشرة)
        await loadAvailableExams(userData.state);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      
      // معالجة خاصة لخطأ 502
      if (err.response?.status === 502) {
        setError(
          '❌ لا يمكن الوصول إلى الـ Backend. تأكد من أن السيرفر يعمل على http://localhost:4000'
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          'حدث خطأ أثناء تحميل البيانات'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = async (state) => {
    try {
      // تحديث ولاية المستخدم في قاعدة البيانات
      const updatedUser = await usersAPI.updateState(state);
      setUser(updatedUser);
      
      // تحديث localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, state }));
      
      // جلب الامتحانات المتاحة فقط
      await loadAvailableExams(state);
    } catch (err) {
      console.error('Error updating state:', err);
      
      // معالجة خاصة لخطأ 502
      if (err.response?.status === 502) {
        throw new Error('❌ لا يمكن الوصول إلى الـ Backend. تأكد من أن السيرفر يعمل.');
      }
      
      throw err;
    }
  };

  const loadAvailableExams = async (state) => {
    try {
      setLoadingExams(true);
      setError('');
      
      // جلب الامتحانات المتاحة لـ Leben in Deutschland
      // استخدام /exams?status=published&state=Bayern&provider=LiD
      // محاولة البحث بـ 'LiD' أولاً (كما في CreateExam.jsx)، ثم 'Deutschland-in-Leben' كبديل
      let response;
      try {
        // محاولة استخدام /exams/available أولاً
        response = await examsAPI.getAvailable({
          provider: 'LiD',
          state: state,
        });
      } catch (err) {
        // إذا فشل، جرب /exams?status=published&state=...&provider=...
        try {
          response = await examsAPI.getAvailableExams({
            provider: 'LiD',
            state: state,
          });
        } catch (err2) {
          // إذا فشل أيضاً، جرب 'Deutschland-in-Leben'
          try {
            response = await examsAPI.getAvailable({
              provider: 'Deutschland-in-Leben',
              state: state,
            });
          } catch (err3) {
            response = await examsAPI.getAvailableExams({
              provider: 'Deutschland-in-Leben',
              state: state,
            });
          }
        }
      }
      
      // Response format: { items: [...], count: ... } أو { page, limit, total, items: [...] }
      const exams = response.items || response || [];
      
      // التحقق من أن كل exam له id (قد يكون _id في MongoDB)
      const examsWithId = exams.map(exam => ({
        ...exam,
        id: exam.id || exam._id, // دعم كل من id و _id
      }));
      
      console.log('Available exams loaded:', examsWithId);
      setAvailableExams(examsWithId);
      
      // إذا لم توجد امتحانات، نعرض رسالة واضحة
      if (exams.length === 0) {
        setError('لا توجد امتحانات متاحة حالياً. تأكد من أن المعلم أنشأ امتحان بحالة "منشور (Published)" للولاية المحددة.');
      }
    } catch (err) {
      console.error('Error loading available exams:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء تحميل الامتحانات المتاحة'
      );
    } finally {
      setLoadingExams(false);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      setError('');
      
      // التحقق من أن examId موجود وصحيح
      if (!examId) {
        throw new Error('معرف الامتحان غير موجود');
      }
      
      console.log('🚀 Starting attempt for examId:', examId);
      
      // بدء محاولة جديدة - POST /attempts مع { examId }
      // الـ Backend يختار الأسئلة ويرجع snapshot جاهزة في response.items
      const attempt = await examsAPI.startAttempt(examId);
      
      console.log('✅ Attempt created:', attempt);
      console.log('📋 Attempt items:', attempt.items);
      console.log('📊 Items count:', attempt.items?.length || 0);
      console.log('📦 Full response structure:', JSON.stringify(attempt, null, 2));
      
      // Response format حسب Api.md: { attemptId, examId, status, attemptCount, expiresAt, items: [...] }
      // معالجة محسّنة للـ response structure
      const attemptId = attempt.attemptId || attempt.id || attempt._id;
      
      if (!attemptId) {
        console.error('❌ No attemptId in response:', attempt);
        throw new Error('لم يتم إرجاع attemptId من السيرفر');
      }
      
      // التحقق من وجود items
      const items = attempt.items || attempt.data?.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        console.warn('⚠️ لا توجد items في الـ response');
        console.warn('   Response structure:', JSON.stringify(attempt, null, 2));
        setError('لا توجد أسئلة في هذا الامتحان. تأكد من أن الامتحان يحتوي على أسئلة.');
        return;
      }
      
      console.log('✅ Attempt has', items.length, 'items. Navigating to exam page...');
      
      // الانتقال إلى صفحة الامتحان التي تعرض الأسئلة من attempt.items
      navigate(`/student/exam/${attemptId}`);
    } catch (err) {
      console.error('Error starting exam:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        examId: examId,
      });
      
      // معالجة أفضل للأخطاء
      let errorMessage = 'حدث خطأ أثناء بدء الامتحان';
      
      if (err.response?.status === 400) {
        // Bad Request - قد يكون examId غير صحيح
        const errorData = err.response?.data;
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        } else if (errorData?.errors) {
          // إذا كان errors مصفوفة
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map(e => 
              typeof e === 'string' ? e : JSON.stringify(e)
            ).join(', ');
          } else {
            // إذا كان errors object
            errorMessage = Object.entries(errorData.errors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ');
          }
        } else {
          errorMessage = 'خطأ في البيانات المرسلة. تأكد من أن الامتحان موجود وصحيح.';
        }
      } else if (err.response?.status === 404) {
        errorMessage = 'الامتحان غير موجود';
      } else if (err.response?.status === 403) {
        errorMessage = 'ليس لديك صلاحية لبدء هذا الامتحان';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleChangeState = () => {
    setShowStateModal(true);
  };

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="liden-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="liden-page">
      <div className="page-header">
        <div className="header-content">
          <h1>🇩🇪 Leben in Deutschland</h1>
          <p className="page-subtitle">اختبار الحياة في ألمانيا</p>
        </div>
        <div className="header-actions">
          {user?.state && (
            <div className="state-badge">
              <span className="state-label">الولاية:</span>
              <span className="state-name">{user.state}</span>
              <button
                onClick={handleChangeState}
                className="change-state-btn"
                title="تغيير الولاية"
              >
                ✏️
              </button>
            </div>
          )}
          <button onClick={() => navigate('/welcome')} className="back-btn">
            ← العودة
          </button>
          <button onClick={handleLogout} className="logout-btn">
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="page-content">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => loadUserData()} className="retry-btn">
              إعادة المحاولة
            </button>
          </div>
        )}

        {user?.state ? (
          <div className="questions-section">
            <div className="section-header">
              <h2>الامتحانات المتاحة</h2>
              <button
                onClick={() => loadAvailableExams(user.state)}
                className="refresh-btn"
                disabled={loadingExams}
              >
                {loadingExams ? '🔄 جاري التحديث...' : '🔄 تحديث'}
              </button>
            </div>

            {loadingExams ? (
              <div className="loading-exams">
                <p>جاري تحميل الامتحانات...</p>
              </div>
            ) : availableExams.length > 0 ? (
              <div className="exams-list">
                <div className="exams-info">
                  <p className="exams-count">
                    تم العثور على <strong>{availableExams.length}</strong> امتحان متاح
                    {user.state && (
                      <span>
                        {' '}
                        لولاية {user.state}
                      </span>
                    )}
                  </p>
                </div>
                {availableExams.map((exam) => {
                  // التحقق من أن exam.id موجود
                  if (!exam.id) {
                    console.warn('Exam without id:', exam);
                    return null;
                  }
                  
                  return (
                    <div key={exam.id} className="exam-card">
                      <div className="exam-info">
                        <h4>{exam.title}</h4>
                        {exam.description && (
                          <p className="exam-description">{exam.description}</p>
                        )}
                        <div className="exam-details">
                          {exam.timeLimitMin > 0 && (
                            <span className="exam-detail">
                              ⏱️ {exam.timeLimitMin} دقيقة
                            </span>
                          )}
                          {exam.attemptLimit > 0 && (
                            <span className="exam-detail">
                              🔄 {exam.attemptLimit} محاولة
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartExam(exam.id)}
                        className="start-exam-btn"
                      >
                        ابدأ المحاولة
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-exams-message">
                <p>⚠️ لا توجد امتحانات متاحة حالياً</p>
                <p className="hint">
                  يجب على المعلم إنشاء امتحان بحالة "منشور (Published)" أولاً
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="no-state-message">
            <p>⚠️ يجب اختيار ولاية لعرض الامتحانات المتاحة</p>
            <button onClick={handleChangeState} className="select-state-btn">
              اختر ولايتك الآن
            </button>
          </div>
        )}
      </div>

      {showStateModal && (
        <StateSelectionModal
          onSelect={handleStateSelect}
          onClose={() => setShowStateModal(false)}
        />
      )}
    </div>
  );
}

export default LebenInDeutschland;

