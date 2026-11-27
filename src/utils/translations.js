export const translations = {
  ar: {
    appTitle: 'OptiMerge PDF',
    appSubtitle: 'المنصة الذكية لدمج الصور ومستندات الـ PDF بأعلى درجة وضوح للنصوص والصور وبأصغر حجم ممكن',
    tagline: 'تقليص فائق إلى أقل من 10MB • وضوح ناصع للنصوص • معالجة دفعية',

    // Modes & Tabs
    tabMerge: 'دمج وضغط الملفات في PDF واحد',
    tabBatch: 'ضغط دفعي لملفات عديدة (< 10MB لكل ملف)',
    tabBatchDesc: 'قم بضغط عدة ملفات PDF ضخمة دفعة واحدة لتقليص كل ملف منها إلى أقل من 10 ميجابايت مع تحميلها منفردة أو بملف ZIP',

    // Target Max Size Budget
    targetBudgetTitle: 'الحد الأقصى لحجم ملف الـ PDF الناتج',
    targetBudgetDesc: 'تضمن المنصة ضبط الدقة والجودة تلقائياً بحيث لا يتجاوز الملف الحجم المحدد مع أقصى حدة للنصوص',
    target10MB: 'أقل من 10 ميجابايت (موصى به للبوابات الحكومية والبريد)',
    target5MB: 'أقل من 5 ميجابايت (ضغط عالي)',
    target2MB: 'أقل من 2 ميجابايت (فائق الصغر للمراسلات)',
    targetCustom: 'حجم مخصص',
    targetNoLimit: 'بدون حد أقصى للحجم (أعلى جودة ممكنة)',

    // Compression Engine mode
    compressPdfToggle: 'إعادة ضغط وتنقية صفحات الـ PDF (مطلوب لتقليل الحجم إلى أقل من 10MB)',
    compressPdfToggleDesc: 'يقوم بإعادة ضغط الصور والماسحات الضوئية الضخمة المدمجة بالـ PDF وتطبيق فلتر شحذ الحروف لتقليص الحجم من 50MB+ إلى أقل من 10MB',
    vectorPreserveMode: 'وضع النسخ المطابق (قد لا يقلل الحجم إذا كانت الصور داخل الـ PDF ضخمة)',

    // Dropzone
    dropzoneTitle: 'اسحب وأفلت ملفات الـ PDF أو الصور هنا',
    dropzoneSubtitle: 'أو انقر لاختيار الملفات من جهازك (يدعم PDF, PNG, JPG, JPEG, WEBP, BMP)',
    privacyNotice: '🔒 تتم المعالجة محلياً بالكامل على متصفحك — لا يتم رفع أي ملف إلى أي خادم خارجي',
    addMoreFiles: 'إضافة المزيد من الملفات',
    clearAll: 'تفريغ الكل',

    // Presets
    presetsTitle: 'أنماط الضغط والوضوح',
    presetUltraSharp: 'وضوح فائق للمستندات',
    presetUltraSharpDesc: 'أقصى دقة للنصوص والخطوط الدقيقة (240 DPI، جودة 85% مع فلتر تنقية الحواف)',
    presetBalanced: 'توازن ذكي (موصى به < 10MB)',
    presetBalancedDesc: 'توازن مثالي بين وضوح ناصع وتقليص هائل للحجم بنسبة 70% إلى 90%',
    presetCompact: 'أقصى ضغط / حجم فائق الصغر',
    presetCompactDesc: 'أصغر حجم ممكن للملفات للإرسال عبر البريد الإلكتروني أو الواتساب (130 DPI، جودة 65%)',
    presetPrint: 'طباعة احترافية عالية الدقة',
    presetPrintDesc: 'دقة طباعة كاملة 300 DPI وجودة 92% للأوراق الرسمية والكتالوجات',
    presetCustom: 'تخصيص يدوي متقدم',
    presetCustomDesc: 'تحكم كامل في أبعاد الصورة، نسبة الجودة، فلاتر الحدة وتبييض الخلفية',

    // Advanced Controls
    advancedSettings: 'خيارات التخصيص والتحكم الدقيق',
    imageQuality: 'جودة الصورة (JPEG Quality)',
    targetDpi: 'مستوى الدقة (DPI)',
    sharpenFilter: 'فلتر حدة النصوص وتوضيح الحواف',
    sharpenNone: 'بدون فلتر',
    sharpenSubtle: 'خفيف (طبيعي)',
    sharpenMedium: 'متوسط (موصى به للمستندات)',
    sharpenStrong: 'قوي (للأوراق الممسوحة ضوئياً)',
    whitenBg: 'تبييض خلفية الورق (يوفر حجماً ضخماً ويزيل الشوائب)',
    contrastBoost: 'تعزيز تباين النصوص الغامقة',
    grayscale: 'تحويل الصور إلى تدرج رمادي (أبيض وأسود)',
    pageSize: 'مقاس صفحات الصور الناتجة',
    pageSizeA4: 'A4 قياسي (210 × 297 مم)',
    pageSizeLetter: 'US Letter',
    pageSizeFit: 'مطابقة لأبعاد الصورة الأصلية',
    margin: 'هوامش الصفحة',
    marginNone: 'بدون هوامش (ملء الصفحة)',
    marginSmall: 'هوامش صغيرة (15 نقطة)',
    marginNormal: 'هوامش قياسية (30 نقطة)',

    // Page Manager
    pagesManagerTitle: 'إدارة وترتيب الصفحات',
    pagesCount: 'صفحة',
    dragTip: '💡 يمكنك سحب أي صفحة لإعادة ترتيبها في أي مكان، أو تدويرها وحذفها بشكل مستقل',
    rotateLeft: 'تدوير لليسار (90°-)',
    rotateRight: 'تدوير لليمين (90°+)',
    deletePage: 'حذف الصفحة',
    previewPage: 'معاينة بالحجم الكامل',
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء التحديد',
    deleteSelected: 'حذف المحدد',

    // Merge Actions
    mergeButton: 'بدء الدمج والضغط (< 10MB)',
    mergingButton: 'جاري الدمج والتقليص الذكي...',
    downloadReady: 'الملف المدمج جاهز بحجم مثالي!',
    downloadButton: 'تحميل ملف PDF المدمج',
    previewResultButton: 'معاينة النتيجة ومستوى الوضوح',
    newMerge: 'دمج ملفات أخرى',

    // Batch Compression Tab Actions
    startBatchBtn: 'بدء ضغط جميع الملفات دفعة واحدة (< 10MB لكل ملف)',
    batchProcessing: 'جاري ضغط الملفات...',
    batchCompleted: 'تم ضغط جميع الملفات بنجاح إلى أقل من 10MB!',
    downloadZip: 'تحميل جميع الملفات المضغوطة (ZIP)',
    downloadSingle: 'تحميل',

    // Results & Metrics
    resultsTitle: 'إحصائيات الضغط والوضوح',
    originalSize: 'الحجم الكلي الأصلي',
    compressedSize: 'حجم PDF الناتج',
    savedRatio: 'نسبة التوفير في الحجم',
    processingTime: 'زمن المعالجة',
    totalPagesMerged: 'إجمالي الصفحات المدمجة',
    vectorPreservedNotice: '✓ تم تقليص الحجم بنجاح مع فلتر شحذ الحروف للحفاظ على وضوح فائق للنصوص',

    // Preview Modal
    previewModalTitle: 'معاينة المستند والتحقق من الوضوح',
    close: 'إغلاق',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    fitWidth: 'ملء العرض',
    pageOf: 'صفحة {current} من {total}',

    // Quality highlights
    feature1Title: 'ضمان حجم أقل من 10MB',
    feature1Desc: 'خوارزمية ميزانية الحجم التلقائية تحسب معدل الدقة والجودة بدقة ليقل حجم الملف عن 10 ميجابايت دائماً',
    feature2Title: 'نصوص حادة بدون ضبابية',
    feature2Desc: 'تطبيق فلتر شحذ الحواف Unsharp Mask وتبييض خلفية الماسحات لتبقى الخطوط داكنة وحادة جداً',
    feature3Title: 'ضغط دفعي لملفات عديدة',
    feature3Desc: 'يمكنك إدراج عشرات الملفات الكبيرة وضغط كل ملف على حدة ليكون أقل من 10MB مع تحميلها مجمعة',
  },
  en: {
    appTitle: 'OptiMerge PDF',
    appSubtitle: 'The smart platform to merge and compress images and PDFs with crystal-clear text sharpness and smallest file size',
    tagline: 'Extreme Shrink Under 10MB • Needle-Sharp Text • Batch Processing',

    // Modes & Tabs
    tabMerge: 'Merge & Compress into Single PDF',
    tabBatch: 'Batch Compress Multiple Files (< 10MB each)',
    tabBatchDesc: 'Compress multiple huge PDF files at once, shrinking each file to under 10MB with individual downloads or ZIP archive',

    // Target Max Size Budget
    targetBudgetTitle: 'Target Max PDF File Size',
    targetBudgetDesc: 'The engine automatically calculates resolution and quality to guarantee the file stays under this limit with razor-sharp text',
    target10MB: 'Under 10 MB (Recommended for portals & email)',
    target5MB: 'Under 5 MB (High compression)',
    target2MB: 'Under 2 MB (Extreme compact for chat)',
    targetCustom: 'Custom Size (MB)',
    targetNoLimit: 'No Limit (Standard highest quality)',

    // Compression Engine mode
    compressPdfToggle: 'Recompress & Enhance PDF Pages (Required to shrink files to < 10MB)',
    compressPdfToggleDesc: 'Re-encodes heavy embedded scans/images inside the PDF and applies Unsharp Mask to shrink 50MB+ down to < 10MB',
    vectorPreserveMode: 'Raw Copy Only (May not reduce size if existing PDF contains huge scans)',

    // Dropzone
    dropzoneTitle: 'Drag & drop PDF files or images here',
    dropzoneSubtitle: 'or click to browse from your device (Supports PDF, PNG, JPG, JPEG, WEBP, BMP)',
    privacyNotice: '🔒 100% processed locally in your browser — files never leave your computer',
    addMoreFiles: 'Add More Files',
    clearAll: 'Clear All',

    // Presets
    presetsTitle: 'Compression & Quality Profiles',
    presetUltraSharp: 'Ultra Sharp Document',
    presetUltraSharpDesc: 'Maximum clarity for text and fine details (240 DPI, 85% Q, Unsharp Mask edge filter)',
    presetBalanced: 'Smart Balanced (Recommended < 10MB)',
    presetBalancedDesc: 'Ideal balance between crisp text and 70% to 90% size reduction',
    presetCompact: 'Extreme Compact / Smallest Size',
    presetCompactDesc: 'Smallest possible PDF for email or WhatsApp attachments (130 DPI, 65% Q)',
    presetPrint: 'High-Res Print Quality',
    presetPrintDesc: 'Full 300 DPI and 92% quality for official documents, proposals, and brochures',
    presetCustom: 'Custom / Manual Control',
    presetCustomDesc: 'Full manual control over DPI, JPEG quality, sharpening, and scan whitening',

    // Advanced Controls
    advancedSettings: 'Fine-Tuning & Custom Settings',
    imageQuality: 'Image Quality (JPEG Quality)',
    targetDpi: 'Resolution Level (DPI)',
    sharpenFilter: 'Text Edge Sharpening Filter',
    sharpenNone: 'None',
    sharpenSubtle: 'Subtle (Natural)',
    sharpenMedium: 'Medium (Recommended for docs)',
    sharpenStrong: 'Strong (For scanned papers)',
    whitenBg: 'Whiten Paper Background (Massive size reduction & artifact cleaning)',
    contrastBoost: 'Boost Dark Text Contrast',
    grayscale: 'Convert Images to Grayscale (B&W)',
    pageSize: 'Output Image Page Size',
    pageSizeA4: 'A4 Standard (210 × 297 mm)',
    pageSizeLetter: 'US Letter',
    pageSizeFit: 'Match Original Image Aspect Ratio',
    margin: 'Page Margins',
    marginNone: 'No Margins (Full Bleed)',
    marginSmall: 'Small Margins (15 pt)',
    marginNormal: 'Standard Margins (30 pt)',

    // Page Manager
    pagesManagerTitle: 'Page Management & Reordering',
    pagesCount: 'Pages',
    dragTip: '💡 Drag any page card to reorder it anywhere, or rotate and delete pages independently',
    rotateLeft: 'Rotate Left (-90°)',
    rotateRight: 'Rotate Right (+90°)',
    deletePage: 'Delete Page',
    previewPage: 'Full-size Preview',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    deleteSelected: 'Delete Selected',

    // Merge Actions
    mergeButton: 'Start Smart Merge (< 10MB)',
    mergingButton: 'Optimizing and Shrinking...',
    downloadReady: 'Merged PDF is ready and under budget!',
    downloadButton: 'Download Merged PDF',
    previewResultButton: 'Inspect Quality & Preview',
    newMerge: 'Merge More Files',

    // Batch Compression Tab Actions
    startBatchBtn: 'Start Batch Compression (< 10MB each)',
    batchProcessing: 'Compressing files...',
    batchCompleted: 'All files successfully compressed under 10MB!',
    downloadZip: 'Download All Compressed Files (ZIP)',
    downloadSingle: 'Download',

    // Results & Metrics
    resultsTitle: 'Compression & Quality Statistics',
    originalSize: 'Total Original Size',
    compressedSize: 'Output PDF Size',
    savedRatio: 'Storage Saved',
    processingTime: 'Processing Time',
    totalPagesMerged: 'Total Pages Merged',
    vectorPreservedNotice: '✓ Size dramatically reduced with Unsharp Mask filter to keep text crisp and legible',

    // Preview Modal
    previewModalTitle: 'Document Preview & Sharpness Inspection',
    close: 'Close',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fitWidth: 'Fit Width',
    pageOf: 'Page {current} of {total}',

    // Quality highlights
    feature1Title: 'Guaranteed Under 10MB',
    feature1Desc: 'Auto-budget engine calculates exact DPI & quality balance so the final PDF never exceeds 10MB',
    feature2Title: 'Sharp Text Without Blurring',
    feature2Desc: 'Applies Unsharp Mask convolution filter & background whitening so letters stay dark and razor sharp',
    feature3Title: 'Batch Compress Multiple Files',
    feature3Desc: 'Drop dozens of large PDFs and compress each one individually to < 10MB with 1-click ZIP download',
  }
};
