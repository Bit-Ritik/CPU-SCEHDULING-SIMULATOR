import React from 'react';
import { ALGO_META, ALGO_DESCRIPTIONS } from '../utils/constants';

const METRICS = [
  { name: 'Waiting Time', desc: 'Time spent in ready queue waiting for CPU allocation', color: '#63b3ed' },
  { name: 'Turnaround Time', desc: 'Total time from process arrival to completion', color: '#4fd1c5' },
  { name: 'Response Time', desc: 'Time from arrival to first CPU allocation', color: '#f6ad55' },
  { name: 'CPU Utilization', desc: 'Percentage of time CPU is executing processes', color: '#68d391' },
  { name: 'Throughput', desc: 'Number of processes completed per unit time', color: '#b794f4' },
  { name: 'Context Switch', desc: 'Overhead cost when CPU switches between processes', color: '#fc8181' },
];

function Badge({ text, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontFamily: 'Space Mono, monospace', marginRight: 5,
      background: `${color}22`, border: `1px solid ${color}44`, color,
    }}>
      {text}
    </span>
  );
}

function LearnPage() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginBottom: 16 }}>
        {Object.entries(ALGO_META).map(([key, meta]) => (
          <div key={key} style={{
            background: 'rgba(20,27,45,0.9)', border: '1px solid rgba(99,179,237,0.12)',
            borderRadius: 12, padding: '1rem 1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#63b3ed', letterSpacing: 2 }}>{meta.name.toUpperCase()}</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.1)' }} />
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 10 }}>{ALGO_DESCRIPTIONS[key]}</p>
            <div>
              <Badge text={meta.preemptive ? 'Preemptive' : 'Non-preemptive'} color={meta.preemptive ? '#f6ad55' : '#68d391'} />
              <Badge text={meta.starvation ? 'Starvation Risk' : 'Starvation Safe'} color={meta.starvation ? '#fc8181' : '#68d391'} />
              <Badge text={`${meta.overhead} Overhead`} color="#b794f4" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(20,27,45,0.9)', border: '1px solid rgba(99,179,237,0.12)', borderRadius: 12, padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#63b3ed', letterSpacing: 2 }}>KEY METRICS</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.1)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {METRICS.map((m) => (
            <div key={m.name}>
              <div style={{ fontWeight: 600, color: m.color, fontSize: 13, marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Formula reference */}
      <div style={{ background: 'rgba(20,27,45,0.9)', border: '1px solid rgba(99,179,237,0.12)', borderRadius: 12, padding: '1rem 1.25rem', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#63b3ed', letterSpacing: 2 }}>FORMULA REFERENCE</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.1)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {[
            ['Waiting Time', 'Start Time − Arrival Time'],
            ['Turnaround Time', 'Finish Time − Arrival Time'],
            ['Response Time', 'First CPU Time − Arrival Time'],
            ['CPU Utilization', 'Busy Time / Total Time × 100'],
            ['Throughput', 'N processes / Total Time'],
          ].map(([name, formula]) => (
            <div key={name} style={{ background: 'rgba(10,14,26,0.6)', borderRadius: 6, padding: '8px 12px', border: '1px solid rgba(99,179,237,0.08)' }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 3 }}>{name}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#63b3ed' }}>{formula}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LearnPage;
