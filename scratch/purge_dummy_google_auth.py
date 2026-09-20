# -*- coding: utf-8 -*-
import sys
import shutil
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace early handleSocialLogin and loginAsGoogleProfile in head
old_early_auth = """        function handleSocialLogin(provider) {
            if (typeof window.triggerRealSocialLogin === 'function') {
                return window.triggerRealSocialLogin(provider);
            }
            loginAsGoogleProfile();
        }

        function loginAsGoogleProfile(customName, customEmail, customAvatar) {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const name = customName || (isEn ? 'Google User' : 'مستخدم حساب Google');
            const email = customEmail || 'user.google@gmail.com';
            const avatar = customAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(name);

            let profile = {
                name: name,
                email: email,
                provider: 'google',
                avatar: avatar,
                isRegistered: true,
                isVerified: true,
                emailVerified: true,
                verifiedAt: new Date().toISOString()
            };

            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            enterMainApp();
            if (typeof showNotification === 'function') {
                showNotification(isEn ? `Welcome, ${name}! Signed in via Google ✨` : `أهلاً بك يا ${name}! تم الدخول بنجاح عبر حساب Google ✨`, 'success');
            }
        }"""

new_early_auth = """        function handleSocialLogin(provider) {
            if (typeof window.triggerRealSocialLogin === 'function') {
                return window.triggerRealSocialLogin(provider);
            }
            console.warn('[MotorCare Auth] Real social login initializing...');
        }

        function loginAsGoogleProfile(customName, customEmail, customAvatar) {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            
            // التحقق الصارم: حظر أي بريد وهمي أو فارغ ومنع إنشاء حسابات وهمية تلقائياً
            if (!customEmail || typeof customEmail !== 'string' || !customEmail.includes('@') || 
                customEmail.toLowerCase() === 'user.google@gmail.com' || 
                customEmail.toLowerCase().startsWith('dummy') ||
                customEmail.toLowerCase() === 'user@motorcare.app') {
                console.warn('[MotorCare Auth] Blocked dummy/fake Google login:', customEmail);
                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn 
                            ? 'Please select your actual Google account to sign in ⚠️' 
                            : 'يرجى اختيار وتأكيد حساب Google الحقيقي الخاص بك لتسجيل الدخول ⚠️', 
                        'warning'
                    );
                }
                return false;
            }

            const name = (customName && customName.trim()) ? customName.trim() : customEmail.split('@')[0];
            const email = customEmail.trim();
            const avatar = customAvatar || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(name));

            let profile = {
                name: name,
                email: email,
                provider: 'google',
                avatar: avatar,
                isRegistered: true,
                isVerified: true,
                emailVerified: true,
                verifiedAt: new Date().toISOString()
            };

            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            enterMainApp();
            if (typeof showNotification === 'function') {
                showNotification(isEn ? `Welcome, ${name}! Signed in via Google ✨` : `أهلاً بك يا ${name}! تم الدخول بنجاح عبر حساب Google ✨`, 'success');
            }
            return true;
        }"""

if old_early_auth in content:
    content = content.replace(old_early_auth, new_early_auth)
    print("1. Updated early handleSocialLogin & loginAsGoogleProfile in head")
else:
    print("WARNING: old_early_auth not found")

# 2. Update fetchGoogleUserProfile in main script
old_fetch = """        async function fetchGoogleUserProfile(accessToken) {
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!res.ok) throw new Error(`Google API status ${res.status}`);
                const userInfo = await res.json();
                if (userInfo && (userInfo.email || userInfo.name)) {
                    const realName = userInfo.name || userInfo.given_name || (userInfo.email ? userInfo.email.split('@')[0] : 'Google User');
                    const realEmail = userInfo.email || 'user.google@gmail.com';
                    const avatar = userInfo.picture || '';
                    loginAsGoogleProfile(realName, realEmail, avatar);
                    return true;
                }
            } catch(err) {
                console.warn('[MotorCare Auth] Fetch Google userinfo notice:', err);
            }
            return false;
        }"""

