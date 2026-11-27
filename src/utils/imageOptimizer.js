/**
 * State-of-the-Art Document Image Processing Engine
 * Preserves extreme text sharpness and contrast while minimizing JPEG file size
 * using thresholded edge unsharp masking, background whitening, and step-down resampling.
 */

export const DPI_PRESETS = {
  compact: { dpi: 150, label: '150 DPI (مضغوط ممتاز)', maxDimension: 1800 },
  balanced: { dpi: 200, label: '200 DPI (توازن فائق - موصى به)', maxDimension: 2400 },
  high: { dpi: 260, label: '260 DPI (دقة وثائق حادة جداً)', maxDimension: 2800 },
  print: { dpi: 300, label: '300 DPI (دقة طباعة كاملة)', maxDimension: 3500 },
  original: { dpi: 0, label: 'الدقة الأصلية الكاملة', maxDimension: 0 },
};

/**
 * Edge-Aware Thresholded Unsharp Mask Filter
 * Only boosts high-contrast text boundaries (|delta| > threshold).
 * Flat paper and smooth areas remain completely noise-free, eliminating JPEG ringing artifacts!
 */
export function applyEdgeAwareSharpen(imageData, strength = 'medium') {
  if (strength === 'none') return imageData;

  const params = {
    subtle: { amount: 0.6, threshold: 5, radius: 1 },
    medium: { amount: 1.1, threshold: 4, radius: 1 },
    strong: { amount: 1.8, threshold: 3, radius: 1 },
  };

  const { amount, threshold } = params[strength] || params.medium;
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  // Compute 3x3 box blur for luminance channel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        output[idx] = data[idx];
        output[idx + 1] = data[idx + 1];
        output[idx + 2] = data[idx + 2];
        output[idx + 3] = data[idx + 3];
        continue;
      }

      // Center pixel
      const cr = data[idx];
      const cg = data[idx + 1];
      const cb = data[idx + 2];
      const centerLum = 0.299 * cr + 0.587 * cg + 0.114 * cb;

      // 4-neighbor blur luminance
      const topIdx = ((y - 1) * width + x) * 4;
      const botIdx = ((y + 1) * width + x) * 4;
      const leftIdx = (y * width + (x - 1)) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;

      const blurLum =
        (0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2] +
          (0.299 * data[botIdx] + 0.587 * data[botIdx + 1] + 0.114 * data[botIdx + 2]) +
          (0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2]) +
          (0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2])) *
        0.25;

      const delta = centerLum - blurLum;

      // Only apply sharpening if contrast delta exceeds threshold (text/contour edges)
      if (Math.abs(delta) >= threshold) {
        const factor = 1 + (delta / 255) * amount;
        output[idx] = Math.min(255, Math.max(0, cr * factor));
        output[idx + 1] = Math.min(255, Math.max(0, cg * factor));
        output[idx + 2] = Math.min(255, Math.max(0, cb * factor));
      } else {
        // Flat paper/background remains smooth and noise-free!
        output[idx] = cr;
        output[idx + 1] = cg;
        output[idx + 2] = cb;
      }
      output[idx + 3] = data[idx + 3];
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Adaptive Paper Whitening & Text Stroke Deepening
 * Cleans gray scan background into pure white (255, 255, 255) which JPEG compresses to near 0 bytes!
 * Also enhances dark text contrast so letters are crisp and legible.
 */
export function applyDocumentEnhance(imageData, options = {}) {
  const { whitenBackground = true, contrastBoost = false, grayscale = false } = options;
  if (!whitenBackground && !contrastBoost && !grayscale) return imageData;

  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const a = data[i + 3];

    let lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (grayscale) {
      r = lum;
      g = lum;
      b = lum;
    }

    // 1. Paper Whitening: Background with lum > 180 is smoothly shifted to 255
    if (whitenBackground && lum > 180) {
      const t = Math.min(1.0, (lum - 180) / 45); // Smooth transition 180..225
      const whiteWeight = t * t * (3 - 2 * t); // Smoothstep curve
      r = r + (255 - r) * whiteWeight;
      g = g + (255 - g) * whiteWeight;
      b = b + (255 - b) * whiteWeight;
    }

    // 2. Text Stroke Deepening: Dark text (lum < 110) is deepened for razor-sharp reading
    if ((contrastBoost || whitenBackground) && lum < 120) {
      const darkFactor = 0.88; // Slightly deepen black ink
      r = r * darkFactor;
      g = g * darkFactor;
      b = b * darkFactor;
    }

    output[i] = Math.min(255, Math.max(0, r));
    output[i + 1] = Math.min(255, Math.max(0, g));
    output[i + 2] = Math.min(255, Math.max(0, b));
    output[i + 3] = a;
  }

  return new ImageData(output, width, height);
}

