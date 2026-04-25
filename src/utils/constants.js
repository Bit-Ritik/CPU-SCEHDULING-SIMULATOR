export const PROCESS_COLORS = [
  '#63b3ed', '#4fd1c5', '#f6ad55', '#fc8181',
  '#b794f4', '#68d391', '#f687b3', '#76e4f7',
  '#fbd38d', '#a3bffa', '#fca5a5', '#6ee7b7',
];

export const ALGO_META = {
  fcfs:      { name: 'FCFS',        full: 'First Come First Served', preemptive: false, starvation: false, overhead: 'Low' },
  sjf:       { name: 'SJF',         full: 'Shortest Job First',       preemptive: false, starvation: true,  overhead: 'Low' },
  srtf:      { name: 'SRTF',        full: 'Shortest Remaining Time',  preemptive: true,  starvation: true,  overhead: 'High' },
  rr:        { name: 'Round Robin', full: 'Round Robin',              preemptive: true,  starvation: false, overhead: 'Medium' },
  priority:  { name: 'Priority',    full: 'Priority (Non-preemptive)',preemptive: false, starvation: true,  overhead: 'Low' },
  priorityP: { name: 'Priority P',  full: 'Priority (Preemptive)',    preemptive: true,  starvation: true,  overhead: 'High' },
};

export const ALGO_DESCRIPTIONS = {
  fcfs:      'Processes execute in arrival order. Simple but can cause convoy effect when long processes block short ones.',
  sjf:       'Selects the process with the shortest burst time from the ready queue. Optimal average waiting time but may starve long processes.',
  srtf:      'Preemptive SJF — if a new process arrives with shorter remaining time, it preempts the current one. Theoretically optimal.',
  rr:        'Each process gets a fixed time quantum. After expiry, it is preempted and moved to the back of the queue. Fair and starvation-free.',
  priority:  'Highest-priority process runs first. Lower-priority processes may starve without an aging mechanism.',
  priorityP: 'Priority scheduling with preemption — a higher-priority arrival immediately preempts the running process.',
};

export const DEFAULT_PROCESSES = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 3 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1 },
  { pid: 'P3', arrival: 2, burst: 8, priority: 4 },
  { pid: 'P4', arrival: 3, burst: 2, priority: 2 },
];
