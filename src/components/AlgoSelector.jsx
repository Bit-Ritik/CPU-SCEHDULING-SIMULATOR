import React from 'react';
import { ALGO_META, ALGO_DESCRIPTIONS } from '../utils/constants';

const ALGOS = Object.entries(ALGO_META);

function AlgoSelector({ selected, quantum, onSelect, onQuantumChange }) {
  const meta = ALGO_META[selected];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
        {ALGOS.map(([key, info]) => (
          <div
            key={key}
            onClick={() => onSelect(key)}
            style={{
              border: `1px solid ${selected === key ? '#63b3ed' : 'rgba(99,179,237,0.12)'}`,
              borderRadius: 8,
              padding: '9px 12px',
              cursor: 'pointer',
              background: selected === key ? 'rgba(99,179,237,0.08)' : 'rgba(10,14,26,0.6)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: selected === key ? '#63b3ed' : '#e2e8f0' }}>{info.name}</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{info.full}</div>
          </div>
        ))}
      </div>

      {(selected === 'rr') && (
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, color: '#64748b' }}>Time Quantum:</label>
          <input
            type="number" min="1" max="20" value={quantum}
            onChange={(e) => onQuantumChange(Number(e.target.value))}
            style={{
              width: 70, padding: '6px 8px',
              background: 'rgba(10,14,26,0.9)', border: '1px solid rgba(99,179,237,0.2)',
              borderRadius: 5, color: '#63b3ed', fontFamily: 'Space Mono, monospace',
              fontSize: 13, outline: 'none',
            }}
          />
        </div>
      )}

      {meta && (
        <div style={{
          background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(99,179,237,0.1)',
          borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#94a3b8', lineHeight: 1.7,
        }}>
          <div style={{ color: '#63b3ed', fontWeight: 600, marginBottom: 4 }}>{meta.full}</div>
          <div style={{ marginBottom: 8 }}>{ALGO_DESCRIPTIONS[selected]}</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Badge label="Preemptive" value={meta.preemptive ? 'Yes' : 'No'} color={meta.preemptive ? '#f6ad55' : '#68d391'} />
            <Badge label="Starvation" value={meta.starvation ? 'Risk' : 'Safe'} color={meta.starvation ? '#fc8181' : '#68d391'} />
            <Badge label="Overhead" value={meta.overhead} color="#b794f4" />
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ label, value, color }) {
  return (
    <span style={{ fontSize: 11, color: '#64748b' }}>
      {label}: <span style={{ color, fontWeight: 600 }}>{value}</span>
    </span>
  );
}

export default AlgoSelector;