/**
 * Calculate optimal dimensions preserving aspect ratio with generous text resolution
 */
export function calculateTargetDimensions(srcWidth, srcHeight, maxDimension) {
  if (!maxDimension || (srcWidth <= maxDimension && srcHeight <= maxDimension)) {
    return { width: srcWidth, height: srcHeight };
  }

  const ratio = srcWidth / srcHeight;
  if (ratio >= 1) {
    const width = maxDimension;
    const height = Math.round(maxDimension / ratio);
    return { width, height };
  } else {
    const height = maxDimension;
    const width = Math.round(maxDimension * ratio);
    return { width, height };
  }
}

/**
 * Load an image source into an HTMLImageElement
 */
export function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let urlToRevoke = null;

    img.onload = () => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      resolve(img);
    };

    img.onerror = (err) => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      reject(new Error('فشل تحميل الصورة: ' + (err?.message || 'صيغة غير مدعومة')));
    };

    if (source instanceof Blob || source instanceof File) {
      urlToRevoke = URL.createObjectURL(source);
      img.src = urlToRevoke;
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('مصدر الصورة غير صالح'));
    }
  });
}

/**
 * High-Clarity Image Optimizer
 * Uses step-down bicubic resampling, edge unsharp mask, paper whitening,
 * and high-quality JPEG encoding with minimal file size.
 */
export async function optimizeImage(source, options = {}) {
  const {
    maxDimension = 2400,
    quality = 0.82,
    sharpen = 'medium',
    whitenBackground = true,
    contrastBoost = false,
    grayscale = false,
    forceLossless = false,
  } = options;

  const img = await loadImageElement(source);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
    srcWidth,
    srcHeight,
    maxDimension
  );

  // Multi-step resampling for large downscales prevents aliasing and maintains sharp letter edges
  let currentCanvas = document.createElement('canvas');
  currentCanvas.width = srcWidth;
  currentCanvas.height = srcHeight;
  let curCtx = currentCanvas.getContext('2d', { willReadFrequently: true });
  curCtx.imageSmoothingEnabled = true;
  curCtx.imageSmoothingQuality = 'high';
  curCtx.fillStyle = '#FFFFFF';
  curCtx.fillRect(0, 0, srcWidth, srcHeight);
  curCtx.drawImage(img, 0, 0);

  let curW = srcWidth;
  let curH = srcHeight;

  // Step down by 0.5x if scaling down significantly (> 2x)
  while (curW * 0.5 > targetWidth && curH * 0.5 > targetHeight) {
    const nextW = Math.round(curW * 0.5);
    const nextH = Math.round(curH * 0.5);
    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = nextW;
    nextCanvas.height = nextH;
    const nextCtx = nextCanvas.getContext('2d');
    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = 'high';
    nextCtx.drawImage(currentCanvas, 0, 0, nextW, nextH);
    currentCanvas = nextCanvas;
    curW = nextW;
    curH = nextH;
  }

  // Final draw to target dimensions
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.fillStyle = '#FFFFFF';
  finalCtx.fillRect(0, 0, targetWidth, targetHeight);
  finalCtx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);

  // Apply Document Image Processing Filters
  try {
    let imageData = finalCtx.getImageData(0, 0, targetWidth, targetHeight);

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

    finalCtx.putImageData(imageData, 0, 0);
  } catch (e) {
    console.warn('Canvas filter error:', e);
  }

  // Export with generous quality (80-88% default)
  const mimeType = forceLossless ? 'image/png' : 'image/jpeg';
  const exportQuality = forceLossless ? undefined : Math.max(0.40, Math.min(0.95, quality));

  const blob = await new Promise((resolve) => {
    finalCanvas.toBlob((b) => resolve(b), mimeType, exportQuality);
  });

  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  return {
    data: uint8Array,
    blob,
    width: targetWidth,
    height: targetHeight,
    originalWidth: srcWidth,
    originalHeight: srcHeight,
    mimeType,
    size: uint8Array.byteLength,
  };
}
