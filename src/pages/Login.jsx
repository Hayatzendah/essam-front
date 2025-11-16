import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.login(email, password);
      navigate('/welcome');
    } catch (err) {
      console.error('Login error:', err);
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
        
        setError(errorMessage);
      } else if (err.response?.status === 401) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        setError(
          err.response?.data?.message || err.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">تسجيل الدخول</h1>
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
              placeholder="أدخل كلمة المرور"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ليس لديك حساب؟{' '}
            <Link to="/register" className="auth-link">
              سجل الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

