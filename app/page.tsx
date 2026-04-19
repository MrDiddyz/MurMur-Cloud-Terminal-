export default function Page() {
  const links = [
    { href: '/api/health', label: 'GET /api/health' },
    { href: '/api/readiness', label: 'GET /api/readiness' },
    { href: '/api/metrics', label: 'GET /api/metrics' },
    { href: '/api/agents', label: 'GET /api/agents' },
  ]

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '2rem',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <pre
          style={{
            color: '#22d3ee',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            margin: 0,
            userSelect: 'none',
          }}
        >
          {`
 ███╗   ███╗██╗   ██╗██████╗ ███╗   ███╗██╗   ██╗██████╗
 ████╗ ████║██║   ██║██╔══██╗████╗ ████║██║   ██║██╔══██╗
 ██╔████╔██║██║   ██║██████╔╝██╔████╔██║██║   ██║██████╔╝
 ██║╚██╔╝██║██║   ██║██╔══██╗██║╚██╔╝██║██║   ██║██╔══██╗
 ██║ ╚═╝ ██║╚██████╔╝██║  ██║██║ ╚═╝ ██║╚██████╔╝██║  ██║
 ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝
          `.trim()}
        </pre>
        <h1 style={{ margin: '1rem 0 0.25rem', fontSize: '1.5rem', color: '#f0f0f0' }}>
          Cloud Terminal
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
          Cloud-Native Compute Infrastructure for Human-AI Collaboration
        </p>
      </header>

      <section
        style={{
          border: '1px solid #1f2937',
          borderRadius: '8px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '600px',
          background: '#111827',
        }}
      >
        <p style={{ margin: '0 0 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
          $ murmur status --all
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                display: 'block',
                padding: '0.5rem 0.75rem',
                background: '#1f2937',
                borderRadius: '4px',
                color: '#22d3ee',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'background 0.15s',
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </section>

      <footer style={{ color: '#374151', fontSize: '0.75rem' }}>
        MurMur Cloud Terminal v1.0.0 · MIT License
      </footer>
    </main>
  )
}
