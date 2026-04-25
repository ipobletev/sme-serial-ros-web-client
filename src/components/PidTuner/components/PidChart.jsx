import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export const PidChart = React.memo(({ chartData, yDomain, appConfig, selectedMotor }) => {
  return (
    <div className="chart-container-box">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} syncId="pidTuningSync" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <XAxis dataKey="ts" hide />
          <YAxis domain={yDomain} stroke="#444" fontSize={11} tickFormatter={(v) => v.toFixed(1)} />
          <YAxis 
            yAxisId="pwm" 
            orientation="right" 
            domain={[-(appConfig?.motor_pwm_max || 1000), appConfig?.motor_pwm_max || 1000]} 
            stroke="var(--accent-rose)" 
            fontSize={11} 
          />
          <Tooltip 
            trigger="axis" 
            contentStyle={{ background: 'rgba(10,14,23,0.9)', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={(ts) => {
              const p = chartData.find(d => d.ts === ts);
              return p ? p.relativeTime : '—';
            }}
          />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
          
          {selectedMotor === 'all' ? (
            <>
              <Line type="linear" dataKey="m1" name="M1" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="m2" name="M2" stroke="var(--accent-emerald)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="m3" name="M3" stroke="var(--accent-amber)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="m4" name="M4" stroke="var(--accent-rose)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="stepAfter" dataKey="t1" name="Target" stroke="#fff" strokeWidth={1} strokeDasharray="5 5" dot={false} opacity={0.3} isAnimationActive={false} />
            </>
          ) : (
            <>
              <Line type="stepAfter" dataKey="target" name="Setpoint" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="measured" name="Measured" stroke="var(--accent-emerald)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line yAxisId="pwm" type="linear" dataKey="pwm" name="Raw PWM" stroke="var(--accent-rose)" strokeWidth={1} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      <div style={{ padding: '8px 0', borderTop: '1px dashed rgba(255,255,255,0.05)', marginTop: '8px' }}>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} syncId="pidTuningSync" margin={{ top: 5, right: 75, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="ts" hide />
            <YAxis stroke="#444" fontSize={11} tickFormatter={(v) => v.toFixed(2)} />
            <Tooltip 
              trigger="axis" 
              contentStyle={{ background: 'rgba(10,14,23,0.9)', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
            />
            {selectedMotor === 'all' ? (
              <>
                <Line type="linear" dataKey="e1" name="E1" stroke="var(--accent-cyan)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="linear" dataKey="e2" name="E2" stroke="var(--accent-emerald)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="linear" dataKey="e3" name="E3" stroke="var(--accent-amber)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="linear" dataKey="e4" name="E4" stroke="var(--accent-rose)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </>
            ) : (
              <Line type="linear" dataKey="error" name="Tracking Error" stroke="var(--accent-rose)" strokeWidth={2} dot={false} isAnimationActive={false} />
            )}
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
