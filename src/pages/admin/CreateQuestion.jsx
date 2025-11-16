import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsAPI } from '../../services/questionsAPI';
import './CreateQuestion.css';

function CreateQuestion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    prompt: '',
    qType: 'mcq',
    // للحقول MCQ
    options: [{ text: '', isCorrect: false }],
    // للحقول النصية (fill)
    fillExact: '',
    regexList: [],
    // للحقول true/false
    answerKeyBoolean: true,
    // للحقول matching
    answerKeyMatch: [{ left: '', right: '' }],
    // للحقول reorder
    answerKeyReorder: [],
    provider: 'Deutschland-in-Leben',
    section: '',
    level: 'B1',
    tags: [],
    status: 'draft',
    questionType: 'general', // 'general' or 'state'
    selectedState: '', // للأسئلة الخاصة بالولاية
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // إذا تغير نوع السؤال (qType)، نعيد تعيين الحقول
      if (name === 'qType') {
        // إعادة تعيين الحقول حسب نوع السؤال الجديد
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

      // إذا تغير نوع السؤال (questionType)، نحدث الـ tags تلقائياً
      if (name === 'questionType') {
        if (value === 'general') {
          // إزالة أي tags للولايات وإضافة 300-Fragen إذا كان provider هو Deutschland-in-Leben
          const filteredTags = prev.tags.filter(
            (tag) => !germanStates.includes(tag)
          );
          if (prev.provider === 'Deutschland-in-Leben' && !filteredTags.includes('300-Fragen')) {
            updated.tags = [...filteredTags, '300-Fragen'];
          } else {
            updated.tags = filteredTags;
          }
          updated.selectedState = '';
        } else if (value === 'state') {
          // إزالة 300-Fragen tag
          updated.tags = prev.tags.filter((tag) => tag !== '300-Fragen');
        }
      }

      // إذا تغيرت الولاية المختارة، نحدث الـ tags
      if (name === 'selectedState' && value) {
        // إزالة أي tags للولايات السابقة
        const filteredTags = prev.tags.filter(
          (tag) => !germanStates.includes(tag)
        );
        // إضافة الولاية الجديدة
        updated.tags = [...filteredTags, value];
      }

      // إذا تغير الـ provider، نحدث الـ tags بناءً على نوع السؤال
      if (name === 'provider') {
        if (prev.questionType === 'general') {
          // إزالة 300-Fragen tag
          const filteredTags = prev.tags.filter((tag) => tag !== '300-Fragen');
          // إضافة 300-Fragen فقط إذا كان provider هو Deutschland-in-Leben
          if (value === 'Deutschland-in-Leben') {
            updated.tags = [...filteredTags, '300-Fragen'];
          } else {
            updated.tags = filteredTags;
          }
        }
      }

      return updated;
    });
  };

  const handleAddOption = () => {
    // إضافة خيار فارغ جديد مباشرة
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }],
    }));
  };

  const handleRemoveOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateOption = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
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

  // Handlers for fill type
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

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('audio/')) {
        setError('الرجاء اختيار ملف صوتي فقط');
        return;
      }

      // التحقق من حجم الملف (50MB كحد أقصى)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError('حجم الملف كبير جداً. الحد الأقصى هو 50MB');
        return;
      }

      setAudioFile(file);
      setError('');

      // إنشاء معاينة صوتية
      const audioUrl = URL.createObjectURL(file);
      setAudioPreview(audioUrl);
    }
  };

  const handleRemoveAudio = () => {
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
    }
    setAudioFile(null);
    setAudioPreview(null);
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

    // التحقق حسب نوع السؤال
    if (formData.qType === 'mcq') {
      if (formData.options.length < 2) {
        setError('يجب إضافة خيارين على الأقل للأسئلة من نوع MCQ');
        return;
      }
      if (!formData.options.some((opt) => opt.isCorrect)) {
        setError('يجب تحديد إجابة صحيحة واحدة على الأقل للأسئلة من نوع MCQ');
        return;
      }
      const emptyOptions = formData.options.filter((opt) => !opt.text.trim());
      if (emptyOptions.length > 0) {
        setError('جميع الخيارات يجب أن تحتوي على نص');
        return;
      }
    } else if (formData.qType === 'fill') {
      if (!formData.fillExact.trim() && formData.regexList.length === 0) {
        setError('يجب إدخال الإجابة الصحيحة (fillExact) أو قائمة regex للأسئلة من نوع Fill');
        return;
      }
    } else if (formData.qType === 'match') {
      if (formData.answerKeyMatch.length < 2) {
        setError('يجب إضافة زوجين على الأقل للأسئلة من نوع Match');
        return;
      }
      const emptyPairs = formData.answerKeyMatch.filter(
        (pair) => !pair.left.trim() || !pair.right.trim()
      );
      if (emptyPairs.length > 0) {
        setError('جميع أزواج المطابقة يجب أن تحتوي على قيم');
        return;
      }
    } else if (formData.qType === 'reorder') {
      if (formData.answerKeyReorder.length < 2) {
        setError('يجب إضافة عنصرين على الأقل للأسئلة من نوع Reorder');
        return;
      }
      const emptyItems = formData.answerKeyReorder.filter((item) => !item.trim());
      if (emptyItems.length > 0) {
        setError('جميع عناصر إعادة الترتيب يجب أن تحتوي على نص');
        return;
      }
    }

    // التحقق من تحديد الولاية إذا كان السؤال لولاية معينة
    if (formData.questionType === 'state' && !formData.selectedState) {
      setError('يجب تحديد الولاية للسؤال الخاص بولاية معينة');
      return;
    }

    setLoading(true);

    try {
      let mediaData = null;

      // رفع الملف الصوتي إذا كان موجوداً
      if (audioFile) {
        setUploadingAudio(true);
        try {
          const uploadResult = await questionsAPI.uploadMedia(audioFile);
          mediaData = {
            type: 'audio',
            key: uploadResult.key,
            mime: uploadResult.mime,
          };
        } catch (uploadError) {
          console.error('Audio upload error:', uploadError);
          setError(
            uploadError.response?.data?.message ||
            uploadError.response?.data?.error ||
            'حدث خطأ أثناء رفع الملف الصوتي'
          );
          setLoading(false);
          setUploadingAudio(false);
          return;
        } finally {
          setUploadingAudio(false);
        }
      }

      // تحويل البيانات إلى التنسيق المطلوب من API
      const questionData = {
        prompt: formData.prompt,
        qType: formData.qType,
        provider: formData.provider,
        level: formData.level,
        tags: formData.tags,
        status: formData.status,
      };

      // إضافة الحقول حسب نوع السؤال
      if (formData.qType === 'mcq') {
        questionData.options = formData.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        }));
      } else if (formData.qType === 'true_false') {
        questionData.answerKeyBoolean = formData.answerKeyBoolean;
      } else if (formData.qType === 'fill') {
        if (formData.fillExact.trim()) {
          questionData.fillExact = formData.fillExact;
        }
        if (formData.regexList.length > 0) {
          questionData.regexList = formData.regexList.filter((regex) => regex.trim());
        }
      } else if (formData.qType === 'match') {
        questionData.answerKeyMatch = formData.answerKeyMatch.map((pair) => ({
          left: pair.left,
          right: pair.right,
        }));
      } else if (formData.qType === 'reorder') {
        questionData.answerKeyReorder = formData.answerKeyReorder.filter((item) => item.trim());
      }

      // إضافة section فقط إذا كان محدداً
      if (formData.section && formData.section.trim()) {
        questionData.section = formData.section;
      }

      // إضافة media إذا كان موجوداً
      if (mediaData) {
        questionData.media = mediaData;
      }

      await questionsAPI.create(questionData);
      setSuccess('تم إنشاء السؤال بنجاح!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
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
        setAudioFile(null);
        setAudioPreview(null);
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Create question error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء إنشاء السؤال'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-question-page">
      <div className="page-header">
        <button onClick={() => navigate('/admin')} className="back-btn">
          ← العودة للوحة التحكم
        </button>
        <h1>إنشاء سؤال جديد</h1>
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
              placeholder="أدخل نص السؤال..."
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

          {/* Options - MCQ only */}
          {formData.qType === 'mcq' && (
            <div className="form-group">
              <label>الخيارات *</label>
              {formData.options.map((option, index) => (
                <div key={index} className="option-item">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      handleUpdateOption(index, 'text', e.target.value)
                    }
                    placeholder={`الخيار ${index + 1}`}
                    className="option-input"
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) =>
                        handleUpdateOption(index, 'isCorrect', e.target.checked)
                      }
                    />
                    صحيح
                  </label>
                  {formData.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="remove-btn"
                    >
                      حذف
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="add-option-btn"
              >
                + إضافة خيار
              </button>
            </div>
          )}

          {/* True/False Answer */}
          {formData.qType === 'true_false' && (
            <div className="form-group">
              <label>الإجابة الصحيحة *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="answerKeyBoolean"
                    value="true"
                    checked={formData.answerKeyBoolean === true}
                    onChange={() => setFormData((prev) => ({ ...prev, answerKeyBoolean: true }))}
                  />
                  <span>صحيح (True)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="answerKeyBoolean"
                    value="false"
                    checked={formData.answerKeyBoolean === false}
                    onChange={() => setFormData((prev) => ({ ...prev, answerKeyBoolean: false }))}
                  />
                  <span>خطأ (False)</span>
                </label>
              </div>
            </div>
          )}

          {/* Fill Answer */}
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
                className="option-input"
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
                      className="option-input"
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
                  className="add-option-btn"
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
                    className="option-input"
                  />
                  <span style={{ margin: '0 8px' }}>↔</span>
                  <input
                    type="text"
                    value={pair.right}
                    onChange={(e) => handleUpdateMatchPair(index, 'right', e.target.value)}
                    placeholder={`اليمين ${index + 1}`}
                    className="option-input"
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
                className="add-option-btn"
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
                    className="option-input"
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
                className="add-option-btn"
              >
                + إضافة عنصر
              </button>
            </div>
          )}

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
            <label htmlFor="section">القسم (اختياري)</label>
            <select
              id="section"
              name="section"
              value={formData.section}
              onChange={handleInputChange}
            >
              <option value="">-- اختر القسم --</option>
              <option value="Hören">Hören (الاستماع)</option>
              <option value="Lesen">Lesen (القراءة)</option>
              <option value="Schreiben">Schreiben (الكتابة)</option>
              <option value="Sprechen">Sprechen (التحدث)</option>
            </select>
          </div>

          {/* Audio File Upload */}
          <div className="form-group">
            <label htmlFor="audioFile">ملف صوتي (اختياري)</label>
            {!audioFile ? (
              <div className="file-upload-container">
                <input
                  type="file"
                  id="audioFile"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="file-input"
                />
                <label htmlFor="audioFile" className="file-upload-label">
                  <span className="file-upload-icon">🎵</span>
                  <span>اختر ملف صوتي</span>
                </label>
                <p className="file-upload-hint">
                  الحد الأقصى: 50MB | الأنواع المدعومة: MP3, WAV, OGG, etc.
                </p>
              </div>
            ) : (
              <div className="audio-preview-container">
                <div className="audio-preview-info">
                  <span className="audio-icon">🎵</span>
                  <div className="audio-info">
                    <p className="audio-name">{audioFile.name}</p>
                    <p className="audio-size">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="remove-audio-btn"
                  >
                    ✕
                  </button>
                </div>
                {audioPreview && (
                  <audio controls className="audio-player">
                    <source src={audioPreview} type={audioFile.type} />
                    المتصفح لا يدعم تشغيل الملفات الصوتية
                  </audio>
                )}
              </div>
            )}
          </div>

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

          {/* Question Type (General or State-specific) */}
          <div className="form-group">
            <label>نوع السؤال *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="questionType"
                  value="general"
                  checked={formData.questionType === 'general'}
                  onChange={handleInputChange}
                />
                <span>سؤال عام</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="questionType"
                  value="state"
                  checked={formData.questionType === 'state'}
                  onChange={handleInputChange}
                />
                <span>سؤال خاص بولاية معينة</span>
              </label>
            </div>
          </div>

          {/* State Selection (only if state-specific) */}
          {formData.questionType === 'state' && (
            <div className="form-group">
              <label htmlFor="selectedState">الولاية *</label>
              <select
                id="selectedState"
                name="selectedState"
                value={formData.selectedState}
                onChange={handleInputChange}
                required
              >
                <option value="">-- اختر الولاية --</option>
                {germanStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div className="form-group">
            <label>الوسوم</label>
            <div className="tags-container">
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
              <div className="tag-input-container">
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
                  placeholder="أضف وسم..."
                  className="tag-input"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="add-tag-btn"
                >
                  إضافة
                </button>
              </div>
            </div>
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
              onClick={() => navigate('/admin')}
              className="cancel-btn"
            >
              إلغاء
            </button>
            <button type="submit" className="submit-btn" disabled={loading || uploadingAudio}>
              {uploadingAudio ? 'جاري رفع الملف...' : loading ? 'جاري الحفظ...' : 'حفظ السؤال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateQuestion;

