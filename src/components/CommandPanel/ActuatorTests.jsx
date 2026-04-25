import { useState } from 'react';
import { useRobot } from '../../context/RobotContext';
import { Button } from '../ui/Button';
import { Activity } from 'lucide-react';
import { TOPIC_IDS, Encoders, buildPacket, MOTOR_ID_ALL } from '../../utils/protocol';

export default function ActuatorTests() {
  const { sendPacket } = useRobot();
  const [testPulse, setTestPulse] = useState(0.2);

  const runTest = (id) => {
    sendPacket(buildPacket(TOPIC_IDS.RX.ACTUATOR_PWM, Encoders.actuatorTest(id, testPulse)));
  };

  return (
    <div className="control-section">
      <h3 className="section-title">Actuator Tests</h3>
      <div className="input-row mb-2">
        <label>PWM Intensity:</label>
        <input 
          type="range" min="0" max="1" step="0.05" 
          value={testPulse} onChange={(e) => setTestPulse(parseFloat(e.target.value))} 
        />
        <span className="val-text">{(testPulse * 100).toFixed(0)}%</span>
      </div>
      <div className="btn-grid-mini">
        {[0, 1, 2, 3].map(id => (
          <Button key={id} variant="outline" size="sm" onClick={() => runTest(id)}>
            M{id + 1}
          </Button>
        ))}
        <Button variant="amber" size="sm" icon={Activity} onClick={() => runTest(MOTOR_ID_ALL)}>
          ALL
        </Button>
      </div>
    </div>
  );
}
