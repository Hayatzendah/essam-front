import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsAPI } from '../../services/examsAPI';
import './ExamsList.css';

function ExamsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    provider: '',
    level: '',
    status: '',
  });

  useEffect(() => {
    loadExams();
  }, [filters.provider, filters.level, filters.status]);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      
      if (filters.provider) params.provider = filters.provider;
      if (filters.level) params.level = filters.level;
      if (filters.status) params.status = filters.status;
      
      const response = await examsAPI.getAll(params);
      
      // Response format: { items: [...], count: ... }
      const examsData = response.items || response || [];
      setExams(examsData);
    } catch (err) {
      console.error('Error loading exams:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء تحميل الامتحانات'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (examId) => {
    if (!window.confirm('هل أنت متأكد من أرشفة هذا الامتحان؟ سيتم إخفاؤه من قائمة الامتحانات المتاحة للطلاب.')) {
      return;
    }

    try {
      setDeletingId(examId);
      setError('');
      setSuccess('');
      
      // تغيير حالة الامتحان إلى archived
      await examsAPI.update(examId, { status: 'archived' });
      setSuccess('تم أرشفة الامتحان بنجاح');
      setError(''); // إزالة أي أخطاء سابقة
      
      // إعادة تحميل الامتحانات بعد تأخير قصير
      setTimeout(async () => {
        await loadExams();
      }, 500);
      
      // إزالة رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error archiving exam:', err);
      const errorMessage = 
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء أرشفة الامتحان';
      
      setError(errorMessage);
      
      // إزالة رسالة الخطأ بعد 5 ثوان
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('⚠️ هل أنت متأكد من حذف هذا الامتحان نهائياً؟\n\nسيتم حذف الامتحان وجميع المحاولات المرتبطة به.\nهذا الإجراء لا يمكن التراجع عنه!')) {
      return;
    }

    // تأكيد إضافي
    if (!window.confirm('⚠️ تأكيد نهائي: هل أنت متأكد 100% من الحذف النهائي؟')) {
      return;
    }

    try {
      setDeletingId(examId);
      setError('');
      setSuccess('');
      
      // حذف الامتحان نهائياً
      await examsAPI.delete(examId);
      setSuccess('تم حذف الامتحان بنجاح');
      setError(''); // إزالة أي أخطاء سابقة
      
      // إعادة تحميل الامتحانات بعد تأخير قصير
      setTimeout(async () => {
        await loadExams();
      }, 500);
      
      // إزالة رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting exam:', err);
      
      // معالجة الأخطاء
      let errorMessage = 'حدث خطأ أثناء حذف الامتحان';
      
      if (err.response?.status === 404) {
        errorMessage = 'الامتحان غير موجود أو تم حذفه مسبقاً';
        // إذا كان الامتحان غير موجود، نعيد تحميل القائمة لإزالة العنصر المحذوف
        setTimeout(async () => {
          await loadExams();
        }, 500);
      } else if (err.response?.status === 403) {
        errorMessage = 'ليس لديك صلاحية لحذف هذا الامتحان';
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        } else {
          errorMessage = 'لا يمكن حذف الامتحان. قد يكون هناك محاولات مرتبطة به.';
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
      
      // إزالة رسالة الخطأ بعد 5 ثوان
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusLabel = (status) => {
    const statuses = {
      draft: 'مسودة',
      published: 'منشور',
      archived: 'مؤرشف',
    };
    return statuses[status] || status;
  };

  return (
    <div className="exams-list-page">
      <div className="page-header">
        <button onClick={() => navigate('/admin')} className="back-btn">
          ← العودة للوحة التحكم
        </button>
        <h1>جميع الامتحانات</h1>
      </div>

      <div className="exams-list-container">
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button 
              onClick={() => setError('')} 
              className="close-error-btn"
              title="إغلاق"
            >
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="success-message">
            <span>{success}</span>
            <button 
              onClick={() => setSuccess('')} 
              className="close-success-btn"
              title="إغلاق"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>المزود</label>
            <select
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
            >
              <option value="">الكل</option>
              <option value="LiD">LiD</option>
              <option value="Deutschland-in-Leben">Deutschland-in-Leben</option>
              <option value="telc">telc</option>
              <option value="Goethe">Goethe</option>
              <option value="ÖSD">ÖSD</option>
              <option value="ECL">ECL</option>
              <option value="DTB">DTB</option>
              <option value="DTZ">DTZ</option>
              <option value="Grammatik">Grammatik</option>
              <option value="Wortschatz">Wortschatz</option>
            </select>
          </div>

          <div className="filter-group">
            <label>المستوى</label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="">الكل</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </div>

          <div className="filter-group">
            <label>الحالة</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">الكل</option>
              <option value="draft">مسودة</option>
              <option value="published">منشور</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>

          <button onClick={loadExams} className="refresh-btn">
            🔄 تحديث
          </button>
        </div>

        {/* Exams List */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>جاري تحميل الامتحانات...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="empty-state">
            <p>لا توجد امتحانات</p>
          </div>
        ) : (
          <>
            <div className="exams-count">
              <p>
                إجمالي الامتحانات: <strong>{exams.length}</strong>
              </p>
            </div>

            <div className="exams-grid">
              {exams.map((exam) => (
                <div key={exam.id || exam._id} className="exam-card">
                  <div className="exam-header">
                    <div className="exam-title-section">
                      <h3>{exam.title}</h3>
                      <span className={`exam-status status-${exam.status}`}>
                        {getStatusLabel(exam.status)}
                      </span>
                    </div>
                    <div className="exam-actions">
                      <button
                        onClick={() => navigate(`/admin/exams/${exam.id || exam._id}/edit`)}
                        className="edit-btn"
                        title="تعديل"
                      >
                        ✏️
                      </button>
                      {exam.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(exam.id || exam._id)}
                          className="archive-btn"
                          disabled={deletingId === (exam.id || exam._id)}
                          title="أرشفة (إخفاء من قائمة الطلاب)"
                        >
                          {deletingId === (exam.id || exam._id) ? '⏳' : '📦'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(exam.id || exam._id)}
                        className="delete-btn"
                        disabled={deletingId === (exam.id || exam._id)}
                        title="حذف نهائي"
                      >
                        {deletingId === (exam.id || exam._id) ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>

                  <div className="exam-body">
                    <div className="exam-details">
                      {exam.provider && (
                        <span className="detail-badge">📦 {exam.provider}</span>
                      )}
                      {exam.level && (
                        <span className="detail-badge">📊 {exam.level}</span>
                      )}
                      {exam.timeLimitMin > 0 && (
                        <span className="detail-badge">⏱️ {exam.timeLimitMin} دقيقة</span>
                      )}
                      {exam.attemptLimit > 0 && (
                        <span className="detail-badge">🔄 {exam.attemptLimit} محاولة</span>
                      )}
                      {exam.attemptLimit === 0 && (
                        <span className="detail-badge">🔄 محاولات غير محدودة</span>
                      )}
                    </div>

                    {exam.sections && exam.sections.length > 0 && (
                      <div className="exam-sections">
                        <p className="sections-title">الأقسام:</p>
                        <div className="sections-list">
                          {exam.sections.map((section, index) => (
                            <div key={index} className="section-item">
                              <span className="section-name">{section.name || section.section}</span>
                              <span className="section-quota">{section.quota} سؤال</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {exam.randomizeQuestions && (
                      <div className="exam-feature">
                        <span>🔀 ترتيب عشوائي للأسئلة</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ExamsList;

