# -*- coding: utf-8 -*-
import sys
import shutil
import hashlib

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix btnUpgradeAccount onclick in accountCenterModal
old_btn = '<button id="btnUpgradeAccount" onclick="handleLogout()"'
new_btn = '<button id="btnUpgradeAccount" onclick="handleUpgradeAccount()"'
if old_btn in content:
    content = content.replace(old_btn, new_btn)
    print("1. Replaced btnUpgradeAccount onclick with handleUpgradeAccount()")
else:
    print("WARNING: old_btn not found")

# 2. Add handleLogout and handleUpgradeAccount in early script in head
target_early = """        function openForgotPasswordModal() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Password reset link has been dispatched to your email' : 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني', 'info');
            }
        }"""

replacement_early = """        function openForgotPasswordModal() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Password reset link has been dispatched to your email' : 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني', 'info');
            }
        }

        /* ==========================================================================
           [LOGOUT & UPGRADE ACCOUNT] تسجيل الخروج وترقية الحساب
           ========================================================================== */
        function handleLogout() {
            try {
                if (typeof closeAccountCenter === 'function') closeAccountCenter();
                if (typeof closeTopHeaderMenu === 'function') closeTopHeaderMenu();
                if (typeof closeMobileMoreDrawer === 'function') closeMobileMoreDrawer();

                SafeStorage.removeItem('motorCare_LoggedIn');
                SafeStorage.setItem('motorCare_LoggedIn', 'false');

                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');

                if (landing) {
                    landing.style.removeProperty('display');
                    landing.style.setProperty('display', 'flex', 'important');
                    landing.classList.remove('hidden');
                }
                if (mainApp) {
                    mainApp.style.setProperty('display', 'none', 'important');
                    mainApp.classList.add('hidden');
                }

                if (typeof switchAuthTab === 'function') {
                    switchAuthTab('login');
                }

                const pwdInput = document.getElementById('authPassword');
                if (pwdInput) pwdInput.value = '';

                if (typeof initGoogleIdentityServices === 'function') {
                    try { initGoogleIdentityServices(); } catch(e) {}
                }

                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Signed out successfully 👋' : 'تم تسجيل الخروج بنجاح 👋', 'info');
                }
            } catch (err) {
                console.error('Logout error:', err);
                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');
                if (landing) landing.style.display = 'flex';
                if (mainApp) mainApp.style.display = 'none';
            }
        }
        window.handleLogout = handleLogout;

        function handleUpgradeAccount() {
            try {
                if (typeof closeAccountCenter === 'function') closeAccountCenter();
                if (typeof closeTopHeaderMenu === 'function') closeTopHeaderMenu();
                if (typeof closeMobileMoreDrawer === 'function') closeMobileMoreDrawer();

                SafeStorage.removeItem('motorCare_LoggedIn');
                SafeStorage.setItem('motorCare_LoggedIn', 'false');

                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');

                if (landing) {
                    landing.style.removeProperty('display');
                    landing.style.setProperty('display', 'flex', 'important');
                    landing.classList.remove('hidden');
                }
                if (mainApp) {
                    mainApp.style.setProperty('display', 'none', 'important');
                    mainApp.classList.add('hidden');
                }

                if (typeof switchAuthTab === 'function') {
                    switchAuthTab('register');
                }

                if (typeof initGoogleIdentityServices === 'function') {
                    try { initGoogleIdentityServices(); } catch(e) {}
                }

                setTimeout(() => {
                    const nameInput = document.getElementById('authFullName') || document.getElementById('authEmail');
                    if (nameInput) nameInput.focus();
                }, 150);

                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn 
                            ? 'Create your registered account or sign in with Google to backup and sync your cars! 🚀' 
                            : 'أنشئ حسابك الجديد أو سجل عبر Google لحفظ بيانات سياراتك ومزامنتها سحابياً 🚀', 
                        'info'
                    );
                }
            } catch (err) {
                console.error('Upgrade account error:', err);
                handleLogout();
            }
        }
        window.handleUpgradeAccount = handleUpgradeAccount;"""

