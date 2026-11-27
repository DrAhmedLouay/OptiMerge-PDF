import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  CheckCircle,
  FileCheck,
  TrendingDown,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { formatBytes, formatBytesEn } from '../utils/pdfProcessor';

export default function ResultSection({ result, onReset, t, lang }) {
  const [fileName, setFileName] = useState('merged_optimized_document.pdf');

  if (!result) return null;

  const fmt = lang === 'ar' ? formatBytes : formatBytesEn;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.pdfUrl;
    a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenPdf = () => {
    window.open(result.pdfUrl, '_blank');
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 rounded-3xl border border-brand-500/30 p-6 sm:p-10 shadow-2xl shadow-brand-500/10 backdrop-blur-md animate-slide-up">
      {/* Success Badge & Title */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-500/20 text-brand-400 border border-brand-500/40 mb-4 shadow-lg shadow-brand-500/20 animate-bounce">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          {t.downloadReady}
        </h2>
        <p className="text-xs sm:text-sm text-brand-300 font-medium bg-brand-500/10 inline-block px-4 py-1.5 rounded-full border border-brand-500/20">
          {t.vectorPreservedNotice}
        </p>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Output PDF Size */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-brand-500/40 relative overflow-hidden">
          <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold mb-1">
            <FileCheck className="w-4 h-4" />
            <span>{t.compressedSize}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {fmt(result.outputSize)}
          </div>
          <span className="text-[10px] text-brand-400 font-medium mt-1 block">
            بأعلى دقة وضوح
          </span>
        </div>

        {/* Saved Ratio */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <TrendingDown className="w-4 h-4" />
            <span>{t.savedRatio}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {result.savingsPercent > 0 ? `-${result.savingsPercent}%` : '0%'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            وفرت {fmt(result.savingsBytes)}
          </span>
        </div>

        {/* Original Size */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{t.originalSize}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-300">
            {fmt(result.originalSize)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">الحجم الإجمالي قبل الدمج</span>
        </div>

        {/* Pages and Duration */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-accent-400 text-xs font-semibold mb-1">
            <Layers className="w-4 h-4" />
            <span>{t.totalPagesMerged}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {result.pageCount}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>خلال {result.durationMs} مللي ثانية</span>
          </div>
        </div>
      </div>

      {/* Visual Comparison Progress Bar */}
      {result.originalSize > 0 && (
        <div className="mb-8 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>مقارنة الحجم: الملف الناتج يمثل فقط {Math.round((result.outputSize / result.originalSize) * 100)}% من الحجم الأصلي</span>
            <span className="text-brand-400 font-bold">تخفيض بنسبة {result.savingsPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(5, Math.min(100, (result.outputSize / result.originalSize) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons & File Name Customization */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
        <div className="w-full sm:w-auto flex-1">
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            placeholder="اسم الملف الناتج..."
          />
        </div>

        <button
          onClick={handleDownload}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-white font-bold text-sm shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.02]"
        >
          <Download className="w-5 h-5" />
          <span>{t.downloadButton}</span>
        </button>

        <button
          onClick={handleOpenPdf}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-accent-400" />
          <span>{t.previewResultButton}</span>
        </button>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t.newMerge}</span>
        </button>
      </div>
    </div>
  );
}
