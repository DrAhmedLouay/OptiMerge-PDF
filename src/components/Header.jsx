import React from 'react';
import { Layers, ShieldCheck, Zap, Sparkles, Globe } from 'lucide-react';

export default function Header({ lang, setLang, t }) {
  const toggleLang = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand and Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-700 shadow-lg shadow-brand-500/20 text-white font-bold">
            <Layers className="w-6 h-6" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent-500 border-2 border-slate-900 flex items-center justify-center text-[9px]">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>OptiMerge</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30">
                  PDF & Photos
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5 line-clamp-1">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Feature Badges & Language Selector */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>خصوصية محلية 100%</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-accent-400" />
              <span>أصغر حجم بأعلى وضوح</span>
            </span>
          </div>

          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 transition-colors shadow-sm"
            title="تبديل اللغة / Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-brand-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
