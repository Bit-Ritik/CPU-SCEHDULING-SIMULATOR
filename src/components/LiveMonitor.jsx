import React, { useState, useEffect, useRef } from 'react';
import { PROCESS_COLORS } from '../utils/constants';

function LiveMonitor() {
  const [running, setRunning] = useState(false);
  const [arrivalRate, setArrivalRate] = useState(1.0);
  const [maxBurst, setMaxBurst] = useState(8);
  const [queue, setQueue] = useState([]);
  const [heatmap, setHeatmap] = useState(new Array(64).fill(0));
  const [throughputData, setThroughputData] = useState([]);
  const [completed, setCompleted] = useState(0);
  const [tick, setTick] = useState(0);
  const pidRef = useRef(1);
  const intervalRef = useRef(null);

  const stop = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
  };

  const reset = () => {
    stop();
    setQueue([]); setHeatmap(new Array(64).fill(0));
    setThroughputData([]); setCompleted(0); setTick(0);
    pidRef.current = 1;
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTick((t) => {
        const newT = t + 1;
        // Maybe spawn a new process
        setQueue((q) => {
          let next = [...q];
          if (Math.random() < arrivalRate * 0.25) {
            next.push({
              pid: `LP${pidRef.current++}`,
              burst: Math.floor(Math.random() * maxBurst) + 1,
              rem: Math.floor(Math.random() * maxBurst) + 1,
              color: PROCESS_COLORS[pidRef.current % PROCESS_COLORS.length],
            });
          }
          // Process one unit from front
          if (next.length) {
            next[0] = { ...next[0], rem: next[0].rem - 1 };
            if (next[0].rem <= 0) {
              setCompleted((c) => c + 1);
              next = next.slice(1);
            }
          }
          return next.slice(0, 20);
        });

        // Heatmap
        setHeatmap((h) => {
          const val = Math.random() > 0.3 ? Math.random() * 0.5 + 0.5 : Math.random() * 0.15;
          return [...h.slice(1), val];
        });

        // Throughput
        setThroughputData((d) => {
          const arr = [...d, { t: newT, v: (completed / Math.max(newT, 1)).toFixed(3) }];
          return arr.slice(-40);
        });

        return newT;
      });
    }, 250);
    return () => clearInterval(intervalRef.current);
  }, [running, arrivalRate, maxBurst]);

  const sliderLabel = { fontSize: 12, color: '#64748b', marginBottom: 3, display: 'block' };
  const inputStyle = { width: '100%', accentColor: '#63b3ed' };
  const btnBase = { padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Config */}
      <div>
        <Panel title="Config">
          <label style={sliderLabel}>Arrival Rate: <Val>{arrivalRate.toFixed(1)}</Val></label>
          <input type="range" min="0.1" max="3" step="0.1" value={arrivalRate} style={inputStyle}
            onChange={(e) => setArrivalRate(parseFloat(e.target.value))} />
          <br /><br />
          <label style={sliderLabel}>Max Burst: <Val>{maxBurst}</Val></label>
          <input type="range" min="2" max="20" step="1" value={maxBurst} style={inputStyle}
            onChange={(e) => setMaxBurst(Number(e.target.value))} />
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button style={{ ...btnBase, background: running ? 'rgba(252,129,129,0.1)' : 'rgba(104,211,145,0.1)', borderColor: running ? 'rgba(252,129,129,0.3)' : 'rgba(104,211,145,0.3)', color: running ? '#fc8181' : '#68d391' }}
              onClick={() => running ? stop() : setRunning(true)}>
              {running ? '⏹ Stop' : '▶ Start'}
            </button>
            <button style={{ ...btnBase, background: 'rgba(99,179,237,0.08)', borderColor: 'rgba(99,179,237,0.2)', color: '#63b3ed' }} onClick={reset}>Reset</button>
          </div>
        </Panel>

        <Panel title="Queue" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <Stat label="Running" val={running ? '●' : '○'} color={running ? '#68d391' : '#475569'} />
            <Stat label="Completed" val={completed} color="#63b3ed" />
            <Stat label="Queued" val={queue.length} color="#f6ad55" />
          </div>
          <div style={{ minHeight: 80 }}>
            {queue.length === 0 && <div style={{ color: '#334155', fontSize: 12 }}>CPU idle</div>}
            {queue.slice(0, 6).map((p, i) => (
              <div key={p.pid} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: p.color, width: 40, flexShrink: 0 }}>{p.pid}</span>
                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <div style={{ width: `${Math.round((p.rem / p.burst) * 100)}%`, height: '100%', background: p.color, borderRadius: 3, transition: 'width 0.25s' }} />
                </div>
                <span style={{ fontSize: 10, color: '#475569', minWidth: 24 }}>{p.rem}u</span>
              </div>
            ))}
            {queue.length > 6 && <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>+{queue.length - 6} more in queue</div>}
          </div>
        </Panel>
      </div>

      {/* Monitor */}
      <div>
        <Panel title="CPU Activity Heatmap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 3 }}>
            {heatmap.map((v, i) => (
              <div key={i} style={{ height: 18, borderRadius: 2, background: `rgba(99,179,237,${Math.min(0.9, Math.max(0.05, v)).toFixed(2)})`, transition: 'background 0.25s' }} title={`${(v * 100).toFixed(0)}%`} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', fontSize: 11, color: '#475569' }}>
            <span>Idle</span>
            {[0.1, 0.35, 0.6, 0.9].map((a) => <div key={a} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(99,179,237,${a})` }} />)}
            <span>Busy</span>
          </div>
        </Panel>

        <Panel title="Throughput Over Time" style={{ marginTop: 12 }}>
          <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {throughputData.map((d, i) => {
              const maxV = Math.max(...throughputData.map((x) => parseFloat(x.v)), 0.01);
              const h = (parseFloat(d.v) / maxV) * 100;
              return <div key={i} style={{ flex: 1, height: `${h}%`, background: 'rgba(99,179,237,0.5)', borderRadius: '2px 2px 0 0', transition: 'height 0.25s', minWidth: 3 }} />;
            })}
            {!throughputData.length && <div style={{ color: '#334155', fontSize: 13, margin: 'auto' }}>Start monitor to see data</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, style }) {
  return (
    <div style={{ background: 'rgba(20,27,45,0.9)', border: '1px solid rgba(99,179,237,0.12)', borderRadius: 12, padding: '1rem 1.25rem', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#63b3ed', letterSpacing: 2, textTransform: 'uppercase' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.12)' }} />
      </div>
      {children}
    </div>
  );
}

function Stat({ label, val, color }) {
  return (
    <div style={{ background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(99,179,237,0.08)', borderRadius: 6, padding: '5px 10px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Space Mono, monospace', color, fontSize: 14, fontWeight: 700 }}>{val}</div>
      <div style={{ fontSize: 10, color: '#475569' }}>{label}</div>
    </div>
  );
}

function Val({ children }) {
  return <span style={{ color: '#63b3ed', fontFamily: 'Space Mono, monospace' }}>{children}</span>;
}

export default LiveMonitor;
