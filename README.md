# ناوي فوكس · Nawy Focus

تطبيق مؤقت تركيز بسيط **محلي أولاً** (IndexedDB عبر Dexie) يُثبَّت كـ PWA ويعمل بدون إنترنت.

جزء من منظومة [ناوي](https://github.com/inawy) للإنتاجية.

- مؤقت مرن لجلسات التركيز والراحة
- نية تركيز اختيارية قبل البدء
- سجل جلسات محلي مع ملخص لوقت اليوم
- صوت خفيف عند انتهاء الجلسة + عنوان التبويب يتحدّث أثناء التركيز
- عربي أولاً (RTL)، وضع داكن، جاهز للتثبيت

**المستودع:** https://github.com/inawy/nawy-focus  
**الرابط المقترح:** [nawy.to/focus](https://nawy.to/focus)

## التشغيل

```bash
npm install
npm run dev        # تطوير
npm run build      # فحص الأنواع + بناء dist/
npm run preview    # تجربة النسخة المبنية (يعمل Service Worker)
```

## الجودة

```bash
npm test && npm run build
```

## النشر على GitHub Pages

البناء والاختبارات يمرّان على Actions. لتفعيل النشر:

1. افتح **Settings → Pages**
2. تحت **Build and deployment → Source** اختر **GitHub Actions**
3. أعد تشغيل آخر workflow ناجح (أو ادفع أي commit على `main`)

بعدها يظهر الموقع على:
`https://inawy.github.io/nawy-focus/`

## الهيكل

```
src/
  types.ts          الأنواع المشتركة
  db.ts             Dexie + استعلامات الجلسات
  lib/timer.ts      آلة حالة المؤقت (نقية)
  lib/sound.ts      صوت انتهاء الجلسة (Web Audio)
  lib/format.ts     تنسيق الوقت والتاريخ
  hooks/            useTimer, useSessions
  components/       واجهة المؤقت والسجل
docs/decisions.md   سجل القرارات
AGENTS.md           قواعد العمل
```

## المبادئ

- المؤقت هو البطل — ليس لوحة إحصائيات
- لا إشعارات ولا تشغيل خلفية في الـ MVP
- لا تعدّل `version(n)` قديمة في Dexie؛ أضف `version(n+1)`
