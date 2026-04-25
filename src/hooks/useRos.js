import { useState, useRef, useCallback, useEffect } from 'react';
import * as ROSLIB from 'roslib';
import { TOPIC_IDS, parsePayload } from '../utils/protocol';

const MSG_TYPES = {
  HEARTBEAT: 'HEARTBEAT',
  TELEMETRY_DATA: 'TELEMETRY_DATA',
  FREQ_UPDATE: 'FREQ_UPDATE',
};

export function useRos() {
  const [connected, setConnected] = useState(false);
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

  const rosRef = useRef(null);
  const telemetryBufferRef = useRef({ ...telemetry });
  const logBufferRef = useRef([]);
  const historyRef = useRef([]);
  const frequenciesBufferRef = useRef({});
  const lastTeleTickRef = useRef(0);
  const lastTopicTicksRef = useRef({});

  const isTelemetryDirtyRef = useRef(false);
  const isHistoryDirtyRef = useRef(false);
  const isFrequenciesDirtyRef = useRef(false);

  // Throttled UI Updates (Reusable from useSerial)
  useEffect(() => {
    const teleInterval = setInterval(() => {
      if (isTelemetryDirtyRef.current) {
        setTelemetry({ ...telemetryBufferRef.current });
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
    }, 100);

    const logInterval = setInterval(() => {
      if (logBufferRef.current.length > 0) {
        setLog(prev => [...logBufferRef.current, ...prev].slice(0, 200));
        logBufferRef.current = [];
      }
    }, 500);

    return () => {
      clearInterval(teleInterval);
      clearInterval(logInterval);
    };
  }, []);

  const addLog = useCallback((dir, topicId, raw, parsed) => {
    logBufferRef.current.push({
      ts: Date.now(),
      dir,
      topicId,
      rawPacket: raw,
      parsed,
    });
  }, []);

  const tickTopic = useCallback((topicId) => {
    const key = `0x${topicId.toString(16).padStart(2, '0')}`;
    const now = Date.now();
    lastTeleTickRef.current = now;
    lastTopicTicksRef.current[key] = now;
    
    // Simple frequency estimation
    const lastTick = lastTopicTicksRef.current[key + '_prev'] || now;
    const dt = (now - lastTick) / 1000;
    if (dt > 0) {
      frequenciesBufferRef.current[key] = 1 / dt;
    }
    lastTopicTicksRef.current[key + '_prev'] = now;
    
    isFrequenciesDirtyRef.current = true;
    isTelemetryDirtyRef.current = true;
  }, []);

  const connect = useCallback((url = 'ws://localhost:9090') => {
    if (rosRef.current) return;

    const ros = new ROSLIB.Ros({ url });
    rosRef.current = ros;

    ros.on('connection', () => {
      console.log('[ROS] Connected to rosbridge');
      setConnected(true);
    });

    ros.on('error', (error) => {
      console.error('[ROS] Error connecting to rosbridge:', error);
      setConnected(false);
    });

    ros.on('close', () => {
      console.log('[ROS] Connection closed');
      setConnected(false);
      rosRef.current = null;
    });

    // --- Subscriptions ---

    // 1. Odometry
    const odomSub = new ROSLIB.Topic({
      ros,
      name: '/odom',
      messageType: 'nav_msgs/Odometry'
    });
    odomSub.subscribe((msg) => {
      tickTopic(TOPIC_IDS.TX.ODOMETRY);
      const parsed = {
        linear_x: msg.twist.twist.linear.x,
        angular_z: msg.twist.twist.angular.z,
        // Encoders and other fields might not be in standard odom, 
        // we use defaults or extend if needed
        encoders: [0,0,0,0],
        targetSpeed: [0,0,0,0],
        measuredSpeed: [0,0,0,0],
        pwmOutput: [0,0,0,0]
      };
      telemetryBufferRef.current.odometry = parsed;
      
      const point = {
        timestamp: Date.now(),
        timeLabel: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        vx: parsed.linear_x,
        wz: parsed.angular_z,
        battery: telemetryBufferRef.current.sysStatus?.v_batt || 0,
      };
      historyRef.current.push(point);
      isHistoryDirtyRef.current = true;
    });

    // 2. IMU
    const imuSub = new ROSLIB.Topic({
      ros,
      name: '/imu/data',
      messageType: 'sensor_msgs/Imu'
    });
    imuSub.subscribe((msg) => {
      tickTopic(TOPIC_IDS.TX.IMU);
      telemetryBufferRef.current.imu = {
        qx: msg.orientation.x,
        qy: msg.orientation.y,
        qz: msg.orientation.z,
        qw: msg.orientation.w,
        gyro: { x: msg.angular_velocity.x, y: msg.angular_velocity.y, z: msg.angular_velocity.z },
        accel: { x: msg.linear_acceleration.x, y: msg.linear_acceleration.y, z: msg.linear_acceleration.z }
      };
    });

    // 3. Robot Status (Custom)
    const statusSub = new ROSLIB.Topic({
      ros,
      name: '/robot/status',
      messageType: 'std_msgs/String' // Placeholder, could be custom msg
    });
    statusSub.subscribe((msg) => {
      tickTopic(TOPIC_IDS.TX.SYS_STATUS);
      try {
        const data = JSON.parse(msg.data);
        telemetryBufferRef.current.sysStatus = data;
      } catch (e) {}
    });

  }, [tickTopic]);

  const disconnect = useCallback(() => {
    if (rosRef.current) {
      rosRef.current.close();
      rosRef.current = null;
    }
    setConnected(false);
  }, []);

  const sendPacket = useCallback((packet) => {
    // For ROS mode, we map the packet ID to a ROS action
    if (!rosRef.current) return;
    const topicId = packet[2];
    const len = packet[3];
    const payload = packet.slice(4, 4 + len);

    if (topicId === TOPIC_IDS.RX.CMD_VEL) {
      // Map back to ROS cmd_vel
      const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
      const vx = view.getFloat32(0, true);
      const wz = view.getFloat32(4, true);

      const cmdVel = new ROSLIB.Topic({
        ros: rosRef.current,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
      });
      const twist = new ROSLIB.Message({
        linear: { x: vx, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: wz }
      });
      cmdVel.publish(twist);
      addLog('TX', topicId, packet, { linear_x: vx, angular_z: wz });
    } else {
      // For other packets, we could publish to a generic /robot/cmd_packet topic
      const cmdTopic = new ROSLIB.Topic({
        ros: rosRef.current,
        name: '/robot/cmd_packet',
        messageType: 'std_msgs/UInt8MultiArray'
      });
      const msg = new ROSLIB.Message({
        data: Array.from(packet)
      });
      cmdTopic.publish(msg);
      addLog('TX', topicId, packet, null);
    }
  }, [addLog]);

  return {
    connected,
    isMaster: true, // ROS client is always its own master for topics
    connect,
    disconnect,
    sendPacket,
    telemetry,
    history,
    clearHistory: () => { historyRef.current = []; setHistory([]); },
    frequencies,
    lastTopicTicks: lastTopicTicksRef.current,
    linkActive: (Date.now() - lastTeleTickRef.current) < 5000,
    log,
  };
}
