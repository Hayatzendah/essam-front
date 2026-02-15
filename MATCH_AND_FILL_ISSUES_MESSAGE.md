# رسالة للفرونت - مشاكل في Match و Fill

## 1. مشكلة Match - ترتيب studentAnswerMatch

**المشكلة:**
في سؤال Match الباك متوقع pairs بالشكل `[leftGerman, rightArabic]` زي `["Tisch","طاولة"]`.
إحنا بنبعت العكس `[rightArabic, leftGerman]` زي `["طاولة","Tisch"]` فالتقييم بيطلع غلط.

**الحل المطلوب:**
لازم نبدّل ترتيب القيم قبل submit.

**التفاصيل:**
- `answerKeyMatch` من الباك بيكون بالشكل: `[leftGerman, rightArabic]` مثل `["Tisch","طاولة"]`
- `studentAnswerMatch` لازم يكون بنفس الاتجاه: `[leftGerman, rightArabic]`
- حالياً الفرونت بتبعت `[rightArabic, leftGerman]` وهذا يسبب خطأ في التقييم

**الكود المطلوب تعديله:**
- في `ExamPage.jsx` عند إرسال `studentAnswerMatch` في `handleSubmit`
- التأكد من أن الترتيب يطابق `answerKeyMatch` من الباك

---

## 2. مشكلة Fill - مفتاح خاطئ في DTO

**المشكلة:**
كان في خطأ: `fillAnswers should not exist`

**السبب:**
الفرونت كان بيبعث مفتاح غلط (مش اللي DTO متوقعه) → فدي برضو فرونت/contract.

**الحل المطلوب:**
- التحقق من المفاتيح الصحيحة التي يتوقعها DTO
- استخدام المفتاح الصحيح عند إرسال إجابات Fill
- التأكد من أن المفتاح يطابق ما هو متوقع في Backend

**ملاحظة:**
هذه مشكلة في contract بين الفرونت والباك - يجب التأكد من استخدام المفاتيح الصحيحة حسب DTO.

---

## ملخص

1. **Match**: تبديل ترتيب `studentAnswerMatch` ليطابق `answerKeyMatch` - `[leftGerman, rightArabic]`
2. **Fill**: استخدام المفتاح الصحيح في DTO (ليس `fillAnswers`)

يرجى مراجعة الكود وإصلاح هذه المشاكل.




