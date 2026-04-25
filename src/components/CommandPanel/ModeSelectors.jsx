import React from 'react';
import { useRobot } from '../../context/RobotContext';
import { Button } from '../ui/Button';
import { Cpu, Gamepad2, Zap } from 'lucide-react';
import { TOPIC_IDS, Encoders, buildPacket } from '../../utils/protocol';

export default function ModeSelectors() {
  const { telemetry, sendPacket } = useRobot();
  const sysStatus = telemetry.sysStatus;

  const setAutonomous = (isAuto) => {
    sendPacket(buildPacket(TOPIC_IDS.RX.AUTONOMOUS, Encoders.autonomous(isAuto)));
  };

  const setMobilityMode = (mode) => {
    sendPacket(buildPacket(TOPIC_IDS.RX.MOBILITY_MODE, Encoders.mobilityMode(mode, sysStatus?.enable_autonomous || 0)));
  };

  return (
    <div className="control-section">
      <h3 className="section-title">Control Modes</h3>
      <div className="btn-group-pill">
        <Button 
          variant={sysStatus?.enable_autonomous ? 'emerald' : 'outline'} 
          icon={Cpu} 
          onClick={() => setAutonomous(!sysStatus?.enable_autonomous)}
        >
          {sysStatus?.enable_autonomous ? 'AUTO ON' : 'AUTO OFF'}
        </Button>
      </div>
      
      <div className="mode-grid mt-2">
        <Button 
          variant={sysStatus?.mobility_mode === 0 ? 'cyan' : 'ghost'} 
          icon={Gamepad2} 
          onClick={() => setMobilityMode(0)}
        >
          NORMAL
        </Button>
        <Button 
          variant={sysStatus?.mobility_mode === 1 ? 'indigo' : 'ghost'} 
          icon={Zap} 
          onClick={() => setMobilityMode(1)}
        >
          SPORT
        </Button>
      </div>
    </div>
  );
}
