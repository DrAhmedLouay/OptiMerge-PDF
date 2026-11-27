import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Play,
  Download,
  Archive,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingDown,
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  compressSingleFile,
  createZipFromBatchResults,
  formatBytes,
  formatBytesEn,
} from '../utils/pdfProcessor';

export default function BatchCompressor({ t, lang }) {
  const [files, setFiles] = useState([]);
  const [targetMaxMb, setTargetMaxMb] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [results, setResults] = useState([]);
  const [zipUrl, setZipUrl] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const fmt = lang === 'ar' ? formatBytes : formatBytesEn;

  const handleFilesChosen = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (newFiles.length === 0) {
        setError(
          lang === 'ar'
            ? 'يرجى اختيار ملفات بصيغة PDF للضغط الدفعي'
            : 'Please select PDF files for batch compression'
        );
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      e.target.value = '';
    }
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setZipUrl(null);
    setError(null);
  };

  // Start Batch Compression
  const handleStartBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setResults([]);
    setZipUrl(null);

    const completedResults = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentIndex(i + 1);
        const file = files[i];
        setCurrentStatus(
          lang === 'ar'
            ? `جاري ضغط الملف (${i + 1}/${files.length}): ${file.name}...`
            : `Compressing (${i + 1}/${files.length}): ${file.name}...`
        );

        const res = await compressSingleFile(
          file,
          {
            targetMaxMb,
            compressPdfPages: true,
            sharpen: 'medium',
            whitenBackground: true,
          },
          (prog) => {
            setCurrentStatus(
              lang === 'ar'
                ? `جاري ضغط (${i + 1}/${files.length}) ${file.name} - صفحة ${prog.current}/${prog.total}...`
                : `Compressing (${i + 1}/${files.length}) ${file.name} - page ${prog.current}/${prog.total}...`
            );
          }
        );

        completedResults.push(res);
        setResults([...completedResults]);
      }

      // Generate ZIP archive for 1-click download
      if (completedResults.length > 1) {
        setCurrentStatus(lang === 'ar' ? 'إنشاء ملف ZIP للمجموعة...' : 'Generating ZIP archive...');
        const zip = await createZipFromBatchResults(completedResults);
        setZipUrl(zip);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'حدث خطأ أثناء الضغط');
    } finally {
      setIsProcessing(false);
      setCurrentStatus('');
    }
  };

  const downloadSingle = (res) => {
    const a = document.createElement('a');
    a.href = res.pdfUrl;
    const cleanName = res.fileName.toLowerCase().endsWith('.pdf')
      ? res.fileName.replace(/\.pdf$/i, '_compressed.pdf')
      : `${res.fileName}_compressed.pdf`;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalCompressedSize = results.reduce((acc, r) => acc + r.outputSize, 0);
  const totalSavedPercent =
    totalOriginalSize > 0 && results.length === files.length
      ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Description Box */}
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>{t.tabBatch}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t.tabBatchDesc}
            </p>
          </div>

          {/* Target Size Budget Selector */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <span className="text-xs text-slate-300 font-semibold whitespace-nowrap">
              الهدف لكل ملف:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { label: '< 10 MB', val: 10 },
                { label: '< 5 MB', val: 5 },
                { label: '< 2 MB', val: 2 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setTargetMaxMb(opt.val)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    targetMaxMb === opt.val
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Dropzone for Batch PDFs */}
      {files.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-3xl border-2 border-dashed border-slate-700 hover:border-brand-500/60 bg-slate-900/30 hover:bg-slate-900/60 p-12 text-center flex flex-col items-center justify-center transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf,.pdf"
            onChange={handleFilesChosen}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            اختر ملفات الـ PDF التي ترغب في تقليصها إلى أقل من 10MB
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            يمكنك اختيار 5 أو 10 أو أكثر من ملفات الـ PDF ذات الأحجام الكبيرة دفعة واحدة
          </p>
          <div className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-lg shadow-brand-500/20">
            تحديد ملفات الـ PDF
          </div>
        </div>
      ) : (
        /* Files Queue Table */
        <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 sm:p-8 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,.pdf"
                onChange={handleFilesChosen}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                + إضافة المزيد من ملفات الـ PDF
              </button>
              <span className="text-xs text-slate-400">
                {files.length} ملفات محددة ({fmt(totalOriginalSize)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearAll}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                {t.clearAll}
              </button>
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-3">
            {files.map((file, idx) => {
              const res = results[idx];
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-accent-400 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate max-w-md">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>الحجم الأصلي: {fmt(file.size)}</span>
                        {res && (
                          <>
                            <span>➔</span>
                            <span className="text-emerald-400 font-bold">
                              {fmt(res.outputSize)}
                            </span>
                            <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              -{res.savingsPercent}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {res ? (
                      <button
                        onClick={() => downloadSingle(res)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل ({fmt(res.outputSize)})</span>
                      </button>
                    ) : isProcessing && idx + 1 === currentIndex ? (
                      <span className="flex items-center gap-1 text-xs text-brand-400 font-semibold bg-brand-500/10 px-3 py-1.5 rounded-xl border border-brand-500/20 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري الضغط...</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => removeFile(idx)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Progress Banner */}
          {isProcessing && (
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 animate-pulse space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-300 font-semibold">{currentStatus}</span>
                <span className="text-white font-mono font-bold">
                  {currentIndex} / {files.length}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentIndex / files.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary and Batch Action Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {results.length === files.length && results.length > 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    اكتمل الضغط! وفرت {fmt(totalOriginalSize - totalCompressedSize)} (تقليص {totalSavedPercent}%)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  سيتم تقليص جميع الملفات لتكون أقل من {targetMaxMb} ميجابايت مع الحفاظ على وضوح ناصع للنصوص
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {zipUrl && (
                <a
                  href={zipUrl}
                  download="compressed_documents_bundle.zip"
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-md transition-all"
                >
                  <Archive className="w-4 h-4 text-accent-400" />
                  <span>{t.downloadZip}</span>
                </a>
              )}

              <button
                onClick={handleStartBatch}
                disabled={isProcessing || files.length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.batchProcessing}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{t.startBatchBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
