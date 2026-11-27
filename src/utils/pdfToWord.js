import * as pdfjsLib from 'pdfjs-dist';
import {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Textbox, TextWrappingType, VerticalPositionRelativeFrom, HorizontalPositionRelativeFrom,
  FrameAnchorType, TableLayoutType
} from 'docx';

if (typeof window !== 'undefined') {
  const baseUrl = import.meta.env?.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${prefix}pdf.worker.min.js`;
}

const ptToTwip = (pt) => Math.max(0, Math.round(pt * 20));
const ptToHalfPt = (pt) => Math.max(14, Math.min(96, Math.round(pt * 2)));
const ptToPx96 = (pt) => Math.max(1, Math.round(pt * 96 / 72));

function isArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0621-\u064A]/.test(text || '');
}

function normalizeArabicPresentation(text) {
  if (!text) return '';
  // Normalize Arabic presentation forms to standard Arabic to avoid garbled glyphs
  let s = text.normalize('NFKC');
  const map = {
    'ﻻ':'لا','ﻷ':'لأ','ﻹ':'لإ','ﻵ':'لآ','ﻼ':'لا','ﻸ':'لأ','ﻺ':'لإ','ﻶ':'لآ',
    'ﺀ':'ء','ﺁ':'آ','ﺂ':'آ','ﺃ':'أ','ﺄ':'أ','ﺅ':'ؤ','ﺆ':'ؤ','ﺇ':'إ','ﺈ':'إ','ﺉ':'ئ','ﺊ':'ئ','ﺋ':'ئ','ﺌ':'ئ',
    'ﺍ':'ا','ﺎ':'ا','ﺏ':'ب','ﺐ':'ب','ﺑ':'ب','ﺒ':'ب','ﺓ':'ة','ﺔ':'ة','ﺕ':'ت','ﺖ':'ت','ﺗ':'ت','ﺘ':'ت',
    'ﺙ':'ث','ﺚ':'ث','ﺛ':'ث','ﺜ':'ث','ﺝ':'ج','ﺞ':'ج','ﺟ':'ج','ﺠ':'ج','ﺡ':'ح','ﺢ':'ح','ﺣ':'ح','ﺤ':'ح',
    'ﺥ':'خ','ﺦ':'خ','ﺧ':'خ','ﺨ':'خ','ﺩ':'د','ﺪ':'د','ﺫ':'ذ','ﺬ':'ذ','ﺭ':'ر','ﺮ':'ر','ﺯ':'ز','ﺰ':'ز',
    'ﺱ':'س','ﺲ':'س','ﺳ':'س','ﺴ':'س','ﺵ':'ش','ﺶ':'ش','ﺷ':'ش','ﺸ':'ش','ﺹ':'ص','ﺺ':'ص','ﺻ':'ص','ﺼ':'ص',
    'ﺽ':'ض','ﺾ':'ض','ﺿ':'ض','ﻀ':'ض','ﻁ':'ط','ﻂ':'ط','ﻃ':'ط','ﻄ':'ط','ﻅ':'ظ','ﻆ':'ظ','ﻇ':'ظ','ﻈ':'ظ',
    'ﻉ':'ع','ﻊ':'ع','ﻋ':'ع','ﻌ':'ع','ﻍ':'غ','ﻎ':'غ','ﻏ':'غ','ﻐ':'غ','ﻑ':'ف','ﻒ':'ف','ﻓ':'ف','ﻔ':'ف',
    'ﻕ':'ق','ﻖ':'ق','ﻗ':'ق','ﻘ':'ق','ﻙ':'ك','ﻚ':'ك','ﻛ':'ك','ﻜ':'ك','ﻝ':'ل','ﻞ':'ل','ﻟ':'ل','ﻠ':'ل',
    'ﻡ':'م','ﻢ':'م','ﻣ':'م','ﻤ':'م','ﻥ':'ن','ﻦ':'ن','ﻧ':'ن','ﻨ':'ن','ﻩ':'ه','ﻪ':'ه','ﻫ':'ه','ﻬ':'ه',
    'ﻭ':'و','ﻮ':'و','ﻯ':'ى','ﻰ':'ى','ﻱ':'ي','ﻲ':'ي','ﻳ':'ي','ﻴ':'ي','ﭐ':'ا','ﭑ':'ا','ﭒ':'ا','ﭓ':'ا',
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'
  };
  s = s.replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]/g, ch => map[ch] || ch);
  // Remove Arabic tatweel and control chars that break layout
  s = s.replace(/\u0640/g, '').replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
  return s;
}

function cleanText(str) {
  if (!str) return '';
  let s = String(str).replace(/\u00A0/g, ' ');
  if (isArabic(s) || /[\uFB50-\uFDFF\uFE70-\uFEFF]/.test(s)) s = normalizeArabicPresentation(s);
  return s.replace(/[ \t]+/g, ' ').trim();
}

const ARABIC_FONTS = ['Traditional Arabic', 'Simplified Arabic', 'Arial', 'Tahoma', 'Times New Roman', 'Sakkal Majalla', 'Cairo', 'Amiri', 'Geeza Pro'];

function normalizeFontName(pdfFontName, rtl) {
  const fallback = rtl ? 'Traditional Arabic' : 'Arial';
  if (!pdfFontName) return fallback;
  let name = String(pdfFontName).replace(/^[A-Z]{6}\+/, '').trim();
  const lower = name.toLowerCase();

  const mapping = [
    [/traditional\s*arabic|trado/i, 'Traditional Arabic'],
    [/simplified\s*arabic|simpo/i, 'Simplified Arabic'],
    [/arabic\s*typesetting/i, 'Arabic Typesetting'],
    [/sakkal\s*majalla/i, 'Sakkal Majalla'],
    [/geeza/i, 'Geeza Pro'],
    [/amiri/i, 'Amiri'],
    [/cairo/i, 'Cairo'],
    [/tajawal/i, 'Tajawal'],
    [/noto\s*naskh|noto\s*arabic|noto\s*kufi/i, 'Arial'],
    [/droid\s*arabic|droid\s*naskh/i, 'Arial'],
    [/scheherazade/i, 'Traditional Arabic'],
    [/lateef/i, 'Traditional Arabic'],
    [/kufi/i, 'Arial'],
    [/diwani|thuluth|ruqah|ruqaa/i, 'Traditional Arabic'],
    [/times|roman/i, 'Times New Roman'],
    [/courier|mono|consol/i, 'Courier New'],
    [/calibri/i, 'Calibri'],
    [/tahoma/i, 'Tahoma'],
    [/arial|helvetica|sans/i, 'Arial'],
  ];
  for (const [re, val] of mapping) if (re.test(lower)) return val;
  // If RTL and unknown font, prefer Arabic-capable font
  if (rtl) return 'Traditional Arabic';
  // keep clean latin name
  name = name.replace(/[-_]?Bold|[-_]?Italic|[-_]?Regular|[-_]?Light|[-_]?Medium|[-_]?Semibold|,Bold|,Italic/gi, '').trim();
  return name || fallback;
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
  return { data: new Uint8Array(await blob.arrayBuffer()), ptWidth: viewport.width / scale, ptHeight: viewport.height / scale };
}

function getTextItems(textContent, viewport) {
  const items = [];
  for (const item of textContent.items) {
    const rawStr = item.str;
    if (!rawStr) continue;
    const str = cleanText(rawStr);
    if (!str) continue;
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const fontSize = Math.max(6, Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) || 11);
    const x = tx[4];
    const y = tx[5];
    const w = Math.max(1, (item.width || 0) * viewport.scale);
    const h = Math.max(1, (item.height || fontSize) * viewport.scale);
    const rawFont = textContent.styles?.[item.fontName]?.fontFamily || item.fontName || '';
    const rtl = isArabic(str);
    items.push({
      str,
      x, y, width: w, height: h, fontSize,
      fontName: normalizeFontName(rawFont, rtl),
      bold: isBoldFont(rawFont) || isBoldFont(item.fontName),
      italic: isItalicFont(rawFont),
      isArabic: rtl,
      dir: item.dir || (rtl ? 'rtl' : 'ltr'),
    });
  }
  return items;
}

function groupIntoLines(items) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const item of sorted) {
    const tol = Math.max(3, item.fontSize * 0.6);
    let line = lines.find(l => Math.abs(l.y - item.y) <= tol);
    if (!line) { line = { y: item.y, items: [] }; lines.push(line); }
    line.items.push(item);
    line.y = line.items.reduce((s, it) => s + it.y, 0) / line.items.length;
  }
  lines.sort((a, b) => a.y - b.y);
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    line.minX = Math.min(...line.items.map(i => i.x));
    line.maxX = Math.max(...line.items.map(i => i.x + i.width));
    line.fontSize = line.items.reduce((s, i) => s + i.fontSize, 0) / line.items.length;
    line.text = line.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
    line.isArabic = isArabic(line.text);
  }
  return lines.filter(l => l.text);
}

function clusterItems(items, gapThreshold) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const clusters = [];
  let cur = { items: [sorted[0]], minX: sorted[0].x, maxX: sorted[0].x + sorted[0].width };
  for (let k = 1; k < sorted.length; k++) {
    const it = sorted[k];
    const gap = it.x - cur.maxX;
    const thr = gapThreshold ?? Math.max(12, (it.fontSize || 11) * 1.2);
    if (gap > thr) { clusters.push(cur); cur = { items: [it], minX: it.x, maxX: it.x + it.width }; }
    else { cur.items.push(it); cur.maxX = Math.max(cur.maxX, it.x + it.width); }
  }
  clusters.push(cur);
  for (const c of clusters) {
    c.text = c.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim();
    c.isArabic = isArabic(c.text);
    c.fontSize = c.items.reduce((s,i)=>s+i.fontSize,0)/c.items.length;
  }
  return clusters;
}

function detectTableBlocks(lines, pageWidth) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const clusters = clusterItems(line.items);
    if (clusters.length >= 2) {
      const tableLines = [line];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        const nextClusters = clusterItems(next.items);
        const yGap = next.y - tableLines[tableLines.length - 1].y;
        if (nextClusters.length >= 2 && yGap < 60 && columnsCompatible(clusters, nextClusters, pageWidth)) {
          tableLines.push(next); j++;
        } else {
          break;
        }
      }
      if (tableLines.length >= 2) { blocks.push({ type: 'table', lines: tableLines }); i = j; continue; }
    }
    blocks.push({ type: 'para', line }); i++;
  }
  return blocks;
}

function columnsCompatible(refClusters, clusters, pageWidth) {
  if (Math.abs(refClusters.length - clusters.length) > 2) return false;
  const refCenters = refClusters.map(c => (c.minX + c.maxX) / 2);
  const centers = clusters.map(c => (c.minX + c.maxX) / 2);
  let matches = 0;
  for (const c of centers) if (refCenters.some(rc => Math.abs(rc - c) < pageWidth * 0.08)) matches++;
  return matches >= Math.max(1, Math.min(refCenters.length, centers.length) - 1);
}

function inferColumnBoundaries(tableLines, pageWidth, margin) {
  // Collect cluster boundaries from all rows
  const edges = [];
  for (const line of tableLines) {
    for (const c of clusterItems(line.items)) {
      edges.push(c.minX); edges.push(c.maxX);
    }
  }
  edges.sort((a,b)=>a-b);
  // cluster edges to find column splits
  const merged = [];
  for (const e of edges) {
    if (!merged.length || e - merged[merged.length-1] > 12) merged.push(e);
    else merged[merged.length-1] = (merged[merged.length-1] + e) / 2;
  }
  // Build column ranges by finding gaps between clusters across lines
  const allClusters = tableLines.flatMap(l => clusterItems(l.items));
  const centers = allClusters.map(c => (c.minX+c.maxX)/2).sort((a,b)=>a-b);
  const centerGroups = [];
  for (const c of centers) {
    const g = centerGroups.find(gr => Math.abs(gr.avg - c) < pageWidth * 0.07);
    if (g) { g.vals.push(c); g.avg = g.vals.reduce((s,v)=>s+v,0)/g.vals.length; }
    else centerGroups.push({ vals:[c], avg:c });
  }
  centerGroups.sort((a,b)=>a.avg-b.avg);
  const colCount = Math.max(2, centerGroups.length);
  const contentW = pageWidth - margin*2;
  const colW = Math.floor(ptToTwip(contentW / colCount));
  return { colCount, colW, centers: centerGroups.map(g=>g.avg), contentW };
}

function buildTableFromLines(tableLines, pageWidth, margin = 36) {
  const { colCount, colW, centers } = inferColumnBoundaries(tableLines, pageWidth, margin);
  const usableWidth = ptToTwip(pageWidth - margin * 2);

  const rows = tableLines.map(line => {
    const clusters = clusterItems(line.items);
    const cells = Array(colCount).fill(null).map(() => []);
    for (const cluster of clusters) {
      const center = (cluster.minX + cluster.maxX) / 2;
      let bestCol = 0, bestDist = Infinity;
      centers.forEach((rc, idx) => { const d = Math.abs(rc - center); if (d < bestDist) { bestDist = d; bestCol = idx; } });
      cells[Math.min(bestCol, colCount-1)].push(...cluster.items);
    }
    return new TableRow({
      children: cells.map(cellItems => {
        const sorted = cellItems.sort((a,b)=>a.x-b.x);
        const text = cleanText(sorted.map(i => i.str).join(' '));
        const rtl = isArabic(text);
        const fontSize = sorted.length ? sorted.reduce((s,i)=>s+i.fontSize,0)/sorted.length : 11;
        const bold = sorted.some(i => i.bold);
        const font = normalizeFontName(sorted[0]?.fontName, rtl);
        const cellRuns = sorted.length ? sorted.map((it, idx) => new TextRun({
          text: idx === sorted.length - 1 ? cleanText(it.str) : cleanText(it.str) + ' ',
          size: ptToHalfPt(it.fontSize || fontSize),
          font: normalizeFontName(it.fontName, rtl),
          bold: !!it.bold || bold,
          italics: !!it.italic,
          rightToLeft: rtl,
        })) : [new TextRun({ text: ' ', size: ptToHalfPt(fontSize), font, rightToLeft: rtl })];
        return new TableCell({
          width: { size: colW, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '555555' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '555555' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '555555' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '555555' },
          },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
          margins: { top: 30, bottom: 30, left: 60, right: 60 },
          verticalAlign: 'center',
          children: [new Paragraph({
            bidirectional: rtl,
            alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { before: 0, after: 0, line: 240 },
            children: cellRuns,
          })],
        });
      }),
    });
  });

  return new Table({
    width: { size: usableWidth, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows,
  });
}

function makeRunsForCluster(cluster) {
  const rtl = cluster.isArabic;
  const font = normalizeFontName(cluster.items[0]?.fontName, rtl);
  const fontSize = cluster.fontSize || 11;
  const bold = cluster.items.some(i => i.bold);
  const italic = cluster.items.some(i => i.italic);
  return [new TextRun({
    text: cleanText(cluster.text),
    size: ptToHalfPt(fontSize),
    font,
    bold,
    italics: italic,
    rightToLeft: rtl,
  })];
}

async function renderPageToImage(page, scale = 2.0) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return { data: new Uint8Array(await blob.arrayBuffer()), ptWidth: viewport.width / scale, ptHeight: viewport.height / scale };
}

async function buildEditableSections(pdf, totalPages, onProgress) {
  const sections = [];
  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({ current: i, total: totalPages, percentage: Math.round((i / totalPages) * 100), status: `استخراج النصوص والجداول بدقة - صفحة ${i}/${totalPages}...` });
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const ptW = viewport.width, ptH = viewport.height;
    const margin = 36;
    const textContent = await page.getTextContent({ normalizeWhitespace: false, includeMarkedContent: true });
    const items = getTextItems(textContent, viewport);
    const lines = groupIntoLines(items);
    const blocks = detectTableBlocks(lines, ptW);

    const children = [];
    let prevBottom = margin;

    for (const block of blocks) {
      if (block.type === 'table') {
        const tableTop = Math.min(...block.lines.map(l => l.y));
        const gap = Math.max(0, tableTop - prevBottom);
        if (gap > 6) children.push(new Paragraph({ spacing: { before: ptToTwip(Math.min(gap, 80)), after: 0 }, children: [new TextRun({ text: '', size: 2 })] }));

        const table = buildTableFromLines(block.lines, ptW, margin);
        // Place table in an absolute-positioned textbox for layout stability
        const tableBottom = Math.max(...block.lines.map(l => l.y + (l.fontSize||11)*1.5));
        const tableHeight = Math.max(40, tableBottom - tableTop + 20);
        const leftOffsetEmu = ptToTwip(margin) * 635; // twip to EMU approx? No, textbox uses dx/dy in EMU or pt depending. docx Textbox style uses dxa-like? Let's use frame approach via paragraph
        // Simpler: insert table directly (tables flow well in Word). Add indent via tableIndent
        children.push(table);
        prevBottom = tableBottom + 4;
      } else {
        const line = block.line;
        const rtl = line.isArabic;
        const avgFont = line.fontSize || 11;
        const gap = Math.max(0, line.y - prevBottom);
        const spacingBefore = ptToTwip(Math.min(Math.max(0, gap - avgFont * 0.15), 140));

        const contentLeft = margin;
        const contentRight = ptW - margin;
        const clusters = clusterItems(line.items, Math.max(18, avgFont * 2.2));

        // For multi-cluster lines (columns/tabs), create runs with tab/spaces and preserve positions
        let paraChildren;
        if (clusters.length > 1) {
          paraChildren = [];
          clusters.forEach((cl, ci) => {
            if (ci > 0) paraChildren.push(new TextRun({ text: '\t', size: ptToHalfPt(avgFont) }));
            paraChildren.push(...makeRunsForCluster(cl));
          });
        } else {
          paraChildren = line.items.sort((a,b)=>a.x-b.x).map((it, idx, arr) => new TextRun({
            text: idx === arr.length - 1 ? cleanText(it.str) : cleanText(it.str) + ' ',
            size: ptToHalfPt(it.fontSize || avgFont),
            font: normalizeFontName(it.fontName, rtl),
            bold: !!it.bold || (avgFont >= 15 && line.text.length < 90),
            italics: !!it.italic,
            rightToLeft: rtl,
          }));
        }

        const lineLeft = Math.max(contentLeft, line.minX);
        const lineRight = Math.min(contentRight, line.maxX);
        const leftIndent = Math.max(0, lineLeft - contentLeft);
        const rightIndent = Math.max(0, contentRight - lineRight);

        children.push(new Paragraph({
          bidirectional: rtl,
          alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
          spacing: { before: spacingBefore, after: 0, line: Math.max(240, ptToTwip(avgFont * 1.2)), lineRule: 'auto' },
          indent: {
            left: ptToTwip(rtl ? rightIndent : leftIndent),
            right: ptToTwip(rtl ? leftIndent : rightIndent),
          },
          tabStops: clusters.length > 1 ? clusters.slice(1).map(cl => ({ type: 'left', position: ptToTwip(Math.max(0, cl.minX - contentLeft)) })) : undefined,
          children: paraChildren.length ? paraChildren : [new TextRun({ text: ' ', size: 22 })],
        }));
        prevBottom = line.y + avgFont * 1.15;
      }
    }

    if (!children.length) children.push(new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] }));
    sections.push({
      properties: { page: { size: { width: ptToTwip(ptW), height: ptToTwip(ptH) }, margin: { top: ptToTwip(margin), right: ptToTwip(margin), bottom: ptToTwip(margin), left: ptToTwip(margin) } } },
      children,
    });
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
    const rendered = await renderPageToImage(page, 2.2);
    sections.push({
      properties: { page: { size: { width: ptToTwip(ptW), height: ptToTwip(ptH) }, margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
      children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new ImageRun({ data: rendered.data, transformation: { width: ptToPx96(ptW), height: ptToPx96(ptH) }, type: 'png' })] })],
    });
  }
  return sections;
}

export async function convertPdfToDocx(file, options = {}, onProgress) {
  const { mode = 'editable' } = options;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const totalPages = pdf.numPages;

  let sections;
  if (mode === 'visual') sections = await buildVisualSections(pdf, totalPages, onProgress);
  else sections = await buildEditableSections(pdf, totalPages, onProgress);

  const doc = new Document({
    creator: 'OptiMerge PDF',
    title: cleanText(file.name.replace(/\.pdf$/i, '')),
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
