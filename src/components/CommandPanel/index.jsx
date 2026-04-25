import React from 'react';
import { useRobot } from '../../context/RobotContext';
import { Card } from '../ui/Card';
import { Target } from 'lucide-react';
import SystemControls from './SystemControls';
import ModeSelectors from './ModeSelectors';
import ActuatorTests from './ActuatorTests';

export default function CommandPanel() {
  const { connected } = useRobot();

  return (
    <Card title="Robot Control" icon={Target}>
      <div className={`command-panel-grid ${!connected ? 'disabled-zone' : ''}`}>
        <SystemControls />
        <div className="divider-h" />
        <ModeSelectors />
        <div className="divider-h" />
        <ActuatorTests />
      </div>
    </Card>
  );
}
