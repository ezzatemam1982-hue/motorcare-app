        function migrateAndAuditCarsCatalog(cars) {
            if (!Array.isArray(cars)) return;
            cars.forEach(car => {
                if (!car) return;
                if (car.model) car.model = getCleanCarDisplayName(car.model);
                if (car.generation) car.generation = getCleanCarDisplayName(car.generation);
            });
        }


        function saveNewCar() {
            const isEn = appState.lang === 'en';
            const brand = MotorCareSecurity.sanitizeText(document.getElementById('newCarBrandSelect')?.value || '', 60);
            if (!brand) {
                alert(isEn ? 'Please select your car brand.' : 'يرجى اختيار ماركة السيارة للمتابعة.');
                document.getElementById('newCarBrandSelect')?.focus();
                return;
            }

            const model = MotorCareSecurity.sanitizeText(document.getElementById('newCarModelSelect')?.value || '', 60);
            if (!model) {
                alert(isEn ? 'Please select your car model.' : 'يرجى اختيار موديل السيارة للمتابعة.');
                document.getElementById('newCarModelSelect')?.focus();
                return;
            }

            const genIdx = MotorCareSecurity.parsePositiveInt(document.getElementById('newCarGenerationSelect')?.value, 0, 0, 50);
            const yearInput = document.getElementById('newCarYearInput');
            
            const min = parseInt(yearInput?.min) || 1950;
            const max = parseInt(yearInput?.max) || new Date().getFullYear() + 1;
            const rawYear = yearInput ? yearInput.value.trim() : '';
            const year = MotorCareSecurity.parsePositiveInt(rawYear, 0, min, max);

            if (!rawYear || year < min || year > max) {
                alert(isEn ? `Please enter a valid production year between ${min} and ${max}` : `يرجى إدخال سنة صنع صحيحة لهذا الجيل (بين ${min} و ${max})`);
                if (yearInput) {
                    MotorCareSecurity.shakeElement(yearInput);
                    yearInput.focus();
                }
                return;
            }

            const engine = MotorCareSecurity.sanitizeText(document.getElementById('newCarEngineInput')?.value || '1.6L', 60);
            const odoInput = document.getElementById('newCarOdoInput');
            const odoVal = odoInput ? odoInput.value.trim() : '';
            const odoClean = MotorCareSecurity.parsePositiveInt(odoVal, -1, 0, 2000000);
            if (!odoVal || odoClean < 0 || odoClean > 2000000) {
                alert(isEn ? 'Please enter a valid positive odometer reading (0 - 2,000,000 km)!' : 'يرجى إدخال قراءة عداد الكيلومترات الحالية لسيارتك (بين 0 و 2,000,000 كم)!');
                if (odoInput) {
                    MotorCareSecurity.shakeElement(odoInput);
                    odoInput.focus();
                }
                return;
            }
            const odo = odoClean;
            
            const licenseInput = document.getElementById('newCarLicenseInput');
            const licenseRaw = licenseInput ? licenseInput.value.trim() : '';
            if (licenseRaw) {
                const licenseRes = MotorCareSecurity.validateLicensePlate(licenseRaw);
                if (!licenseRes.isValid) {
                    alert(isEn ? `License plate error: ${licenseRes.error}` : `خطأ في رقم اللوحة: ${licenseRes.error}`);
                    if (licenseInput) {
                        MotorCareSecurity.shakeElement(licenseInput);
                        licenseInput.focus();
                    }
                    return;
                }
            }

            const vinInput = document.getElementById('newCarVinInput');
            const vinRaw = vinInput ? vinInput.value.trim().toUpperCase() : '';
            if (vinRaw) {
                const vinRes = MotorCareSecurity.validateVin(vinRaw);
                if (!vinRes.isValid) {
                    alert(isEn ? `VIN error: ${vinRes.error}` : `خطأ في رقم الشاسيه (VIN): ${vinRes.error}`);
                    if (vinInput) {
                        MotorCareSecurity.shakeElement(vinInput);
                        vinInput.focus();
                    }
                    return;
                }
            }

            const license = MotorCareSecurity.sanitizeText(licenseRaw, 30);
            const vin = vinRaw;
            const color = MotorCareSecurity.sanitizeText(document.getElementById('newCarColorInput')?.value || '', 40);
            const notes = MotorCareSecurity.sanitizeText(document.getElementById('newCarNotesInput')?.value || '', 500);

            const newCatalog = buildSpecificCatalog(brand, model, genIdx, odo);

            if (!Array.isArray(appState.cars)) appState.cars = [];

            appState.cars.push({
                brand,
                model,
                generationIndex: genIdx,
                year,
                engine,
                license,
                vin,
                color,
                notes,
                createdAt: new Date().toISOString(),
                odometer: odo,
                dailyKm: 40,
                battery: { brand: '', capacity: '', techType: '', purchaseDate: '', warrantyMonths: 0, warrantyImage: '', isConfigured: false },
                tiresInfo: { size: '', dotCode: '', frontPsi: 32, rearPsi: 30, warrantyImage: '', isConfigured: false },
                documents: { vehicleLicense: '', drivingLicense: '', inspection: '', doc_vehicle: '', doc_driver: '', doc_insp: '', doc_insurance: '' },
                catalog: newCatalog,
                history: [],
                fuelLogs: []
            });

            appState.currentCarIndex = appState.cars.length - 1;
            saveAppState('car_added');

            // إعادة تفعيل أزرار إغلاق النافذة للمستقبل
            const modal = document.getElementById('addNewCarModal');
            if (modal) {
                modal.querySelectorAll('button[onclick*="closeAddNewCarModal"]').forEach(btn => {
                    btn.style.display = '';
                });
            }

            closeAddNewCarModal(true);
            renderDashboard();

            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Vehicle added successfully! Welcome to MotorCare 🎉' : 'تمت إضافة سيارتك بنجاح! أهلاً بك في موتور كير 🎉', 'success');
            }
        }

        const APP_DEFAULT_SENDER_EMAIL = 'motorcare.auto@gmail.com';
        function getAppSenderEmail() {
            // Strictly enforce official program email exclusively
            return APP_DEFAULT_SENDER_EMAIL;
        }

        function saveAppSenderEmail() {
            const input = document.getElementById('appSenderEmailInput');
            const val = input ? input.value.trim() : '';
            if (val && val.includes('@')) {
                SafeStorage.setItem('motorCare_AppSenderEmail', val);
                const isEn = appState.lang === 'en';
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Sender email saved!' : 'تم حفظ بريد إرسال رسائل التطبيق بنجاح! ✅');
                } else {
                    alert(isEn ? 'Sender email saved!' : 'تم حفظ بريد إرسال رسائل التطبيق بنجاح! ✅');
                }
            }
        }

        function openGoogleSheetsModal() {
            document.getElementById('googleSheetsModal')?.classList.remove('hidden');
        }
        function closeGoogleSheetsModal() { 
            document.getElementById('googleSheetsModal')?.classList.add('hidden'); 
        }

        function importJsonBackup() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (data && (Array.isArray(data.cars) || data.currentCarIndex !== undefined)) {
                            showCustomConfirm(
                                isEn 
                                    ? 'Are you sure you want to restore this backup? Your current garage data will be replaced with the imported data.' 
                                    : 'هل أنت متأكد من رغبتك في استعادة هذه النسخة الاحتياطية؟ سيتم تحديث بيانات الكراج والصيانة بالبيانات المستوردة.',
                                () => {
                                    appState = data;
                                    saveAppState('backup_restored');
                                    closeGoogleSheetsModal();
                                    if (typeof renderDashboard === 'function') renderDashboard();
                                    showNotification(isEn ? 'Backup restored successfully! 🎉' : 'تم استعادة النسخة الاحتياطية بنجاح! 🎉', 'success');
                                }
                            );
                        } else {
                            showNotification(isEn ? 'Invalid MotorCare backup file format.' : 'الملف المحدد لا يحتوي على بيانات MotorCare صالحة!', 'error');
                        }
                    } catch (err) {
                        showNotification(isEn ? 'Error reading backup file.' : 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية!', 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }

        function saveWebhookUrl() {
            // Webhook is permanently embedded in code
            if (typeof updateCloudSyncStatusInModal === 'function') updateCloudSyncStatusInModal();
        }

        function copyAppsScriptCode() {
            const script = `// ==========================================================================
// MOTORCARE OFFICIAL CLOUD API & EMAIL DISPATCHER
// ==========================================================================

function doGet(e) {
  try {
    var params = e.parameter || {};
    if (params.action === 'VERIFY_EMAIL') {
      var email = params.email || '';
      var otp = params.otp || '';
      var appUrl = params.app_url || '';
      
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var subSheet = ss.getSheetByName("المشتركين") || ss.insertSheet("المشتركين");
      if (subSheet.getLastRow() === 0) {
        subSheet.appendRow(["التاريخ والوقت", "اسم المشترك", "البريد الإلكتروني", "طريقة التسجيل", "حالة التوثيق"]);
      }
      
      var rows = subSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][2] && rows[i][2].toString().toLowerCase() === email.toLowerCase()) {
          subSheet.getRange(i + 1, 5).setValue("مشترك معتمد وموثق بنجاح");
          found = true;
          break;
        }
      }
      if (!found && email) {
        subSheet.appendRow([new Date(), "عضو MotorCare", email, "email", "مشترك معتمد وموثق بنجاح"]);
      }

      var html = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>MotorCare | تم توثيق الحساب بنجاح</title><style>body{font-family:\'Segoe UI\',Tahoma,Geneva,Verdana,sans-serif;background:#070a13;color:#f8fafc;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;}.card{background:#0f172a;border:1px solid #1e293b;border-radius:24px;padding:36px 28px;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.5);}.badge{display:inline-block;padding:6px 14px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#34d399;border-radius:999px;font-weight:800;font-size:12px;margin-bottom:16px;}h1{font-size:22px;font-weight:900;margin:0 0 10px;color:#ffffff;}p{font-size:13px;color:#94a3b8;line-height:1.7;margin:0 0 20px;}.otp-box{background:#1e293b;border:2px dashed #0284c7;border-radius:16px;padding:14px;margin-bottom:20px;}.otp-code{font-family:monospace;font-size:28px;font-weight:900;letter-spacing:6px;color:#38bdf8;}.btn{display:inline-block;background:linear-gradient(135deg,#0284c7,#4f46e5);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:14px;font-weight:800;font-size:14px;box-shadow:0 4px 15px rgba(2,132,199,0.4);width:100%;box-sizing:border-box;}</style></head><body><div class="card"><div class="badge">تم التحقق والاعتماد بنجاح &check;</div><h1>تم توثيق حسابك في MotorCare!</h1><p>تهانينا، تم تأكيد بريدك الإلكتروني (' + email + ') بنجاح وأصبح كراجك الرقمي جاهزاً وموثقاً بالكامل.</p><div class="otp-box"><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">رمز التحقق المعتمد الخاص بك:</div><div class="otp-code">' + otp + '</div></div>' + (appUrl ? '<a href="' + appUrl + '?verify_email=' + encodeURIComponent(email) + '&otp=' + otp + '" class="btn">العودة لتطبيق MotorCare الآن</a>' : '<p style="font-size:12px;color:#64748b;">يمكنك الآن العودة لتطبيق MotorCare واستخدام كافة الخدمات.</p>') + '</div></body></html>';

      return HtmlService.createHtmlOutput(html).setTitle("MotorCare | تم توثيق الحساب بنجاح");
    }
    return HtmlService.createHtmlOutput("MotorCare Official Cloud API Active");
  } catch(err) {
    return HtmlService.createHtmlOutput("Error: " + err.toString());
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // دالة الإرسال المباشر الفائق الموثوقية (MailApp + GmailApp Fallback)
    function sendDirectMail(to, subject, body, options) {
      var opts = { name: options.name || "MotorCare App" };
      if (options.replyTo) opts.replyTo = options.replyTo;
      if (options.htmlBody) opts.htmlBody = options.htmlBody;
      try {
        if (typeof MailApp !== 'undefined') {
          MailApp.sendEmail(to, subject, body, opts);
          return true;
        }
      } catch(e1) {}
      try {
        GmailApp.sendEmail(to, subject, body, opts);
        return true;
      } catch(e2) {
        Logger.log("Mail send error: " + e2.toString());
        return false;
      }
    }

    // 1. إرسال رمز التحقق (OTP) الفعلي عبر البريد فوراً للعميل
    if (data.action === 'SEND_OTP_EMAIL' || data.action === 'SEND_PASSWORD_RESET_EMAIL') {
      var otpSheet = ss.getSheetByName("رموز التحقق") || ss.insertSheet("رموز التحقق");
      if (otpSheet.getLastRow() === 0) {
        otpSheet.appendRow(["التاريخ والوقت", "اسم المشترك", "البريد الإلكتروني", "رمز OTP", "حالة الإرسال"]);
      }
      otpSheet.appendRow([new Date(), data.name || "", data.email || "", data.otp || "", "تم الإرسال"]);

      if (data.email && data.email.indexOf("@") !== -1) {
        var subject = data.subject || ("[MotorCare] رمز تفعيل وتوثيق حسابك: " + data.otp);
        var body = data.body || ("أهلاً بك يا " + (data.name || "عزيزي العميل") + "!\n\nرمز التحقق الفعلي (OTP) الخاص بك هو: " + data.otp + "\n\nصلاحية الرمز 15 دقيقة.\n\nنتمنى لك قيادة آمنة,\nفريق MotorCare");
        var mailOptions = { name: "MotorCare App" };
        if (data.htmlBody) mailOptions.htmlBody = data.htmlBody;
        sendDirectMail(data.email, subject, body, mailOptions);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "otp_sent" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. تسجيل المشترك الجديد وإرسال رسالة الترحيب والاعتماد بعد إتمام التفعيل
    if (data.action === 'SEND_WELCOME_VERIFICATION_EMAIL' || data.action === 'NEW_SUBSCRIBER_REGISTRATION') {
      var subSheet = ss.getSheetByName("المشتركين") || ss.insertSheet("المشتركين");
      if (subSheet.getLastRow() === 0) {
        subSheet.appendRow(["التاريخ والوقت", "اسم المشترك", "البريد الإلكتروني", "طريقة التسجيل", "حالة الإرسال"]);
      }
      subSheet.appendRow([new Date(), data.name || "", data.email || "", data.provider || "email", "تم الإرسال"]);

      if (data.email && data.email.indexOf("@") !== -1) {
        var subject = data.subject || "[MotorCare] تم تفعيل وتوثيق حسابك بنجاح";
        var body = data.body || ("أهلاً بك يا " + (data.name || "عزيزي العميل") + " في عائلة MotorCare!\n\nتم تفعيل اشتراكك بنجاح لمتابعة صيانة سيارتك.\nنتمنى لك قيادة آمنة دائماً,\nفريق MotorCare");
        var mailOptions = { name: "MotorCare App" };
        if (data.htmlBody) mailOptions.htmlBody = data.htmlBody;
        sendDirectMail(data.email, subject, body, mailOptions);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "welcome_sent" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. مسار المقترحات والشكاوى والدعم الفني (إشعار الإدارة + تأكيد استلام حصري للعميل)
    if (data.action === 'FEEDBACK_SUBMISSION' || data.action === 'FEEDBACK_ADMIN_NOTIFICATION') {
      var fbSheet = ss.getSheetByName("المقترحات والشكاوى") || ss.insertSheet("المقترحات والشكاوى");
      if (fbSheet.getLastRow() === 0) {
        fbSheet.appendRow(["التاريخ والوقت", "اسم العميل", "البريد الإلكتروني للرد", "التصنيف", "الموضوع", "التفاصيل", "بيانات المركبة", "رقم التذكرة", "حالة المراجعة"]);
      }
      fbSheet.appendRow([
        new Date(),
        data.name || "",
        data.email || "",
        data.categoryLabel || data.category || "",
        data.subject || "",
        data.message || "",
        data.carDetails || "",
        data.id || ("sug_" + new Date().getTime()),
        "جديد"
      ]);

      var adminEmail = "motorcare.auto@gmail.com";

      // [المسار الأول]: إشعار تفصيلي موجه لإدارة التطبيق والدعم الفني
      var adminSubject = data.adminSubject || ("[MotorCare Admin] [اقتراح / شكوى]: " + (data.subject || "رسالة جديدة من العميل") + " من " + (data.name || "عضو"));
      var adminBody = data.adminBody || data.message || "لا توجد تفاصيل إضافية.";
      var adminOpts = { name: "MotorCare System" };
      if (data.email && data.email.indexOf("@") !== -1) {
        adminOpts.replyTo = data.email;
      }
      if (data.adminHtmlBody) {
        adminOpts.htmlBody = data.adminHtmlBody;
      }
      sendDirectMail(adminEmail, adminSubject, adminBody, adminOpts);

      // [المسار الثاني]: إرسال إيميل تأكيد استلام حصري وجاذب للعميل (Acknowledgement of Receipt)
      if (data.action === 'FEEDBACK_SUBMISSION' && data.email && data.email.indexOf("@") !== -1) {
        var userSubject = data.userSubject || "🚗 تأكيد استلام اقتراحك / رسالتك بنجاح | عائلة MotorCare";
        var userBody = data.userBody || ("أهلاً بك معنا في عائلة MotorCare!\n\nلقد استقبلنا اقتراحك أو رسالتك بنجاح، ونشكرك جداً على حرصك ومساهمتك في تطوير التطبيق معنا. فريقنا يقوم بمراجعتها حالياً، وسيتم الرد عليك في أقرب وقت ممكن.\n\nنتمنى لك قيادة آمنة دائماً!\nفريق MotorCare");
        var userOpts = { 
          name: "فريق MotorCare",
          replyTo: adminEmail
        };
        if (data.userHtmlBody) {
          userOpts.htmlBody = data.userHtmlBody;
        }
        sendDirectMail(data.email, userSubject, userBody, userOpts);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "feedback_processed" })).setMimeType(ContentService.MimeType.JSON);
    }

    // [مسار مستقل]: إرسال رد تلقائي للمستخدم فقط إذا طُلب منفرداً
    if (data.action === 'FEEDBACK_USER_AUTOREPLY') {
      if (data.email && data.email.indexOf("@") !== -1) {
        var userSubject = data.userSubject || "🚗 استلمنا رسالتك بنجاح | شكراً لمساهمتك مع MotorCare";
        var userBody = data.userBody || ("أهلاً بك معنا في عائلة MotorCare!\n\nلقد استقبلنا اقتراحك/رسالتك بنجاح، ونشكرك جداً على حرصك ومساهمتك.");
        var userOpts = { name: "فريق MotorCare", replyTo: "motorcare.auto@gmail.com" };
        if (data.userHtmlBody) userOpts.htmlBody = data.userHtmlBody;
        GmailApp.sendEmail(data.email, userSubject, userBody, userOpts);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "user_autoreply_sent" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. مزامنة تقارير وصيانات السيارات
    var sheet = ss.getSheetByName("سجل الصيانة") || ss.getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Car", "Service Item", "Odometer", "Cost", "Workshop", "Notes"]);
    }
    sheet.appendRow([new Date(), data.car || "", data.partName || "", data.odometer || "", data.totalCost || "", data.workshop || "", data.notes || ""]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
            const isEn = appState.lang === 'en';
            navigator.clipboard.writeText(script).then(() => {
                const btn = document.getElementById('copyScriptBtn');
                if (btn) {
                    const orig = btn.innerHTML;
                    btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>${isEn ? 'Code Copied!' : 'تم نسخ الكود!'}</span>`;
                    setTimeout(() => { btn.innerHTML = orig; }, 2500);
                }
                alert(isEn ? 'Apps Script code copied to clipboard! Paste it inside Extensions > Apps Script in Google Sheets.' : 'تم نسخ كود الـ Webhook بنجاح! الصقه داخل Extensions > Apps Script في جدول جوجل.');
            }).catch(() => {
                alert(isEn ? 'Please copy the script manually from the box above.' : 'يرجى نسخ الكود يدوياً من الصندوق أعلاه.');
            });
        }

        function exportJsonBackup() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute("href", dataStr);
            dl.setAttribute("download", `MotorCare_Backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(dl);
            dl.click();
            dl.remove();
        }

        function exportCsvReport() {
            const car = getCurrentCar();
            if (!car) return;
            const isEn = appState.lang === 'en';

            const headers = isEn
                ? ['Date', 'Service Item', 'Workshop / Tech', 'Phone', 'Odometer (km)', 'Parts Cost (EGP)', 'Labor Cost (EGP)', 'Total Cost (EGP)', 'Service Type']
                : ['التاريخ', 'بند الصيانة', 'المركز / الفني', 'رقم الهاتف', 'العداد (كم)', 'تكلفة قطع الغيار (ج.م)', 'تكلفة المصنعية (ج.م)', 'إجمالي التكلفة (ج.م)', 'نوع الصيانة'];

            const escapeCell = (val) => {
                if (val === null || val === undefined) return '""';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            };

            let rows = [headers.map(escapeCell).join(',')];

            if (car.history && car.history.length > 0) {
                car.history.forEach(h => {
                    const itemName = (typeof getLocalizedItemName === 'function') ? getLocalizedItemName(h.partName || '') : (h.partName || '');
                    const typeStr = h.type === 'CM' ? (isEn ? 'Emergency Repair (CM)' : 'إصلاح عطل طارئ') : (isEn ? 'Preventive Maintenance (PM)' : 'صيانة وقائية دورية');
                    
                    const row = [
                        escapeCell(h.date || ''),
                        escapeCell(itemName),
                        escapeCell(h.workshop || '-'),
                        escapeCell(h.phone || '-'),
                        escapeCell(h.odometer || 0),
                        escapeCell(h.partsCost || 0),
                        escapeCell(h.laborCost || 0),
                        escapeCell(h.totalCost || 0),
                        escapeCell(typeStr)
                    ];
                    rows.push(row.join(','));
                });
            } else {
                const emptyMsg = isEn ? 'No maintenance records registered yet' : 'لا توجد سجلات صيانة مسجلة حتى الآن';
                rows.push([escapeCell(new Date().toISOString().split('T')[0]), escapeCell(emptyMsg), '""', '""', '""', '""', '""', '""', '""'].join(','));
            }

            const csvString = rows.join('\r\n');
            // Adding UTF-8 BOM (\uFEFF) ensures Microsoft Excel and Google Sheets open Unicode Arabic flawlessly without column misalignment
            const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const dl = document.createElement('a');
            dl.setAttribute('href', url);
            const safeBrand = (car.brand || 'Vehicle').replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
            const safeModel = (car.model || 'Model').replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
            dl.setAttribute('download', `MotorCare_${safeBrand}_${safeModel}_ServiceHistory_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(dl);
            dl.click();
            document.body.removeChild(dl);
            URL.revokeObjectURL(url);
        }

        function openAccountCenter() {
            const modal = document.getElementById('accountCenterModal');
            if (!modal) return;
            const isEn = appState.lang === 'en';
            let profile = { name: isEn ? 'Guest Visitor' : 'زائر كريم', email: '', provider: 'guest', isRegistered: false };
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            const nameEl = document.getElementById('accountModalUserName');
            const emailEl = document.getElementById('accountModalUserEmail');
            const badgeEl = document.getElementById('accountModalUserBadge');
            const avatarEl = document.getElementById('accountModalAvatarImg');
            const upgradeBtn = document.getElementById('btnUpgradeAccount');

            if (nameEl) nameEl.innerText = profile.name || (isEn ? 'Guest' : 'زائر');
            if (emailEl) emailEl.innerText = profile.email || (isEn ? 'Offline Local Browsing' : 'وضع التصفح الحر (أوفلاين)');
            
            if (avatarEl) {
                if (profile.avatar) {
                    avatarEl.src = profile.avatar;
                } else {
                    const seed = (profile.email || profile.name || 'motorcare');
                    avatarEl.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
                }
            }

            const verifyNoticeEl = document.getElementById('accountModalVerifyNotice');
            if (badgeEl) {
                if (profile.isRegistered) {
                    if (profile.provider === 'google' || profile.provider === 'facebook') {
                        badgeEl.className = "inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
                        badgeEl.innerText = isEn ? `Verified Member (${profile.provider}) 🛡️` : `مشترك مسجل (${profile.provider === 'google' ? 'جوجل' : 'فيسبوك'}) - معتمد 🛡️`;
                        if (verifyNoticeEl) verifyNoticeEl.classList.add('hidden');
                    } else if (profile.emailVerified === true || profile.isVerified === true || profile.verifiedViaOtp === true || profile.verifiedViaUrl === true) {
                        badgeEl.className = "inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
                        badgeEl.innerText = isEn ? 'Verified Member 🛡️' : 'مشترك معتمد وموثق 🛡️';
                        if (verifyNoticeEl) verifyNoticeEl.classList.add('hidden');
                    } else {
                        badgeEl.className = "inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
                        badgeEl.innerText = isEn ? 'Pending Email Confirmation ✉️' : 'مشترك مسجل (في انتظار تأكيد البريد ✉️)';
                        if (verifyNoticeEl) verifyNoticeEl.classList.remove('hidden');
                    }
                    if (upgradeBtn) upgradeBtn.classList.add('hidden');
                } else {
                    badgeEl.className = "inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                    badgeEl.innerText = isEn ? 'Guest Mode (Private & Local)' : 'وضع الزائر (محلي بخصوصية 100%)';
                    if (upgradeBtn) upgradeBtn.classList.remove('hidden');
                    if (verifyNoticeEl) verifyNoticeEl.classList.add('hidden');
                }
            }

            // تحديث عداد المشتركين للمسؤول (يظهر فقط إذا كان المسؤول مفعل وضع الإدارة)
            let subscribers = [];
            try {
                const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (rawSubs) subscribers = JSON.parse(rawSubs);
            } catch(e) {}
            const subCounterBadge = document.getElementById('accountSubscribersCounterBadge');
            if (subCounterBadge) subCounterBadge.innerText = subscribers.length;

            // إخفاء الزر 100% عن جميع العملاء والمستخدمين العاديين إلا بعد إدخال رمز مرور المسؤول
            const adminBtn = document.getElementById('btnSubscribersAdmin');
            const adminShield = document.getElementById('adminShieldIcon');
            if (adminBtn) {
                if (isAdminUnlocked()) {
                    adminBtn.classList.remove('hidden');
                    if (adminShield) adminShield.className = "fa-solid fa-shield-check text-emerald-500";
                } else {
                    adminBtn.classList.add('hidden');
                    if (adminShield) adminShield.className = "fa-solid fa-shield-halved text-slate-300 dark:text-slate-600";
                }
            }

            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }

        function closeAccountCenter() {
            const modal = document.getElementById('accountCenterModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        /* [LOGOUT & UPGRADE IN MAIN SCOPE] */
        if (typeof window.handleLogout !== 'function') {
            window.handleLogout = handleLogout;
        }
        if (typeof window.handleUpgradeAccount !== 'function') {
            window.handleUpgradeAccount = handleUpgradeAccount;
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof saveNewCar !== 'undefined') window.saveNewCar = saveNewCar; } catch (e) {}
try { if (typeof closeGoogleSheetsModal !== 'undefined') window.closeGoogleSheetsModal = closeGoogleSheetsModal; } catch (e) {}
try { if (typeof exportJsonBackup !== 'undefined') window.exportJsonBackup = exportJsonBackup; } catch (e) {}
try { if (typeof exportCsvReport !== 'undefined') window.exportCsvReport = exportCsvReport; } catch (e) {}
try { if (typeof saveWebhookUrl !== 'undefined') window.saveWebhookUrl = saveWebhookUrl; } catch (e) {}
try { if (typeof copyAppsScriptCode !== 'undefined') window.copyAppsScriptCode = copyAppsScriptCode; } catch (e) {}
try { if (typeof closeAccountCenter !== 'undefined') window.closeAccountCenter = closeAccountCenter; } catch (e) {}
try { if (typeof getAppSenderEmail !== 'undefined') window.getAppSenderEmail = getAppSenderEmail; } catch (e) {}
try { if (typeof openAccountCenter !== 'undefined') window.openAccountCenter = openAccountCenter; } catch (e) {}
try { if (typeof migrateAndAuditCarsCatalog !== 'undefined') window.migrateAndAuditCarsCatalog = migrateAndAuditCarsCatalog; } catch (e) {}
try { if (typeof doPost !== 'undefined') window.doPost = doPost; } catch (e) {}
try { if (typeof doGet !== 'undefined') window.doGet = doGet; } catch (e) {}
try { if (typeof importJsonBackup !== 'undefined') window.importJsonBackup = importJsonBackup; } catch (e) {}
try { if (typeof saveAppSenderEmail !== 'undefined') window.saveAppSenderEmail = saveAppSenderEmail; } catch (e) {}
try { if (typeof sendDirectMail !== 'undefined') window.sendDirectMail = sendDirectMail; } catch (e) {}
try { if (typeof openGoogleSheetsModal !== 'undefined') window.openGoogleSheetsModal = openGoogleSheetsModal; } catch (e) {}
try { if (typeof APP_DEFAULT_SENDER_EMAIL !== 'undefined') window.APP_DEFAULT_SENDER_EMAIL = APP_DEFAULT_SENDER_EMAIL; } catch (e) {}
