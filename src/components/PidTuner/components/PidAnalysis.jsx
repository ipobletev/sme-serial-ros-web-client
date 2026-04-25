import React from 'react';
import { ShieldCheck, TrendingUp, AlertCircle, Activity, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';

export function analyzeStepResponse(chartData) {
  if (!chartData || chartData.length < 10) return null;

  const targets = chartData.map(p => Math.abs(p.target));
  const target = Math.max(...targets);
  if (target < 0.1) return null;

  const measuredValues = chartData.map(p => p.measured);
  const maxVal = Math.max(...measuredValues);
  const overshoot = ((maxVal - target) / target) * 100;
  const finalVal = measuredValues[measuredValues.length - 1];
  const error = target - finalVal;
  
  const t10 = target * 0.1;
  const t90 = target * 0.9;
  let idx10 = -1, idx90 = -1;
  for (let i = 0; i < measuredValues.length; i++) {
    if (idx10 === -1 && measuredValues[i] >= t10) idx10 = i;
    if (idx90 === -1 && measuredValues[i] >= t90) idx90 = i;
  }
  const riseTime = (idx10 !== -1 && idx90 !== -1) ? (idx90 - idx10) : null;
  const rawTotalError = chartData.reduce((acc, p) => acc + Math.abs(p.target - p.measured), 0);
  const iae = rawTotalError * 0.02;

  let status = 'good';
  let suggestion = 'Locked & Loaded';
  let iconType = 'shield';
  const recommendations = [];

  if (riseTime === null || (riseTime * 20) > 150) {
    recommendations.push({ param: 'KP', action: 'INCREASE', trend: 'up', reason: 'Response is sluggish.' });
    status = 'warn'; suggestion = 'Slow Response'; iconType = 'trending';
  }
  if (overshoot > 12) {
    recommendations.push({ param: 'KP', action: 'DECREASE', trend: 'down', reason: 'High overshoot detected.' });
    recommendations.push({ param: 'KD', action: 'INCREASE', trend: 'up', reason: 'Add damping to reduce overshoot.' });
    status = 'crit'; suggestion = 'High Overshoot'; iconType = 'alert';
  }
  if (Math.abs(error) > (target * 0.04)) {
    recommendations.push({ param: 'KI', action: 'INCREASE', trend: 'up', reason: 'Fails to reach target.' });
    if (status !== 'crit') status = 'warn'; suggestion = 'Steady State Error'; iconType = 'activity';
  }

  if (recommendations.length === 0) {
    recommendations.push({ param: 'ALL', action: 'OPTIMAL', trend: 'check', reason: 'Balanced response.' });
  }

  return { overshoot: Math.max(0, overshoot), error, status, suggestion, iconType, peak: maxVal, riseTime: riseTime ? `${riseTime * 20}ms` : 'N/A', iae, recommendations };
}

export const PidAnalysis = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="analysis-board">
      <div className="status-hud-v2">
        <div className={`hud-status-badge-v2 ${analysis.status}`}>
          {analysis.iconType === 'shield' && <ShieldCheck size={16} />}
          {analysis.iconType === 'trending' && <TrendingUp size={16} />}
          {analysis.iconType === 'alert' && <AlertCircle size={16} />}
          {analysis.iconType === 'activity' && <Activity size={16} />}
          <span>{analysis.suggestion}</span>
        </div>
      </div>

      <div className="advisor-section">
        <div className="advisor-title">EXPERT ADVISOR RECOMMENDATIONS</div>
        <div className="advisor-list">
          {analysis.recommendations.map((rec, idx) => (
            <div key={idx} className="advisor-item">
              <div className={`rec-badge ${rec.trend}`}>
                {rec.trend === 'up' && <ChevronUp size={10} />}
                {rec.trend === 'down' && <ChevronDown size={10} />}
                {rec.trend === 'check' && <CheckCircle size={10} />}
                {rec.param}
              </div>
              <div className="advisor-content">
                <div className="action-label">{rec.action}</div>
                <div className="reason-label">{rec.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <table className="analysis-table">
        <thead>
          <tr><th>PARAMETER</th><th>VALUE</th><th>STABILITY</th></tr>
        </thead>
        <tbody>
          <tr><td>Overshoot</td><td className="value-cell">{analysis.overshoot?.toFixed(1)}%</td><td>{analysis.overshoot < 10 ? '✅ Optimal' : '⚠️ High'}</td></tr>
          <tr><td>Rise Time</td><td className="value-cell">{analysis.riseTime}</td><td>{analysis.riseTime !== 'N/A' ? '⏱️ Measured' : '--'}</td></tr>
          <tr><td>Steady State Error</td><td className="value-cell">{analysis.error?.toFixed(3)}</td><td>{Math.abs(analysis.error) < 0.05 ? '✅ Good' : '❌ Offset'}</td></tr>
          <tr><td>Total Error (IAE)</td><td className="value-cell">{analysis.iae?.toFixed(3)}</td><td>Score</td></tr>
        </tbody>
      </table>
    </div>
  );
};
