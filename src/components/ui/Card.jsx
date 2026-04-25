import React from 'react';

export const Card = ({ children, title, icon: Icon, extra, className = '' }) => {
  return (
    <div className={`panel-container ${className}`}>
      <div className="panel-header">
        <div className="panel-title-group">
          {Icon && <Icon size={18} className="panel-icon" />}
          <h2 className="panel-title">{title}</h2>
        </div>
        {extra && <div className="panel-extra">{extra}</div>}
      </div>
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
};

export const CardSection = ({ title, children, className = '' }) => (
  <div className={`card-section ${className}`}>
    {title && <h3 className="section-title">{title}</h3>}
    {children}
  </div>
);
