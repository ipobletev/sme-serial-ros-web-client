import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSerial } from './serial/useSerial';
import { useRos } from './ros/useRos';
import { useTelemetryCore } from './useTelemetryCore';

export const CONNECTION_MODES = {
  SERIAL: 'SERIAL',
  ROS: 'ROS'
};

export function useRobotLink() {
  const [connectionMode, setConnectionMode] = useState(() => {
    return localStorage.getItem('connectionMode') || CONNECTION_MODES.SERIAL;
  });

  // The Telemetry Core is the "Source of Truth" for data
  const core = useTelemetryCore();

  // Transport drivers take the core to "feed" it
  const serial = useSerial(core);
  const ros = useRos(core);

  // Persist mode choice
  useEffect(() => {
    localStorage.setItem('connectionMode', connectionMode);
  }, [connectionMode]);

  // The active link depends on the selected mode
  const activeLink = useMemo(() => {
    return connectionMode === CONNECTION_MODES.SERIAL ? serial : ros;
  }, [connectionMode, serial, ros]);

  const connect = useCallback((config) => {
    activeLink.connect(config);
  }, [activeLink]);

  const disconnect = useCallback(() => {
    activeLink.disconnect();
  }, [activeLink]);

  const sendPacket = useCallback((packet) => {
    activeLink.sendPacket(packet);
  }, [activeLink]);

  return {
    ...activeLink, // Spreads telemetry, history, log, frequencies from core + transport state
    connectionMode,
    setConnectionMode,
    connect,
    disconnect,
    sendPacket
  };
}
