import React from 'react';
import { Activity, Download } from 'lucide-react';

export const PidHistory = ({ tuningHistory, setTuningHistory, exportAll, exportSingle }) => {
  return (
    <div className="tuner-card history-card" style={{ marginTop: '24px' }}>
      <div className="tuner-card-header">
        <h3><Activity size={16} color="var(--accent-amber)" /> Tuning Session History</h3>
        <div className="header-actions">
          <button className="btn btn-sm btn-ghost" onClick={exportAll} disabled={tuningHistory.length === 0}>
            <Download size={14} /> EXPORT ALL
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setTuningHistory([])} disabled={tuningHistory.length === 0}>
            CLEAR HISTORY
          </button>
        </div>
      </div>
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>TIME</th><th>MOTOR</th><th>PARAMETERS (P/I/D)</th>
              <th>OVERSHOOT</th><th>IAE</th><th>STATUS</th><th className="action-cell">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {tuningHistory.length === 0 ? (
              <tr><td colSpan="7" className="empty-row">No tests recorded. Click 'GO' to start.</td></tr>
            ) : (
              tuningHistory.map(entry => (
                <tr key={entry.id}>
                  <td className="time">{entry.timestamp}</td>
                  <td><span className="motor-chip">{entry.motor}</span></td>
                  <td className="params">
                    <span>{entry.kp?.toFixed(3)}</span> / <span>{entry.ki?.toFixed(3)}</span> / <span>{entry.kd?.toFixed(3)}</span>
                  </td>
                  <td className={`value ${entry.overshoot > 10 ? 'bad' : 'good'}`}>{entry.overshoot?.toFixed(1)}%</td>
                  <td className="value">{entry.iae?.toFixed(3)}</td>
                  <td><div className={`status-pill ${entry.status}`}>{entry.status.toUpperCase()}</div></td>
                  <td className="action-cell">
                    <button className="btn btn-sm btn-ghost" onClick={() => exportSingle(entry)}><Download size={14} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
