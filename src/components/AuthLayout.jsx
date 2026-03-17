import AppHeader from './AppHeader';
import AppFooter from './AppFooter';

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}

export default AuthLayout;
