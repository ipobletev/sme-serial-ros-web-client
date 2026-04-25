import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertTriangle, ShieldCheck, Undo2, Send, CheckCircle, Gamepad2, MousePointer2 } from 'lucide-react';
import { TOPIC_IDS, Encoders, buildPacket } from '../../utils/protocol';

import { PARAM_GROUPS, JOY_CONSTANTS } from './configSchema';

export default function ConfigPanel({ appConfig, joystick, sendPacket, connected }) {
  const [localConfig, setLocalConfig] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success'
  const [activeTab, setActiveTab] = useState('system'); // 'system', 'gamepad'

  useEffect(() => {
    if (appConfig) {
      setLocalConfig(appConfig);
    }
  }, [appConfig]);

  const handleFetchConfig = () => {
    sendPacket(buildPacket(TOPIC_IDS.RX.GET_CONFIG));
    setPendingChanges({});
  };

  const handleLocalParamChange = (key, value) => {
    // Update only local UI state
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSendGroup = (group) => {
    group.params.forEach(p => {
      // We check if the local value is different from the confirmed appConfig value
      // or if it was already marked as a pending change.
      // But let's just send everything in the group to be sure.
      handleSendParam(p.id, p.key);
    });
  };

  const handleRevertGroup = (group) => {
    group.params.forEach(p => {
      handleRevertParam(p.id, p.key);
    });
  };

  const handleSendParam = (id, key) => {
    const value = localConfig[key];
    // Actually send to robot RAM
    sendPacket(buildPacket(TOPIC_IDS.RX.SET_CONFIG, Encoders.setConfig(id, parseFloat(value))));
    
    // Mark as pending for Flash save
    setPendingChanges(prev => ({ ...prev, [key]: true }));
  };

  const handleSaveToFlash = () => {
    if (window.confirm('Are you sure you want to write these settings to PERMANENT Flash memory?')) {
      setSaveStatus('saving');
      
      // Send dedicated SAVE_CONFIG topic (0x0A)
      sendPacket(buildPacket(TOPIC_IDS.RX.SAVE_CONFIG, []));
      setPendingChanges({});

      // Simulate a short processing delay for visual "premium" feedback
      setTimeout(() => {
        setSaveStatus('success');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }, 700);
    }
  };

  const handleRevertParam = (id, key) => {
    if (!appConfig) return;
    const originalValue = appConfig[key];
    
    // If the value was already in RAM (pending), sync robot RAM back to original value
    if (pendingChanges[key]) {
      sendPacket(buildPacket(TOPIC_IDS.RX.SET_CONFIG, Encoders.setConfig(id, originalValue)));
    }
    
    // Update local UI
    setLocalConfig(prev => ({ ...prev, [key]: originalValue }));
    setPendingChanges(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const isDirty = (key) => {
    if (!localConfig || !appConfig) return false;
    return localConfig[key] != appConfig[key];
  };

  if (!localConfig) {
    const isFetching = connected;
    return (
      <div className="card empty-config">
        <div className="card-header">
          <Settings className="header-icon" />
          <h2>Device Configuration</h2>
        </div>
        <div className="card-content centered" style={{ padding: '40px 20px' }}>
          <div className="sync-spinner" style={{ marginBottom: '20px' }}>
            <RefreshCw size={48} className={connected ? "icon-spin" : ""} style={{ opacity: connected ? 1 : 0.3 }} />
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2>{connected ? 'Syncing Configuration...' : 'Disconnected'}</h2>
            <p className="description" style={{ maxWidth: '300px', margin: '0 auto' }}>
              {connected 
                ? 'Requesting parameters from the robot. This usually takes a few seconds.' 
                : 'Please connect to the robot to manage its configuration.'}
            </p>
          </div>

          <button 
            className="btn btn-primary btn-with-icon" 
            onClick={handleFetchConfig}
            disabled={!connected}
            style={{ minWidth: '200px', justifyContent: 'center' }}
          >
            <RefreshCw size={16} />
            {appConfig ? 'Update Config' : 'Manual Fetch'}
          </button>
          
          {connected && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '16px' }}>
              Waiting for 0x84 (APP_CONFIG_DATA) topic...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="config-grid">
      <div className="config-header-row">
        <div className="title-area">
          <Settings className="icon-pulse" style={{ color: 'var(--accent-cyan)' }} />
          <h1>Configuration Manager</h1>
        </div>
        <div className="action-area">
          <button className="btn btn-ghost btn-with-icon" onClick={handleFetchConfig}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button 
            className="btn btn-accent btn-with-icon" 
            onClick={handleSaveToFlash}
            data-pending={Object.keys(pendingChanges).length > 0 ? 'true' : 'false'}
            data-status={saveStatus}
            disabled={saveStatus !== 'idle'}
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw size={14} className="icon-spin" />
                <span>WRITING...</span>
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle size={14} />
                <span>PERSISTENT!</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>PERSIST TO FLASH</span>
              </>
            )}
          </button>
        </div>
      </div>

      {Object.keys(pendingChanges).length > 0 && (
        <div className="alert alert-warn">
          <AlertTriangle size={18} />
          <span>You have unsaved changes in RAM. Click "Save to Flash" to make them persistent.</span>
        </div>
      )}

      <div className="config-tabs">
        <button 
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          System Config
        </button>
        <button 
          className={`tab-btn ${activeTab === 'motor' ? 'active' : ''}`}
          onClick={() => setActiveTab('motor')}
        >
          Motor Config
        </button>
        <button 
          className={`tab-btn ${activeTab === 'gamepad' ? 'active' : ''}`}
          onClick={() => setActiveTab('gamepad')}
        >
          Gamepad Config
        </button>
      </div>

      <div className="groups-container">
        {PARAM_GROUPS.filter(g => g.category === activeTab).map(group => (
          <div className="config-card" key={group.title}>
            <div className="card-header-with-actions">
              <h3>{group.title}</h3>
              <div className="group-actions">
                <button 
                  className="btn-group-action btn-refresh" 
                  onClick={() => handleRevertGroup(group)}
                  title="Revert all in group"
                >
                  <RefreshCw size={14} />
                  <span>Revert</span>
                </button>
                <button 
                  className="btn-group-action btn-send-all" 
                  onClick={() => handleSendGroup(group)}
                  title="Send all dirty in group to RAM"
                  disabled={!group.params.some(p => pendingChanges[p.key])}
                >
                  <Send size={14} />
                  <span>Send All</span>
                </button>
              </div>
            </div>
            <div className="params-list">
              {group.params.map(p => (
                <div className="param-item" key={p.id}>
                  <div className="param-info">
                    <span className="param-label">{p.label}</span>
                    <div className="param-meta">
                      <span className="param-key">{p.key}</span>
                      {p.type === 'number' && (p.min !== undefined || p.max !== undefined) && (
                        <span className="param-range">[{p.min ?? '—'}, {p.max ?? '—'}]</span>
                      )}
                    </div>
                  </div>
                  <div className="param-control">
                    <div className="param-control-group">
                      {p.type === 'select' ? (
                        <select 
                          value={localConfig[p.key]} 
                          onChange={(e) => handleLocalParamChange(p.key, e.target.value)}
                        >
                          {p.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : p.type === 'boolean' ? (
                        <button 
                          className={`toggle ${localConfig[p.key] ? 'active' : ''}`}
                          onClick={() => handleLocalParamChange(p.key, localConfig[p.key] ? 0 : 1)}
                        >
                          {localConfig[p.key] ? 'Enabled' : 'Disabled'}
                        </button>
                      ) : (
                        <input 
                          type="number" 
                          value={localConfig[p.key]}
                          step={p.step || 1}
                          min={p.min}
                          max={p.max}
                          onChange={(e) => handleLocalParamChange(p.key, e.target.value)}
                        />
                      )}
                      
                      {isDirty(p.key) && (
                        <div className="param-actions">
                          <button 
                            className="btn-send" 
                            title="Send to Robot RAM"
                            onClick={() => handleSendParam(p.id, p.key)}
                          >
                            <Send size={12} />
                          </button>
                          <button 
                            className="btn-revert" 
                            title="Revert to fetched value"
                            onClick={() => handleRevertParam(p.id, p.key)}
                          >
                            <Undo2 size={12} />
                          </button>
                          <div className="dirty-dot" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {activeTab === 'gamepad' && (
          <div className="config-card live-monitor-card">
            <div className="card-header-simple">
              <Gamepad2 size={18} style={{ color: 'var(--accent-cyan)' }} />
              <h3>Live Gamepad Monitor (Real-time)</h3>
            </div>
            
            {!joystick || !joystick.connected ? (
              <div className="monitor-empty">
                <AlertTriangle size={24} style={{ opacity: 0.3 }} />
                <p>Physical Gamepad not detected by Robot.</p>
                <span style={{ fontSize: '0.7rem' }}>Check USB Host connection on STM32.</span>
              </div>
            ) : (
              <div className="monitor-grid">
                <div className="joystick-visualizers">
                  <div className="stick-box">
                    <span className="stick-label">JOY 1 (Linear)</span>
                    <div className="stick-area">
                      <div className="stick-guide-x"></div>
                      <div className="stick-guide-y"></div>
                      <div 
                        className="stick-pointer" 
                        style={{ 
                          transform: `translate(${joystick.lx * 0.4}px, ${-joystick.ly * 0.4}px)`,
                          background: (localConfig && Math.abs(joystick.ly) > (localConfig.joy_linear_deadzone || 10)) ? 'var(--accent-emerald)' : 'var(--accent-cyan)'
                        }}
                      ></div>
                    </div>
                    <div className="stick-values">
                      <span>X: {joystick.lx}</span>
                      <span>Y: {joystick.ly}</span>
                    </div>
                  </div>

                  <div className="stick-box">
                    <span className="stick-label">JOY 2 (Angular)</span>
                    <div className="stick-area">
                      <div className="stick-guide-x"></div>
                      <div className="stick-guide-y"></div>
                      <div 
                        className="stick-pointer" 
                        style={{ 
                          transform: `translate(${joystick.rx * 0.4}px, ${-joystick.ry * 0.4}px)`,
                          background: (localConfig && Math.abs(joystick.rx) > (localConfig.joy_angular_deadzone || 10)) ? 'var(--accent-emerald)' : 'var(--accent-cyan)'
                        }}
                      ></div>
                    </div>
                    <div className="stick-values">
                      <span>X: {joystick.rx}</span>
                      <span>Y: {joystick.ry}</span>
                    </div>
                  </div>
                </div>

                <div className="buttons-triggers">
                  <div className="button-group">
                    <div className={`joy-btn-chip ${(joystick.buttons & JOY_CONSTANTS.BTN_MODE) ? 'active' : ''}`}>MODE</div>
                    <div className={`joy-btn-chip ${(joystick.buttons & JOY_CONSTANTS.BTN_START) ? 'active' : ''}`}>START</div>
                    <div className={`joy-btn-chip ${(joystick.buttons & JOY_CONSTANTS.BTN_SELECT) ? 'active' : ''}`}>SELECT</div>
                    <div className={`joy-btn-chip ${(joystick.buttons & JOY_CONSTANTS.BTN_L1) ? 'active' : ''}`}>L1</div>
                    <div className={`joy-btn-chip ${(joystick.buttons & JOY_CONSTANTS.BTN_R1) ? 'active' : ''}`}>R1</div>
                  </div>
                  
                  <div className="trigger-group">
                    <div className="trigger-item">
                      <span className="trigger-label">L2</span>
                      <div className="trigger-bar-bg">
                        <div className="trigger-bar-fill" style={{ width: `${(joystick.l2 / 255) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className="trigger-item">
                      <span className="trigger-label">R2</span>
                      <div className="trigger-bar-bg">
                        <div className="trigger-bar-fill" style={{ width: `${(joystick.r2 / 255) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'gamepad' && (
        <div className="config-card gamepad-mapping-card">
          <div className="card-header-simple">
            <Send size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h3>Gamepad Logic Mapping (Indicator Only)</h3>
          </div>
          <div className="mapping-container">
            <div className="mapping-item danger">
              <span className="btn-shape mode">MODE</span>
              <span className="mapping-arrow">→</span>
              <span className="mapping-function">EMERGENCY STOP (Global Error)</span>
            </div>
            <div className="mapping-item warning">
              <span className="btn-shape">SELECT</span>
              <span className="mapping-arrow">→</span>
              <span className="mapping-function">SOFT STOP / IDLE</span>
            </div>
            <div className="mapping-item success">
              <span className="btn-shape">START</span>
              <span className="mapping-arrow">→</span>
              <span className="mapping-function">START SYSTEM (MANUAL MODE)</span>
            </div>
            <div className="mapping-item info">
              <div className="combo-btns">
                <span className="btn-shape sm">L1</span> + <span className="btn-shape sm">R1</span> + <span className="btn-shape sm">L2</span> + <span className="btn-shape sm">R2</span>
              </div>
              <span className="mapping-arrow">→</span>
              <span className="mapping-function">FAULT RESET (Hold 2s)</span>
            </div>
            <div className="mapping-note">
              <AlertTriangle size={12} />
              <span>Note: Linear speed is Joy1 (Y-Axis) and Angular is Joy2 (X-Axis).</span>
            </div>
          </div>
        </div>
      )}

      <div className="config-footer">
        <div className="security-tag">
          <ShieldCheck size={14} />
          <span>Magic: 0x{localConfig.magic.toString(16).toUpperCase()}</span>
          <span className="separator">|</span>
          <span>CRC: 0x{localConfig.crc.toString(16).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
