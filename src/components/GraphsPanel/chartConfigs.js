import { BarChart2, Move, Activity, Compass, Zap } from 'lucide-react';

export const getChartConfigs = (targets) => [
  {
    id: 'freq',
    title: 'System Diagnostic Frequencies (Hz)',
    icon: BarChart2,
    color: 'var(--accent-indigo)',
    dataKeys: [
      { key: 'freq_imu', color: 'var(--accent-cyan)', name: 'IMU Hz', filter: 'imu', target: targets.imu },
      { key: 'freq_odom', color: 'var(--accent-emerald)', name: 'Odom Hz', filter: 'odom', target: targets.odom },
      { key: 'freq_sys', color: 'var(--accent-rose)', name: 'Sys Hz', filter: 'sys', target: targets.sys },
    ],
    unit: ' Hz'
  },
  {
    id: 'kin',
    title: 'Drive Kinematics (Velocity)',
    icon: Move,
    color: 'var(--accent-cyan)',
    dataKeys: [
      { key: 'vx', color: '#00f2fe', name: 'Linear X (m/s)' },
      { key: 'wz', color: '#4facfe', name: 'Angular Z (rad/s)' },
    ],
    unit: ''
  },
  {
    id: 'enc',
    title: 'Motor Feedback (Encoders)',
    icon: Activity,
    color: 'var(--accent-indigo)',
    dataKeys: [
      { key: 'enc1', color: '#6366f1', name: 'Enc 1' },
      { key: 'enc2', color: '#818cf8', name: 'Enc 2' },
      { key: 'enc3', color: '#a5b4fc', name: 'Enc 3' },
      { key: 'enc4', color: '#c7d2fe', name: 'Enc 4' },
    ],
    unit: ' pulses'
  },
  {
    id: 'rpy',
    title: 'IMU Orientation (RPY)',
    icon: Compass,
    color: 'var(--accent-rose)',
    dataKeys: [
      { key: 'roll', color: '#f093fb', name: 'Roll' },
      { key: 'pitch', color: '#f5576c', name: 'Pitch' },
      { key: 'yaw', color: '#48c6ef', name: 'Yaw' },
    ],
    unit: '°'
  },
  {
    id: 'accel',
    title: 'Linear Acceleration (m/s²)',
    icon: Activity,
    color: 'var(--accent-violet)',
    dataKeys: [
      { key: 'ax', color: '#8e2de2', name: 'Accel X' },
      { key: 'ay', color: '#4389af', name: 'Accel Y' },
      { key: 'az', color: '#25aae1', name: 'Accel Z' },
    ],
    unit: ' m/s²'
  },
  {
    id: 'gyro',
    title: 'Angular Velocity (rad/s)',
    icon: Compass,
    color: 'var(--accent-amber)',
    dataKeys: [
      { key: 'gx', color: '#ff9a9e', name: 'Gyro X' },
      { key: 'gy', color: '#a18cd1', name: 'Gyro Y' },
      { key: 'gz', color: '#fbc2eb', name: 'Gyro Z' },
    ],
    unit: ' rad/s'
  },
  {
    id: 'batt',
    title: 'Battery Voltage',
    icon: Zap,
    color: 'var(--accent-emerald)',
    dataKeys: [
      { key: 'battery', color: '#43e97b', name: 'Voltage (V)' },
    ],
    unit: 'V'
  },
  {
    id: 'temp',
    title: 'MCU Temperature',
    icon: Activity,
    color: '#fa709a',
    dataKeys: [
      { key: 'temp', color: '#fa709a', name: 'Temp (°C)' },
    ],
    unit: '°C'
  }
];
