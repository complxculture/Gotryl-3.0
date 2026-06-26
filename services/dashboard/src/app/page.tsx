import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a202c', background: '#fff' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>Gotryl</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#4a5568', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Sign in
          </Link>
          <Link href="/signup" style={{ background: '#2b6cb0', color: '#fff', padding: '8px 20px', borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: '80px auto', padding: '0 40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#ebf8ff', color: '#2b6cb0', fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 24 }}>
          AI-powered cloud testing
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
          Test your app in plain English.<br />No Playwright required.
        </h1>
        <p style={{ fontSize: 18, color: '#4a5568', lineHeight: 1.7, marginBottom: 36 }}>
          Describe what to test. Gotryl generates the Playwright code, runs it in the cloud, and returns screenshots, videos, and AI-diagnosed failure reports.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ background: '#2b6cb0', color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 16, fontWeight: 600 }}>
            Get started free
          </Link>
          <a href="#how-it-works" style={{ background: '#f7fafc', color: '#2d3748', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 16, fontWeight: 500, border: '1px solid #e2e8f0' }}>
            See how it works
          </a>
        </div>
      </section>

      {/* Terminal demo */}
      <section style={{ maxWidth: 680, margin: '0 auto 80px', padding: '0 40px' }}>
        <div style={{ background: '#1a202c', borderRadius: 12, padding: '28px 32px', fontSize: 14, lineHeight: 2, fontFamily: 'monospace', color: '#e2e8f0' }}>
          <div><span style={{ color: '#68d391' }}>$</span> gotryl project create <span style={{ color: '#fbd38d' }}>"My App"</span></div>
          <div style={{ color: '#718096' }}>Created project prj_a1b2c3d4e5f6g7h8</div>
          <div style={{ marginTop: 8 }}><span style={{ color: '#68d391' }}>$</span> gotryl test create --project prj_a1b2c3d4e5f6g7h8 \</div>
          <div style={{ paddingLeft: 16 }}>--description <span style={{ color: '#fbd38d' }}>"user can sign up with email"</span></div>
          <div style={{ color: '#718096' }}>Created test tst_x9y8z7w6v5u4t3s2</div>
          <div style={{ marginTop: 8 }}><span style={{ color: '#68d391' }}>$</span> gotryl test run tst_x9y8z7w6v5u4t3s2 \</div>
          <div style={{ paddingLeft: 16 }}>--target-url <span style={{ color: '#fbd38d' }}>https://myapp.com</span> --wait</div>
          <div style={{ color: '#68d391' }}>✓ Run passed (4231ms)</div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ background: '#f7fafc', padding: '80px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 56, letterSpacing: '-0.5px' }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {[
              { step: '01', title: 'Describe', body: 'Write what you want to test in plain English. No code needed.' },
              { step: '02', title: 'Generate', body: 'Claude AI writes a Python Playwright test file tailored to your description and target URL.' },
              { step: '03', title: 'Run', body: 'Tests execute in isolated cloud containers. No Playwright installation on your machine.' },
              { step: '04', title: 'Diagnose', body: 'Failures come with screenshots, video recordings, and AI root-cause hypotheses.' },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ background: '#fff', borderRadius: 10, padding: '28px 24px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2b6cb0', marginBottom: 10, letterSpacing: 1 }}>{step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
                <p style={{ color: '#4a5568', lineHeight: 1.6, fontSize: 15, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '80px 40px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 56, letterSpacing: '-0.5px' }}>Built for developers and AI agents</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            { icon: '👩‍💻', title: 'Developers', body: 'Get test coverage without writing or maintaining Playwright code. Point Gotryl at any URL and describe what should work.' },
            { icon: '🤖', title: 'Coding agents', body: 'Claude Code and Cursor can call Gotryl via MCP to test features as they build them — write, test, fix, repeat.' },
            { icon: '🔁', title: 'CI/CD pipelines', body: 'Drop the GitHub Actions workflow into your repo. Gotryl runs on every pull request and posts results as PR comments.' },
          ].map(({ icon, title, body }) => (
            <div key={title} style={{ padding: '28px 24px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
              <p style={{ color: '#4a5568', lineHeight: 1.6, fontSize: 15, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CLI install */}
      <section style={{ background: '#f7fafc', padding: '80px 40px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.5px' }}>Install the CLI</h2>
          <p style={{ color: '#4a5568', marginBottom: 28, fontSize: 16 }}>Works with Claude Code, Cursor, and any terminal.</p>
          <div style={{ background: '#1a202c', borderRadius: 8, padding: '16px 24px', fontFamily: 'monospace', color: '#e2e8f0', fontSize: 15, marginBottom: 28, textAlign: 'left' }}>
            <span style={{ color: '#68d391' }}>$</span> npm install -g @gotryl/cli
          </div>
          <Link href="/signup" style={{ background: '#2b6cb0', color: '#fff', padding: '12px 32px', borderRadius: 8, textDecoration: 'none', fontSize: 16, fontWeight: 600 }}>
            Get your API key
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 40px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#718096', fontSize: 14 }}>
        © {new Date().getFullYear()} Gotryl. Built for developers who ship fast.
      </footer>

    </main>
  );
}
