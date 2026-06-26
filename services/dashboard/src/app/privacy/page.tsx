import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
      <Link href="/" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px', margin: '24px 0 8px' }}>Privacy Policy</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 40 }}>Last updated: June 2026</p>

      {[
        { title: 'What we collect', body: 'We collect your email address and API usage data (test descriptions, run results, timing). We do not collect or store the content of the pages you test.' },
        { title: 'How we use it', body: 'We use your data to operate the Gotryl service — running tests, storing results, and communicating with you about your account. We do not sell your data.' },
        { title: 'Data storage', body: 'Test artifacts (screenshots, videos, AI analysis) are stored in Cloudflare R2 and retained for 30 days after a run. Account data is stored in our database hosted on a private VPS.' },
        { title: 'Third-party services', body: 'We use Anthropic (Claude) to generate and analyze tests. Your test descriptions and page URLs are sent to Anthropic for this purpose. See Anthropic\'s privacy policy at anthropic.com.' },
        { title: 'Your rights', body: 'You can delete your account and all associated data at any time by emailing us. We will process deletion requests within 7 days.' },
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
