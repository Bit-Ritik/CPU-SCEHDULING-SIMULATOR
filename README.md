# CPU Scheduling Simulator Pro — React

A full-featured CPU scheduling simulator with **real-time system monitoring** built with React + Vite.

## 🚀 Quick Start

```bash
npm install

# Option A — Run everything together (recommended)
npm start

# Option B — Run separately in two terminals
node server.js      # Terminal 1: system monitor backend (port 3001)
npm run dev         # Terminal 2: React frontend (port 5173)
```

Then open → **http://localhost:5173**

## 🖥️ System Monitor

The **System Monitor** tab reads live data directly from your Linux `/proc` filesystem via a Node.js backend (`server.js`).

**What it shows:**
- 🔵 CPU usage per-core with sparkline history (60s)
- 🟢 RAM — used, free, available, buffers, cached, swap
- 📡 Network I/O — RX/TX rate + totals per interface
- 📊 Load average (1m, 5m, 15m)
- ⚙️ Process table — sortable by memory/CPU/PID/name, filterable
- 🔴 Process state distribution (Running/Sleeping/Zombie/etc.)

**Backend API:**
```
GET http://localhost:3001/api/stats   → one-shot snapshot (JSON)
GET http://localhost:3001/api/stream  → SSE live stream (1s interval)
```

> **Note:** Requires Linux. The backend reads `/proc/stat`, `/proc/meminfo`, `/proc/net/dev`, `/proc/[pid]/status` etc.

## 🗂 Project Structure

```
cpu-scheduler-react/
├── server.js                        ← Node.js backend (real /proc reader)
├── src/
│   ├── algorithms/schedulers.js     ← All 8 scheduling algorithms + metrics
│   ├── components/
│   │   ├── SystemMonitor.jsx        ← Real-time system monitor UI
│   │   ├── AlgoSelector.jsx         ← Algorithm picker
│   │   ├── DetailTable.jsx          ← Per-process results + comparison
│   │   ├── GanttChart.jsx           ← Animated Gantt chart
│   │   ├── LearnPage.jsx            ← Algorithm reference
│   │   ├── LiveMonitor.jsx          ← Simulated CPU monitor
│   │   ├── ProcessPanel.jsx         ← Process queue management
│   │   ├── StatsPanel.jsx           ← Metric stat cards
│   │   └── Timeline.jsx             ← Play/pause/seek animation
│   ├── hooks/useSimulation.js       ← Custom React hooks
│   ├── utils/constants.js           ← Colors, algo metadata
│   ├── App.jsx                      ← Root component + tab routing
│   └── main.jsx                     ← React entry point
├── index.html
├── vite.config.js
└── package.json
```

## ✨ Features

| Tab | Feature |
|---|---|
| **Simulator** | 8 algorithms, Gantt chart, animated timeline, stats, starvation detection |
| **Compare** | All 8 algos side-by-side with visual bar chart |
| **Live Monitor** | Simulated CPU with heatmap + throughput chart |
| **System Monitor** | Real /proc data — CPU, RAM, Network, Processes |
| **Learn** | Algorithm explanations + formula reference |
