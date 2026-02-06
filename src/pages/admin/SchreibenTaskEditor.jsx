import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getSchreibenTask,
  createSchreibenTask,
  updateSchreibenTask,
  linkSchreibenExam,
  unlinkSchreibenExam
} from '../../services/api';

// Field Types for form blocks
const FIELD_TYPES = [
  { value: 'text_input', label: 'حقل نصي' },
  { value: 'prefilled', label: 'نص معبأ مسبقاً' },
  { value: 'select', label: 'قائمة منسدلة' },
  { value: 'multiselect', label: 'اختيار متعدد' },
];

// Generate unique block ID
const generateBlockId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Block type component for Text
const TextBlockEditor = ({ block, onChange, onRemove }) => (
  <div style={{
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <span style={{ fontWeight: '600', color: '#475569' }}>📝 كتلة نصية</span>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: '#fee2e2',
          color: '#dc2626',
          border: 'none',
          padding: '4px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        حذف
      </button>
    </div>
    <textarea
      value={block.data?.content || ''}
      onChange={(e) => onChange({ ...block, data: { ...block.data, content: e.target.value } })}
      placeholder="أدخل النص هنا..."
      style={{
        width: '100%',
        minHeight: '100px',
        padding: '12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        resize: 'vertical',
        direction: 'rtl',
      }}
    />
  </div>
);

// Block type component for Image
const ImageBlockEditor = ({ block, onChange, onRemove }) => (
  <div style={{
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <span style={{ fontWeight: '600', color: '#166534' }}>🖼️ كتلة صورة</span>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: '#fee2e2',
          color: '#dc2626',
          border: 'none',
          padding: '4px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        حذف
      </button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        type="text"
        value={block.data?.src || ''}
        onChange={(e) => onChange({ ...block, data: { ...block.data, src: e.target.value } })}
        placeholder="رابط الصورة (URL)"
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
      <input
        type="text"
        value={block.data?.alt || ''}
        onChange={(e) => onChange({ ...block, data: { ...block.data, alt: e.target.value } })}
        placeholder="النص البديل للصورة (Alt text)"
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
      <input
        type="text"
        value={block.data?.caption || ''}
        onChange={(e) => onChange({ ...block, data: { ...block.data, caption: e.target.value } })}
        placeholder="وصف الصورة (اختياري)"
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
      {block.data?.src && (
        <img
          src={block.data.src}
          alt={block.data.alt || 'Preview'}
          style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '8px' }}
          onError={(e) => e.target.style.display = 'none'}
        />
      )}
    </div>
  </div>
);

// Single field editor within a form block
const FieldEditor = ({ field, onChange, onRemove }) => {
  const handleFieldChange = (key, value) => {
    onChange({ ...field, [key]: value });
  };

  const handleOptionsChange = (optionsText) => {
    const options = optionsText.split('\n').filter(o => o.trim());
    handleFieldChange('options', options);
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      padding: '12px',
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={field.label || ''}
          onChange={(e) => handleFieldChange('label', e.target.value)}
          placeholder="تسمية الحقل"
          style={{
            flex: '1',
            minWidth: '150px',
            padding: '8px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        />
        <select
          value={field.type || 'text_input'}
          onChange={(e) => handleFieldChange('type', e.target.value)}
          style={{
            padding: '8px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px',
            minWidth: '140px',
          }}
        >
          {FIELD_TYPES.map(ft => (
            <option key={ft.value} value={ft.value}>{ft.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Additional fields based on type */}
      {field.type === 'prefilled' && (
        <input
          type="text"
          value={field.value || ''}
          onChange={(e) => handleFieldChange('value', e.target.value)}
          placeholder="القيمة المعبأة مسبقاً"
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '8px',
          }}
        />
      )}

      {(field.type === 'select' || field.type === 'multiselect') && (
        <textarea
          value={(field.options || []).join('\n')}
          onChange={(e) => handleOptionsChange(e.target.value)}
          placeholder="الخيارات (خيار واحد في كل سطر)"
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '8px',
            resize: 'vertical',
          }}
        />
      )}

      {field.type === 'text_input' && (
        <input
          type="text"
          value={field.placeholder || ''}
          onChange={(e) => handleFieldChange('placeholder', e.target.value)}
          placeholder="نص التلميح (Placeholder)"
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '8px',
          }}
        />
      )}
    </div>
  );
};

// Block type component for Form
const FormBlockEditor = ({ block, onChange, onRemove }) => {
  const fields = block.data?.fields || [];

  const addField = () => {
    onChange({
      ...block,
      data: {
        ...block.data,
        fields: [...fields, { type: 'text_input', label: '', placeholder: '' }]
      }
    });
  };

  const updateField = (index, updatedField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    onChange({ ...block, data: { ...block.data, fields: newFields } });
  };

  const removeField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange({ ...block, data: { ...block.data, fields: newFields } });
  };

  return (
    <div style={{
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontWeight: '600', color: '#1e40af' }}>📋 كتلة نموذج</span>
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          حذف
        </button>
      </div>

      {/* Form title/description */}
      <input
        type="text"
        value={block.data?.title || ''}
        onChange={(e) => onChange({ ...block, data: { ...block.data, title: e.target.value } })}
        placeholder="عنوان النموذج (اختياري)"
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          marginBottom: '12px',
        }}
      />

      {/* Fields */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>الحقول:</p>
        {fields.map((field, index) => (
          <FieldEditor
            key={index}
            field={field}
            onChange={(updated) => updateField(index, updated)}
            onRemove={() => removeField(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addField}
        style={{
          width: '100%',
          padding: '10px',
          background: '#dbeafe',
          color: '#1d4ed8',
          border: '1px dashed #93c5fd',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        + إضافة حقل
      </button>
    </div>
  );
};

function SchreibenTaskEditor() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isEditing = Boolean(taskId) && taskId !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('B1');
  const [provider, setProvider] = useState('goethe');
  const [status, setStatus] = useState('draft');
  const [instructions, setInstructions] = useState('');
  const [contentBlocks, setContentBlocks] = useState([]);

  // Exam linking state
  const [linkedExamId, setLinkedExamId] = useState('');
  const [examIdInput, setExamIdInput] = useState('');
  const [linkingExam, setLinkingExam] = useState(false);

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const providers = [
    { value: 'goethe', label: 'Goethe' },
    { value: 'telc', label: 'TELC' },
    { value: 'oesd', label: 'ÖSD' },
    { value: 'ecl', label: 'ECL' },
    { value: 'dtb', label: 'DTB' },
    { value: 'dtz', label: 'DTZ' },
  ];
  const statuses = [
    { value: 'draft', label: 'مسودة' },
    { value: 'published', label: 'منشور' },
    { value: 'archived', label: 'مؤرشف' },
  ];

  // Load task if editing
  useEffect(() => {
    if (isEditing) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSchreibenTask(taskId);
      const task = data.task || data;

      setTitle(task.title || '');
      setLevel(task.level || 'B1');
      setProvider(task.provider || 'goethe');
      setStatus(task.status || 'draft');
      setInstructions(task.instructions || '');

      // Parse contentBlocks data from JSON strings to objects for editing
      const blocks = (task.contentBlocks || []).map(block => ({
        id: block.id || generateBlockId(),
        type: block.type,
        data: typeof block.data === 'string' ? JSON.parse(block.data) : (block.data || {})
      }));
      setContentBlocks(blocks);

      setLinkedExamId(task.examId || '');
      setExamIdInput(task.examId || '');
    } catch (err) {
      console.error('Error loading task:', err);
      setError('حدث خطأ أثناء تحميل المهمة');
    } finally {
      setLoading(false);
    }
  };

  // Add block
  const addBlock = (type) => {
    const newBlock = {
      id: generateBlockId(),
      type,
      data: {}
    };
    if (type === 'text') {
      newBlock.data = { content: '' };
    } else if (type === 'form') {
      newBlock.data = { title: '', fields: [] };
    } else if (type === 'image') {
      newBlock.data = { src: '', alt: '', caption: '' };
    }
    setContentBlocks([...contentBlocks, newBlock]);
  };

  // Update block
  const updateBlock = (index, updatedBlock) => {
    const newBlocks = [...contentBlocks];
    newBlocks[index] = updatedBlock;
    setContentBlocks(newBlocks);
  };

  // Remove block
  const removeBlock = (index) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  // Move block
  const moveBlock = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contentBlocks.length) return;

    const newBlocks = [...contentBlocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  // Link exam to task
  const handleLinkExam = async () => {
    if (!examIdInput.trim()) {
      setError('يرجى إدخال معرف الامتحان');
      return;
    }

    try {
      setLinkingExam(true);
      setError('');
      await linkSchreibenExam(taskId, examIdInput.trim());
      setLinkedExamId(examIdInput.trim());
      setSuccess('تم ربط المهمة بالامتحان بنجاح!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error linking exam:', err);
      setError('حدث خطأ أثناء ربط الامتحان');
    } finally {
      setLinkingExam(false);
    }
  };

  // Unlink exam from task
  const handleUnlinkExam = async () => {
    if (!window.confirm('هل أنت متأكد من إلغاء ربط الامتحان؟')) return;

    try {
      setLinkingExam(true);
      setError('');
      await unlinkSchreibenExam(taskId);
      setLinkedExamId('');
      setExamIdInput('');
      setSuccess('تم إلغاء ربط الامتحان بنجاح!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error unlinking exam:', err);
      setError('حدث خطأ أثناء إلغاء ربط الامتحان');
    } finally {
      setLinkingExam(false);
    }
  };

  // Save task
  const handleSave = async () => {
    if (!title.trim()) {
      setError('يرجى إدخال عنوان المهمة');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Filter out empty blocks before saving
      const validBlocks = contentBlocks.filter(block => {
        if (block.type === 'text') {
          // تأكد إن content موجود ومش فاضي
          return block.data?.content?.trim().length > 0;
        }
        if (block.type === 'form') {
          // تأكد إن title موجود و fields مش فاضية
          return block.data?.title && block.data?.fields?.length > 0;
        }
        if (block.type === 'image') {
          // تأكد إن src موجود
          return block.data?.src?.trim().length > 0;
        }
        return true;
      });

      // Transform contentBlocks to match backend DTO
      // Backend expects: { id: string, type: string, data: object }
      const transformedBlocks = validBlocks.map(block => ({
        id: block.id || generateBlockId(),
        type: block.type,
        data: block.data || {}
      }));

      const taskData = {
        title: title.trim(),
        level,
        provider,
        status,
        instructions: instructions.trim(),
        contentBlocks: transformedBlocks,
      };

      if (isEditing) {
        await updateSchreibenTask(taskId, taskData);
        setSuccess('تم حفظ التغييرات بنجاح!');
      } else {
        await createSchreibenTask(taskData);
        setSuccess('تم إنشاء المهمة بنجاح!');
        setTimeout(() => navigate('/admin/schreiben'), 1500);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving task:', err);
      setError('حدث خطأ أثناء حفظ المهمة');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        جاري تحميل المهمة...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        padding: '20px 28px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E9ECEF'
      }}>
        <button
          onClick={() => navigate('/admin/schreiben')}
          style={{
            background: 'white',
            border: '1px solid #DEE2E6',
            padding: '10px',
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="#000" />
          </svg>
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          {isEditing ? 'تعديل مهمة الكتابة' : 'إنشاء مهمة كتابة جديدة'}
        </h1>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          {success}
        </div>
      )}

      {/* Basic Info Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E9ECEF'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          المعلومات الأساسية
        </h2>

        {/* Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
            عنوان المهمة *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: كتابة رسالة إلى صديق"
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '15px',
            }}
          />
        </div>

        {/* Level, Provider, Status Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              المستوى
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
              }}
            >
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              المزود
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
              }}
            >
              {providers.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              الحالة
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
              }}
            >
              {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
            التعليمات العامة
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="أدخل التعليمات العامة للمهمة..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '15px',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {/* Content Blocks Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E9ECEF'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          محتوى المهمة
        </h2>

        {/* Blocks */}
        {contentBlocks.map((block, index) => (
          <div key={index} style={{ position: 'relative' }}>
            {/* Move buttons */}
            <div style={{
              position: 'absolute',
              left: '-40px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <button
                type="button"
                onClick={() => moveBlock(index, 'up')}
                disabled={index === 0}
                style={{
                  background: index === 0 ? '#f3f4f6' : '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  opacity: index === 0 ? 0.3 : 1,
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 'down')}
                disabled={index === contentBlocks.length - 1}
                style={{
                  background: index === contentBlocks.length - 1 ? '#f3f4f6' : '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: index === contentBlocks.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: index === contentBlocks.length - 1 ? 0.3 : 1,
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Block editor */}
            {block.type === 'text' && (
              <TextBlockEditor
                block={block}
                onChange={(updated) => updateBlock(index, updated)}
                onRemove={() => removeBlock(index)}
              />
            )}
            {block.type === 'form' && (
              <FormBlockEditor
                block={block}
                onChange={(updated) => updateBlock(index, updated)}
                onRemove={() => removeBlock(index)}
              />
            )}
            {block.type === 'image' && (
              <ImageBlockEditor
                block={block}
                onChange={(updated) => updateBlock(index, updated)}
                onRemove={() => removeBlock(index)}
              />
            )}
          </div>
        ))}

        {/* Add block buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '2px dashed #d1d5db',
        }}>
          <button
            type="button"
            onClick={() => addBlock('text')}
            style={{
              padding: '10px 20px',
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            📝 إضافة نص
          </button>
          <button
            type="button"
            onClick={() => addBlock('form')}
            style={{
              padding: '10px 20px',
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            📋 إضافة نموذج
          </button>
          <button
            type="button"
            onClick={() => addBlock('image')}
            style={{
              padding: '10px 20px',
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            🖼️ إضافة صورة
          </button>
        </div>
      </div>

      {/* Exam Linking Card - Only show when editing */}
      {isEditing && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E9ECEF'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            ربط بامتحان (اختياري)
          </h2>

          {linkedExamId ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              background: '#d1fae5',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '600', color: '#065f46' }}>
                  ✓ مرتبطة بامتحان
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#047857', fontFamily: 'monospace' }}>
                  ID: {linkedExamId}
                </p>
              </div>
              <button
                type="button"
                onClick={handleUnlinkExam}
                disabled={linkingExam}
                style={{
                  padding: '8px 16px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  cursor: linkingExam ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {linkingExam ? 'جاري...' : 'إلغاء الربط'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                  معرف الامتحان (Exam ID)
                </label>
                <input
                  type="text"
                  value={examIdInput}
                  onChange={(e) => setExamIdInput(e.target.value)}
                  placeholder="مثال: 6929bfed58d67e05dec3deb6"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleLinkExam}
                disabled={linkingExam || !examIdInput.trim()}
                style={{
                  padding: '12px 24px',
                  background: linkingExam || !examIdInput.trim() ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: linkingExam || !examIdInput.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}
              >
                {linkingExam ? 'جاري الربط...' : 'ربط الامتحان'}
              </button>
            </div>
          )}

          <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
            يمكنك ربط هذه المهمة بامتحان موجود لتتبع إجابات الطلاب وتصحيحها تلقائياً.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
      }}>
        <button
          type="button"
          onClick={() => navigate('/admin/schreiben')}
          style={{
            padding: '12px 24px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
          }}
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 32px',
            background: saving ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: '600',
          }}
        >
          {saving ? 'جاري الحفظ...' : (isEditing ? 'حفظ التغييرات' : 'إنشاء المهمة')}
        </button>
      </div>
    </div>
  );
}

export default SchreibenTaskEditor;
