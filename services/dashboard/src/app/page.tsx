import Link from 'next/link';
import LandingNav from './LandingNav';

const BG       = '#000000';
const SURFACE  = '#0a0a0a';
const SURFACE2 = '#141414';
const BORDER   = 'rgba(255,255,255,0.1)';
const BORDER_S = 'rgba(255,255,255,0.05)';
const T1       = '#ffffff';
const T2       = 'rgba(255,255,255,0.82)';
const T3       = 'rgba(255,255,255,0.65)';
const FONT     = "var(--font-outfit), 'Outfit', -apple-system, sans-serif";
const MONO     = "var(--font-plex), 'IBM Plex Mono', 'Courier New', monospace";

const sectionLabel = (text: string) => (
  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: T3, marginBottom: 16 }}>
    {text}
  </div>
);

export default function Home() {
  return (
    <div style={{ fontFamily: FONT, color: T1, background: BG, lineHeight: 1.65, letterSpacing: '0.008em' }}>

      <LandingNav />

      {/* ── Hero ── */}
      <section className="hero-section" style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '160px 24px 120px',
        overflow: 'hidden',
        background: BG,
      }}>
        {/* Subtle grid overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${BORDER_S} 1px, transparent 1px), linear-gradient(90deg, ${BORDER_S} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 110% 100% at 50% 50%, black 10%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse 110% 100% at 50% 50%, black 10%, transparent 72%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 2, textAlign: 'center' }}>

          {/* Eyebrow */}
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: T3, marginBottom: 32, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            // AI_POWERED_QA
            <span className="status-dot" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', flexShrink: 0 }} aria-hidden="true" />
          </div>

          <h1 className="hero-h1" style={{ fontFamily: FONT, fontSize: 'clamp(44px, 8vw, 96px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', color: T1, margin: '0 0 28px' }}>
            Your AI QA engineer,<br />
            available via CLI.
          </h1>

          <p className="hero-subtitle" style={{ fontFamily: MONO, fontSize: 'clamp(11px, 1.4vw, 13px)', color: T2, lineHeight: 1.9, maxWidth: 480, margin: '0 auto 64px', letterSpacing: '0.04em' }}>
            <span style={{ color: T3 }}>&gt; </span>
            Describe what to test in plain English. Gotryl writes the Playwright code, runs it in the cloud, and tells you exactly what broke — and why.
          </p>

          <div className="hero-ctas" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}>
            <Link href="/signup" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T1, padding: '14px 28px', border: `1px solid ${BORDER}`, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              // GET STARTED FREE →
            </Link>
            <a href="#how-it-works" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T2, padding: '14px 28px', border: `1px solid ${BORDER_S}`, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              SEE HOW IT WORKS
            </a>
          </div>
        </div>

        {/* Terminal */}
        <div className="hero-terminal" style={{ maxWidth: 720, margin: '0 auto', overflow: 'hidden', border: `1px solid ${BORDER}`, position: 'relative', zIndex: 2 }}>
          <div style={{ background: SURFACE2, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${BORDER_S}` }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ marginLeft: 8, fontFamily: MONO, fontSize: 11, color: T3, letterSpacing: '0.08em' }}>terminal</span>
          </div>
          <div style={{ background: BG, padding: '20px 24px', fontFamily: MONO, fontSize: 13, lineHeight: 2, color: T2, textAlign: 'left', overflowX: 'auto' }}>
            <div><span style={{ color: '#4ade80' }}>$</span> <span>npm install -g @gotryl/cli</span></div>
            <div style={{ color: T3 }}>added 1 package in 2s</div>
            <div style={{ marginTop: 4 }}><span style={{ color: '#4ade80' }}>$</span> <span>gotryl setup</span></div>
            <div style={{ color: T3 }}>✓ Logged in as you@company.com.</div>
            <div style={{ marginTop: 4 }}><span style={{ color: '#4ade80' }}>$</span> <span>gotryl test create --project <span style={{ color: '#fbbf24' }}>prj_xyz</span> --description <span style={{ color: '#fbbf24' }}>&quot;user can log in&quot;</span></span></div>
            <div style={{ color: T3 }}>Created test tst_abc456</div>
            <div style={{ marginTop: 4 }}><span style={{ color: '#4ade80' }}>$</span> <span>gotryl test run tst_abc456 --target-url https://myapp.com --wait</span></div>
            <div style={{ color: T3 }}>Generating Playwright code... Running in cloud...</div>
            <div><span style={{ color: '#4ade80' }}>✓ Run passed</span> <span style={{ color: T3 }}>(3.8s)</span></div>
          </div>
        </div>
      </section>

      {/* ── Works with strip ── */}
      <section style={{ borderTop: `1px solid ${BORDER_S}`, borderBottom: `1px solid ${BORDER_S}`, padding: '16px 24px', background: SURFACE }}>
        <div className="works-with-strip" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontFamily: MONO, fontSize: 9, color: T3, letterSpacing: '0.2em', textTransform: 'uppercase' }}>// WORKS WITH</span>
          {['GitHub Actions', 'Claude Code', 'Cursor', 'VS Code', 'Any CI'].map((name) => (
            <div key={name} style={{ fontFamily: MONO, fontSize: 11, color: T2, padding: '4px 12px', border: `1px solid ${BORDER_S}`, letterSpacing: '0.04em' }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="section-pad" style={{ padding: '112px 24px', background: BG, borderTop: `1px solid ${BORDER_S}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {sectionLabel('// THE_PROBLEM')}
            <h2 style={{ fontFamily: FONT, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 14px', color: T1, textWrap: 'balance' }}>
              Testing is expensive.<br />Gotryl makes it instant.
            </h2>
            <p style={{ fontFamily: MONO, fontSize: 12, color: T2, maxWidth: 440, margin: '0 auto', letterSpacing: '0.03em', lineHeight: 1.9 }}>
              Writing Playwright tests takes hours. Maintaining them takes weeks. Gotryl eliminates both.
            </p>
          </div>

          <div className="before-after" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: BORDER_S }}>
            <div style={{ padding: '32px 28px', background: BG }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(239,68,68,0.85)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>// WITHOUT_GOTRYL</div>
              {['Spend hours writing Playwright selectors', 'Debug flaky tests that only fail in CI', 'Set up and maintain test infrastructure', 'Guess what caused a failure from a stack trace', 'Tests break whenever the UI changes'].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, fontFamily: MONO, fontSize: 12, color: T2, letterSpacing: '0.02em' }}>
                  <span style={{ color: 'rgba(239,68,68,0.8)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✕</span>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ padding: '32px 28px', background: SURFACE }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(74,222,128,0.85)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>// WITH_GOTRYL</div>
              {['Describe what to test in plain English', 'Tests run reliably in isolated cloud containers', 'Zero infrastructure — no Playwright install needed', 'AI explains exactly what failed and why', 'Re-generate tests with one command'].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, fontFamily: MONO, fontSize: 12, color: T2, letterSpacing: '0.02em' }}>
                  <span style={{ color: 'rgba(74,222,128,0.85)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="section-pad" style={{ background: SURFACE, padding: '112px 24px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            {sectionLabel('// HOW_IT_WORKS')}
            <h2 style={{ fontFamily: FONT, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em', margin: 0, color: T1 }}>
              From description to results in seconds
            </h2>
          </div>

          <div className="how-it-works-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1, background: BORDER }}>
            {[
              { n: '01', title: 'Describe the test', body: 'Write what should work in plain English — "user can sign up", "checkout flow completes", "dashboard loads data".', code: 'gotryl test create \\\n  --description "user can sign up"' },
              { n: '02', title: 'AI writes the code', body: 'Claude generates a Playwright Python script tailored to your description and target URL. View and edit it any time.', code: '# Generated Playwright code\nawait page.goto(url)\nawait page.fill("#email", ...)' },
              { n: '03', title: 'Run in the cloud', body: 'Tests execute in an isolated container with a real browser. No local Playwright, no local Node, no Docker required.', code: 'gotryl test run tst_abc \\\n  --target-url https://myapp.com' },
              { n: '04', title: 'Get a full report', body: 'Pass or fail, you get duration, exit code, and stdout. Failures include screenshots, video, and AI root-cause analysis.', code: '✓ Run passed (3.8s)\n# or\n✕ Failed — see AI diagnosis' },
            ].map(({ n, title, body, code }) => (
              <div key={n} style={{ background: BG, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '28px 24px 0' }}>
                  <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800, color: T3, lineHeight: 1, marginBottom: 20, letterSpacing: '-0.02em' }}>{n}</div>
                  <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: T1, letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ fontFamily: MONO, fontSize: 12, color: T2, lineHeight: 1.8, margin: '0 0 16px', letterSpacing: '0.02em' }}>{body}</p>
                </div>
                <div style={{ marginTop: 'auto', background: SURFACE2, padding: '12px 16px', fontFamily: MONO, fontSize: 12, color: T2, whiteSpace: 'pre', overflowX: 'auto', borderTop: `1px solid ${BORDER_S}` }}>{code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="section-pad" style={{ padding: '112px 24px', background: BG, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {sectionLabel('// USE_CASES')}
            <h2 style={{ fontFamily: FONT, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em', margin: 0, color: T1 }}>
              Built for every part of the dev workflow
            </h2>
          </div>

          <div className="use-cases-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, background: BORDER }}>
            {[
              { label: '// DEVELOPERS', title: 'Test features as you ship them', body: 'No QA team? No problem. Create a test for each feature you build. Get coverage without the overhead of maintaining a Playwright suite.', cta: 'GET STARTED →', href: '/signup' },
              { label: '// AI_AGENTS', title: 'Claude Code and Cursor integration', body: 'Add Gotryl as an MCP server. Your AI coding agent can write code, test it, fix failures, and ship — all in one session.', cta: 'READ MCP DOCS →', href: '/signup' },
              { label: '// CI / CD', title: 'Run on every pull request', body: 'Drop our GitHub Actions workflow into your repo. Gotryl runs your full test suite on every PR and posts results as a comment.', cta: 'VIEW EXAMPLE WORKFLOW →', href: 'https://github.com/complxculture/Gotryl-3.0/blob/master/examples/gotryl-ci.yml' },
            ].map(({ label, title, body, cta, href }) => (
              <div key={label} style={{ background: BG, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T3, padding: '4px 8px', border: `1px solid ${BORDER_S}`, alignSelf: 'flex-start' }}>{label}</div>
                <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: T1 }}>{title}</h3>
                <p style={{ fontFamily: MONO, fontSize: 12, color: T2, lineHeight: 1.8, margin: 0, flexGrow: 1, letterSpacing: '0.02em' }}>{body}</p>
                <a href={href} style={{ fontFamily: MONO, fontSize: 10, color: T2, textDecoration: 'none', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 8 }}>{cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLI + API + MCP ── */}
      <section className="section-pad" style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: '112px 24px' }}>
        <div className="two-col" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            {sectionLabel('// INTEGRATION')}
            <h2 style={{ fontFamily: FONT, fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 14px', color: T1 }}>Three ways to use Gotryl</h2>
            <p style={{ fontFamily: MONO, fontSize: 12, color: T2, lineHeight: 1.9, marginBottom: 28, letterSpacing: '0.03em' }}>
              Use the CLI in your terminal, call the REST API from your code, or add the MCP server to Claude Code or Cursor.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: '// CLI', desc: 'npm install -g @gotryl/cli' },
                { label: '// API', desc: 'api.gotryl.com — Bearer auth' },
                { label: '// MCP', desc: 'npx @gotryl/mcp in IDE config' },
              ].map(({ label, desc }) => (
                <div key={label} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${BORDER_S}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: T3, letterSpacing: '0.12em', flexShrink: 0, minWidth: 44 }}>{label}</span>
                  <code style={{ fontFamily: MONO, fontSize: 12, color: T2, letterSpacing: '0.02em' }}>{desc}</code>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: BG, padding: '20px 24px', border: `1px solid ${BORDER}`, overflowX: 'auto' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(74,222,128,0.75)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>[ FILE: MCP_CONFIG // .claude/settings.json ]</div>
            <pre style={{ margin: 0, fontFamily: MONO, fontSize: 12, lineHeight: 1.8, color: T2, overflowX: 'auto' }}>{`{
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
      <section className="section-pad" style={{ background: BG, padding: '112px 24px', textAlign: 'center', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          {sectionLabel('// GET_STARTED')}
          <h2 style={{ fontFamily: FONT, fontSize: 'clamp(36px, 6.5vw, 76px)', fontWeight: 800, letterSpacing: '-0.03em', color: T1, margin: '0 0 14px', lineHeight: 1 }}>
            Start testing<br />in minutes.
          </h2>
          <p style={{ fontFamily: MONO, fontSize: 12, color: T2, lineHeight: 1.9, marginBottom: 40, letterSpacing: '0.03em' }}>
            Free to try. No credit card. No infra to set up.
          </p>
          <div className="cta-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T1, padding: '14px 28px', border: `1px solid ${BORDER}`, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              // CREATE FREE ACCOUNT →
            </Link>
            <a href="https://github.com/complxculture/Gotryl-3.0" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T2, padding: '14px 28px', border: `1px solid ${BORDER_S}`, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              VIEW ON GITHUB
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: BG, borderTop: `1px solid ${BORDER}` }}>
        <div className="footer-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 28px' }}>
          <div className="grid-footer" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 32, marginBottom: 48 }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 10, fontWeight: 700, color: T1, flexShrink: 0 }}>G</div>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: T1 }}>GOTRYL</span>
              </div>
              <p style={{ fontFamily: MONO, fontSize: 11, color: T3, letterSpacing: '0.08em', margin: '0 0 4px', maxWidth: 200 }}>AI-POWERED CLOUD TESTING</p>
              <a href="https://complxculture.com" style={{ fontFamily: MONO, fontSize: 11, color: T3, textDecoration: 'none', letterSpacing: '0.08em', display: 'block', marginBottom: 14, transition: 'color 0.2s' }}>
                A COMPLX CULTURE INC VENTURE
              </a>
              <div style={{ display: 'flex', gap: 16 }}>
                <a href="https://github.com/complxculture/Gotryl-3.0" style={{ fontFamily: MONO, fontSize: 12, color: T2, textDecoration: 'none', letterSpacing: '0.04em' }}>GitHub →</a>
                <a href="https://discord.gg/yFnTYU3Hqr" target="_blank" rel="noreferrer" style={{ fontFamily: MONO, fontSize: 12, color: T2, textDecoration: 'none', letterSpacing: '0.04em' }}>Discord →</a>
              </div>
            </div>

            {/* Product */}
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>// PRODUCT</div>
              {['Dashboard', 'CLI', 'MCP Server', 'REST API', 'GitHub Actions'].map((item) => (
                <div key={item} style={{ marginBottom: 10 }}>
                  <a href="/signup" style={{ fontFamily: MONO, fontSize: 12, color: T2, textDecoration: 'none', letterSpacing: '0.02em' }}>{item}</a>
                </div>
              ))}
            </div>

            {/* Developers */}
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>// DEVELOPERS</div>
              {[
                { label: 'Documentation', href: 'https://github.com/complxculture/Gotryl-3.0#readme' },
                { label: 'Quickstart', href: '/signup' },
                { label: 'GitHub', href: 'https://github.com/complxculture/Gotryl-3.0' },
                { label: 'Changelog', href: 'https://github.com/complxculture/Gotryl-3.0/commits/master' },
              ].map(({ label, href }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ fontFamily: MONO, fontSize: 12, color: T2, textDecoration: 'none', letterSpacing: '0.02em' }}>{label}</a>
                </div>
              ))}
            </div>

            {/* Account */}
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>// ACCOUNT</div>
              {[
                { label: 'Sign in', href: '/login' },
                { label: 'Create account', href: '/signup' },
                { label: 'API Keys', href: '/app/settings/keys' },
              ].map(({ label, href }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ fontFamily: MONO, fontSize: 12, color: T2, textDecoration: 'none', letterSpacing: '0.02em' }}>{label}</a>
                </div>
              ))}
            </div>
          </div>

          <div className="footer-bottom" style={{ borderTop: `1px solid ${BORDER_S}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: T3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              © {new Date().getFullYear()} Gotryl. All rights reserved.
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <a href="/privacy" style={{ fontFamily: MONO, fontSize: 11, color: T3, textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Privacy</a>
              <a href="/terms" style={{ fontFamily: MONO, fontSize: 11, color: T3, textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Terms</a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 11, color: T3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <span className="status-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', display: 'inline-block', flexShrink: 0 }} aria-hidden="true" />
                ALL SYSTEMS NOMINAL
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
