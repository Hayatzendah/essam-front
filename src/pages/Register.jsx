import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      // التحقق من البريد الإلكتروني أولاً (اختياري)
      try {
        const emailCheck = await authAPI.checkEmail(email);
        if (emailCheck.exists) {
          setError('البريد الإلكتروني مستخدم بالفعل. جرب بريداً آخر أو سجل الدخول');
          setLoading(false);
          return;
        }
      } catch (checkError) {
        // إذا فشل التحقق، نتابع التسجيل (قد لا يكون endpoint متاح)
        console.log('Email check failed, continuing with registration:', checkError);
      }

      const registerResult = await authAPI.register(email, password, role);
      console.log('Registration successful:', registerResult);
      
      // بعد التسجيل الناجح، انتظر قليلاً ثم سجل الدخول تلقائياً
      // (لإعطاء الوقت لقاعدة البيانات لحفظ البيانات)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await authAPI.login(email, password);
        navigate('/welcome');
      } catch (loginError) {
        console.error('Auto-login failed after registration:', loginError);
        // إذا فشل تسجيل الدخول التلقائي، اعرض رسالة نجاح واطلب من المستخدم تسجيل الدخول يدوياً
        setSuccess('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول الآن.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('=== Registration Error Details ===');
      console.error('Full error object:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status code:', err.response?.status);
      console.error('Original email:', email);
      console.error('Email (normalized):', email.trim().toLowerCase());
      console.error('Request URL:', err.config?.url);
      console.error('Request data:', err.config?.data);
      console.error('===================================');
      
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setError('لا يمكن الاتصال بالخادم. تأكد من أن API يعمل على https://api.deutsch-tests.com');
      } else if (err.response?.status === 400) {
        // خطأ 400 - Bad Request
        const errorData = err.response?.data;
        let errorMessage = 'بيانات غير صحيحة';
        
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.errors) {
          // إذا كان هناك أخطاء متعددة
          errorMessage = Object.values(errorData.errors).flat().join(', ');
        }
        
        // ترجمة رسائل الخطأ الشائعة
        if (errorMessage.toLowerCase().includes('email already') || 
            errorMessage.toLowerCase().includes('already in use') ||
            errorMessage.toLowerCase().includes('email exists')) {
          errorMessage = 'البريد الإلكتروني مستخدم بالفعل. جرب بريداً آخر أو سجل الدخول';
        }
        
        setError(errorMessage);
      } else if (err.response?.status === 409) {
        // Conflict - Email already exists
        const errorData = err.response?.data;
        let errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
        
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
        
        // إضافة نص توضيحي
        errorMessage += `. البريد "${email.trim().toLowerCase()}" موجود في النظام. جرب بريداً آخر أو سجل الدخول`;
        
        setError(errorMessage);
      } else if (err.response?.status === 500) {
        setError('حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً');
      } else {
        setError(
          err.response?.data?.message || err.response?.data?.error || 'حدث خطأ أثناء التسجيل'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">إنشاء حساب جديد</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="أدخل بريدك الإلكتروني"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">الدور</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-select"
            >
              <option value="student">طالب</option>
              <option value="teacher">معلم</option>
              <option value="admin">مدير</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="auth-link">
              سجل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

