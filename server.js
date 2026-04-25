// server.js — Real-time system monitor backend
// Uses cross-platform Python script for system stats (Windows/Mac/Linux)
// Run: node server.js   (port 3001)

import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3001;

// ── Cross-platform System Monitor (uses Python script) ────────────────────

let lastError = null;
let cachedStats = null;
let lastCacheTime = 0;
const CACHE_DURATION = 2000; // Cache for 2 seconds to reduce Python calls

// Network rate tracking
let lastNetworkTime = null;
let lastNetworkBytes = { sent: 0, recv: 0 };

function getPythonStats() {
  const now = Date.now();
  // Return cached data if still fresh
  if (cachedStats && (now - lastCacheTime) < CACHE_DURATION) {
    return cachedStats;
  }

  try {
    const scriptPath = path.join(__dirname, 'system_monitor.py');
    console.log('Calling Python script at:', scriptPath);
    
    const output = execSync(`python "${scriptPath}"`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname,
      timeout: 15000, // 15 second timeout to allow Python time
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
    });
    
    lastError = null;
    cachedStats = JSON.parse(output);
    lastCacheTime = now;
    console.log('Successfully fetched stats from Python');
    return cachedStats;
  } catch (error) {
    lastError = error.message;
    console.error('❌ Error calling Python script:', error.message);
    
    // Return fallback data
    const fallback = {
      timestamp: new Date().toISOString(),
      cpu: { overall: 0, cores: Array(8).fill(0).map((_, i) => ({ cpu: i, usage: 0 })) },
      memory: { total: 16e9, used: 8e9, available: 8e9, free: 8e9, percent: 50, buffers: 0, cached: 0, swap_total: 2e9, swap_used: 0, swap_percent: 0 },
      network: { bytes_sent: 0, bytes_recv: 0, packets_sent: 0, packets_recv: 0, errin: 0, errout: 0, dropin: 0, dropout: 0 },
      processes: [],
      disk: {},
    };
    return fallback;
  }
}

function getCpuUsage() {
  try {
    const data = getPythonStats();
    const cpuData = data.cpu || {};
    
    // Return array with overall as first element, then individual cores
    const cores = (cpuData.cores || []).map(core => ({
      usage: core.usage,
      index: core.cpu,
    }));
    
    // Insert overall at the beginning
    return [
      { usage: cpuData.overall || 0 },  // First element: overall CPU usage
      ...cores,  // Then individual cores
    ];
  } catch (e) {
    console.error('Error in getCpuUsage:', e.message);
    return [{ usage: 0 }];  // Return at least overall
  }
}

function getMemory() {
  try {
    const data = getPythonStats();
    const mem = data.memory || {};
    return {
      total: mem.total || 0,
      free: mem.free || 0,
      available: mem.available || 0,
      used: mem.used || 0,
      buffers: mem.buffers || 0,
      cached: mem.cached || 0,
      swapTotal: mem.swap_total || 0,
      swapUsed: mem.swap_used || 0,
      usedPercent: mem.percent || 0,
      swapPercent: mem.swap_percent || 0,
    };
  } catch (e) {
    console.error('Error in getMemory:', e.message);
    return { total: 0, free: 0, available: 0, used: 0, buffers: 0, cached: 0, swapTotal: 0, swapUsed: 0, usedPercent: 0, swapPercent: 0 };
  }
}

function getProcesses() {
  try {
    const data = getPythonStats();
    return (data.processes || []).slice(0, 50);
  } catch (e) {
    console.error('Error in getProcesses:', e.message);
    return [];
  }
}

function getLoadAvg() {
  try {
    const data = getPythonStats();
    const load = data.loadAvg || {};
    return {
      one: load.one ?? 0,
      five: load.five ?? 0,
      fifteen: load.fifteen ?? 0,
      runningProcs: 0,
      totalProcs: 0,
    };
  } catch (e) {
    console.error('Error in getLoadAvg:', e.message);
    return {
      one: 0,
      five: 0,
      fifteen: 0,
      runningProcs: 0,
      totalProcs: 0,
    };
  }
}

function getUptime() {
  try {
    const data = getPythonStats();
    return data.uptime ?? 0;
  } catch (e) {
    console.error('Error in getUptime:', e.message);
    return 0;
  }
}

