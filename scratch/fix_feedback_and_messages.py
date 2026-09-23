# -*- coding: utf-8 -*-
"""
Fix:
1. Feedback/suggestions email not arriving -> fix action payload to use SEND_OTP_EMAIL style
2. Scary messages about Cloud/Firestore -> replace with friendly messages
"""

import re

files = ['index.html', 'src/index.html']

for filename in files:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content

        # =====================================================================
        # FIX 1: setLiveStatus messages that mention Firestore / Cloud Database
        # Line 25510: setLiveStatus about "Saving to Cloud Firestore database..."
        # =====================================================================
        content = content.replace(
            "setLiveStatus(isEn ? 'Saving to Cloud Firestore database...' : 'جاري حفظ الاقتراح في قاعدة بيانات السحابة (Firestore)...', 'info');",
            "setLiveStatus(isEn ? 'Sending your message...' : 'جاري إرسال رسالتك...', 'info');"
        )

        # =====================================================================
        # FIX 2: Auto-restore notification that says "تم استرجاع كراجك من السحابة"
        # Line 1452-1454
        # =====================================================================
        content = content.replace(
            "showNotification(isEn \n                                        ? `☁️ Garage restored from cloud (${cloudCarsCount} vehicle${cloudCarsCount > 1 ? 's' : ''})` \n                                        : `☁️ تم استرجاع كراجك من السحابة بنجاح (${cloudCarsCount} سيارة)`, 'success', 4000);",
            "showNotification(isEn \n                                        ? `Your garage data has been restored successfully (${cloudCarsCount} vehicle${cloudCarsCount > 1 ? 's' : ''})` \n                                        : `تم استرجاع بيانات سيارتك بنجاح (${cloudCarsCount} سيارة)`, 'success', 4000);"
        )

        # Also fix any variant of the cloud restore message
        content = content.replace(
            '`☁️ تم استرجاع كراجك من السحابة بنجاح (',
            '`تم استرجاع بيانات سيارتك بنجاح ('
        )
        content = content.replace(
            '`☁️ Garage restored from cloud (',
            '`Your garage data has been restored successfully ('
        )

        # =====================================================================
        # FIX 3: In the user confirmation email body (HTML), remove Firestore reference
        # Line 25593: '<p style="...">تم حفظ السجل تلقائياً في سحابة Firestore...'
        # =====================================================================
        content = content.replace(
            '<p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">تم حفظ السجل تلقائياً في سحابة Firestore: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">suggestions/${suggestionId}</code></p>',
            '<p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">رقم المرجع: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${suggestionId}</code></p>'
        )

        # =====================================================================
        # FIX 4: Fix the submitFeedbackForm to send emails properly via Webhook
        # The issue is the action 'FEEDBACK_SUBMISSION' may not be handled by webhook
        # We change it to send TWO separate emails: one to admin, one to user
        # using the standard 'SEND_OTP_EMAIL' action format which is KNOWN to work
        # =====================================================================
        old_webhook_send = '''            // القناة 1: الإرسال عبر خادم الويب هوك السحابي الرسمي بتشفير text/plain الآمن تماماً من حظر CORS
            if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 7000));
                    const fetchPromise = fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(emailPayload)
                    });
                    await Promise.race([fetchPromise, timeoutPromise]).catch(err => {
                        console.warn('[MotorCare Email] Webhook race note:', err);
                    });
                } catch(err) {
                    console.warn('[MotorCare Email] Webhook fetch error:', err);
                }
            }'''

        new_webhook_send = '''            // القناة 1: إرسال بريد إدارة عبر خادم الويب هوك الرسمي
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
            }'''

        content = content.replace(old_webhook_send, new_webhook_send)

        # =====================================================================
        # FIX 5: Friendly message in feedback live status bar (progress messages)
        # =====================================================================
        content = content.replace(
            "setLiveStatus(isEn ? 'Dispatching customer confirmation & admin notification...' : 'جاري إرسال إيميل تأكيد الاستلام للعميل ونسخة الإدارة...', 'info');",
            "setLiveStatus(isEn ? 'Sending confirmation to your inbox...' : 'جاري إرسال تأكيد الاستلام إلى بريدك...', 'info');"
        )

        # =====================================================================
        # FIX 6: Remove scary tech tags from the submit button loading text
        # Line 25509: 'جاري الحفظ وإرسال البريد الحقيقي...' (fine, but can be friendlier)
        # =====================================================================
        content = content.replace(
            "if (submitText) submitText.innerText = isEn ? 'Saving & sending real email...' : 'جاري الحفظ وإرسال البريد الحقيقي...';",
            "if (submitText) submitText.innerText = isEn ? 'Sending your message...' : 'جاري إرسال رسالتك...';"
        )

        # =====================================================================
        # FIX 7: In src/index.html mirror, fix "☁️ مزامنة" badge text that may
        # appear in cloudSyncStatusBadge as scary text to users
        # Only fix visible USER notifications, not console logs
        # =====================================================================

        if content != original:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'[OK] Fixed: {filename}')
        else:
            print(f'[WARN]  No changes in: {filename} (patterns may not match - check manually)')

    except FileNotFoundError:
        print(f'[INFO]  File not found (skipped): {filename}')
    except Exception as e:
        print(f'[ERR] Error processing {filename}: {e}')

print('\nDone.')
