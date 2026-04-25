import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = {
  bytes: (b) => {
    if (!b) return '0 B';
    const units = ['B','KB','MB','GB','TB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return `${(b / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  },
  uptime: (s) => {
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
          m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    if (d) return `${d}d ${h}h ${m}m`;
    if (h) return `${h}h ${m}m ${sec}s`;
    return `${m}m ${sec}s`;
  },
  pct: (v) => `${Number(v).toFixed(1)}%`,
  mhz: (v) => v >= 1000 ? `${(v/1000).toFixed(2)} GHz` : `${v} MHz`,
};

const HISTORY_LEN = 60;
function pushHistory(arr, val) {
  const next = [...arr, val];
  return next.length > HISTORY_LEN ? next.slice(next.length - HISTORY_LEN) : next;
}

const STATE_COLORS = { R: '#68d391', S: '#63b3ed', D: '#f6ad55', Z: '#fc8181', T: '#b794f4' };
const STATE_LABELS = { R: 'Running', S: 'Sleeping', D: 'Waiting', Z: 'Zombie', T: 'Stopped' };

// ── Sub-components ─────────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      background: 'rgba(15,21,37,0.95)', border: '1px solid rgba(99,179,237,0.13)',
      borderRadius: 10, padding: '12px 14px', ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#63b3ed', letterSpacing: 2, textTransform: 'uppercase' }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.12)' }} />
    </div>
  );
}

function Gauge({ value, max = 100, color = '#63b3ed', label, sublabel }) {
  const pct = Math.min(100, (value / max) * 100);
  const danger = pct > 85, warn = pct > 60;
  const c = danger ? '#fc8181' : warn ? '#f6ad55' : color;
  // SVG arc gauge
  const r = 36, cx = 44, cy = 44, stroke = 7;
  const circumference = Math.PI * r; // half circle
  const dash = (pct / 100) * circumference;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={88} height={52} viewBox="0 0 88 52">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(99,179,237,0.1)" strokeWidth={stroke} strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={c} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.5s, stroke 0.3s' }} />
        <text x={cx} y={cy - 2} textAnchor="middle" fill={c}
          style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700 }}>
          {pct.toFixed(0)}%
        </text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginTop: -2 }}>{label}</div>
      {sublabel && <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{sublabel}</div>}
    </div>
  );
}

