import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, ImageRun, AlignmentType, BorderStyle, TextRun, Header, Footer, PageNumber, NumberFormat } from 'docx';

if (typeof window !== 'undefined') {
  const baseUrl = import.meta.env?.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${prefix}pdf.worker.min.js`;
}

// Convert points (PDF unit, 1/72 inch) to twips (1/20 point, 1/1440 inch)
const ptToTwip = (pt) => Math.round(pt * 20);
// Convert points to EMU (English Metric Units) for docx images: 1 pt = 12700 EMU
const ptToEmu = (pt) => Math.round(pt * 12700);
// Pixels to EMU at given render scale: we render at scale and know pt dims
const pxToEmu = (px, pxPerPt) => Math.round((px / pxPerPt) * 12700);

async function renderPageToPng(page, scale = 2.5) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const buf = await blob.arrayBuffer();
  return {
    data: new Uint8Array(buf),
    pxWidth: canvas.width,
    pxHeight: canvas.height,
    ptWidth: viewport.width / scale,
    ptHeight: viewport.height / scale,
  };
}

function isArabicText(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Extract text content with positioning for a selectable overlay layer.
 * Returns lines grouped by y-position.
 */
async function extractPageTextLines(page, viewport) {
  const textContent = await page.getTextContent();
  const items = textContent.items
    .filter((it) => it.str && it.str.trim().length > 0)
    .map((it) => {
      const tx = pdfjsLib.Util.transform(viewport.transform, it.transform);
      // tx = [scaleX, skewX, skewY, scaleY, x, y] in viewport coords (top-left origin after viewport transform)
      const x = tx[4];
      const y = tx[5];
      const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
      return { str: it.str, x, y, fontSize, width: it.width * viewport.scale, height: it.height * viewport.scale, fontName: it.fontName || '' };
    });

  // Group into lines by y proximity
  items.sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  let current = null;
  for (const item of items) {
    if (!current || Math.abs(item.y - current.y) > Math.max(2, item.fontSize * 0.5)) {
      current = { y: item.y, items: [item] };
      lines.push(current);
    } else {
      current.items.push(item);
    }
  }
  for (const line of lines) line.items.sort((a, b) => a.x - b.x);
  return lines;
}

export async function convertPdfToDocx(file, options = {}, onProgress) {
  const { mode = 'visual' } = options; // 'visual' = full fidelity image per page; 'hybrid' = image + hidden text
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const totalPages = pdf.numPages;
  const sections = [];

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress({ current: i, total: totalPages, percentage: Math.round((i / totalPages) * 100), status: `تحويل الصفحة ${i} من ${totalPages}...` });
    }
    const page = await pdf.getPage(i);
    const viewport1 = page.getViewport({ scale: 1 });
    const ptWidth = viewport1.width;
    const ptHeight = viewport1.height;

    // Render at 2.5x for crisp quality (180 DPI equivalent)
    const rendered = await renderPageToPng(page, 2.5);

    // Page size in twips
    const pageWidthTwip = ptToTwip(ptWidth);
    const pageHeightTwip = ptToTwip(ptHeight);

    // Image dimensions in EMU - fit exactly to page
    const imgWidthEmu = ptToEmu(ptWidth);
    const imgHeightEmu = ptToEmu(ptHeight);

    const children = [
      new Paragraph({
        spacing: { before: 0, after: 0, line: 1 },
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: rendered.data,
            transformation: { width: Math.round(ptWidth * (96 / 72)), height: Math.round(ptHeight * (96 / 72)) },
            type: 'png',
          }),
        ],
      }),
    ];

    sections.push({
      properties: {
        page: {
          size: { width: pageWidthTwip, height: pageHeightTwip },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children,
    });
  }

  const doc = new Document({
    creator: 'OptiMerge PDF',
    title: file.name.replace(/\.pdf$/i, ''),
    description: 'Converted from PDF with visual fidelity preserved',
    sections,
  });

  const blob = await Packer.toBlob(doc);
  return { blob, pageCount: totalPages, fileName: file.name.replace(/\.pdf$/i, '.docx') };
}
