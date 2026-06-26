import AuthHeader from './AuthHeader';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthHeader />
      <main className="auth-main" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {children}
      </main>
    </>
  );
}
