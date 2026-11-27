import React from 'react';
import {
  Sliders,
  Sparkles,
  Feather,
  Printer,
  Check,
  Eye,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function PresetSelector({
  preset,
  setPreset,
  targetMaxMb,
  setTargetMaxMb,
  compressPdfPages,
  setCompressPdfPages,
  customOptions,
  setCustomOptions,
  t,
  lang,
}) {
  const presets = [
    {
      id: 'balanced',
      icon: Sparkles,
      title: t.presetBalanced,
      desc: t.presetBalancedDesc,
      tag: lang === 'ar' ? 'موصى به • < 10MB' : 'Recommended • < 10MB',
      highlight: true,
      color: 'emerald',
    },
    {
      id: 'ultra_sharp',
      icon: Eye,
      title: t.presetUltraSharp,
      desc: t.presetUltraSharpDesc,
      tag: lang === 'ar' ? 'نصوص فائقة الحدة' : 'Crisp Text Details',
      color: 'sky',
    },
    {
      id: 'compact',
      icon: Feather,
      title: t.presetCompact,
      desc: t.presetCompactDesc,
      tag: lang === 'ar' ? 'توفير حتى 90%' : 'Up to 90% Smaller',
      color: 'amber',
    },
    {
      id: 'print',
      icon: Printer,
      title: t.presetPrint,
      desc: t.presetPrintDesc,
      tag: lang === 'ar' ? '300 DPI دقة طباعة' : '300 DPI Print Spec',
      color: 'indigo',
    },
    {
      id: 'custom',
      icon: Sliders,
      title: t.presetCustom,
      desc: t.presetCustomDesc,
      tag: lang === 'ar' ? 'تحكم كامل' : 'Full Manual Tuning',
      color: 'purple',
    },
  ];

  const updateCustom = (key, value) => {
    setCustomOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 sm:p-8 backdrop-blur-sm space-y-6">
      {/* Target Max Size Budget Banner (CRITICAL for < 10MB requirement) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-950/60 via-slate-900/80 to-slate-900/80 border border-brand-500/40 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {t.targetBudgetTitle}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                مضمون تلقائياً
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              {t.targetBudgetDesc}
            </p>
          </div>
        </div>

        {/* Target MB Choice Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'أقل من 10 MB', val: 10, rec: true },
            { label: 'أقل من 5 MB', val: 5 },
            { label: 'أقل من 2 MB', val: 2 },
            { label: 'بدون قيد', val: 0 },
          ].map((item) => {
            const isPicked = targetMaxMb === item.val;
            return (
              <button
                key={item.val}
                onClick={() => setTargetMaxMb(item.val)}
                className={`relative px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isPicked
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {item.label}
                {item.rec && (
                  <span className="absolute -top-1.5 -right-1 px-1 py-0.2 bg-emerald-400 text-slate-950 font-black text-[8px] rounded-full">
                    موصى به
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hybrid Clarity Engine Banner */}
      <div className="px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={compressPdfPages}
            onChange={(e) => setCompressPdfPages(e.target.checked)}
            className="w-4 h-4 rounded text-brand-500 bg-slate-800 border-slate-700 focus:ring-brand-500"
          />
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              الحفاظ التلقائي على متجهات النصوص + تنقية ذكية للماسحات الضوئية
            </span>
            <span className="text-[11px] text-slate-400 block">
              يحتفظ بنصوص الـ PDF الرقمية كمتجهات أصلية 100% دون تحويلها لصور، ويطبق خوارزمية الشحذ الموضعي وتبييض الورق للصور والماسحات
            </span>
          </div>
        </label>
        <span className="text-[10px] text-brand-400 font-semibold bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
          حدة مطلقة للنصوص • حجم أقل من 10MB
        </span>
      </div>

      {/* Preset Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>{t.presetsTitle}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((item) => {
            const isSelected = preset === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => setPreset(item.id)}
                className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 border flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-brand-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-xs text-white mb-1 leading-snug">{item.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {item.desc}
                  </p>
                </div>

                <div>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    {item.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Options Panel (shown when 'custom' is active) */}
      {preset === 'custom' && (
        <div className="mt-4 pt-6 border-t border-slate-800/80 bg-slate-950/40 -mx-6 -mb-6 p-6 rounded-b-3xl space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-purple-300">{t.advancedSettings}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quality Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">{t.imageQuality}</span>
                <span className="text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded">
                  {Math.round(customOptions.quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={customOptions.quality}
                onChange={(e) => updateCustom('quality', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>أصغر حجم (20%)</span>
                <span>توازن (75%-80%)</span>
                <span>أعلى جودة (100%)</span>
              </div>
            </div>

            {/* DPI Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">{t.targetDpi}</span>
                <span className="text-accent-400 font-bold bg-accent-500/10 px-2 py-0.5 rounded">
                  {customOptions.dpi === 0 ? 'أصلي' : `${customOptions.dpi} DPI`}
                </span>
              </div>
              <select
                value={customOptions.dpi}
                onChange={(e) => {
                  const dpi = parseInt(e.target.value, 10);
                  const maxDims = { 130: 1400, 180: 1920, 240: 2560, 300: 3500, 0: 0 };
                  updateCustom('dpi', dpi);
                  updateCustom('maxDimension', maxDims[dpi] || 2000);
                }}
                className="w-full text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="130">130 DPI (مضغوط فائق - 1400 بكسل)</option>
                <option value="180">180 DPI (متوازن ممتاز - 1920 بكسل)</option>
                <option value="240">240 DPI (وضوح فائق للمستندات - 2560 بكسل)</option>
                <option value="300">300 DPI (دقة طباعة كاملة - 3500 بكسل)</option>
                <option value="0">الدقة الأصلية الكاملة بدون تصغير</option>
              </select>
            </div>

            {/* Sharpen Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">{t.sharpenFilter}</span>
              </div>
              <select
                value={customOptions.sharpen}
                onChange={(e) => updateCustom('sharpen', e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="none">{t.sharpenNone}</option>
                <option value="subtle">{t.sharpenSubtle}</option>
                <option value="medium">{t.sharpenMedium}</option>
                <option value="strong">{t.sharpenStrong}</option>
              </select>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={customOptions.whitenBackground}
                onChange={(e) => updateCustom('whitenBackground', e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 bg-slate-800 border-slate-700 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-300 select-none">{t.whitenBg}</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={customOptions.contrastBoost}
                onChange={(e) => updateCustom('contrastBoost', e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 bg-slate-800 border-slate-700 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-300 select-none">{t.contrastBoost}</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={customOptions.grayscale}
                onChange={(e) => updateCustom('grayscale', e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 bg-slate-800 border-slate-700 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-300 select-none">{t.grayscale}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
