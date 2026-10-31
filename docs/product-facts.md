# حقائق منتج ناوي فوكاس

حقائق محددة من المستودع، تُراجع عند كل تغيير ولا تغني عن الاختبارات.

## حقائق مثبتة

| الحقيقة | الدليل |
|---|---|
| المنتج مؤقت تركيز وفترات راحة وساعة إيقاف | src/App.tsx, src/hooks/useTimer.ts, src/hooks/useStopwatch.ts |
| التطبيق عربي RTL | index.html, vite.config.ts, src/ |
| تخزين الجلسات محلي عبر Dexie / IndexedDB | src/db.ts, package.json |
| اسم قاعدة البيانات nawy-focus-db | src/db.ts |
| مخطط Dexie الحالي يبدأ بـ version 1 | src/db.ts |
| يوجد تصدير JSON وCSV واستيراد نسخ احتياطية | src/hooks/useSessions.ts, src/lib/backup.ts, src/lib/csv.ts |
| الإشعار اختياري ويعتمد على موافقة المتصفح | src/hooks/useTimer.ts, src/lib/notify.ts, docs/decisions.md |
| PWA وService Worker | vite.config.ts, src/main.tsx |
| الاختبارات Vitest | vitest.config.ts, tests/ |
| النشر GitHub Actions / Pages | .github/workflows/deploy.yml |

## قرارات المنتج

- React + Vite اختيرا لهذا المنتج بدلاً من vanilla DOM.
- Dexie + IndexedDB هو مخزن البيانات المحلي؛ لا توجد حاجة معتمدة حالياً لحساب أو Backend.
- الإشعارات اختيارية وليست جزءاً إلزامياً من جلسة التركيز.
- تحديث PWA مصمم للتفعيل التلقائي وفق إعداداته.
- راجع docs/decisions.md للتواريخ والتفاصيل.

## قواعد التجربة

- المؤقت هو العنصر الأساسي؛ السجل والملخصات ثانوية.
- النية نص اختياري وليست مهمة ذات موعد نهائي.
- لا تضف مدير مهام أو تصنيفات أو لوحة متابعة معقدة.
- لا تضف تسجيل دخول أو مزامنة إجبارية أو تحليلات دون طلب وقرار صريح.

## ما لا تثبته هذه الحقائق

- IndexedDB لا يضمن الحماية من حذف المتصفح أو تلف الجهاز.
- وجود PWA لا يثبت عمل كل متصفح offline في كل سيناريو.
- توثيق الإشعارات لا يضمن وصولها في كل نظام تشغيل.
- نجاح CI لا يثبت الأداء أو اللمس على كل جهاز.