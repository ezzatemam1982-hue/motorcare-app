const fs = require('fs');
const path = require('path');

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. إضافة عنصر التنبيه المباشر أسفل حقل البريد الإلكتروني
    const targetHtml = `<input type="email" id="authEmail" name="email" autocomplete="email username"
                                    placeholder="name@example.com" data-i18n-ph="phFeedbackEmail"
                                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 ps-8 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 transition-colors">
                                <i
                                    class="fa-solid fa-envelope absolute inset-y-0 start-0 flex items-center ps-2.5 text-slate-400 text-[11px]"></i>
                            </div>`;

    const replacementHtml = `<input type="email" id="authEmail" name="email" autocomplete="email username"
                                    placeholder="name@example.com" data-i18n-ph="phFeedbackEmail"
                                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 ps-8 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 transition-colors">
                                <i
                                    class="fa-solid fa-envelope absolute inset-y-0 start-0 flex items-center ps-2.5 text-slate-400 text-[11px]"></i>
                            </div>
                            <div id="authEmailExistingHint" class="hidden mt-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center justify-between">
                                <span><i class="fa-solid fa-triangle-exclamation me-1"></i> هذا البريد مسجل مسبقاً!</span>
                                <button type="button" onclick="switchAuthTab('login')" class="underline hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer">تسجيل الدخول الآن</button>
                            </div>`;

    const contentNorm = content.replace(/\r\n/g, '\n');
    const targetNorm = targetHtml.replace(/\r\n/g, '\n');
    const replacementNorm = replacementHtml.replace(/\r\n/g, '\n');

    if (contentNorm.includes(targetNorm)) {
        content = contentNorm.replace(targetNorm, replacementNorm);
        console.log(`[SUCCESS] Added authEmailExistingHint to ${filePath}`);
    } else {
        console.log(`[NOTE] Could not find targetHtml or already added in ${filePath}`);
    }

    // 2. ربط الفحص المباشر في دالة التهيئة أو مع المستمعات
    const liveCheckCode = `
        // مراقبة حية لحقل البريد في وضع إنشاء الحساب لمنع التكرار فوراً
        (function initAuthEmailLiveWatcher() {
            setTimeout(() => {
                const emailInp = document.getElementById('authEmail');
                const hint = document.getElementById('authEmailExistingHint');
                if (!emailInp) return;

                const checkEmail = async () => {
                    const nameContainer = document.getElementById('nameFieldContainer');
                    const isRegisterMode = nameContainer && !nameContainer.classList.contains('hidden');
                    if (!isRegisterMode) {
                        if (hint) hint.classList.add('hidden');
                        return;
                    }

                    const val = (emailInp.value || '').trim().toLowerCase();
                    if (!val || !val.includes('@') || !val.includes('.')) {
                        if (hint) hint.classList.add('hidden');
                        return;
                    }

                    let found = false;
                    try {
                        const raw = SafeStorage.getItem('motorCare_AccountsDB');
                        if (raw) {
                            const accs = JSON.parse(raw);
                            if (accs.some(a => a.email && a.email.toLowerCase() === val)) found = true;
                        }
                    } catch (e) { }

                    if (!found) {
                        try {
                            const subs = JSON.parse(SafeStorage.getItem('motorCare_RegisteredSubscribers') || '[]');
                            if (subs.some(s => s.email && s.email.toLowerCase() === val)) found = true;
                        } catch (e) { }
                    }

                    if (!found) {
                        try {
                            const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                            if (rawProf) {
                                const p = JSON.parse(rawProf);
                                if (p && p.email && p.email.toLowerCase() === val && p.isRegistered) found = true;
                            }
                        } catch (e) { }
                    }

                    if (!found) {
                        try {
                            const sent = JSON.parse(SafeStorage.getItem('motorCare_WelcomeEmailsSent') || '[]');
                            if (Array.isArray(sent) && sent.includes(val)) found = true;
                        } catch (e) { }
                    }

                    if (!found && typeof firestoreDb !== 'undefined' && firestoreDb) {
                        try {
                            const key = val.replace(/[^a-z0-9_]/g, '_');
                            const snap = await Promise.race([
                                firestoreDb.collection('motorcare_users').doc(key).get(),
                                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
                            ]);
                            if (snap && snap.exists) found = true;
                        } catch (e) { }
                    }

                    if (hint) {
                        if (found) hint.classList.remove('hidden');
                        else hint.classList.add('hidden');
                    }
                };

                emailInp.addEventListener('blur', checkEmail);
                emailInp.addEventListener('change', checkEmail);
                emailInp.addEventListener('input', () => {
                    if (hint && !hint.classList.contains('hidden')) {
                        hint.classList.add('hidden');
                    }
                });
            }, 500);
        })();
`;

    // نضيف دالة liveCheckCode داخل switchAuthTab لإخفاء التنبيه عند التبديل
    const switchTarget = `        function switchAuthTab(mode) {
            currentAuthMode = mode;`;

    const switchReplacement = `        function switchAuthTab(mode) {
            currentAuthMode = mode;
            const existingHint = document.getElementById('authEmailExistingHint');
            if (existingHint) existingHint.classList.add('hidden');`;

    const contentNorm2 = content.replace(/\r\n/g, '\n');
    const switchTargetNorm = switchTarget.replace(/\r\n/g, '\n');
    const switchReplacementNorm = switchReplacement.replace(/\r\n/g, '\n');

    if (contentNorm2.includes(switchTargetNorm)) {
        content = contentNorm2.replace(switchTargetNorm, switchReplacementNorm);
        console.log(`[SUCCESS] Integrated hint reset in switchAuthTab for ${filePath}`);
    }

    // إدراج الكود في نهاية السكريبت قبل إغلاق </body>
    if (!content.includes('initAuthEmailLiveWatcher')) {
        content = content.replace('</body>', `${liveCheckCode}\n</body>`);
        console.log(`[SUCCESS] Injected initAuthEmailLiveWatcher in ${filePath}`);
    }

    // Revert to CRLF if file was CRLF originally
    const hasCRLF = fs.readFileSync(filePath, 'utf8').includes('\r\n');
    if (hasCRLF) {
        content = content.replace(/\r?\n/g, '\r\n');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[DONE] Finished live hint update for ${filePath}`);
}

updateFile(path.join(__dirname, '..', 'index.html'));
updateFile(path.join(__dirname, '..', 'src', 'index.html'));
