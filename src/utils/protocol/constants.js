export const SYNC1 = 0xAA;
export const SYNC2 = 0x55;
export const MOTOR_ID_ALL = 0xFF;

export const TOPIC_IDS = {
  RX: {
    HEARTBEAT: 0x00,
    AUTONOMOUS: 0x01,
    MOBILITY_MODE: 0x02,
    CMD_VEL: 0x03,
    ARM_GOAL: 0x04,
    SYS_EVENT: 0x05,
    ACTUATOR_PWM: 0x06,
    ACTUATOR_VEL: 0x07,
    SET_CONFIG: 0x08,
    GET_CONFIG: 0x09,
    SAVE_CONFIG: 0x0A,
  },
  TX: {
    SYS_STATUS: 0x81,
    IMU: 0x82,
    ODOMETRY: 0x83,
    APP_CONFIG_DATA: 0x84,
    PID_DEBUG: 0x85,
    JOYSTICK_DATA: 0x86,
  }
};

export const SYS_EVENTS = {
  START: 0x01,
  STOP: 0x02,
  PAUSE: 0x03,
  RESUME: 0x04,
  RESET: 0x05,
  FAULT: 0x06,
  TEST: 0x07,
  SAVE: 0x08
};
