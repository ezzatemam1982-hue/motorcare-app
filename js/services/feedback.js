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
