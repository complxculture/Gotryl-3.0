import Link from 'next/link';
import LandingNav from './LandingNav';

const BLUE = '#2563eb';
const DARK = '#0f172a';
const TEXT = '#111827';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const SURFACE = '#f9fafb';

export default function Home() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', color: TEXT, background: '#fff', lineHeight: 1.5 }}>

      <LandingNav />

      {/* ── Hero ── */}
      <section className="hero-section" style={{ background: DARK, padding: '96px 24px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: '#93c5fd', fontSize: 13, fontWeight: 600, padding: '4px 14px', borderRadius: 20, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            Now in early access
          </div>
          <h1 className="hero-h1" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', color: '#fff', margin: '0 0 20px' }}>
            Your AI QA engineer,<br />
            <span style={{ color: '#60a5fa' }}>available via CLI</span>
          </h1>
          <p className="hero-subtitle" style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
            Describe what to test in plain English. Gotryl writes the Playwright code, runs it in the cloud, and tells you exactly what broke — and why.
          </p>
          <div className="hero-ctas" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <Link href="/signup" style={{ background: BLUE, color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>
              Get started free →
            </Link>
            <a href="#how-it-works" style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15, fontWeight: 500, border: '1px solid rgba(255,255,255,0.12)' }}>
              See how it works
            </a>
          </div>
        </div>

        {/* Terminal window */}
        <div className="hero-terminal" style={{ maxWidth: 720, margin: '0 auto', borderRadius: '12px 12px 0 0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', boxShadow: '0 -8px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ background: '#1e293b', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>terminal</span>
          </div>
          <div style={{ background: '#0f172a', padding: '20px 24px', fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace', fontSize: 13, lineHeight: 2, color: '#e2e8f0', textAlign: 'left', overflowX: 'auto' }}>
            <div><span style={{ color: '#4ade80' }}>$</span> <span style={{ color: '#94a3b8' }}>npm install -g @gotryl/cli</span></div>
            <div style={{ color: '#475569' }}>added 1 package in 2s</div>
            <div style={{ marginTop: 4 }}><span style={{ color: '#4ade80' }}>$</span> <span style={{ color: '#94a3b8' }}>gotryl setup</span></div>
            <div style={{ color: '#475569' }}>✓ Logged in as you@company.com.</div>
            <div style={{ marginTop: 4 }}><span style={{ color: '#4ade80' }}>$</span> <span style={{ color: '#94a3b8' }}>gotryl test create --project <span style={{ color: '#fbbf24' }}>prj_xyz</span> --description <span style={{ color: '#fbbf24' }}>"user can log in"</span></span></div>
            <div style={{ color: '#475569' }}>Created test tst_abc456</div>
            <div style={{ marginTop: 4 }}><span style={{ color: '#4ade80' }}>$</span> <span style={{ color: '#94a3b8' }}>gotryl test run tst_abc456 --target-url https://myapp.com --wait</span></div>
            <div style={{ color: '#475569' }}>Generating Playwright code... Running in cloud...</div>
            <div><span style={{ color: '#4ade80' }}>✓ Run passed</span> <span style={{ color: '#475569' }}>(3.8s)</span></div>
          </div>
        </div>
      </section>

      {/* ── Works with strip ── */}
      <section style={{ borderBottom: `1px solid ${BORDER}`, padding: '18px 24px' }}>
        <div className="works-with-strip" style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Works with</span>
          {['GitHub Actions', 'Claude Code', 'Cursor', 'VS Code', 'Any CI'].map((name) => (
            <div key={name} style={{ fontSize: 13, fontWeight: 500, color: '#374151', padding: '4px 12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="section-pad" style={{ padding: '96px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: BLUE, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>The problem</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 14px' }}>Testing is expensive. Gotryl makes it free.</h2>
            <p style={{ fontSize: 16, color: MUTED, maxWidth: 480, margin: '0 auto' }}>Writing Playwright tests takes hours. Maintaining them takes weeks. Gotryl eliminates both.</p>
          </div>
          <div className="before-after" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
            <div style={{ padding: '32px 28px', background: '#fff9f9' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>Without Gotryl</div>
              {['Spend hours writing Playwright selectors', 'Debug flaky tests that only fail in CI', 'Set up and maintain test infrastructure', 'Guess what caused a failure from a stack trace', 'Tests break whenever the UI changes'].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, fontSize: 14, color: '#374151' }}>
                  <span style={{ color: '#ef4444', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✕</span>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ padding: '32px 28px', background: '#f0fdf4' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>With Gotryl</div>
              {['Describe what to test in plain English', 'Tests run reliably in isolated cloud containers', 'Zero infrastructure — no Playwright install needed', 'AI explains exactly what failed and why', 'Re-generate tests with one command'].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, fontSize: 14, color: '#374151' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="section-pad" style={{ background: SURFACE, padding: '96px 24px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: BLUE, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px', margin: 0 }}>From description to results in seconds</h2>
          </div>
          <div className="how-it-works-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { n: '1', title: 'Describe the test', body: 'Write what should work in plain English — "user can sign up", "checkout flow completes", "dashboard loads data".', code: 'gotryl test create \\\n  --description "user can sign up"' },
              { n: '2', title: 'AI writes the code', body: 'Claude generates a Playwright Python script tailored to your description and target URL. You can view and edit it any time.', code: '# Generated Playwright code\nawait page.goto(url)\nawait page.fill("#email", ...)' },
              { n: '3', title: 'Run in the cloud', body: 'Tests execute in an isolated container with a real browser. No local Playwright, no local Node, no Docker required.', code: 'gotryl test run tst_abc \\\n  --target-url https://myapp.com' },
              { n: '4', title: 'Get a full report', body: 'Pass or fail, you get duration, exit code, stdout. Failures include screenshots, video, and AI root-cause analysis.', code: '✓ Run passed (3.8s)\n# or\n✕ Failed — see AI diagnosis' },
            ].map(({ n, title, body, code }) => (
              <div key={n} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                <div style={{ padding: '22px 22px 0' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: BLUE, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{n}</div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{title}</h3>
                  <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 14px' }}>{body}</p>
                </div>
                <div style={{ background: '#0f172a', padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', whiteSpace: 'pre', overflowX: 'auto', borderTop: `1px solid ${BORDER}` }}>{code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="section-pad" style={{ padding: '96px 24px', background: '#fff', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: BLUE, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Use cases</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px', margin: 0 }}>Built for every part of the dev workflow</h2>
          </div>
          <div className="use-cases-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { label: 'Developers', title: 'Test features as you ship them', body: 'No QA team? No problem. Create a test for each feature you build. Get coverage without the overhead of maintaining a Playwright suite.', cta: 'Get started →', href: '/signup' },
              { label: 'AI Coding Agents', title: 'Claude Code and Cursor integration', body: 'Add Gotryl as an MCP server. Your AI coding agent can write code, test it, fix failures, and ship — all in one session.', cta: 'Read MCP docs →', href: '/signup' },
              { label: 'CI / CD', title: 'Run on every pull request', body: 'Drop our GitHub Actions workflow into your repo. Gotryl runs your full test suite on every PR and posts results as a comment.', cta: 'View example workflow →', href: 'https://github.com/complxculture/Gotryl-3.0/blob/master/examples/gotryl-ci.yml' },
            ].map(({ label, title, body, cta, href }) => (
              <div key={label} style={{ borderRadius: 12, border: `1px solid ${BORDER}`, padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '2px 8px', letterSpacing: '0.06em', alignSelf: 'flex-start', textTransform: 'uppercase' }}>{label}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, margin: 0, flexGrow: 1 }}>{body}</p>
                <a href={href} style={{ fontSize: 14, color: BLUE, textDecoration: 'none', fontWeight: 600 }}>{cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLI + API + MCP ── */}
      <section className="section-pad" style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: '96px 24px' }}>
        <div className="two-col" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: BLUE, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>CLI + API + MCP</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 14px' }}>Three ways to use Gotryl</h2>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
              Use the CLI in your terminal, call the REST API from your code, or add the MCP server to Claude Code or Cursor.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'CLI', desc: 'npm install -g @gotryl/cli' },
                { label: 'REST API', desc: 'api.gotryl.com — Bearer auth' },
                { label: 'MCP', desc: 'npx @gotryl/mcp in IDE config' },
              ].map(({ label, desc }) => (
                <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '2px 8px', letterSpacing: '0.06em', flexShrink: 0 }}>{label}</span>
                  <code style={{ fontSize: 13, color: '#374151', fontFamily: 'monospace' }}>{desc}</code>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#0f172a', borderRadius: 12, padding: '20px 24px', border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
            <div style={{ fontSize: 11, color: '#4ade80', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 14 }}>MCP CONFIG — .claude/settings.json</div>
            <pre style={{ margin: 0, fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: 12, lineHeight: 1.8, color: '#e2e8f0', overflowX: 'auto' }}>{`{
  "mcpServers": {
    "gotryl": {
      "command": "npx",
      "args": ["-y", "@gotryl/mcp"],
      "env": {
        "GOTRYL_API_KEY": "gk_..."
      }
    }
  }
}`}</pre>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-pad" style={{ background: DARK, padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', color: '#fff', margin: '0 0 14px' }}>Start testing in minutes</h2>
          <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32 }}>
            Free to try. No credit card. No infra to set up.
          </p>
          <div className="cta-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ background: BLUE, color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
              Create free account →
            </Link>
            <a href="https://github.com/complxculture/Gotryl-3.0" style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15, fontWeight: 500, border: '1px solid rgba(255,255,255,0.12)' }}>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="footer-inner" style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 24px 32px' }}>
          <div className="grid-footer" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Gotryl</div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: '0 0 14px', maxWidth: 200 }}>AI-powered cloud testing. Describe what to test — we run it.</p>
              <a href="https://github.com/complxculture/Gotryl-3.0" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>GitHub →</a>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Product</div>
              {['Dashboard', 'CLI', 'MCP Server', 'REST API', 'GitHub Actions'].map((item) => (
                <div key={item} style={{ marginBottom: 10 }}>
                  <a href="/signup" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>{item}</a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Developers</div>
              {[{ label: 'Documentation', href: 'https://github.com/complxculture/Gotryl-3.0#readme' }, { label: 'Quickstart', href: '/signup' }, { label: 'GitHub', href: 'https://github.com/complxculture/Gotryl-3.0' }, { label: 'Changelog', href: 'https://github.com/complxculture/Gotryl-3.0/commits/master' }].map(({ label, href }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>{label}</a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Account</div>
              {[{ label: 'Sign in', href: '/login' }, { label: 'Create account', href: '/signup' }, { label: 'API Keys', href: '/settings/keys' }].map(({ label, href }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>{label}</a>
                </div>
              ))}
            </div>
          </div>
          <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#475569' }}>© {new Date().getFullYear()} Gotryl. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="/privacy" style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>Privacy</a>
              <a href="/terms" style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>Terms</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
