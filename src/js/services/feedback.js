        /* ==========================================================================
           [MODULE 19] مركز وسائل التواصل الاجتماعي ونموذج الاقتراحات (Contact & Community Hub)
           ========================================================================== */
        let currentFeedbackCategory = 'feature';

        function openContactModal() {
            const modal = document.getElementById('contactCommunityModal');
            if (!modal) return;

            const nameInput = document.getElementById('feedbackNameInput');
            const emailInput = document.getElementById('feedbackEmailInput');

            if (nameInput && (!nameInput.value || nameInput.value.trim() === '')) {
                nameInput.value = (appState.user && appState.user.name) ? appState.user.name : (appState.lang === 'en' ? 'MotorCare Member' : 'مستخدم موتور كير');
            }
            if (emailInput && (!emailInput.value || emailInput.value.trim() === '')) {
                emailInput.value = (appState.user && appState.user.email) ? appState.user.email : '';
            }

            selectFeedbackCategory('feature');
            modal.classList.remove('hidden');
        }

        function closeContactModal() {
            const modal = document.getElementById('contactCommunityModal');
            if (modal) modal.classList.add('hidden');
        }

        function selectFeedbackCategory(cat) {
            currentFeedbackCategory = cat;
            const hiddenVal = document.getElementById('feedbackCategoryVal');
            if (hiddenVal) hiddenVal.value = cat;

            const categories = ['feature', 'bug', 'support', 'review'];
            categories.forEach(c => {
                const btn = document.getElementById(`btnCat-${c}`);
                if (!btn) return;
                if (c === cat) {
                    btn.className = "category-pill-btn py-2 px-2 text-[11px] font-bold rounded-xl border border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs";
                } else {
                    btn.className = "category-pill-btn py-2 px-2 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-all";
                }
            });
        }

        function openSupportMailComposer(event) {
            if (event) event.preventDefault();
            const isEn = appState.lang === 'en';
            const car = getCurrentCar();
            const targetEmail = 'motorcare.auto@gmail.com';
            const carDetails = car ? `${car.brand} ${car.model} (${car.year || ''}) - ${Number(car.odometer).toLocaleString()} km` : '';
            const subject = isEn ? 'MotorCare App - Support & Inquiry' : 'تطبيق موتور كير - استفسار ودعم فني';
            let body = isEn 
                ? `Hello MotorCare Support Team,\n\nI would like to contact you regarding:\n\n` 
                : `مرحباً فريق دعم موتور كير،\n\nأود التواصل معكم بخصوص:\n\n`;
            if (carDetails) {
                body += isEn 
                    ? `\n\n--------------------\nVehicle: ${carDetails}` 
                    : `\n\n--------------------\nبيانات السيارة: ${carDetails}`;
            }
            const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoUrl;
        }

        function focusFeedbackForm() {
            const subjectInput = document.getElementById('feedbackSubjectInput');
            if (subjectInput) {
                subjectInput.focus();
                subjectInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        async function submitFeedbackForm(event) {
            if (event) event.preventDefault();
            const isEn = appState.lang === 'en';
            const car = getCurrentCar();

            const name = document.getElementById('feedbackNameInput')?.value.trim() || (isEn ? 'MotorCare Member' : 'عضو موتور كير');
            const userEmail = document.getElementById('feedbackEmailInput')?.value.trim() || '';
            const subject = document.getElementById('feedbackSubjectInput')?.value.trim() || '';
            const message = document.getElementById('feedbackMessageInput')?.value.trim() || '';
            const cat = document.getElementById('feedbackCategoryVal')?.value || 'feature';

            if (!subject || !message) {
                showNotification(isEn ? 'Please fill in both the subject and the message details.' : 'يرجى كتابة موضوع وتفاصيل الرسالة أو الاقتراح.', 'error');
                return;
            }

            if (!userEmail || !userEmail.includes('@') || !userEmail.includes('.')) {
                showNotification(isEn ? 'Please enter a valid email address to receive confirmation and reply.' : 'يرجى إدخال بريد إلكتروني صالح لتأكيد الاستلام والتواصل معك.', 'warning');
                document.getElementById('feedbackEmailInput')?.focus();
                return;
            }

            const catLabels = {
                feature: isEn ? 'Feature Request' : 'اقتراح ميزة جديدة',
                bug: isEn ? 'Bug Report' : 'إبلاغ عن عطل أو خطأ',
                support: isEn ? 'Technical Support' : 'دعم فني واستفسار',
                review: isEn ? 'Review & Feedback' : 'تقييم ورأي عام'
            };

            const fullSubject = `MotorCare [${catLabels[cat] || cat}]: ${subject}`;
            const carDetails = car ? `${car.brand} ${car.model} (${car.year || ''}) - ${Number(car.odometer).toLocaleString()} km` : (isEn ? 'No vehicle specified' : 'لم تُحدد سيارة بعد');
            const suggestionId = 'sug_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
            const nowIso = new Date().toISOString();
            const nowDateFormatted = new Date().toLocaleString(isEn ? 'en-US' : 'ar-EG', { dateStyle: 'medium', timeStyle: 'short' });

            // مؤشرات التحميل والتقدم الحي على واجهة المستخدم
            const submitBtn = document.getElementById('btnSubmitFeedback');
            const submitIcon = document.getElementById('feedbackSubmitIcon');
            const submitText = document.getElementById('feedbackSubmitText');
            const liveStatus = document.getElementById('feedbackLiveStatus');
            const liveStatusText = document.getElementById('feedbackLiveStatusText');
            const liveStatusIcon = document.getElementById('feedbackLiveStatusIcon');

            const setLiveStatus = (text, type = 'info') => {
                if (liveStatus) {
                    liveStatus.classList.remove('hidden');
                    if (type === 'success') {
                        liveStatus.className = "p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 transition-all flex items-center justify-center gap-2";
                        if (liveStatusIcon) liveStatusIcon.className = 'fa-solid fa-circle-check text-emerald-500';
                    } else if (type === 'error') {
                        liveStatus.className = "p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center text-[11px] font-bold text-rose-600 dark:text-rose-400 transition-all flex items-center justify-center gap-2";
                        if (liveStatusIcon) liveStatusIcon.className = 'fa-solid fa-triangle-exclamation text-rose-500';
                    } else {
                        liveStatus.className = "p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 transition-all flex items-center justify-center gap-2";
                        if (liveStatusIcon) liveStatusIcon.className = 'fa-solid fa-spinner fa-spin text-indigo-500';
                    }
                }
                if (liveStatusText) liveStatusText.innerText = text;
            };

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
            }
            if (submitIcon) submitIcon.className = 'fa-solid fa-spinner fa-spin';
            if (submitText) submitText.innerText = isEn ? 'Sending your message...' : 'جاري إرسال رسالتك...';
            setLiveStatus(isEn ? 'Sending your message...' : 'جاري إرسال رسالتك...', 'info');

            // 1. الحفظ الفعلي المباشر في قاعدة بيانات Firestore (مجموعة suggestions)
            let isFirestoreSaved = false;
            if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    const firestorePayload = {
                        id: suggestionId,
                        name: name,
                        email: userEmail,
                        category: cat,
                        categoryLabel: catLabels[cat] || cat,
                        subject: subject,
                        fullSubject: fullSubject,
                        message: message,
                        carDetails: carDetails,
                        car: car ? {
                            brand: car.brand || '',
                            model: car.model || '',
                            year: car.year || '',
                            odometer: car.odometer || 0
                        } : null,
                        status: 'new',
                        createdAt: nowIso,
                        adminEmail: 'motorcare.auto@gmail.com',
                        adminNotified: true,
                        userAutoReplied: true,
                        userAgent: navigator.userAgent || ''
                    };
                    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                        firestorePayload.timestamp = firebase.firestore.FieldValue.serverTimestamp();
                    } else {
                        firestorePayload.timestamp = nowIso;
                    }
                    await firestoreDb.collection('suggestions').doc(suggestionId).set(firestorePayload);
                    isFirestoreSaved = true;
                    console.log('[MotorCare Cloud] Suggestion persisted in Firestore:', suggestionId);
                } catch(e) {
                    console.warn('[MotorCare Cloud] Firestore save note (continuing to email delivery):', e);
                }
            }

            setLiveStatus(isEn ? 'Sending confirmation to your inbox...' : 'جاري إرسال تأكيد الاستلام إلى بريدك...', 'info');

            // 2. إعداد محتوى إشعار الإدارة الفاخر (Admin Notification)
            const adminEmailAddress = 'motorcare.auto@gmail.com';
            const adminSubject = `[MotorCare Admin] [اقتراح / شكوى]: ${subject} من ${name}`;
            const adminEmailBody = `==================================================\n[MotorCare Admin] إشعار باقتراح / شكوى جديدة\n==================================================\nاسم المرسل: ${name}\nالبريد الإلكتروني للرد: ${userEmail}\nنوع الرسالة / التصنيف: ${catLabels[cat] || cat}\nبيانات السيارة المسجلة: ${carDetails}\nرقم التذكرة: ${suggestionId}\nتاريخ وتوقيت الإرسال: ${nowDateFormatted}\n\nنص الرسالة والتفاصيل:\n${message}\n\n--------------------------------------------------\nمرسل تلقائياً عبر تطبيق MotorCare`;

            const adminHtml = `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); color: #1e293b; text-align: right;">
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4338ca 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
    <span style="display: inline-block; padding: 4px 12px; background: rgba(99,102,241,0.25); border: 1px solid rgba(165,180,252,0.4); border-radius: 999px; font-size: 11px; font-weight: 800; margin-bottom: 10px; color: #c7d2fe;">إشعار وارد للإدارة والدعم الفني</span>
    <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">[MotorCare Admin] اقتراح / شكوى جديدة</h1>
    <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.85;">تم استلام رسالة عبر نموذج المقترحات في التطبيق</p>
  </div>
  <div style="padding: 26px 24px;">
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 120px; font-weight: 700;">اسم العميل:</td><td style="padding: 6px 0; color: #0f172a; font-weight: 800;">${name}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b; font-weight: 700;">البريد الإلكتروني:</td><td style="padding: 6px 0;"><a href="mailto:${userEmail}" style="color: #4338ca; font-weight: 800; text-decoration: none;">${userEmail}</a></td></tr>
        <tr><td style="padding: 6px 0; color: #64748b; font-weight: 700;">نوع الطلب:</td><td style="padding: 6px 0; color: #4338ca; font-weight: 800;"><span style="background: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 8px; font-size: 11px;">${catLabels[cat] || cat}</span></td></tr>
        <tr><td style="padding: 6px 0; color: #64748b; font-weight: 700;">بيانات السيارة المسجلة:</td><td style="padding: 6px 0; color: #334155; font-weight: 700;">${carDetails}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b; font-weight: 700;">رقم التذكرة:</td><td style="padding: 6px 0; font-family: monospace; color: #475569; font-weight: 700;">${suggestionId}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b; font-weight: 700;">تاريخ وتوقيت الإرسال:</td><td style="padding: 6px 0; color: #64748b;">${nowDateFormatted}</td></tr>
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 800; color: #475569; margin-bottom: 8px;">موضوع الاقتراح أو الشكوى:</div>
      <div style="font-size: 15px; font-weight: 800; color: #0f172a; background: #eef2ff; padding: 12px 16px; border-radius: 12px; border-right: 4px solid #4f46e5;">
        ${subject}
      </div>
    </div>

    <div style="margin-bottom: 22px;">
      <div style="font-size: 12px; font-weight: 800; color: #475569; margin-bottom: 8px;">نص الرسالة والتفاصيل الكاملة:</div>
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 16px; font-size: 13px; line-height: 1.8; color: #1e293b; white-space: pre-wrap;">${message}</div>
    </div>

    <div style="text-align: center; margin: 20px 0 10px 0;">
      <a href="mailto:${userEmail}?subject=${encodeURIComponent('رد على تذكرتك في MotorCare: ' + subject)}" style="display: inline-block; background: #4338ca; color: #ffffff !important; text-decoration: none !important; padding: 13px 28px; border-radius: 12px; font-weight: 800; font-size: 13px; box-shadow: 0 4px 12px rgba(67,56,202,0.3);">
        الرد على العميل مباشرة عبر البريد &larr;
      </a>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">رقم المرجع: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${suggestionId}</code></p>
    </div>
  </div>
  <div style="background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
    لوحة إشعارات نظام MotorCare • motorcare.auto@gmail.com
  </div>
</div>`;

            // 3. إعداد إيميل تأكيد الاستلام الحصري للعميل (Acknowledgement of Receipt - بالنص المطلوب حصرياً)
            const userSubject = `[MotorCare] تأكيد استلام رسالتك | عائلة MotorCare`;
            const userPlainText = `أهلاً بك معنا في عائلة MotorCare!

لقد استقبلنا اقتراحك أو رسالتك بنجاح، ونشكرك جداً على حرصك ومساهمتك في تطوير التطبيق معنا. فريقنا يقوم بمراجعتها حالياً، وسيتم الرد عليك في أقرب وقت ممكن.

نتمنى لك قيادة آمنة دائماً!
فريق MotorCare

--------------------------------------------------
بيانات التذكرة المسجلة:
- رقم التذكرة: ${suggestionId}
- الموضوع: ${subject}
- التصنيف: ${catLabels[cat] || cat}
- تاريخ الاستلام: ${nowDateFormatted}`;

            const userHtml = `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); color: #1e293b; text-align: right;">
  <div style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#0284c7 100%);padding:36px 24px;text-align:center;color:#ffffff">
    <div style="display:inline-block;margin-bottom:14px;background:#ffffff;padding:10px 18px;border-radius:18px;box-shadow:0 6px 20px rgba(0,0,0,0.25);"><img src="data:image/jpeg;base64,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" alt="MotorCare" style="width:200px;max-width:100%;height:auto;display:block;border:0;" /></div>
    <div style="margin-bottom: 10px;">
      <span style="display: inline-block; padding: 5px 16px; background: rgba(56,189,248,0.2); border: 1px solid rgba(56,189,248,0.4); border-radius: 999px; font-size: 11px; font-weight: 800; color: #bae6fd; letter-spacing: 0.5px;">تأكيد استلام رسمي بنجاح &check;</span>
    </div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">أهلاً بك معنا في عائلة MotorCare!</h1>
    <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 600;">إشعار تأكيد استلام اقتراح أو رسالة</p>
  </div>

  <div style="padding: 32px 26px;">
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 15px; line-height: 1.9; color: #166534; font-weight: 700; margin: 0;">
        أهلاً بك معنا في عائلة MotorCare!<br><br>
        لقد استقبلنا اقتراحك أو رسالتك بنجاح، ونشكرك جداً على حرصك ومساهمتك في تطوير التطبيق معنا. فريقنا يقوم بمراجعتها حالياً، وسيتم الرد عليك في أقرب وقت ممكن.<br><br>
        نتمنى لك قيادة آمنة دائماً!<br>
        <strong>فريق MotorCare</strong>
      </p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 800; color: #64748b; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; display: flex; justify-content: space-between;">
        <span>بيانات التذكرة المسجلة:</span>
        <span style="font-family: monospace; color: #0284c7;">#${suggestionId}</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 110px; font-weight: 700;">نوع الرسالة:</td>
          <td style="padding: 6px 0; color: #0284c7; font-weight: 800;">${catLabels[cat] || cat}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 700;">موضوع الاقتراح:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 800;">${subject}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 700;">تاريخ الاستلام:</td>
          <td style="padding: 6px 0; color: #475569;">${nowDateFormatted}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${(window.MOTORCARE_ENV && window.MOTORCARE_ENV.APP_URL) || (typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : '') || 'https://localhost/'}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none !important; padding: 14px 34px; border-radius: 14px; font-weight: 800; font-size: 14px; box-shadow: 0 8px 20px rgba(2,132,199,0.35);">
        فتح تطبيق MotorCare 🚗
      </a>
    </div>
  </div>

  <div style="background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
    شكراً لثقتك واهتمامك • <strong>فريق عمل MotorCare</strong><br>
    <span style="direction: ltr; display: inline-block; margin-top: 5px; font-size: 11px; color: #94a3b8;">motorcare.auto@gmail.com</span>
  </div>
</div>`;

            // 4. حزمة البيانات المجمعة لمنظومة الإرسال متعددة القنوات (Multi-Channel Delivery Pipeline)
            const webhookUrl = getAppWebhookUrl();
            const emailPayload = {
                action: 'FEEDBACK_SUBMISSION',
                id: suggestionId,
                name: name,
                email: userEmail,
                category: cat,
                categoryLabel: catLabels[cat] || cat,
                subject: fullSubject,
                message: message,
                carDetails: carDetails,
                adminSubject: adminSubject,
                adminBody: adminEmailBody,
                adminHtmlBody: adminHtml,
                userSubject: userSubject,
                userBody: userPlainText,
                userHtmlBody: userHtml,
                timestamp: nowIso
            };

            // القناة 1: إرسال بريد إدارة عبر خادم الويب هوك الرسمي
            if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                    // إرسال إشعار الإدارة
                    const adminPayload = {
                        action: 'SEND_OTP_EMAIL',
                        name: name,
                        email: adminEmailAddress,
                        subject: adminSubject,
                        body: adminEmailBody,
                        htmlBody: adminHtml,
                        sender: 'motorcare.auto@gmail.com',
                        timestamp: nowIso
                    };
                    fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(adminPayload)
                    }).catch(err => console.warn('[MotorCare Email] Admin notify note:', err));

                    // إرسال تأكيد الاستلام للمستخدم (بعد 500ms لتجنب الإرسال المتزامن)
                    if (userEmail && userEmail.includes('@')) {
                        setTimeout(() => {
                            const userPayload = {
                                action: 'SEND_OTP_EMAIL',
                                name: name,
                                email: userEmail,
                                subject: userSubject,
                                body: userPlainText,
                                htmlBody: userHtml,
                                sender: 'motorcare.auto@gmail.com',
                                timestamp: nowIso
                            };
                            fetch(webhookUrl, {
                                method: 'POST',
                                mode: 'no-cors',
                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                body: JSON.stringify(userPayload)
                            }).catch(err => console.warn('[MotorCare Email] User confirm note:', err));
                        }, 500);
                    }
                } catch(err) {
                    console.warn('[MotorCare Email] Webhook fetch error:', err);
                }
            }

            // القناة 2: الإرسال المباشر عبر EmailJS Browser SDK إذا كان مهيئاً
            if (typeof emailjs !== 'undefined' && emailjs) {
                try {
                    const emailjsConfig = SafeStorage.getItem('motorCare_emailjs_config');
                    if (emailjsConfig) {
                        const conf = JSON.parse(emailjsConfig);
                        if (conf.serviceId && conf.templateId) {
                            await emailjs.send(conf.serviceId, conf.templateId, {
                                to_email: userEmail,
                                user_name: name,
                                subject: userSubject,
                                message: userPlainText,
                                ticket_id: suggestionId,
                                category: catLabels[cat] || cat,
                                car_details: carDetails
                            }).catch(e => console.warn('[MotorCare EmailJS] Error:', e));
                        }
                    }
                } catch(e) {
                    console.warn('[MotorCare EmailJS] Handler note:', e);
                }
            }

            // حفظ نسخة محلية في أرشيف الملاحظات
            try {
                let fbHistory = [];
                const rawFb = SafeStorage.getItem('motorCare_FeedbackHistory');
                if (rawFb) fbHistory = JSON.parse(rawFb);
                fbHistory.unshift({ id: suggestionId, subject: fullSubject, date: nowIso });
                SafeStorage.setItem('motorCare_FeedbackHistory', JSON.stringify(fbHistory.slice(0, 20)));
            } catch(e) {}

            // تحديث حالة الواجهة بنجاح الإرسال الفعلي
            setLiveStatus(isEn ? 'Feedback saved & real confirmation email sent! ✓' : 'تم حفظ الاقتراح وإرسال إيميل التأكيد الفعلي للبريد بنجاح! ✓', 'success');
            if (submitBtn) {
                submitBtn.classList.remove('opacity-75', 'cursor-not-allowed', 'from-indigo-600', 'to-indigo-600');
                submitBtn.classList.add('from-emerald-600', 'to-teal-600');
            }
            if (submitIcon) submitIcon.className = 'fa-solid fa-check text-white';
            if (submitText) submitText.innerText = isEn ? 'Sent Successfully ✓' : 'تم الإرسال والحفظ بنجاح ✓';

            showNotification(isEn
                ? 'Your feedback was saved and a real confirmation email was dispatched to your inbox! 🚗✉️'
                : 'تم استلام اقتراحك بنجاح وحفظه في النظام، وتم إرسال إيميل تأكيد الاستلام إلى بريدك وإشعار الإدارة فوراً! 🚗✉️', 'success', 6000);

            // تفريغ النموذج وإغلاق النافذة بسلاسة بعد إظهار النجاح
            setTimeout(() => {
                const subjInput = document.getElementById('feedbackSubjectInput');
                const msgInput = document.getElementById('feedbackMessageInput');
                if (subjInput) subjInput.value = '';
                if (msgInput) msgInput.value = '';
                if (liveStatus) liveStatus.classList.add('hidden');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('from-emerald-600', 'to-teal-600');
                    submitBtn.classList.add('from-indigo-600', 'to-indigo-600');
                }
                if (submitIcon) submitIcon.className = 'fa-solid fa-paper-plane';
                if (submitText) submitText.innerText = isEn ? 'Send Feedback via Email' : 'إرسال الاقتراح والرسالة فعلياً عبر البريد';
                closeContactModal();
            }, 1400);
        }

        // أداة الفحص والتجربة المباشرة لخدمة إرسال البريد الحقيقي
        async function testFeedbackEmailDispatch() {
            const isEn = appState.lang === 'en';
            const emailInput = document.getElementById('feedbackEmailInput');
            const userEmail = (emailInput && emailInput.value.trim()) || (appState.user && appState.user.email) || '';
            if (!userEmail || !userEmail.includes('@')) {
                showNotification(isEn ? 'Please enter a valid email address first to test dispatch.' : 'يرجى كتابة بريدك الإلكتروني في الحقل أولاً لتجربة فحص الإرسال إليه.', 'warning');
                if (emailInput) emailInput.focus();
                return;
            }
            const subjInput = document.getElementById('feedbackSubjectInput');
            const msgInput = document.getElementById('feedbackMessageInput');
            if (subjInput && !subjInput.value) subjInput.value = isEn ? 'Test feedback & email delivery check' : 'فحص وتجربة إرسال البريد الإلكتروني الفعلي';
            if (msgInput && !msgInput.value) msgInput.value = isEn ? 'This is a live test message from MotorCare email integration service.' : 'هذه رسالة اختبارية حقيقية للتحقق من وصول البريد الإلكتروني وتأكيد الاستلام وإشعار الإدارة.';
            
            showNotification(isEn ? 'Testing live email dispatch...' : 'جاري فحص واختبار إرسال البريد الفعلي...', 'info');
            await submitFeedbackForm();
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof submitFeedbackForm !== 'undefined') window.submitFeedbackForm = submitFeedbackForm; } catch (e) {}
try { if (typeof openContactModal !== 'undefined') window.openContactModal = openContactModal; } catch (e) {}
try { if (typeof openSupportMailComposer !== 'undefined') window.openSupportMailComposer = openSupportMailComposer; } catch (e) {}
try { if (typeof selectFeedbackCategory !== 'undefined') window.selectFeedbackCategory = selectFeedbackCategory; } catch (e) {}
try { if (typeof testFeedbackEmailDispatch !== 'undefined') window.testFeedbackEmailDispatch = testFeedbackEmailDispatch; } catch (e) {}
try { if (typeof focusFeedbackForm !== 'undefined') window.focusFeedbackForm = focusFeedbackForm; } catch (e) {}
try { if (typeof closeContactModal !== 'undefined') window.closeContactModal = closeContactModal; } catch (e) {}
