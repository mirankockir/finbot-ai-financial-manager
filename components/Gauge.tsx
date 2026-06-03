
import React from 'react';

interface GaugeProps {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
}

const Gauge: React.FC<GaugeProps> = ({ score, max = 100, size = 180, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / max) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="gauge-svg" width={size} height={size}>
        <circle
          className="text-slate-200 dark:text-slate-800"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary transition-all duration-1000 ease-out"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tracking-tighter">
          {score}<span className="text-xl font-medium text-slate-400">/{max}</span>
        </span>
      </div>
    </div>
  );
};

export default Gauge;
