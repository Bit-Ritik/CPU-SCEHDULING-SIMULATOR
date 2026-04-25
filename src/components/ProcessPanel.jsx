import React, { useState } from 'react';

const inputStyle = {
  width: '100%', padding: '7px 10px',
  background: 'rgba(10,14,26,0.9)',
  border: '1px solid rgba(99,179,237,0.15)',
  borderRadius: 6, color: '#e2e8f0',
  fontFamily: 'inherit', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = { fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 };

function ProcessForm({ nextPid, onAdd }) {
  const [form, setForm] = useState({ pid: nextPid, arrival: 0, burst: 4, priority: 1 });

  React.useEffect(() => {
    setForm((f) => ({ ...f, pid: nextPid }));
  }, [nextPid]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.burst || form.burst < 1) return;
    onAdd({ ...form, arrival: Number(form.arrival), burst: Number(form.burst), priority: Number(form.priority) });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>PID</label>
          <input style={{ ...inputStyle, fontFamily: 'Space Mono, monospace' }}
            value={form.pid} onChange={(e) => set('pid', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Arrival</label>
          <input style={inputStyle} type="number" min="0"
            value={form.arrival} onChange={(e) => set('arrival', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Burst</label>
          <input style={inputStyle} type="number" min="1"
            value={form.burst} onChange={(e) => set('burst', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Priority</label>
          <input style={inputStyle} type="number" min="1"
            value={form.priority} onChange={(e) => set('priority', e.target.value)} />
        </div>
      </div>
      <button onClick={handleAdd} style={btnStyle('#63b3ed')}>+ Add Process</button>
    </div>
  );
}

function ProcessTable({ processes, onRemove }) {
  if (!processes.length) {
    return <div style={{ color: '#334155', fontSize: 13, padding: '10px 0', textAlign: 'center' }}>No processes yet.</div>;
  }
  const th = { padding: '6px 10px', color: '#475569', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid rgba(99,179,237,0.12)', textAlign: 'left', fontWeight: 500 };
  const td = { padding: '6px 10px', borderBottom: '1px solid rgba(99,179,237,0.05)', fontSize: 13 };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={th}></th>
          <th style={th}>PID</th>
          <th style={th}>Arrival</th>
          <th style={th}>Burst</th>
          <th style={th}>Priority</th>
          <th style={th}></th>
        </tr>
      </thead>
      <tbody>
        {processes.map((p, i) => (
          <tr key={i}>
            <td style={td}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: p.color }} /></td>
            <td style={{ ...td, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: p.color }}>{p.pid}</td>
            <td style={td}>{p.arrival}</td>
            <td style={td}>{p.burst}</td>
            <td style={td}>{p.priority}</td>
            <td style={td}>
              <button onClick={() => onRemove(i)}
                style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.25)', color: '#fc8181', fontSize: 11, cursor: 'pointer' }}>
                ✕
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function btnStyle(color, outline = false) {
  return {
    padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', border: `1px solid ${color}55`,
    background: outline ? 'transparent' : `${color}22`,
    color: color, fontFamily: 'inherit', marginRight: 6, marginBottom: 6,
    transition: 'all 0.2s',
  };
}

export { ProcessForm, ProcessTable, btnStyle };
