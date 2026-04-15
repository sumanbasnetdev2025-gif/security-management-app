'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const FEATURES = [
  {
    icon: '⬡',
    title: 'Guard Management',
    desc: 'Track attendance, duty rotation, and monthly summaries with one-tap logging for day and night shifts.',
  },
  {
    icon: '⬡',
    title: 'Parking Control',
    desc: 'Real-time vehicle entry and exit tracking with automatic duration calculation and overstay alerts.',
  },
  {
    icon: '⬡',
    title: 'CCTV Audit',
    desc: 'Monitor every camera across your site. Log status, technician visits, and get instant working percentage.',
  },
  {
    icon: '⬡',
    title: 'Incident Reports',
    desc: 'Capture incidents the moment they happen — location, type, action taken, and photo evidence.',
  },
  {
    icon: '⬡',
    title: 'Surveillance Logs',
    desc: 'Manual CCTV observation logs with person counts by category and suspicious activity flagging.',
  },
  {
    icon: '⬡',
    title: 'Setup Management',
    desc: 'Track temporary booths and events from setup to dismantle with photo stages and item lists.',
  },
]

const STATS = [
  { value: '100%', label: 'Mobile Friendly' },
  { value: 'Real-time', label: 'Live Dashboard' },
  { value: 'Excel + PDF', label: 'Export Formats' },
  { value: 'Role-based', label: 'Access Control' },
]

