#!/usr/bin/env python3
"""
Cross-platform system monitor - reads CPU, memory, network, and process data
Works on Windows, Linux, macOS
"""

import json
import psutil
import sys
import os
import time

# Disable output buffering
os.environ['PYTHONUNBUFFERED'] = '1'

# Global state for tracking previous measurements
_last_net_time = None
_last_net_counters = None

def get_cpu_usage():
    """Get per-core CPU usage with small measurement interval"""
    try:
        # Use a small interval (0.1s) to get actual CPU measurement
        per_core_raw = psutil.cpu_percent(interval=0.1, percpu=True)
        overall = sum(per_core_raw) / len(per_core_raw) if per_core_raw else 0
        
        return {
            'overall': max(0, min(100, overall)),
            'cores': [{'cpu': i, 'usage': max(0, min(100, usage))} for i, usage in enumerate(per_core_raw)]
        }
    except Exception as e:
        return {
            'overall': 0,
            'cores': [{'cpu': i, 'usage': 0} for i in range(psutil.cpu_count())]
        }

def get_load_average():
    """Get load average - works on Windows with psutil"""
    try:
        avg = psutil.getloadavg()  # Returns (1m, 5m, 15m)
        return {
            'one': avg[0],
            'five': avg[1],
            'fifteen': avg[2],
        }
    except (OSError, AttributeError):
        # Fallback for systems without getloadavg
        return {
            'one': 0.0,
            'five': 0.0,
            'fifteen': 0.0,
        }

def get_memory():
    """Get memory statistics"""
    vm = psutil.virtual_memory()
    swap = psutil.swap_memory()
    return {
        'total': vm.total,
        'used': vm.used,
        'available': vm.available,
        'free': vm.free,
        'percent': vm.percent,
        'buffers': getattr(vm, 'buffers', 0),  # Not available on Windows
        'cached': getattr(vm, 'cached', 0),   # Not available on Windows
        'swap_total': swap.total,
        'swap_used': swap.used,
        'swap_percent': swap.percent,
    }

def get_network():
    """Get network I/O statistics"""
    net = psutil.net_io_counters()
    return {
        'bytes_sent': net.bytes_sent,
        'bytes_recv': net.bytes_recv,
        'packets_sent': net.packets_sent,
        'packets_recv': net.packets_recv,
        'errin': net.errin,
        'errout': net.errout,
        'dropin': net.dropin,
        'dropout': net.dropout,
    }

def get_processes():
    """Get top processes by memory usage - minimal version for speed"""
    processes = []
    try:
        # Only get top 10 processes for speed
        plist = []
        for proc in psutil.process_iter(['pid', 'name', 'memory_info']):
            try:
                pinfo = proc.as_dict(attrs=['pid', 'name', 'memory_info'])
                if pinfo['memory_info']:
                    plist.append({
                        'pid': pinfo['pid'],
                        'name': pinfo['name'][:20],  # Truncate name
                        'state': 'running',
                        'rss': pinfo['memory_info'].rss,
                        'vms': 0,
                        'threads': 1,
                    })
                if len(plist) >= 80:  # Hard limit for speed
                    break
            except Exception:
                pass
        
        # Sort by memory and return top 20
        return sorted(plist, key=lambda p: p['rss'], reverse=True)[:20]
    except Exception:
        return []

def get_disk():
    """Get disk usage statistics"""
    disks = {}
    try:
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disks[partition.mountpoint] = {
                    'total': usage.total,
                    'used': usage.used,
                    'free': usage.free,
                    'percent': usage.percent,
                }
            except (PermissionError, OSError):
                pass
    except Exception:
        pass
    return disks

def get_uptime():
    """Get system uptime in seconds"""
    try:
        return time.time() - psutil.boot_time()
    except Exception:
        return 0

def main():
    """Gather all system stats and output as JSON"""
    try:
        stats = {
            'timestamp': __import__('datetime').datetime.now().isoformat(),
            'cpu': get_cpu_usage(),
            'memory': get_memory(),
            'loadAvg': get_load_average(),
            'uptime': get_uptime(),
            'network': get_network(),
            'processes': get_processes(),
            'disk': {},  # Skip disk for performance
        }
        output = json.dumps(stats)
        print(output, flush=True)
        sys.stdout.flush()
    except Exception as e:
        error_output = json.dumps({'error': str(e)})
        print(error_output, file=sys.stderr, flush=True)
        sys.stderr.flush()
        sys.exit(1)

if __name__ == '__main__':
    main()
