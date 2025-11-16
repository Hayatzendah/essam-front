import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  const isAdmin = user.role === 'admin' || user.role === 'teacher';
  const isStudent = user.role === 'student';

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-title">أهلاً بك في موقع الأستاذ عصام</h1>
        {user.email && (
          <p className="welcome-subtitle">مرحباً، {user.email}</p>
        )}
        
        <div className="welcome-actions">
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="admin-button"
            >
              لوحة تحكم الأدمن
            </button>
          )}
          
          {isStudent && (
            <button
              onClick={() => navigate('/student/liden')}
              className="liden-button"
            >
              🇩🇪 Leben in Deutschland
            </button>
          )}
          
          <button onClick={handleLogout} className="logout-button">
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

export default Welcome;

