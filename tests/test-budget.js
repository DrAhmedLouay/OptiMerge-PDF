import { computeAutoBudgetParameters } from '../src/utils/pdfProcessor.js';
import JSZip from 'jszip';

console.log('Testing Auto-Budget Parameters for < 10MB...');

const test10Pages = computeAutoBudgetParameters(10, 10);
console.log('10 pages budget params:', test10Pages);
if (test10Pages.targetDpi < 180 || test10Pages.quality < 0.75) {
  throw new Error('Test failed: 10 pages should have high quality');
}

const test60Pages = computeAutoBudgetParameters(60, 10);
console.log('60 pages budget params:', test60Pages);
if (test60Pages.targetDpi > 160 || test60Pages.quality > 0.75) {
  throw new Error('Test failed: 60 pages should adaptively scale down');
}

console.log('Testing JSZip packaging...');
const zip = new JSZip();
zip.file('test.pdf', new Uint8Array([1, 2, 3, 4]));
const zipBlob = await zip.generateAsync({ type: 'uint8array' });
if (zipBlob.byteLength === 0) {
  throw new Error('ZIP generation failed');
}

console.log('✓ All budget and batch compression tests PASSED successfully!');
