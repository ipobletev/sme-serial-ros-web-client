export const PARAM_GROUPS = [
  {
    category: 'system',
    title: 'System & Debug',
    params: [
      { id: 0x01, key: 'debug_level', label: 'Debug Level', type: 'select', options: [
        { label: 'NONE', value: 0 },
        { label: 'ERROR', value: 1 },
        { label: 'WARN', value: 2 },
        { label: 'INFO', value: 3 },
        { label: 'DEBUG', value: 4 },
      ]},
      { id: 0x02, key: 'telemetry_period', label: 'Telemetry Period (ms)', type: 'number', min: 1, max: 1000 },
      { id: 0x04, key: 'sys_vars_period', label: 'System Vars Period (ms)', type: 'number', min: 50, max: 5000 },
      { id: 0x05, key: 'imu_period', label: 'IMU Sample Period (ms)', type: 'number', min: 5, max: 500 },
      { id: 0x06, key: 'odom_period', label: 'Odom Publish Period (ms)', type: 'number', min: 5, max: 1000 },
    ]
  },
  {
    category: 'system',
    title: 'Battery Configuration',
    params: [
      { id: 0x70, key: 'batt_min', label: 'Min Voltage (Fault)', type: 'number', step: 0.1, min: 5.0, max: 30.0 },
      { id: 0x71, key: 'batt_max', label: 'Max Voltage (100%)', type: 'number', step: 0.1, min: 5.0, max: 30.0 },
    ]
  },
  {
    category: 'motor',
    title: 'Motor Control',
    params: [
      { id: 0x10, key: 'pid_enabled', label: 'PID Enabled by default', type: 'boolean' },
      { id: 0x11, key: 'motor_ticks', label: 'Motor Ticks/Rev', type: 'number', min: 1 },
      { id: 0x12, key: 'motor_speed_limit', label: 'Max Speed (m/s)', type: 'number', step: 0.01, min: 0.1 },
      { id: 0x15, key: 'motor_angular_speed_limit', label: 'Max Angular (rad/s)', type: 'number', step: 0.01, min: 0.1 },
      { id: 0x14, key: 'motor_pwm_max', label: 'PWM Max', type: 'number', min: 1000, max: 65535, step: 1 },
    ]
  },
  {
    category: 'system',
    title: 'Kinematics & Chassis',
    params: [
      { id: 0x20, key: 'wheel_diameter', label: 'Wheel Diameter (m)', type: 'number', step: 0.001, min: 0.01 },
      { id: 0x21, key: 'shaft_width', label: 'Shaft Width (m)', type: 'number', step: 0.001, min: 0.05 },
      { id: 0x22, key: 'wheelbase_length', label: 'Wheelbase length (m)', type: 'number', step: 0.001, min: 0.05 },
      { id: 0x23, key: 'mobility_mode', label: 'Robot Kinematic Model', type: 'select', options: [
        { label: 'DIRECT (4-Motor Independent)', value: 0 },
        { label: 'DIFFERENTIAL (2WD / Tank)', value: 1 },
        { label: 'ACKERMANN (Car Steering)', value: 2 },
        { label: 'MECANUM (Holonomic 4WD)', value: 3 },
      ]},
    ]
  },
  {
    category: 'motor',
    title: 'Motor Multipliers (Inversion)',
    params: [
      { id: 0x31, key: 'motor1_inv', label: 'Motor 1 Dir', type: 'select', options: [{label: 'Normal (1)', value: 1}, {label: 'Inverted (-1)', value: -1}] },
      { id: 0x32, key: 'motor2_inv', label: 'Motor 2 Dir', type: 'select', options: [{label: 'Normal (1)', value: 1}, {label: 'Inverted (-1)', value: -1}] },
      { id: 0x33, key: 'motor3_inv', label: 'Motor 3 Dir', type: 'select', options: [{label: 'Normal (1)', value: 1}, {label: 'Inverted (-1)', value: -1}] },
      { id: 0x34, key: 'motor4_inv', label: 'Motor 4 Dir', type: 'select', options: [{label: 'Normal (1)', value: 1}, {label: 'Inverted (-1)', value: -1}] },
    ]
  },
  {
    category: 'motor',
    title: 'Motor Calibration',
    params: [
      { id: 0x40, key: 'motor1_kp', label: 'M1 Kp', type: 'number', step: 0.1 },
      { id: 0x41, key: 'motor1_ki', label: 'M1 Ki', type: 'number', step: 0.1 },
      { id: 0x42, key: 'motor1_kd', label: 'M1 Kd', type: 'number', step: 0.1 },
      { id: 0x43, key: 'motor1_deadzone', label: 'M1 Deadzone', type: 'number', min: 0, max: 65535 },
      { id: 0x44, key: 'motor2_kp', label: 'M2 Kp', type: 'number', step: 0.1 },
      { id: 0x45, key: 'motor2_ki', label: 'M2 Ki', type: 'number', step: 0.1 },
      { id: 0x46, key: 'motor2_kd', label: 'M2 Kd', type: 'number', step: 0.1 },
      { id: 0x47, key: 'motor2_deadzone', label: 'M2 Deadzone', type: 'number', min: 0, max: 65535 },
      { id: 0x48, key: 'motor3_kp', label: 'M3 Kp', type: 'number', step: 0.1 },
      { id: 0x49, key: 'motor3_ki', label: 'M3 Ki', type: 'number', step: 0.1 },
      { id: 0x4A, key: 'motor3_kd', label: 'M3 Kd', type: 'number', step: 0.1 },
      { id: 0x4B, key: 'motor3_deadzone', label: 'M3 Deadzone', type: 'number', min: 0, max: 65535 },
      { id: 0x4C, key: 'motor4_kp', label: 'M4 Kp', type: 'number', step: 0.1 },
      { id: 0x4D, key: 'motor4_ki', label: 'M4 Ki', type: 'number', step: 0.1 },
      { id: 0x4E, key: 'motor4_kd', label: 'M4 Kd', type: 'number', step: 0.1 },
      { id: 0x4F, key: 'motor4_deadzone', label: 'M4 Deadzone', type: 'number', min: 0, max: 65535 },
    ]
  },
  {
    category: 'gamepad',
    title: 'Gamepad Calibration',
    params: [
      { id: 0x60, key: 'joy_linear_deadzone', label: 'Linear Deadzone', type: 'number', min: 0, max: 50 },
      { id: 0x61, key: 'joy_angular_deadzone', label: 'Angular Deadzone', type: 'number', min: 0, max: 50 },
      { id: 0x62, key: 'joy_linear_gain', label: 'Linear Gain (Multiplier)', type: 'number', step: 0.01, min: 0.1, max: 5.0 },
      { id: 0x63, key: 'joy_angular_gain', label: 'Angular Gain (Multiplier)', type: 'number', step: 0.01, min: 0.1, max: 5.0 },
    ]
  }
];

export const JOY_CONSTANTS = {
  BTN_L1: 0x0100,
  BTN_R1: 0x0200,
  BTN_MODE: 0x0400,
  BTN_START: 0x0010,
  BTN_SELECT: 0x0020
};
