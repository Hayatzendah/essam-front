# دليل إضافة أسئلة القواعد النحوية (Grammar Questions)

## المشكلة الشائعة

إذا أضفت أسئلة للقواعد عبر Postman لكنها لا تظهر في صفحة القواعد، السبب عادة يكون:

## الحل - المتطلبات المطلوبة

عند إضافة سؤال للقواعد، يجب التأكد من:

### 1. ✅ `section: "grammar"` (مطلوب!)

```json
{
  "section": "grammar"  // ⚠️ مطلوب! بدون هذا الحقل لن يظهر السؤال
}
```

**السبب:** endpoint `/questions/grammar` يبحث فقط عن أسئلة بـ `section: "grammar"`

### 2. ✅ `status: "published"` (مطلوب!)

```json
{
  "status": "published"  // ⚠️ مطلوب! الافتراضي هو "draft" ولن يظهر
}
```

**السبب:** endpoint `/questions/grammar` يرجع فقط الأسئلة المنشورة

### 3. ✅ `tags` يجب أن تطابق tags في موضوع القواعد

```json
{
  "tags": ["akkusativ", "cases"]  // ⚠️ يجب أن تطابق tags في grammar topic
}
```

**السبب:** عند جلب الأسئلة، يتم الفلترة حسب `tags` من موضوع القواعد

**كيف تعرف tags الصحيحة:**
- افتح موضوع القواعد في MongoDB أو عبر API
- انسخ الـ `tags` من موضوع القواعد
- استخدم نفس الـ tags في السؤال

### 4. ✅ `level` يجب أن يطابق مستوى موضوع القواعد

```json
{
  "level": "A1"  // ⚠️ يجب أن يطابق مستوى موضوع القواعد
}
```

**السبب:** عند جلب الأسئلة، يتم الفلترة حسب `level` من موضوع القواعد

## مثال كامل صحيح

```json
POST /questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "أكمل الفراغ: Ich sehe ___ Mann.",
  "qType": "mcq",
  "options": [
    { "text": "der", "isCorrect": false },
    { "text": "den", "isCorrect": true },
    { "text": "dem", "isCorrect": false }
  ],
  "provider": "Grammatik",
  "section": "grammar",        // ⚠️ مطلوب!
  "level": "A1",               // ⚠️ يجب أن يطابق مستوى موضوع القواعد
  "tags": ["akkusativ", "cases"],  // ⚠️ يجب أن تطابق tags في موضوع القواعد
  "status": "published"        // ⚠️ مطلوب!
}
```

## خطوات التحقق

إذا لم تظهر الأسئلة بعد الإضافة:

1. **تحقق من MongoDB:**
   ```javascript
   // في MongoDB Compass أو shell
   db.questions.find({ 
     section: "grammar",
     status: "published",
     level: "A1",  // استبدل بالمستوى الصحيح
     tags: { $in: ["akkusativ"] }  // استبدل بالـ tags الصحيحة
   })
   ```

2. **تحقق من API مباشرة:**
   ```bash
   GET /questions/grammar?level=A1&tags=akkusativ
   Authorization: Bearer <token>
   ```

3. **تحقق من موضوع القواعد:**
   ```bash
   GET /grammar/topics/akkusativ?level=A1
   Authorization: Bearer <token>
   ```
   - تأكد من أن `tags` في السؤال تطابق `tags` في موضوع القواعد
   - تأكد من أن `level` في السؤال يطابق `level` في موضوع القواعد

## نصائح إضافية

- استخدم `provider: "Grammatik"` للأسئلة النحوية (اختياري لكن موصى به)
- تأكد من صحة `qType` (mcq, true_false, fill, match, reorder)
- تأكد من صحة `options` أو `fillExact` حسب نوع السؤال

## إذا استمرت المشكلة

1. تحقق من الـ Console في المتصفح (F12) لرؤية الأخطاء
2. تحقق من Network tab لرؤية الطلبات والاستجابات
3. تحقق من الـ Backend logs
4. تأكد من أن الـ Token صالح وغير منتهي





