import React, { createContext, useContext } from 'react';
import { useRobotLink } from '../hooks/useRobotLink';

const RobotContext = createContext(null);

export function RobotProvider({ children }) {
  const robot = useRobotLink();
  
  return (
    <RobotContext.Provider value={robot}>
      {children}
    </RobotContext.Provider>
  );
}

export function useRobot() {
  const context = useContext(RobotContext);
  if (!context) {
    throw new Error('useRobot must be used within a RobotProvider');
  }
  return context;
}
