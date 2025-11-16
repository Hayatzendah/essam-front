import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsAPI } from '../../services/questionsAPI';
import './QuestionsList.css';

function QuestionsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    provider: '',
    level: '',
    status: '',
    qType: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    loadQuestions();
  }, [filters.page, filters.provider, filters.level, filters.status, filters.qType]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: filters.page,
        limit: filters.limit,
      };
      
      if (filters.provider) params.provider = filters.provider;
      if (filters.level) params.level = filters.level;
      if (filters.status) params.status = filters.status;
      if (filters.qType) params.qType = filters.qType;
      
      const response = await questionsAPI.getAll(params);
      
      // Response format: { page, limit, total, items: [...] }
      const questionsData = response.items || response || [];
      setQuestions(questionsData);
      
      if (response.page && response.total) {
        setPagination({
          page: response.page,
          limit: response.limit || filters.limit,
          total: response.total,
        });
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء تحميل الأسئلة'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId, hard = false) => {
    if (!window.confirm(`هل أنت متأكد من حذف هذا السؤال؟ ${hard ? '(حذف نهائي)' : '(حذف مؤقت)'}`)) {
      return;
    }

    try {
      setDeletingId(questionId);
      setError('');
      setSuccess('');
      
      await questionsAPI.delete(questionId, hard);
      setSuccess('تم حذف السؤال بنجاح');
      
      // إعادة تحميل الأسئلة
      await loadQuestions();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء حذف السؤال'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1, // إعادة تعيين الصفحة عند تغيير الفلتر
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const getQuestionTypeLabel = (qType) => {
    const types = {
      mcq: 'اختيار متعدد',
      true_false: 'صحيح/خطأ',
      fill: 'ملء الفراغ',
      match: 'مطابقة',
      reorder: 'إعادة ترتيب',
    };
    return types[qType] || qType;
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
    <div className="questions-list-page">
      <div className="page-header">
        <button onClick={() => navigate('/admin')} className="back-btn">
          ← العودة للوحة التحكم
        </button>
        <h1>جميع الأسئلة</h1>
      </div>

      <div className="questions-list-container">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>المزود</label>
            <select
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
            >
              <option value="">الكل</option>
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

          <div className="filter-group">
            <label>نوع السؤال</label>
            <select
              value={filters.qType}
              onChange={(e) => handleFilterChange('qType', e.target.value)}
            >
              <option value="">الكل</option>
              <option value="mcq">اختيار متعدد</option>
              <option value="true_false">صحيح/خطأ</option>
              <option value="fill">ملء الفراغ</option>
              <option value="match">مطابقة</option>
              <option value="reorder">إعادة ترتيب</option>
            </select>
          </div>

          <button onClick={loadQuestions} className="refresh-btn">
            🔄 تحديث
          </button>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>جاري تحميل الأسئلة...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <p>لا توجد أسئلة</p>
          </div>
        ) : (
          <>
            <div className="questions-count">
              <p>
                إجمالي الأسئلة: <strong>{pagination.total || questions.length}</strong>
              </p>
            </div>

            <div className="questions-grid">
              {questions.map((question) => (
                <div key={question.id || question._id} className="question-card">
                  <div className="question-header">
                    <div className="question-meta">
                      <span className="question-type">{getQuestionTypeLabel(question.qType)}</span>
                      <span className={`question-status status-${question.status}`}>
                        {getStatusLabel(question.status)}
                      </span>
                    </div>
                    <div className="question-actions">
                      <button
                        onClick={() => navigate(`/admin/questions/${question.id || question._id}/edit`)}
                        className="edit-btn"
                        title="تعديل"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(question.id || question._id, false)}
                        className="delete-btn"
                        disabled={deletingId === (question.id || question._id)}
                        title="حذف مؤقت"
                      >
                        {deletingId === (question.id || question._id) ? '⏳' : '🗑️'}
                      </button>
                      <button
                        onClick={() => handleDelete(question.id || question._id, true)}
                        className="delete-btn hard-delete"
                        disabled={deletingId === (question.id || question._id)}
                        title="حذف نهائي"
                      >
                        {deletingId === (question.id || question._id) ? '⏳' : '❌'}
                      </button>
                    </div>
                  </div>

                  <div className="question-body">
                    <p className="question-prompt">
                      {question.prompt?.substring(0, 150)}
                      {question.prompt?.length > 150 ? '...' : ''}
                    </p>
                    
                    <div className="question-details">
                      {question.provider && (
                        <span className="detail-badge">📦 {question.provider}</span>
                      )}
                      {question.level && (
                        <span className="detail-badge">📊 {question.level}</span>
                      )}
                      {question.section && (
                        <span className="detail-badge">📁 {question.section}</span>
                      )}
                      {question.tags && question.tags.length > 0 && (
                        <span className="detail-badge">
                          🏷️ {question.tags.slice(0, 3).join(', ')}
                          {question.tags.length > 3 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="page-btn"
                >
                  ← السابق
                </button>
                <span className="page-info">
                  الصفحة {pagination.page} من {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  className="page-btn"
                >
                  التالي →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default QuestionsList;

