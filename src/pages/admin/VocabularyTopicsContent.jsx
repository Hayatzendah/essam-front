import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getVocabularyTopics,
  createVocabularyTopic,
  updateVocabularyTopic,
  deleteVocabularyTopic,
  reorderVocabularyTopics,
} from '../../services/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './VocabularyTopicsContent.css';

// Sortable Topic Card Component
const SortableTopicCard = ({ topic, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const arrowButtonStyle = {
    padding: '6px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const disabledArrowStyle = {
    ...arrowButtonStyle,
    opacity: 0.3,
    cursor: 'not-allowed',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: isDragging ? '#e0f2fe' : '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        userSelect: 'none',
      }}>
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', touchAction: 'none', padding: '4px' }}
        >
          <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Topic Info */}
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
            {topic.title}
          </span>
        </div>

        {/* Level Badge */}
        <span style={{
          padding: '4px 8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#374151',
        }}>
          {topic.level}
        </span>

        {/* Status */}
        <span style={{
          padding: '4px 8px',
          backgroundColor: topic.isActive !== false ? '#dcfce7' : '#fee2e2',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '500',
          color: topic.isActive !== false ? '#166534' : '#991b1b',
        }}>
          {topic.isActive !== false ? 'Active' : 'Hidden'}
        </span>

        {/* Arrow Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            style={isFirst ? disabledArrowStyle : arrowButtonStyle}
            title="تحريك لأعلى"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            style={isLast ? disabledArrowStyle : arrowButtonStyle}
            title="تحريك لأسفل"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

function VocabularyTopicsContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [topics, setTopics] = useState([]);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [viewMode, setViewMode] = useState('topics'); // 'topics' or 'reorder'
  const [selectedLevel, setSelectedLevel] = useState('A1');
  const [reorderLoading, setReorderLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    level: 'A1',
    shortDescription: '',
    status: 'active',
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTopics = topics.filter(t => t.level === selectedLevel);
  const levels = [...new Set(topics.map(t => t.level))].sort();

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoadingTopics(true);
      const data = await getVocabularyTopics();
      const topicsList = Array.isArray(data) ? data : (data?.items || data?.topics || []);
      setTopics(topicsList);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('حدث خطأ أثناء تحميل المواضيع');
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        setError('اسم الموضوع مطلوب');
        return;
      }

      const payload = {
        title: formData.title.trim(),
        level: formData.level,
        description: formData.shortDescription || undefined,
        isActive: formData.status === 'active',
      };

      if (editingTopicId) {
        await updateVocabularyTopic(editingTopicId, payload);
        setSuccess('تم تحديث الموضوع بنجاح!');
      } else {
        await createVocabularyTopic(payload);
        setSuccess('تم إضافة الموضوع بنجاح!');
      }

      setFormData({ title: '', level: 'A1', shortDescription: '', status: 'active' });
      setEditingTopicId(null);
      await fetchTopics();
    } catch (err) {
      console.error('Error saving topic:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ الموضوع');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (topic) => {
    setFormData({
      title: topic.title || '',
      level: topic.level || 'A1',
      shortDescription: topic.description || topic.shortDescription || '',
      status: topic.isActive === true || topic.isActive === undefined ? 'active' : 'hidden',
    });
    setEditingTopicId(topic._id || topic.id);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموضوع؟ سيتم حذف جميع الكلمات المرتبطة به أيضاً.')) {
      return;
    }

    try {
      await deleteVocabularyTopic(topicId);
      setSuccess('تم حذف الموضوع بنجاح!');
      await fetchTopics();
    } catch (err) {
      console.error('Error deleting topic:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء حذف الموضوع');
    }
  };

  const handleViewWords = (topicId) => {
    navigate(`/admin/vocabulary/topics/${topicId}/words`);
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredTopics.findIndex(t => t._id === active.id);
      const newIndex = filteredTopics.findIndex(t => t._id === over.id);

      const reorderedFiltered = arrayMove(filteredTopics, oldIndex, newIndex);

      const otherTopics = topics.filter(t => t.level !== selectedLevel);
      const newTopics = [...otherTopics, ...reorderedFiltered];
      setTopics(newTopics);

      try {
        setReorderLoading(true);
        const topicIds = reorderedFiltered.map(t => t._id);
        await reorderVocabularyTopics(topicIds);
        setSuccess('تم حفظ الترتيب الجديد بنجاح!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error reordering topics:', err);
        setError('حدث خطأ أثناء حفظ الترتيب');
        const data = await getVocabularyTopics();
        const topicsList = Array.isArray(data) ? data : (data?.items || data?.topics || []);
        setTopics(topicsList);
      } finally {
        setReorderLoading(false);
      }
    }
  };

  // Handle manual move (up/down buttons)
  const handleManualMove = async (topicId, direction) => {
    const currentIndex = filteredTopics.findIndex(t => t._id === topicId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= filteredTopics.length) return;

    const reorderedFiltered = arrayMove(filteredTopics, currentIndex, newIndex);

    const otherTopics = topics.filter(t => t.level !== selectedLevel);
    const newTopics = [...otherTopics, ...reorderedFiltered];
    setTopics(newTopics);

    try {
      setReorderLoading(true);
      const topicIds = reorderedFiltered.map(t => t._id);
      await reorderVocabularyTopics(topicIds);
      setSuccess('تم حفظ الترتيب!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error reordering topics:', err);
      setError('حدث خطأ أثناء حفظ الترتيب');
      const data = await getVocabularyTopics();
      const topicsList = Array.isArray(data) ? data : (data?.items || data?.topics || []);
      setTopics(topicsList);
    } finally {
      setReorderLoading(false);
    }
  };

  return (
    <div className="vocabulary-topics-content">
      <div className="content-header">
        <button onClick={() => navigate('/admin')} className="back-button">
          <svg fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
            <path
              strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
              d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="#000000" fill="none"
            />
          </svg>
        </button>
        <h1>إدارة مواضيع المفردات</h1>
      </div>

      {/* View Mode Toggle */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        padding: '8px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        width: 'fit-content',
      }}>
        <button
          type="button"
          onClick={() => setViewMode('topics')}
          style={{
            padding: '10px 20px',
            backgroundColor: viewMode === 'topics' ? '#000' : 'transparent',
            color: viewMode === 'topics' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
          }}
        >
          إدارة المواضيع
        </button>
        <button
          type="button"
          onClick={() => setViewMode('reorder')}
          style={{
            padding: '10px 20px',
            backgroundColor: viewMode === 'reorder' ? '#000' : 'transparent',
            color: viewMode === 'reorder' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
          }}
        >
          ترتيب المواضيع
        </button>
      </div>

      {/* Reorder Mode */}
      {viewMode === 'reorder' && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            ترتيب المواضيع بالسحب والإفلات
          </h2>

          {/* Level Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              اختر المستوى:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {levels.length > 0 ? levels.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedLevel === level ? '#3b82f6' : '#fff',
                    color: selectedLevel === level ? '#fff' : '#374151',
                    border: '1px solid',
                    borderColor: selectedLevel === level ? '#3b82f6' : '#d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {level}
                </button>
              )) : (
                <span style={{ color: '#6b7280' }}>لا توجد مستويات</span>
              )}
            </div>
          </div>

          {/* Loading indicator */}
          {reorderLoading && (
            <div style={{
              padding: '12px',
              backgroundColor: '#e0f2fe',
              borderRadius: '6px',
              marginBottom: '16px',
              textAlign: 'center',
              color: '#0369a1',
            }}>
              جاري حفظ الترتيب...
            </div>
          )}

          {/* Topics List */}
          {loadingTopics ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>جاري تحميل المواضيع...</p>
          ) : filteredTopics.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
              لا توجد مواضيع لهذا المستوى
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredTopics.map(t => t._id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredTopics.map((topic, index) => (
                    <div key={topic._id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '50%',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#374151',
                        flexShrink: 0,
                      }}>
                        {index + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <SortableTopicCard
                          topic={topic}
                          onMoveUp={() => handleManualMove(topic._id, 'up')}
                          onMoveDown={() => handleManualMove(topic._id, 'down')}
                          isFirst={index === 0}
                          isLast={index === filteredTopics.length - 1}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <p style={{ marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
            اسحب البطاقات أو استخدم الأسهم لترتيبها. يتم حفظ الترتيب تلقائياً.
          </p>

          {error && (
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '6px', color: '#991b1b' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#dcfce7', borderRadius: '6px', color: '#166534' }}>
              {success}
            </div>
          )}
        </div>
      )}

      {/* Topics Mode (Form + Cards) */}
      {viewMode === 'topics' && (
        <>
          {/* Form */}
          <form onSubmit={handleSubmit} className="vocabulary-topic-form">
            <h2>{editingTopicId ? 'تعديل موضوع' : 'إضافة موضوع مفردات'}</h2>

            <div className="form-group">
              <label htmlFor="title">اسم الموضوع *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="مثال: الحياة اليومية – العمل – السفر"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="level">المستوى *</label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                required
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="shortDescription">وصف بسيط (اختياري)</label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                placeholder="يظهر تحت الكرت"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">حالة الموضوع *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-actions">
              {editingTopicId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ title: '', level: 'A1', shortDescription: '', status: 'active' });
                    setEditingTopicId(null);
                    setError('');
                    setSuccess('');
                  }}
                  className="cancel-btn"
                >
                  إلغاء التعديل
                </button>
              )}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'جاري الحفظ...' : editingTopicId ? 'تحديث الموضوع' : '➕ حفظ الموضوع'}
              </button>
            </div>
          </form>

          {/* Topics List */}
          <div className="topics-list-section">
            <h2>المواضيع الموجودة ({topics.length})</h2>

            {loadingTopics ? (
              <p>جاري تحميل المواضيع...</p>
            ) : topics.length === 0 ? (
              <p className="no-data">لا توجد مواضيع بعد</p>
            ) : (
              <div className="topics-grid">
                {topics.map((topic) => (
                  <div key={topic._id || topic.id} className="topic-card">
                    <div className="topic-card-header">
                      <span className="topic-icon">{topic.icon || '📝'}</span>
                      <span className="topic-level">{topic.level}</span>
                    </div>
                    <h3 className="topic-title">{topic.title}</h3>
                    {(topic.description || topic.shortDescription) && (
                      <p className="topic-description">{topic.description || topic.shortDescription}</p>
                    )}
                    <div className="topic-status">
                      <span className={`status-badge ${(topic.isActive === true || topic.isActive === undefined) ? 'active' : 'hidden'}`}>
                        {(topic.isActive === true || topic.isActive === undefined) ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <div className="topic-actions">
                      <button
                        onClick={() => handleViewWords(topic._id || topic.id)}
                        className="action-btn view-btn"
                      >
                        عرض الكلمات
                      </button>
                      <button
                        onClick={() => handleEdit(topic)}
                        className="action-btn edit-btn"
                      >
                        ✏️ تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(topic._id || topic.id)}
                        className="action-btn delete-btn"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default VocabularyTopicsContent;
