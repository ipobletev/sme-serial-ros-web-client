import { useState, useEffect, useRef, useCallback } from 'react';
import { TOPIC_IDS, Encoders, buildPacket, MOTOR_ID_ALL, SYS_EVENTS } from '../../../utils/protocol';

export function usePidController(props) {
  const { 
    sendPacket, appConfig, sysStatus, connected, 
    persistentData, setPersistentData,
    settings, setSettings
  } = props;

  const { speed: testSpeed, lead: testLead, duration: testDuration, tail: testTail, motor: selectedMotor } = settings;
  
  const [testTimer, setTestTimer] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pendingPidState, setPendingPidState] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const hasAutoEnabledRef = useRef(false);
  const captureStartTsRef = useRef(0);

  const isTesting = sysStatus?.state === 6;
  const canEnterTest = sysStatus?.state === 2 || sysStatus?.state === 3;

  // Sync pending state
  useEffect(() => {
    if (appConfig && pendingPidState !== null && appConfig.pid_enabled === pendingPidState) {
      setPendingPidState(null);
    }
  }, [appConfig, pendingPidState]);

  // Auto-enable PID on first mount if off
  useEffect(() => {
    if (appConfig && appConfig.pid_enabled === 0 && !hasAutoEnabledRef.current) {
      hasAutoEnabledRef.current = true;
      sendPacket(buildPacket(TOPIC_IDS.RX.SET_CONFIG, Encoders.setConfig(0x10, 1.0)));
    } else if (appConfig && appConfig.pid_enabled === 1) {
      hasAutoEnabledRef.current = true;
    }
  }, [appConfig, sendPacket]);

  const stopStep = useCallback((stopCapture = false) => {
    if (testTimer) {
      clearTimeout(testTimer);
      setTestTimer(null);
    }
    
    const val = selectedMotor === 'all' ? MOTOR_ID_ALL : selectedMotor;
    sendPacket(buildPacket(TOPIC_IDS.RX.ACTUATOR_VEL, Encoders.actuatorVel(val, 0)));

    if (stopCapture) {
      setIsCapturing(false);
    }
  }, [testTimer, selectedMotor, sendPacket]);

  const runStep = useCallback(async () => {
    const isPidOn = (pendingPidState !== null ? pendingPidState : appConfig?.pid_enabled);
    if (!isTesting || !isPidOn) return;
    
    captureStartTsRef.current = Date.now();
    setPersistentData([]);
    setIsCapturing(true);

    if (testLead > 0) {
      await new Promise(r => setTimeout(r, testLead));
    }

    const val = parseFloat(testSpeed);
    const mId = selectedMotor === 'all' ? MOTOR_ID_ALL : selectedMotor;
    sendPacket(buildPacket(TOPIC_IDS.RX.ACTUATOR_VEL, Encoders.actuatorVel(mId, val)));

    if (testTimer) clearTimeout(testTimer);
    const timer = setTimeout(() => {
      stopStep();
      setTimeout(() => setIsCapturing(false), Math.max(0, testTail));
    }, Math.max(100, testDuration));
    
    setTestTimer(timer);
  }, [isTesting, appConfig, pendingPidState, testLead, testSpeed, selectedMotor, testDuration, testTail, testTimer, sendPacket, setPersistentData, stopStep]);

  const handleSendParam = useCallback(async (p, v, forcedMotorIdx = null) => {
    let motorsToUpdate = forcedMotorIdx !== null ? [forcedMotorIdx] : (selectedMotor === 'all' ? [0, 1, 2, 3] : [selectedMotor]);
    
    for (const mIdx of motorsToUpdate) {
      const m = mIdx + 1;
      const key = `motor${m}_${p}`;
      const map = {
        'motor1_kp': 0x40, 'motor1_ki': 0x41, 'motor1_kd': 0x42, 'motor1_deadzone': 0x43,
        'motor2_kp': 0x44, 'motor2_ki': 0x45, 'motor2_kd': 0x46, 'motor2_deadzone': 0x47,
        'motor3_kp': 0x48, 'motor3_ki': 0x49, 'motor3_kd': 0x4A, 'motor3_deadzone': 0x4B,
        'motor4_kp': 0x4C, 'motor4_ki': 0x4D, 'motor4_kd': 0x4E, 'motor4_deadzone': 0x4F,
      };
      const id = map[key];
      if (id) {
        sendPacket(buildPacket(TOPIC_IDS.RX.SET_CONFIG, Encoders.setConfig(id, parseFloat(v))));
        if (motorsToUpdate.length > 1) await new Promise(r => setTimeout(r, 5));
      }
    }
  }, [selectedMotor, sendPacket]);

  const handleSaveToFlash = useCallback(() => {
    if (window.confirm('Save to PERMANENT Flash?')) {
      setSaveStatus('saving');
      sendPacket(buildPacket(TOPIC_IDS.RX.SAVE_CONFIG, []));
      setTimeout(() => {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 700);
    }
  }, [sendPacket]);

  const togglePid = useCallback(() => {
    const newState = (pendingPidState !== null ? pendingPidState : appConfig?.pid_enabled) ? 0 : 1;
    setPendingPidState(newState);
    sendPacket(buildPacket(TOPIC_IDS.RX.SET_CONFIG, Encoders.setConfig(0x10, newState)));
    setTimeout(() => setPendingPidState(null), 2000);
  }, [pendingPidState, appConfig, sendPacket]);

  return {
    isCapturing, setIsCapturing,
    isTesting, canEnterTest,
    pendingPidState, testTimer,
    saveStatus, captureStartTsRef,
    runStep, stopStep, handleSendParam, handleSaveToFlash, togglePid
  };
}
