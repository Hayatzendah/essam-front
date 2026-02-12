import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsAPI } from '../services/examsAPI';
import { getGrammarTopics, createGrammarTopic, getSchreibenTasks } from '../services/api';
// Enum Mappings
const PROVIDER_OPTIONS = [
  { label: 'Goethe', value: 'goethe' },
  { label: 'TELC', value: 'telc' },
  { label: 'ÖSD', value: 'osd' },
  { label: 'ECL', value: 'ecl' },
  { label: 'DTB', value: 'dtb' },
  { label: 'DTZ', value: 'dtz' },
  { label: 'Deutschland in Leben Test', value: 'leben_in_deutschland' },
];

const MAIN_SKILL_OPTIONS = [
  { label: 'Mixed (امتحان كامل كل المهارات)', value: 'mixed' },
  { label: 'Hören (الاستماع)', value: 'hoeren' },
  { label: 'Lesen (القراءة)', value: 'lesen' },
  { label: 'Schreiben (الكتابة)', value: 'schreiben' },
  { label: 'Sprechen (التحدث)', value: 'sprechen' },
  { label: 'Life Test / Leben in Deutschland', value: 'leben_test' },
];

// Skills for sections (without mixed and leben_test)
const SKILLS = [
  { value: 'hoeren', label: 'Hören' },
  { value: 'lesen', label: 'Lesen' },
  { value: 'schreiben', label: 'Schreiben' },
  { value: 'sprechen', label: 'Sprechen' },
  { value: 'misc', label: 'Sonstiges' },
];

// Types
interface GrammarTopic {
  _id: string;
  title: string;
  slug: string;
  level: string;
  shortDescription?: string;
  tags: string[];
}

interface SchreibenTask {
  _id: string;
  title: string;
  level: string;
  provider?: string;
  status: string;
  position?: number;
}

interface Section {
  section: string;
  name?: string; // للـ Leben exam
  title?: string; // للـ Leben exam
  skill?: string;
  teil?: number;
  teilNumber?: number; // ✅ إضافة teilNumber للتوافق مع DTO
  quota?: number;
  tags?: string[];
  description?: string; // نص القراءة - يظهر فقط لـ Lesen
  difficultyDistribution?: {
    easy: number;
    med: number;
    medium?: number; // ✅ إضافة medium للتوافق مع DTO
    hard: number;
  };
}

interface ExamFormState {
  // Common fields
  examType: 'grammar_exam' | 'provider_exam' | 'leben_exam' | '';
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  duration: number | ''; // in minutes (optional)
  status: 'draft' | 'published';
  description: string;
  tags: string;
  
  // Grammar Exam specific
  grammarTopicId: string;
  grammarLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  totalQuestions: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTags: string;

  // Schreiben Exam specific
  schreibenTaskId: string;
  schreibenMode: 'task' | 'sections';

  // Provider Exam specific
  provider: string;
  mainSkill: 'mixed' | 'hoeren' | 'lesen' | 'schreiben' | 'sprechen' | 'leben_test';
  sections: Section[];
  hasSections: boolean; // toggle لإلغاء sections لامتحان Leben
}

interface QuestionCreateFormProps {
  examId?: string; // إذا كان موجوداً، يعمل في وضع التعديل
}

