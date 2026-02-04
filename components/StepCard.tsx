import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
}

export const StepCard: React.FC<StepCardProps> = ({ stepNumber, title, description, icon: Icon, colorClass }) => {
  return (
    <div className="relative p-6 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all duration-300 group">
      <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${colorClass} shadow-lg z-10`}>
        {stepNumber}
      </div>
      
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-slate-900/50 ${colorClass.replace('bg-', 'text-').replace('text-white', '')} bg-opacity-20`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
        </div>
      </div>
    </div>
  );
};