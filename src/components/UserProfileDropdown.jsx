import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { usersAPI } from '../services/usersAPI';
import { useLanguage } from '../contexts/LanguageContext';

function UserProfileDropdown() {
  const { t, isRtl } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تحديث بيانات المستخدم من localStorage عند تغييرها
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    const isAdminOrTeacher = user.role === 'admin' || user.role === 'teacher';
    await authAPI.logout();
    navigate(isAdminOrTeacher ? '/adminessam-login' : '/login', { replace: true });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t('passwordTooShort'));
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await authAPI.changePassword(oldPassword, newPassword);
      setPasswordSuccess(result.message || t('passwordChangeSuccess'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || t('passwordChangeFailed')
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPicture(true);
    try {
      const result = await usersAPI.uploadProfilePicture(file);
      const updatedUser = { ...user, profilePicture: result.profilePicture };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
    } finally {
      setUploadingPicture(false);
      // إعادة تعيين input الملف
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const firstLetter = (user.email || user.name || '?')[0].toUpperCase();

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {/* زر البروفايل — دائرة صغيرة بصورة الحساب أو الحرف الأول */}
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-[#DD0000] hover:border-[#000000] transition-all focus:outline-none focus:ring-2 focus:ring-[#FFCE00] shadow-sm hover:shadow-md bg-[rgba(255,206,0,0.12)] dark:bg-slate-700 dark:border-[#DD0000] dark:hover:border-[#FFCE00]"
        >
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-[#DD0000] dark:text-[#FFCE00]">{firstLetter}</span>
          )}
        </button>

        {/* القائمة المنسدلة */}
        {open && (
          <div className={`absolute top-12 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-[#DD0000]/30 dark:border-[#FFCE00]/40 py-3 z-50 ${isRtl ? 'left-0' : 'right-0'}`}>
            {/* معلومات المستخدم */}
            <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-600 flex items-center gap-3">
              <button
                onClick={handleProfilePictureClick}
                className="relative w-12 h-12 rounded-full bg-[rgba(255,206,0,0.08)] dark:bg-slate-700 flex-shrink-0 overflow-hidden border-2 border-[#DD0000]/50 hover:border-[#DD0000] transition-colors group"
                title={t('changeProfilePicture')}
              >
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-slate-600">{firstLetter}</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                {uploadingPicture && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#DD0000] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="min-w-0 text-start">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" dir="ltr">
                  {user.email || ''}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('role_' + (user.role || 'student')) || user.role}
                </p>
              </div>
            </div>

            {/* الأزرار — تحاذٍ من البداية (يسار في LTR، يمين في العربي) */}
            <div className="py-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowPasswordModal(true);
                }}
                className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {t('changePassword')}
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* مودال تغيير كلمة المرور */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('changePasswordTitle')}</h3>

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('currentPassword')}
                </label>
                <input
                  type="password"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('newPassword')}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('confirmNewPassword')}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {passwordError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                  {passwordSuccess}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 rounded-md bg-red-600 text-white text-sm font-semibold py-2 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  {passwordLoading ? t('passwordChanging') : t('change')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 rounded-md bg-slate-100 text-slate-700 text-sm font-semibold py-2 hover:bg-slate-200 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default UserProfileDropdown;
