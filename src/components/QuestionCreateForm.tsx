import { useState, useEffect } from 'react';
import { examsAPI } from '../services/examsAPI';
import { questionsAPI } from '../services/questionsAPI';

// Types
interface ExamOption {
  _id?: string;
  id?: string;
  title: string;
  level?: string;
}

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface QuestionFormState {
  text: string;
  options: QuestionOption[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  status: 'draft' | 'published';
  tags: string;
  examId: string;
  sectionTitle: string;
  points: number;
}

type QuestionCreateFormProps = {
  apiBaseUrl: string;
  token: string;
};

const QuestionCreateForm = ({ apiBaseUrl, token }: QuestionCreateFormProps) => {
  // State
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<QuestionFormState>({
    text: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    explanation: '',
    difficulty: 'easy',
    level: 'A1',
    status: 'draft',
    tags: '',
    examId: '',
    sectionTitle: 'Grammar Section',
    points: 1,
  });

  // Fetch exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      setLoadingExams(true);
      setError('');
      try {
        // Try /exams?simple=true first, fallback to /exams if needed
        let response;
        try {
          response = await examsAPI.getAll({ simple: true });
        } catch (simpleError) {
          // If simple=true fails, try without it
          console.log('simple=true failed, trying without it...');
          response = await examsAPI.getAll();
        }
        
        // Handle response - could be array or object with items
        let examsArray: ExamOption[] = [];
        
        if (Array.isArray(response)) {
          // Direct array response (when simple=true works)
          examsArray = response;
        } else if (response && typeof response === 'object') {
          // Object response - check for items array
          if (Array.isArray(response.items)) {
            examsArray = response.items;
          } else if (Array.isArray(response.data)) {
            examsArray = response.data;
          }
        }
        
        console.log('Fetched exams:', examsArray.length, 'exams');
        setExams(examsArray);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || 
                           err?.response?.data?.error || 
                           (err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الامتحانات');
        setError(errorMessage);
        console.error('Error fetching exams:', err);
        // Ensure exams is always an array even on error
        setExams([]);
      } finally {
        setLoadingExams(false);
      }
    };

    fetchExams();
  }, []);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle option text change
  const handleOptionTextChange = (index: number, text: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? { ...opt, text } : opt)),
    }));
  };

  // Handle correct answer selection (radio button)
  const handleCorrectAnswerChange = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      })),
    }));
  };

  // Parse tags string to array
  const parseTags = (tagsString: string): string[] => {
    if (!tagsString.trim()) return [];
    return tagsString
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.text.trim()) {
      setError('نص السؤال مطلوب');
      return;
    }

    if (!formData.examId) {
      setError('يجب اختيار امتحان');
      return;
    }

    // Check if at least one option is correct
    const hasCorrectAnswer = formData.options.some((opt) => opt.isCorrect);
    if (!hasCorrectAnswer) {
      setError('يجب تحديد إجابة صحيحة واحدة على الأقل');
      return;
    }

    // Check if all options have text
    const emptyOptions = formData.options.filter((opt) => !opt.text.trim());
    if (emptyOptions.length > 0) {
      setError('جميع الخيارات يجب أن تحتوي على نص');
      return;
    }

    setLoading(true);

    try {
      const tagsArray = parseTags(formData.tags);

      const requestBody = {
        text: formData.text,
        options: formData.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
        explanation: formData.explanation,
        difficulty: formData.difficulty,
        level: formData.level,
        status: formData.status,
        tags: tagsArray,
        examId: formData.examId,
        sectionTitle: formData.sectionTitle,
        points: formData.points,
      };

      // Use the /questions/with-exam endpoint
      const response = await questionsAPI.createWithExam(requestBody);
      
      // Response format: { question: {...}, examId: "...", sectionTitle: "...", questionsCountInSection: 5 }
      console.log('Question created successfully:', response);
      setSuccess(`تم إنشاء السؤال بنجاح! (عدد الأسئلة في القسم: ${response.questionsCountInSection || 'N/A'})`);

      // Reset form after success
      setTimeout(() => {
        setFormData({
          text: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
          explanation: '',
          difficulty: 'easy',
          level: 'A1',
          status: 'draft',
          tags: '',
          examId: '',
          sectionTitle: 'Grammar Section',
          points: 1,
        });
        setSuccess('');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء السؤال';
      setError(errorMessage);
      console.error('Error creating question:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '24px' }}>إنشاء سؤال جديد</h1>

      {loadingExams && <p>جاري تحميل الامتحانات...</p>}
      {!loadingExams && exams.length > 0 && (
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          تم تحميل {exams.length} امتحان
        </p>
      )}
      {!loadingExams && exams.length === 0 && error === '' && (
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>
          لا توجد امتحانات متاحة
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Question Text */}
        <div>
          <label htmlFor="text" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            نص السؤال *
          </label>
          <textarea
            id="text"
            name="text"
            value={formData.text}
            onChange={handleInputChange}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
            placeholder="أدخل نص السؤال..."
          />
        </div>

        {/* Options */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            الخيارات *
          </label>
          {formData.options.map((option, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionTextChange(index, e.target.value)}
                placeholder={`الخيار ${index + 1}`}
                required
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={option.isCorrect}
                  onChange={() => handleCorrectAnswerChange(index)}
                />
                <span>صحيح</span>
              </label>
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div>
          <label htmlFor="explanation" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            الشرح
          </label>
          <textarea
            id="explanation"
            name="explanation"
            value={formData.explanation}
            onChange={handleInputChange}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
            placeholder="أدخل شرح الإجابة..."
          />
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            الصعوبة *
          </label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <option value="easy">سهل (Easy)</option>
            <option value="medium">متوسط (Medium)</option>
            <option value="hard">صعب (Hard)</option>
          </select>
        </div>

        {/* Level */}
        <div>
          <label htmlFor="level" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            المستوى *
          </label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            الحالة *
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <option value="draft">مسودة (Draft)</option>
            <option value="published">منشور (Published)</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            الوسوم
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            placeholder="مثال: grammar, verbs"
          />
          <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
            أدخل الوسوم مفصولة بفواصل (مثل: grammar, verbs)
          </small>
        </div>

        {/* Exam Selection */}
        <div>
          <label htmlFor="examId" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            الامتحان *
          </label>
          <select
            id="examId"
            name="examId"
            value={formData.examId}
            onChange={handleInputChange}
            required
            disabled={loadingExams}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <option value="">-- اختر الامتحان --</option>
            {Array.isArray(exams) && exams.map((exam) => {
              const examId = exam._id || exam.id || '';
              return (
                <option key={examId} value={examId}>
                  {exam.title} {exam.level ? `(${exam.level})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Section Title */}
        <div>
          <label htmlFor="sectionTitle" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            عنوان القسم
          </label>
          <input
            type="text"
            id="sectionTitle"
            name="sectionTitle"
            value={formData.sectionTitle}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            placeholder="Grammar Section"
          />
        </div>

        {/* Points */}
        <div>
          <label htmlFor="points" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            النقاط
          </label>
          <input
            type="number"
            id="points"
            name="points"
            value={formData.points}
            onChange={handleInputChange}
            min="1"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
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
              borderRadius: '4px',
              border: '1px solid #cfc',
            }}
          >
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || loadingExams}
          style={{
            padding: '12px 24px',
            backgroundColor: loading || loadingExams ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || loadingExams ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'جاري الحفظ...' : 'إنشاء السؤال'}
        </button>
      </form>
    </div>
  );
};

export default QuestionCreateForm;

