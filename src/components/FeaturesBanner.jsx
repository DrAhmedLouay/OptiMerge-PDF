import React from 'react';
import { Type, Sparkles, Shield, Cpu } from 'lucide-react';

export default function FeaturesBanner({ t }) {
  const features = [
    {
      icon: Type,
      title: t.feature1Title,
      desc: t.feature1Desc,
      color: 'emerald',
    },
    {
      icon: Sparkles,
      title: t.feature2Title,
      desc: t.feature2Desc,
      color: 'sky',
    },
    {
      icon: Shield,
      title: t.feature3Title,
      desc: t.feature3Desc,
      color: 'amber',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-800/80">
      {features.map((f, i) => {
        const Icon = f.icon;
        return (
          <div
            key={i}
            className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/60 hover:border-slate-700/80 transition-all flex flex-col justify-start"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 mb-4 shadow">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-2">{f.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
