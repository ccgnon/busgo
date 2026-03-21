// src/components/StepIndicator.jsx
const STEPS = ['Recherche', 'Siège', 'Paiement', 'Confirmation'];

export default function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--surface2)',
                border: `2px solid ${done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, transition: '.3s',
                color: done || active ? '#fff' : 'var(--muted)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '10px', color: active ? 'var(--text)' : 'var(--muted)', whiteSpace: 'nowrap', fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: '1px', margin: '0 6px', marginBottom: '14px',
                background: done ? 'var(--success)' : 'var(--border)', transition: '.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
