# ناوي فوكس · Nawy Focus

تطبيق مؤقت تركيز بسيط **محلي أولاً** (IndexedDB عبر Dexie) يُثبَّت كـ PWA ويعمل بدون إنترنت.

جزء من منظومة [ناوي](https://github.com/inawy) للإنتاجية.

- مؤقت مرن لجلسات التركيز والراحة
- نية تركيز اختيارية قبل البدء (بدون تحويل التطبيق إلى مدير مهام)
- سجل جلسات محلي مع ملخص بسيط لوقت اليوم
- عربي أولاً (RTL)، وضع داكن، جاهز للتثبيت

الرابط المقترح: [nawy.to/focus](https://nawy.to/focus)

## التشغيل

```bash
npm install
npm run dev        # تطوير
npm run build      # فحص الأنواع + بناء dist/
npm run preview    # تجربة النسخة المبنية (يعمل Service Worker)
```

## الجودة

```bash
npm test && npm run lint && npm run build
```

## النشر على GitHub Pages

1. من **Settings → Pages** اختر **Source: GitHub Actions**.
2. أي `push` على `main` ينشر تلقائياً عبر `.github/workflows/deploy.yml`.

`base: './'` في `vite.config.ts` يجعل البناء يعمل على مسار فرعي ونطاق مخصص.

## الهيكل

```
src/
  types.ts          الأنواع المشتركة
  db.ts             Dexie + استعلامات الجلسات
  lib/timer.ts      آلة حالة المؤقت (نقية، قابلة للاختبار)
  lib/format.ts     تنسيق الوقت والتاريخ
  hooks/            useTimer, useSessions
  components/       واجهة المؤقت والسجل
docs/decisions.md   سجل القرارات المعمارية
AGENTS.md           قواعد العمل للوكلاء والمطورين
```

## المبادئ

- المؤقت هو البطل — ليس لوحة إحصائيات
- لا إشعارات ولا تشغيل خلفية في الـ MVP
- لا تعدّل `version(n)` قديمة في Dexie؛ أضف `version(n+1)`
- كل اعتمادية جديدة تُسجَّل في `docs/decisions.md`
