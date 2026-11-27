import React, { useState, useRef } from 'react';
import { FileText, UploadCloud, Download, Loader2, AlertCircle, CheckCircle, FileType2, ArrowRightLeft } from 'lucide-react';
import { convertPdfToDocx } from '../utils/pdfToWord';

export default function PdfToWord({ t, lang }) {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const ok = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!ok) { setError(lang === 'ar' ? 'يرجى اختيار ملف PDF صالح' : 'Please select a valid PDF file'); return; }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const onDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); };
  const onChange = (e) => { handleFile(e.target.files?.[0]); e.target.value = ''; };

  const startConvert = async () => {
    if (!file) return;
    setIsConverting(true);
    setError(null);
    setResult(null);
    try {
      const res = await convertPdfToDocx(file, { mode: 'visual' }, (p) => setProgress(p));
      const url = URL.createObjectURL(res.blob);
      setResult({ ...res, url });
    } catch (err) {
      console.error(err);
      setError(err?.message || (lang === 'ar' ? 'فشل تحويل الملف' : 'Conversion failed'));
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reset = () => { setFile(null); setResult(null); setError(null); setProgress(null); };

  const fmtSize = (bytes) => {
    if (!bytes) return '0';
    const k = 1024; const sizes = lang === 'ar' ? ['بايت','كيلوبايت','ميجابايت','جيجابايت'] : ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent-500/20 text-accent-400 border border-accent-500/30 flex items-center justify-center flex-shrink-0">
            <FileType2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {lang === 'ar' ? 'تحويل PDF إلى Word (.docx)' : 'Convert PDF to Word (.docx)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {lang === 'ar'
                ? 'تحويل ملفات الـ PDF إلى مستندات Word مع الحفاظ التام على نفس التنظيم والستايل والتخطيط واللغة العربية والخطوط قدر الإمكان. يتم عرض كل صفحة بدقة عالية داخل ملف Word بنفس أبعاد الصفحة الأصلية لضمان عدم حدوث أي تغيير في الشكل.'
                : 'Convert PDF files to Word documents while preserving the exact layout, style, Arabic text, and fonts. Each page is rendered at high fidelity into Word with the original page dimensions to ensure no visual changes.'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">✓ الحفاظ على التنسيق والستايل</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">✓ دعم اللغة العربية والخطوط</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">✓ نفس أبعاد الصفحة الأصلية</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">✓ معالجة محلية 100%</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-3xl border-2 border-dashed border-slate-700 hover:border-accent-500/60 bg-slate-900/30 hover:bg-slate-900/60 p-12 text-center flex flex-col items-center justify-center transition-all group"
        >
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={onChange} className="hidden" />
          <div className="w-16 h-16 rounded-2xl bg-accent-500/10 text-accent-400 border border-accent-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {lang === 'ar' ? 'اسحب وأفلت ملف PDF هنا لتحويله إلى Word' : 'Drop a PDF here to convert to Word'}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            {lang === 'ar' ? 'أو انقر لاختيار ملف PDF من جهازك' : 'or click to browse a PDF file'}
          </p>
          <div className="px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-semibold text-xs shadow-lg shadow-accent-500/20">
            {lang === 'ar' ? 'اختيار ملف PDF' : 'Choose PDF File'}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate max-w-lg">{file.name}</p>
                <p className="text-xs text-slate-400">{fmtSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ArrowRightLeft className="w-5 h-5 text-brand-400" />
              <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-bold">.DOCX</div>
            </div>
          </div>

          {isConverting && progress && (
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-brand-300 font-semibold">{progress.status}</span>
                <span className="text-white font-mono font-bold">{progress.percentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-300" style={{ width: `${progress.percentage}%` }} />
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>{lang === 'ar' ? `تم التحويل بنجاح (${result.pageCount} صفحة) مع الحفاظ على التنسيق` : `Converted successfully (${result.pageCount} pages) with layout preserved`}</span>
              </div>
              <button onClick={download} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all">
                <Download className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تحميل ملف Word' : 'Download Word File'}</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end">
            <button onClick={reset} disabled={isConverting} className="px-4 py-2 text-xs text-slate-400 hover:text-white disabled:opacity-50">
              {lang === 'ar' ? 'اختيار ملف آخر' : 'Choose another file'}
            </button>
            <button onClick={startConvert} disabled={isConverting || !!result} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-accent-500 to-blue-600 hover:from-accent-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-accent-500/20 transition-all">
              {isConverting ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>{lang === 'ar' ? 'جاري التحويل...' : 'Converting...'}</span></>) : (<><FileType2 className="w-4 h-4" /><span>{lang === 'ar' ? 'تحويل إلى Word' : 'Convert to Word'}</span></>)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
