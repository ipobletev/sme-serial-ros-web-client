import React, { useMemo, useEffect } from 'react';
import { Target, Activity, Gauge, Power, Info, Play, CircleStop, RotateCcw, Save, CheckCircle } from 'lucide-react';

import { usePidController } from './hooks/usePidController';
import { PidChart } from './components/PidChart';
import { PidAnalysis, analyzeStepResponse } from './components/PidAnalysis';
import { PidHistory } from './components/PidHistory';
import { GainSlider } from './components/GainControl';
import SystemEventsControl from './SystemEventsControl';

import './styles/PidTuner.css';

const TooltipWrapper = ({ children, content }) => (
  <div className="tooltip-trigger" title={content}>{children}</div>
);

const PidTuner = React.memo(function PidTuner({ 
  history, appConfig, sendPacket, connected, sysStatus, onClear,
  tuningHistory, setTuningHistory, 
  persistentData, setPersistentData,
  settings, setSettings
}) {
  const controller = usePidController({
    sendPacket, appConfig, sysStatus, connected, 
    persistentData, setPersistentData,
    settings, setSettings
  });

  const { selectedMotor, testSpeed, testLead, testDuration, testTail } = settings;

  // Data Mapping (Internal to entry point to bridge history and persistentData)
  const currentTelemetryData = useMemo(() => {
    if (!controller.isCapturing || !history || history.length === 0) return [];
    const baseTs = controller.captureStartTsRef.current || history[0].timestamp;
    const lastTs = persistentData.length > 0 ? persistentData[persistentData.length - 1].ts : 0;
    const minTs = Math.max(controller.captureStartTsRef.current, lastTs);
    
    return history.filter(p => p.timestamp > minTs).map(p => {
      const target = p.pid_target?.[selectedMotor === 'all' ? 0 : selectedMotor] || 0;
      const measured = p.pid_measured?.[selectedMotor === 'all' ? 0 : selectedMotor] || 0;
      return {
        ts: p.timestamp, relativeTime: `T + ${((p.timestamp - baseTs) / 1000).toFixed(3)}s`,
        target, measured, error: target - measured,
        pwm: p.pid_pwm?.[selectedMotor === 'all' ? 0 : selectedMotor] || 0,
        t1: p.pid_target?.[0], m1: p.pid_measured?.[0], e1: (p.pid_target?.[0] || 0) - (p.pid_measured?.[0] || 0),
        t2: p.pid_target?.[1], m2: p.pid_measured?.[1], e2: (p.pid_target?.[1] || 0) - (p.pid_measured?.[1] || 0),
        t3: p.pid_target?.[2], m3: p.pid_measured?.[2], e3: (p.pid_target?.[2] || 0) - (p.pid_measured?.[2] || 0),
        t4: p.pid_target?.[3], m4: p.pid_measured?.[3], e4: (p.pid_target?.[3] || 0) - (p.pid_measured?.[3] || 0),
      };
    });
  }, [history, selectedMotor, controller.isCapturing, persistentData.length]);

  useEffect(() => {
    if (controller.isCapturing && currentTelemetryData.length > 0) {
      setPersistentData(prev => {
        const combined = [...prev, ...currentTelemetryData];
        return combined.length > 1000 ? combined.slice(-1000) : combined;
      });
    }
  }, [currentTelemetryData, controller.isCapturing, setPersistentData]);

  const analysis = useMemo(() => analyzeStepResponse(persistentData), [persistentData]);

  // Record history on test completion
  useEffect(() => {
    if (controller.isCapturing || persistentData.length < 20 || !analysis) return;
    setTuningHistory(prev => {
      const activeMotorIdx = selectedMotor === 'all' ? 0 : selectedMotor;
      const entry = {
        id: Date.now(), timestamp: new Date().toLocaleTimeString(),
        motor: selectedMotor === 'all' ? 'ALL' : `M${selectedMotor + 1}`,
        kp: appConfig?.[`motor${activeMotorIdx + 1}_kp`],
        ki: appConfig?.[`motor${activeMotorIdx + 1}_ki`],
        kd: appConfig?.[`motor${activeMotorIdx + 1}_kd`],
        ...analysis, data: [...persistentData]
      };
      return [entry, ...prev].slice(0, 10);
    });
  }, [controller.isCapturing, analysis, appConfig]);

  if (!appConfig) return <div className="pid-tuner-container">Loading...</div>;

  return (
    <div className="pid-tuner-container">
      <div className="tuner-header">
        <div className="tuner-title-section">
          <div className="icon-box"><Target size={24} className="icon-pulse" /></div>
          <div><h1>PID OPTIMIZER</h1><p className="description">Transient response analysis</p></div>
        </div>

        <div className="motor-selector-dock">
          <button className={`motor-dock-btn ${selectedMotor === 'all' ? 'active' : ''}`} onClick={() => setSettings(s => ({...s, motor: 'all'}))}>ALL</button>
          {[0, 1, 2, 3].map(i => (
            <button key={i} className={`motor-dock-btn ${selectedMotor === i ? 'active' : ''}`} onClick={() => setSettings(s => ({...s, motor: i}))}>M{i+1}</button>
          ))}
        </div>

        <div className="status-control-dock">
           <button className={`pid-status-toggle-btn ${controller.pendingPidState !== null ? 'pending' : (appConfig.pid_enabled ? 'active' : 'inactive')}`} onClick={controller.togglePid}>
             <div className="status-dot"></div>
             <span>PID: {appConfig.pid_enabled ? 'ENABLED' : 'DISABLED'}</span>
           </button>
        </div>
      </div>

      <div className="tuner-main-grid">
        <div className="tuner-card">
          <div className="tuner-card-header">
            <h3><Activity size={16} color="var(--accent-cyan)" /> Real-time Response</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => { onClear(); setPersistentData([]); }}><RotateCcw size={14} /> CLEAR</button>
          </div>
          <PidChart chartData={persistentData} yDomain={[-appConfig.motor_speed_limit, appConfig.motor_speed_limit]} appConfig={appConfig} selectedMotor={selectedMotor} />
          <PidAnalysis analysis={analysis} />
        </div>

        <div className="tuner-controls-column">
          <SystemEventsControl sendPacket={sendPacket} connected={connected} />
          <div className="tuner-card">
            <div className="tuner-card-header"><h3><Gauge size={16} color="var(--accent-violet)" /> Parameters</h3></div>
            <div className="control-panel">
              {(selectedMotor === 'all' ? [0, 1, 2, 3] : [selectedMotor]).map(mIdx => (
                <div className="motor-param-group" key={mIdx}>
                  <div className="motor-group-tag">MOTOR {mIdx + 1}</div>
                  <GainSlider label="KP" value={appConfig?.[`motor${mIdx+1}_kp`] || 0} step={0.01} onSend={(v) => controller.handleSendParam('kp', v, mIdx)} />
                  <GainSlider label="KI" value={appConfig?.[`motor${mIdx+1}_ki`] || 0} step={0.01} onSend={(v) => controller.handleSendParam('ki', v, mIdx)} />
                  <GainSlider label="KD" value={appConfig?.[`motor${mIdx+1}_kd`] || 0} step={0.01} onSend={(v) => controller.handleSendParam('kd', v, mIdx)} />
                </div>
              ))}

              <div className="tuner-actions-dock">
                {!controller.isTesting ? (
                  <div className="testing-required-notice">
                    <Power size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>Testing mode required.</p>
                  </div>
                ) : (
                  <div className="step-test-section">
                    <div className="step-input-row">
                      <div className="input-with-label"><span>Setpoint</span><input type="number" value={testSpeed} onChange={(e) => setSettings(s=>({...s, speed: parseFloat(e.target.value)}))} /></div>
                      <div className="input-with-label"><span>Duration</span><input type="number" value={testDuration} onChange={(e) => setSettings(s=>({...s, duration: parseInt(e.target.value)}))} /></div>
                    </div>
                    <div className="step-input-row" style={{ marginTop: '8px' }}>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={controller.runStep}><Play size={14}/> GO</button>
                      <button className="btn btn-ghost" onClick={() => controller.stopStep(true)}><CircleStop size={14}/></button>
                    </div>
                  </div>
                )}
                <button className="btn btn-accent full-width" style={{ marginTop: '12px' }} onClick={controller.handleSaveToFlash} disabled={controller.saveStatus !== 'idle'}>
                  {controller.saveStatus === 'saving' ? 'WRITING...' : <><Save size={14} /> PERSIST TO FLASH</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PidHistory 
        tuningHistory={tuningHistory} 
        setTuningHistory={setTuningHistory} 
        exportSingle={(entry) => console.log('Export single', entry)} 
        exportAll={() => console.log('Export all')} 
      />
    </div>
  );
});

export default PidTuner;
