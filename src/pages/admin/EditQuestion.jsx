import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionsAPI } from '../../services/questionsAPI';
import './CreateQuestion.css';

function EditQuestion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    prompt: '',
    qType: 'mcq',
    options: [{ text: '', isCorrect: false }],
    fillExact: '',
    regexList: [],
    answerKeyBoolean: true,
    answerKeyMatch: [{ left: '', right: '' }],
    answerKeyReorder: [],
    provider: 'Deutschland-in-Leben',
    section: '',
    level: 'B1',
    tags: [],
    status: 'draft',
    questionType: 'general',
    selectedState: '',
  });

  const [newTag, setNewTag] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

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

  // تحميل بيانات السؤال
  useEffect(() => {
    if (id) {
      loadQuestion();
    }
  }, [id]);

  const loadQuestion = async () => {
    try {
      setLoadingQuestion(true);
      setError('');
      const question = await questionsAPI.getById(id);
      
      // استخراج الولاية من tags (إذا كان LiD)
      let selectedState = '';
      if (question.provider === 'Deutschland-in-Leben' || question.provider === 'LiD') {
        const stateTag = question.tags?.find(tag => germanStates.includes(tag));
        if (stateTag) {
          selectedState = stateTag;
        }
      }

      // تحويل البيانات من API format إلى form format
      // معالجة options - قد تكون array من objects أو strings
      let options = [];
      if (question.options && Array.isArray(question.options)) {
        if (question.options.length > 0 && typeof question.options[0] === 'string') {
          // إذا كانت strings، نحولها إلى objects
          options = question.options.map((opt, idx) => ({
            text: opt,
            isCorrect: question.correctAnswerIndex === idx || 
                      (Array.isArray(question.correctAnswerIndex) && question.correctAnswerIndex.includes(idx)) ||
                      false,
          }));
        } else {
          // إذا كانت objects بالفعل
          options = question.options.map(opt => ({
            text: opt.text || opt,
            isCorrect: opt.isCorrect !== undefined ? opt.isCorrect : false,
          }));
        }
      } else {
        options = [{ text: '', isCorrect: false }];
      }

      // معالجة answerKeyMatch - قد تكون array من objects أو array من arrays
      let answerKeyMatch = [];
      if (question.answerKeyMatch && Array.isArray(question.answerKeyMatch)) {
        if (question.answerKeyMatch.length > 0 && Array.isArray(question.answerKeyMatch[0])) {
          // إذا كانت array of arrays: [[left, right], ...]
          answerKeyMatch = question.answerKeyMatch.map(pair => ({
            left: pair[0] || '',
            right: pair[1] || '',
          }));
        } else {
          // إذا كانت array of objects: [{left, right}, ...]
          answerKeyMatch = question.answerKeyMatch.map(pair => ({
            left: pair.left || pair[0] || '',
            right: pair.right || pair[1] || '',
          }));
        }
      } else {
        answerKeyMatch = [{ left: '', right: '' }];
      }

      setFormData({
        prompt: question.prompt || '',
        qType: question.qType || 'mcq',
        options: options.length > 0 ? options : [{ text: '', isCorrect: false }],
        fillExact: question.fillExact || '',
        regexList: Array.isArray(question.regexList) ? question.regexList : [],
        answerKeyBoolean: question.answerKeyBoolean !== undefined ? question.answerKeyBoolean : true,
        answerKeyMatch: answerKeyMatch,
        answerKeyReorder: Array.isArray(question.answerKeyReorder) ? question.answerKeyReorder : [],
        provider: question.provider || 'Deutschland-in-Leben',
        section: question.section || '',
        level: question.level || 'B1',
        tags: Array.isArray(question.tags) ? question.tags : [],
        status: question.status || 'draft',
        questionType: selectedState ? 'state' : 'general',
        selectedState: selectedState,
      });

      // إذا كان هناك media
      if (question.media) {
        setAudioPreview(question.media.url || question.mediaUrl);
      }
    } catch (err) {
      console.error('Error loading question:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء تحميل السؤال'
      );
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      
      // إذا تغير نوع السؤال (qType)، نعيد تعيين الحقول
      if (name === 'qType') {
        if (value === 'mcq') {
          updated.options = [{ text: '', isCorrect: false }];
        } else if (value === 'true_false') {
          updated.answerKeyBoolean = true;
        } else if (value === 'fill') {
          updated.fillExact = '';
          updated.regexList = [];
        } else if (value === 'match') {
          updated.answerKeyMatch = [{ left: '', right: '' }];
        } else if (value === 'reorder') {
          updated.answerKeyReorder = [];
        }
      }
      
      return updated;
    });
  };

  const handleOptionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }],
    }));
  };

  const removeOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handlers for fill type (regex)
  const handleAddRegex = () => {
    setFormData((prev) => ({
      ...prev,
      regexList: [...prev.regexList, ''],
    }));
  };

  const handleUpdateRegex = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      regexList: prev.regexList.map((regex, i) => (i === index ? value : regex)),
    }));
  };

  const handleRemoveRegex = (index) => {
    setFormData((prev) => ({
      ...prev,
      regexList: prev.regexList.filter((_, i) => i !== index),
    }));
  };

  // Handlers for match type
  const handleAddMatchPair = () => {
    setFormData((prev) => ({
      ...prev,
      answerKeyMatch: [...prev.answerKeyMatch, { left: '', right: '' }],
    }));
  };

  const handleUpdateMatchPair = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      answerKeyMatch: prev.answerKeyMatch.map((pair, i) =>
        i === index ? { ...pair, [field]: value } : pair
      ),
    }));
  };

  const handleRemoveMatchPair = (index) => {
    setFormData((prev) => ({
      ...prev,
      answerKeyMatch: prev.answerKeyMatch.filter((_, i) => i !== index),
    }));
  };

  // Handlers for reorder type
  const handleAddReorderItem = () => {
    setFormData((prev) => ({
      ...prev,
      answerKeyReorder: [...prev.answerKeyReorder, ''],
    }));
  };

  const handleUpdateReorderItem = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      answerKeyReorder: prev.answerKeyReorder.map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleRemoveReorderItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      answerKeyReorder: prev.answerKeyReorder.filter((_, i) => i !== index),
    }));
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('الملف يجب أن يكون ملف صوتي');
      return;
    }

    setUploadingAudio(true);
    setError('');

    try {
      const response = await questionsAPI.uploadMedia(file);
      setAudioFile(response.key);
      setAudioPreview(response.url);
      setSuccess('تم رفع الملف الصوتي بنجاح');
    } catch (err) {
      console.error('Error uploading audio:', err);
      setError('حدث خطأ أثناء رفع الملف الصوتي');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.prompt.trim()) {
      setError('نص السؤال مطلوب');
      return;
    }

    if (formData.qType === 'mcq' && formData.options.length < 2) {
      setError('يجب إضافة خيارين على الأقل');
      return;
    }

    if (formData.qType === 'mcq' && !formData.options.some((opt) => opt.isCorrect)) {
      setError('يجب تحديد إجابة صحيحة واحدة على الأقل');
      return;
    }

    setLoading(true);

    try {
      const questionData = {
        prompt: formData.prompt.trim(),
        qType: formData.qType,
        provider: formData.provider,
        level: formData.level,
        tags: formData.tags,
        status: formData.status,
      };

      if (formData.section) {
        questionData.section = formData.section;
      }

      // حسب نوع السؤال
      if (formData.qType === 'mcq') {
        questionData.options = formData.options.map((opt) => ({
          text: opt.text.trim(),
          isCorrect: opt.isCorrect,
        }));
      } else if (formData.qType === 'fill') {
        if (formData.fillExact) {
          questionData.fillExact = formData.fillExact;
        }
        if (formData.regexList.length > 0) {
          questionData.regexList = formData.regexList;
        }
      } else if (formData.qType === 'true_false') {
        questionData.answerKeyBoolean = formData.answerKeyBoolean;
      } else if (formData.qType === 'match') {
        questionData.answerKeyMatch = formData.answerKeyMatch;
      } else if (formData.qType === 'reorder') {
        questionData.answerKeyReorder = formData.answerKeyReorder;
      }

      // إضافة media إذا كان موجود
      if (audioFile) {
        questionData.media = {
          type: 'audio',
          key: audioFile,
          mime: 'audio/mpeg',
        };
      }

      console.log('Updating question data:', JSON.stringify(questionData, null, 2));

      await questionsAPI.update(id, questionData);
      setSuccess('تم تحديث السؤال بنجاح!');
      
      setTimeout(() => {
        navigate('/admin/questions');
      }, 1500);
    } catch (err) {
      console.error('Update question error:', err);
      
      let errorMessage = 'حدث خطأ أثناء تحديث السؤال';
      
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

  if (loadingQuestion) {
    return (
      <div className="create-question-page">
        <div className="page-header">
          <button onClick={() => navigate('/admin/questions')} className="back-btn">
            ← العودة
          </button>
          <h1>تعديل السؤال</h1>
        </div>
        <div className="create-question-container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <p>جاري تحميل بيانات السؤال...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-question-page">
      <div className="page-header">
        <button onClick={() => navigate('/admin/questions')} className="back-btn">
          ← العودة
        </button>
        <h1>تعديل السؤال</h1>
      </div>

      <div className="create-question-container">
        <form onSubmit={handleSubmit} className="question-form">
          {/* Prompt */}
          <div className="form-group">
            <label htmlFor="prompt">نص السؤال *</label>
            <textarea
              id="prompt"
              name="prompt"
              value={formData.prompt}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="أدخل نص السؤال هنا..."
            />
          </div>

          {/* Question Type */}
          <div className="form-group">
            <label htmlFor="qType">نوع السؤال *</label>
            <select
              id="qType"
              name="qType"
              value={formData.qType}
              onChange={handleInputChange}
              required
            >
              <option value="mcq">اختيار متعدد (MCQ)</option>
              <option value="true_false">صحيح/خطأ (True/False)</option>
              <option value="fill">ملء الفراغ (Fill)</option>
              <option value="match">مطابقة (Match)</option>
              <option value="reorder">إعادة ترتيب (Reorder)</option>
            </select>
          </div>

          {/* MCQ Options */}
          {formData.qType === 'mcq' && (
            <div className="form-group">
              <label>الخيارات *</label>
              {formData.options.map((option, index) => (
                <div key={index} className="option-item">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    placeholder={`خيار ${index + 1}`}
                    required
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                    />
                    <span>صحيح</span>
                  </label>
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="remove-btn"
                    >
                      حذف
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption} className="add-btn">
                + إضافة خيار
              </button>
            </div>
          )}

          {/* True/False */}
          {formData.qType === 'true_false' && (
            <div className="form-group">
              <label>الإجابة الصحيحة *</label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="answerKeyBoolean"
                  checked={formData.answerKeyBoolean === true}
                  onChange={() => setFormData((prev) => ({ ...prev, answerKeyBoolean: true }))}
                />
                <span>صحيح</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="answerKeyBoolean"
                  checked={formData.answerKeyBoolean === false}
                  onChange={() => setFormData((prev) => ({ ...prev, answerKeyBoolean: false }))}
                />
                <span>خطأ</span>
              </label>
            </div>
          )}

          {/* Fill */}
          {formData.qType === 'fill' && (
            <div className="form-group">
              <label htmlFor="fillExact">الإجابة الصحيحة (fillExact) *</label>
              <input
                type="text"
                id="fillExact"
                name="fillExact"
                value={formData.fillExact}
                onChange={handleInputChange}
                placeholder="مثال: برلين"
                required
              />
              <small>الإجابة الصحيحة المطلوبة (مطابقة تامة)</small>

              <div style={{ marginTop: '16px' }}>
                <label>قائمة Regex (اختياري)</label>
                {formData.regexList.map((regex, index) => (
                  <div key={index} className="option-item">
                    <input
                      type="text"
                      value={regex}
                      onChange={(e) => handleUpdateRegex(index, e.target.value)}
                      placeholder={`Regex ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRegex(index)}
                      className="remove-btn"
                    >
                      حذف
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddRegex}
                  className="add-btn"
                >
                  + إضافة Regex
                </button>
                <small>قائمة من التعبيرات النمطية للتحقق من الإجابة</small>
              </div>
            </div>
          )}

          {/* Match Pairs */}
          {formData.qType === 'match' && (
            <div className="form-group">
              <label>أزواج المطابقة *</label>
              {formData.answerKeyMatch.map((pair, index) => (
                <div key={index} className="option-item">
                  <input
                    type="text"
                    value={pair.left}
                    onChange={(e) => handleUpdateMatchPair(index, 'left', e.target.value)}
                    placeholder={`اليسار ${index + 1}`}
                  />
                  <span style={{ margin: '0 8px' }}>↔</span>
                  <input
                    type="text"
                    value={pair.right}
                    onChange={(e) => handleUpdateMatchPair(index, 'right', e.target.value)}
                    placeholder={`اليمين ${index + 1}`}
                  />
                  {formData.answerKeyMatch.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMatchPair(index)}
                      className="remove-btn"
                    >
                      حذف
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddMatchPair}
                className="add-btn"
              >
                + إضافة زوج
              </button>
            </div>
          )}

          {/* Reorder Items */}
          {formData.qType === 'reorder' && (
            <div className="form-group">
              <label>ترتيب العناصر الصحيح *</label>
              <small style={{ display: 'block', marginBottom: '8px' }}>
                أدخل العناصر بالترتيب الصحيح (من الأعلى إلى الأسفل)
              </small>
              {formData.answerKeyReorder.map((item, index) => (
                <div key={index} className="option-item">
                  <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{index + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateReorderItem(index, e.target.value)}
                    placeholder={`العنصر ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveReorderItem(index)}
                    className="remove-btn"
                  >
                    حذف
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddReorderItem}
                className="add-btn"
              >
                + إضافة عنصر
              </button>
            </div>
          )}

          {/* Provider */}
          <div className="form-group">
            <label htmlFor="provider">المزود</label>
            <select
              id="provider"
              name="provider"
              value={formData.provider}
              onChange={handleInputChange}
            >
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

          {/* Section */}
          <div className="form-group">
            <label htmlFor="section">القسم</label>
            <select
              id="section"
              name="section"
              value={formData.section}
              onChange={handleInputChange}
            >
              <option value="">-- اختر القسم --</option>
              <option value="Hören">Hören</option>
              <option value="Lesen">Lesen</option>
              <option value="Schreiben">Schreiben</option>
              <option value="Sprechen">Sprechen</option>
            </select>
          </div>

          {/* Level */}
          <div className="form-group">
            <label htmlFor="level">المستوى</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
            >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="أدخل tag واضغط Enter"
              />
              <button type="button" onClick={handleAddTag} className="add-btn">
                إضافة
              </button>
            </div>
            <div className="tags-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Audio Upload */}
          <div className="form-group">
            <label>ملف صوتي (اختياري)</label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              disabled={uploadingAudio}
            />
            {audioPreview && (
              <div className="audio-preview">
                <audio controls src={audioPreview} />
                <button
                  type="button"
                  onClick={() => {
                    setAudioFile(null);
                    setAudioPreview(null);
                  }}
                  className="remove-btn"
                >
                  إزالة الملف
                </button>
              </div>
            )}
            {uploadingAudio && <p>جاري رفع الملف...</p>}
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
              ⚠️ ملاحظة: فقط الأسئلة بحالة "منشور (Published)" ستظهر للطلاب. 
              الأسئلة بحالة "مسودة (Draft)" لن تظهر في صفحة الطلاب.
            </small>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/questions')}
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

export default EditQuestion;