export default function LandingPage() {
  const [time, setTime] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-GB', { hour12: false }) +
          ' | ' +
          now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const cols = Math.floor(canvas.width / 20)
    const rows = Math.floor(canvas.height / 20)
    const dots: { x: number; y: number; opacity: number; speed: number }[] = []

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (Math.random() > 0.85) {
          dots.push({
            x: i * 20 + 10,
            y: j * 20 + 10,
            opacity: Math.random() * 0.4 + 0.05,
            speed: Math.random() * 0.02 + 0.005,
          })
        }
      }
    }

    let frame: number
    let t = 0

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      t += 0.01
      dots.forEach(d => {
        const o = d.opacity + Math.sin(t * d.speed * 100) * 0.1
        ctx!.beginPath()
        ctx!.arc(d.x, d.y, 1, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(234, 179, 8, ${Math.max(0, Math.min(0.5, o))})`
        ctx!.fill()
      })
      frame = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div style={{ background: '#0a0a0b', minHeight: '100vh', fontFamily: "'Courier New', monospace", color: '#e5e5e0' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .hero-font { font-family: 'Bebas Neue', sans-serif; }
        .mono { font-family: 'Space Mono', monospace; }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideRight {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes pulseAmber {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234,179,8,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(234,179,8,0); }
        }

        @keyframes scanDown {
          from { top: -2px; }
          to { top: calc(100% + 2px); }
        }

        @keyframes tickerMove {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .fade-up-1 { animation: fadeUp 0.8s ease 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.8s ease 0.25s both; }
        .fade-up-3 { animation: fadeUp 0.8s ease 0.4s both; }
        .fade-up-4 { animation: fadeUp 0.8s ease 0.55s both; }

        .cursor::after {
          content: '█';
          animation: blink 1s step-end infinite;
          color: #eab308;
        }

        .amber-line {
          display: block;
          height: 2px;
          background: #eab308;
          animation: slideRight 1.2s ease 0.4s both;
          width: 0;
          margin-bottom: 36px;
        }

        .feature-card {
          border: 1px solid rgba(234,179,8,0.12);
          background: #0a0a0b;
          padding: 32px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(234,179,8,0.7), transparent);
          transform: scaleX(0);
          transition: transform 0.35s ease;
        }

        .feature-card:hover::before { transform: scaleX(1); }

        .feature-card:hover {
          border-color: rgba(234,179,8,0.3);
          background: rgba(234,179,8,0.03);
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #eab308;
          color: #0a0a0b;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.12em;
          padding: 16px 36px;
          text-decoration: none;
          transition: all 0.2s;
          animation: pulseAmber 2.5s ease infinite;
          border: none;
          cursor: pointer;
        }

        .cta-btn:hover {
          background: #fbbf24;
          transform: translateY(-2px);
        }

        .ghost-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(234,179,8,0.4);
          color: #eab308;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.08em;
          padding: 16px 32px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .ghost-btn:hover {
          background: rgba(234,179,8,0.08);
          border-color: #eab308;
        }

        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(234,179,8,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(234,179,8,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .cam-box {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .cam-box::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(234,179,8,0.9), transparent);
          animation: scanDown 1.8s linear infinite;
        }

        .corner { position: absolute; width: 8px; height: 8px; }
        .corner-tl { top: 0; left: 0; border-top: 1.5px solid #eab308; border-left: 1.5px solid #eab308; }
        .corner-tr { top: 0; right: 0; border-top: 1.5px solid #eab308; border-right: 1.5px solid #eab308; }
        .corner-bl { bottom: 0; left: 0; border-bottom: 1.5px solid #eab308; border-left: 1.5px solid #eab308; }
        .corner-br { bottom: 0; right: 0; border-bottom: 1.5px solid #eab308; border-right: 1.5px solid #eab308; }

        .ticker-inner {
          display: flex;
          white-space: nowrap;
          animation: tickerMove 30s linear infinite;
        }

        .role-card {
          border-width: 1px;
          border-style: solid;
          padding: 32px;
          position: relative;
          transition: all 0.3s;
        }

        .role-card:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* Fixed Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: '1px solid rgba(234,179,8,0.15)',
        background: 'rgba(10,10,11,0.95)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="cam-box" style={{ width: 26, height: 26, border: '1px solid rgba(234,179,8,0.4)' }}>
              <div className="corner corner-tl" style={{ width: 5, height: 5 }} />
              <div className="corner corner-tr" style={{ width: 5, height: 5 }} />
              <div className="corner corner-bl" style={{ width: 5, height: 5 }} />
              <div className="corner corner-br" style={{ width: 5, height: 5 }} />
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#eab308' }} />
            </div>
            <span className="hero-font" style={{ fontSize: 20, letterSpacing: '0.18em', color: '#f0f0eb' }}>SENTINEL</span>
            <span className="mono" style={{ fontSize: 8, color: '#eab308', border: '1px solid rgba(234,179,8,0.35)', padding: '2px 6px', letterSpacing: '0.1em' }}>SECURE</span>
          </div>

          {/* Live clock */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span className="mono" style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.08em' }}>{time}</span>
          </div>

          <Link href="/login" className="ghost-btn" style={{ fontSize: 11, padding: '8px 18px' }}>
            SIGN IN →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 56, overflow: 'hidden' }}>
        <div className="grid-bg" />
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

        {/* Glows */}
        <div style={{ position: 'absolute', top: '15%', right: '8%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(234,179,8,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '0%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(234,179,8,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: 700 }}>
            <div className="mono fade-up-1" style={{ fontSize: 10, color: '#eab308', letterSpacing: '0.25em', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'inline-block', width: 28, height: 1, background: '#eab308' }} />
              SECURITY OPERATIONS PLATFORM
              <span style={{ display: 'inline-block', width: 28, height: 1, background: '#eab308' }} />
            </div>

            <h1 className="hero-font fade-up-2" style={{ fontSize: 'clamp(72px, 11vw, 128px)', lineHeight: 0.88, letterSpacing: '0.02em', color: '#f5f5f0', marginBottom: 6 }}>
              TOTAL
            </h1>
            <h1 className="hero-font fade-up-2" style={{ fontSize: 'clamp(72px, 11vw, 128px)', lineHeight: 0.88, letterSpacing: '0.02em', color: '#eab308', marginBottom: 32 }}>
              CONTROL<span className="cursor" style={{ fontSize: '55%' }} />
            </h1>

            <span className="amber-line fade-up-2" />

            <p className="mono fade-up-3" style={{ fontSize: 13, lineHeight: 1.9, color: '#9ca3af', maxWidth: 500, marginBottom: 44 }}>
              Complete internal security management for guards, supervisors, and administrators.
              Built for daily field use — fast, mobile-first, and built to work in the dark.
            </p>

            <div className="fade-up-4" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/login" className="cta-btn">
                <span>▶</span> ENTER SYSTEM
              </Link>
              <a href="#features" className="ghost-btn">
                SEE MODULES ↓
              </a>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid rgba(234,179,8,0.1)', background: 'rgba(10,10,11,0.85)', height: 36, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <div className="ticker-inner">
            {[...Array(2)].map((_, rep) =>
              ['GUARD MANAGEMENT', 'PARKING CONTROL', 'CCTV AUDIT', 'INCIDENT REPORTING', 'SURVEILLANCE LOGS', 'SETUP TRACKING', 'EXCEL EXPORT', 'ROLE-BASED ACCESS', 'DARK MODE READY'].map((item, i) => (
                <span key={`${rep}-${i}`} className="mono" style={{ fontSize: 10, color: '#374151', letterSpacing: '0.18em', display: 'flex', alignItems: 'center', gap: 12, paddingRight: 48 }}>
                  <span style={{ color: '#eab308' }}>◆</span> {item}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop: '1px solid rgba(234,179,8,0.08)', borderBottom: '1px solid rgba(234,179,8,0.08)', background: 'rgba(234,179,8,0.015)' }}>
        <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: '36px 24px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(234,179,8,0.08)' : 'none' }}>
              <div className="hero-font" style={{ fontSize: 42, color: '#eab308', letterSpacing: '0.04em' }}>{s.value}</div>
              <div className="mono" style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.2em', marginTop: 6 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ marginBottom: 56 }}>
          <div className="mono" style={{ fontSize: 10, color: '#eab308', letterSpacing: '0.22em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 20, height: 1, background: '#eab308' }} />
            SYSTEM MODULES
          </div>
          <h2 className="hero-font" style={{ fontSize: 'clamp(40px, 5vw, 64px)', color: '#f5f5f0', letterSpacing: '0.04em', lineHeight: 1 }}>
            EVERYTHING YOU NEED
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 1, background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.07)' }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ color: '#eab308', fontSize: 14 }}>◆</span>
                <span className="mono" style={{ fontSize: 9, color: '#374151', letterSpacing: '0.18em' }}>MODULE {String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="hero-font" style={{ fontSize: 27, color: '#e5e5e0', letterSpacing: '0.06em', marginBottom: 14 }}>
                {f.title.toUpperCase()}
              </h3>
              <p className="mono" style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.9 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACCESS LEVELS ── */}
      <section style={{ borderTop: '1px solid rgba(234,179,8,0.08)', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}>
          <div style={{ marginBottom: 56 }}>
            <div className="mono" style={{ fontSize: 10, color: '#eab308', letterSpacing: '0.22em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-block', width: 20, height: 1, background: '#eab308' }} />
              ACCESS PROTOCOL
            </div>
            <h2 className="hero-font" style={{ fontSize: 'clamp(40px, 5vw, 64px)', color: '#f5f5f0', letterSpacing: '0.04em', lineHeight: 1 }}>
              THREE LEVELS OF ACCESS
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              {
                role: 'ADMIN',
                badge: '01',
                color: '#eab308',
                desc: 'Full system control. Create and manage users, assign permissions, and access every module and report.',
              },
              {
                role: 'SUPERVISOR',
                badge: '02',
                color: '#60a5fa',
                desc: 'Operational access. Manage daily operations, review reports, and oversee all assigned modules.',
              },
              {
                role: 'GUARD',
                badge: '03',
                color: '#6b7280',
                desc: 'Field entry access. Log attendance, record vehicle entries, and submit incidents and surveillance.',
              },
            ].map((r, i) => (
              <div key={i} className="role-card" style={{ borderColor: `${r.color}20` }}>
                <div style={{ position: 'absolute', top: 20, right: 20, fontFamily: 'Bebas Neue, sans-serif', fontSize: 52, color: `${r.color}10`, letterSpacing: '0.04em', lineHeight: 1 }}>{r.badge}</div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, marginBottom: 20, boxShadow: `0 0 10px ${r.color}` }} />
                <h3 className="hero-font" style={{ fontSize: 30, color: r.color, letterSpacing: '0.1em', marginBottom: 14 }}>{r.role}</h3>
                <p className="mono" style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.9 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ borderTop: '1px solid rgba(234,179,8,0.12)', position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(234,179,8,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '120px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="mono" style={{ fontSize: 10, color: '#eab308', letterSpacing: '0.25em', marginBottom: 20 }}>
            ◆ READY TO DEPLOY ◆
          </div>
          <h2 className="hero-font" style={{ fontSize: 'clamp(52px, 9vw, 100px)', color: '#f5f5f0', letterSpacing: '0.02em', lineHeight: 0.9, marginBottom: 36 }}>
            START NOW
          </h2>
          <p className="mono" style={{ fontSize: 12, color: '#6b7280', marginBottom: 48, lineHeight: 1.8 }}>
            Admin credentials are ready. Sign in and start managing your<br />security operations immediately.
          </p>
          <Link href="/login" className="cta-btn" style={{ fontSize: 14, padding: '18px 52px' }}>
            <span>▶</span> ENTER SYSTEM
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(234,179,8,0.08)', padding: '28px 24px', textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 9, color: '#1f2937', letterSpacing: '0.2em' }}>
          SENTINEL SECURITY MANAGEMENT SYSTEM · INTERNAL USE ONLY · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}