import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function PreviewModal({ page, pages, onClose, onNavigate, t, lang }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(page?.rotation || 0);

  useEffect(() => {
    if (page) {
      setRotation(page.rotation || 0);
      setZoom(1);
    }
  }, [page]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') lang === 'ar' ? onNavigate(-1) : onNavigate(1);
      if (e.key === 'ArrowLeft') lang === 'ar' ? onNavigate(1) : onNavigate(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate, lang]);

  if (!page) return null;

  const currentIndex = pages.findIndex((p) => p.id === page.id);
  const total = pages.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {currentIndex + 1} / {total}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-sm">
                {page.fileName}
              </h3>
              <p className="text-[11px] text-slate-400">
                {page.fileType === 'pdf' ? 'مستند PDF (متجهات أصلية)' : 'صورة معالجة'}
              </p>
            </div>
          </div>

          {/* Zoom and Controls Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                title={t.zoomOut}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-300 px-2 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                title={t.zoomIn}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={t.rotateRight}
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-700 transition-colors"
              title={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Preview Canvas Area */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/60 relative">
          {/* Navigation Prev/Next Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={() => onNavigate(-1)}
              className="absolute start-4 z-10 p-3 rounded-2xl bg-slate-900/80 hover:bg-brand-500 text-white border border-slate-700 shadow-xl backdrop-blur-sm transition-all"
              title="الصفحة السابقة"
            >
              {lang === 'ar' ? (
                <ChevronRight className="w-6 h-6" />
              ) : (
                <ChevronLeft className="w-6 h-6" />
              )}
            </button>
          )}

          {currentIndex < total - 1 && (
            <button
              onClick={() => onNavigate(1)}
              className="absolute end-4 z-10 p-3 rounded-2xl bg-slate-900/80 hover:bg-brand-500 text-white border border-slate-700 shadow-xl backdrop-blur-sm transition-all"
              title="الصفحة التالية"
            >
              {lang === 'ar' ? (
                <ChevronLeft className="w-6 h-6" />
              ) : (
                <ChevronRight className="w-6 h-6" />
              )}
            </button>
          )}

          <div
            className="transition-transform duration-200 shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={page.thumbnailUrl}
              alt="Page Preview"
              className="max-h-[70vh] max-w-full object-contain"
            />
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>نصوص عالية الوضوح مع الحفاظ التام على التفاصيل الدقيقة</span>
          </span>
          <span>
            استخدم الأسهم في لوحة المفاتيح للتنقل بين الصفحات • ESC للإغلاق
          </span>
        </div>
      </div>
    </div>
  );
}
