import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSerial } from './useSerial';
import { useRos } from './useRos';

export const CONNECTION_MODES = {
  SERIAL: 'SERIAL',
  ROS: 'ROS'
};

export function useRobotLink() {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('robot_link_mode') || CONNECTION_MODES.SERIAL;
  });

  const serial = useSerial();
  const ros = useRos();

  const activeLink = mode === CONNECTION_MODES.SERIAL ? serial : ros;

  const setConnectionMode = useCallback((newMode) => {
    if (activeLink.connected) {
      activeLink.disconnect();
    }
    setMode(newMode);
    localStorage.setItem('robot_link_mode', newMode);
  }, [activeLink, mode]);

  const connect = useCallback((options) => {
    if (mode === CONNECTION_MODES.SERIAL) {
      // options is baudRate for serial
      return serial.connect(options);
    } else {
      // options is wsUrl for ros
      return ros.connect(options);
    }
  }, [mode, serial, ros]);

  const disconnect = useCallback(() => {
    return activeLink.disconnect();
  }, [activeLink]);

  return useMemo(() => ({
    mode,
    setMode: setConnectionMode,
    ...activeLink,
    connect,
    disconnect
  }), [mode, setConnectionMode, activeLink, connect, disconnect]);
}