new_fetch = """        async function fetchGoogleUserProfile(accessToken) {
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!res.ok) throw new Error(`Google API status ${res.status}`);
                const userInfo = await res.json();
                if (userInfo && userInfo.email && userInfo.email.includes('@')) {
                    const realName = userInfo.name || userInfo.given_name || userInfo.email.split('@')[0];
                    const realEmail = userInfo.email.trim();
                    const avatar = userInfo.picture || '';
                    return loginAsGoogleProfile(realName, realEmail, avatar);
                }
            } catch(err) {
                console.warn('[MotorCare Auth] Fetch Google userinfo notice:', err);
            }
            return false;
        }"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)
    print("2. Updated fetchGoogleUserProfile")
else:
    print("WARNING: old_fetch not found")

# 3. Update triggerGoogleOAuthWebFlow
old_trigger = """            if (window.location.protocol.startsWith('http')) {
                const popup = window.open(authUrl, 'google_oauth_popup', 'width=520,height=640,left=150,top=100');
                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    window.location.href = authUrl;
                }
            } else {
                loginAsGoogleProfile();
            }"""

new_trigger = """            if (window.location.protocol.startsWith('http')) {
                const popup = window.open(authUrl, 'google_oauth_popup', 'width=520,height=640,left=150,top=100');
                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    window.location.href = authUrl;
                }
            }"""

if old_trigger in content:
    content = content.replace(old_trigger, new_trigger)
    print("3. Updated triggerGoogleOAuthWebFlow")
else:
    print("WARNING: old_trigger not found")

# 4. Update handleGoogleCredentialResponse
old_cred = """        function handleGoogleCredentialResponse(response) {
            try {
                if (response && response.credential) {
                    const base64Url = response.credential.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const payload = JSON.parse(jsonPayload);
                    loginAsGoogleProfile(payload.name, payload.email, payload.picture);
                    return;
                }
            } catch(e) {
                console.warn('[MotorCare Auth] Credential decode error:', e);
            }
            loginAsGoogleProfile();
        }"""

new_cred = """        function handleGoogleCredentialResponse(response) {
            try {
                if (response && response.credential) {
                    const base64Url = response.credential.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const payload = JSON.parse(jsonPayload);
                    if (payload && payload.email && payload.email.includes('@')) {
                        loginAsGoogleProfile(payload.name || payload.given_name || payload.email.split('@')[0], payload.email, payload.picture || '');
                        return;
                    }
                }
            } catch(e) {
                console.warn('[MotorCare Auth] Credential decode error:', e);
            }
        }"""

if old_cred in content:
    content = content.replace(old_cred, new_cred)
    print("4. Updated handleGoogleCredentialResponse")
else:
    print("WARNING: old_cred not found")

# 5. Remove dummy fallbacks from handleSocialLogin and remove openGoogleAccountModal/confirmGoogleAccountLogin
old_social = """                // 5. في حال تعذر الاتصال نهائياً
                loginAsGoogleProfile();
            } else {
                loginAsGoogleProfile();
            }
        }
        window.triggerRealSocialLogin = handleSocialLogin;

        function openGoogleAccountModal() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const modal = document.getElementById('googleConfirmModal');
            if (!modal) {
                loginAsGoogleProfile();
                return;
            }
            const nameInput = document.getElementById('googleConfirmNameInput');
            const emailInput = document.getElementById('googleConfirmEmailInput');
            
            const authEmail = document.getElementById('authEmail')?.value.trim();
            const authName = document.getElementById('authFullName')?.value.trim();
            
            if (nameInput) nameInput.value = authName || (isEn ? 'Google User' : 'مستخدم حساب Google');
            if (emailInput) emailInput.value = authEmail && authEmail.includes('@') ? authEmail : 'user.google@gmail.com';
            
            modal.classList.remove('hidden');
        }

        function closeGoogleAccountModal() {
            const modal = document.getElementById('googleConfirmModal');
            if (modal) modal.classList.add('hidden');
        }

        function confirmGoogleAccountLogin() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const nameInput = document.getElementById('googleConfirmNameInput');
            const emailInput = document.getElementById('googleConfirmEmailInput');
            
            const name = (nameInput?.value || '').trim() || (isEn ? 'Google User' : 'مستخدم حساب Google');
            const email = (emailInput?.value || '').trim() || 'user.google@gmail.com';
            
            closeGoogleAccountModal();
            loginAsGoogleProfile(name, email);
        }

        function loginAsGoogleProfile(customName, customEmail, customAvatar) {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const name = customName || (isEn ? 'Google User' : 'مستخدم حساب Google');
            const email = customEmail || 'user.google@gmail.com';
            const avatar = customAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(name);

            let profile = {
                name: name,
                email: email,
                provider: 'google',
                avatar: avatar,
                isRegistered: true,
                isVerified: true,
                emailVerified: true,
                verifiedAt: new Date().toISOString()
            };

            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            SafeStorage.setItem('motorCare_LoggedIn', 'true');

            const landing = document.getElementById('landingScreen');
            const mainApp = document.getElementById('mainAppContainer');
            if (landing) landing.style.display = 'none';
            if (mainApp) mainApp.style.display = 'flex';

            if (typeof updateHeaderUserProfile === 'function') updateHeaderUserProfile();
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof initUserCloudSync === 'function') initUserCloudSync();
            if (typeof showNotification === 'function') {
                showNotification(isEn ? `Welcome, ${name}! Signed in via Google ✨` : `أهلاً بك يا ${name}! تم الدخول بنجاح عبر حساب Google ✨`, 'success');
            }
        }"""

new_social = """            }
        }
        window.triggerRealSocialLogin = handleSocialLogin;

        function loginAsGoogleProfile(customName, customEmail, customAvatar) {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            // حظر أي حساب وهمي منعاً باتاً
            if (!customEmail || typeof customEmail !== 'string' || !customEmail.includes('@') || 
                customEmail.toLowerCase() === 'user.google@gmail.com' || 
                customEmail.toLowerCase().startsWith('dummy') ||
                customEmail.toLowerCase() === 'user@motorcare.app') {
                console.warn('[MotorCare Auth] Blocked fake Google login:', customEmail);
                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn 
                            ? 'Please select your actual Google account to sign in ⚠️' 
                            : 'يرجى اختيار وتأكيد حساب Google الحقيقي الخاص بك لتسجيل الدخول ⚠️', 
                        'warning'
                    );
                }
                return false;
            }

            const name = (customName && customName.trim()) ? customName.trim() : customEmail.split('@')[0];
            const email = customEmail.trim();
            const avatar = customAvatar || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(name));

            let profile = {
                name: name,
                email: email,
                provider: 'google',
                avatar: avatar,
                isRegistered: true,
                isVerified: true,
                emailVerified: true,
                verifiedAt: new Date().toISOString()
            };

            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            SafeStorage.setItem('motorCare_LoggedIn', 'true');

            const landing = document.getElementById('landingScreen');
            const mainApp = document.getElementById('mainAppContainer');
            if (landing) {
                landing.style.setProperty('display', 'none', 'important');
                landing.classList.add('hidden');
            }
            if (mainApp) {
                mainApp.style.setProperty('display', 'flex', 'important');
                mainApp.classList.remove('hidden');
            }

            if (typeof updateHeaderUserProfile === 'function') updateHeaderUserProfile();
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof initUserCloudSync === 'function') initUserCloudSync();
            if (typeof showNotification === 'function') {
                showNotification(isEn ? `Welcome, ${name}! Signed in via Google ✨` : `أهلاً بك يا ${name}! تم الدخول بنجاح عبر حساب Google ✨`, 'success');
            }
            return true;
        }"""

if old_social in content:
    content = content.replace(old_social, new_social)
    print("5. Replaced main handleSocialLogin & loginAsGoogleProfile without dummy fallbacks")
else:
    print("WARNING: old_social not found")

# 6. Remove googleConfirmModal HTML
old_modal_html = """    <!-- نافذة تأكيد تسجيل الدخول بحساب Google (Native & Safe In-App Dialog) -->
    <div id="googleConfirmModal" class="fixed inset-0 z-[95] bg-black/75 backdrop-blur-xs hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div class="w-14 h-14 mx-auto rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-700">
                <svg class="w-7 h-7" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
            </div>
            <div>
                <h4 class="text-sm font-black text-slate-900 dark:text-white" id="googleConfirmTitle">تسجيل الدخول بحساب Google</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed" id="googleConfirmDesc">
                    تأكيد المصادقة والبدء الفوري بحسابك المعتمد
                </p>
            </div>
            <div class="space-y-3 text-start">
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">اسم الحساب (Display Name):</label>
                    <input type="text" id="googleConfirmNameInput" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" placeholder="مثال: أحمد محمود">
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">البريد الإلكتروني (Gmail Address):</label>
                    <input type="email" id="googleConfirmEmailInput" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500" placeholder="user@gmail.com">
                </div>
                <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <i class="fa-solid fa-shield-check text-base shrink-0"></i>
                    <span>مصادقة معتمدة وموثقة 100% بدون أي روابط خارجية أو إعادة توجيه غير مصرح بها.</span>
                </div>
            </div>
            <div class="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onclick="closeGoogleAccountModal()" class="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">إلغاء</button>
                <button type="button" onclick="confirmGoogleAccountLogin()" class="flex-1 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer">تأكيد والدخول 🚗</button>
            </div>
        </div>
    </div>"""

if old_modal_html in content:
    content = content.replace(old_modal_html, "")
    print("6. Removed googleConfirmModal HTML")
else:
    print("WARNING: old_modal_html not found")

# 7. Add automatic purge of legacy dummy profile on startup
startup_target = """            // فحص رابط تأكيد البريد الإلكتروني ورمز الـ OTP الفعلي
            if (typeof checkUrlEmailVerification === 'function') checkUrlEmailVerification();"""

startup_replacement = """            // تنظيف أي بروفايل وهمي قديم تلقائياً (user.google@gmail.com / مستخدم حساب Google)
            try {
                const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                if (rawProf) {
                    const p = JSON.parse(rawProf);
                    if (p && (p.email === 'user.google@gmail.com' || p.name === 'مستخدم حساب Google' || p.name === 'Google User' || (p.email && p.email.startsWith('dummy')))) {
                        console.log('[MotorCare Auth] Purging legacy dummy Google profile');
                        SafeStorage.removeItem('motorCare_UserProfile');
                        SafeStorage.setItem('motorCare_LoggedIn', 'false');
                    }
                }
            } catch(e) {}

            // فحص رابط تأكيد البريد الإلكتروني ورمز الـ OTP الفعلي
            if (typeof checkUrlEmailVerification === 'function') checkUrlEmailVerification();"""

if startup_target in content:
    content = content.replace(startup_target, startup_replacement)
    print("7. Added startup purge for legacy dummy profiles")
else:
    print("WARNING: startup_target not found")

# Write index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Copy to src/index.html
shutil.copyfile('index.html', 'src/index.html')
print("8. Copied index.html to src/index.html (100% parity)")

# 9. Update Service Worker Cache to v2.0.17
sw_files = ['sw.js', 'service-worker.js', 'src/sw.js', 'src/service-worker.js']
for sw in sw_files:
    with open(sw, 'r', encoding='utf-8') as f:
        sw_text = f.read()
    sw_text = sw_text.replace('motorcare-cache-v2.0.16', 'motorcare-cache-v2.0.17')
    with open(sw, 'w', encoding='utf-8') as f:
        f.write(sw_text)
    print(f"Updated {sw} to v2.0.17")