if target_early in content:
    content = content.replace(target_early, replacement_early)
    print("2. Added handleLogout and handleUpgradeAccount in early script")
else:
    print("WARNING: target_early not found")

# 3. Add handleLogout and handleUpgradeAccount after closeAccountCenter in main script
target_main = """        function closeAccountCenter() {
            const modal = document.getElementById('accountCenterModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }"""

replacement_main = """        function closeAccountCenter() {
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
        }"""

if target_main in content:
    content = content.replace(target_main, replacement_main)
    print("3. Attached handlers after closeAccountCenter in main script")
else:
    print("WARNING: target_main not found")

# 4. Add Quick Logout to topHeaderDropdownMenu
target_header_menu = """                            <!-- 6. اتصل بنا والدعم والمقترحات -->
                            <button onclick="openContactModal(); closeTopHeaderMenu();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-headset"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xs">الدعم الفني والشكاوى والمقترحات</div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">تواصل مع إدارة التطبيق مباشرة</div>
                                </div>
                            </button>
                        </div>"""

replacement_header_menu = """                            <!-- 6. اتصل بنا والدعم والمقترحات -->
                            <button onclick="openContactModal(); closeTopHeaderMenu();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-headset"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xs">الدعم الفني والشكاوى والمقترحات</div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">تواصل مع إدارة التطبيق مباشرة</div>
                                </div>
                            </button>
                        </div>
                        <!-- زر تسجيل الخروج السريع في القائمة العلوية -->
                        <div class="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <button onclick="handleLogout(); closeTopHeaderMenu();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-right-from-bracket"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xs font-black" data-i18n="btnLogout">تسجيل الخروج</div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">العودة لشاشة البداية وتسجيل الدخول</div>
                                </div>
                            </button>
                        </div>"""

if target_header_menu in content:
    content = content.replace(target_header_menu, replacement_header_menu)
    print("4. Added quick logout to topHeaderDropdownMenu")
else:
    print("WARNING: target_header_menu not found")

# 5. Add Quick Logout to mobileMoreDrawerModal
target_drawer = """                <button onclick="openContactModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer">
                    <span class="flex items-center gap-2"><i class="fa-solid fa-headset text-indigo-500"></i> <span data-i18n="navContactCommunity">اتصل بنا ومركز المساعدة</span></span>
                    <i class="fa-solid fa-chevron-left text-indigo-400 text-xs rtl:rotate-0 ltr:rotate-180"></i>
                </button>
            </div>"""

replacement_drawer = """                <button onclick="openContactModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer">
                    <span class="flex items-center gap-2"><i class="fa-solid fa-headset text-indigo-500"></i> <span data-i18n="navContactCommunity">اتصل بنا ومركز المساعدة</span></span>
                    <i class="fa-solid fa-chevron-left text-indigo-400 text-xs rtl:rotate-0 ltr:rotate-180"></i>
                </button>

                <button onclick="handleLogout(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shadow-2xs">
                    <span class="flex items-center gap-2"><i class="fa-solid fa-right-from-bracket text-rose-500"></i> <span data-i18n="btnLogout">تسجيل الخروج</span></span>
                    <i class="fa-solid fa-chevron-left text-rose-400 text-xs rtl:rotate-0 ltr:rotate-180"></i>
                </button>
            </div>"""

if target_drawer in content:
    content = content.replace(target_drawer, replacement_drawer)
    print("5. Added quick logout to mobileMoreDrawerModal")
else:
    print("WARNING: target_drawer not found")

# Write updated index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Copy to src/index.html
shutil.copyfile('index.html', 'src/index.html')
print("6. Copied index.html to src/index.html (100% parity)")

# 7. Update Service Worker Cache to v2.0.16
sw_files = ['sw.js', 'service-worker.js', 'src/sw.js', 'src/service-worker.js']
for sw in sw_files:
    with open(sw, 'r', encoding='utf-8') as f:
        sw_text = f.read()
    sw_text = sw_text.replace('motorcare-cache-v2.0.15', 'motorcare-cache-v2.0.16')
    with open(sw, 'w', encoding='utf-8') as f:
        f.write(sw_text)
    print(f"Updated {sw} to v2.0.16")
