# CPU Scheduling Simulator

Interactive CPU scheduling simulator built with React + Vite, with a live system monitor powered by Node.js + Python (`psutil`).

## Overview

This project includes:

- A scheduling simulator with timeline playback and Gantt chart visualization
- A comparison view for all implemented scheduling algorithms
- A simulated live monitor panel
- A real system monitor panel that reads machine stats from a Python script
- A learning/reference page for algorithm concepts

## Implemented Algorithms

The simulator currently implements 6 algorithms:

1. FCFS
2. SJF (non-preemptive)
3. SRTF (preemptive)
4. Round Robin
5. Priority (non-preemptive)
6. Priority (preemptive)

## Tech Stack

- Frontend: React 18, Vite
- Backend API: Node.js HTTP server (`server.js`)
- System stats collector: Python script (`system_monitor.py`) using `psutil`

## Prerequisites

- Node.js 18+
- Python 3.9+
- `psutil` Python package

## Setup

Install Node dependencies:

```bash
npm install
```

Install Python dependency:

```bash
python -m pip install psutil
```

If you use a virtual environment, install `psutil` inside that environment.

## Run

Run frontend + backend together (recommended):

```bash
npm start
```

Or run them separately:

```bash
# Terminal 1
node server.js

# Terminal 2
npm run dev
```

Open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Endpoints

- `GET /api/stats` - One-shot JSON snapshot
- `GET /api/stream` - Server-Sent Events stream (1 second updates)

## Project Structure

```text
CPU-SCEHDULING-SIMULATOR/
|-- server.js
|-- system_monitor.py
|-- package.json
|-- index.html
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   |-- algorithms/
|   |   `-- schedulers.js
|   |-- components/
|   |   |-- AlgoSelector.jsx
|   |   |-- DetailTable.jsx
|   |   |-- GanttChart.jsx
|   |   |-- LearnPage.jsx
|   |   |-- LiveMonitor.jsx
|   |   |-- ProcessPanel.jsx
|   |   |-- StatsPanel.jsx
|   |   |-- SystemMonitor.jsx
|   |   `-- Timeline.jsx
|   |-- hooks/
|   |   `-- useSimulation.js
|   `-- utils/
|       `-- constants.js
`-- vite.config.js
```

## ✨ Features

| Tab | Feature |
|---|---|
| **Simulator** | 6 algorithms, Gantt chart, animated timeline, stats, starvation detection |
| **Compare** | All 6 algos side-by-side with visual bar chart |
| **Live Monitor** | Simulated CPU with heatmap + throughput chart |
| **System Monitor** | Real /proc data — CPU, RAM, Network, Processes |
| **Learn** | Algorithm explanations + formula reference |