// Helper to get fresh network stats (bypass cache)
function getFreshNetworkStats() {
  try {
    const scriptPath = path.join(__dirname, 'system_monitor.py');
    const output = execSync(`python "${scriptPath}"`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname,
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    const data = JSON.parse(output);
    return data.network || {};
  } catch (e) {
    console.error('Error getting fresh network stats:', e.message);
    return {};
  }
}

function getNetwork() {
  try {
    // Always get fresh network data for accurate rate calculation
    const net = getFreshNetworkStats();
    const now = Date.now();
    
    let rxRate = 0;
    let txRate = 0;
    
    // Calculate rates if we have previous measurements
    if (lastNetworkTime !== null) {
      const timeDelta = (now - lastNetworkTime) / 1000; // seconds
      if (timeDelta > 0.1) {  // Only calculate if >100ms elapsed
        const rxDelta = Math.max(0, (net.bytes_recv || 0) - lastNetworkBytes.recv);
        const txDelta = Math.max(0, (net.bytes_sent || 0) - lastNetworkBytes.sent);
        rxRate = rxDelta / timeDelta;
        txRate = txDelta / timeDelta;
      }
    }
    
    // Update tracking for next calculation
    lastNetworkTime = now;
    lastNetworkBytes = {
      sent: net.bytes_sent || 0,
      recv: net.bytes_recv || 0,
    };
    
    return [{
      name: 'all',
      rxBytes: net.bytes_recv || 0,
      txBytes: net.bytes_sent || 0,
      rxPackets: net.packets_recv || 0,
      txPackets: net.packets_sent || 0,
      rxRate,
      txRate,
    }];
  } catch (e) {
    console.error('Error in getNetwork:', e.message);
    return [{
      name: 'all',
      rxBytes: 0,
      txBytes: 0,
      rxPackets: 0,
      txPackets: 0,
      rxRate: 0,
      txRate: 0,
    }];
  }
}

function getCpuInfo() {
  try {
    const cpus = os.cpus();
    const cores = cpus.length;
    return {
      model: cpus[0]?.model || 'unknown',
      mhz: 0,
      cores,
      cacheSize: 'unknown',
    };
  } catch (e) {
    console.error('Error in getCpuInfo:', e.message);
    return {
      model: 'unknown',
      mhz: 0,
      cores: 1,
      cacheSize: 'unknown',
    };
  }
}

// ── Collect all stats ─────────────────────────────────────────────────────
function collectStats() {
  try {
    return {
      timestamp: Date.now(),
      cpu: getCpuUsage(),
      memory: getMemory(),
      processes: getProcesses(),
      loadAvg: getLoadAvg(),
      uptime: getUptime(),
      network: getNetwork(),
      cpuInfo: getCpuInfo(),
    };
  } catch (e) {
    console.error('Error in collectStats:', e.message);
    return {
      timestamp: Date.now(),
      cpu: [],
      memory: {},
      processes: [],
      loadAvg: {},
      uptime: 0,
      network: [],
      cpuInfo: {},
      error: e.message,
    };
  }
}

// ── HTTP Server ───────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const server = http.createServer((req, res) => {
  try {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      res.end();
      return;
    }

    const url = req.url?.split('?')[0];

    // SSE stream — pushes stats every second
    if (url === '/api/stream') {
      res.writeHead(200, {
        ...CORS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write('retry: 1000\n\n');

      const send = () => {
        try {
          const data = collectStats();
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
          console.error('Stream send error:', e.message);
          res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
        }
      };

      send(); // immediate first push
      const interval = setInterval(send, 1000);
      req.on('close', () => clearInterval(interval));
      return;
    }

    // One-shot snapshot
    if (url === '/api/stats') {
      try {
        const data = collectStats();
        res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (e) {
        console.error('Stats error:', e.message);
        res.writeHead(500, { ...CORS, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    res.writeHead(404, CORS);
    res.end('Not found');
  } catch (e) {
    console.error('Unhandled server error:', e.message);
    res.writeHead(500, CORS);
    res.end('Internal server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  addresses.push(`http://localhost:${PORT}`);
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(`http://${iface.address}:${PORT}`);
      }
    }
  }
  
  console.log(`\n✅ System Monitor API running at:`);
  addresses.forEach(addr => console.log(`   ${addr}`));
  console.log(`\n   GET  /api/stats   — one-shot snapshot`);
  console.log(`   GET  /api/stream  — SSE live stream (1s interval)\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err.message);
  console.error(err.stack);
});
