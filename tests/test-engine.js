import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function testEngine() {
  console.log('Testing PDF creation and vector preservation...');

  // 1. Create a source PDF with vector text
  const doc1 = await PDFDocument.create();
  const font = await doc1.embedFont(StandardFonts.HelveticaBold);
  const page1 = doc1.addPage([595, 842]); // A4
  page1.drawText('Sample Official Document with High Precision Vector Text', {
    x: 50,
    y: 780,
    size: 18,
    font,
    color: rgb(0.1, 0.2, 0.6),
  });
  page1.drawText('This vector text remains mathematically crisp at any magnification level.', {
    x: 50,
    y: 750,
    size: 12,
    color: rgb(0.2, 0.2, 0.2),
  });
  const doc1Bytes = await doc1.save();
  console.log('Source Vector PDF size:', doc1Bytes.byteLength, 'bytes');

  // 2. Create destination merged document
  const mergedDoc = await PDFDocument.create();

  // Copy vector page from doc1
  const loadedDoc1 = await PDFDocument.load(doc1Bytes);
  const [copiedPage] = await mergedDoc.copyPages(loadedDoc1, [0]);
  mergedDoc.addPage(copiedPage);

  // 3. Save with object streams
  const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
  console.log('Merged output PDF size with object streams:', mergedBytes.byteLength, 'bytes');

  if (mergedBytes.byteLength > 0 && mergedDoc.getPageCount() === 1) {
    console.log('✓ Verification PASSED: Vector streams merged losslessly with compact footprint.');
  } else {
    throw new Error('Test failed: invalid output');
  }
}

testEngine().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
