import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examsAPI } from '../../services/examsAPI';
import './CreateExam.css';

function EditExam() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingExam, setLoadingExam] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedState, setSelectedState] = useState('Bayern');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    provider: 'LiD',
    level: 'B1',
    state: 'Bayern',
    sections: [],
    randomizeQuestions: true,
    attemptLimit: 0,
    timeLimitMin: 60,
    status: 'draft',
  });

  // قائمة الولايات الألمانية
  const germanStates = [
    'Baden-Württemberg',
    'Bayern',
    'Berlin',
    'Brandenburg',
    'Bremen',
    'Hamburg',
    'Hessen',
    'Mecklenburg-Vorpommern',
    'Niedersachsen',
    'Nordrhein-Westfalen',
    'Rheinland-Pfalz',
    'Saarland',
    'Sachsen',
    'Sachsen-Anhalt',
    'Schleswig-Holstein',
    'Thüringen',
  ];

  // تحميل بيانات الامتحان
  useEffect(() => {
    if (id) {
      loadExam();
    }
  }, [id]);

  const loadExam = async () => {
    try {
      setLoadingExam(true);
      setError('');
      const exam = await examsAPI.getById(id);
      
      // استخراج الولاية من tags القسم الأول (إذا كان LiD)
      let state = 'Bayern';
      if (exam.provider === 'LiD' && exam.sections && exam.sections.length > 0) {
        const firstSectionTags = exam.sections[0].tags || [];
        const stateTag = firstSectionTags.find(tag => germanStates.includes(tag));
        if (stateTag) {
          state = stateTag;
        }
      }

      setSelectedState(state);
      
      // تحويل البيانات من API format إلى form format
      setFormData({
        title: exam.title || '',
        provider: exam.provider || 'LiD',
        level: exam.level || 'B1',
        state: state,
        sections: (exam.sections || []).map(section => ({
          section: section.name || section.section || '',
          name: section.name || section.section || '',
          quota: section.quota || 0,
          tags: section.tags || [],
          difficultyDistribution: section.difficultyDistribution || {
            easy: 0,
            med: 0,
            medium: 0,
            hard: 0,
          },
        })),
        randomizeQuestions: exam.randomizeQuestions !== undefined ? exam.randomizeQuestions : true,
        attemptLimit: exam.attemptLimit || 0,
        timeLimitMin: exam.timeLimitMin || 60,
        status: exam.status || 'draft',
      });
    } catch (err) {
      console.error('Error loading exam:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء تحميل الامتحان'
      );
    } finally {
      setLoadingExam(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      
      if (name === 'provider' && value === 'Deutschland-in-Leben') {
        updated.provider = 'LiD';
      }
      
      return updated;
    });
  };

  const handleSectionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    setFormData((prev) => ({
      ...prev,
      state: state,
    }));
    handleSectionTagsChange(0, [state]);
  };

  const handleDifficultyChange = (index, difficulty, value) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index
          ? {
              ...section,
              difficultyDistribution: {
                ...section.difficultyDistribution,
                [difficulty]: parseInt(value) || 0,
              },
            }
          : section
      ),
    }));
  };

  const validateDifficultyDistribution = (section) => {
    if (!section.difficultyDistribution) return true;
    const { easy = 0, med = 0, medium = 0, hard = 0 } = section.difficultyDistribution;
    const medValue = med || medium;
    const sum = easy + medValue + hard;
    return sum === 0 || sum === section.quota;
  };

  const handleSectionTagsChange = (index, tags) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, tags } : section
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('عنوان الامتحان مطلوب');
      return;
    }

    if (formData.sections.length === 0) {
      setError('يجب إضافة قسم واحد على الأقل');
      return;
    }

    for (let i = 0; i < formData.sections.length; i++) {
      const section = formData.sections[i];
      if (!section.tags || section.tags.length === 0) {
        setError(`القسم "${section.section || section.name}" يجب أن يحتوي على tags`);
        return;
      }
      
      if (!validateDifficultyDistribution(section)) {
        const { easy = 0, med = 0, medium = 0, hard = 0 } = section.difficultyDistribution || {};
        const medValue = med || medium;
        const sum = easy + medValue + hard;
        setError(
          `القسم "${section.section || section.name}": مجموع الصعوبة (${sum}) يجب أن يساوي عدد الأسئلة (${section.quota})`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const cleanedFormData = {
        title: formData.title.trim(),
        provider: formData.provider === 'Deutschland-in-Leben' ? 'LiD' : formData.provider,
        level: formData.level,
        timeLimitMin: Number(formData.timeLimitMin) || 0,
        attemptLimit: Number(formData.attemptLimit) || 0,
        randomizeQuestions: !!formData.randomizeQuestions,
        status: formData.status.toLowerCase(),
        sections: formData.sections.map((section) => {
          const cleanedSection = {
            name: section.section || section.name,
            tags: section.tags,
            quota: Number(section.quota) || 0,
          };
          
          if (section.difficultyDistribution) {
            const { easy = 0, med = 0, medium = 0, hard = 0 } = section.difficultyDistribution;
            const medValue = med || medium;
            if (easy > 0 || medValue > 0 || hard > 0) {
              cleanedSection.difficultyDistribution = {
                easy: Number(easy) || 0,
                medium: Number(medValue) || 0,
                hard: Number(hard) || 0,
              };
            }
          }
          
          return cleanedSection;
        }),
      };

      console.log('Updating exam data:', JSON.stringify(cleanedFormData, null, 2));

      await examsAPI.update(id, cleanedFormData);
      setSuccess('تم تحديث الامتحان بنجاح!');
      
      setTimeout(() => {
        navigate('/admin/exams');
      }, 1500);
    } catch (err) {
      console.error('Update exam error:', err);
      
      let errorMessage = 'حدث خطأ أثناء تحديث الامتحان';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        } else if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map(e => 
              typeof e === 'string' ? e : JSON.stringify(e)
            ).join(', ');
          } else {
            errorMessage = Object.entries(errorData.errors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ');
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = JSON.stringify(errorData, null, 2);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingExam) {
    return (
      <div className="create-exam-page">
        <div className="page-header">
          <button onClick={() => navigate('/admin/exams')} className="back-btn">
            ← العودة
          </button>
          <h1>تعديل الامتحان</h1>
        </div>
        <div className="create-exam-container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <p>جاري تحميل بيانات الامتحان...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-exam-page">
      <div className="page-header">
        <button onClick={() => navigate('/admin/exams')} className="back-btn">
          ← العودة
        </button>
        <h1>تعديل الامتحان</h1>
      </div>

      <div className="create-exam-container">
        <form onSubmit={handleSubmit} className="exam-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">عنوان الامتحان *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="مثال: Deutschland in Leben - Bayern"
            />
          </div>

          {/* Provider */}
          <div className="form-group">
            <label htmlFor="provider">المزود *</label>
            <select
              id="provider"
              name="provider"
              value={formData.provider}
              onChange={handleInputChange}
              required
            >
              <option value="LiD">LiD (Deutschland-in-Leben)</option>
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

          {/* State - فقط لـ LiD */}
          {formData.provider === 'LiD' && (
            <div className="form-group">
              <label htmlFor="state">الولاية *</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={(e) => handleStateChange(e.target.value)}
                required
              >
                {germanStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Level */}
          <div className="form-group">
            <label htmlFor="level">المستوى *</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              required
            >
              <option value="A1">A1 - المبتدئ</option>
              <option value="A2">A2 - المبتدئ المتقدم</option>
              <option value="B1">B1 - المتوسط</option>
              <option value="B2">B2 - المتوسط المتقدم</option>
              <option value="C1">C1 - المتقدم</option>
            </select>
          </div>

          {/* Sections */}
          <div className="form-group">
            <label>الأقسام *</label>
            {formData.sections.map((section, index) => (
              <div key={index} className="section-item">
                <div className="section-header">
                  <h4>القسم {index + 1}</h4>
                  {formData.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          sections: prev.sections.filter((_, i) => i !== index),
                        }));
                      }}
                      className="remove-section-btn"
                    >
                      حذف
                    </button>
                  )}
                </div>

                <div className="section-fields">
                  <div className="field-group">
                    <label>اسم القسم *</label>
                    <input
                      type="text"
                      value={section.section || section.name || ''}
                      onChange={(e) => handleSectionChange(index, 'section', e.target.value)}
                      required
                      placeholder="مثال: أسئلة الولاية"
                    />
                  </div>

                  <div className="field-group">
                    <label>عدد الأسئلة (Quota) *</label>
                    <input
                      type="number"
                      min="1"
                      value={section.quota}
                      onChange={(e) => handleSectionChange(index, 'quota', parseInt(e.target.value))}
                      required
                    />
                  </div>

                  {index === 0 && formData.provider === 'LiD' && (
                    <div className="field-group">
                      <label>Tags *</label>
                      <input
                        type="text"
                        value={section.tags.join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                          handleSectionTagsChange(index, tags);
                        }}
                        placeholder="Bayern"
                        readOnly
                        className="readonly-input"
                      />
                      <small>أسئلة الولاية: {formData.state}</small>
                    </div>
                  )}

                  {index === 1 && formData.provider === 'LiD' && (
                    <div className="field-group">
                      <label>Tags *</label>
                      <input
                        type="text"
                        value={section.tags.join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                          handleSectionTagsChange(index, tags);
                        }}
                        placeholder="300-Fragen"
                        readOnly
                        className="readonly-input"
                      />
                      <small>أسئلة الـ 300 العامة</small>
                    </div>
                  )}

                  {!(index === 0 && formData.provider === 'LiD') && 
                   !(index === 1 && formData.provider === 'LiD') && (
                    <div className="field-group">
                      <label>Tags *</label>
                      <input
                        type="text"
                        value={section.tags ? section.tags.join(', ') : ''}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                          handleSectionTagsChange(index, tags);
                        }}
                        placeholder="مثال: Hören, Teil-1"
                      />
                      <small>أدخل tags مفصولة بفواصل</small>
                    </div>
                  )}

                  {/* Difficulty Distribution */}
                  <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                    <label>توزيع الصعوبة (اختياري)</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                          سهل (Easy)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={section.difficultyDistribution?.easy || 0}
                          onChange={(e) => handleDifficultyChange(index, 'easy', e.target.value)}
                          style={{ width: '100%', padding: '8px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                          متوسط (Medium)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={section.difficultyDistribution?.med || section.difficultyDistribution?.medium || 0}
                          onChange={(e) => handleDifficultyChange(index, 'med', e.target.value)}
                          style={{ width: '100%', padding: '8px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                          صعب (Hard)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={section.difficultyDistribution?.hard || 0}
                          onChange={(e) => handleDifficultyChange(index, 'hard', e.target.value)}
                          style={{ width: '100%', padding: '8px' }}
                        />
                      </div>
                    </div>
                    <small style={{ display: 'block', marginTop: '4px' }}>
                      عدد الأسئلة لكل مستوى صعوبة (0 = غير محدد)
                    </small>
                  </div>
                </div>
              </div>
            ))}

            {formData.provider === 'LiD' && formData.sections.length < 2 && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    sections: [
                      ...prev.sections,
                      {
                        section: '300 Fragen Pool',
                        quota: 30,
                        tags: ['300-Fragen'],
                        difficultyDistribution: {
                          easy: 0,
                          med: 0,
                          hard: 0,
                        },
                      },
                    ],
                  }));
                }}
                className="add-section-btn"
              >
                + إضافة قسم 300 Fragen
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  sections: [
                    ...prev.sections,
                    {
                      section: '',
                      quota: 1,
                      tags: [],
                      difficultyDistribution: {
                        easy: 0,
                        med: 0,
                        hard: 0,
                      },
                    },
                  ],
                }));
              }}
              className="add-section-btn"
              style={{ marginTop: '8px' }}
            >
              + إضافة قسم جديد
            </button>
          </div>

          {/* Randomize Questions */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="randomizeQuestions"
                checked={formData.randomizeQuestions}
                onChange={handleInputChange}
              />
              <span>خلط ترتيب الأسئلة</span>
            </label>
          </div>

          {/* Attempt Limit */}
          <div className="form-group">
            <label htmlFor="attemptLimit">عدد المحاولات المسموحة</label>
            <input
              type="number"
              id="attemptLimit"
              name="attemptLimit"
              min="0"
              value={formData.attemptLimit}
              onChange={handleInputChange}
            />
            <small>0 = غير محدود</small>
          </div>

          {/* Time Limit */}
          <div className="form-group">
            <label htmlFor="timeLimitMin">الوقت بالدقائق</label>
            <input
              type="number"
              id="timeLimitMin"
              name="timeLimitMin"
              min="0"
              value={formData.timeLimitMin}
              onChange={handleInputChange}
            />
            <small>0 = غير محدود</small>
          </div>

          {/* Status */}
          <div className="form-group">
            <label htmlFor="status">الحالة *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
            >
              <option value="draft">مسودة (Draft)</option>
              <option value="published">منشور (Published)</option>
              <option value="archived">مؤرشف (Archived)</option>
            </select>
            <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
              ⚠️ ملاحظة: فقط الامتحانات بحالة "منشور (Published)" ستظهر للطلاب. 
              الامتحانات بحالة "مسودة (Draft)" لن تظهر في صفحة الطلاب.
            </small>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/exams')}
              className="cancel-btn"
            >
              إلغاء
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditExam;

