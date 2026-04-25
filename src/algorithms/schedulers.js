// ─── CPU Scheduling Algorithms ────────────────────────────────────────────────
// Each function takes an array of process objects:
// { pid, arrival, burst, priority, color }
// Returns { gantt: [{pid, start, end, color}], results: [{...process, start, finish, wait, turn, resp}] }

const deepCopy = (arr) => arr.map((p) => ({ ...p }));

// ── FCFS ────────────────────────────────────────────────────────────────────
export function fcfs(processes) {
  const ps = deepCopy(processes).sort((a, b) => a.arrival - b.arrival);
  let t = 0;
  const gantt = [], results = [];
  for (const p of ps) {
    if (t < p.arrival) t = p.arrival;
    const start = t, finish = t + p.burst;
    gantt.push({ pid: p.pid, start, end: finish, color: p.color });
    results.push({ ...p, start, finish, wait: start - p.arrival, turn: finish - p.arrival, resp: start - p.arrival });
    t = finish;
  }
  return { gantt, results };
}

// ── SJF (Non-preemptive) ─────────────────────────────────────────────────────
export function sjf(processes) {
  const rem = deepCopy(processes).sort((a, b) => a.arrival - b.arrival);
  let t = 0;
  const gantt = [], results = [];
  while (rem.length) {
    const avail = rem.filter((p) => p.arrival <= t);
    if (!avail.length) { t = rem[0].arrival; continue; }
    const p = avail.reduce((a, b) => (a.burst < b.burst ? a : b));
    rem.splice(rem.indexOf(p), 1);
    const start = t, finish = t + p.burst;
    gantt.push({ pid: p.pid, start, end: finish, color: p.color });
    results.push({ ...p, start, finish, wait: start - p.arrival, turn: finish - p.arrival, resp: start - p.arrival });
    t = finish;
  }
  return { gantt, results };
}

// ── SRTF (Preemptive SJF) ────────────────────────────────────────────────────
export function srtf(processes) {
  const ps = deepCopy(processes).map((p) => ({ ...p, rem: p.burst, start: -1 }));
  let t = 0;
  const gantt = [], results = [];
  while (ps.some((p) => p.rem > 0)) {
    const avail = ps.filter((p) => p.arrival <= t && p.rem > 0);
    if (!avail.length) { t++; continue; }
    const p = avail.reduce((a, b) => (a.rem < b.rem ? a : b));
    if (p.start === -1) p.start = t;
    const last = gantt[gantt.length - 1];
    if (last && last.pid === p.pid) last.end++;
    else gantt.push({ pid: p.pid, start: t, end: t + 1, color: p.color });
    p.rem--;
    if (p.rem === 0) {
      const finish = t + 1;
      results.push({ ...p, finish, wait: finish - p.arrival - p.burst, turn: finish - p.arrival, resp: p.start - p.arrival });
    }
    t++;
    if (t > 2000) break;
  }
  return { gantt, results };
}

// ── Round Robin ──────────────────────────────────────────────────────────────
export function roundRobin(processes, quantum = 2) {
  const ps = deepCopy(processes).map((p) => ({ ...p, rem: p.burst, start: -1 })).sort((a, b) => a.arrival - b.arrival);
  let t = 0;
  const gantt = [], results = [], done = [], queue = [];
  const remaining = [...ps];

  while (remaining.some((p) => p.rem > 0) || queue.length) {
    for (const p of remaining) {
      if (p.arrival <= t && !queue.includes(p) && p.rem > 0 && !done.includes(p)) queue.push(p);
    }
    if (!queue.length) { t++; continue; }
    const p = queue.shift();
    if (p.start === -1) p.start = t;
    const run = Math.min(quantum, p.rem);
    gantt.push({ pid: p.pid, start: t, end: t + run, color: p.color });
    t += run;
    p.rem -= run;
    for (const r of remaining) {
      if (r.arrival > t - run && r.arrival <= t && !queue.includes(r) && r.rem > 0 && !done.includes(r)) queue.push(r);
    }
    if (p.rem > 0) queue.push(p);
    else {
      done.push(p);
      results.push({ ...p, finish: t, wait: t - p.arrival - p.burst, turn: t - p.arrival, resp: p.start - p.arrival });
    }
    if (t > 2000) break;
  }
  return { gantt, results };
}

// ── Priority (Non-preemptive) ────────────────────────────────────────────────
export function priority(processes) {
  const rem = deepCopy(processes).sort((a, b) => a.arrival - b.arrival);
  let t = 0;
  const gantt = [], results = [];
  while (rem.length) {
    const avail = rem.filter((p) => p.arrival <= t);
    if (!avail.length) { t = rem[0].arrival; continue; }
    const p = avail.reduce((a, b) => (a.priority < b.priority ? a : b));
    rem.splice(rem.indexOf(p), 1);
    const start = t, finish = t + p.burst;
    gantt.push({ pid: p.pid, start, end: finish, color: p.color });
    results.push({ ...p, start, finish, wait: start - p.arrival, turn: finish - p.arrival, resp: start - p.arrival });
    t = finish;
  }
  return { gantt, results };
}

// ── Priority Preemptive ───────────────────────────────────────────────────────
export function priorityPreemptive(processes) {
  const ps = deepCopy(processes).map((p) => ({ ...p, rem: p.burst, start: -1 }));
  let t = 0;
  const gantt = [], results = [];
  while (ps.some((p) => p.rem > 0)) {
    const avail = ps.filter((p) => p.arrival <= t && p.rem > 0);
    if (!avail.length) { t++; continue; }
    const p = avail.reduce((a, b) => (a.priority < b.priority ? a : b));
    if (p.start === -1) p.start = t;
    const last = gantt[gantt.length - 1];
    if (last && last.pid === p.pid) last.end++;
    else gantt.push({ pid: p.pid, start: t, end: t + 1, color: p.color });
    p.rem--;
    if (p.rem === 0) {
      results.push({ ...p, finish: t + 1, wait: t + 1 - p.arrival - p.burst, turn: t + 1 - p.arrival, resp: p.start - p.arrival });
    }
    t++;
    if (t > 2000) break;
  }
  return { gantt, results };
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function runAlgorithm(algo, processes, quantum = 2) {
  switch (algo) {
    case 'fcfs': return fcfs(processes);
    case 'sjf': return sjf(processes);
    case 'srtf': return srtf(processes);
    case 'rr': return roundRobin(processes, quantum);
    case 'priority': return priority(processes);
    case 'priorityP': return priorityPreemptive(processes);
    default: return fcfs(processes);
  }
}

// ── Metrics ──────────────────────────────────────────────────────────────────
export function computeMetrics(gantt, results) {
  if (!results.length) return null;
  const n = results.length;
  const avgWait = results.reduce((s, r) => s + r.wait, 0) / n;
  const avgTurn = results.reduce((s, r) => s + r.turn, 0) / n;
  const avgResp = results.reduce((s, r) => s + r.resp, 0) / n;
  const maxWait = Math.max(...results.map((r) => r.wait));
  const totalTime = Math.max(...gantt.map((g) => g.end));
  const busyTime = gantt.reduce((s, g) => s + (g.end - g.start), 0);
  const cpuUtil = (busyTime / totalTime) * 100;
  const throughput = n / totalTime;
  let contextSwitches = 0;
  for (let i = 1; i < gantt.length; i++) if (gantt[i].pid !== gantt[i - 1].pid) contextSwitches++;
  const starvation = maxWait > 20;
  return { avgWait, avgTurn, avgResp, maxWait, cpuUtil, throughput, contextSwitches, totalTime, starvation };
}
