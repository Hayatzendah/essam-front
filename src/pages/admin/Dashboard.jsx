import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>لوحة تحكم الأدمن</h1>
        <div className="header-actions">
          <span className="user-info">مرحباً، {user.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="dashboard-card" onClick={() => navigate('/admin/exams/new')}>
            <div className="card-icon">📝</div>
            <h3>إنشاء امتحان جديد</h3>
            <p>أنشئ امتحاناً جديداً للطلاب</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/admin/questions/new')}>
            <div className="card-icon">➕</div>
            <h3>إنشاء سؤال جديد</h3>
            <p>أضف سؤالاً جديداً للامتحانات</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/admin/questions')}>
            <div className="card-icon">📋</div>
            <h3>عرض جميع الأسئلة</h3>
            <p>عرض وإدارة الأسئلة الموجودة</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/admin/exams')}>
            <div className="card-icon">📚</div>
            <h3>عرض جميع الامتحانات</h3>
            <p>عرض وإدارة الامتحانات الموجودة</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>الإحصائيات</h3>
            <p>عرض إحصائيات النظام</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

