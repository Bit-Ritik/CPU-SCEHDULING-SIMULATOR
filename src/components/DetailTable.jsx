import React from 'react';
import { runAlgorithm, computeMetrics } from '../algorithms/schedulers';
import { ALGO_META } from '../utils/constants';

// ── Per-process detail table ───────────────────────────────────────────────
export function DetailTable({ results }) {
  if (!results.length) {
    return <div style={{ color: '#334155', fontSize: 13, padding: 16, textAlign: 'center' }}>Run simulation to see per-process details.</div>;
  }

  const th = {
    padding: '7px 10px', background: 'rgba(10,14,26,0.8)',
    color: '#475569', fontSize: 10, letterSpacing: 1,
    border: '1px solid rgba(99,179,237,0.1)', textAlign: 'left', fontWeight: 500,
  };
  const td = { padding: '7px 10px', border: '1px solid rgba(99,179,237,0.06)', fontFamily: 'Space Mono, monospace', fontSize: 12 };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['PID','Arrival','Burst','Priority','Start','Finish','Wait','Turnaround','Response'].map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i}>
              <td style={{ ...td, color: r.color, fontWeight: 700 }}>{r.pid}</td>
              <td style={td}>{r.arrival}</td>
              <td style={td}>{r.burst}</td>
              <td style={td}>{r.priority}</td>
              <td style={td}>{r.start ?? r.finish - r.burst}</td>
              <td style={td}>{r.finish}</td>
              <td style={{ ...td, color: r.wait > 10 ? '#fc8181' : r.wait > 5 ? '#f6ad55' : '#68d391' }}>{r.wait}</td>
              <td style={td}>{r.turn}</td>
              <td style={td}>{r.resp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Comparison page ───────────────────────────────────────────────────────
export function ComparisonPage({ processes, quantum }) {
  if (!processes.length) {
    return (
      <div style={{ color: '#475569', padding: 40, textAlign: 'center', fontSize: 14 }}>
        Add processes on the Simulator tab first, then return here.
      </div>
    );
  }

  const algoKeys = Object.keys(ALGO_META);
  const allResults = algoKeys.map((key) => {
    const { gantt, results } = runAlgorithm(key, processes, quantum);
    if (!results.length) return null;
    const m = computeMetrics(gantt, results);
    return { key, name: ALGO_META[key].name, ...m };
  }).filter(Boolean);

  const bestWait = Math.min(...allResults.map((a) => a.avgWait));
  const worstWait = Math.max(...allResults.map((a) => a.avgWait));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: 12, marginBottom: 20 }}>
        {allResults.map((a) => {
          const isBest = a.avgWait === bestWait;
          return (
            <div key={a.key} style={{
              background: 'rgba(20,27,45,0.9)', borderRadius: 10,
              border: `1px solid ${isBest ? '#4fd1c5' : 'rgba(99,179,237,0.12)'}`,
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#63b3ed' }}>{a.name}</span>
                {isBest && <span style={{ fontSize: 9, background: 'rgba(79,209,197,0.15)', color: '#4fd1c5', border: '1px solid rgba(79,209,197,0.3)', borderRadius: 4, padding: '2px 6px' }}>BEST</span>}
              </div>
              <MetricRow label="Avg Wait" value={a.avgWait.toFixed(2)} highlight={isBest ? '#68d391' : a.avgWait === worstWait ? '#fc8181' : null} />
              <MiniBar val={a.avgWait} max={worstWait} color={isBest ? '#68d391' : '#63b3ed'} />
              <MetricRow label="Avg Turnaround" value={a.avgTurn.toFixed(2)} />
              <MetricRow label="Avg Response" value={a.avgResp.toFixed(2)} />
              <MetricRow label="CPU Util" value={`${a.cpuUtil.toFixed(1)}%`} highlight="#68d391" />
              <MetricRow label="Context Switches" value={a.contextSwitches} highlight="#f6ad55" />
            </div>
          );
        })}
      </div>

      {/* Simple visual bar comparison */}
      <div style={{ background: 'rgba(20,27,45,0.9)', border: '1px solid rgba(99,179,237,0.12)', borderRadius: 12, padding: '1rem 1.25rem' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#63b3ed', letterSpacing: 2, marginBottom: 12 }}>
          AVG WAIT — VISUAL COMPARISON
        </div>
        {allResults.sort((a,b) => a.avgWait - b.avgWait).map((a) => (
          <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 90, fontSize: 11, fontFamily: 'Space Mono, monospace', color: '#94a3b8', flexShrink: 0 }}>{a.name}</div>
            <div style={{ flex: 1, height: 20, background: 'rgba(99,179,237,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${(a.avgWait / worstWait) * 100}%`, height: '100%',
                background: a.avgWait === bestWait ? 'rgba(104,211,145,0.6)' : 'rgba(99,179,237,0.5)',
                borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8,
                fontSize: 10, fontFamily: 'Space Mono, monospace', color: '#fff',
                transition: 'width 0.6s',
              }}>
                {a.avgWait.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid rgba(99,179,237,0.05)' }}>
      <span style={{ color: '#475569' }}>{label}</span>
      <span style={{ fontFamily: 'Space Mono, monospace', color: highlight || '#e2e8f0' }}>{value}</span>
    </div>
  );
}

function MiniBar({ val, max, color }) {
  return (
    <div style={{ height: 4, background: 'rgba(99,179,237,0.1)', borderRadius: 2, margin: '5px 0 8px', overflow: 'hidden' }}>
      <div style={{ width: `${(val / max) * 100}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
    </div>
  );
}
