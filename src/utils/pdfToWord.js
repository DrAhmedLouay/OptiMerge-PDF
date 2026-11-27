import * as pdfjsLib from 'pdfjs-dist';
import {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  HeadingLevel, PageBreak, convertMillimetersToTwip
} from 'docx';

if (typeof window !== 'undefined') {
  const baseUrl = import.meta.env?.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${prefix}pdf.worker.min.js`;
}

const ptToTwip = (pt) => Math.round(pt * 20);
const ptToHalfPt = (pt) => Math.round(pt * 2); // docx font size is half-points

function isArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || '');
}

function normalizeFontName(pdfFontName) {
  if (!pdfFontName) return 'Arial';
  const name = pdfFontName.toLowerCase();
  if (name.includes('arabic') || name.includes('amiri') || name.includes('naskh') || name.includes('kufi')) return 'Traditional Arabic';
  if (name.includes('times')) return 'Times New Roman';
  if (name.includes('courier') || name.includes('mono')) return 'Courier New';
  if (name.includes('calibri')) return 'Calibri';
  if (name.includes('tahoma')) return 'Tahoma';
  if (name.includes('arial')) return 'Arial';
  // Strip common prefixes like ABCDEF+FontName
  const clean = pdfFontName.replace(/^[A-Z]{6}\+/, '');
  return clean || 'Arial';
}

function getTextContentItems(textContent, viewport) {
  const items = [];
  for (const item of textContent.items) {
    const str = item.str;
    if (!str || !str.replace(/\s/g, '').length) {
      // preserve spaces as markers
      if (str === ' ') items.push({ type: 'space' });
      continue;
    }
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    // tx: [scaleX, skewX, skewY, scaleY, x, y]
    const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) || 11;
    const x = tx[4];
    const y = tx[5]; // viewport y, increases downward
    const w = (item.width || 0) * viewport.scale;
    const h = (item.height || fontSize) * viewport.scale;
    const fontName = textContent.styles?.[item.fontName]?.fontFamily || item.fontName || '';
    items.push({
      str,
      x,
      y,
      fontSize,
      width: w,
      height: h,
      fontName: normalizeFontName(fontName),
      isArabic: isArabic(str),
      hasEOL: !!item.hasEOL,
    });
  }
  return items;
}

function groupIntoLines(items, yToleranceFactor = 0.5) {
  const sorted = [...items].filter(i => i.type !== 'space').sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const item of sorted) {
    const tol = Math.max(2, item.fontSize * yToleranceFactor);
    let line = lines.find(l => Math.abs(l.y - item.y) <= tol);
    if (!line) {
      line = { y: item.y, items: [] };
      lines.push(line);
    }
    line.items.push(item);
    // update line y to average for stability
    line.y = line.items.reduce((s, it) => s + it.y, 0) / line.items.length;
  }
  lines.sort((a, b) => a.y - b.y);
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    line.minX = Math.min(...line.items.map(i => i.x));
    line.maxX = Math.max(...line.items.map(i => i.x + i.width));
    line.fontSize = line.items.reduce((s, i) => s + i.fontSize, 0) / line.items.length;
    line.text = line.items.map(i => i.str).join('');
    line.isArabic = isArabic(line.text);
  }
  return lines;
}

function detectTableBlocks(lines, pageWidth) {
  // Heuristic: detect sequences of lines that have multiple distinct x-clusters (columns)
  // and similar column boundaries across consecutive lines.
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const clusters = clusterByX(line.items);
    if (clusters.length >= 2) {
      // try to extend table
      const tableLines = [line];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        const nextClusters = clusterByX(next.items);
        if (nextClusters.length >= 2 && columnsCompatible(clusters, nextClusters, pageWidth)) {
          tableLines.push(next);
          j++;
        } else if (nextClusters.length === 1 && tableLines.length >= 2) {
          // could be a spanning row inside table, be conservative
          break;
        } else {
          break;
        }
      }
      if (tableLines.length >= 2) {
        blocks.push({ type: 'table', lines: tableLines });
        i = j;
        continue;
      }
    }
    blocks.push({ type: 'para', line });
    i++;
  }
  return blocks;
}

function clusterByX(items, gapThreshold = 18) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const clusters = [];
  let cur = { items: [sorted[0]], minX: sorted[0].x, maxX: sorted[0].x + sorted[0].width };
  for (let k = 1; k < sorted.length; k++) {
    const it = sorted[k];
    const gap = it.x - cur.maxX;
    if (gap > gapThreshold) {
      clusters.push(cur);
      cur = { items: [it], minX: it.x, maxX: it.x + it.width };
    } else {
      cur.items.push(it);
      cur.maxX = Math.max(cur.maxX, it.x + it.width);
    }
  }
  clusters.push(cur);
  return clusters;
}

function columnsCompatible(refClusters, clusters, pageWidth) {
  if (Math.abs(refClusters.length - clusters.length) > 1) return false;
  // check overlap of column x ranges
  const refCenters = refClusters.map(c => (c.minX + c.maxX) / 2);
  const centers = clusters.map(c => (c.minX + c.maxX) / 2);
  let matches = 0;
  for (const c of centers) {
    if (refCenters.some(rc => Math.abs(rc - c) < pageWidth * 0.12)) matches++;
  }
  return matches >= Math.min(refCenters.length, centers.length) - 1;
}

function buildTableFromLines(tableLines, pageWidth) {
  // Determine column boundaries from all lines
  const allClusters = tableLines.map(l => clusterByX(l.items));
  const maxCols = Math.max(...allClusters.map(c => c.length));
  // Build reference column centers
  let refCenters = [];
  for (const clusters of allClusters) {
    if (clusters.length === maxCols) { refCenters = clusters.map(c => (c.minX + c.maxX) / 2); break; }
  }
  if (!refCenters.length) refCenters = allClusters[0].map(c => (c.minX + c.maxX) / 2);

  const colCount = refCenters.length;
  const colWidthTwip = Math.floor(ptToTwip(pageWidth - 80) / colCount); // 40pt margins each side

  const rows = tableLines.map(line => {
    const clusters = clusterByX(line.items);
    // Map clusters to columns
    const cells = Array(colCount).fill(null).map(() => []);
    for (const cluster of clusters) {
      const center = (cluster.minX + cluster.maxX) / 2;
      let bestCol = 0, bestDist = Infinity;
      refCenters.forEach((rc, idx) => { const d = Math.abs(rc - center); if (d < bestDist) { bestDist = d; bestCol = idx; } });
      cells[bestCol].push(...cluster.items);
    }
    return new TableRow({
      children: cells.map((cellItems) => {
        const text = cellItems.sort((a,b)=>a.x-b.x).map(i => i.str).join(' ').trim();
        const rtl = isArabic(text);
        const fontSize = cellItems.length ? cellItems.reduce((s,i)=>s+i.fontSize,0)/cellItems.length : 11;
        return new TableCell({
          width: { size: colWidthTwip, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
          },
          margins: { top: 40, bottom: 40, left: 60, right: 60 },
          children: [new Paragraph({
            bidirectional: rtl,
            alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
            children: [new TextRun({
              text: text || ' ',
              size: ptToHalfPt(Math.max(8, Math.min(14, fontSize))),
              font: rtl ? 'Arial' : (cellItems[0]?.fontName || 'Arial'),
              rightToLeft: rtl,
            })],
          })],
        });
      }),
    });
  });

  return new Table({
    width: { size: ptToTwip(pageWidth - 80), type: WidthType.DXA },
    rows,
  });
}

function buildParagraphFromLine(line, pageWidth, prevLine) {
  const text = line.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const rtl = line.isArabic;
  const avgFont = line.fontSize || 11;
  const fontName = line.items.find(i => i.fontName)?.fontName || (rtl ? 'Arial' : 'Arial');

  // Estimate indentation from x position (40pt left margin baseline)
  const leftIndentPt = Math.max(0, line.minX - 40);
  const indentTwip = ptToTwip(leftIndentPt);

  // Spacing before based on gap from previous line
  let spacingBefore = 0;
  if (prevLine) {
    const gap = line.y - prevLine.y;
    const normalGap = (prevLine.fontSize || 11) * 1.4;
    if (gap > normalGap * 1.5) spacingBefore = ptToTwip(Math.min(gap - normalGap, 24));
  }

  const isBold = /bold|black|heavy/i.test(line.items.map(i=>i.fontName).join(' '));
  const isHeading = avgFont >= 14 && text.length < 120;

  const run = new TextRun({
    text,
    size: ptToHalfPt(Math.max(8, Math.min(28, avgFont))),
    font: fontName,
    bold: isBold || isHeading,
    rightToLeft: rtl,
  });

  return new Paragraph({
    bidirectional: rtl,
    alignment: rtl ? AlignmentType.RIGHT : (isHeading ? AlignmentType.CENTER : AlignmentType.LEFT),
    spacing: { before: spacingBefore, after: ptToTwip(Math.max(2, avgFont * 0.3)), line: 276 },
    indent: rtl ? { right: indentTwip } : { left: indentTwip },
    children: [run],
  });
}

async function renderPageToPng(page, scale = 2.0) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return { data: new Uint8Array(await blob.arrayBuffer()), ptWidth: viewport.width / scale, ptHeight: viewport.height / scale };
}

export async function convertPdfToDocx(file, options = {}, onProgress) {
  const { mode = 'editable' } = options; // 'editable' | 'visual'
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const totalPages = pdf.numPages;
  const sections = [];

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress({ current: i, total: totalPages, percentage: Math.round((i / totalPages) * 100), status: mode === 'visual' ? `تحويل الصفحة ${i}/${totalPages}...` : `استخراج النصوص والهيكل من الصفحة ${i}/${totalPages}...` });
    }
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const ptWidth = viewport.width;
    const ptHeight = viewport.height;

    if (mode === 'visual') {
      const rendered = await renderPageToPng(page, 2.0);
      sections.push({
        properties: { page: { size: { width: ptToTwip(ptWidth), height: ptToTwip(ptHeight) }, margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
        children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new ImageRun({ data: rendered.data, transformation: { width: Math.round(ptWidth * 96 / 72), height: Math.round(ptHeight * 96 / 72) }, type: 'png' })] })],
      });
      continue;
    }

    const textContent = await page.getTextContent({ normalizeWhitespace: false });
    const items = getTextContentItems(textContent, viewport);
    const lines = groupIntoLines(items);
    const blocks = detectTableBlocks(lines, ptWidth);

    const children = [];
    let prevLine = null;
    for (const block of blocks) {
      if (block.type === 'table') {
        children.push(buildTableFromLines(block.lines, ptWidth));
        children.push(new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }));
        prevLine = block.lines[block.lines.length - 1];
      } else {
        const para = buildParagraphFromLine(block.line, ptWidth, prevLine);
        if (para) children.push(para);
        prevLine = block.line;
      }
    }

    if (children.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] }));
    }

    sections.push({
      properties: {
        page: {
          size: { width: ptToTwip(ptWidth), height: ptToTwip(ptHeight) },
          margin: { top: ptToTwip(40), right: ptToTwip(40), bottom: ptToTwip(40), left: ptToTwip(40) },
        },
      },
      children,
    });
  }

  const doc = new Document({
    creator: 'OptiMerge PDF',
    title: file.name.replace(/\.pdf$/i, ''),
    description: 'Converted from PDF with editable text and tables',
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections,
  });

  const blob = await Packer.toBlob(doc);
  return { blob, pageCount: totalPages, fileName: file.name.replace(/\.pdf$/i, '.docx') };
}