function SparkLine({ data, color = '#63b3ed', height = 48, max }) {
  if (!data.length) return <div style={{ height }} />;
  const w = 300, h = height;
  const maxVal = max ?? Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (HISTORY_LEN - 1)) * w;
    const y = h - (v / maxVal) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `${0},${h} ` + pts + ` ${w},${h}`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function ProgressBar({ value, max = 100, color = '#63b3ed', height = 6 }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = pct > 85 ? '#fc8181' : pct > 60 ? '#f6ad55' : color;
  return (
    <div style={{ height, background: 'rgba(99,179,237,0.08)', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: height / 2, transition: 'width 0.4s, background 0.3s' }} />
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(99,179,237,0.05)', fontSize: 12 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontFamily: 'Space Mono, monospace', color: color || '#e2e8f0' }}>{value}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
function SystemMonitor() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memHistory, setMemHistory] = useState([]);
  const [rxHistory, setRxHistory] = useState([]);
  const [txHistory, setTxHistory] = useState([]);
  const [procSort, setProcSort] = useState('rss');
  const [procFilter, setProcFilter] = useState('');
  const [showAllProcs, setShowAllProcs] = useState(false);
  const esRef = useRef(null);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();
    setError(null);

    // Determine API URL dynamically based on current host
    const apiHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'localhost'
      : window.location.hostname;
    const apiPort = 3001;
    const apiUrl = `http://${apiHost}:${apiPort}/api/stream`;
    const es = new EventSource(apiUrl);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setStats(data);
        // Overall CPU (first entry is aggregate "cpu")
        const cpuOverall = data.cpu?.[0]?.usage ?? 0;
        setCpuHistory(h => pushHistory(h, cpuOverall));
        setMemHistory(h => pushHistory(h, data.memory?.usedPercent ?? 0));
        const net = data.network?.[0];
        setRxHistory(h => pushHistory(h, net?.rxRate ?? 0));
        setTxHistory(h => pushHistory(h, net?.txRate ?? 0));
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      setError('Cannot connect to backend. Make sure you ran: node server.js');
      es.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, [connect]);

  // ── Not connected UI ──────────────────────────────────────────────────
  if (!connected || error) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🖥️</div>
        <div style={{ fontFamily: 'Space Mono, monospace', color: '#fc8181', fontSize: 14, marginBottom: 12 }}>
          {error || 'Connecting to system backend…'}
        </div>
        <div style={{
          background: 'rgba(15,21,37,0.95)', border: '1px solid rgba(99,179,237,0.15)',
          borderRadius: 10, padding: 20, maxWidth: 480, margin: '0 auto', textAlign: 'left',
        }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#63b3ed', marginBottom: 10, letterSpacing: 2 }}>
            SETUP INSTRUCTIONS
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
            The real-time monitor needs a small backend server running locally
            that reads <code style={{ color: '#63b3ed' }}>/proc</code> filesystem data.
            <br /><br />
            <span style={{ color: '#68d391' }}>1.</span> Make sure you have the project zip extracted<br />
            <span style={{ color: '#68d391' }}>2.</span> Open a terminal in the project folder<br />
            <span style={{ color: '#68d391' }}>3.</span> Run: <code style={{ background: 'rgba(99,179,237,0.1)', padding: '2px 8px', borderRadius: 4, color: '#f6ad55' }}>node server.js</code><br />
            <span style={{ color: '#68d391' }}>4.</span> In another terminal: <code style={{ background: 'rgba(99,179,237,0.1)', padding: '2px 8px', borderRadius: 4, color: '#f6ad55' }}>npm run dev</code>
          </div>
        </div>
        <button onClick={connect} style={{
          marginTop: 20, padding: '8px 24px', borderRadius: 7, fontSize: 13,
          fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(99,179,237,0.4)',
          background: 'rgba(99,179,237,0.1)', color: '#63b3ed', fontFamily: 'inherit',
        }}>
          🔄 Retry Connection
        </button>
      </div>
    );
  }

  if (!stats) return <div style={{ color: '#475569', padding: 40, textAlign: 'center' }}>Loading system data…</div>;

  const mem = stats.memory;
  const cpuCores = stats.cpu?.slice(1) ?? []; // skip aggregate
  const cpuOverall = stats.cpu?.[0]?.usage ?? 0;
  const load = stats.loadAvg;
  const net = stats.network?.[0] ?? {};
  const cpuInfo = stats.cpuInfo ?? {};

  const processes = (stats.processes ?? [])
    .filter(p => !procFilter || p.name.toLowerCase().includes(procFilter.toLowerCase()))
    .sort((a, b) => {
      if (procSort === 'rss') return b.rss - a.rss;
      if (procSort === 'pid') return a.pid - b.pid;
      if (procSort === 'cpu') return (b.utime + b.stime) - (a.utime + a.stime);
      return a.name.localeCompare(b.name);
    });
  const displayProcs = showAllProcs ? processes : processes.slice(0, 12);

  const maxRx = Math.max(...rxHistory, 1024);
  const maxTx = Math.max(...txHistory, 1024);

  // State distribution
  const stateDist = {};
  (stats.processes ?? []).forEach(p => { stateDist[p.state] = (stateDist[p.state] || 0) + 1; });

  return (
    <div>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#68d391', boxShadow: '0 0 6px #68d391' }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#68d391' }}>LIVE</span>
        </div>
        <span style={{ fontSize: 12, color: '#475569' }}>Uptime: <span style={{ color: '#94a3b8' }}>{fmt.uptime(stats.uptime)}</span></span>
        <span style={{ fontSize: 12, color: '#475569' }}>CPU: <span style={{ color: '#94a3b8' }}>{cpuInfo.model} @ {fmt.mhz(cpuInfo.mhz)}</span></span>
        <span style={{ fontSize: 12, color: '#475569' }}>Cores: <span style={{ color: '#94a3b8' }}>{cpuInfo.cores}</span></span>
      </div>

      {/* Row 1 — Gauges + Sparklines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
        {/* CPU */}
        <Card>
          <SectionTitle>CPU Usage</SectionTitle>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <Gauge value={cpuOverall} label="Overall" sublabel={`${cpuOverall.toFixed(1)}%`} color="#63b3ed" />
          </div>
          <SparkLine data={cpuHistory} color="#63b3ed" height={40} max={100} />
          <div style={{ marginTop: 8 }}>
            {cpuCores.map((core, i) => (
              <div key={i} style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginBottom: 2 }}>
                  <span>Core {i}</span><span style={{ color: '#63b3ed' }}>{core.usage.toFixed(1)}%</span>
                </div>
                <ProgressBar value={core.usage} color="#63b3ed" height={4} />
              </div>
            ))}
          </div>
        </Card>

        {/* Memory */}
        <Card>
          <SectionTitle>Memory</SectionTitle>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <Gauge value={mem.usedPercent} label="RAM Used" sublabel={`${fmt.bytes(mem.used)} / ${fmt.bytes(mem.total)}`} color="#4fd1c5" />
          </div>
          <SparkLine data={memHistory} color="#4fd1c5" height={40} max={100} />
          <div style={{ marginTop: 8 }}>
            <StatRow label="Used" value={fmt.bytes(mem.used)} color="#4fd1c5" />
            <StatRow label="Free" value={fmt.bytes(mem.free)} color="#68d391" />
            <StatRow label="Available" value={fmt.bytes(mem.available)} />
            <StatRow label="Buffers" value={fmt.bytes(mem.buffers)} />
            <StatRow label="Cached" value={fmt.bytes(mem.cached)} />
            {mem.swapTotal > 0 && <>
              <StatRow label="Swap Total" value={fmt.bytes(mem.swapTotal)} />
              <StatRow label="Swap Used" value={fmt.bytes(mem.swapUsed)} color={mem.swapPercent > 50 ? '#fc8181' : '#f6ad55'} />
            </>}
          </div>
        </Card>

        {/* Network */}
        <Card>
          <SectionTitle>Network — {net.name || 'eth0'}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: 'rgba(10,14,26,0.6)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>▼ RX Rate</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: '#68d391', fontWeight: 700 }}>{fmt.bytes(net.rxRate || 0)}/s</div>
            </div>
            <div style={{ background: 'rgba(10,14,26,0.6)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>▲ TX Rate</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: '#63b3ed', fontWeight: 700 }}>{fmt.bytes(net.txRate || 0)}/s</div>
            </div>
          </div>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: '#68d391', marginBottom: 3 }}>▼ Receive</div>
            <SparkLine data={rxHistory} color="#68d391" height={32} max={maxRx} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#63b3ed', marginBottom: 3 }}>▲ Transmit</div>
            <SparkLine data={txHistory} color="#63b3ed" height={32} max={maxTx} />
          </div>
          <div style={{ marginTop: 8 }}>
            <StatRow label="Total RX" value={fmt.bytes(net.rxBytes || 0)} color="#68d391" />
            <StatRow label="Total TX" value={fmt.bytes(net.txBytes || 0)} color="#63b3ed" />
            <StatRow label="RX Packets" value={(net.rxPackets || 0).toLocaleString()} />
            <StatRow label="TX Packets" value={(net.txPackets || 0).toLocaleString()} />
          </div>
        </Card>
      </div>

      {/* Row 2 — Process Table */}
      <Card>
        <SectionTitle>Process Table</SectionTitle>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Filter by name…"
            value={procFilter}
            onChange={e => setProcFilter(e.target.value)}
            style={{
              padding: '5px 10px', background: 'rgba(10,14,26,0.8)',
              border: '1px solid rgba(99,179,237,0.15)', borderRadius: 5,
              color: '#e2e8f0', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 160,
            }}
          />
          <span style={{ fontSize: 11, color: '#475569' }}>Sort by:</span>
          {[['rss', 'Memory'], ['cpu', 'CPU Time'], ['pid', 'PID'], ['name', 'Name']].map(([key, label]) => (
            <button key={key} onClick={() => setProcSort(key)} style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
              border: `1px solid ${procSort === key ? 'rgba(99,179,237,0.4)' : 'rgba(99,179,237,0.1)'}`,
              background: procSort === key ? 'rgba(99,179,237,0.1)' : 'transparent',
              color: procSort === key ? '#63b3ed' : '#64748b', fontFamily: 'inherit',
            }}>
              {label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#475569' }}>
            {processes.length} process{processes.length !== 1 ? 'es' : ''}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['PID','Name','State','Threads','Memory','CPU Time','Memory Bar'].map(h => (
                  <th key={h} style={{
                    padding: '6px 10px', textAlign: 'left',
                    color: '#475569', fontSize: 10, letterSpacing: 1,
                    borderBottom: '1px solid rgba(99,179,237,0.1)', fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayProcs.map((p, i) => {
                const sc = STATE_COLORS[p.state] || '#64748b';
                const maxRss = processes[0]?.rss || 1;
                return (
                  <tr key={p.pid} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(99,179,237,0.02)' }}>
                    <td style={{ padding: '5px 10px', fontFamily: 'Space Mono, monospace', color: '#64748b' }}>{p.pid}</td>
                    <td style={{ padding: '5px 10px', color: '#e2e8f0', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '5px 10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc, display: 'inline-block' }} />
                        <span style={{ color: sc, fontSize: 11 }}>{STATE_LABELS[p.state] || p.state}</span>
                      </span>
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'Space Mono, monospace', color: '#64748b' }}>{p.threads}</td>
                    <td style={{ padding: '5px 10px', fontFamily: 'Space Mono, monospace', color: p.rss > 100 * 1024 * 1024 ? '#f6ad55' : '#94a3b8' }}>{fmt.bytes(p.rss)}</td>
                    <td style={{ padding: '5px 10px', fontFamily: 'Space Mono, monospace', color: '#64748b' }}>{((p.utime + p.stime) / 100).toFixed(1)}s</td>
                    <td style={{ padding: '5px 10px', minWidth: 80 }}>
                      <ProgressBar value={p.rss} max={maxRss} color="#4fd1c5" height={4} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {processes.length > 12 && (
          <button onClick={() => setShowAllProcs(v => !v)} style={{
            marginTop: 10, padding: '5px 14px', borderRadius: 5, fontSize: 12,
            cursor: 'pointer', border: '1px solid rgba(99,179,237,0.2)',
            background: 'transparent', color: '#63b3ed', fontFamily: 'inherit',
          }}>
            {showAllProcs ? '▲ Show Less' : `▼ Show All (${processes.length})`}
          </button>
        )}
      </Card>
    </div>
  );
}

export default SystemMonitor;
