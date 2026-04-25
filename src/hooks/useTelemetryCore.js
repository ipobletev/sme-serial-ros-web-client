import { useState, useRef, useCallback, useEffect } from 'react';
import { TOPIC_IDS } from '../utils/protocol';

/**
 * useTelemetryCore manages the unified state of the robot telemetry,
 * including frequency tracking, history, and logging.
 * It is transport-agnostic (doesn't care if data comes from Serial or ROS).
 */
export function useTelemetryCore() {
  const [telemetry, setTelemetry] = useState({
    telemetry_period: 0,
    sysStatus: null,
    imu: null,
    odometry: null,
    appConfig: null,
    pidDebug: null,
    joystick: null,
  });
  const [frequencies, setFrequencies] = useState({});
  const [history, setHistory] = useState([]);
  const [log, setLog] = useState([]);

  // High-frequency buffers (REFS) to prevent React OOM
  const telemetryBufferRef = useRef({ ...telemetry });
  const logBufferRef = useRef([]);
  const frequenciesBufferRef = useRef({});
  const historyRef = useRef([]);
  const lastTeleTickRef = useRef(0);
  const lastTopicTicksRef = useRef({});

  // Dirty flags for throttled updates
  const isTelemetryDirtyRef = useRef(false);
  const isHistoryDirtyRef = useRef(false);
  const isFrequenciesDirtyRef = useRef(false);

  // Periodic flushing of buffers to state (Capped refresh rate)
  useEffect(() => {
    const teleInterval = setInterval(() => {
      if (isTelemetryDirtyRef.current) {
        setTelemetry(prev => ({ 
          ...telemetryBufferRef.current,
          pidDebug: telemetryBufferRef.current.pidDebug ? { ...telemetryBufferRef.current.pidDebug } : null
        }));
        isTelemetryDirtyRef.current = false;
      }
      
      if (isFrequenciesDirtyRef.current) {
        setFrequencies({ ...frequenciesBufferRef.current });
        isFrequenciesDirtyRef.current = false;
      }
      
      if (isHistoryDirtyRef.current) {
        setHistory([...historyRef.current].slice(-2000));
        isHistoryDirtyRef.current = false;
      }
    }, 100); // 10Hz UI Refresh

    const logInterval = setInterval(() => {
      if (logBufferRef.current.length > 0) {
        setLog(prev => {
          const formatted = logBufferRef.current.map(entry => ({
            ts: entry.ts,
            dir: entry.dir,
            topicId: entry.topicId,
            raw: Array.isArray(entry.rawPacket) || entry.rawPacket instanceof Uint8Array 
                 ? Array.from(entry.rawPacket).map(b => b.toString(16).padStart(2, '0')).join(' ')
                 : entry.rawPacket
          }));
          return [...formatted, ...prev].slice(0, 200);
        });
        logBufferRef.current = [];
      }
    }, 500); // 2Hz Log Refresh

    return () => {
      clearInterval(teleInterval);
      clearInterval(logInterval);
    };
  }, []);

  const addLog = useCallback((dir, topicId, raw, parsed) => {
    logBufferRef.current.push({ ts: Date.now(), dir, topicId, rawPacket: raw, parsed });
    if (logBufferRef.current.length > 500) logBufferRef.current.shift();
  }, []);

  const updateTelemetry = useCallback((topicId, parsed) => {
    const now = Date.now();
    lastTeleTickRef.current = now;
    lastTopicTicksRef.current[`0x${topicId.toString(16).padStart(2, '0')}`] = now;
    isTelemetryDirtyRef.current = true;

    switch (topicId) {
      case TOPIC_IDS.TX.SYS_STATUS:
        telemetryBufferRef.current.sysStatus = parsed;
        break;
      case TOPIC_IDS.TX.IMU:
        telemetryBufferRef.current.imu = parsed;
        break;
      case TOPIC_IDS.TX.ODOMETRY:
        telemetryBufferRef.current.odometry = parsed;
        telemetryBufferRef.current.pidDebug = {
          targetSpeed: parsed.targetSpeed,
          measuredSpeed: parsed.measuredSpeed,
          pwmOutput: parsed.pwmOutput
        };
        // Add to history
        const point = {
          timestamp: now,
          timeLabel: new Date(now).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
          vx: parsed.linear_x || 0,
          wz: parsed.angular_z || 0,
          battery: telemetryBufferRef.current.sysStatus?.v_batt || 0,
        };
        historyRef.current.push(point);
        isHistoryDirtyRef.current = true;
        break;
      case TOPIC_IDS.TX.APP_CONFIG_DATA:
        telemetryBufferRef.current.appConfig = parsed;
        break;
      case TOPIC_IDS.TX.JOYSTICK_DATA:
        telemetryBufferRef.current.joystick = parsed;
        break;
    }
  }, []);

  const updateFrequencies = useCallback((rates) => {
    frequenciesBufferRef.current = rates;
    isFrequenciesDirtyRef.current = true;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    historyRef.current = [];
  }, []);

  return {
    telemetry,
    history,
    log,
    frequencies,
    lastTopicTicks: lastTopicTicksRef.current,
    lastTeleTick: lastTeleTickRef.current,
    addLog,
    updateTelemetry,
    updateFrequencies,
    clearHistory,
    telemetryBuffer: telemetryBufferRef.current, // Useful for quick checks
  };
}
