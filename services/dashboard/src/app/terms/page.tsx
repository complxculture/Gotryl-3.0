import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
      <Link href="/" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px', margin: '24px 0 8px' }}>Terms of Service</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 40 }}>Last updated: June 2026</p>

      {[
        { title: 'Acceptance', body: 'By using Gotryl, you agree to these terms. If you do not agree, do not use the service.' },
        { title: 'What Gotryl is', body: 'Gotryl is an AI-powered testing service. We generate and run Playwright browser tests on your behalf in cloud containers. Results including screenshots, videos, and AI analysis are provided for your review.' },
        { title: 'Acceptable use', body: 'You may only test websites and applications you own or have explicit permission to test. You may not use Gotryl to test systems without authorization, perform denial-of-service attacks, or violate any applicable law.' },
        { title: 'Early access', body: 'Gotryl is currently in early access. The service is provided as-is. We may change features, pricing, or availability at any time.' },
        { title: 'Limitation of liability', body: 'Gotryl is not liable for any damages arising from use of the service, including test failures, data loss, or service outages. Use the service at your own risk.' },
        { title: 'Account termination', body: 'We reserve the right to terminate accounts that violate these terms. You may cancel your account at any time.' },
        { title: 'Contact', body: 'Questions? Email us at business@complxculture.com' },
      ].map(({ title, body }) => (
        <div key={title} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>{title}</h2>
          <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0 }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
