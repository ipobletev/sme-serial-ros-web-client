/* --- FSM DEFINITIONS (Based on docs/state_machine.md) --- */

export const SUPERVISOR_FSM = {
  nodes: [
    { id: 0, label: 'INIT', x: 120, y: 120, color: '#a78bfa' },
    { id: 1, label: 'IDLE', x: 260, y: 120, color: '#94a3b8' },
    { id: 2, label: 'MANUAL', x: 440, y: 60, color: '#6366f1' },
    { id: 3, label: 'AUTO', x: 440, y: 180, color: '#10b981' },
    { id: 4, label: 'PAUSED', x: 620, y: 120, color: '#f59e0b' },
    { id: 5, label: 'FAULT', x: 360, y: 260, color: '#ef4444' },
    { id: 6, label: 'TESTING', x: 540, y: 120, color: '#06b6d4' },
  ],
  edges: [
    { from: 0, to: 1, label: 'READY' },
    { from: 1, to: 2, label: 'START' },
    { from: 2, to: 1, label: 'STOP' },
    { from: 3, to: 1, label: 'STOP' },
    { from: 2, to: 3, label: 'MODE_AUTO' },
    { from: 3, to: 2, label: 'MODE_MAN' },
    { from: 2, to: 4, label: 'PAUSE' },
    { from: 3, to: 4, label: 'PAUSE' },
    { from: 4, to: 1, label: 'STOP' },
    { from: 4, to: 2, label: 'RESUME' },
    { from: 4, to: 3, label: 'RESUME' },
    { from: 1, to: 5, label: 'ERR' },
    { from: 2, to: 5, label: 'ERR' },
    { from: 3, to: 5, label: 'ERR' },
    { from: 4, to: 5, label: 'ERR' },
    { from: 5, to: 0, label: 'RESET' },
    { from: 2, to: 6, label: 'TEST' },
    { from: 3, to: 6, label: 'TEST' },
    { from: 6, to: 1, label: 'STOP' },
    { from: 6, to: 5, label: 'ERR' },
  ]
};

export const MOBILITY_FSM = {
  nodes: [
    { id: 0, label: 'INIT', x: 140, y: 160, color: 'var(--text-muted)' },
    { id: 1, label: 'IDLE', x: 260, y: 80, color: 'var(--accent-indigo)' },
    { id: 2, label: 'BREAK', x: 420, y: 220, color: 'var(--accent-amber)' },
    { id: 3, label: 'MOVING', x: 580, y: 80, color: 'var(--accent-emerald)' },
    { id: 4, label: 'TESTING', x: 540, y: 220, color: 'var(--accent-cyan)' },
    { id: 5, label: 'FAULT', x: 660, y: 260, color: 'var(--accent-rose)' },
    { id: 6, label: 'ABORT', x: 300, y: 260, color: 'var(--accent-amber)' },
  ],
  edges: [
    { from: 0, to: 1, label: 'Ready' },
    { from: 1, to: 3, label: 'Moving' },
    { from: 1, to: 2, label: 'Break' },
    { from: 1, to: 4, label: 'Test' },
    { from: 3, to: 1, label: 'Idle' },
    { from: 3, to: 2, label: 'Break' },
    { from: 2, to: 3, label: 'Moving' },
    { from: 2, to: 1, label: 'Idle' },
    { from: 4, to: 1, label: 'Idle' },
    { from: 4, to: 3, label: 'Moving' },
    { from: 1, to: 5, label: 'Error' },
    { from: 3, to: 5, label: 'Error' },
    { from: 1, to: 6, label: 'Abort' },
    { from: 3, to: 6, label: 'Abort' },
    { from: 6, to: 0, label: 'Reset' },
    { from: 5, to: 0, label: 'Reset' },
  ]
};

export const ARM_FSM = {
  nodes: [
    { id: 0, label: 'INIT', x: 140, y: 160, color: 'var(--text-muted)' },
    { id: 1, label: 'HOMING', x: 240, y: 80, color: 'var(--accent-cyan)' },
    { id: 2, label: 'IDLE', x: 380, y: 160, color: 'var(--accent-indigo)' },
    { id: 3, label: 'MOVING', x: 540, y: 80, color: 'var(--accent-emerald)' },
    { id: 4, label: 'TESTING', x: 540, y: 220, color: 'var(--accent-cyan)' },
    { id: 5, label: 'FAULT', x: 660, y: 160, color: 'var(--accent-rose)' },
    { id: 6, label: 'ABORT', x: 520, y: 280, color: 'var(--accent-amber)' },
  ],
  edges: [
    { from: 0, to: 2, label: 'Idle' },
    { from: 2, to: 1, label: 'Homing' },
    { from: 2, to: 3, label: 'Moving' },
    { from: 2, to: 4, label: 'Test' },
    { from: 1, to: 2, label: 'Done' },
    { from: 1, to: 3, label: 'Moving' },
    { from: 1, to: 4, label: 'Test' },
    { from: 3, to: 2, label: 'Idle' },
    { from: 3, to: 1, label: 'Homing' },
    { from: 3, to: 4, label: 'Test' },
    { from: 4, to: 2, label: 'Idle' },
    { from: 4, to: 3, label: 'Moving' },
    { from: 1, to: 5, label: 'Error' },
    { from: 2, to: 5, label: 'Error' },
    { from: 3, to: 5, label: 'Error' },
    { from: 2, to: 6, label: 'Abort' },
    { from: 3, to: 6, label: 'Abort' },
    { from: 6, to: 0, label: 'Reset' },
    { from: 5, to: 0, label: 'Reset' },
  ]
};
