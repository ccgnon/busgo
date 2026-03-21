// src/components/SeatMap.jsx

const legend = [
  { color: 'rgba(16,185,129,.15)', border: 'var(--success)', text: 'var(--success)', label: 'Libre' },
  { color: 'var(--accent)', border: 'var(--accent)', text: '#fff', label: 'Sélectionné' },
  { color: 'var(--surface2)', border: 'var(--border)', text: 'var(--border)', label: 'Occupé' },
];

function seatLabel(n) {
  const row = Math.ceil(n / 4);
  const col = ((n - 1) % 4) + 1;
  return `${row}${String.fromCharCode(64 + col)}`;
}

export default function SeatMap({ takenSeats = [], selectedSeat, onSelect }) {
  const takenSet = new Set(takenSeats);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {legend.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--muted)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: `1.5px solid ${l.border}` }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Bus front */}
      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
        🚌 Avant du bus
      </div>

      {/* Seat grid: 5 cols (A | B | aisle | C | D) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 34px)', gap: '5px', justifyContent: 'center' }}>
        {/* Column headers */}
        {['A','B','','C','D'].map((h, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>{h}</div>
        ))}

        {Array.from({ length: 40 }, (_, i) => {
          const n = i + 1;
          const col = ((n - 1) % 4); // 0=A, 1=B, 2=C, 3=D
          const taken = takenSet.has(n);
          const selected = n === selectedSeat;
          const label = seatLabel(n);

          const seatEl = (
            <div
              key={n}
              onClick={() => !taken && onSelect && onSelect(n)}
              title={taken ? 'Occupé' : label}
              style={{
                width: 34, height: 34,
                borderRadius: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 700,
                cursor: taken ? 'not-allowed' : 'pointer',
                border: `1.5px solid ${selected ? 'var(--accent)' : taken ? 'var(--border)' : 'var(--success)'}`,
                background: selected ? 'var(--accent)' : taken ? 'var(--surface2)' : 'rgba(16,185,129,.1)',
                color: selected ? '#fff' : taken ? 'var(--border)' : 'var(--success)',
                transition: '.12s',
                userSelect: 'none',
              }}
            >
              {label}
            </div>
          );

          // Insert aisle after column B (col index 1)
          if (col === 2) {
            return (
              <>
                <div key={`aisle-${n}`} style={{ width: 34 }} />
                {seatEl}
              </>
            );
          }
          return seatEl;
        })}
      </div>

      {/* Bus rear */}
      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', marginTop: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
        Arrière du bus
      </div>
    </div>
  );
}
