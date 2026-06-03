
import React from 'react';

interface PrivacyOverlayProps {
  isVisible: boolean;
}

const PrivacyOverlay: React.FC<PrivacyOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-bg-dark/80 backdrop-blur-2xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
      <div className="size-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl mb-6">
        <span className="material-symbols-outlined text-4xl text-white">lock</span>
      </div>
      <h2 className="text-lg font-black tracking-widest uppercase">Güvenli Alan</h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">İçerik Gizlendi</p>
    </div>
  );
};

export default PrivacyOverlay;
