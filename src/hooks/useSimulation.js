import { useState, useRef, useCallback, useEffect } from 'react';

// ── useSimulation ─────────────────────────────────────────────────────────────
export function useSimulation() {
  const [gantt, setGantt] = useState([]);
  const [results, setResults] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const run = useCallback((algo, processes, quantum, runAlgorithm, computeMetrics) => {
    if (!processes.length) return;
    const { gantt: g, results: r } = runAlgorithm(algo, processes, quantum);
    const m = computeMetrics(g, r);
    setGantt(g);
    setResults(r);
    setMetrics(m);
  }, []);

  const clear = useCallback(() => {
    setGantt([]);
    setResults([]);
    setMetrics(null);
  }, []);

  return { gantt, results, metrics, run, clear };
}

// ── useTimeline ───────────────────────────────────────────────────────────────
export function useTimeline(maxTime) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef(null);
  const lastRef = useRef(null);

  const stop = useCallback(() => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    setCurrentTime(0);
  }, [stop]);

  const seek = useCallback((pct) => {
    setCurrentTime(pct * maxTime);
  }, [maxTime]);

  useEffect(() => {
    if (!playing) return;
    const step = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const delta = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setCurrentTime((t) => {
        const next = t + delta * (maxTime / 8);
        if (next >= maxTime) { stop(); return maxTime; }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastRef.current = null; };
  }, [playing, maxTime, stop]);

  const play = useCallback(() => {
    if (currentTime >= maxTime) setCurrentTime(0);
    setPlaying(true);
  }, [currentTime, maxTime]);

  return { currentTime, playing, play, stop, reset, seek };
}

// ── useProcesses ──────────────────────────────────────────────────────────────
export function useProcesses(initialColors) {
  const [processes, setProcesses] = useState([]);
  const counterRef = useRef(1);

  const addProcess = useCallback(({ pid, arrival, burst, priority }) => {
    const color = initialColors[(processes.length) % initialColors.length];
    setProcesses((prev) => [...prev, { pid, arrival, burst, priority, color }]);
    counterRef.current++;
  }, [processes.length, initialColors]);

  const removeProcess = useCallback((idx) => {
    setProcesses((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearAll = useCallback(() => {
    setProcesses([]);
    counterRef.current = 1;
  }, []);

  const loadPreset = useCallback((preset, colors) => {
    const presets = {
      basic: [
        { pid: 'P1', arrival: 0, burst: 5, priority: 3 },
        { pid: 'P2', arrival: 1, burst: 3, priority: 1 },
        { pid: 'P3', arrival: 2, burst: 8, priority: 4 },
        { pid: 'P4', arrival: 3, burst: 2, priority: 2 },
      ],
      stress: Array.from({ length: 8 }, (_, i) => ({
        pid: `P${i + 1}`,
        arrival: i,
        burst: Math.floor(Math.random() * 10) + 1,
        priority: Math.floor(Math.random() * 5) + 1,
      })),
    };
    const data = presets[preset] || [];
    setProcesses(data.map((p, i) => ({ ...p, color: colors[i % colors.length] })));
    counterRef.current = data.length + 1;
  }, []);

  const randomize = useCallback((colors) => {
    const n = Math.floor(Math.random() * 5) + 3;
    const data = Array.from({ length: n }, (_, i) => ({
      pid: `P${i + 1}`,
      arrival: Math.floor(Math.random() * 8),
      burst: Math.floor(Math.random() * 9) + 1,
      priority: Math.floor(Math.random() * 5) + 1,
      color: colors[i % colors.length],
    }));
    setProcesses(data);
    counterRef.current = n + 1;
  }, []);

  return { processes, counterRef, addProcess, removeProcess, clearAll, loadPreset, randomize };
}
