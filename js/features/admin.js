        /* ==========================================================================
           بوابة أمان المسؤول والرمز السري (Admin Security Gate & Pin Access)
           ========================================================================== */
        function normalizeDigits(str) {
            if (!str) return '';
            const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
            const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
            let result = String(str).trim();
            for (let i = 0; i < 10; i++) {
                result = result.replaceAll(arabicDigits[i], String(i)).replaceAll(persianDigits[i], String(i));
            }
            return result;
        }

        function getStoredAdminPin() {
            const raw = SafeStorage.getItem('motorCare_AdminPin');
            return raw ? normalizeDigits(raw) : '1225';
        }

        function resetAdminPinToDefault() {
            SafeStorage.setItem('motorCare_AdminPin', '1225');
            const pinInput = document.getElementById('inputAdminPin');
            if (pinInput) pinInput.value = '';
            const errEl = document.getElementById('adminPinError');
            if (errEl) errEl.classList.add('hidden');
        }

        function isAdminUnlocked() {
            return sessionStorage.getItem('motorCare_AdminUnlocked') === 'true';
        }

        function openAdminPinModal(callback) {
            pendingAdminCallback = typeof callback === 'function' ? callback : null;
            const modal = document.getElementById('adminPinModal');
            const pinInput = document.getElementById('inputAdminPin');
            const errEl = document.getElementById('adminPinError');
            if (errEl) errEl.classList.add('hidden');
            if (pinInput) pinInput.value = '';
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                setTimeout(() => pinInput?.focus(), 150);
            }
        }

        function closeAdminPinModal() {
            const modal = document.getElementById('adminPinModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
            pendingAdminCallback = null;
        }

        function handleAdminPinSubmit(e) {
            if (e) e.preventDefault();
            const pinInput = document.getElementById('inputAdminPin');
            const entered = normalizeDigits(pinInput ? pinInput.value : '');
            const correctPin = getStoredAdminPin();
            const errEl = document.getElementById('adminPinError');

            // نقبل الرمز المخزن المخصص أو الرموز السرية الخاصة بالمسؤول (1225 أو 8273)
            const isMatch = (entered && (entered === correctPin || entered === '1225' || entered === '8273'));

            if (isMatch) {
                sessionStorage.setItem('motorCare_AdminUnlocked', 'true');
                closeAdminPinModal();

                // إظهار زر الإدارة فوراً في مركز الحساب
                const adminBtn = document.getElementById('btnSubscribersAdmin');
                const adminShield = document.getElementById('adminShieldIcon');
                if (adminBtn) adminBtn.classList.remove('hidden');
                if (adminShield) adminShield.className = "fa-solid fa-shield-check text-emerald-500";

                const isEn = appState.lang === 'en';
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Admin mode unlocked!' : 'تم تفعيل وضع المسؤول بنجاح! 👑');
                }

                if (pendingAdminCallback) {
                    pendingAdminCallback();
                } else {
                    openSubscribersAdminModal();
                }
            } else {
                if (errEl) {
                    errEl.classList.remove('hidden');
                    pinInput?.classList.add('border-rose-500');
                    setTimeout(() => pinInput?.classList.remove('border-rose-500'), 1500);
                }
            }
        }

        function ensureAdminAccess(callback) {
            if (isAdminUnlocked()) {
                if (typeof callback === 'function') callback();
            } else {
                openAdminPinModal(callback);
            }
        }

        function lockAdminAccess() {
            sessionStorage.removeItem('motorCare_AdminUnlocked');
            const adminBtn = document.getElementById('btnSubscribersAdmin');
            const adminShield = document.getElementById('adminShieldIcon');
            if (adminBtn) adminBtn.classList.add('hidden');
            if (adminShield) adminShield.className = "fa-solid fa-shield-halved text-slate-300 dark:text-slate-600";
            closeSubscribersAdminModal();
            const isEn = appState.lang === 'en';
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Admin access locked.' : 'تم قفل وضع المسؤول وإخفاء اللوحة بنجاح 🔒');
            }
        }

        function changeAdminPinPrompt() {
            openChangePinModal();
        }

        function openChangePinModal() {
            const modal = document.getElementById('changePinModal');
            const oldInput = document.getElementById('inputOldAdminPin');
            const newInput = document.getElementById('inputNewAdminPin');
            const msg = document.getElementById('changePinMsg');
            if (msg) msg.classList.add('hidden');
            if (oldInput) oldInput.value = '';
            if (newInput) newInput.value = '';
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                setTimeout(() => oldInput?.focus(), 150);
            }
        }

        function closeChangePinModal() {
            const modal = document.getElementById('changePinModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function handleChangeAdminPinSubmit(e) {
            if (e) e.preventDefault();
            const currentPin = getStoredAdminPin();
            const oldInput = document.getElementById('inputOldAdminPin');
            const newInput = document.getElementById('inputNewAdminPin');
            const msg = document.getElementById('changePinMsg');
            const isEn = appState.lang === 'en';

            const oldVal = normalizeDigits(oldInput ? oldInput.value : '');
            const newVal = normalizeDigits(newInput ? newInput.value : '');

            // يقبل الرمز الحالي المخزن أو الرموز السرية 1225 أو 8273
            if (oldVal !== currentPin && oldVal !== '1225' && oldVal !== '8273') {
                if (msg) {
                    msg.className = "text-[11px] font-bold text-center text-rose-500 block";
                    msg.innerText = isEn ? "Current PIN is incorrect!" : "رمز المرور الحالي غير صحيح!";
                    msg.classList.remove('hidden');
                }
                return;
            }

            if (!newVal || newVal.length < 3) {
                if (msg) {
                    msg.className = "text-[11px] font-bold text-center text-rose-500 block";
                    msg.innerText = isEn ? "PIN must be at least 3 characters!" : "يجب أن يتكون الرمز الجديد من 3 خانات على الأقل!";
                    msg.classList.remove('hidden');
                }
                return;
            }

            SafeStorage.setItem('motorCare_AdminPin', newVal);
            if (msg) {
                msg.className = "text-[11px] font-bold text-center text-emerald-500 block";
                msg.innerText = isEn ? "PIN updated successfully!" : "تم حفظ رمز المرور الجديد بنجاح! ✅";
                msg.classList.remove('hidden');
            }

            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Admin PIN updated successfully!' : 'تم تحديث رمز مرور المسؤول بنجاح! ✅');
            }

            setTimeout(() => {
                closeChangePinModal();
            }, 900);
        }

        /* ==========================================================================
           لوحة إدارة المشتركين والربط السحابي (Subscribers & Cloud Hub Module)
           ========================================================================== */
        function escapeHtml(str) {
            return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function getRegisteredSubscribersList() {
            let list = [];
            try {
                const raw = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (raw) list = JSON.parse(raw);
            } catch(e) {}

            try {
                const curUserRaw = SafeStorage.getItem('motorCare_UserProfile');
                if (curUserRaw) {
                    const curUser = JSON.parse(curUserRaw);
                    if (curUser && curUser.isRegistered && curUser.email) {
                        const exists = list.some(s => s.email && s.email.toLowerCase() === curUser.email.toLowerCase());
                        if (!exists) {
                            list.unshift({
                                id: 'sub_' + Date.now(),
                                name: curUser.name || 'Current User',
                                email: curUser.email,
                                provider: curUser.provider || 'google',
                                date: curUser.registeredAt || new Date().toISOString(),
                                lang: appState.lang
                            });
                            SafeStorage.setItem('motorCare_RegisteredSubscribers', JSON.stringify(list));
                        }
                    }
                }
            } catch(e) {}
            return list;
        }

        function openSubscribersAdminModal() {
            if (!isAdminUnlocked()) {
                openAdminPinModal(() => openSubscribersAdminModal());
                return;
            }
            const modal = document.getElementById('subscribersAdminModal');
            if (!modal) return;
            renderSubscribersTable();
            updateCloudSyncStatusInModal();
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }

        function closeSubscribersAdminModal() {
            const modal = document.getElementById('subscribersAdminModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function updateCloudSyncStatusInModal() {
            const webhook = getAppWebhookUrl();
            const dot = document.getElementById('cloudStatusIconDot');
            const title = document.getElementById('cloudStatusTitle');
            const desc = document.getElementById('cloudStatusDesc');
            const isEn = appState.lang === 'en';

            if (webhook && webhook.startsWith('http')) {
                if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50";
                if (title) title.innerText = isEn ? "Google Sheets Cloud: Connected & Active 🟢" : "السحابة (Google Sheets): متصلة وتعمل بنجاح 🟢";
                if (desc) desc.innerText = isEn ? "All new subscribers and service events are automatically synced to your cloud sheet." : "يتم إرسال أي مشترك جديد فورياً إلى جدول Google Sheets الخاص بك.";
            } else {
                if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse";
                if (title) title.innerText = isEn ? "Google Sheets Cloud: Ready to connect 🟡" : "السحابة (Google Sheets): تخزين محلي جاهز للربط 🟡";
                if (desc) desc.innerText = isEn ? "Click Setup to connect your private Google Sheet in 1 minute." : "اضغط على زر الإعداد لربط جدولك السحابي الخاص واستقبال المشتركين فيه.";
            }
        }

        function renderSubscribersTable(filterText = '') {
            const subscribers = getRegisteredSubscribersList();
            const isEn = appState.lang === 'en';

            // تحديث الإحصائيات
            const totalEl = document.getElementById('statSubscribersTotal');
            const googleEl = document.getElementById('statSubscribersGoogle');
            const facebookEl = document.getElementById('statSubscribersFacebook');
            const emailEl = document.getElementById('statSubscribersEmail');

            const googleCount = subscribers.filter(s => s.provider === 'google').length;
            const fbCount = subscribers.filter(s => s.provider === 'facebook').length;
            const emailCount = subscribers.filter(s => s.provider === 'email').length;

            if (totalEl) totalEl.innerText = subscribers.length;
            if (googleEl) googleEl.innerText = googleCount;
            if (facebookEl) facebookEl.innerText = fbCount;
            if (emailEl) emailEl.innerText = emailCount;

            const badgeOnAccount = document.getElementById('accountSubscribersCounterBadge');
            if (badgeOnAccount) badgeOnAccount.innerText = subscribers.length;

            const tbody = document.getElementById('subscribersTableBody');
            if (!tbody) return;

            let filtered = subscribers;
            if (filterText && filterText.trim()) {
                const q = filterText.trim().toLowerCase();
                filtered = subscribers.filter(s => 
                    (s.name && s.name.toLowerCase().includes(q)) || 
                    (s.email && s.email.toLowerCase().includes(q))
                );
            }

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="p-8 text-center text-slate-400 dark:text-slate-500">
                            <i class="fa-solid fa-users-slash text-3xl mb-2 block opacity-40"></i>
                            <span class="text-xs font-bold">${isEn ? 'No registered subscribers found' : 'لا يوجد مشتركون مسجلون حالياً أو لا توجد نتائج مطابقة'}</span>
                            <p class="text-[10px] mt-1 text-slate-400">${isEn ? 'Any member who logs in via Google, Facebook, or Email will appear here live.' : 'أي مستخدم يسجل دخوله بحساب Google أو Facebook أو البريد سيظهر هنا فوراً.'}</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filtered.map((sub, idx) => {
                let provBadge = '';
                if (sub.provider === 'google') {
                    provBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40"><i class="fa-brands fa-google text-[9px]"></i> Google</span>`;
                } else if (sub.provider === 'facebook') {
                    provBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300/40"><i class="fa-brands fa-facebook text-[9px]"></i> Facebook</span>`;
                } else {
                    provBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300/40"><i class="fa-solid fa-envelope text-[9px]"></i> Email</span>`;
                }

                const dateStr = sub.date ? new Date(sub.date).toLocaleDateString(isEn ? 'en-US' : 'ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
                const avatarSeed = encodeURIComponent(sub.email || sub.name || 'sub');

                return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td class="p-2.5 text-slate-400 font-mono text-[11px]">${idx + 1}</td>
                        <td class="p-2.5">
                            <div class="flex items-center gap-2">
                                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}" class="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
                                <span class="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">${escapeHtml(sub.name || 'Member')}</span>
                            </div>
                        </td>
                        <td class="p-2.5 text-slate-600 dark:text-slate-300 font-mono text-[11px] select-all">${escapeHtml(sub.email || '-')}</td>
                        <td class="p-2.5 text-center">${provBadge}</td>
                        <td class="p-2.5 text-center text-slate-500 dark:text-slate-400 text-[10px] whitespace-nowrap">${dateStr}</td>
                    </tr>
                `;
            }).join('');
        }

        function filterSubscribersTable() {
            const input = document.getElementById('subscribersSearchInput');
            renderSubscribersTable(input ? input.value : '');
        }

        function exportSubscribersToCSV() {
            const list = getRegisteredSubscribersList();
            const isEn = appState.lang === 'en';
            if (!list || list.length === 0) {
                alert(isEn ? 'No subscribers to export yet.' : 'لا يوجد مشتركون لتصديرهم حالياً.');
                return;
            }

            let csv = '\uFEFF'; // UTF-8 BOM for Arabic Excel
            csv += 'ID,Name,Email,Provider,RegistrationDate\n';
            list.forEach((s, idx) => {
                const safeName = (s.name || '').replace(/"/g, '""');
                const safeEmail = (s.email || '').replace(/"/g, '""');
                const safeProv = (s.provider || '').replace(/"/g, '""');
                const safeDate = (s.date || '').replace(/"/g, '""');
                csv += `"${idx + 1}","${safeName}","${safeEmail}","${safeProv}","${safeDate}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MotorCare_Subscribers_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function copySubscribersEmails() {
            const list = getRegisteredSubscribersList();
            const isEn = appState.lang === 'en';
            const emails = list.map(s => s.email).filter(Boolean);
            if (emails.length === 0) {
                alert(isEn ? 'No emails found.' : 'لا توجد إيميلات للنسخ.');
                return;
            }
            navigator.clipboard.writeText(emails.join(', ')).then(() => {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? `Copied ${emails.length} subscriber emails!` : `تم نسخ ${emails.length} بريد إلكتروني بنجاح!`);
                } else {
                    alert(isEn ? `Copied ${emails.length} emails to clipboard!` : `تم نسخ ${emails.length} بريد إلكتروني بنجاح!`);
                }
            });
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof changeAdminPinPrompt !== 'undefined') window.changeAdminPinPrompt = changeAdminPinPrompt; } catch (e) {}
try { if (typeof openSubscribersAdminModal !== 'undefined') window.openSubscribersAdminModal = openSubscribersAdminModal; } catch (e) {}
try { if (typeof isAdminUnlocked !== 'undefined') window.isAdminUnlocked = isAdminUnlocked; } catch (e) {}
try { if (typeof resetAdminPinToDefault !== 'undefined') window.resetAdminPinToDefault = resetAdminPinToDefault; } catch (e) {}
try { if (typeof copySubscribersEmails !== 'undefined') window.copySubscribersEmails = copySubscribersEmails; } catch (e) {}
try { if (typeof handleChangeAdminPinSubmit !== 'undefined') window.handleChangeAdminPinSubmit = handleChangeAdminPinSubmit; } catch (e) {}
try { if (typeof openChangePinModal !== 'undefined') window.openChangePinModal = openChangePinModal; } catch (e) {}
try { if (typeof getStoredAdminPin !== 'undefined') window.getStoredAdminPin = getStoredAdminPin; } catch (e) {}
try { if (typeof filterSubscribersTable !== 'undefined') window.filterSubscribersTable = filterSubscribersTable; } catch (e) {}
try { if (typeof normalizeDigits !== 'undefined') window.normalizeDigits = normalizeDigits; } catch (e) {}
try { if (typeof renderSubscribersTable !== 'undefined') window.renderSubscribersTable = renderSubscribersTable; } catch (e) {}
try { if (typeof closeSubscribersAdminModal !== 'undefined') window.closeSubscribersAdminModal = closeSubscribersAdminModal; } catch (e) {}
try { if (typeof updateCloudSyncStatusInModal !== 'undefined') window.updateCloudSyncStatusInModal = updateCloudSyncStatusInModal; } catch (e) {}
try { if (typeof getRegisteredSubscribersList !== 'undefined') window.getRegisteredSubscribersList = getRegisteredSubscribersList; } catch (e) {}
try { if (typeof closeAdminPinModal !== 'undefined') window.closeAdminPinModal = closeAdminPinModal; } catch (e) {}
try { if (typeof exportSubscribersToCSV !== 'undefined') window.exportSubscribersToCSV = exportSubscribersToCSV; } catch (e) {}
try { if (typeof ensureAdminAccess !== 'undefined') window.ensureAdminAccess = ensureAdminAccess; } catch (e) {}
try { if (typeof closeChangePinModal !== 'undefined') window.closeChangePinModal = closeChangePinModal; } catch (e) {}
try { if (typeof escapeHtml !== 'undefined') window.escapeHtml = escapeHtml; } catch (e) {}
try { if (typeof handleAdminPinSubmit !== 'undefined') window.handleAdminPinSubmit = handleAdminPinSubmit; } catch (e) {}
try { if (typeof lockAdminAccess !== 'undefined') window.lockAdminAccess = lockAdminAccess; } catch (e) {}
try { if (typeof openAdminPinModal !== 'undefined') window.openAdminPinModal = openAdminPinModal; } catch (e) {}
