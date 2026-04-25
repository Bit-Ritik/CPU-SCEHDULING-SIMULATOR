import React, { useState, useCallback } from 'react';
import AlgoSelector from './components/AlgoSelector';
import { ProcessForm, ProcessTable, btnStyle } from './components/ProcessPanel';
import GanttChart from './components/GanttChart';
import Timeline from './components/Timeline';
import StatsPanel from './components/StatsPanel';
import { DetailTable, ComparisonPage } from './components/DetailTable';
import LiveMonitor from './components/LiveMonitor';
import LearnPage from './components/LearnPage';
import SystemMonitor from './components/SystemMonitor';
import { useProcesses, useTimeline } from './hooks/useSimulation';
import { runAlgorithm, computeMetrics } from './algorithms/schedulers';
import { PROCESS_COLORS } from './utils/constants';

const TABS = ['Simulator', 'Compare', 'Live Monitor', 'System Monitor', 'Learn'];

function Panel({ title, children, style }) {
  return (
    <div style={{
      background: 'rgba(20,27,45,0.9)',
      border: '1px solid rgba(99,179,237,0.12)',
      borderRadius: 12,
      padding: '1rem 1.25rem',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
        <span style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 10, color: '#63b3ed',
          letterSpacing: 2, textTransform: 'uppercase',
        }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(99,179,237,0.12)' }} />
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [algo, setAlgo] = useState('fcfs');
  const [quantum, setQuantum] = useState(2);
  const [gantt, setGantt] = useState([]);
  const [results, setResults] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const { processes, counterRef, addProcess, removeProcess, clearAll, loadPreset, randomize } =
    useProcesses(PROCESS_COLORS);

  const maxTime = gantt.length ? Math.max(...gantt.map((g) => g.end)) : 0;
  const { currentTime, playing, play, stop, reset: resetTimeline, seek } = useTimeline(maxTime);

  // Load default preset on mount
  React.useEffect(() => {
    loadPreset('basic', PROCESS_COLORS);
  }, []);

  const nextPid = `P${counterRef.current}`;

  const runSim = useCallback(() => {
    if (!processes.length) return;
    const { gantt: g, results: r } = runAlgorithm(algo, processes, quantum);
    const m = computeMetrics(g, r);
    setGantt(g);
    setResults(r);
    setMetrics(m);
    resetTimeline();
  }, [processes, algo, quantum, resetTimeline]);

  const starvation = metrics?.starvation;
  const contextSwitches = metrics?.contextSwitches ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e2e8f0', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,14,26,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99,179,237,0.12)',
        padding: '0 2rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: '#63b3ed',
            boxShadow: '0 0 8px rgba(99,179,237,0.8)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: '#63b3ed', letterSpacing: 2 }}>
            CPU_SCHED // PRO
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: `1px solid ${activeTab === i ? 'rgba(99,179,237,0.4)' : 'transparent'}`,
              background: activeTab === i ? 'rgba(99,179,237,0.1)' : 'transparent',
              color: activeTab === i ? '#63b3ed' : '#64748b',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#475569' }}>
          CTX SW: <span style={{ color: '#f6ad55', fontWeight: 700 }}>{contextSwitches}</span>
        </div>
      </header>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(99,179,237,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(99,179,237,0); }
        }
        input[type=range] { accent-color: #63b3ed; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0e1a; }
        ::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.3); border-radius: 3px; }
        select { background: #0f1525; color: #e2e8f0; border: 1px solid rgba(99,179,237,0.2); border-radius: 6px; padding: 7px 10px; font-family: inherit; font-size: 13px; outline: none; }
      `}</style>

      <main style={{ maxWidth: 1380, margin: '0 auto', padding: '1.5rem 2rem', position: 'relative', zIndex: 1 }}>

        {/* ── SIMULATOR TAB ── */}
        {activeTab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
            {/* Left column */}
            <div>
              <Panel title="Algorithm" style={{ marginBottom: 12 }}>
                <AlgoSelector selected={algo} quantum={quantum} onSelect={setAlgo} onQuantumChange={setQuantum} />
              </Panel>

              <Panel title="Add Process" style={{ marginBottom: 12 }}>
                <ProcessForm nextPid={nextPid} onAdd={addProcess} />
                <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 10, gap: 0 }}>
                  <button style={btnStyle('#63b3ed')} onClick={() => loadPreset('basic', PROCESS_COLORS)}>Preset: Basic</button>
                  <button style={btnStyle('#b794f4')} onClick={() => loadPreset('stress', PROCESS_COLORS)}>Preset: Stress</button>
                  <button style={btnStyle('#f6ad55')} onClick={() => randomize(PROCESS_COLORS)}>⚡ Random</button>
                  <button style={btnStyle('#fc8181')} onClick={() => { clearAll(); setGantt([]); setResults([]); setMetrics(null); }}>Clear</button>
                </div>
              </Panel>

              <Panel title="Process Queue">
                <ProcessTable processes={processes} onRemove={removeProcess} />
                <div style={{ marginTop: 12 }}>
                  <button onClick={runSim} style={{
                    padding: '9px 22px', borderRadius: 7, fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', border: '1px solid rgba(104,211,145,0.4)',
                    background: 'rgba(104,211,145,0.12)', color: '#68d391',
                    fontFamily: 'inherit', width: '100%', letterSpacing: 0.5,
                    transition: 'all 0.2s',
                  }}>
                    ▶ Run Simulation
                  </button>
                </div>
                {starvation && (
                  <div style={{
                    marginTop: 10, background: 'rgba(252,129,129,0.08)',
                    border: '1px solid rgba(252,129,129,0.25)', borderRadius: 6,
                    padding: '7px 10px', fontSize: 12, color: '#fc8181', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    ⚠ Starvation detected — some processes waited &gt; 20 units
                  </div>
                )}
              </Panel>
            </div>

            {/* Right column */}
            <div>
              <Panel title="Statistics" style={{ marginBottom: 12 }}>
                <StatsPanel metrics={metrics} />
              </Panel>

              <Panel title="Gantt Chart" style={{ marginBottom: 12 }}>
                <Timeline
                  currentTime={currentTime} maxTime={maxTime}
                  playing={playing} onPlay={play} onStop={stop}
                  onReset={resetTimeline} onSeek={seek}
                  contextSwitches={contextSwitches}
                />
                <GanttChart gantt={gantt} results={results} currentTime={currentTime} maxTime={maxTime} />
              </Panel>

              <Panel title="Per-Process Details">
                <DetailTable results={results} />
              </Panel>
            </div>
          </div>
        )}

        {/* ── COMPARE TAB ── */}
        {activeTab === 1 && (
          <div>
            <Panel title="Comparative Analysis" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 0 }}>
                All 6 algorithms are run on your current process set. Results are shown side-by-side.
                Add processes on the Simulator tab first.
              </p>
            </Panel>
            <ComparisonPage processes={processes} quantum={quantum} />
          </div>
        )}

        {/* ── LIVE MONITOR TAB ── */}
        {activeTab === 2 && <LiveMonitor />}

        {/* ── SYSTEM MONITOR TAB ── */}
        {activeTab === 3 && (
          <div>
            <Panel title="Real-Time System Monitor" style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Live stats read from your machine's filesystem —
                CPU per-core, RAM, network I/O, and process table, updated every second.
                Requires <code style={{ color: '#f6ad55', fontSize: 12 }}>node server.js</code> to be running locally.
              </p>
            </Panel>
            <SystemMonitor />
          </div>
        )}

        {/* ── LEARN TAB ── */}
        {activeTab === 4 && <LearnPage />}

      </main>
    </div>
  );
}
