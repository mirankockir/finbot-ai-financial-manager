
import React, { useState } from 'react';
import DBService from '../services/dbService';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const steps = [
  {
    title: 'Paranın Yolunu Gör',
    description: 'Harcamalarını grafiklerle analiz et, bütçendeki sızıntıları anında tespit et.',
    icon: 'pie_chart',
    color: 'from-emerald-50 to-emerald-100',
    iconColor: 'text-emerald-500'
  },
  {
    title: 'Dünya Senin, Bütçen Güvende',
    description: 'Seyahatlerinde harcamalarını anlık kurla çevir, bütçeni aşmadan gezmenin tadını çıkar.',
    icon: 'flight_takeoff',
    color: 'from-blue-50 to-blue-100',
    iconColor: 'text-blue-500'
  },
  {
    title: 'Geleceği Planla',
    description: 'Taksitlerini ve faturalarını unutma. AI asistanın senin için bakiye kontrolü yapsın.',
    icon: 'event_repeat',
    color: 'from-purple-50 to-purple-100',
    iconColor: 'text-purple-500'
  },
  {
    title: 'Verilerin Seninle Güvende',
    description: 'Biyometrik kilit ve gizli mod ile finansal verilerini her yerde güvenle yönet.',
    icon: 'fingerprint',
    color: 'from-slate-50 to-slate-200',
    iconColor: 'text-primary'
  }
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      DBService.setOnboardingComplete();
      onComplete();
    }
  };

  const handleSkip = () => {
    DBService.setOnboardingComplete();
    onComplete();
  };

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-b ${steps[currentStep].color} transition-colors duration-700 font-manrope`}>
      
      {/* Skip Button */}
      {currentStep < steps.length - 1 && (
        <div className="absolute top-12 right-8 z-20">
          <button 
            onClick={handleSkip}
            className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 py-2"
          >
            Atla
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-12 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Animated Icon Container */}
        <div className="relative">
          <div className={`size-48 rounded-[3.5rem] bg-white dark:bg-slate-800 flex items-center justify-center shadow-2xl shadow-black/5 transform rotate-3 transition-transform duration-700 ${currentStep % 2 === 0 ? 'rotate-3' : '-rotate-3'}`}>
            <span className={`material-symbols-outlined text-7xl ${steps[currentStep].iconColor} animate-float`}>
              {steps[currentStep].icon}
            </span>
          </div>
          <div className="absolute inset-0 size-48 bg-white/40 blur-3xl -z-10 animate-pulse"></div>
        </div>

        {/* Text Area */}
        <div className="text-center space-y-4 max-w-xs mx-auto">
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            {steps[currentStep].title}
          </h2>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tighter">
            {steps[currentStep].description}
          </p>
        </div>
      </div>

      {/* Footer Controls */}
      <footer className="p-10 pb-16 space-y-10">
        
        {/* Dot Indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${currentStep === idx ? 'w-8 bg-primary' : 'w-2 bg-slate-300'}`}
            ></div>
          ))}
        </div>

        {/* Action Button */}
        <button 
          onClick={handleNext}
          className="w-full bg-primary text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          {currentStep === steps.length - 1 ? (
            <>
              Hadi Başlayalım! <span className="material-symbols-outlined">rocket_launch</span>
            </>
          ) : (
            <>
              İlerle <span className="material-symbols-outlined">arrow_forward</span>
            </>
          )}
        </button>
      </footer>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
};

export default OnboardingScreen;
