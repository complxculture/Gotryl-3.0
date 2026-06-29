import AuthHeader from './AuthHeader';
import { getClient } from '@/lib/session';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  let isAdmin = false;
  try {
    const client = getClient();
    const me = await client.auth.getMe();
    isAdmin = Boolean(ADMIN_EMAIL && me.email === ADMIN_EMAIL);
  } catch {
    // not logged in — middleware will redirect
  }

  return (
    <>
      <AuthHeader isAdmin={isAdmin} />
      <main className="auth-main" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {children}
      </main>
    </>
  );
}
