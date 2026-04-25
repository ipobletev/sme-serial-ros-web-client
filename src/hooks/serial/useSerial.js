import { useState, useRef, useCallback, useEffect } from 'react';
import { calculateCRC16, parsePayload, TOPIC_IDS, buildPacket } from '../../utils/protocol';
import { useTelemetryCore } from '../useTelemetryCore';

const SYNC1 = 0xAA;
const SYNC2 = 0x55;
const CHANNEL_NAME = 'robot_serial_bridge';
const MSG_TYPES = { HEARTBEAT: 'HEARTBEAT', TELEMETRY_DATA: 'TELEMETRY_DATA', COMMAND_REQUEST: 'COMMAND_REQUEST', FREQ_UPDATE: 'FREQ_UPDATE' };

class FrameParser {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.state = 'SYNC1';
    this.id = 0;
    this.len = 0;
    this.payload = [];
    this.idx = 0;
    this.crcBuf = [];
  }
  feed(byte) {
    switch (this.state) {
      case 'SYNC1': if (byte === SYNC1) this.state = 'SYNC2'; break;
      case 'SYNC2': if (byte === SYNC2) this.state = 'ID'; else this.state = 'SYNC1'; break;
      case 'ID': this.id = byte; this.state = 'LEN'; break;
      case 'LEN': this.len = byte; this.payload = []; this.idx = 0; this.state = this.len === 0 ? 'CRC' : 'DATA'; break;
      case 'DATA': this.payload.push(byte); this.idx++; if (this.idx >= this.len) this.state = 'CRC'; break;
      case 'CRC': this.crcBuf.push(byte); if (this.crcBuf.length >= 2) { this._validate(); this.state = 'SYNC1'; this.crcBuf = []; } break;
    }
  }
  _validate() {
    const pktData = new Uint8Array([SYNC1, SYNC2, this.id, this.len, ...this.payload]);
    if (calculateCRC16(pktData) === (this.crcBuf[0] | (this.crcBuf[1] << 8))) {
      this.onFrame(this.id, new Uint8Array(this.payload));
    }
  }
}

export function useSerial(core) {
  const [connected, setConnected] = useState(false);
  const [sharedConnected, setSharedConnected] = useState(false);
  const [networkConnected, setNetworkConnected] = useState(false);
  
  // core is passed as argument
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const writerRef = useRef(null);
  const readLoopRef = useRef(false);
  const bcRef = useRef(null);
  const wsRef = useRef(null);
  const lastHeartbeatRef = useRef(0);

  const handleFrame = useCallback((topicId, data, isShared = false) => {
    const parsed = parsePayload(topicId, data);
    if (!parsed) return;

    if (!isShared) {
      core.addLog('RX', topicId, data, parsed);
      const msg = { type: MSG_TYPES.TELEMETRY_DATA, topicId, data: Array.from(data) };
      bcRef.current?.postMessage(msg);
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg));
    }
    core.updateTelemetry(topicId, parsed);
  }, [core]);

  const sendPacket = useCallback(async (packet) => {
    if (writerRef.current) {
      try {
        await writerRef.current.write(packet);
        core.addLog('TX', packet[2], packet, null);
      } catch (e) { console.error('Write error:', e); }
    } else if (sharedConnected && bcRef.current) {
      bcRef.current.postMessage({ type: MSG_TYPES.COMMAND_REQUEST, packet: Array.from(packet) });
    } else if (networkConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: MSG_TYPES.COMMAND_REQUEST, packet: Array.from(packet) }));
    }
  }, [sharedConnected, networkConnected, core]);

  // Tab Sync & Network Relay (Simplified for brevity)
  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bcRef.current = bc;
    bc.onmessage = (msg) => {
      const { type, topicId, data, packet, rates } = msg.data;
      if (connected && type === MSG_TYPES.COMMAND_REQUEST) sendPacket(new Uint8Array(packet));
      else if (!connected) {
        if (type === MSG_TYPES.HEARTBEAT) { lastHeartbeatRef.current = Date.now(); setSharedConnected(true); }
        else if (type === MSG_TYPES.TELEMETRY_DATA) handleFrame(topicId, new Uint8Array(data), true);
        else if (type === MSG_TYPES.FREQ_UPDATE) core.updateFrequencies(rates);
      }
    };
    return () => bc.close();
  }, [connected, handleFrame, sendPacket, core]);

  const connect = useCallback(async (baudRate = 230400) => {
    if (connected) return;
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate });
      portRef.current = port;
      const parser = new FrameParser(handleFrame);
      readLoopRef.current = true;
      const reader = port.readable.getReader();
      readerRef.current = reader;
      if (port.writable) writerRef.current = port.writable.getWriter();
      setConnected(true);
      sendPacket(buildPacket(TOPIC_IDS.RX.GET_CONFIG));
      (async () => {
        try {
          while (readLoopRef.current) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) for (let i = 0; i < value.length; i++) parser.feed(value[i]);
          }
        } catch (e) {} finally { reader.releaseLock(); }
      })();
    } catch (e) { console.error('Connection failed:', e); }
  }, [handleFrame, sendPacket]);

  const disconnect = useCallback(async () => {
    readLoopRef.current = false;
    try {
      if (readerRef.current) await readerRef.current.cancel();
      if (writerRef.current) writerRef.current.releaseLock();
      if (portRef.current) await portRef.current.close();
    } catch (e) {}
    setConnected(false);
    setSharedConnected(false);
    setNetworkConnected(false);
  }, []);

  return {
    ...core,
    connected: connected || sharedConnected || networkConnected,
    isMaster: connected,
    connect,
    disconnect,
    sendPacket,
    linkActive: (Date.now() - core.lastTeleTick) < 5000,
  };
}
