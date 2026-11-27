import React, { useState } from 'react';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import PresetSelector from './components/PresetSelector';
import PageGrid from './components/PageGrid';
import PreviewModal from './components/PreviewModal';
import ResultSection from './components/ResultSection';
import FeaturesBanner from './components/FeaturesBanner';
import BatchCompressor from './components/BatchCompressor';
import PdfToWord from './components/PdfToWord';
import { translations } from './utils/translations';
import { parseUploadedFile, mergeAndOptimizePdf } from './utils/pdfProcessor';
import {
  Sparkles,
  ArrowDownCircle,
  AlertCircle,
  Loader2,
  Layers,
  Files,
  Zap,
  FileType2,
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState('ar');
  const t = translations[lang];

  // Active workflow tab: 'merge' | 'batch' | 'pdf2word'
  const [activeTab, setActiveTab] = useState('merge');

  // Target Max Budget (Default 10 MB for guaranteed < 10MB file size)
  const [targetMaxMb, setTargetMaxMb] = useState(10);
  // Recompress PDF pages toggle (Default true to shrink heavy scan PDFs)
  const [compressPdfPages, setCompressPdfPages] = useState(true);

  const [pages, setPages] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState('');

  const [preset, setPreset] = useState('balanced');
  const [customOptions, setCustomOptions] = useState({
    quality: 0.78,
    dpi: 180,
    maxDimension: 1920,
    sharpen: 'medium',
    whitenBackground: true,
    contrastBoost: false,
    grayscale: false,
    pageSize: 'a4',
    margin: 20,
  });

  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [previewPage, setPreviewPage] = useState(null);

  // File Upload Handling
  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;
    setIsParsing(true);
    setError(null);

    try {
      const allNewPages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setParseStatus(
          lang === 'ar'
            ? `جاري قراءة واستخراج صفحات: ${file.name} (${i + 1}/${files.length})...`
            : `Extracting pages from: ${file.name} (${i + 1}/${files.length})...`
        );
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const extracted = await parseUploadedFile(file, fileId);
        allNewPages.push(...extracted);
      }
      setPages((prev) => [...prev, ...allNewPages]);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'حدث خطأ أثناء قراءة الملفات');
    } finally {
      setIsParsing(false);
      setParseStatus('');
    }
  };

  // Merge Handling
  const handleStartMerge = async () => {
    if (pages.length === 0) return;
    setIsMerging(true);
    setError(null);
    setResult(null);

    let effectiveOptions = {
      ...customOptions,
      targetMaxMb,
      compressPdfPages,
    };

    if (preset === 'ultra_sharp') {
      effectiveOptions = {
        maxDimension: 2560,
        dpi: 240,
        quality: 0.85,
        sharpen: 'medium',
        whitenBackground: true,
        contrastBoost: true,
        grayscale: false,
        pageSize: 'a4',
        margin: 20,
        targetMaxMb,
        compressPdfPages,
      };
    } else if (preset === 'balanced') {
      effectiveOptions = {
        maxDimension: 1920,
        dpi: 180,
        quality: 0.78,
        sharpen: 'subtle',
        whitenBackground: true,
        contrastBoost: false,
        grayscale: false,
        pageSize: 'a4',
        margin: 20,
        targetMaxMb,
        compressPdfPages,
      };
    } else if (preset === 'compact') {
      effectiveOptions = {
        maxDimension: 1400,
        dpi: 130,
        quality: 0.65,
        sharpen: 'strong',
        whitenBackground: true,
        contrastBoost: true,
        grayscale: false,
        pageSize: 'a4',
        margin: 15,
        targetMaxMb,
        compressPdfPages,
      };
    } else if (preset === 'print') {
      effectiveOptions = {
        maxDimension: 3500,
        dpi: 300,
        quality: 0.92,
        sharpen: 'subtle',
        whitenBackground: false,
        contrastBoost: false,
        grayscale: false,
        pageSize: 'a4',
        margin: 20,
        targetMaxMb: 0, // No limit for print
        compressPdfPages,
      };
    }

    try {
      const mergeRes = await mergeAndOptimizePdf(pages, effectiveOptions, (prog) => {
        setMergeProgress(prog);
      });
      setResult(mergeRes);
      // Smooth scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'فشلت عملية دمج وضغط الملفات');
    } finally {
      setIsMerging(false);
      setMergeProgress(null);
    }
  };

  // Preview Modal navigation
  const handleModalNavigate = (direction) => {
    if (!previewPage) return;
    const currentIndex = pages.findIndex((p) => p.id === previewPage.id);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < pages.length) {
      setPreviewPage(pages[nextIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header lang={lang} setLang={setLang} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Mode Tabs */}
        <div className="flex items-center justify-center">
          <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-2 max-w-3xl w-full">
            <button
              onClick={() => setActiveTab('merge')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'merge'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.tabMerge}</span>
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'batch'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Files className="w-4 h-4" />
              <span>{t.tabBatch}</span>
            </button>

            <button
              onClick={() => setActiveTab('pdf2word')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'pdf2word'
                  ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileType2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تحويل PDF إلى Word' : 'PDF to Word'}</span>
              <span className="text-[10px] bg-blue-400/20 text-blue-200 px-1.5 py-0.5 rounded-md hidden sm:inline">جديد</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 3: PDF to Word */}
        {activeTab === 'pdf2word' ? (
          <PdfToWord t={t} lang={lang} />
        ) : activeTab === 'batch' ? (
          <BatchCompressor t={t} lang={lang} />
        ) : (
          /* Tab 1: Merge & Compress into Single PDF */
          <div className="space-y-6">
            {/* Upload Parsing Indicator */}
            {isParsing && (
              <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center gap-3 text-brand-300 text-sm animate-pulse-fast">
                <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                <span className="font-semibold">{parseStatus}</span>
              </div>
            )}

            {pages.length === 0 ? (
              <div className="space-y-10">
                <div className="text-center max-w-2xl mx-auto pt-4 pb-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 inline-flex items-center gap-1.5 mb-3">
                    <Zap className="w-3.5 h-3.5" />
                    <span>تقليص مضمون إلى أقل من 10MB مع نصوص فائقة الوضوح</span>
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    {lang === 'ar'
                      ? 'دمج الصور وملفات الـ PDF مع ضمان حجم أقل من 10MB'
                      : 'Merge Images & PDFs with Guaranteed < 10MB Size'}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {lang === 'ar'
                      ? 'تقوم الخوارزمية الذكية بإعادة تشكيل وضغط ملفات الـ PDF الثقيلة وتطبيق فلتر شحذ الحواف (Unsharp Mask) وتبييض ورق الماسحات الضوئية لتقليص الحجم من 50MB+ إلى أقل من 10MB بأعلى وضوح ممكن.'
                      : 'Smart adaptive engine re-encodes heavy PDF scans, applies Unsharp Mask edge sharpening, and whitens paper backgrounds to shrink 50MB+ down to < 10MB.'}
                  </p>
                </div>

                <Dropzone
                  onFilesSelected={handleFilesSelected}
                  isCompact={false}
                  t={t}
                  disabled={isParsing}
                />

                <FeaturesBanner t={t} />
              </div>
            ) : (
              /* When files are loaded */
              <div className="space-y-6">
                {/* Compression Presets & Target Budget Selector */}
                <PresetSelector
                  preset={preset}
                  setPreset={setPreset}
                  targetMaxMb={targetMaxMb}
                  setTargetMaxMb={setTargetMaxMb}
                  compressPdfPages={compressPdfPages}
                  setCompressPdfPages={setCompressPdfPages}
                  customOptions={customOptions}
                  setCustomOptions={setCustomOptions}
                  t={t}
                  lang={lang}
                />

                {/* Visual Page Manager & Grid */}
                <PageGrid
                  pages={pages}
                  setPages={setPages}
                  onOpenPreview={(page) => setPreviewPage(page)}
                  onFilesSelected={handleFilesSelected}
                  t={t}
                  lang={lang}
                />

                {/* Merge Action CTA Card */}
                <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand-400" />
                      <span>
                        {lang === 'ar'
                          ? `جاهز لدمج ${pages.length} صفحة وتقليص الحجم إلى ${targetMaxMb > 0 ? `أقل من ${targetMaxMb}MB` : 'أصغر حجم'}`
                          : `Ready to merge ${pages.length} pages under ${targetMaxMb > 0 ? `${targetMaxMb}MB` : 'minimal size'}`}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {lang === 'ar'
                        ? 'سيتم تطبيق فلتر شحذ الحروف وتبييض الخلفية لضمان دقة ناصعة وحجم فائق الصغر'
                        : 'Unsharp mask & scan background whitening will be applied for razor text sharpness and compact size'}
                    </p>
                  </div>

                  <button
                    onClick={handleStartMerge}
                    disabled={isMerging || pages.length === 0}
                    className="w-full md:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    {isMerging ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t.mergingButton}</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="w-5 h-5" />
                        <span>
                          {lang === 'ar'
                            ? `بدء الدمج والتقليص إلى أقل من ${targetMaxMb}MB`
                            : `Start Merge & Shrink to < ${targetMaxMb}MB`}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Active Merging Progress Bar */}
                {isMerging && mergeProgress && (
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-brand-500/30 animate-fade-in space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-brand-300">{mergeProgress.status}</span>
                      <span className="font-bold text-white font-mono">{mergeProgress.percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300 rounded-full"
                        style={{ width: `${mergeProgress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Result Section */}
                {result && (
                  <ResultSection
                    result={result}
                    onReset={() => {
                      setResult(null);
                      setPages([]);
                    }}
                    t={t}
                    lang={lang}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Fullscreen Page Preview Modal */}
      {previewPage && (
        <PreviewModal
          page={previewPage}
          pages={pages}
          onClose={() => setPreviewPage(null)}
          onNavigate={handleModalNavigate}
          t={t}
          lang={lang}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>OptiMerge PDF • تم التطوير لتحقيق أعلى دقة وضوح للنصوص والصور بأصغر حجم ملف • معالجة محلية آمنة 100%</p>
      </footer>
    </div>
  );
}
