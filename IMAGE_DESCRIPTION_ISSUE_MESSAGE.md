# رسالة للفرونت - مشكلة عرض description للصور

## المشكلة

في سؤال Image MCQ، كل صورة عندها `url + description`.

**الديسكربشن الخاصة بالصور واصلة من الباك داخل `imagesSnapshot[].description` لكن مش بتتعرض في UI.**

## المطلوب

**عرض description كنص تحت كل صورة (مثلاً Label أو Caption).**

الهدف: إظهار description أسفل الصورة عشان الطالب يميّز الاختيارات (Bild 1 / Bild 2).

## التفاصيل التقنية

- البيانات موجودة في: `imagesSnapshot[].description`
- المطلوب: عرض `description` أسفل كل صورة في أسئلة Image MCQ
- يمكن استخدام Label أو Caption أسفل الصورة

## مثال

```javascript
// البيانات من الباك
imagesSnapshot: [
  {
    url: "...",
    description: "Bild 1" // هذا يجب أن يظهر أسفل الصورة
  },
  {
    url: "...",
    description: "Bild 2" // هذا يجب أن يظهر أسفل الصورة
  }
]
```

## ملاحظة

يرجى التحقق من:
1. قراءة `description` من `imagesSnapshot[].description` بشكل صحيح
2. تمرير `description` إلى مكون عرض الصور
3. عرض `description` كنص أسفل كل صورة في UI

يرجى إضافة عرض `description` أسفل كل صورة في أسئلة Image MCQ.

