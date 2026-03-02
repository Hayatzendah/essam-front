# رفع البيلد على Hostinger (أو أي استضافة)

## لماذا الصفحة تظهر فاضية والكونسول يظهر أخطاء MIME؟

الكونسول يقول شيء مثل:
- `Refused to apply style from '.../assets/index-XXX.css' because its MIME type ('text/html') is not a supported stylesheet MIME type`
- `Expected a Javascript module script but the server responded with a MIME type of "text/html"`

**السبب:** السيرفر يرد على طلبات ملفات الـ CSS و JS **بصفحة HTML** (مثلاً `index.html` أو صفحة 404) بدل الملفات الحقيقية. فالمتصفح يرفض استخدام HTML كـ CSS أو JS.

هذا يحدث عادةً عندما:
1. **لم تُرفع مجلدات/ملفات الـ assets** — السيرفر لا يجد الملف فيرجع 404 أو index.html.
2. **قاعدة "كل الطلبات → index.html"** (SPA) تطبق على كل شيء بما فيها `/assets/`، فيُرجع HTML لطلبات الملفات الثابتة.

---

## الحل خطوة بخطوة

### 1. عمل بيلد محلياً

```bash
cd essam-front
npm run build
```

سيُنشأ مجلد `dist/` بداخله مثلاً:
- `index.html`
- `assets/` وفيه ملفات مثل `index-XXXXX.css` و `index-XXXXX.js`
- أي ملفات من `public/` (مثل `vite.svg` و `.htaccess`)

### 2. رفع محتويات `dist/` كاملة

ارفع **كل محتويات** مجلد `dist/` إلى جذر الموقع على الاستضافة (أو المجلد الذي يشير إليه الدومين)، وليس فقط `index.html`.

يجب أن يصبح على السيرفر شيء مثل:

```
/
  index.html
  .htaccess
  assets/
    index-XXXXX.css
    index-XXXXX.js
  vite.svg
  ...
```

لو رفعت فقط `index.html` بدون مجلد `assets/`، طلبات `/assets/...` ستفشل والسيرفر سيرجع HTML → أخطاء MIME والصفحة الفاضية.

### 3. ملف `.htaccess` (استضافة أباتشي مثل Hostinger)

تم وضع ملف `.htaccess` داخل `public/` في المشروع. عند البيلد يُنسخ إلى `dist/` ويُرفع مع الموقع.

هذا الملف:
- يخبر السيرفر: إذا الطلب لملف أو مجلد **موجود فعلياً** (مثل `/assets/index-XXX.css`) فَقدّم الملف كما هو ولا توجّه إلى `index.html`.
- فقط المسارات التي لا تطابق ملفاً حقيقياً (مثل `/login`, `/admin`) تُوجّه إلى `index.html` من أجل تطبيق SPA.

بهذا لا تُخدم طلبات `/assets/` كـ HTML، ويختفي خطأ MIME type.

### 4. التأكد بعد الرفع

- افتح الموقع من المتصفح.
- افتح أدوات المطور (F12) → تبويب Network.
- حدّث الصفحة وتحقق أن:
  - طلب `index.html` → Status 200.
  - طلبات ملفات تحت `/assets/` (مثل `index-XXXXX.css` و `index-XXXXX.js`) → Status 200 ونوع المحتوى:
    - CSS: `text/css`
    - JS: `application/javascript` أو مشابه.

إذا كانت طلبات الـ assets ترجع 404 أو نوع محتوى `text/html`، فالمشكلة إما:
- الملفات لم تُرفع في `assets/`، أو
- إعدادات السيرفر (أو `.htaccess`) لا تزال تعيد توجيه `/assets/` إلى `index.html`.

---

## ملخص

| المشكلة | السبب | الحل |
|--------|--------|------|
| MIME type 'text/html' لملفات CSS/JS | السيرفر يرد بـ HTML بدل الملفات | رفع مجلد `assets/` كامل + استخدام `.htaccess` الصحيح |
| الصفحة بيضاء | عدم تحميل CSS و JS | نفس الحل أعلاه |

بعد تطبيق الخطوات، أعد رفع البيلد وتحديث الصفحة وجرب مرة ثانية.
