import UserProfileDropdown from './UserProfileDropdown';

function AuthLayout({ children }) {
  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <UserProfileDropdown />
      </div>
      {children}
    </>
  );
}

export default AuthLayout;
