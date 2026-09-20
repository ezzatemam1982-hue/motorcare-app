# -*- coding: utf-8 -*-
"""
Fix: Prevent login from register tab when account already exists.
The old code allowed silent login if password matched. 
The fix always rejects and redirects to login tab.
"""

def apply_fix():
    files = ['index.html', 'src/index.html']
    
    old_register_check = """            } else {
                // ===== وضع إنشاء حساب جديد =====
                if (existingAccount) {
                    // الحساب موجود مسبقاً
                    if (existingAccount.password === password) {
                        // كلمة المرور مطابقة، سجله دخول فوراً دون إرباك
                        const profile = { ...existingAccount, lastLoginAt: new Date().toISOString() };
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
                            showNotification(isEn ? `Welcome back, ${profile.name}! 👋` : `أهلاً بعودتك يا ${profile.name}! تم تسجيل الدخول بنجاح 👋`, 'success');
                        }
                        return;
                    } else {
                        if (typeof showNotification === 'function') {
                            showNotification(
                                isEn
                                    ? 'This email is already registered! Please sign in with your password.'
                                    : 'هذا البريد الإلكتروني مسجل مسبقاً! يرجى إدخال كلمة المرور لتسجيل الدخول.',
                                'warning', 5000
                            );
                        }
                        if (typeof switchAuthTab === 'function') switchAuthTab('login');
                        document.getElementById('authPassword')?.focus();
                        return;
                    }
                }"""

    new_register_check = """            } else {
                // ===== وضع إنشاء حساب جديد =====
                if (existingAccount) {
                    // الحساب موجود مسبقاً - يُمنع التسجيل مرة أخرى ويتم التحويل لتبويب تسجيل الدخول
                    if (typeof showNotification === 'function') {
                        showNotification(
                            isEn
                                ? 'This email is already registered! Please switch to the \"Sign In\" tab to log in with your password.'
                                : 'هذا البريد الإلكتروني مسجل مسبقاً! يرجى التحويل لتبويب \"تسجيل الدخول\" وإدخال كلمة المرور.',
                            'warning', 5000
                        );
                    }
                    if (typeof switchAuthTab === 'function') switchAuthTab('login');
                    document.getElementById('authPassword')?.focus();
                    return;
                }"""

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except FileNotFoundError:
            print(f'[{file_path}] File not found, skipping.')
            continue

        if old_register_check in content:
            content = content.replace(old_register_check, new_register_check, 1)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'[{file_path}] FIXED: Removed silent login from register tab. Now always redirects to login tab.')
        else:
            print(f'[{file_path}] Pattern not matched - may already be fixed or code changed.')

apply_fix()
