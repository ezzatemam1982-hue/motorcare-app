# -*- coding: utf-8 -*-
import sys
import os
import re
import hashlib
import shutil

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

INDEX_PATH = r"d:\car\MotorCare-App\index.html"
SRC_INDEX_PATH = r"d:\car\MotorCare-App\src\index.html"

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's locate submitLocationCorrection
old_func_start = "async function submitLocationCorrection() {"
assert old_func_start in content, "submitLocationCorrection not found"

idx_start = content.find(old_func_start)
idx_end = content.find("/* ==========================================================================\n           [FEATURE] سجل تعديلاتي على مواقع التوكيلات (Corrections History & Export)", idx_start)
if idx_end == -1:
    idx_end = content.find("[FEATURE] سجل تعديلاتي على مواقع التوكيلات", idx_start)

assert idx_end != -1, "End of submitLocationCorrection not found"

# Let's craft the optimized submitLocationCorrection with instant local response and non-blocking background cloud sync
new_submit_func = '''async function submitLocationCorrection() {
            const centerId = document.getElementById('scCorrectionCenterId')?.value;
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const notesInput = document.getElementById('scCorrectionNotesInput');
            const emailInput = document.getElementById('scCorrectionEmailInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');
            const statusBox = document.getElementById('scCorrectionStatus');
            const submitBtn = document.getElementById('scSubmitCorrectionBtn');
            const submitBtnText = document.getElementById('scSubmitCorrectionBtnText');

            const lat = parseFloat(latInput?.value);
            const lng = parseFloat(lngInput?.value);
            const note = (notesInput?.value || '').trim();
            const userEmail = (emailInput?.value || '').trim();
            const pastedMapsUrl = (mapsUrlInput?.value || '').trim();

            // Validate Coordinates
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                if (statusBox) {
                    statusBox.classList.remove('hidden');
                    statusBox.className = 'p-2.5 rounded-xl text-[11px] font-bold text-center bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
                    statusBox.textContent = 'يرجى إدخال إحداثيات صحيحة (خط عرض بين -90 و 90، وخط طول بين -180 و 180) أو استخدام زر التقاط GPS.';
                }
                return;
            }

            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const center = centers.find(c => String(c.id) === String(centerId));
            if (!center) {
                alert('لم يتم العثور على بيانات المركز المحدد.');
                return;
            }

            const nowIso = new Date().toISOString();
            const nowFormatted = new Date().toLocaleString('ar-EG');
            const newMapsUrl = pastedMapsUrl.startsWith('http') && !pastedMapsUrl.includes('?') 
                ? pastedMapsUrl 
                : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

            // Build Correction Object
            const correctionData = {
                centerId: center.id,
                centerName: center.name,
                brand: (center.brands || []).join(', '),
                agency: center.agency || '',
                gov: center.gov || '',
                area: center.area || '',
                address: center.address || '',
                oldLat: center.lat || null,
                oldLng: center.lng || null,
                oldMapsUrl: center.mapsUrl || '',
                newLat: lat,
                newLng: lng,
                newMapsUrl: newMapsUrl,
                note: note,
                userEmail: userEmail || 'مستخدم تطبيق موتور كير',
                timestamp: nowIso,
                updatedAtFormatted: nowFormatted,
                status: 'pending_review'
            };

            // 1. OFFLINE-FIRST: Save locally in SafeStorage / localStorage immediately
            let userCorrections = {};
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorrections = JSON.parse(raw);
            } catch (e) {
                userCorrections = {};
            }
            userCorrections[center.id] = correctionData;

            try {
                const serialized = JSON.stringify(userCorrections);
                if (typeof SafeStorage !== 'undefined') {
                    SafeStorage.setItem('motorCare_scUserCorrections', serialized);
                } else {
                    localStorage.setItem('motorCare_scUserCorrections', serialized);
                }
            } catch (e) {
                console.warn('[Location Correction] Failed to save locally:', e);
            }

            // Immediately update in-memory center object
            center.lat = lat;
            center.lng = lng;
            center.mapsUrl = newMapsUrl;
            center._userCorrected = true;

            // Re-render Service Centers UI immediately
            try {
                renderServiceCenters();
            } catch (e) {
                console.warn('[Location Correction] renderServiceCenters update error:', e);
            }

            // 2. IMMEDIATE USER FEEDBACK (Super Fast UI Response)
            if (submitBtn) submitBtn.classList.remove('opacity-75', 'pointer-events-none');
            if (submitBtnText) submitBtnText.innerHTML = '<i class="fa-solid fa-circle-check text-xs"></i> تم الحفظ بنجاح ✨';

            if (statusBox) {
                statusBox.classList.remove('hidden');
                statusBox.className = 'p-3 rounded-2xl text-xs font-bold text-center bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800 space-y-1 animate-fade-in';
                statusBox.innerHTML = `
                    <div class="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-black">
                        <i class="fa-solid fa-circle-check"></i>
                        <span>تم حفظ التعديل وتحديث بطاقة المركز فوراً!</span>
                    </div>
                    <p class="text-[11px] font-normal leading-relaxed text-slate-600 dark:text-slate-300">
                        تم تفعيل الإحداثيات الجديدة على هاتفك بنجاح (Offline-First ⚡)، وجاري المزامنة مع خادم المطور في الخلفية. شكراً لمساهمتك! 🌟
                    </p>
                `;
            }

            if (typeof showNotification === 'function') {
                showNotification(`تم حفظ إحداثيات "${center.name}" وتحديث مسار GPS بنجاح ✨`, 'success');
            }

            // Close modal after 1.5 seconds
            setTimeout(() => {
                closeLocationCorrectionModal();
                if (submitBtnText) submitBtnText.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i> حفظ واعتماد التعديل سحابياً ومحلياً 🚀';
            }, 1500);

            // 3. BACKGROUND CLOUD SYNC & DEVELOPER NOTIFICATIONS (Non-blocking)
            setTimeout(async () => {
                // Channel A: Firestore Persistence
                if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                    try {
                        const docId = `${center.id}_${Date.now()}`;
                        const firestorePayload = {
                            ...correctionData,
                            adminEmail: 'motorcare.auto@gmail.com',
                            userAgent: navigator.userAgent || '',
                            platform: 'MotorCare Web/PWA',
                        };
                        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                            firestorePayload.serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
                        }
                        const firestorePromise = firestoreDb.collection('service_center_corrections').doc(docId).set(firestorePayload);
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('firestore timeout')), 4000));
                        await Promise.race([firestorePromise, timeoutPromise]).catch(e => console.warn('[Location Correction] Firestore note:', e));
                        console.log('[Location Correction] Background Firestore sync complete:', docId);
                    } catch (err) {
                        console.warn('[Location Correction] Firestore sync note:', err);
                    }
                }

                // Channel B: Webhook & Email Notification
                const webhookUrl = typeof getAppWebhookUrl === 'function' ? getAppWebhookUrl() : null;
                const adminEmail = 'motorcare.auto@gmail.com';
                const subject = `[MotorCare GPS Correction] تصحيح موقع: ${center.name} (${(center.brands || []).join(', ')})`;
                
                const jsonSnippet = JSON.stringify({
                    id: center.id,
                    name: center.name,
                    gov: center.gov,
                    area: center.area,
                    lat: lat,
                    lng: lng,
                    mapsUrl: newMapsUrl
                }, null, 2);

                const emailHtml = `
                <div dir="rtl" style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #38bdf8;">
                        <h2 style="color: #0284c7; margin: 0;">🛰️ طلب تصحيح إحداثيات مركز خدمة في تطبيق MotorCare</h2>
                        <p style="color: #64748b; font-size: 13px; margin: 5px 0 0;">مساهمة جديدة من التصحيح الجماعي (Crowdsourced Location)</p>
                    </div>
                    <div style="margin: 20px 0;">
                        <h3 style="color: #0f172a; margin-bottom: 8px;">🏢 بيانات المركز:</h3>
                        <ul style="line-height: 1.8; font-size: 14px;">
                            <li><strong>الاسم:</strong> ${center.name}</li>
                            <li><strong>الماركة / الوكالة:</strong> ${(center.brands || []).join(', ')} - ${center.agency || ''}</li>
                            <li><strong>المحافظة والمنطقة:</strong> ${center.gov} - ${center.area}</li>
                            <li><strong>العنوان الحالي:</strong> ${center.address || 'غير محدد'}</li>
                        </ul>

                        <h3 style="color: #0f172a; margin-top: 20px; margin-bottom: 8px;">📍 مقارنة الإحداثيات:</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px;">
                            <thead>
                                <tr style="background-color: #f1f5f9; text-align: right;">
                                    <th style="padding: 8px; border: 1px solid #cbd5e1;">البيان</th>
                                    <th style="padding: 8px; border: 1px solid #cbd5e1;">القديم</th>
                                    <th style="padding: 8px; border: 1px solid #cbd5e1; background-color: #fef08a;">الجديد المقترح ✨</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">خط العرض (Lat)</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">${center.lat || '-'}</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0369a1;">${lat}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">خط الطول (Lng)</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">${center.lng || '-'}</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0369a1;">${lng}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p style="font-size: 13px;"><strong>🗺️ رابط مقارنة الموقعين على خرائط جوجل:</strong><br>
                        <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" style="color: #0284c7; word-break: break-all;">فتح الإحداثيات المقترحة في خرائط جوجل</a></p>

                        ${note ? `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-right: 4px solid #f59e0b; margin: 15px 0;">
                            <strong>📝 ملاحظة وتوضيح المستخدم:</strong>
                            <p style="margin: 5px 0 0; font-size: 13px; color: #334155;">${note}</p>
                        </div>` : ''}

                        <p style="font-size: 13px;"><strong>👤 بيانات المستخدم:</strong> ${userEmail}</p>
                        <p style="font-size: 12px; color: #64748b;"><strong>⏰ التاريخ والوقت:</strong> ${nowFormatted} (${nowIso})</p>

                        <h4 style="color: #0f172a; margin-top: 20px; margin-bottom: 5px;">💻 كود JSON الجاهز للاعتماد المباشر في قاعدة البيانات:</h4>
                        <pre dir="ltr" style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto;">${jsonSnippet}</pre>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                        تم إرسال هذا الإشعار تلقائياً عبر نظام التصحيح الجماعي الذكي في تطبيق MotorCare.
                    </div>
                </div>`;

                const notificationPayload = {
                    action: 'LOCATION_CORRECTION',
                    centerId: center.id,
                    centerName: center.name,
                    brand: (center.brands || []).join(', '),
                    agency: center.agency || '',
                    oldCoords: { lat: center.lat, lng: center.lng, mapsUrl: center.mapsUrl },
                    newCoords: { lat: lat, lng: lng, mapsUrl: newMapsUrl },
                    googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                    note: note,
                    userEmail: userEmail,
                    timestamp: nowIso,
                    adminEmail: adminEmail,
                    adminSubject: subject,
                    adminHtmlBody: emailHtml,
                    suggestedJsonSnippet: jsonSnippet
                };

                if (webhookUrl && webhookUrl.startsWith('http')) {
                    try {
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000));
                        const fetchPromise = fetch(webhookUrl, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify(notificationPayload)
                        });
                        await Promise.race([fetchPromise, timeoutPromise]).catch(err => {
                            console.warn('[Location Correction] Webhook note:', err);
                        });
                    } catch (err) {
                        console.warn('[Location Correction] Webhook error:', err);
                    }
                }

                if (typeof emailjs !== 'undefined' && emailjs) {
                    try {
                        const emailjsConfig = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_emailjs_config') : localStorage.getItem('motorCare_emailjs_config'));
                        if (emailjsConfig) {
                            const conf = JSON.parse(emailjsConfig);
                            if (conf.serviceId && conf.templateId) {
                                await emailjs.send(conf.serviceId, conf.templateId, {
                                    to_email: adminEmail,
                                    user_name: userEmail,
                                    subject: subject,
                                    message: `تم اقتراح تعديل موقع لمركز: ${center.name} (${lat}, ${lng}). ملاحظات: ${note}`,
                                    ticket_id: `GPS_${center.id}`,
                                    category: 'Location Correction',
                                    car_details: `${center.name} - ${center.gov}`
                                }).catch(e => console.warn('[Location Correction EmailJS] Error:', e));
                            }
                        }
                    } catch (e) {
                        console.warn('[Location Correction EmailJS] Note:', e);
                    }
                }
            }, 50);
        }

        '''

content = content[:idx_start] + new_submit_func + content[idx_end:]

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated submitLocationCorrection in {INDEX_PATH}")

# Mirror to src/index.html
shutil.copy2(INDEX_PATH, SRC_INDEX_PATH)
h1 = hashlib.sha256(open(INDEX_PATH, 'rb').read()).hexdigest()
h2 = hashlib.sha256(open(SRC_INDEX_PATH, 'rb').read()).hexdigest()
assert h1 == h2, f"SHA mismatch! {h1} != {h2}"
print(f"Mirrored with 100% SHA-256 Parity: {h1}")
