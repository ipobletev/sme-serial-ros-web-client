import { calculateCRC16 } from '../crc';
import { SYNC1, SYNC2 } from './constants';

/**
 * Builds a SerialRos binary packet
 * Format: [SYNC1, SYNC2, ID, LEN, DATA..., CRC_L, CRC_H]
 */
export function buildPacket(topicId, payload = []) {
  const len = payload.length;
  const header = [SYNC1, SYNC2, topicId, len];
  const pktData = new Uint8Array([...header, ...payload]);
  
  const crc = calculateCRC16(pktData);
  const final = new Uint8Array([...pktData, crc & 0xFF, (crc >> 8) & 0xFF]);
  return final;
}

export const Encoders = {
  autonomous: (isAuto) => new Uint8Array([isAuto ? 1 : 0]),
  mobilityMode: (mode, isAuto) => new Uint8Array([mode, isAuto ? 1 : 0]),
  cmdVel: (lx, az) => {
    const buf = new ArrayBuffer(8);
    const v = new DataView(buf);
    v.setFloat32(0, lx, true);
    v.setFloat32(4, az, true);
    return new Uint8Array(buf);
  },
  armGoal: (j1, j2, j3) => {
    const buf = new ArrayBuffer(12);
    const v = new DataView(buf);
    v.setFloat32(0, j1, true); v.setFloat32(4, j2, true); v.setFloat32(8, j3, true);
    return new Uint8Array(buf);
  },
  sysEvent: (id) => new Uint8Array([id]),
  actuatorTest: (id, pulse) => {
    const buf = new ArrayBuffer(5);
    const v = new DataView(buf);
    v.setUint8(0, id); v.setFloat32(1, pulse, true);
    return new Uint8Array(buf);
  },
  actuatorVel: (id, speed) => {
    const buf = new ArrayBuffer(5);
    const v = new DataView(buf);
    v.setUint8(0, id); v.setFloat32(1, speed, true);
    return new Uint8Array(buf);
  },
  setConfig: (id, val) => {
    const buf = new ArrayBuffer(5);
    const v = new DataView(buf);
    v.setUint8(0, id); v.setFloat32(1, val, true);
    return new Uint8Array(buf);
  }
};
