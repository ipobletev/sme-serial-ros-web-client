import React, { useState, memo } from 'react';
import { 
  Plug, Unplug, AlertTriangle, Menu, ShieldCheck, 
  Share2, Anchor, Cpu, RotateCcw, Coffee, 
  Gamepad2, Play, Pause, Target, Battery 
} from 'lucide-react';
import { TOPIC_IDS, Encoders, buildPacket } from '../utils/protocol';

const Header = memo(function Header({ 
  connected, 
  isMaster,
  linkActive,
  sysStatus,
  appConfig,
  onConnect, 
  onDisconnect, 
  sendPacket, 
  sidebarCollapsed, 
  setSidebarCollapsed,
  connectionMode,
  setConnectionMode
}) {
  const [baudRate, setBaudRate] = useState(230400);
  const [rosUrl, setRosUrl] = useState('ws://localhost:9090');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [baudMenuOpen, setBaudMenuOpen] = useState(false);

  const getBatteryPercent = (voltage, config) => {
    const min = config?.batt_min || 10.0;
    const max = config?.batt_max || 12.6;
    return Math.max(0, Math.min(100, ((voltage - min) / (max - min)) * 100));
  };

  const getBatteryColor = (pct) => {
    if (pct > 60) return 'var(--accent-emerald)';
    if (pct > 25) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  };

  const STATE_MAP = {
    0: { label: 'INIT', color: 'var(--accent-amber)', icon: RotateCcw },
    1: { label: 'IDLE', color: 'var(--text-muted)', icon: Coffee },
    2: { label: 'MANUAL', color: 'var(--accent-cyan)', icon: Gamepad2 },
    3: { label: 'AUTO', color: 'var(--accent-emerald)', icon: Play },
    4: { label: 'PAUSED', color: 'var(--accent-amber)', icon: Pause },
    5: { label: 'FAULT', color: 'var(--accent-rose)', icon: AlertTriangle },
    6: { label: 'TESTING', color: 'var(--accent-cyan)', icon: Target },
  };

  const currentState = sysStatus?.state ?? 1;
  const stateInfo = STATE_MAP[currentState] || STATE_MAP[1];
  const StateIcon = stateInfo.icon;

  const batPct = sysStatus ? getBatteryPercent(sysStatus.v_batt, appConfig) : 0;
  const batColor = getBatteryColor(batPct);
  
  const handleEmergencyStop = () => {
    if (!connected || !sendPacket) return;
    const payload = Encoders.sysEvent(0x06);
    const packet = buildPacket(TOPIC_IDS.RX.SYS_EVENT, payload);
    sendPacket(packet);
    console.warn("EMERGENCY STOP SENT");
  };

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="btn-icon btn-ghost sidebar-toggle" 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={20} />
        </button>
        <div className="header-brand">
          <div className="logo-icon">S</div>
          <div className="brand-text">
            <span className="brand-primary">SME</span>
            <span className="brand-secondary">ROBOTICS</span>
          </div>
        </div>
        <div className="header-page-title">
          <h2>Dashboard Overview</h2>
          <span className="breadcrumb">Telemetry / Real-time</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Battery Status */}
        {connected && sysStatus && (
          <div className="battery-status-header" title={`Battery: ${sysStatus.v_batt.toFixed(2)}V`}>
            <div className="battery-icon-wrapper" style={{ color: batColor }}>
              <Battery size={14} className={batPct < 20 ? 'icon-pulse' : ''} />
              <span className="battery-value">{batPct.toFixed(0)}%</span>
            </div>
            <div className="battery-mini-bar">
              <div className="battery-mini-fill" style={{ width: `${batPct}%`, backgroundColor: batColor }}></div>
            </div>
          </div>
        )}

        {/* System State Badge */}
        {connected && (
          <div className="system-state-badge" style={{ '--state-color': stateInfo.color }}>
            <StateIcon size={14} className="state-icon" />
            <span className="state-label">SYS: {stateInfo.label}</span>
          </div>
        )}

        {/* Connection Mode Indicator */}
        {connected && (
          <div className={`session-indicator ${isMaster ? 'master' : 'follower'}`}>
            {isMaster ? <Anchor size={14} /> : <Share2 size={14} />}
            <span>{isMaster ? 'PRIMARY' : 'LINKED'}</span>
          </div>
        )}

        {/* Emergency Stop Button */}
        {connected && (
          <button className="btn btn-estop" onClick={handleEmergencyStop}>
            <AlertTriangle size={16} />
            E-STOP
          </button>
        )}
        
        {/* Robot Link badge */}
        {connected && (
          <div className={`connection-badge ${linkActive ? 'robot-active' : 'robot-inactive'}`}>
            <span className="dot pulse"></span>
            {linkActive ? 'Link Active' : 'No Robot'}
          </div>
        )}

        {/* Premium Custom Dropdown */}
        {!connected && (
          <div className="custom-dropdown-container">
            <button 
              className={`dropdown-trigger ${modeMenuOpen ? 'active' : ''}`}
              onClick={() => { setModeMenuOpen(!modeMenuOpen); setBaudMenuOpen(false); }}
            >
              {connectionMode === 'SERIAL' ? <Cpu size={14} /> : <Share2 size={14} />}
              <span>{connectionMode === 'SERIAL' ? 'Serial Link' : 'ROS 2'}</span>
              <div className={`chevron ${modeMenuOpen ? 'open' : ''}`}>▼</div>
            </button>

            {modeMenuOpen && (
              <div className="dropdown-menu">
                <div 
                  className={`menu-item ${connectionMode === 'SERIAL' ? 'selected' : ''}`}
                  onClick={() => { setConnectionMode('SERIAL'); setModeMenuOpen(false); }}
                >
                  <div className="item-icon"><Cpu size={16} /></div>
                  <div className="item-content">
                    <div className="item-title">Serial Interface</div>
                    <div className="item-desc">Direct UART/USB connection</div>
                  </div>
                </div>
                <div 
                  className={`menu-item ${connectionMode === 'ROS' ? 'selected' : ''}`}
                  onClick={() => { setConnectionMode('ROS'); setModeMenuOpen(false); }}
                >
                  <div className="item-icon"><Share2 size={16} /></div>
                  <div className="item-content">
                    <div className="item-title">ROS 2 Bridge</div>
                    <div className="item-desc">Topic-based communication</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Config (Baud or ROS URL) */}
        {!connected && (
          <div className="config-premium-box">
            <div className="config-label">{connectionMode === 'SERIAL' ? 'BAUD:' : 'URL:'}</div>
            {connectionMode === 'SERIAL' ? (
              <div className="custom-dropdown-container">
                <button 
                  className={`baud-trigger ${baudMenuOpen ? 'active' : ''}`}
                  onClick={() => { setBaudMenuOpen(!baudMenuOpen); setModeMenuOpen(false); }}
                >
                  <span>{baudRate}</span>
                  <span className="unit">bps</span>
                  <div className={`chevron ${baudMenuOpen ? 'open' : ''}`}>▼</div>
                </button>
                
                {baudMenuOpen && (
                  <div className="dropdown-menu baud-menu">
                    {[9600, 57600, 115200, 230400, 460800, 921600].map(b => (
                      <div 
                        key={b}
                        className={`menu-item-simple ${baudRate === b ? 'selected' : ''}`}
                        onClick={() => { setBaudRate(b); setBaudMenuOpen(false); }}
                      >
                        <span className="val">{b}</span>
                        <span className="unit">bps</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <input 
                type="text" 
                value={rosUrl} 
                onChange={(e) => setRosUrl(e.target.value)}
                className="input-premium"
                placeholder="ws://localhost:9090"
              />
            )}
          </div>
        )}

        {/* Action Button */}
        {connected ? (
          isMaster ? (
            <button className="btn btn-danger" onClick={onDisconnect}>
              <Unplug size={14} />
              Disconnect
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => onConnect(baudRate)}>
              <ShieldCheck size={14} />
              Take Control
            </button>
          )
        ) : (
          <button className="btn btn-primary" onClick={() => onConnect(connectionMode === 'SERIAL' ? baudRate : rosUrl)}>
            <Plug size={14} />
            Connect
          </button>
        )}
      </div>
    </header>
  );
});

export default Header;
