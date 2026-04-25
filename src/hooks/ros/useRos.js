import { useState, useRef, useCallback } from 'react';
import * as ROSLIB from 'roslib';
import { TOPIC_IDS } from '../../utils/protocol';
import { useTelemetryCore } from '../useTelemetryCore';

export function useRos(core) {
  const [connected, setConnected] = useState(false);
  const rosRef = useRef(null);

  const tickTopic = useCallback((topicId) => {
    const key = `0x${topicId.toString(16).padStart(2, '0')}`;
    const now = Date.now();
    const rates = { ...core.frequencies };
    
    const lastTick = core.lastTopicTicks[key + '_prev'] || now;
    const dt = (now - lastTick) / 1000;
    if (dt > 0) {
      rates[key] = 1 / dt;
    }
    core.lastTopicTicks[key + '_prev'] = now;
    core.updateFrequencies(rates);
  }, [core]);

  const connect = useCallback((url = 'ws://localhost:9090') => {
    if (rosRef.current) return;

    const ros = new ROSLIB.Ros({ url });
    rosRef.current = ros;

    ros.on('connection', () => {
      console.log('[ROS] Connected');
      setConnected(true);
    });

    ros.on('error', () => setConnected(false));
    ros.on('close', () => {
      setConnected(false);
      rosRef.current = null;
    });

    // Subscriptions
    const odomSub = new ROSLIB.Topic({ ros, name: '/odom', messageType: 'nav_msgs/Odometry' });
    odomSub.subscribe((msg) => {
      tickTopic(TOPIC_IDS.TX.ODOMETRY);
      core.updateTelemetry(TOPIC_IDS.TX.ODOMETRY, {
        linear_x: msg.twist.twist.linear.x,
        angular_z: msg.twist.twist.angular.z,
        encoders: [0,0,0,0], targetSpeed: [0,0,0,0], measuredSpeed: [0,0,0,0], pwmOutput: [0,0,0,0]
      });
    });

    const imuSub = new ROSLIB.Topic({ ros, name: '/imu/data', messageType: 'sensor_msgs/Imu' });
    imuSub.subscribe((msg) => {
      tickTopic(TOPIC_IDS.TX.IMU);
      core.updateTelemetry(TOPIC_IDS.TX.IMU, {
        qx: msg.orientation.x, qy: msg.orientation.y, qz: msg.orientation.z, qw: msg.orientation.w,
        gyro: { x: msg.angular_velocity.x, y: msg.angular_velocity.y, z: msg.angular_velocity.z },
        accel: { x: msg.linear_acceleration.x, y: msg.linear_acceleration.y, z: msg.linear_acceleration.z }
      });
    });

    const statusSub = new ROSLIB.Topic({ ros, name: '/robot/status', messageType: 'std_msgs/String' });
    statusSub.subscribe((msg) => {
      tickTopic(TOPIC_IDS.TX.SYS_STATUS);
      try { core.updateTelemetry(TOPIC_IDS.TX.SYS_STATUS, JSON.parse(msg.data)); } catch (e) {}
    });

  }, [tickTopic, core]);

  const disconnect = useCallback(() => {
    if (rosRef.current) rosRef.current.close();
    setConnected(false);
  }, []);

  const sendPacket = useCallback((packet) => {
    if (!rosRef.current) return;
    const topicId = packet[2];
    const len = packet[3];
    const payload = packet.slice(4, 4 + len);

    if (topicId === TOPIC_IDS.RX.CMD_VEL) {
      const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
      const vx = view.getFloat32(0, true);
      const wz = view.getFloat32(4, true);

      const cmdVel = new ROSLIB.Topic({ ros: rosRef.current, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
      cmdVel.publish(new ROSLIB.Message({
        linear: { x: vx, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: wz }
      }));
      core.addLog('TX', topicId, packet, { linear_x: vx, angular_z: wz });
    } else {
      const cmdTopic = new ROSLIB.Topic({ ros: rosRef.current, name: '/robot/cmd_packet', messageType: 'std_msgs/UInt8MultiArray' });
      cmdTopic.publish(new ROSLIB.Message({ data: Array.from(packet) }));
      core.addLog('TX', topicId, packet, null);
    }
  }, [core]);

  return {
    ...core,
    connected,
    isMaster: true,
    connect,
    disconnect,
    sendPacket,
    linkActive: (Date.now() - core.lastTeleTick) < 5000,
  };
}
