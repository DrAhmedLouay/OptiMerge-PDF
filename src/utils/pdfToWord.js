import * as pdfjsLib from 'pdfjs-dist';
import {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  PageBreak, ShadingType
} from 'docx';

if (typeof window !== 'undefined') {
  const baseUrl = import.meta.env?.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${prefix}pdf.worker.min.js`;
}

const ptToTwip = (pt) => Math.round(pt * 20);
const ptToHalfPt = (pt) => Math.max(12, Math.min(96, Math.round(pt * 2)));
const ptToPx96 = (pt) => Math.round(pt * 96 / 72);
const EMU_PER_PT = 12700;
const ptToEmu = (pt) => Math.round(pt * EMU_PER_PT);

function isArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || '');
}

function normalizeFontName(pdfFontName, rtl) {
  if (!pdfFontName) return rtl ? 'Arial' : 'Arial';
  const name = pdfFontName.toLowerCase();
  if (name.includes('arabic') || name.includes('amiri') || name.includes('naskh') || name.includes('kufi') || name.includes('trado')) return 'Traditional Arabic';
  if (name.includes('sakkal') || name.includes('tajawal') || name.includes('cairo') || name.includes('droid') || name.includes('noto')) return 'Arial';
  if (name.includes('times') || name.includes('roman')) return 'Times New Roman';
  if (name.includes('courier') || name.includes('mono') || name.includes('consol')) return 'Courier New';
  if (name.includes('calibri')) return 'Calibri';
  if (name.includes('tahoma')) return 'Tahoma';
  if (name.includes('arial') || name.includes('helvetica')) return 'Arial';
  const clean = pdfFontName.replace(/^[A-Z]{6}\+/, '').replace(/[-_]?Bold|[-_]?Italic|[-_]?Regular|[-_]?Light/gi, '').trim();
  return clean || (rtl ? 'Arial' : 'Arial');
}

function isBoldFont(name) { return /bold|black|heavy|demi|semibold/i.test(name || ''); }
function isItalicFont(name) { return /italic|oblique/i.test(name || ''); }

async function renderPageToPng(page, scale = 2.0) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return {
    data: new Uint8Array(await blob.arrayBuffer()),
    ptWidth: viewport.width / scale,
    ptHeight: viewport.height / scale,
  };
}

function getTextItems(textContent, viewport) {
  const items = [];
  for (const item of textContent.items) {
    const str = item.str;
    if (!str) continue;
    if (!str.replace(/\s/g, '').length) continue;
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) || 11;
    const x = tx[4];
    const y = tx[5];
    const w = Math.max(1, (item.width || 0) * viewport.scale);
    const h = Math.max(1, (item.height || fontSize) * viewport.scale);
    const rawFont = textContent.styles?.[item.fontName]?.fontFamily || item.fontName || '';
    const rtl = isArabic(str);
    items.push({
      str: str.replace(/\u00A0/g, ' '),
      x, y, width: w, height: h, fontSize,
      fontName: normalizeFontName(rawFont, rtl),
      bold: isBoldFont(rawFont) || isBoldFont(item.fontName),
      italic: isItalicFont(rawFont),
      isArabic: rtl,
    });
  }
  return items;
}

function groupIntoLines(items) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const item of sorted) {
    const tol = Math.max(2.5, item.fontSize * 0.55);
    let line = lines.find(l => Math.abs(l.y - item.y) <= tol);
    if (!line) { line = { y: item.y, items: [] }; lines.push(line); }
    line.items.push(item);
    line.y = line.items.reduce((s, it) => s + it.y, 0) / line.items.length;
  }
  lines.sort((a, b) => a.y - b.y);
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    // merge adjacent items on same line into text runs with spacing
    const merged = [];
    for (const it of line.items) {
      const last = merged[merged.length - 1];
      if (last) {
        const gap = it.x - (last.x + last.width);
        if (gap > Math.max(2, it.fontSize * 0.35)) {
          // add space if gap is significant
          const spaces = gap > it.fontSize * 1.5 ? '  ' : ' ';
          last.str += spaces + it.str;
          last.width = (it.x + it.width) - last.x;
          last.bold = last.bold || it.bold;
          last.isArabic = last.isArabic || it.isArabic;
        } else {
          last.str += it.str;
          last.width = (it.x + it.width) - last.x;
          last.bold = last.bold || it.bold;
          last.isArabic = last.isArabic || it.isArabic;
        }
      } else {
        merged.push({ ...it });
      }
    }
    line.items = merged;
    line.minX = Math.min(...line.items.map(i => i.x));
    line.maxX = Math.max(...line.items.map(i => i.x + i.width));
    line.fontSize = line.items.reduce((s, i) => s + i.fontSize, 0) / line.items.length;
    line.text = line.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
    line.isArabic = isArabic(line.text);
  }
  return lines.filter(l => l.text);
}

function clusterByX(items, gapThreshold) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const clusters = [];
  let cur = { items: [sorted[0]], minX: sorted[0].x, maxX: sorted[0].x + sorted[0].width };
  for (let k = 1; k < sorted.length; k++) {
    const it = sorted[k];
    const gap = it.x - cur.maxX;
    const thr = gapThreshold ?? Math.max(14, (it.fontSize || 11) * 1.8);
    if (gap > thr) { clusters.push(cur); cur = { items: [it], minX: it.x, maxX: it.x + it.width }; }
    else { cur.items.push(it); cur.maxX = Math.max(cur.maxX, it.x + it.width); }
  }
  clusters.push(cur);
  return clusters;
}

function detectTableBlocks(lines, pageWidth) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const clusters = clusterByX(line.items);
    if (clusters.length >= 2) {
      const tableLines = [line];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        const nextClusters = clusterByX(next.items);
        if (nextClusters.length >= 2 && columnsCompatible(clusters, nextClusters, pageWidth)) {
          tableLines.push(next); j++;
        } else if (nextClusters.length === 1 && tableLines.length >= 2 && Math.abs(next.y - tableLines[tableLines.length-1].y) < (next.fontSize * 2.2)) {
          // might be wrapped cell text - include as part of last row context? skip conservative
          break;
        } else break;
      }
      if (tableLines.length >= 2) { blocks.push({ type: 'table', lines: tableLines }); i = j; continue; }
    }
    blocks.push({ type: 'para', line }); i++;
  }
  return blocks;
}

function columnsCompatible(refClusters, clusters, pageWidth) {
  if (Math.abs(refClusters.length - clusters.length) > 1) return false;
  const refCenters = refClusters.map(c => (c.minX + c.maxX) / 2);
  const centers = clusters.map(c => (c.minX + c.maxX) / 2);
  let matches = 0;
  for (const c of centers) if (refCenters.some(rc => Math.abs(rc - c) < pageWidth * 0.10)) matches++;
  return matches >= Math.min(refCenters.length, centers.length) - 1;
}

function buildTableFromLines(tableLines, pageWidth, margin = 36) {
  const allClusters = tableLines.map(l => clusterByX(l.items));
  const maxCols = Math.max(...allClusters.map(c => c.length));
  let refCenters = [];
  for (const clusters of allClusters) { if (clusters.length === maxCols) { refCenters = clusters.map(c => (c.minX + c.maxX) / 2); break; } }
  if (!refCenters.length) refCenters = allClusters[0].map(c => (c.minX + c.maxX) / 2);
  const colCount = refCenters.length;
  const usableWidth = ptToTwip(pageWidth - margin * 2);
  const colWidth = Math.floor(usableWidth / colCount);

  const rows = tableLines.map(line => {
    const clusters = clusterByX(line.items);
    const cells = Array(colCount).fill(null).map(() => []);
    for (const cluster of clusters) {
      const center = (cluster.minX + cluster.maxX) / 2;
      let bestCol = 0, bestDist = Infinity;
      refCenters.forEach((rc, idx) => { const d = Math.abs(rc - center); if (d < bestDist) { bestDist = d; bestCol = idx; } });
      cells[bestCol].push(...cluster.items);
    }
    return new TableRow({
      children: cells.map(cellItems => {
        const sorted = cellItems.sort((a,b)=>a.x-b.x);
        const text = sorted.map(i => i.str).join(' ').replace(/\s+/g,' ').trim();
        const rtl = isArabic(text);
        const fontSize = sorted.length ? sorted.reduce((s,i)=>s+i.fontSize,0)/sorted.length : 11;
        const bold = sorted.some(i => i.bold);
        const cellRuns = sorted.length ? sorted.map((it, idx) => new TextRun({
          text: idx === sorted.length - 1 ? it.str : it.str + ' ',
          size: ptToHalfPt(it.fontSize || fontSize),
          font: normalizeFontName(it.fontName, rtl),
          bold: !!it.bold || bold,
          italics: !!it.italic,
          rightToLeft: rtl,
        })) : [new TextRun({ text: ' ', size: ptToHalfPt(fontSize) })];
        return new TableCell({
          width: { size: colWidth, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
          },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
          margins: { top: 40, bottom: 40, left: 70, right: 70 },
          children: [new Paragraph({
            bidirectional: rtl,
            alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { before: 20, after: 20, line: 240 },
            children: cellRuns,
          })],
        });
      }),
    });
  });

  return new Table({ width: { size: usableWidth, type: WidthType.DXA }, rows });
}

function buildParagraphFromLine(line, pageWidth, margin, prevBottom) {
  const text = line.text;
  if (!text) return { para: null, bottom: prevBottom };
  const rtl = line.isArabic;
  const avgFont = line.fontSize || 11;
  const bold = line.items.some(i => i.bold) || (avgFont >= 14 && text.length < 100);

  const contentLeft = margin;
  const contentRight = pageWidth - margin;
  const lineLeft = Math.max(contentLeft, line.minX);
  const lineRight = Math.min(contentRight, line.maxX);

  const leftIndentPt = Math.max(0, lineLeft - contentLeft);
  const rightIndentPt = Math.max(0, contentRight - lineRight);

  // Vertical spacing: distance from previous block bottom to this line top
  const gapPt = Math.max(0, line.y - (prevBottom ?? margin));
  const spacingBeforeTwip = ptToTwip(Math.min(Math.max(0, gapPt - avgFont * 0.2), 120));

  const runs = line.items.map((it, idx) => {
    const isLast = idx === line.items.length - 1;
    return new TextRun({
      text: isLast ? it.str : it.str + ' ',
      size: ptToHalfPt(it.fontSize || avgFont),
      font: normalizeFontName(it.fontName, rtl),
      bold: !!it.bold || (bold && line.items.length === 1),
      italics: !!it.italic,
      rightToLeft: rtl,
    });
  });

  const para = new Paragraph({
    bidirectional: rtl,
    alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
    spacing: { before: spacingBeforeTwip, after: 0, line: Math.max(240, ptToTwip(avgFont * 1.15)) },
    indent: {
      left: rtl ? ptToTwip(rightIndentPt) : ptToTwip(leftIndentPt),
      right: rtl ? ptToTwip(leftIndentPt) : ptToTwip(rightIndentPt),
    },
    children: runs.length ? runs : [new TextRun({ text: ' ', size: ptToHalfPt(avgFont) })],
  });
  const bottom = line.y + avgFont * 1.2;
  return { para, bottom };
}

async function buildEditableSections(pdf, totalPages, onProgress) {
  const sections = [];
  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({ current: i, total: totalPages, percentage: Math.round((i / totalPages) * 100), status: `استخراج النصوص والجداول - صفحة ${i}/${totalPages}...` });
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const ptW = viewport.width, ptH = viewport.height;
    const margin = 36;
    const textContent = await page.getTextContent({ normalizeWhitespace: false });
    const items = getTextItems(textContent, viewport);
    const lines = groupIntoLines(items);
    const blocks = detectTableBlocks(lines, ptW);
    const children = [];
    let prevBottom = margin;

    for (const block of blocks) {
      if (block.type === 'table') {
        const tableTop = Math.min(...block.lines.map(l => l.y));
        const gapPt = Math.max(0, tableTop - prevBottom);
        if (gapPt > 4) {
          children.push(new Paragraph({ spacing: { before: ptToTwip(Math.min(gapPt, 100)), after: 0 }, children: [new TextRun({ text: '', size: 2 })] }));
        }
        children.push(buildTableFromLines(block.lines, ptW, margin));
        const lastLine = block.lines[block.lines.length - 1];
        prevBottom = lastLine.y + (lastLine.fontSize || 11) * 1.4;
        children.push(new Paragraph({ spacing: { before: 40, after: 0 }, children: [new TextRun({ text: '', size: 2 })] }));
      } else {
        const { para, bottom } = buildParagraphFromLine(block.line, ptW, margin, prevBottom);
        if (para) { children.push(para); prevBottom = bottom; }
      }
    }
    if (!children.length) children.push(new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] }));
    sections.push({ properties: { page: { size: { width: ptToTwip(ptW), height: ptToTwip(ptH) }, margin: { top: ptToTwip(margin), right: ptToTwip(margin), bottom: ptToTwip(margin), left: ptToTwip(margin) } } }, children });
  }
  return sections;
}

async function buildVisualSections(pdf, totalPages, onProgress) {
  const sections = [];
  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({ current: i, total: totalPages, percentage: Math.round((i / totalPages) * 100), status: `تحويل بصري - صفحة ${i}/${totalPages}...` });
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const ptW = viewport.width, ptH = viewport.height;
    const rendered = await renderPageToPng(page, 2.2);
    sections.push({
      properties: { page: { size: { width: ptToTwip(ptW), height: ptToTwip(ptH) }, margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
      children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new ImageRun({ data: rendered.data, transformation: { width: ptToPx96(ptW), height: ptToPx96(ptH) }, type: 'png' })] })],
    });
  }
  return sections;
}

export async function convertPdfToDocx(file, options = {}, onProgress) {
  const { mode = 'editable' } = options; // 'editable' | 'visual'
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const totalPages = pdf.numPages;

  let sections;
  if (mode === 'visual') sections = await buildVisualSections(pdf, totalPages, onProgress);
  else sections = await buildEditableSections(pdf, totalPages, onProgress);

  const doc = new Document({
    creator: 'OptiMerge PDF',
    title: file.name.replace(/\.pdf$/i, ''),
    description: 'Converted from PDF',
    styles: { default: { document: { run: { font: 'Arial', size: 22 }, paragraph: { spacing: { line: 276 } } } } },
    sections,
  });

  const blob = await Packer.toBlob(doc);
  return { blob, pageCount: totalPages, fileName: file.name.replace(/\.pdf$/i, '.docx') };
}
