import React, { useRef } from 'react';

function Timeline({ currentTime, maxTime, playing, onPlay, onStop, onReset, onSeek, contextSwitches }) {
  const barRef = useRef(null);
  const pct = maxTime ? (currentTime / maxTime) * 100 : 0;

  const handleBarClick = (e) => {
    if (!barRef.current || !maxTime) return;
    const rect = barRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(p);
  };

  const btn = {
    width: 32, height: 32, borderRadius: '50%',
    border: '1px solid rgba(99,179,237,0.3)',
    background: 'rgba(15,21,37,1)',
    color: '#63b3ed', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', fontSize: 13,
    transition: 'background 0.2s',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <button style={btn} onClick={playing ? onStop : onPlay} title={playing ? 'Pause' : 'Play'}>
        {playing ? '⏸' : '▶'}
      </button>
      <button style={btn} onClick={onReset} title="Reset">◀◀</button>

      <div
        ref={barRef}
        onClick={handleBarClick}
        style={{
          flex: 1, height: 4, background: 'rgba(99,179,237,0.15)',
          borderRadius: 2, position: 'relative', cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${pct}%`, background: '#63b3ed', borderRadius: 2,
            transition: playing ? 'none' : 'width 0.1s',
          }}
        />
        <div
          style={{
            position: 'absolute', top: '50%', left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            width: 12, height: 12, borderRadius: '50%', background: '#63b3ed',
            transition: playing ? 'none' : 'left 0.1s',
            boxShadow: '0 0 6px rgba(99,179,237,0.6)',
          }}
        />
      </div>

      <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color: '#94a3b8', minWidth: 56 }}>
        T={currentTime.toFixed(1)}
      </span>
      <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color: '#475569', whiteSpace: 'nowrap' }}>
        CS: <span style={{ color: '#f6ad55', fontWeight: 700 }}>{contextSwitches}</span>
      </span>
    </div>
  );
}

export default Timeline;
