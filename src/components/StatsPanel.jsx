import React from 'react';

function StatCard({ value, label, variant = 'default' }) {
  const colors = {
    default: '#63b3ed',
    warn: '#f6ad55',
    ok: '#68d391',
    danger: '#fc8181',
    purple: '#b794f4',
  };
  return (
    <div
      style={{
        background: 'rgba(15,21,37,0.8)',
        border: '1px solid rgba(99,179,237,0.12)',
        borderRadius: 8,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 22,
          fontWeight: 700,
          color: colors[variant] || colors.default,
          letterSpacing: '-0.5px',
        }}
      >
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{label}</div>
    </div>
  );
}

function StatsPanel({ metrics }) {
  if (!metrics) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {['Avg Waiting', 'Avg Turnaround', 'CPU Utilization', 'Avg Response', 'Throughput', 'Max Wait'].map((l) => (
          <StatCard key={l} label={l} />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 16,
      }}
    >
      <StatCard value={metrics.avgWait.toFixed(2)} label="Avg Waiting Time" />
      <StatCard value={metrics.avgTurn.toFixed(2)} label="Avg Turnaround" variant="warn" />
      <StatCard value={`${metrics.cpuUtil.toFixed(1)}%`} label="CPU Utilization" variant="ok" />
      <StatCard value={metrics.avgResp.toFixed(2)} label="Avg Response Time" variant="purple" />
      <StatCard value={metrics.throughput.toFixed(3)} label="Throughput (proc/u)" variant="warn" />
      <StatCard value={metrics.maxWait} label="Max Waiting Time" variant={metrics.maxWait > 15 ? 'danger' : 'default'} />
    </div>
  );
}

export default StatsPanel;
