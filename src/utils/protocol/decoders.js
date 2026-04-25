import { TOPIC_IDS } from './constants';

/**
 * Binary Read Helpers
 */
const readFloat32 = (view, offset) => view.getFloat32(offset, true);
const readUint32 = (view, offset) => view.getUint32(offset, true);
const readInt32 = (view, offset) => view.getInt32(offset, true);
const readUint64 = (view, offset) => {
  try {
    return view.getBigUint64(offset, true);
  } catch (e) {
    const low = view.getUint32(offset, true);
    const high = view.getUint32(offset + 4, true);
    return (BigInt(high) << 32n) | BigInt(low);
  }
};

export function parsePayload(topicId, data) {
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const view = new DataView(buffer);

  try {
    switch (topicId) {
      case TOPIC_IDS.TX.SYS_STATUS: // 0x81
        return {
          errors: readUint64(view, 0).toString(),
          temp: readFloat32(view, 8),
          v_batt: readFloat32(view, 12),
          state: view.getUint8(16),
          mobility_state: view.getUint8(17),
          arm_state: view.getUint8(18),
          mobility_mode: view.getUint8(19),
          enable_autonomous: view.getUint8(20),
          emergency_active: view.getUint8(21)
        };

      case TOPIC_IDS.TX.IMU: // 0x82
        return {
          qx: readFloat32(view, 0),
          qy: readFloat32(view, 4),
          qz: readFloat32(view, 8),
          qw: readFloat32(view, 12),
          gyro: { x: readFloat32(view, 16), y: readFloat32(view, 20), z: readFloat32(view, 24) },
          accel: { x: readFloat32(view, 28), y: readFloat32(view, 32), z: readFloat32(view, 36) },
        };
 
      case TOPIC_IDS.TX.ODOMETRY: {
        return {
          linear_x: view.getFloat32(0, true),
          angular_z: view.getFloat32(4, true),
          encoders: [view.getInt32(8, true), view.getInt32(12, true), view.getInt32(16, true), view.getInt32(20, true)],
          targetSpeed: [view.getFloat32(24, true), view.getFloat32(28, true), view.getFloat32(32, true), view.getFloat32(36, true)],
          measuredSpeed: [view.getFloat32(40, true), view.getFloat32(44, true), view.getFloat32(48, true), view.getFloat32(52, true)],
          pwmOutput: [view.getFloat32(56, true), view.getFloat32(60, true), view.getFloat32(64, true), view.getFloat32(68, true)]
        };
      }
      
      case TOPIC_IDS.TX.PID_DEBUG: // 0x85
        return {
          targetSpeed: [view.getFloat32(0, true), view.getFloat32(4, true), view.getFloat32(8, true), view.getFloat32(12, true)],
          pwmOutput: [view.getFloat32(16, true), view.getFloat32(20, true), view.getFloat32(24, true), view.getFloat32(28, true)]
        };

      case TOPIC_IDS.TX.APP_CONFIG_DATA: // 0x84
        return {
          magic: readUint32(view, 0),
          debug_level: readUint32(view, 4),
          telemetry_period: readUint32(view, 8),
          sys_vars_period: readUint32(view, 12),
          imu_period: readUint32(view, 16),
          odom_period: readUint32(view, 20),
          pid_enabled: readUint32(view, 24),
          motor_ticks: readFloat32(view, 28),
          motor_speed_limit: readFloat32(view, 32),
          motor_angular_speed_limit: readFloat32(view, 36),
          motor_pwm_max: readFloat32(view, 40),
          wheel_diameter: readFloat32(view, 44),
          shaft_width: readFloat32(view, 48),
          wheelbase_length: readFloat32(view, 52),
          motor1_inv: readInt32(view, 56), motor2_inv: readInt32(view, 60), motor3_inv: readInt32(view, 64), motor4_inv: readInt32(view, 68),
          motor1_kp: readFloat32(view, 72), motor1_ki: readFloat32(view, 76), motor1_kd: readFloat32(view, 80), motor1_deadzone: readFloat32(view, 84),
          motor2_kp: readFloat32(view, 88), motor2_ki: readFloat32(view, 92), motor2_kd: readFloat32(view, 96), motor2_deadzone: readFloat32(view, 100),
          motor3_kp: readFloat32(view, 104), motor3_ki: readFloat32(view, 108), motor3_kd: readFloat32(view, 112), motor3_deadzone: readFloat32(view, 116),
          motor4_kp: readFloat32(view, 120), motor4_ki: readFloat32(view, 124), motor4_kd: readFloat32(view, 128), motor4_deadzone: readFloat32(view, 132),
          mobility_mode: readUint32(view, 136),
          joy_linear_deadzone: readFloat32(view, 140),
          joy_angular_deadzone: readFloat32(view, 144),
          joy_linear_gain: readFloat32(view, 148),
          joy_angular_gain: readFloat32(view, 152),
          batt_min: readFloat32(view, 156),
          batt_max: readFloat32(view, 160),
          crc: readUint32(view, 164)
        };

      case TOPIC_IDS.TX.JOYSTICK_DATA: // 0x86
        return {
          lx: view.getInt8(0), ly: view.getInt8(1), rx: view.getInt8(2), ry: view.getInt8(3),
          l2: view.getUint8(4), r2: view.getUint8(5),
          buttons: view.getUint16(6, true),
          connected: view.getUint8(8)
        };

      default:
        return null;
    }
  } catch (e) {
    console.error(`Error parsing payload for topic 0x${topicId.toString(16)}:`, e);
    return null;
  }
}
