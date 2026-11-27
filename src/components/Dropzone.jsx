import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, ShieldCheck, Plus } from 'lucide-react';

export default function Dropzone({ onFilesSelected, isCompact, t, disabled }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = ''; // Reset input to allow selecting same files again
    }
  };

  const triggerSelect = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  if (isCompact) {
    return (
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff"
          onChange={handleInputChange}
          className="hidden"
        />
        <button
          onClick={triggerSelect}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-brand-500/50 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-brand-400" />
          <span>{t.addMoreFiles}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerSelect}
      className={`relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center flex flex-col items-center justify-center ${
        isDragOver
          ? 'border-brand-400 bg-brand-500/10 scale-[1.01] shadow-2xl shadow-brand-500/20'
          : 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-600'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600/20 via-emerald-500/20 to-accent-500/20 border border-slate-700 flex items-center justify-center text-brand-400 group-hover:scale-110 group-hover:border-brand-500/50 transition-all duration-300">
          <UploadCloud className="w-10 h-10" />
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-accent-400 shadow">
          <FileText className="w-4 h-4" />
        </div>
        <div className="absolute -bottom-2 -left-2 w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shadow">
          <ImageIcon className="w-4 h-4" />
        </div>
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
        {t.dropzoneTitle}
      </h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {t.dropzoneSubtitle}
      </p>

      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all group-hover:shadow-brand-500/40">
        <Plus className="w-4 h-4" />
        <span>{t.dropzoneTitle.includes('اسحب') ? 'اختيار الملفات من الجهاز' : 'Browse Files'}</span>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3.5 py-1.5 rounded-full border border-slate-700/50">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>{t.privacyNotice}</span>
      </div>
    </div>
  );
}
