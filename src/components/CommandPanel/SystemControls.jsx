import React from 'react';
import { useRobot } from '../../context/RobotContext';
import { Button } from '../ui/Button';
import { Play, Square, RotateCcw, Pause, ShieldAlert } from 'lucide-react';
import { TOPIC_IDS, SYS_EVENTS, Encoders, buildPacket } from '../../utils/protocol';

export default function SystemControls() {
  const { sendPacket, connected } = useRobot();

  const handleEvent = (eventId) => {
    sendPacket(buildPacket(TOPIC_IDS.RX.SYS_EVENT, Encoders.sysEvent(eventId)));
  };

  return (
    <div className="control-section">
      <h3 className="section-title">System Events</h3>
      <div className="btn-grid-auto">
        <Button variant="emerald" icon={Play} onClick={() => handleEvent(SYS_EVENTS.START)}>START</Button>
        <Button variant="rose" icon={Square} onClick={() => handleEvent(SYS_EVENTS.STOP)}>STOP</Button>
        <Button variant="amber" icon={Pause} onClick={() => handleEvent(SYS_EVENTS.PAUSE)}>PAUSE</Button>
        <Button variant="indigo" icon={RotateCcw} onClick={() => handleEvent(SYS_EVENTS.RESUME)}>RESUME</Button>
        <Button variant="danger" icon={ShieldAlert} onClick={() => handleEvent(SYS_EVENTS.RESET)}>RESET</Button>
      </div>
    </div>
  );
}
