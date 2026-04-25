import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

export const GainSlider = ({ label, value, step, onSend }) => {
  const [tempValue, setTempValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setTempValue(value);
  }, [value, isEditing]);

  const handleSend = () => {
    onSend(tempValue);
    setIsEditing(false);
  };

  const isDirty = Math.abs(parseFloat(tempValue) - value) > 0.0001;

  return (
    <div className="gain-slider-item">
      <div className="gain-info">
        <span className="gain-label">{label}</span>
        <div className="gain-value-input-row">
          <input 
            type="number" 
            className="gain-num-input" 
            value={tempValue} 
            step={step} 
            onChange={(e) => { setTempValue(e.target.value); setIsEditing(true); }}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setTimeout(() => setIsEditing(false), 200)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn-send-param" onClick={handleSend} disabled={!isDirty}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
