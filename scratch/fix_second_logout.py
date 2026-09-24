import os

def fix_second_logout(file_path):
    print(f"Fixing second handleLogout in {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The clean logout function
    clean_logout_code = '''        function handleLogout() {
            try {
                if (typeof closeAccountCenter === 'function') closeAccountCenter();
                if (typeof closeTopHeaderMenu === 'function') closeTopHeaderMenu();
                if (typeof closeMobileMoreDrawer === 'function') closeMobileMoreDrawer();

                // 1. حفظ بيانات المستخدم الحالي في مفتاح خاص باسمه قبل مسح الجلسة
                try {
                    const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                    if (rawProf) {
                        const prof = JSON.parse(rawProf);
                        const uEmail = (prof.email || '').trim().toLowerCase();
                        if (uEmail && prof.provider !== 'guest') {
                            const uKey = uEmail.replace(/[^a-z0-9_]/g, '_');
                            if (typeof appState !== 'undefined') {
                                SafeStorage.setJSON('motorCare_AppState_' + uKey, appState);
                            }
                        }
                    }
                } catch (e) { }

                // 2. إيقاف مزامنة السحابة اللحظية تماماً
                if (typeof stopCloudSyncListener === 'function') {
                    try { stopCloudSyncListener(); } catch (e) { }
                }

                // 3. تفريغ سيارات الكراج والذاكرة الحية بالكامل
                if (typeof appState !== 'undefined' && appState.cars) {
                    appState.cars.length = 0;
                    appState.currentCarIndex = 0;
                }

                // 4. مسح مفاتيح الجلسة النشطة
                SafeStorage.removeItem('motorCare_AppState_v140');
                SafeStorage.removeItem('motorCare_UserProfile');
                SafeStorage.removeItem('motorCare_PersonalEmergencyContacts');
                SafeStorage.removeItem('motorCare_LastCloudSyncTime');
                SafeStorage.setItem('motorCare_LoggedIn', 'false');

                // 5. مسح المرآة من IndexedDB
                if (typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.removeItem) {
                    MotorCareIndexedDB.removeItem('motorCare_AppState_v140').catch(() => {});
                }

                // 6. تحديث واجهة الكراج لعرض الواجهة الفارغة
                if (typeof renderDashboard === 'function') {
                    try { renderDashboard(); } catch (e) { }
                }

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
        window.handleLogout = handleLogout;'''

    # Old shallow logout around line 8443
    old_shallow_logout = '''        function handleLogout() {
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
        window.handleLogout = handleLogout;'''

    if old_shallow_logout in content:
        content = content.replace(old_shallow_logout, clean_logout_code, 1)
        print("  Replaced shallow handleLogout successfully.")
    else:
        print("  Warning: old_shallow_logout not found exactly.")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_second_logout('d:/car/MotorCare-App/index.html')
    fix_second_logout('d:/car/MotorCare-App/src/index.html')
