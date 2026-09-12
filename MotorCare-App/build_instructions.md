# خطوات بناء وإصدار تطبيق MotorCare للأندرويد (AAB)

نظراً لأن أداة `npm` (الخاصة بـ Node.js) غير متوفرة أو لم يتم التعرف عليها في سطر الأوامر الحالي لديك، ستحتاج إلى التأكد من تثبيت **Node.js** أولاً. بعد التأكد من التثبيت، يرجى اتباع الخطوات التالية بدقة لتحويل الكود إلى تطبيق أندرويد حقيقي جاهز للرفع على متجر جوجل بلاي.

## 1. تثبيت المتطلبات الأساسية والتجهيز
افتح الـ Terminal (أو Command Prompt) في مسار المشروع `d:\car\MotorCare-App`، ثم نفذ الأوامر التالية بالترتيب:

```bash
# 1. تثبيت المكتبات (Vite و Capacitor)
npm install

# 2. بناء ملفات الويب الخاصة بالتطبيق (HTML, CSS, JS) داخل مجلد dist
npm run build

# 3. بناء مجلد الأندرويد لأول مرة باستخدام Capacitor
npx cap add android

# 4. مزامنة ونقل ملفات الويب المبنية إلى داخل مجلد الأندرويد
npx cap sync android
```

## 2. ضبط الصلاحيات وإعدادات الأندرويد
بعد نجاح أمر الإضافة `npx cap add android`، سيتم إنشاء مجلد جديد باسم `android`. ستحتاج إلى ضبط الصلاحيات الخاصة بالتطبيق لكي يعمل بشكل صحيح مع الكاميرا والتخزين.

1. افتح الملف التالي: `android/app/src/main/AndroidManifest.xml`
2. أضف الصلاحيات التالية داخل وسم `<manifest>` (قبل وسم `<application>` مباشرة):

```xml
    <!-- الصلاحيات المطلوبة لتطبيق MotorCare -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    
    <!-- ميزة الكاميرا اختارية لكي تعمل على الأجهزة التي لا تدعمها -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
```

## 3. بناء حزمة الإنتاج النهائية (Android App Bundle - AAB)

يُعتبر ملف الـ `.aab` هو الصيغة الإلزامية التي يطلبها Google Play Console حالياً للرفع.

1. افتح برنامج **Android Studio**.
2. اختر **Open an existing project** وقم باختيار المجلد `android` الموجود داخل مشروعك.
3. انتظر حتى يقوم البرنامج بتحميل ملفات الـ Gradle والمزامنة (Sync).
4. من القائمة العلوية، اضغط على **Build** ثم اختر **Generate Signed Bundle / APK...**.
5. اختر **Android App Bundle** واضغط **Next**.
6. في شاشة Keystore:
   - إذا كان لديك ملف Keystore، اختره وأدخل كلمات المرور.
   - إذا لم يكن لديك، اضغط على **Create new...**، وقم بإنشاء ملف Keystore جديد (احتفظ به وبكلمة المرور الخاصة به في مكان آمن، لأنك ستحتاجه في أي تحديث مستقبلي للتطبيق).
7. اضغط **Next**، ثم اختر **release** كنوع البناء (Build Variant).
8. اضغط **Finish**.

سيقوم Android Studio ببناء التطبيق. فور الانتهاء، سيظهر إشعار أسفل يمين الشاشة، اضغط على **Locate** لفتح المجلد. ستجد الملف النهائي باسم `app-release.aab` جاهزاً للرفع على لوحة تحكم Google Play.
