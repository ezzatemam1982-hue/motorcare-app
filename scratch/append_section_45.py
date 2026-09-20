entry = """

---

## 🔒 45. إصلاح نظام استعادة كلمة المرور وإيقاف حلقة الإشعارات (Auth & Notifications Hotfix v2.0.18)
* **تاريخ التنفيذ:** 20 سبتمبر 2026
* **طلب المستخدم:** 
  1. منع تكرار رسالة "تم توثيق حسابك بنجاح" وإيقاف تهنيج التطبيق.
  2. إصلاح عدم وصول رمز تفعيل استعادة كلمة المرور عبر البريد.
  3. إضافة زر إظهار/إخفاء كلمة المرور في خانة تأكيد كلمة المرور مثل الخانة الأولى.

### أ. التشخيص والحلول المنفذة:
1. **حل عدم وصول رمز استعادة كلمة المرور (OTP):**
   - تحويل `action` من `SEND_PASSWORD_RESET_EMAIL` إلى `SEND_OTP_EMAIL` المتوافق مباشرة مع سكربت Google Apps Script المنشور في السحابة ليرسل البريد ويسجله في الشيت فوراً.
   - إرسال الطلب لكلا رابطي الـ Webhook المعتمدين في التطبيق لتفادي أي انقطاع.
   - إضافة زر ومؤقت 60 ثانية: **"إعادة إرسال الرمز"** في نافذة الاستعادة.
2. **إظهار كلمة المرور في خانة التأكيد (Confirm Password Eye Toggle):**
   - إضافة أيقونة القفل وزر العين التفاعلي (`forgotConfirmPassEye`) لحقل `forgotConfirmPasswordInput`.
   - إتاحة إظهار وإخفاء كلمة المرور في الخانتين معاً للتأكد من تطابقهما بسهولة.
3. **إيقاف حلقة إشعارات التوثيق ومنع التهنيج:**
   - فك الارتباط الدائري في `applyRemoteVerification` وإلغاء البث المزدوج عبر `BroadcastChannel`.
   - إيقاف المراقبة الحية `stopLiveVerificationWatcher` فوراً عند إتمام التوثيق.
   - تزويد دالة `showNotification` بمانع تكرار وحصر عدد الإشعارات المعروضة في الشاشة بـ 3 كحد أقصى لمنع تجميد المتصفح.

### ب. ترقية السيرفيس وركر والمطابقة:
* ترقية إصدار التخزين المؤقت إلى **`motorcare-cache-v2.0.18`** في الملفات الأربعة (`sw.js`, `service-worker.js`, `src/sw.js`, `src/service-worker.js`).
* تطابق تام للبصمة الرقمية (100% SHA-256 Parity) بين ملفات الجذر ومجلد `src/`.
"""

with open('PROJECT_HANDOVER_NOTES.md', 'r', encoding='utf-8') as f:
    text = f.read().rstrip()

text += entry + '\n'

with open('PROJECT_HANDOVER_NOTES.md', 'w', encoding='utf-8') as f:
    f.write(text)

print('PROJECT_HANDOVER_NOTES.md updated with section 45.')
