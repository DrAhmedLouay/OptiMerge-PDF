import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import {
  optimizeImage,
  applyEdgeAwareSharpen,
  applyDocumentEnhance,
} from './imageOptimizer.js';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  const baseUrl = import.meta.env?.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${prefix}pdf.worker.min.js`;
}

/**
 * Standard page dimensions in points (72 points per inch)
 */
export const PAGE_SIZES = {
  fit: { width: 0, height: 0, label: 'مطابقة لحجم الصورة الأصلي' },
  a4: { width: 595.28, height: 841.89, label: 'A4 قياسي (210 × 297 مم)' },
  letter: { width: 612, height: 792, label: 'US Letter (8.5 × 11 بوصة)' },
};

/**
 * Render a page of a PDF document to a data URL thumbnail
 */
export async function renderPdfPageThumbnail(pdfDoc, pageNum, maxDimension = 320) {
  const page = await pdfDoc.getPage(pageNum);
  const viewportUnscaled = page.getViewport({ scale: 1.0 });

  const scale = Math.min(
    maxDimension / viewportUnscaled.width,
    maxDimension / viewportUnscaled.height
  );
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  // Inspect page content to detect if it contains native vector text
  const textContent = await page.getTextContent();
  const textCount = textContent.items?.length || 0;
  const hasVectorText = textCount > 3;

  return {
    thumbnailUrl: canvas.toDataURL('image/jpeg', 0.85),
    width: viewportUnscaled.width,
    height: viewportUnscaled.height,
    aspectRatio: viewportUnscaled.width / viewportUnscaled.height,
    hasVectorText,
    textCount,
  };
}

/**
 * Generate a thumbnail from an image file
 */
export async function renderImageThumbnail(file, maxDimension = 320) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const srcWidth = img.naturalWidth || img.width;
      const srcHeight = img.naturalHeight || img.height;
      const scale = Math.min(maxDimension / srcWidth, maxDimension / srcHeight, 1.0);

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(srcWidth * scale);
      canvas.height = Math.round(srcHeight * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(objectUrl);
      resolve({
        thumbnailUrl: canvas.toDataURL('image/jpeg', 0.85),
        width: srcWidth,
        height: srcHeight,
        aspectRatio: srcWidth / srcHeight,
        hasVectorText: false,
        textCount: 0,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('فشل قراءة ملف الصورة'));
    };

    img.src = objectUrl;
  });
}

/**
 * Parse an uploaded file into individual page items with text detection
 */
export async function parseUploadedFile(file, fileId) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const pages = [];

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfJsBuffer = arrayBuffer.slice(0);
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfJsBuffer }).promise;
    const totalPages = pdfDoc.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const { thumbnailUrl, width, height, aspectRatio, hasVectorText, textCount } =
        await renderPdfPageThumbnail(pdfDoc, i, 320);

      pages.push({
        id: `${fileId}_p${i}_${Math.random().toString(36).substring(2, 7)}`,
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: 'pdf',
        pageIndex: i - 1, // 0-based
        pageNumber: i,
        totalPages,
        thumbnailUrl,
        rotation: 0,
        width,
        height,
        aspectRatio,
        hasVectorText,
        textCount,
        sourceBuffer: arrayBuffer,
      });
    }
  } else {
    // Image file
    const { thumbnailUrl, width, height, aspectRatio } = await renderImageThumbnail(file, 320);

    pages.push({
      id: `${fileId}_img_${Math.random().toString(36).substring(2, 7)}`,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: 'image',
      pageIndex: 0,
      pageNumber: 1,
      totalPages: 1,
      thumbnailUrl,
      rotation: 0,
      width,
      height,
      aspectRatio,
      hasVectorText: false,
      textCount: 0,
      file,
    });
  }

  return pages;
}

/**
 * High-Clarity Scanned PDF Page Re-rendering
 * Applied ONLY to scanned pages (without native vector text)
 */
export async function renderAndCompressPdfPage(pdfDoc, pageNumber, options = {}) {
  const {
    targetDpi = 220,
    maxDimension = 2600,
    quality = 0.84,
    sharpen = 'medium',
    whitenBackground = true,
    contrastBoost = true,
    grayscale = false,
  } = options;

  const page = await pdfDoc.getPage(pageNumber);
  const viewportUnscaled = page.getViewport({ scale: 1.0 });

  // High precision scale (minimum 200 DPI for text readability)
  let scale = Math.max(2.0, targetDpi / 72);
  const maxDim = Math.max(viewportUnscaled.width * scale, viewportUnscaled.height * scale);

  if (maxDimension > 0 && maxDim > maxDimension) {
    scale = maxDimension / Math.max(viewportUnscaled.width, viewportUnscaled.height);
  }

  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  // Apply Document Image Processing: Edge-aware sharpening + paper whitening
  try {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (whitenBackground || contrastBoost || grayscale) {
      imageData = applyDocumentEnhance(imageData, {
        whitenBackground,
        contrastBoost,
        grayscale,
      });
    }

    if (sharpen !== 'none') {
      imageData = applyEdgeAwareSharpen(imageData, sharpen);
    }

    ctx.putImageData(imageData, 0, 0);
  } catch (e) {
    console.warn('Canvas filter error:', e);
  }

  const exportQuality = Math.max(0.60, Math.min(0.95, quality));
  const blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', exportQuality);
  });

  const arrayBuffer = await blob.arrayBuffer();

  return {
    data: new Uint8Array(arrayBuffer),
    width: viewportUnscaled.width,
    height: viewportUnscaled.height,
  };
}

/**
 * Compute optimal compression parameters with Visual Quality Priority
 */
export function computeAutoBudgetParameters(totalPages, targetMaxMb = 10, baseOptions = {}) {
  if (!targetMaxMb || targetMaxMb <= 0) {
    return {
      targetDpi: baseOptions.dpi || 220,
      maxDimension: baseOptions.maxDimension || 2600,
      quality: baseOptions.quality ?? 0.85,
    };
  }

  // 10MB budget across totalPages
  const targetBytes = targetMaxMb * 1024 * 1024 * 0.90;
  const budgetPerPage = targetBytes / Math.max(1, totalPages);

  if (budgetPerPage >= 400 * 1024) {
    // Generous (1-22 pages < 10MB): 240 DPI, 86% quality, razor-sharp text!
    return { targetDpi: 240, maxDimension: 2600, quality: 0.86 };
  } else if (budgetPerPage >= 220 * 1024) {
    // Normal (23-45 pages < 10MB): 200 DPI, 82% quality, pristine sharpness
    return { targetDpi: 200, maxDimension: 2400, quality: 0.82 };
  } else if (budgetPerPage >= 140 * 1024) {
    // Medium (46-70 pages < 10MB): 180 DPI, 78% quality
    return { targetDpi: 180, maxDimension: 2000, quality: 0.78 };
  } else if (budgetPerPage >= 80 * 1024) {
    // Large document (70-120 pages < 10MB): 150 DPI, 72% quality
    return { targetDpi: 150, maxDimension: 1700, quality: 0.72 };
  } else {
    // Giant document (120+ pages < 10MB): 130 DPI, 65% quality
    return { targetDpi: 130, maxDimension: 1400, quality: 0.65 };
  }
}

/**
 * Merge and Optimize PDF with Hybrid Vector Preservation & High-Clarity Imaging
 * - Vector text pages: Preserved 100% losslessly (infinite sharpness + tiny size)
 * - Scanned / Image pages: Re-rendered at high DPI with edge unsharp mask & paper whitening
 */
export async function mergeAndOptimizePdf(pages, options, onProgress) {
  if (!pages || pages.length === 0) {
    throw new Error('لا توجد صفحات محددة للدمج');
  }

  const startTime = performance.now();
  const totalPages = pages.length;

  const targetMaxMb = options.targetMaxMb ?? 10;
  const budgetParams = computeAutoBudgetParameters(totalPages, targetMaxMb, options);

  const effectiveOptions = {
    ...options,
    targetDpi: options.targetDpi || budgetParams.targetDpi,
    maxDimension: options.maxDimension || budgetParams.maxDimension,
    quality: options.quality ?? budgetParams.quality,
    preserveVectorText: options.preserveVectorText !== false, // NEVER destroy vector text unless forced!
    sharpen: options.sharpen || 'medium',
    whitenBackground: options.whitenBackground !== false,
  };

  const destDoc = await PDFDocument.create();

  const pdfJsDocCache = new Map();
  const pdfLibDocCache = new Map();

  for (let index = 0; index < totalPages; index++) {
    const pageItem = pages[index];

    if (onProgress) {
      onProgress({
        current: index + 1,
        total: totalPages,
        percentage: Math.round(((index + 1) / totalPages) * 100),
        status: `معالجة الصفحة ${index + 1} من ${totalPages} (${pageItem.fileName})...`,
      });
    }

    if (pageItem.fileType === 'pdf') {
      // RULE 1: If page has native vector text, PRESERVE IT LOSSLESSLY AS VECTORS!
      // This is the fundamental key to infinite text sharpness and small file size.
      if (pageItem.hasVectorText && effectiveOptions.preserveVectorText) {
        let srcPdf = pdfLibDocCache.get(pageItem.fileId);
        if (!srcPdf) {
          srcPdf = await PDFDocument.load(pageItem.sourceBuffer, { ignoreEncryption: true });
          pdfLibDocCache.set(pageItem.fileId, srcPdf);
        }

        const [copiedPage] = await destDoc.copyPages(srcPdf, [pageItem.pageIndex]);
        if (pageItem.rotation !== 0) {
          const currentRot = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRot + pageItem.rotation) % 360));
        }
        destDoc.addPage(copiedPage);
      } else {
        // Scanned PDF page (pure bitmap scan): Re-render with high clarity pipeline
        let pdfDoc = pdfJsDocCache.get(pageItem.fileId);
        if (!pdfDoc) {
          const bufferCopy = pageItem.sourceBuffer.slice(0);
          pdfDoc = await pdfjsLib.getDocument({ data: bufferCopy }).promise;
          pdfJsDocCache.set(pageItem.fileId, pdfDoc);
        }

        const compResult = await renderAndCompressPdfPage(
          pdfDoc,
          pageItem.pageIndex + 1,
          effectiveOptions
        );

        const embeddedImage = await destDoc.embedJpg(compResult.data);
        const pdfPage = destDoc.addPage([compResult.width, compResult.height]);

        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: compResult.width,
          height: compResult.height,
        });

        if (pageItem.rotation !== 0) {
          pdfPage.setRotation(degrees(pageItem.rotation % 360));
        }
      }
    } else {
      // IMAGE FILE: High-clarity multi-step downsampling and edge-aware USM
      const optResult = await optimizeImage(pageItem.file, {
        maxDimension: effectiveOptions.maxDimension,
        quality: effectiveOptions.quality,
        sharpen: effectiveOptions.sharpen,
        whitenBackground: effectiveOptions.whitenBackground,
        contrastBoost: effectiveOptions.contrastBoost,
        grayscale: effectiveOptions.grayscale,
        forceLossless: effectiveOptions.forceLossless,
      });

      let embeddedImage;
      if (optResult.mimeType === 'image/png') {
        embeddedImage = await destDoc.embedPng(optResult.data);
      } else {
        embeddedImage = await destDoc.embedJpg(optResult.data);
      }

      const pageSizeChoice = effectiveOptions.pageSize || 'a4';
      let pageWidth = 595.28;
      let pageHeight = 841.89;

      if (pageSizeChoice === 'letter') {
        pageWidth = 612;
        pageHeight = 792;
      } else if (pageSizeChoice === 'fit') {
        const scaleDpi = effectiveOptions.targetDpi || 200;
        pageWidth = (optResult.width * 72) / scaleDpi;
        pageHeight = (optResult.height * 72) / scaleDpi;
      }

      const pdfPage = destDoc.addPage([pageWidth, pageHeight]);

      if (pageSizeChoice === 'fit') {
        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      } else {
        const margin = effectiveOptions.margin ?? 20;
        const availWidth = pageWidth - margin * 2;
        const availHeight = pageHeight - margin * 2;

        const imgAspect = optResult.width / optResult.height;
        const boxAspect = availWidth / availHeight;

        let drawWidth, drawHeight;
        if (imgAspect > boxAspect) {
          drawWidth = availWidth;
          drawHeight = availWidth / imgAspect;
        } else {
          drawHeight = availHeight;
          drawWidth = availHeight * imgAspect;
        }

        const drawX = margin + (availWidth - drawWidth) / 2;
        const drawY = margin + (availHeight - drawHeight) / 2;

        pdfPage.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        });
      }

      if (pageItem.rotation !== 0) {
        pdfPage.setRotation(degrees(pageItem.rotation % 360));
      }
    }
  }

  if (onProgress) {
    onProgress({
      current: totalPages,
      total: totalPages,
      percentage: 100,
      status: 'حزم هياكل الـ PDF النهائية (Flate & Object Streams)...',
    });
  }

  // Save with compressed object streams
  let pdfBytes = await destDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  // SECOND PASS REFINEMENT: If strict target is set and result exceeds targetMaxMb
  if (targetMaxMb > 0 && pdfBytes.byteLength > targetMaxMb * 1024 * 1024) {
    if (onProgress) {
      onProgress({
        current: totalPages,
        total: totalPages,
        percentage: 95,
        status: `ضبط ذكي لضمان نزول الحجم تحت ${targetMaxMb} ميجابايت مع الحفاظ على وضوح الخطوط...`,
      });
    }

    const ratio = (targetMaxMb * 1024 * 1024) / pdfBytes.byteLength;
    const reducedQuality = Math.max(0.65, effectiveOptions.quality * ratio * 0.92);
    const reducedDim = Math.round(effectiveOptions.maxDimension * 0.88);

    const pass2Doc = await PDFDocument.create();
    for (let index = 0; index < totalPages; index++) {
      const pageItem = pages[index];

      if (pageItem.fileType === 'pdf' && pageItem.hasVectorText && effectiveOptions.preserveVectorText) {
        let srcPdf = pdfLibDocCache.get(pageItem.fileId);
        if (!srcPdf) {
          srcPdf = await PDFDocument.load(pageItem.sourceBuffer, { ignoreEncryption: true });
          pdfLibDocCache.set(pageItem.fileId, srcPdf);
        }
        const [cp] = await pass2Doc.copyPages(srcPdf, [pageItem.pageIndex]);
        if (pageItem.rotation !== 0) cp.setRotation(degrees((cp.getRotation().angle + pageItem.rotation) % 360));
        pass2Doc.addPage(cp);
      } else if (pageItem.fileType === 'pdf') {
        let pdfDoc = pdfJsDocCache.get(pageItem.fileId);
        if (!pdfDoc) {
          pdfDoc = await pdfjsLib.getDocument({ data: pageItem.sourceBuffer.slice(0) }).promise;
          pdfJsDocCache.set(pageItem.fileId, pdfDoc);
        }
        const compResult = await renderAndCompressPdfPage(pdfDoc, pageItem.pageIndex + 1, {
          ...effectiveOptions,
          quality: reducedQuality,
          maxDimension: reducedDim,
        });
        const img = await pass2Doc.embedJpg(compResult.data);
        const p = pass2Doc.addPage([compResult.width, compResult.height]);
        p.drawImage(img, { x: 0, y: 0, width: compResult.width, height: compResult.height });
        if (pageItem.rotation !== 0) p.setRotation(degrees(pageItem.rotation % 360));
      } else {
        const optResult = await optimizeImage(pageItem.file, {
          ...effectiveOptions,
          quality: reducedQuality,
          maxDimension: reducedDim,
        });
        const img = await pass2Doc.embedJpg(optResult.data);
        const p = pass2Doc.addPage([595.28, 841.89]);
        p.drawImage(img, { x: 20, y: 20, width: 555.28, height: 801.89 });
        if (pageItem.rotation !== 0) p.setRotation(degrees(pageItem.rotation % 360));
      }
    }
    pdfBytes = await pass2Doc.save({ useObjectStreams: true, addDefaultPage: false });
  }

  const endTime = performance.now();
  const durationMs = Math.round(endTime - startTime);

  // Compute original size from unique source files (avoid counting same PDF file per page)
  const seen = new Set();
  let originalSize = 0;
  for (const p of pages) {
    if (p.fileType === 'pdf') {
      const key = p.fileId;
      if (!seen.has(key)) {
        seen.add(key);
        originalSize += p.fileSize || 0;
      }
    } else {
      originalSize += p.fileSize || 0;
    }
  }
  const outputSize = pdfBytes.byteLength;
  const savingsBytes = Math.max(0, originalSize - outputSize);
  const savingsPercent =
    originalSize > 0 ? Math.round(((originalSize - outputSize) / originalSize) * 100) : 0;

  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  const pdfUrl = URL.createObjectURL(pdfBlob);

  return {
    pdfBlob,
    pdfUrl,
    pdfBytes,
    outputSize,
    originalSize,
    savingsBytes,
    savingsPercent,
    pageCount: totalPages,
    durationMs,
  };
}

/**
 * Batch compress a single file independently to < targetMaxMb
 */
export async function compressSingleFile(file, options = {}, onProgress) {
  const fileId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const pages = await parseUploadedFile(file, fileId);

  const result = await mergeAndOptimizePdf(pages, options, onProgress);

  return {
    id: fileId,
    fileName: file.name,
    originalSize: file.size,
    outputSize: result.outputSize,
    savingsPercent: result.savingsPercent,
    pageCount: pages.length,
    pdfBlob: result.pdfBlob,
    pdfUrl: result.pdfUrl,
    durationMs: result.durationMs,
  };
}

/**
 * Create a ZIP archive from multiple compressed files
 */
export async function createZipFromBatchResults(results) {
  const zip = new JSZip();

  for (const item of results) {
    const cleanName = item.fileName.toLowerCase().endsWith('.pdf')
      ? item.fileName.replace(/\.pdf$/i, '_compressed.pdf')
      : `${item.fileName}_compressed.pdf`;

    zip.file(cleanName, item.pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return URL.createObjectURL(zipBlob);
}

/**
 * Format bytes into human-readable size
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatBytesEn(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
