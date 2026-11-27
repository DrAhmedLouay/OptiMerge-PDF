import React, { useState } from 'react';
import {
  RotateCw,
  RotateCcw,
  Trash2,
  Maximize2,
  ArrowRight,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  CheckSquare,
  Square,
  GripVertical,
} from 'lucide-react';
import Dropzone from './Dropzone';

export default function PageGrid({
  pages,
  setPages,
  onOpenPreview,
  onFilesSelected,
  t,
  lang,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Rotation handler
  const handleRotate = (pageId, delta) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === pageId) {
          const newRot = (p.rotation + delta + 360) % 360;
          return { ...p, rotation: newRot };
        }
        return p;
      })
    );
  };

  // Delete single page
  const handleDelete = (pageId) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });
  };

  // Move page manually
  const movePage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      movePage(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Selection handlers
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(pages.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    setPages((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  };

  const rotateSelected = (delta = 90) => {
    setPages((prev) =>
      prev.map((p) => {
        if (selectedIds.has(p.id)) {
          return { ...p, rotation: (p.rotation + delta + 360) % 360 };
        }
        return p;
      })
    );
  };

  const clearAll = () => {
    setPages([]);
    setSelectedIds(new Set());
  };

  return (
    <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 sm:p-8 backdrop-blur-sm">
      {/* Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">{t.pagesManagerTitle}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-bold text-xs border border-brand-500/30">
              {pages.length} {t.pagesCount}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t.dragTip}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Dropzone onFilesSelected={onFilesSelected} isCompact t={t} />

          {selectedIds.size > 0 ? (
            <>
              <button
                onClick={() => rotateSelected(90)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <RotateCw className="w-3.5 h-3.5 text-brand-400" />
                <span>تدوير المحدد</span>
              </button>

              <button
                onClick={deleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>{t.deleteSelected} ({selectedIds.size})</span>
              </button>

              <button
                onClick={deselectAll}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
              >
                {t.deselectAll}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={selectAll}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80"
              >
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.selectAll}</span>
              </button>

              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.clearAll}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {pages.map((page, index) => {
          const isSelected = selectedIds.has(page.id);
          const isBeingDragged = draggedIndex === index;
          const isDragTarget = dragOverIndex === index;

          return (
            <div
              key={page.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`group relative rounded-2xl bg-slate-950/80 border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                isBeingDragged ? 'opacity-40 scale-95 border-brand-500 border-dashed' : ''
              } ${
                isDragTarget ? 'border-brand-400 ring-2 ring-brand-500/40 scale-105' : ''
              } ${
                isSelected
                  ? 'border-brand-500 ring-1 ring-brand-500 shadow-md shadow-brand-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Top Bar */}
              <div className="p-2.5 flex items-center justify-between gap-1 bg-slate-900/90 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleSelect(page.id)}
                    className="text-slate-400 hover:text-brand-400 focus:outline-none"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                    )}
                  </button>
                  <span className="text-[11px] font-bold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">
                    #{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[90px]">
                  {page.fileType === 'pdf' ? (
                    <FileText className="w-3 h-3 text-accent-400 flex-shrink-0" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  )}
                  <span className="truncate" title={page.fileName}>
                    {page.fileName}
                  </span>
                </div>
              </div>

              {/* Thumbnail Container */}
              <div
                onClick={() => onOpenPreview(page)}
                className="relative aspect-[3/4] p-3 flex items-center justify-center bg-slate-900/40 cursor-pointer overflow-hidden group/thumb"
              >
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-300"
                  style={{ transform: `rotate(${page.rotation}deg)` }}
                >
                  <img
                    src={page.thumbnailUrl}
                    alt={`Page ${index + 1}`}
                    className="max-w-full max-h-full object-contain rounded shadow-md pointer-events-none"
                    loading="lazy"
                  />
                </div>

                {/* Hover overlay with zoom button */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 rounded-xl bg-slate-800/90 text-white shadow-lg border border-slate-700 flex items-center gap-1.5 text-xs font-semibold">
                    <Maximize2 className="w-3.5 h-3.5 text-brand-400" />
                    <span>معاينة</span>
                  </div>
                </div>

                {/* Page Type Badge (Vector vs Scan vs Image) */}
                {page.fileType === 'pdf' ? (
                  page.hasVectorText ? (
                    <span className="absolute bottom-1.5 start-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-accent-600/90 text-white shadow backdrop-blur-sm z-10">
                      متجهات أصلية 100%
                    </span>
                  ) : (
                    <span className="absolute bottom-1.5 start-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-600/90 text-white shadow backdrop-blur-sm z-10">
                      ماسحة ضوئية
                    </span>
                  )
                ) : (
                  <span className="absolute bottom-1.5 start-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-600/90 text-white shadow backdrop-blur-sm z-10">
                    صورة محسنة
                  </span>
                )}

                {/* Rotation indicator badge if rotated */}
                {page.rotation !== 0 && (
                  <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/80 text-white shadow z-10">
                    {page.rotation}°
                  </span>
                )}
              </div>

              {/* Card Footer / Quick Action Controls */}
              <div className="p-1.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleRotate(page.id, -90)}
                    title={t.rotateLeft}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRotate(page.id, 90)}
                    title={t.rotateRight}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Move Left / Right Buttons */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => movePage(index, lang === 'ar' ? index + 1 : index - 1)}
                    disabled={lang === 'ar' ? index === pages.length - 1 : index === 0}
                    className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="تحريك"
                  >
                    {lang === 'ar' ? (
                      <ArrowRight className="w-3 h-3" />
                    ) : (
                      <ArrowLeft className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => movePage(index, lang === 'ar' ? index - 1 : index + 1)}
                    disabled={lang === 'ar' ? index === 0 : index === pages.length - 1}
                    className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="تحريك"
                  >
                    {lang === 'ar' ? (
                      <ArrowLeft className="w-3 h-3" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(page.id)}
                    title={t.deletePage}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
