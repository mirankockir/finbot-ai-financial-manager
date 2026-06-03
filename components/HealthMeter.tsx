
import React from 'react';

interface HealthMeterProps {
  forecastBalance: number;
  currentBalance: number;
  isNegative: boolean;
  isPrivateMode?: boolean;
}

const HealthMeter: React.FC<HealthMeterProps> = ({ forecastBalance, currentBalance, isNegative, isPrivateMode = false }) => {
  const healthPercent = isNegative ? 0 : Math.min(Math.max((forecastBalance / currentBalance) * 100, 10), 100);
  
  const statusColor = isNegative ? 'text-accent-red' : (healthPercent < 40 ? 'text-orange-500' : 'text-accent-green');
  const bgColor = isNegative ? 'bg-accent-red/10' : (healthPercent < 40 ? 'bg-orange-500/10' : 'bg-accent-green/10');
  const barColor = isNegative ? 'bg-accent-red' : (healthPercent < 40 ? 'bg-orange-500' : 'bg-accent-green');

  const displayAmount = isPrivateMode ? '••••' : `₺${forecastBalance.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;

  return (
    <div className={`w-full rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm ${bgColor} transition-colors duration-500`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Ay Sonu Tahmini</h4>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black tracking-tighter ${statusColor}`}>
              {displayAmount}
            </span>
            <span className={`text-xs font-bold ${statusColor} opacity-70`}>tahmin</span>
          </div>
        </div>
        <div className={`size-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${barColor}`}>
          <span className="material-symbols-outlined text-2xl">
            {isNegative ? 'emergency_home' : (healthPercent < 40 ? 'warning' : 'verified_user')}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Finansal Sağlık</span>
          <span className={statusColor}>{isNegative ? 'TEHLİKE' : `%${healthPercent.toFixed(0)} STABİL`}</span>
        </div>
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${barColor}`}
            style={{ width: `${isNegative ? 100 : healthPercent}%` }}
          ></div>
        </div>
      </div>

      <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 leading-snug">
        {isNegative 
          ? "⚠️ Harcama hızın mevcut varlıklarını aşıyor! Ay sonunu getirmek için tasarruf moduna geçmelisin."
          : healthPercent < 40 
            ? "Dikkat: Harcamaların hızlandı. Ay sonu bakiyen kritik seviyeye düşebilir."
            : "Harika! Mevcut hızınla ay sonunda güvenli bir birikimle kapatacaksın."}
      </p>
    </div>
  );
};

export default HealthMeter;