const QuestionCreateForm = ({ examId }: QuestionCreateFormProps = {}) => {
  const navigate = useNavigate();
  const isEditMode = !!examId;
  
  // State
  const [loading, setLoading] = useState(false);
  const [loadingExam, setLoadingExam] = useState(isEditMode);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingSchreibenTasks, setLoadingSchreibenTasks] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [grammarTopics, setGrammarTopics] = useState<GrammarTopic[]>([]);
  const [schreibenTasks, setSchreibenTasks] = useState<SchreibenTask[]>([]);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [newTopicData, setNewTopicData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    tags: '',
  });
  
  // ✅ حفظ البيانات الأصلية في وضع التعديل لتتبع التغييرات
  const [originalExamData, setOriginalExamData] = useState<any>(null);
  
  // ✅ Safe integer function - sanitize teil وquota
  const safeInt1 = (v: any): number => {
    const n = Number.parseInt(String(v ?? ''), 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  };
  
  // تم إزالة state الصوت من القسم - الصوت يُدار الآن من فورم السؤال

  const [formData, setFormData] = useState<ExamFormState>({
    examType: '',
    title: '',
    level: 'A1',
    duration: '',
    status: 'draft',
    description: '',
    tags: '',
    
    // Grammar Exam
    grammarTopicId: '',
    grammarLevel: 'A1',
    totalQuestions: 10,
    difficultyDistribution: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    questionTags: '',

    // Schreiben Exam
    schreibenTaskId: '',
    schreibenMode: 'task' as 'task' | 'sections',

    // Provider Exam
    provider: 'goethe', // enum value
    mainSkill: 'mixed',
    sections: [],
    hasSections: true, // افتراضي: يحتوي على sections
  });

  // Initialize Leben exam with default section if needed
  useEffect(() => {
    if (formData.examType === 'leben_exam' && formData.sections.length === 0) {
      setFormData((prev) => ({
        ...prev,
        sections: [
          {
            section: 'Leben in Deutschland – Teil 1',
            name: 'Leben in Deutschland – Teil 1',
            title: 'Leben in Deutschland – Teil 1',
            teil: 1,
            quota: 33,
          },
        ],
      }));
    }
    
    // Reset grammar level manual change flag when exam type changes
    if (formData.examType === 'grammar_exam') {
      setGrammarLevelManuallyChanged(false);
      // Initialize grammarLevel from main level when switching to grammar_exam
      setFormData((prev) => ({
        ...prev,
        grammarLevel: prev.level,
        grammarTopicId: '', // Reset topic selection
      }));
    }
  }, [formData.examType]);

  // Load exam data if in edit mode
  useEffect(() => {
    if (isEditMode && examId) {
      const loadExam = async () => {
        try {
          setLoadingExam(true);
          setError('');
          const exam = await examsAPI.getById(examId);
          
          // Determine exam type from examCategory or provider
          let examType: 'grammar_exam' | 'provider_exam' | 'leben_exam' | '' = '';
          if (exam.examCategory === 'grammar_exam' || exam.provider === 'Grammatik') {
            examType = 'grammar_exam';
          } else if (exam.examCategory === 'leben_exam' || exam.provider === 'leben_in_deutschland' || exam.mainSkill === 'leben_test') {
            examType = 'leben_exam';
          } else if (exam.provider && exam.provider !== 'Grammatik' && exam.provider !== 'leben_in_deutschland') {
            examType = 'provider_exam';
          }
          
          // Map provider to enum value
          let providerValue = exam.provider?.toLowerCase() || 'goethe';
          if (providerValue === 'leben in deutschland' || providerValue === 'leben_in_deutschland') {
            providerValue = 'leben_in_deutschland';
          }
          
          // Map sections
          const sections = (exam.sections || []).map((section: any) => {
            if (examType === 'leben_exam') {
              return {
                section: section.name || section.section || section.title || '',
                name: section.name || section.section || section.title || '',
                title: section.title || section.name || section.section || '',
                teil: section.teil || section.teilNumber || 1,
                quota: section.quota || 0,
              };
            } else {
              const skill = section.skill?.toLowerCase() || exam.mainSkill?.toLowerCase() || 'hoeren';
              const validSkill = SKILLS.find(s => s.value === skill) ? skill : 'hoeren';
              
              return {
                section: section.name || section.section || section.title || '',
                title: section.title || section.name || section.section || '',
                skill: validSkill,
                teil: section.teilNumber || section.teil || 1,
                teilNumber: section.teilNumber || section.teil || 1,
                quota: section.quota || 0,
                tags: section.tags || [],
                description: section.description || '',
                difficultyDistribution: section.difficultyDistribution ? {
                  easy: section.difficultyDistribution.easy || 0,
                  med: section.difficultyDistribution.med || section.difficultyDistribution.medium || 0,
                  medium: section.difficultyDistribution.medium || section.difficultyDistribution.med || 0,
                  hard: section.difficultyDistribution.hard || 0,
                } : {
                  easy: 0,
                  med: 0,
                  medium: 0,
                  hard: 0,
                },
              };
            }
          });
          
          const loadedFormData = {
            examType: examType,
            title: exam.title || '',
            level: (exam.level || 'A1') as any,
            duration: exam.timeLimitMin || '',
            status: (exam.status || 'draft') as any,
            description: exam.description || '',
            tags: Array.isArray(exam.tags) ? exam.tags.join(', ') : (exam.tags || ''),
            
            // Grammar Exam
            grammarTopicId: exam.grammarTopicId || exam.grammarTopic || '',
            grammarLevel: (exam.grammarLevel || exam.level || 'A1') as any,
            totalQuestions: exam.totalQuestions || 10,
            difficultyDistribution: exam.difficultyDistribution ? {
              easy: exam.difficultyDistribution.easy || 0,
              medium: exam.difficultyDistribution.medium || exam.difficultyDistribution.med || 0,
              hard: exam.difficultyDistribution.hard || 0,
            } : {
              easy: 0,
              medium: 0,
              hard: 0,
            },
            questionTags: Array.isArray(exam.questionTags) ? exam.questionTags.join(', ') : (exam.questionTags || ''),
            
            // Schreiben Exam
            schreibenTaskId: exam.schreibenTaskId || '',
            schreibenMode: (exam.schreibenTaskId ? 'task' : (sections.length > 0 ? 'sections' : 'task')) as 'task' | 'sections',

            // Provider Exam
            provider: providerValue,
            mainSkill: (exam.mainSkill?.toLowerCase() || 'mixed') as any,
            sections: sections,
            hasSections: sections.length > 0 || (exam.mainSkill === 'schreiben' && !exam.schreibenTaskId && sections.length > 0),
          };
          
          setFormData(loadedFormData);
          
          // ✅ حفظ البيانات الأصلية لتتبع التغييرات
          setOriginalExamData({
            ...loadedFormData,
            sections: JSON.parse(JSON.stringify(sections)), // Deep copy
          });
          
          // Load grammar topics if grammar exam
          if (examType === 'grammar_exam' && exam.grammarLevel) {
            const fetchTopics = async () => {
              setLoadingTopics(true);
              try {
                const data = await getGrammarTopics(exam.grammarLevel);
                setGrammarTopics(data.items || data || []);
              } catch (err) {
                console.error('Error fetching grammar topics:', err);
                setGrammarTopics([]);
              } finally {
                setLoadingTopics(false);
              }
            };
            fetchTopics();
            // Mark grammarLevel as manually changed in edit mode to prevent auto-sync
            setGrammarLevelManuallyChanged(true);
          }
        } catch (err: any) {
          console.error('Error loading exam:', err);
          setError(
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            'حدث خطأ أثناء تحميل الامتحان'
          );
        } finally {
          setLoadingExam(false);
        }
      };
      loadExam();
    }
  }, [isEditMode, examId]);

  // Sync grammarLevel with main level field when level changes (only if grammarLevel wasn't manually changed)
  const [grammarLevelManuallyChanged, setGrammarLevelManuallyChanged] = useState(false);
  
  useEffect(() => {
    if (formData.examType === 'grammar_exam' && !grammarLevelManuallyChanged) {
      setFormData((prev) => ({
        ...prev,
        grammarLevel: prev.level,
        grammarTopicId: '', // Reset topic selection when level changes
      }));
    }
  }, [formData.level, formData.examType, grammarLevelManuallyChanged]);

  // Fetch grammar topics when grammar level changes
  useEffect(() => {
    if (formData.examType === 'grammar_exam' && formData.grammarLevel) {
      const fetchTopics = async () => {
        setLoadingTopics(true);
        setError(''); // Clear any previous errors
        try {
          const data = await getGrammarTopics(formData.grammarLevel as any);
          const topics = Array.isArray(data) ? data : (data?.items || data?.topics || []);
          setGrammarTopics(topics);
          console.log('✅ Grammar topics loaded:', topics.length, 'topics');
        } catch (err: any) {
          console.error('❌ Error fetching grammar topics:', err);
          setGrammarTopics([]);
          setError(err?.response?.data?.message || 'حدث خطأ أثناء تحميل مواضيع القواعد');
        } finally {
          setLoadingTopics(false);
        }
      };
      fetchTopics();
    } else if (formData.examType !== 'grammar_exam') {
      // Clear topics when switching away from grammar exam
      setGrammarTopics([]);
    }
  }, [formData.examType, formData.grammarLevel]);

  // Fetch Schreiben tasks when mainSkill is 'schreiben'
  useEffect(() => {
    if (formData.examType === 'provider_exam' && formData.mainSkill === 'schreiben') {
      const fetchSchreibenTasks = async () => {
        setLoadingSchreibenTasks(true);
        setError('');
        try {
          const data = await getSchreibenTasks({ level: formData.level, status: 'published' });
          const tasks = Array.isArray(data) ? data : (data?.items || data?.tasks || []);
          setSchreibenTasks(tasks);
          console.log('✅ Schreiben tasks loaded:', tasks.length, 'tasks');
        } catch (err: any) {
          console.error('❌ Error fetching Schreiben tasks:', err);
          setSchreibenTasks([]);
          setError(err?.response?.data?.message || 'حدث خطأ أثناء تحميل مهام الكتابة');
        } finally {
          setLoadingSchreibenTasks(false);
        }
      };
      fetchSchreibenTasks();
    } else if (formData.mainSkill !== 'schreiben') {
      // Clear tasks when switching away from schreiben
      setSchreibenTasks([]);
    }
  }, [formData.examType, formData.mainSkill, formData.level]);

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
      
      // Handle grammarTopicId selection - auto-fill title, description, and questionTags
      if (name === 'grammarTopicId' && value) {
        const selectedTopic = grammarTopics.find(t => t._id === value);
        console.log('📝 Grammar topic selected:', selectedTopic);
        const updated: ExamFormState = {
          ...prev,
          grammarTopicId: value,
        };
        
        // Auto-fill title if empty
        if (selectedTopic && !prev.title.trim()) {
          updated.title = selectedTopic.title;
          console.log('✅ Auto-filled title:', selectedTopic.title);
        }
        
        // Auto-fill description if empty
        if (selectedTopic && selectedTopic.shortDescription && !prev.description.trim()) {
          updated.description = selectedTopic.shortDescription;
          console.log('✅ Auto-filled description:', selectedTopic.shortDescription);
        }
        
        // Auto-fill questionTags if empty
        if (selectedTopic && selectedTopic.tags && selectedTopic.tags.length > 0 && !prev.questionTags.trim()) {
          updated.questionTags = selectedTopic.tags.join(', ');
          console.log('✅ Auto-filled questionTags:', updated.questionTags);
        }
        
        return updated;
      }
      
      // Track manual grammarLevel changes and reset topic selection
      if (name === 'grammarLevel') {
        setGrammarLevelManuallyChanged(true);
        return {
          ...prev,
          grammarLevel: value as any,
          grammarTopicId: '', // Reset topic when level changes manually
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

  // Add new section for Provider Exam or Leben Exam
  const addSection = () => {
    setFormData((prev) => {
      if (prev.examType === 'leben_exam') {
        // Leben exam section
        return {
          ...prev,
          sections: [
            ...prev.sections,
            {
              section: '',
              name: '',
              title: '',
              teil: prev.sections.length + 1,
              quota: 33,
            },
          ],
        };
      } else {
        // Provider exam section
        return {
          ...prev,
          sections: [
            ...prev.sections,
            {
              section: '',
              skill: prev.mainSkill !== 'mixed' ? prev.mainSkill : 'hoeren',
              teil: prev.sections.length + 1,
              quota: 5,
              tags: [],
              description: '', // نص القراءة - يستخدم مع Lesen
            },
          ],
        };
      }
    });
  };

  // Remove section
  const removeSection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  // تم إزالة handlers الصوت من القسم - الصوت يُدار الآن من فورم السؤال

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 handleSubmit called', {
      examType: formData.examType,
      loading,
      title: formData.title,
      isEditMode
    });
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
      if (!formData.grammarTopicId) {
        setError('يجب اختيار موضوع القواعد');
        return;
      }
    }

    // Provider Exam validation
    if (formData.examType === 'provider_exam') {
      if (formData.mainSkill === 'schreiben') {
        if (formData.schreibenMode === 'task') {
          // مهمة كتابة: نحتاج schreibenTaskId
          if (!formData.schreibenTaskId) {
            setError('يجب اختيار مهمة الكتابة');
            return;
          }
        } else {
          // سكاشن مع أسئلة: نحتاج sections
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
          }
        }
      } else if (formData.mainSkill !== 'leben_test') {
        // للمهارات الأخرى: نحتاج sections
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
        }
      }
    }

    // Leben Exam validation
    if (formData.examType === 'leben_exam') {
      if (formData.sections.length === 0) {
        setError('يجب إضافة قسم واحد على الأقل');
        return;
      }
      for (let i = 0; i < formData.sections.length; i++) {
        const section = formData.sections[i];
        const sectionName = section.name || section.section;
        const sectionTitle = section.title || section.section;
        if (!sectionName?.trim()) {
          setError(`Section Name للقسم ${i + 1} مطلوب`);
          return;
        }
        if (!sectionTitle?.trim()) {
          setError(`Section Title للقسم ${i + 1} مطلوب`);
          return;
        }
        // ✅ Fix: التحقق من teil أو teilNumber
        const teilValue = section.teil ?? section.teilNumber ?? 1;
        if (!teilValue || teilValue < 1) {
          setError(`Teil للقسم ${i + 1} يجب أن يكون أكبر من صفر`);
          return;
        }
        if ((section.quota ?? 0) <= 0) {
          setError(`عدد الأسئلة للقسم ${i + 1} يجب أن يكون أكبر من صفر`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const tagsArray = parseTags(formData.tags);
      const questionTagsArray = parseTags(formData.questionTags);

      // Build request body according to contract
      const payload: any = {
        title: formData.title.trim(),
        level: formData.level,
        ...(formData.duration !== '' && formData.duration !== null && formData.duration !== undefined ? { 
          timeLimitMin: Math.max(1, parseInt(String(formData.duration), 10) || 1) 
        } : {}),
        status: formData.status,
        description: formData.description?.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        examCategory: formData.examType,
        randomizeQuestions: true, // Default to true
      };
      
      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      // Add Grammar Exam specific fields
      if (formData.examType === 'grammar_exam') {
        const selectedTopic = grammarTopics.find(t => t._id === formData.grammarTopicId);
        payload.provider = 'Grammatik';
        payload.grammarTopicId = formData.grammarTopicId;
        payload.grammarLevel = formData.grammarLevel;
        payload.totalQuestions = formData.totalQuestions;
        payload.questionTags = questionTagsArray.length > 0 ? questionTagsArray : (selectedTopic?.tags || []);
        payload.randomizeQuestions = true;
      }

      // Add Provider Exam specific fields
      if (formData.examType === 'provider_exam') {
        // ✅ Fix: provider يجب أن يكون lowercase
        payload.provider = (formData.provider || 'goethe').toLowerCase();
        payload.mainSkill = formData.mainSkill; // بالفعل enum value
        
        // لامتحان Leben Test: لا نرسل sections
        if (formData.provider === 'leben_in_deutschland' || formData.mainSkill === 'leben_test') {
          // لا نرسل sections - الباك سيسحب الأسئلة تلقائياً
          payload.examType = 'leben_test';
        } else if (formData.mainSkill === 'schreiben' && formData.schreibenMode === 'task' && formData.schreibenTaskId) {
          // لامتحان الكتابة (مهمة): نرسل schreibenTaskId بدل sections
          payload.schreibenTaskId = formData.schreibenTaskId;
          // لا نرسل sections للكتابة
        } else if (formData.hasSections && formData.sections.length > 0) {
          // Filter out empty sections and build payload according to contract
          const validSections = formData.sections
            .filter((s) => {
              const title = (s.section || s.title || '').trim();
              return title.length > 0;
            })
            .map((s, index) => {
              const title = (s.section || s.title || '').trim();
              const skill = (s.skill || formData.mainSkill || 'hoeren').toLowerCase();
              
              // Ensure skill is valid
              const validSkill = SKILLS.find(sk => sk.value === skill) ? skill : 'hoeren';
              
              const sectionPayload: any = {
                name: s.name || title, // ✅ name مطلوب إجباريًا (مش title)
                skill: validSkill, // ✅ skill مطلوب
                teil: safeInt1(s.teil ?? s.teilNumber ?? index + 1), // ✅ teil (مش teilNumber) - Number >= 1
                quota: safeInt1(s.quota ?? 1), // ✅ quota مطلوب - Number >= 1
              };
              
              // الصوت يُدار من فورم السؤال - لا نرسل listeningAudioId هنا
              
              // ✅ إضافة tags إذا كانت موجودة
              if (s.tags && s.tags.length > 0) {
                sectionPayload.tags = s.tags;
              }
              
              // Add difficultyDistribution only if it exists and has values
              if (s.difficultyDistribution) {
                const { easy = 0, med = 0, medium = 0, hard = 0 } = s.difficultyDistribution;
                const medValue = med || medium;
                if (easy > 0 || medValue > 0 || hard > 0) {
                  sectionPayload.difficultyDistribution = {
                    easy: Number(easy) || 0,
                    medium: Number(medValue) || 0,
                    hard: Number(hard) || 0,
                  };
                }
              }
              
              return sectionPayload;
            });
          
          if (validSections.length > 0) {
            payload.sections = validSections;
            console.log('📤 Sections payload:', JSON.stringify(validSections, null, 2));
          }
        }
        payload.randomizeQuestions = true;
      }

      // Add Leben Exam specific fields
      if (formData.examType === 'leben_exam') {
        payload.provider = 'leben_in_deutschland'; // enum value (lowercase)
        payload.mainSkill = 'leben_test'; // enum value
        payload.examType = 'leben_test';
        payload.examCategory = 'leben_exam';
        // ✅ Fix: إرسال sections من formData - فقط الحقول المسموحة في DTO
        payload.sections = formData.sections.map((section, index) => {
          const sectionPayload: any = {
            name: section.name || section.section || '',
            teil: safeInt1(section.teil ?? section.teilNumber ?? index + 1), // ✅ teil (مش teilNumber) - Number >= 1
            quota: safeInt1(section.quota ?? 1), // ✅ quota - Number >= 1
          };
          
          // ✅ إضافة title فقط إذا كان موجوداً (لـ Leben exam)
          if (section.title?.trim()) {
            sectionPayload.title = section.title.trim();
          }
          
          // ✅ إضافة tags إذا كانت موجودة
          if (section.tags && section.tags.length > 0) {
            sectionPayload.tags = section.tags;
          }
          
          // ✅ إضافة difficultyDistribution إذا كانت موجودة
          if (section.difficultyDistribution) {
            const { easy = 0, med = 0, medium = 0, hard = 0 } = section.difficultyDistribution;
            const medValue = med || medium;
            if (easy > 0 || medValue > 0 || hard > 0) {
              sectionPayload.difficultyDistribution = {
                easy: Number(easy) || 0,
                medium: Number(medValue) || 0,
                hard: Number(hard) || 0,
              };
            }
          }
          
          // ❌ لا نرسل: teilNumber, listeningAudioId, listeningAudioUrl, description
          
          return sectionPayload;
        });
        payload.randomizeQuestions = true;
      }

      // Create or update exam
      let response;
      if (isEditMode && examId) {
        // ✅ الحل الفوري: في وضع التعديل، لا نرسل sections نهائياً إلا إذا تم تعديلها فعلياً
        let finalPayload = { ...payload };
        
        if (originalExamData) {
          // مقارنة sections لتحديد إذا تم تعديلها
          const sectionsChanged = JSON.stringify(formData.sections) !== JSON.stringify(originalExamData.sections);
          
          if (!sectionsChanged) {
            // ✅ لم يتم تعديل sections - لا نرسلها في PATCH نهائياً
            delete finalPayload.sections;
            console.log('✅ Sections لم تتغير - تم إزالتها من payload (PATCH يرسل فقط الحقول المتغيرة)');
          } else {
            // ✅ تم تعديل sections فعلياً - sanitize وmapping
            if (finalPayload.sections) {
              finalPayload.sections = finalPayload.sections.map((s: any) => {
                const sanitized: any = { ...s };
                
                // ✅ Mapping: تحويل teilNumber إلى teil (إذا كان موجود)
                if ('teilNumber' in sanitized) {
                  sanitized.teil = safeInt1(sanitized.teilNumber);
                  delete sanitized.teilNumber; // ✅ حذف teilNumber
                } else if ('teil' in sanitized) {
                  // ✅ إذا كان teil موجود، نضمن أنه Number >= 1
                  sanitized.teil = safeInt1(sanitized.teil);
                } else {
                  // ✅ إذا لم يكن موجود، نضيفه بقيمة 1
                  sanitized.teil = 1;
                }
                
                // ✅ Sanitize quota
                if ('quota' in sanitized && sanitized.quota != null) {
                  sanitized.quota = safeInt1(sanitized.quota);
                }
                
                // حذف الحقول غير المسموحة
                delete sanitized.listeningAudioId;
                delete sanitized.listeningAudioUrl;
                delete sanitized.description;
                
                return sanitized;
              });
            }
          }
        } else {
          // ✅ إذا لم تكن هناك بيانات أصلية، لا نرسل sections كإجراء احترازي
          delete finalPayload.sections;
          console.log('⚠️ لا توجد بيانات أصلية - تم إزالة sections من payload كإجراء احترازي');
        }
        
        response = await examsAPI.update(examId, finalPayload);
        console.log('✅ Exam updated successfully:', response);
        console.log('📤 Payload sent:', JSON.stringify(finalPayload, null, 2));
        setSuccess('تم تحديث الامتحان بنجاح!');
        
        // ✅ تحديث البيانات الأصلية بعد التحديث الناجح
        if (originalExamData) {
          setOriginalExamData({
            ...formData,
            sections: JSON.parse(JSON.stringify(formData.sections)),
          });
        }
      } else {
        // ✅ في وضع الإنشاء: sanitize sections دائماً + mapping teilNumber → teil
        if (payload.sections) {
          payload.sections = payload.sections.map((s: any) => {
            const sanitized: any = { ...s };
            
            // ✅ Mapping: تحويل teilNumber إلى teil (إذا كان موجود)
            if ('teilNumber' in sanitized) {
              sanitized.teil = safeInt1(sanitized.teilNumber);
              delete sanitized.teilNumber; // ✅ حذف teilNumber
            } else if ('teil' in sanitized) {
              // ✅ إذا كان teil موجود، نضمن أنه Number >= 1
              sanitized.teil = safeInt1(sanitized.teil);
            } else {
              // ✅ إذا لم يكن موجود، نضيفه بقيمة 1
              sanitized.teil = 1;
            }
            
            // ✅ Sanitize quota
            if ('quota' in sanitized && sanitized.quota != null) {
              sanitized.quota = safeInt1(sanitized.quota);
            }
            
            // حذف الحقول غير المسموحة
            delete sanitized.listeningAudioId;
            delete sanitized.listeningAudioUrl;
            delete sanitized.description;
            
            return sanitized;
          });
        }
        
        response = await examsAPI.create(payload);
        console.log('✅ Exam created successfully:', response);
        setSuccess(`تم إنشاء الامتحان بنجاح! (ID: ${response._id || response.id})`);
      }

      // Reset form after success (only in create mode)
      if (!isEditMode) {
      setTimeout(() => {
        setFormData({
          examType: '',
          title: '',
          level: 'A1',
          duration: '',
          status: 'draft',
          description: '',
          tags: '',
          grammarTopicId: '',
          grammarLevel: 'A1',
          totalQuestions: 10,
          difficultyDistribution: {
            easy: 0,
            medium: 0,
            hard: 0,
          },
          questionTags: '',
          schreibenTaskId: '',
          schreibenMode: 'task',
          provider: 'goethe',
          mainSkill: 'mixed',
          sections: [],
          hasSections: true,
        });
        setSuccess('');
      }, 3000);
      }
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

  if (loadingExam) {
  return (
    <div style={formStyle}>
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
            onClick={() => navigate('/admin/exams')} 
            title="العودة لقائمة الامتحانات"
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
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <svg fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                stroke="#000000" 
                fill="none"
              />
            </svg>
          </button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            تعديل الامتحان
      </h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>جاري تحميل بيانات الامتحان...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={formStyle}>
      {/* Header with back button */}
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
          onClick={() => navigate(isEditMode ? '/admin/exams' : '/welcome')} 
          title={isEditMode ? 'العودة لقائمة الامتحانات' : 'العودة للوحة التحكم'}
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
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8f9fa';
            e.currentTarget.style.borderColor = '#212529';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#DEE2E6';
          }}
        >
          <svg fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              stroke="#000000" 
              fill="none"
            />
          </svg>
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          {isEditMode ? 'تعديل الامتحان' : 'إنشاء امتحان جديد'}
        </h1>
      </div>

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
            disabled={isEditMode}
            style={{ ...inputStyle, ...(isEditMode ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}) }}
          >
            <option value="">-- اختر نوع الامتحان --</option>
            <option value="grammar_exam">Grammar Exam (قواعد)</option>
            <option value="provider_exam">Provider Exam (Prüfungen – Goethe/TELC…)</option>
            <option value="leben_exam">Deutschland in Leben Test</option>
          </select>
          {isEditMode && (
            <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
              ⚠️ نوع الامتحان غير قابل للتعديل
            </small>
          )}
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
                المدة بالدقائق / Duration (minutes) (اختياري)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                step="1"
                placeholder="اتركه فارغاً إذا لم تكن هناك مدة محددة"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="grammarTopicId" style={labelStyle}>
                  موضوع القواعد / Grammar Topic *
                </label>
                  <button
                    type="button"
                    onClick={() => setShowNewTopicModal(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    + إضافة موضوع جديد
                  </button>
                </div>
                {loadingTopics ? (
                  <p style={{ color: '#6b7280' }}>جاري تحميل المواضيع...</p>
                ) : grammarTopics.length === 0 ? (
                  <div>
                    <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '8px' }}>
                      {formData.grammarLevel ? 'لا توجد مواضيع متاحة لهذا المستوى' : 'اختر مستوى القواعد أولاً'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowNewTopicModal(true)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      إضافة موضوع جديد
                    </button>
                  </div>
                ) : (
                  <select
                    id="grammarTopicId"
                    name="grammarTopicId"
                    value={formData.grammarTopicId}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                  >
                    <option value="">-- اختر الموضوع --</option>
                    {grammarTopics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
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

        {/* Modal for creating new grammar topic */}
        {showNewTopicModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => !creatingTopic && setShowNewTopicModal(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: '2px solid #FFC107',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>
                إضافة موضوع قواعد جديد
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>
                    العنوان / Title (اختياري)
                  </label>
                    <input
                    type="text"
                    value={newTopicData.title}
                    onChange={(e) => setNewTopicData({ ...newTopicData, title: e.target.value })}
                    placeholder="مثال: الحالة المنصوبة - Akkusativ"
                      style={inputStyle}
                    />
                  </div>

                <div>
                  <label style={labelStyle}>
                    Slug (اختياري - سيتم توليده تلقائياً إذا تركت فارغاً)
                  </label>
                    <input
                    type="text"
                    value={newTopicData.slug}
                    onChange={(e) => setNewTopicData({ ...newTopicData, slug: e.target.value })}
                    placeholder="مثال: akkusativ"
                      style={inputStyle}
                    />
                  </div>

                <div>
                  <label style={labelStyle}>
                    الوصف المختصر / Short Description
                  </label>
                  <textarea
                    value={newTopicData.shortDescription}
                    onChange={(e) => setNewTopicData({ ...newTopicData, shortDescription: e.target.value })}
                    placeholder="مثال: تعلم استخدام الحالة المنصوبة في الألمانية"
                    rows={3}
                    style={inputStyle}
                  />
              </div>

              <div>
                  <label style={labelStyle}>
                    الوسوم / Tags (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                    value={newTopicData.tags}
                    onChange={(e) => setNewTopicData({ ...newTopicData, tags: e.target.value })}
                    placeholder="مثال: akkusativ, cases"
                  style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewTopicModal(false);
                      setNewTopicData({ title: '', slug: '', shortDescription: '', tags: '' });
                    }}
                    disabled={creatingTopic}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#e0e0e0',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: creatingTopic ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setCreatingTopic(true);
                      setError('');

                      try {
                        const topicPayload: any = {
                          level: formData.grammarLevel,
                        };

                        if (newTopicData.title.trim()) {
                          topicPayload.title = newTopicData.title.trim();
                        }

                        if (newTopicData.slug.trim()) {
                          topicPayload.slug = newTopicData.slug.trim();
                        }

                        if (newTopicData.shortDescription.trim()) {
                          topicPayload.shortDescription = newTopicData.shortDescription.trim();
                        }

                        if (newTopicData.tags.trim()) {
                          const tagsArray = newTopicData.tags
                            .split(',')
                            .map(t => t.trim())
                            .filter(t => t.length > 0);
                          if (tagsArray.length > 0) {
                            topicPayload.tags = tagsArray;
                          }
                        }

                        const newTopic = await createGrammarTopic(topicPayload);
                        console.log('✅ New grammar topic created:', newTopic);

                        // Add to topics list
                        setGrammarTopics([...grammarTopics, newTopic]);

                        // Auto-select the new topic
                        setFormData((prev) => ({
                          ...prev,
                          grammarTopicId: newTopic._id,
                        }));

                        // Auto-fill exam fields if empty
                        if (!formData.title.trim()) {
                          setFormData((prev) => ({
                            ...prev,
                            title: newTopic.title,
                          }));
                        }
                        if (!formData.description.trim() && newTopic.shortDescription) {
                          setFormData((prev) => ({
                            ...prev,
                            description: newTopic.shortDescription,
                          }));
                        }
                        if (!formData.questionTags.trim() && newTopic.tags && newTopic.tags.length > 0) {
                          setFormData((prev) => ({
                            ...prev,
                            questionTags: newTopic.tags.join(', '),
                          }));
                        }

                        setShowNewTopicModal(false);
                        setNewTopicData({ title: '', slug: '', shortDescription: '', tags: '' });
                        setSuccess('تم إنشاء الموضوع بنجاح وتم اختياره تلقائياً');
                      } catch (err: any) {
                        console.error('❌ Error creating grammar topic:', err);
                        setError(err?.response?.data?.message || 'حدث خطأ أثناء إنشاء الموضوع');
                      } finally {
                        setCreatingTopic(false);
                      }
                    }}
                    disabled={creatingTopic}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: creatingTopic || !newTopicData.title.trim() ? '#ccc' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: creatingTopic || !newTopicData.title.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    {creatingTopic ? 'جاري الإنشاء...' : 'إنشاء الموضوع'}
                  </button>
                </div>
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
                  {PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
                  onChange={(e) => {
                    const newSkill = e.target.value as any;
                    setFormData((prev) => ({
                      ...prev,
                      mainSkill: newSkill,
                      // إذا كان Leben Test، إلغاء sections. Schreiben يعتمد على schreibenMode
                      hasSections: newSkill === 'leben_test' ? false : (newSkill === 'schreiben' ? (prev.schreibenMode === 'sections') : true),
                      // Reset schreibenTaskId و schreibenMode عند تغيير المهارة
                      schreibenMode: newSkill === 'schreiben' ? prev.schreibenMode : 'task',
                      schreibenTaskId: newSkill === 'schreiben' ? prev.schreibenTaskId : '',
                    }));
                  }}
                  required
                  style={inputStyle}
                >
                  {MAIN_SKILL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schreiben Mode Toggle - يظهر فقط عندما mainSkill === 'schreiben' */}
              {formData.mainSkill === 'schreiben' && (
                <div>
                  <label style={labelStyle}>
                    نوع امتحان الكتابة *
                  </label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', border: formData.schreibenMode === 'task' ? '2px solid #3b82f6' : '2px solid #e5e7eb', backgroundColor: formData.schreibenMode === 'task' ? '#eff6ff' : '#fff' }}>
                      <input
                        type="radio"
                        name="schreibenMode"
                        value="task"
                        checked={formData.schreibenMode === 'task'}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          schreibenMode: 'task' as const,
                          hasSections: false,
                        }))}
                      />
                      مهمة كتابة (Schreiben Task)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', border: formData.schreibenMode === 'sections' ? '2px solid #3b82f6' : '2px solid #e5e7eb', backgroundColor: formData.schreibenMode === 'sections' ? '#eff6ff' : '#fff' }}>
                      <input
                        type="radio"
                        name="schreibenMode"
                        value="sections"
                        checked={formData.schreibenMode === 'sections'}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          schreibenMode: 'sections' as const,
                          hasSections: true,
                          schreibenTaskId: '',
                        }))}
                      />
                      سكاشن مع أسئلة (مثل Hören)
                    </label>
                  </div>
                </div>
              )}

              {/* Sections - يظهر فقط إذا hasSections = true */}
              {formData.hasSections && (
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
                          value={section.section || section.title || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleSectionChange(index, 'section', value);
                            handleSectionChange(index, 'title', value); // Keep both for compatibility
                          }}
                          placeholder="مثال: Hören – Teil 1"
                          required
                          style={inputStyle}
                        />
                      </div>

                      {formData.mainSkill === 'mixed' && (
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>المهارة / Skill *</label>
                          <select
                            value={section.skill || formData.mainSkill || 'hoeren'}
                            onChange={(e) => handleSectionChange(index, 'skill', e.target.value)}
                            required
                            style={inputStyle}
                          >
                            {SKILLS.map((skill) => (
                              <option key={skill.value} value={skill.value}>
                                {skill.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Always show skill field if not mixed (use mainSkill as default) */}
                      {formData.mainSkill !== 'mixed' && (
                      <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>المهارة / Skill *</label>
                          <input
                            type="text"
                            value={SKILLS.find(s => s.value === formData.mainSkill)?.label || formData.mainSkill}
                            disabled
                            style={{ ...inputStyle, backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                          />
                          <input
                            type="hidden"
                            value={formData.mainSkill}
                            onChange={() => {}}
                          />
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>رقم Teil *</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={section.teil || section.teilNumber || index + 1}
                          onChange={(e) => {
                            // ✅ حفظ رقم مش string
                            const value = Number(e.target.value) || index + 1;
                            const safeValue = Math.max(1, value); // Ensure >= 1
                            handleSectionChange(index, 'teil', safeValue);
                            handleSectionChange(index, 'teilNumber', safeValue); // Keep both for compatibility
                          }}
                          required
                          style={inputStyle}
                        />
                      </div>

                      {/* Section Description - يظهر فقط لـ Lesen */}
                      {(section.skill === 'lesen' || (formData.mainSkill === 'lesen' && !section.skill)) && (
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>نص القراءة / Section Description</label>
                          <textarea
                            value={section.description || ''}
                            onChange={(e) => handleSectionChange(index, 'description', e.target.value)}
                            placeholder="انسخ نص القراءة هنا..."
                            rows={5}
                            style={{
                              ...inputStyle,
                              resize: 'vertical',
                              minHeight: '100px',
                            }}
                          />
                          <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '11px' }}>
                            نص القراءة الذي سيظهر للطالب قبل الأسئلة
                          </small>
                        </div>
                      )}

                      {/* ملاحظة: الصوت يُضاف من فورم السؤال وليس من فورم القسم */}
                    </div>
                  </div>
                ))}

                {formData.sections.length === 0 && (
                  <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                    لا توجد أقسام. اضغط "إضافة Section" لإضافة قسم جديد.
                  </p>
                )}
              </div>
              )}

              {/* Schreiben Task Selector - يظهر فقط عندما mainSkill === 'schreiben' و mode === 'task' */}
              {formData.mainSkill === 'schreiben' && formData.schreibenMode === 'task' && (
                <div>
                  <label style={labelStyle}>
                    مهمة الكتابة / Schreiben Task *
                  </label>
                  {loadingSchreibenTasks ? (
                    <p style={{ color: '#6b7280' }}>جاري تحميل المهام...</p>
                  ) : schreibenTasks.length === 0 ? (
                    <div>
                      <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '8px' }}>
                        لا توجد مهام كتابة متاحة لهذا المستوى
                      </p>
                      <small style={{ display: 'block', color: '#6b7280', fontSize: '12px' }}>
                        يجب إنشاء مهام كتابة من صفحة إدارة مهام الكتابة أولاً
                      </small>
                    </div>
                  ) : (
                    <select
                      id="schreibenTaskId"
                      name="schreibenTaskId"
                      value={formData.schreibenTaskId}
                      onChange={(e) => {
                        const taskId = e.target.value;
                        const selectedTask = schreibenTasks.find(t => t._id === taskId);
                        setFormData((prev) => ({
                          ...prev,
                          schreibenTaskId: taskId,
                          // Auto-fill title if empty
                          title: selectedTask && !prev.title.trim() ? selectedTask.title : prev.title,
                        }));
                      }}
                      required
                      style={inputStyle}
                    >
                      <option value="">-- اختر مهمة الكتابة --</option>
                      {schreibenTasks.map((task) => (
                        <option key={task._id} value={task._id}>
                          {task.title} ({task.level})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leben Exam Settings */}
        {formData.examType === 'leben_exam' && (
          <div style={sectionStyle}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
              إعدادات امتحان Leben in Deutschland
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="provider" style={labelStyle}>
                  المعهد / Provider *
                </label>
                <input
                  type="text"
                  id="provider"
                  name="provider"
                  value={PROVIDER_OPTIONS.find(opt => opt.value === 'leben_in_deutschland')?.label || 'Leben in Deutschland'}
                  disabled
                  style={{ ...inputStyle, backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                  Enum value: leben_in_deutschland
                </small>
              </div>

              <div>
                <label htmlFor="mainSkill" style={labelStyle}>
                  نوع التمرين / Main Skill *
                </label>
                <input
                  type="text"
                  id="mainSkill"
                  name="mainSkill"
                  value={MAIN_SKILL_OPTIONS.find(opt => opt.value === 'leben_test')?.label || 'Life Test / Leben in Deutschland'}
                  disabled
                  style={{ ...inputStyle, backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                  Enum value: leben_test
                </small>
              </div>

              {/* Sections for Leben Exam */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '16px' }}>
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
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>Section Name *</label>
                        <input
                          type="text"
                          value={section.name || section.section || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleSectionChange(index, 'name', value);
                            handleSectionChange(index, 'section', value); // للتوافق مع الكود القديم
                          }}
                          placeholder="مثال: Leben in Deutschland – Teil 1"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>Section Title *</label>
                        <input
                          type="text"
                          value={section.title || section.section || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleSectionChange(index, 'title', value);
                            if (!section.name) {
                              handleSectionChange(index, 'name', value); // إذا name فارغ، نسخه من title
                            }
                            handleSectionChange(index, 'section', value); // للتوافق مع الكود القديم
                          }}
                          placeholder="مثال: Leben in Deutschland – Teil 1"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>رقم Teil *</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={section.teil || index + 1}
                          onChange={(e) => {
                            // ✅ حفظ رقم مش string
                            const value = Number(e.target.value) || index + 1;
                            const safeValue = Math.max(1, value); // Ensure >= 1
                            handleSectionChange(index, 'teil', safeValue);
                          }}
                          style={inputStyle}
                        />
                      </div>

                      {/* Quota تم إزالته - يُدار تلقائياً */}
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
          onClick={(e) => {
            // Debug: التحقق من حالة الزر
            console.log('🔵 Button clicked', {
              loading,
              examType: formData.examType,
              disabled: loading || !formData.examType,
              formDataKeys: Object.keys(formData)
            });
            // لا نمنع الإرسال هنا - نترك handleSubmit يتعامل مع validation
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: loading || !formData.examType ? '#ccc' : '#000000',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || !formData.examType ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading && formData.examType) {
              e.currentTarget.style.backgroundColor = '#333333';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && formData.examType) {
              e.currentTarget.style.backgroundColor = '#000000';
            }
          }}
        >
          {loading ? 'جاري الحفظ...' : (isEditMode ? 'حفظ التعديلات' : 'إنشاء الامتحان')}
        </button>
      </form>
    </div>
  );
};

export default QuestionCreateForm;
