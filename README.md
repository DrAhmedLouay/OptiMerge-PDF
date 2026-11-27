# OptiMerge PDF 🚀
> منصة ذكية فائقة الأداء لدمج الصور ومستندات الـ PDF مع الحفاظ على أعلى درجات وضوح النصوص والصور وبأصغر حجم ملف (< 10MB).

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-success?style=for-the-badge&logo=githubpages)](https://drahmedlouay.github.io/OptiMerge-PDF/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 🌐 الرابط المباشر للتشغيل (Live Demo)
يمكنك استخدام المنصة فوراً عبر متصفحك دون الحاجة لتثبيت أي برامج:
👉 **[https://drahmedlouay.github.io/OptiMerge-PDF/](https://drahmedlouay.github.io/OptiMerge-PDF/)**

---

## ✨ المميزات الرئيسية (Key Features)

1. **حفاظ تام على نصوص الـ PDF كمتجهات أصلية 100% (Native Vector Streams):**
   - لا يتم تحويل صفحات الـ PDF الرقمية إلى صور نقطية (Rasterization).
   - تبقى النصوص حادة جداً وقابلة للتحديد والبحث (Selectable & Searchable) عند أي نسبة تكبير (1000% Zoom)، مع حجم ملف ضئيل جداً.

2. **ضمان حجم أقل من 10 ميجابايت تلقائياً (Target Budget < 10MB):**
   - خوارزمية ذكية تحسب ميزانية البايت لكل صفحة وتضبط مستوى الـ DPI وجودة الضغط لتضمن عدم تجاوز 10MB (أو 5MB / 2MB) لسهولة إرفاقها بالبوابات الحكومية والبريد الإلكتروني والواتساب.

3. **شحذ الحواف الموضعي للماسحات والصور (Edge-Aware Thresholded USM):**
   - فلتر Unsharp Mask ذكي يعمل فقط على كونتراست حواف الحروف الداكنة دون تضخيم أي ضوضاء في الخلفية.

4. **تبييض خلفيات الورق التكيفي (Paper Whitening & Text Stroke Deepening):**
   - تحويل ورق الماسحات الضوئية الرمادي والأصفر إلى أبيض ناصع `RGB(255,255,255)`.
   - كتل الـ JPEG البيضاء تُضغط إلى 2 بايت فقط، مما يوفّر أكثر من 70% من المساحة التخزينية مع الحفاظ على دقة الحروف 200-260 DPI.

5. **وضع الضغط الدفعي (Batch Compression):**
   - ضغط عشرات ملفات الـ PDF الكبيرة دفعة واحدة لتقليص كل ملف منها إلى أقل من 10MB، مع إمكانية تحميل كل ملف منفرداً أو تحميل المجموعة كاملة في ملف ZIP بنقرة واحدة.

6. **أمان وخصوصية محلية 100% (Client-Side Privacy):**
   - تتم جميع العمليات الحسابية ومعالجة المستندات والضغط محلياً داخل متصفح المستخدم عبر Web Workers و Canvas و `pdf-lib`.
   - لا يتم رفع أي ملف إلى أي خادم خارجي.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Frontend:** React 18, Vite 5, Tailwind CSS
- **PDF Engine:** `pdf-lib` (Native Vector copying, Object Streams compression), `pdfjs-dist` (Text layers detection & high-DPI rendering)
- **Image Processing:** HTML5 Offscreen Canvas, Step-down Bicubic Resampling, Convolution Filters, Adaptive Thresholding
- **Archiving:** `jszip`
- **Icons:** `lucide-react`

---

## 🚀 التشغيل المحلي (Local Development)

```bash
# استنساخ المستودع
git clone https://github.com/DrAhmedLouay/OptiMerge-PDF.git
cd OptiMerge-PDF

# تثبيت الحزم
npm install

# تشغيل خادم التطوير
npm run dev
```

افتح المتصفح على: `http://localhost:5173`

---

## 📄 الترخيص (License)
هذا المشروع مرخص تحت رخصة [MIT](LICENSE).
