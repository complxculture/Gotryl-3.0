import Link from 'next/link';
import {
  TerminalWindowIcon,
  CloudIcon,
  CodeIcon,
  BracketsAngleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  GithubLogoIcon,
  DiscordLogoIcon,
} from '@phosphor-icons/react/dist/ssr';
import LandingNav from './LandingNav';
import LandingHero from './LandingHero';
import ScrollReveal from './ScrollReveal';

const BLUE   = '#2563eb';
const DARK   = '#0f172a';
const DARKER = '#070d1a';
const TEXT   = '#111827';
const MUTED  = '#6b7280';
const BORDER = '#e5e7eb';
const SURF   = '#f8fafc';

export default function Home() {
  return (
    <div style={{ fontFamily: 'var(--font-outfit),-apple-system,sans-serif', color: TEXT, background: '#fff', lineHeight: 1.5 }}>

      <LandingNav />
      <LandingHero />

      {/* ── Stats strip ── */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div className="stats-row">
            {[
              { value: '<5s',    label: 'average cloud run time' },
              { value: 'Zero',   label: 'infra to install or maintain' },
              { value: '3 ways', label: 'CLI, REST API, and MCP server' },
            ].map(({ value, label }) => (
              <div
                key={value}
                style={{
                  flex: 1,
                  padding: '32px 24px',
                  borderRight: `1px solid ${BORDER}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
                className="stat-cell"
              >
                <span style={{
                  fontSize: 'clamp(28px,4vw,40px)',
                  fontWeight: 800,
                  letterSpacing: '-1.5px',
                  color: TEXT,
                  lineHeight: 1,
                }}>
                  {value}
                </span>
                <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>{label}</span>
              </div>
            ))}

            {/* Works with */}
            <div
              style={{
                flex: 2,
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
              className="works-with-cell"
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Works with
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['GitHub Actions', 'Claude Code', 'Cursor', 'VS Code', 'Any CI'].map(name => (
                  <span
                    key={name}
                    style={{
                      fontSize: 12, fontWeight: 500, color: '#374151',
                      padding: '4px 10px',
                      background: SURF,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 6,
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ background: '#fff', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <ScrollReveal style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontSize: 'clamp(26px,3.5vw,36px)',
              fontWeight: 800, letterSpacing: '-1px',
              margin: '0 0 12px',
            }}>
              From description to results in seconds
            </h2>
            <p style={{ fontSize: 16, color: MUTED, maxWidth: 440, margin: '0 auto' }}>
              No Playwright knowledge required. No infra to manage.
            </p>
          </ScrollReveal>

          <div className="steps-grid">
            {[
              {
                n: '01',
                icon: <TerminalWindowIcon size={20} weight="duotone" color={BLUE} />,
                title: 'Describe the test',
                body: 'Write what should work in plain English. "User can sign up", "checkout completes", "dashboard loads data".',
                code: 'gotryl test create \\\n  --description "user can sign up"',
                delay: 0,
              },
              {
                n: '02',
                icon: <BracketsAngleIcon size={20} weight="duotone" color={BLUE} />,
                title: 'AI writes the code',
                body: 'Claude generates a Playwright script for your description and target URL. View or edit it any time.',
                code: '# Generated for you\nawait page.goto(url)\nawait page.fill("#email",\n  "test@example.com")',
                delay: 0.08,
              },
              {
                n: '03',
                icon: <CloudIcon size={20} weight="duotone" color={BLUE} />,
                title: 'Run in the cloud',
                body: 'Tests execute in isolated containers with real Chrome. No local Node, no Docker, no Playwright install.',
                code: 'gotryl test run tst_abc \\\n  --target https://myapp.com \\\n  --wait',
                delay: 0.16,
              },
              {
                n: '04',
                icon: <CheckCircleIcon size={20} weight="duotone" color={BLUE} />,
                title: 'Get plain-English results',
                body: 'Pass or fail, you get duration and exit code. Failures include a screenshot, video, and AI root-cause diagnosis.',
                code: '✓ Run passed (3.8s)\n# or\n✕ Failed — AI diagnosis:\n  "Submit button not found"',
                delay: 0.24,
              },
            ].map(({ n, icon, title, body, code, delay }) => (
              <ScrollReveal key={n} delay={delay}>
                <div style={{
                  background: '#fff',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <div style={{ padding: '22px 22px 0' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                    }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: '#eff6ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {icon}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#94a3b8',
                        fontFamily: 'var(--font-plex),monospace',
                        letterSpacing: '0.06em',
                      }}>
                        {n}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: TEXT }}>{title}</h3>
                    <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 16px' }}>{body}</p>
                  </div>
                  <div style={{
                    background: DARK, padding: '12px 16px',
                    fontFamily: 'var(--font-plex),"JetBrains Mono",monospace',
                    fontSize: 12, color: '#94a3b8',
                    whiteSpace: 'pre', overflowX: 'auto',
                    borderTop: `1px solid ${BORDER}`,
                    flexGrow: 1,
                    lineHeight: 1.75,
                  }}>
                    {code}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Diagnosis feature (key differentiator) ── */}
      <section style={{ background: SURF, padding: '96px 24px', borderTop: `1px solid ${BORDER}` }}>
        <div className="diagnosis-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>

          <ScrollReveal>
            <div style={{ maxWidth: 460 }}>
              <h2 style={{
                fontSize: 'clamp(26px,3.5vw,36px)',
                fontWeight: 800, letterSpacing: '-1px',
                margin: '0 0 16px',
              }}>
                When tests fail, you know exactly why
              </h2>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.72, margin: '0 0 28px' }}>
                Stack traces tell you where. Gotryl tells you what actually broke and what to do about it, in plain English.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: <XCircleIcon size={16} color="#ef4444" weight="fill" />, text: 'No more guessing from a 40-line stack trace' },
                  { icon: <CheckCircleIcon size={16} color="#22c55e" weight="fill" />, text: 'Root cause identified in the run report' },
                  { icon: <CheckCircleIcon size={16} color="#22c55e" weight="fill" />, text: 'One-command fix: --regenerate updates the script' },
                ].map(({ icon, text }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ flexShrink: 0, marginTop: 2 }}>{icon}</span>
                    <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.55 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Diagnosis result card */}
          <ScrollReveal delay={0.12}>
            <div style={{
              background: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}>
              {/* Card header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: 11, fontWeight: 700,
                  padding: '3px 9px', borderRadius: 5,
                  letterSpacing: '0.04em',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#ef4444', display: 'inline-block',
                  }} />
                  FAILED
                </span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                  tst_9qx - User can sign up
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 12,
                  color: MUTED,
                  fontFamily: 'var(--font-plex),monospace',
                }}>
                  2.1s
                </span>
              </div>

              {/* Diagnosis body */}
              <div style={{ padding: '20px' }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: MUTED,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  What happened
                </div>
                <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.65, margin: '0 0 20px' }}>
                  The "Create Account" button was not found on the page. The signup
                  form appears to have changed its primary CTA label from "Create Account"
                  to "Get started."
                </p>

                <div style={{
                  fontSize: 11, fontWeight: 700, color: MUTED,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  What to do
                </div>
                <div style={{
                  background: SURF,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontFamily: 'var(--font-plex),monospace',
                  fontSize: 12, color: '#374151',
                  marginBottom: 20,
                }}>
                  gotryl test run tst_9qx --regenerate
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Link href="/signup" style={{
                    fontSize: 13, fontWeight: 600, color: '#fff',
                    background: BLUE, padding: '8px 16px',
                    borderRadius: 7, textDecoration: 'none',
                  }}>
                    Regenerate test
                  </Link>
                  <a href="#how-it-works" style={{
                    fontSize: 13, fontWeight: 500, color: '#374151',
                    background: SURF, padding: '8px 16px',
                    borderRadius: 7, textDecoration: 'none',
                    border: `1px solid ${BORDER}`,
                  }}>
                    View Playwright code
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Integration modes ── */}
      <section style={{ background: '#fff', padding: '96px 24px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <ScrollReveal style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontSize: 'clamp(26px,3.5vw,36px)',
              fontWeight: 800, letterSpacing: '-1px',
              margin: '0 0 12px',
            }}>
              Three ways to use Gotryl
            </h2>
            <p style={{ fontSize: 16, color: MUTED, maxWidth: 400, margin: '0 auto' }}>
              Terminal, code, or inside your AI coding agent.
            </p>
          </ScrollReveal>

          <div className="integration-grid">
            {[
              {
                icon: <TerminalWindowIcon size={22} weight="duotone" color={BLUE} />,
                label: 'CLI',
                title: 'From your terminal',
                body: 'Install once, run anywhere. Works in any shell, local or CI.',
                code: `npm install -g @gotryl/cli\ngotryl setup\ngotryl test run tst_abc --wait`,
                delay: 0,
              },
              {
                icon: <CodeIcon size={22} weight="duotone" color={BLUE} />,
                label: 'REST API',
                title: 'From your code',
                body: 'Call the Gotryl API directly from any language. Bearer token auth.',
                code: `curl -X POST https://api.gotryl.com/v1/runs \\\n  -H "Authorization: Bearer gk_..." \\\n  -d '{"test_id":"tst_abc","target_url":"..."}'`,
                delay: 0.1,
              },
              {
                icon: <BracketsAngleIcon size={22} weight="duotone" color={BLUE} />,
                label: 'MCP',
                title: 'Inside Claude Code or Cursor',
                body: 'Add Gotryl as an MCP server. Your AI agent writes code, tests it, and fixes failures in one session.',
                code: `// .claude/settings.json\n{\n  "mcpServers": {\n    "gotryl": {\n      "command": "npx",\n      "args": ["-y", "@gotryl/mcp"],\n      "env": { "GOTRYL_API_KEY": "gk_..." }\n    }\n  }\n}`,
                delay: 0.2,
              },
            ].map(({ icon, label, title, body, code, delay }) => (
              <ScrollReveal key={label} delay={delay}>
                <div style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}>
                  <div style={{ padding: '24px 24px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: '#eff6ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {icon}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: BLUE,
                        background: '#eff6ff', border: '1px solid #bfdbfe',
                        padding: '2px 8px', borderRadius: 5,
                        letterSpacing: '0.06em',
                      }}>
                        {label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: TEXT }}>{title}</h3>
                    <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 16px' }}>{body}</p>
                  </div>
                  <div style={{
                    background: DARK,
                    padding: '14px 16px',
                    fontFamily: 'var(--font-plex),"JetBrains Mono",monospace',
                    fontSize: 11.5, color: '#94a3b8',
                    whiteSpace: 'pre', overflowX: 'auto',
                    borderTop: `1px solid ${BORDER}`,
                    lineHeight: 1.8,
                    flexGrow: 1,
                  }}>
                    {code}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: DARK, padding: '96px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <ScrollReveal>
            <h2 style={{
              fontSize: 'clamp(28px,4vw,40px)',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              color: '#f8fafc',
              margin: '0 0 14px',
            }}>
              Start testing in minutes
            </h2>
            <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 36 }}>
              Free to try. No credit card. No infra to set up.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/signup" style={{
                background: BLUE, color: '#fff',
                padding: '13px 32px', borderRadius: 8,
                textDecoration: 'none', fontSize: 15, fontWeight: 700,
                display: 'inline-block',
              }}>
                Create free account
              </Link>
              <a
                href="https://github.com/complxculture/Gotryl-3.0"
                style={{
                  background: 'rgba(255,255,255,0.08)', color: '#e2e8f0',
                  padding: '13px 24px', borderRadius: 8,
                  textDecoration: 'none', fontSize: 15, fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                }}
              >
                <GithubLogoIcon size={16} />
                View on GitHub
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: DARKER, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 32px' }}>
          <div className="grid-footer" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 10 }}>Gotryl</div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: '0 0 16px', maxWidth: 200 }}>
                AI-powered cloud testing. Describe what to test, we run it.
              </p>
              <div style={{ display: 'flex', gap: 14 }}>
                <a
                  href="https://github.com/complxculture/Gotryl-3.0"
                  style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}
                >
                  <GithubLogoIcon size={14} /> GitHub
                </a>
                <a
                  href="https://discord.gg/yFnTYU3Hqr"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}
                >
                  <DiscordLogoIcon size={14} /> Discord
                </a>
              </div>
            </div>

            {[
              {
                heading: 'Product',
                links: [
                  { label: 'Dashboard', href: '/signup' },
                  { label: 'CLI', href: '/signup' },
                  { label: 'MCP Server', href: '/signup' },
                  { label: 'REST API', href: '/signup' },
                  { label: 'GitHub Actions', href: '/signup' },
                ],
              },
              {
                heading: 'Developers',
                links: [
                  { label: 'Documentation', href: 'https://github.com/complxculture/Gotryl-3.0#readme' },
                  { label: 'Quickstart', href: '/signup' },
                  { label: 'GitHub', href: 'https://github.com/complxculture/Gotryl-3.0' },
                  { label: 'Changelog', href: 'https://github.com/complxculture/Gotryl-3.0/commits/master' },
                ],
              },
              {
                heading: 'Account',
                links: [
                  { label: 'Sign in', href: '/login' },
                  { label: 'Create account', href: '/signup' },
                  { label: 'API Keys', href: '/settings/keys' },
                ],
              },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#64748b',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14,
                }}>
                  {heading}
                </div>
                {links.map(({ label, href }) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <a href={href} style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>{label}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div
            className="footer-bottom"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, color: '#475569' }}>
              &copy; {new Date().getFullYear()} Gotryl. All rights reserved.
            </span>
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
