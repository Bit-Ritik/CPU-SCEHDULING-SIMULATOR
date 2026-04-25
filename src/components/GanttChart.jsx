import React, { useRef, useCallback } from 'react';

function GanttChart({ gantt, results, currentTime, maxTime }) {
  if (!gantt.length) {
    return (
      <div style={{ color: '#475569', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
        Run simulation to see Gantt chart
      </div>
    );
  }

  const pids = [...new Set(gantt.map((g) => g.pid))];
  const tickStep = Math.max(1, Math.floor(maxTime / 12));
  const ticks = [];
  for (let i = 0; i <= maxTime; i += tickStep) ticks.push(i);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 520 }}>
        {/* Time axis */}
        <div style={{ display: 'flex', marginLeft: 72, position: 'relative', height: 18, marginBottom: 4 }}>
          {ticks.map((t) => (
            <span
              key={t}
              style={{
                position: 'absolute',
                left: `${(t / maxTime) * 100}%`,
                fontSize: 10,
                fontFamily: 'Space Mono, monospace',
                color: '#475569',
                transform: 'translateX(-50%)',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Process rows */}
        {pids.map((pid) => {
          const pidColor = gantt.find((g) => g.pid === pid)?.color || '#63b3ed';
          const blocks = gantt.filter((g) => g.pid === pid);
          return (
            <div key={pid} style={{ display: 'flex', height: 38, marginBottom: 3, alignItems: 'center' }}>
              <div
                style={{
                  width: 68,
                  flexShrink: 0,
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 12,
                  color: pidColor,
                  fontWeight: 700,
                }}
              >
                {pid}
              </div>
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  height: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 4,
                }}
              >
                {blocks.map((b, i) => {
                  const left = (b.start / maxTime) * 100;
                  const width = ((b.end - b.start) / maxTime) * 100;
                  let opacity = 1;
                  if (currentTime < b.start) opacity = 0.12;
                  else if (currentTime >= b.end) opacity = 0.4;

                  return (
                    <div
                      key={i}
                      title={`${b.pid}: T${b.start} → T${b.end} (${b.end - b.start} units)`}
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        top: 5,
                        bottom: 5,
                        borderRadius: 4,
                        background: `${pidColor}22`,
                        border: `1px solid ${pidColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontFamily: 'Space Mono, monospace',
                        fontWeight: 700,
                        color: pidColor,
                        opacity,
                        transition: 'opacity 0.15s',
                        cursor: 'default',
                        overflow: 'hidden',
                      }}
                    >
                      {b.end - b.start >= 2 ? pid.replace('P', '') : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GanttChart;
