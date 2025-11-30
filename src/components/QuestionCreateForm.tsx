import { useState, useEffect } from 'react';
import { examsAPI } from '../services/examsAPI';
import { getGrammarTopics } from '../services/api';

// Types
interface GrammarTopic {
  _id: string;
  title: string;
  slug: string;
  level: string;
  tags: string[];
}

interface Section {
  section: string;
  skill?: string;
  teil?: number;
  quota: number;
  tags?: string[];
  difficultyDistribution?: {
    easy: number;
    med: number;
    hard: number;
  };
}

interface ExamFormState {
  // Common fields
  examType: 'grammar_exam' | 'provider_exam' | '';
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  duration: number; // in minutes
  status: 'draft' | 'published';
  description: string;
  tags: string;
  
  // Grammar Exam specific
  grammarTopic: string;
  grammarLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  totalQuestions: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTags: string;
  
  // Provider Exam specific
  provider: string;
  mainSkill: 'mixed' | 'hoeren' | 'lesen' | 'schreiben' | 'sprechen';
  sections: Section[];
}

const QuestionCreateForm = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [grammarTopics, setGrammarTopics] = useState<GrammarTopic[]>([]);

  const [formData, setFormData] = useState<ExamFormState>({
    examType: '',
    title: '',
    level: 'A1',
    duration: 60,
    status: 'draft',
    description: '',
    tags: '',
    
    // Grammar Exam
    grammarTopic: '',
    grammarLevel: 'A1',
    totalQuestions: 10,
    difficultyDistribution: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    questionTags: '',
    
    // Provider Exam
    provider: 'Goethe',
    mainSkill: 'mixed',
    sections: [],
  });

  // Fetch grammar topics when grammar level changes
  useEffect(() => {
    if (formData.examType === 'grammar_exam' && formData.grammarLevel) {
      const fetchTopics = async () => {
        setLoadingTopics(true);
        try {
          const data = await getGrammarTopics(formData.grammarLevel);
          setGrammarTopics(data.items || data || []);
        } catch (err) {
          console.error('Error fetching grammar topics:', err);
          setGrammarTopics([]);
        } finally {
          setLoadingTopics(false);
        }
      };
      fetchTopics();
    }
  }, [formData.examType, formData.grammarLevel]);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => {
      if (name.startsWith('difficulty.')) {
        const difficultyField = name.split('.')[1] as 'easy' | 'medium' | 'hard';
        return {
          ...prev,
          difficultyDistribution: {
            ...prev.difficultyDistribution,
            [difficultyField]: parseInt(value) || 0,
          },
        };
      }
      
      if (type === 'number') {
        return {
          ...prev,
          [name]: parseInt(value) || 0,
        };
      }
      
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  // Parse tags string to array
  const parseTags = (tagsString: string): string[] => {
    if (!tagsString.trim()) return [];
    return tagsString
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  // Handle section changes for Provider Exam
  const handleSectionChange = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  // Add new section for Provider Exam
  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          section: '',
          skill: prev.mainSkill !== 'mixed' ? prev.mainSkill : 'hoeren',
          teil: prev.sections.length + 1,
          quota: 5,
          tags: [],
        },
      ],
    }));
  };

  // Remove section
  const removeSection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.examType) {
      setError('يجب اختيار نوع الامتحان');
      return;
    }

    if (!formData.title.trim()) {
      setError('عنوان الامتحان مطلوب');
      return;
    }

    // Grammar Exam validation
    if (formData.examType === 'grammar_exam') {
      if (!formData.grammarTopic) {
        setError('يجب اختيار موضوع القواعد');
        return;
      }
      const totalDiff = 
        formData.difficultyDistribution.easy +
        formData.difficultyDistribution.medium +
        formData.difficultyDistribution.hard;
      if (totalDiff !== formData.totalQuestions) {
        setError(`توزيع الصعوبة يجب أن يساوي عدد الأسئلة الكلي (${formData.totalQuestions})`);
        return;
      }
    }

    // Provider Exam validation
    if (formData.examType === 'provider_exam') {
      if (formData.sections.length === 0) {
        setError('يجب إضافة قسم واحد على الأقل');
        return;
      }
      for (let i = 0; i < formData.sections.length; i++) {
        const section = formData.sections[i];
        if (!section.section.trim()) {
          setError(`عنوان القسم ${i + 1} مطلوب`);
          return;
        }
        if (section.quota <= 0) {
          setError(`عدد الأسئلة للقسم ${i + 1} يجب أن يكون أكبر من صفر`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const tagsArray = parseTags(formData.tags);
      const questionTagsArray = parseTags(formData.questionTags);

      // Build request body
      const requestBody: any = {
        title: formData.title,
        level: formData.level,
        timeLimitMin: formData.duration,
        status: formData.status,
        description: formData.description,
        tags: tagsArray,
        examCategory: formData.examType,
      };

      // Add Grammar Exam specific fields
      if (formData.examType === 'grammar_exam') {
        const selectedTopic = grammarTopics.find(t => t.slug === formData.grammarTopic);
        requestBody.provider = 'Grammatik';
        requestBody.grammarTopic = formData.grammarTopic;
        requestBody.grammarTopicTitle = selectedTopic?.title || '';
        requestBody.grammarLevel = formData.grammarLevel;
        requestBody.totalQuestions = formData.totalQuestions;
        requestBody.difficultyDistribution = {
          easy: formData.difficultyDistribution.easy,
          medium: formData.difficultyDistribution.medium, // API uses 'medium' not 'med'
          hard: formData.difficultyDistribution.hard,
        };
        requestBody.questionTags = questionTagsArray.length > 0 ? questionTagsArray : (selectedTopic?.tags || []);
        requestBody.randomizeQuestions = true;
      }

      // Add Provider Exam specific fields
      if (formData.examType === 'provider_exam') {
        requestBody.provider = formData.provider;
        requestBody.mainSkill = formData.mainSkill;
        requestBody.sections = formData.sections.map(section => ({
          name: section.section, // API uses 'name' not 'section'
          section: section.section, // Keep both for compatibility
          skill: (section.skill || formData.mainSkill).toUpperCase(), // Convert to uppercase
          teilNumber: section.teil,
          quota: section.quota,
          tags: section.tags || [],
          difficultyDistribution: section.difficultyDistribution || {
            easy: 0,
            medium: 0, // API uses 'medium' not 'med'
            hard: 0,
          },
        }));
        requestBody.randomizeQuestions = true;
      }

      // Create exam
      const response = await examsAPI.create(requestBody);
      
      console.log('Exam created successfully:', response);
      setSuccess(`تم إنشاء الامتحان بنجاح! (ID: ${response._id || response.id})`);

      // Reset form after success
      setTimeout(() => {
        setFormData({
          examType: '',
          title: '',
          level: 'A1',
          duration: 60,
          status: 'draft',
          description: '',
          tags: '',
          grammarTopic: '',
          grammarLevel: 'A1',
          totalQuestions: 10,
          difficultyDistribution: {
            easy: 0,
            medium: 0,
            hard: 0,
          },
          questionTags: '',
          provider: 'Goethe',
          mainSkill: 'mixed',
          sections: [],
        });
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          (err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الامتحان');
      setError(errorMessage);
      console.error('Error creating exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const formStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  };

  const sectionStyle = {
    marginBottom: '32px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
  };

  return (
    <div style={formStyle}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>
        إنشاء امتحان جديد
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Exam Type - في الأعلى */}
        <div style={sectionStyle}>
          <label htmlFor="examType" style={labelStyle}>
            نوع الامتحان / Exam Type *
          </label>
          <select
            id="examType"
            name="examType"
            value={formData.examType}
            onChange={handleInputChange}
            required
            style={inputStyle}
          >
            <option value="">-- اختر نوع الامتحان --</option>
            <option value="grammar_exam">Grammar Exam (قواعد)</option>
            <option value="provider_exam">Provider Exam (Prüfungen – Goethe/TELC…)</option>
          </select>
        </div>

        {/* Common Fields */}
        <div style={sectionStyle}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
            المعلومات الأساسية
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Title */}
            <div>
              <label htmlFor="title" style={labelStyle}>
                عنوان الامتحان / Exam Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                style={inputStyle}
                placeholder="مثال: امتحان القواعد - Akkusativ"
              />
            </div>

            {/* Level */}
            <div>
              <label htmlFor="level" style={labelStyle}>
                المستوى / Level *
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                required
                style={inputStyle}
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" style={labelStyle}>
                المدة بالدقائق / Duration (minutes) *
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="1"
                style={inputStyle}
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" style={labelStyle}>
                الحالة / Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                style={inputStyle}
              >
                <option value="draft">مسودة (Draft)</option>
                <option value="published">منشور (Published)</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" style={labelStyle}>
                الوصف / Description (اختياري)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                style={inputStyle}
                placeholder="وصف مختصر للامتحان..."
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" style={labelStyle}>
                الوسوم / Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="مثال: grammar, test, exam"
              />
              <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                أدخل الوسوم مفصولة بفواصل
              </small>
            </div>
          </div>
        </div>

        {/* Grammar Exam Settings */}
        {formData.examType === 'grammar_exam' && (
          <div style={sectionStyle}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
              إعدادات امتحان القواعد
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Grammar Level */}
              <div>
                <label htmlFor="grammarLevel" style={labelStyle}>
                  مستوى القواعد / Grammar Level *
                </label>
                <select
                  id="grammarLevel"
                  name="grammarLevel"
                  value={formData.grammarLevel}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                >
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>

              {/* Grammar Topic */}
              <div>
                <label htmlFor="grammarTopic" style={labelStyle}>
                  موضوع القواعد / Grammar Topic *
                </label>
                {loadingTopics ? (
                  <p style={{ color: '#6b7280' }}>جاري تحميل المواضيع...</p>
                ) : (
                  <select
                    id="grammarTopic"
                    name="grammarTopic"
                    value={formData.grammarTopic}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                  >
                    <option value="">-- اختر الموضوع --</option>
                    {grammarTopics.map((topic) => (
                      <option key={topic._id} value={topic.slug}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Total Questions */}
              <div>
                <label htmlFor="totalQuestions" style={labelStyle}>
                  عدد الأسئلة الكلي / Total Questions *
                </label>
                <input
                  type="number"
                  id="totalQuestions"
                  name="totalQuestions"
                  value={formData.totalQuestions}
                  onChange={handleInputChange}
                  required
                  min="1"
                  style={inputStyle}
                />
              </div>

              {/* Difficulty Distribution */}
              <div>
                <label style={labelStyle}>
                  توزيع الصعوبة / Difficulty Distribution *
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#6b7280' }}>سهل (Easy)</label>
                    <input
                      type="number"
                      name="difficulty.easy"
                      value={formData.difficultyDistribution.easy}
                      onChange={handleInputChange}
                      min="0"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#6b7280' }}>متوسط (Medium)</label>
                    <input
                      type="number"
                      name="difficulty.medium"
                      value={formData.difficultyDistribution.medium}
                      onChange={handleInputChange}
                      min="0"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#6b7280' }}>صعب (Hard)</label>
                    <input
                      type="number"
                      name="difficulty.hard"
                      value={formData.difficultyDistribution.hard}
                      onChange={handleInputChange}
                      min="0"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                  المجموع يجب أن يساوي {formData.totalQuestions}
                </small>
              </div>

              {/* Question Tags */}
              <div>
                <label htmlFor="questionTags" style={labelStyle}>
                  وسوم الأسئلة / Question Tags
                </label>
                <input
                  type="text"
                  id="questionTags"
                  name="questionTags"
                  value={formData.questionTags}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="مثال: akkusativ, cases (سيتم استخدام وسوم الموضوع تلقائياً إذا تركت فارغاً)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Provider Exam Settings */}
        {formData.examType === 'provider_exam' && (
          <div style={sectionStyle}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
              إعدادات امتحان المعهد الرسمي (Prüfungen)
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Provider */}
              <div>
                <label htmlFor="provider" style={labelStyle}>
                  المعهد / Provider *
                </label>
                <select
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                >
                  <option value="Goethe">Goethe</option>
                  <option value="telc">TELC</option>
                  <option value="ÖSD">ÖSD</option>
                  <option value="ECL">ECL</option>
                  <option value="DTB">DTB</option>
                  <option value="DTZ">DTZ</option>
                </select>
              </div>

              {/* Main Skill */}
              <div>
                <label htmlFor="mainSkill" style={labelStyle}>
                  نوع التمرين / Main Skill *
                </label>
                <select
                  id="mainSkill"
                  name="mainSkill"
                  value={formData.mainSkill}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                >
                  <option value="mixed">Mixed (امتحان كامل كل المهارات)</option>
                  <option value="hoeren">Hören (الاستماع)</option>
                  <option value="lesen">Lesen (القراءة)</option>
                  <option value="schreiben">Schreiben (الكتابة)</option>
                  <option value="sprechen">Sprechen (التحدث)</option>
                </select>
              </div>

              {/* Sections */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={labelStyle}>
                    الأقسام / Sections *
                  </label>
                  <button
                    type="button"
                    onClick={addSection}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    + إضافة Section
                  </button>
                </div>

                {formData.sections.map((section, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Section {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        حذف
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>عنوان القسم / Section Title *</label>
                        <input
                          type="text"
                          value={section.section}
                          onChange={(e) => handleSectionChange(index, 'section', e.target.value)}
                          placeholder="مثال: Hören – Teil 1"
                          style={inputStyle}
                        />
                      </div>

                      {formData.mainSkill === 'mixed' && (
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>المهارة / Skill *</label>
                          <select
                            value={section.skill || formData.mainSkill}
                            onChange={(e) => handleSectionChange(index, 'skill', e.target.value)}
                            required
                            style={inputStyle}
                          >
                            <option value="hoeren">Hören</option>
                            <option value="lesen">Lesen</option>
                            <option value="schreiben">Schreiben</option>
                            <option value="sprechen">Sprechen</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>رقم Teil</label>
                        <input
                          type="number"
                          value={section.teil || index + 1}
                          onChange={(e) => handleSectionChange(index, 'teil', parseInt(e.target.value) || index + 1)}
                          min="1"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>عدد الأسئلة / Quota *</label>
                        <input
                          type="number"
                          value={section.quota}
                          onChange={(e) => handleSectionChange(index, 'quota', parseInt(e.target.value) || 0)}
                          min="1"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {formData.sections.length === 0 && (
                  <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                    لا توجد أقسام. اضغط "إضافة Section" لإضافة قسم جديد.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '6px',
              border: '1px solid #fcc',
            }}
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#efe',
              color: '#3c3',
              borderRadius: '6px',
              border: '1px solid #cfc',
            }}
          >
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.examType}
          style={{
            padding: '12px 24px',
            backgroundColor: loading || !formData.examType ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || !formData.examType ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'جاري الحفظ...' : 'إنشاء الامتحان'}
        </button>
      </form>
    </div>
  );
};

export default QuestionCreateForm;
