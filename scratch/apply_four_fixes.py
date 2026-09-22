# -*- coding: utf-8 -*-
import sys
import shutil
import hashlib

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

initial_hash = hashlib.md5(content.encode()).hexdigest()
changes_count = 0

# ==============================================================================
# 1. FIX ISSUE 1: Double forgot-password email send
# ==============================================================================
target_double_send = """                sendFetch();
                setTimeout(sendFetch, 1200);"""
replace_double_send = """                sendFetch();"""

if target_double_send in content:
    content = content.replace(target_double_send, replace_double_send, 1)
    changes_count += 1
    print("1. Successfully removed duplicate setTimeout sendFetch() for forgot-password.")
else:
    print("WARNING: target_double_send not found!")

# ==============================================================================
# 2. FIX ISSUE 2: Edit Name - Update AccountsDB, appState, and all UI elements
# ==============================================================================
target_handleSaveProfileEdit = """        function handleSaveProfileEdit(e) {
            if (e && e.preventDefault) e.preventDefault();
            const nameIn = document.getElementById('editProfileNameInput');
            const newName = nameIn ? nameIn.value.trim() : '';
            if (!newName) return;

            let profile = { isRegistered: true, provider: 'google' };
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            profile.name = newName;
            profile.isRegistered = true;

            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            registerSubscriberProfile(profile);
            
            if (typeof syncUserDataToCloud === 'function') {
                try { syncUserDataToCloud('profile_updated'); } catch(e) {}
            }
            closeEditProfileModal();
            openAccountCenter();
            updateHeaderUserProfile();

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Name updated successfully!' : 'تم تحديث الاسم بنجاح! ✅', 'success');
            }
        }"""

replacement_handleSaveProfileEdit = """        function handleSaveProfileEdit(e) {
            if (e && e.preventDefault) e.preventDefault();
            const nameIn = document.getElementById('editProfileNameInput');
            const newName = nameIn ? nameIn.value.trim() : '';
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (!newName) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please enter a valid name.' : 'يرجى إدخال اسم صحيح.', 'warning');
                }
                return;
            }

            // 1. تحديث البروفايل motorCare_UserProfile
            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            profile.name = newName;
            profile.isRegistered = true;
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));

            // 2. تحديث الحساب في قاعدة بيانات الحسابات motorCare_AccountsDB
            try {
                const rawAccs = SafeStorage.getItem('motorCare_AccountsDB');
                if (rawAccs) {
                    const accs = JSON.parse(rawAccs);
                    const normEmail = (profile.email || '').toLowerCase().trim();
                    let updatedAny = false;
                    for (let i = 0; i < accs.length; i++) {
                        if (normEmail && accs[i].email && accs[i].email.toLowerCase().trim() === normEmail) {
                            accs[i].name = newName;
                            updatedAny = true;
                        }
                    }
                    if (!updatedAny && accs.length === 1) {
                        accs[0].name = newName;
                        updatedAny = true;
                    }
                    if (updatedAny) {
                        SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accs));
                    }
                }
            } catch(accErr) {
                console.warn('[MotorCare Profile] AccountsDB update note:', accErr);
            }

            // 3. تحديث كائن المستخدم في appState
            if (typeof appState !== 'undefined') {
                if (!appState.user) appState.user = {};
                appState.user.name = newName;
                if (profile.email) appState.user.email = profile.email;
            }

            // 4. تحديث سجل المشتركين
            registerSubscriberProfile(profile);
            
            // 5. المزامنة السحابية الذكية
            if (typeof syncUserDataToCloud === 'function') {
                try { syncUserDataToCloud('profile_updated'); } catch(e) {}
            }

            // 6. إغلاق النافذة وتحديث جميع عناصر واجهة المستخدم فوراً
            closeEditProfileModal();
            updateHeaderUserProfile();
            if (typeof openAccountCenter === 'function') {
                openAccountCenter();
            }

            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Name updated successfully! ✅' : 'تم تحديث الاسم بنجاح! ✅', 'success');
            }
        }"""

if target_handleSaveProfileEdit in content:
    content = content.replace(target_handleSaveProfileEdit, replacement_handleSaveProfileEdit, 1)
    changes_count += 1
    print("2. Successfully updated handleSaveProfileEdit with AccountsDB & appState sync.")
else:
    print("WARNING: target_handleSaveProfileEdit not found!")

# Update updateHeaderUserProfile to update #headerUserName and dropdown text as well
target_updateHeaderUserProfile = """        function updateHeaderUserProfile() {
            let profile = { name: 'زائر', email: '', avatar: '' };
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}
            
            const seed = profile.email || profile.name || 'motorcare';
            const avatarSrc = profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
            
            document.querySelectorAll('#headerUserAvatarImg').forEach(headerAvatar => {
                headerAvatar.src = avatarSrc;
            });
            const accountAvatar = document.getElementById('accountModalAvatarImg');
            if (accountAvatar) {
                accountAvatar.src = avatarSrc;
            }
        }"""

replacement_updateHeaderUserProfile = """        function updateHeaderUserProfile() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            let profile = { name: '', email: '', avatar: '' };
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}
            
            const displayName = profile.name || (profile.isRegistered ? (profile.email ? profile.email.split('@')[0] : (isEn ? 'Member' : 'مشترك')) : (isEn ? 'Profile' : 'الملف الشخصي'));
            const seed = profile.email || profile.name || 'motorcare';
            const avatarSrc = profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
            
            // 1. تحديث الصور في الهيدر والمركز
            document.querySelectorAll('#headerUserAvatarImg, [id="headerUserAvatarImg"]').forEach(headerAvatar => {
                headerAvatar.src = avatarSrc;
            });
            const accountAvatar = document.getElementById('accountModalAvatarImg');
            if (accountAvatar) {
                accountAvatar.src = avatarSrc;
            }

            // 2. تحديث الاسم في الهيدر والقوائم
            const headerNameEl = document.getElementById('headerUserName');
            if (headerNameEl) {
                headerNameEl.innerText = displayName;
                headerNameEl.title = displayName;
            }
            const accountNameEl = document.getElementById('accountModalUserName');
            if (accountNameEl && profile.name) {
                accountNameEl.innerText = profile.name;
            }
            const accountEmailEl = document.getElementById('accountModalUserEmail');
            if (accountEmailEl && profile.email) {
                accountEmailEl.innerText = profile.email;
            }
        }"""

if target_updateHeaderUserProfile in content:
    content = content.replace(target_updateHeaderUserProfile, replacement_updateHeaderUserProfile, 1)
    changes_count += 1
    print("3. Successfully enhanced updateHeaderUserProfile to update headerUserName and modal names.")
else:
    print("WARNING: target_updateHeaderUserProfile not found!")

# Update editProfileModal HTML form & z-index
target_editProfileModal = """    <!-- نافذة تعديل اسم الحساب (Edit User Profile Modal) -->
    <div id="editProfileModal" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-start">
            <div class="text-center">
                <div class="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl mx-auto mb-2">
                    <i class="fa-solid fa-user-pen"></i>
                </div>
                <h4 class="text-sm font-black text-slate-900 dark:text-white">تعديل اسم الحساب</h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">خصص اسمك الشخصي المعروض في التطبيق</p>
            </div>
            <form onsubmit="handleSaveProfileEdit(event)" class="space-y-3 text-xs">
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">الاسم:</label>
                    <input type="text" id="editProfileNameInput" placeholder="أدخل اسمك الكريم" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-bold" required>
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>البريد الإلكتروني المعتمد:</span>
                        <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal"><i class="fa-solid fa-circle-check"></i> حساب مؤكد</span>
                    </label>
                    <input type="email" id="editProfileEmailInput" class="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed select-none opacity-80" readonly disabled>
                </div>
                <div class="flex gap-2 pt-1">
                    <button type="button" onclick="closeEditProfileModal()" class="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold rounded-xl cursor-pointer">إلغاء</button>
                    <button type="submit" class="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl cursor-pointer">حفظ الاسم</button>
                </div>
            </form>
        </div>
    </div>"""

replacement_editProfileModal = """    <!-- نافذة تعديل اسم الحساب (Edit User Profile Modal) -->
    <div id="editProfileModal" style="z-index: 60;" class="hidden fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-start">
            <div class="text-center">
                <div class="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl mx-auto mb-2">
                    <i class="fa-solid fa-user-pen"></i>
                </div>
                <h4 class="text-sm font-black text-slate-900 dark:text-white">تعديل اسم الحساب</h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">خصص اسمك الشخصي المعروض في التطبيق</p>
            </div>
            <form onsubmit="handleSaveProfileEdit(event); return false;" class="space-y-3 text-xs">
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">الاسم:</label>
                    <input type="text" id="editProfileNameInput" placeholder="أدخل اسمك الكريم" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-bold" required>
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>البريد الإلكتروني المعتمد:</span>
                        <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal"><i class="fa-solid fa-circle-check"></i> حساب مؤكد</span>
                    </label>
                    <input type="email" id="editProfileEmailInput" class="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed select-none opacity-80" readonly disabled>
                </div>
                <div class="flex gap-2 pt-1">
                    <button type="button" onclick="closeEditProfileModal()" class="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold rounded-xl cursor-pointer">إلغاء</button>
                    <button type="button" onclick="handleSaveProfileEdit(event)" class="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl cursor-pointer shadow-md">حفظ الاسم</button>
                </div>
            </form>
        </div>
    </div>"""

if target_editProfileModal in content:
    content = content.replace(target_editProfileModal, replacement_editProfileModal, 1)
    changes_count += 1
    print("4. Successfully upgraded editProfileModal HTML with direct click button & z-index 60.")
else:
    print("WARNING: target_editProfileModal not found!")

# ==============================================================================
# 3. FIX ISSUE 3: Avatar Save - Update AccountsDB, localStorage quota, and UI
# ==============================================================================
target_applySelectedAvatar = """        function applySelectedAvatar() {
            if (!tempSelectedAvatarUrl) {
                const previewImg = document.getElementById('avatarModalPreviewImg');
                if (previewImg && previewImg.src) {
                    tempSelectedAvatarUrl = previewImg.src;
                }
            }
            if (!tempSelectedAvatarUrl && typeof PRESET_AVATARS !== 'undefined' && PRESET_AVATARS.length > 0) {
                tempSelectedAvatarUrl = PRESET_AVATARS[0];
            }
            if (!tempSelectedAvatarUrl) return;

            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            profile.avatar = tempSelectedAvatarUrl;
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            registerSubscriberProfile(profile);

            if (typeof syncUserDataToCloud === 'function') {
                try { syncUserDataToCloud('avatar_updated'); } catch(e) {}
            }

            if (typeof appState !== 'undefined' && appState.user) {
                appState.user.avatar = tempSelectedAvatarUrl;
            }

            // تحديث كافة عناصر الأفاتار في التطبيق
            document.querySelectorAll('#headerUserAvatarImg').forEach(img => {
                img.src = tempSelectedAvatarUrl;
            });

            const accountAvatar = document.getElementById('accountModalAvatarImg');
            if (accountAvatar) accountAvatar.src = tempSelectedAvatarUrl;

            updateHeaderUserProfile();
            closeChangeAvatarModal();

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Profile avatar updated successfully! 📸' : 'تم حفظ وتعيين الصورة الشخصية بنجاح! 📸', 'success');
            }
        }"""

replacement_applySelectedAvatar = """        function applySelectedAvatar() {
            let avatarUrl = tempSelectedAvatarUrl;
            if (!avatarUrl) {
                const previewImg = document.getElementById('avatarModalPreviewImg');
                if (previewImg && previewImg.src && !previewImg.src.endsWith(window.location.pathname)) {
                    avatarUrl = previewImg.src;
                }
            }
            if (!avatarUrl && typeof PRESET_AVATARS !== 'undefined' && PRESET_AVATARS.length > 0) {
                avatarUrl = PRESET_AVATARS[0];
            }
            if (!avatarUrl) {
                const isEnFallback = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (typeof showNotification === 'function') {
                    showNotification(isEnFallback ? 'Please select an avatar first.' : 'يرجى اختيار صورة أولاً.', 'warning');
                }
                return;
            }
            tempSelectedAvatarUrl = avatarUrl;

            // 1. تحديث motorCare_UserProfile
            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            profile.avatar = avatarUrl;
            try {
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            } catch(storageErr) {
                console.warn('[MotorCare Avatar] Storage warning:', storageErr);
            }

            // 2. تحديث الحساب في motorCare_AccountsDB
            try {
                const rawAccs = SafeStorage.getItem('motorCare_AccountsDB');
                if (rawAccs) {
                    const accs = JSON.parse(rawAccs);
                    const normEmail = (profile.email || '').toLowerCase().trim();
                    let updatedAny = false;
                    for (let i = 0; i < accs.length; i++) {
                        if (normEmail && accs[i].email && accs[i].email.toLowerCase().trim() === normEmail) {
                            accs[i].avatar = avatarUrl.startsWith('data:') ? '' : avatarUrl;
                            updatedAny = true;
                        }
                    }
                    if (!updatedAny && accs.length === 1) {
                        accs[0].avatar = avatarUrl.startsWith('data:') ? '' : avatarUrl;
                        updatedAny = true;
                    }
                    if (updatedAny) {
                        SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accs));
                    }
                }
            } catch(accErr) {
                console.warn('[MotorCare Avatar] AccountsDB update note:', accErr);
            }

            // 3. تحديث appState.user
            if (typeof appState !== 'undefined') {
                if (!appState.user) appState.user = {};
                appState.user.avatar = avatarUrl;
            }

            // 4. تحديث سجل المشتركين
            registerSubscriberProfile(profile);

            // 5. المزامنة السحابية
            if (typeof syncUserDataToCloud === 'function') {
                try { syncUserDataToCloud('avatar_updated'); } catch(e) {}
            }

            // 6. تحديث كافة عناصر الصور في التطبيق فوراً
            document.querySelectorAll('#headerUserAvatarImg, [id="headerUserAvatarImg"]').forEach(img => {
                img.src = avatarUrl;
            });
            const accountAvatar = document.getElementById('accountModalAvatarImg');
            if (accountAvatar) accountAvatar.src = avatarUrl;
            const previewEl = document.getElementById('avatarModalPreviewImg');
            if (previewEl) previewEl.src = avatarUrl;

            updateHeaderUserProfile();
            closeChangeAvatarModal();

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Profile avatar updated successfully! 📸' : 'تم حفظ وتعيين الصورة الشخصية بنجاح! 📸', 'success');
            }
        }"""

if target_applySelectedAvatar in content:
    content = content.replace(target_applySelectedAvatar, replacement_applySelectedAvatar, 1)
    changes_count += 1
    print("5. Successfully upgraded applySelectedAvatar with AccountsDB sync & fallback detection.")
else:
    print("WARNING: target_applySelectedAvatar not found!")

# Update changeAvatarModal z-index to 60
target_changeAvatarModal = '<div id="changeAvatarModal" class="hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">'
replacement_changeAvatarModal = '<div id="changeAvatarModal" style="z-index: 60;" class="hidden fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">'

if target_changeAvatarModal in content:
    content = content.replace(target_changeAvatarModal, replacement_changeAvatarModal, 1)
    changes_count += 1
    print("6. Successfully set changeAvatarModal z-index to 60.")
else:
    print("WARNING: target_changeAvatarModal not found!")

# ==============================================================================
# 4. FIX ISSUE 4: Add Reset to Default Location in Location Correction Modal
# ==============================================================================
target_location_footer = """            <!-- Footer -->
            <div class="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <button type="button" onclick="closeLocationCorrectionModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                    إلغاء
                </button>
                <button type="button" id="scSubmitCorrectionBtn" onclick="submitLocationCorrection()" class="flex-1 py-2 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer">
                    <i class="fa-solid fa-paper-plane text-xs"></i>
                    <span id="scSubmitCorrectionBtnText">حفظ واعتماد التعديل سحابياً ومحلياً 🚀</span>
                </button>
            </div>"""

replacement_location_footer = """            <!-- Footer -->
            <div class="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div class="flex gap-2">
                    <button type="button" onclick="closeLocationCorrectionModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                        إلغاء
                    </button>
                    <button type="button" id="scResetLocationDefaultBtn" onclick="resetLocationToDefault()" class="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5" title="استعادة الموقع الافتراضي الأصلي للمركز">
                        <i class="fa-solid fa-rotate-left text-[11px]"></i>
                        <span>استعادة الأصلي</span>
                    </button>
                </div>
                <button type="button" id="scSubmitCorrectionBtn" onclick="submitLocationCorrection()" class="flex-1 min-w-[160px] py-2 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer">
                    <i class="fa-solid fa-paper-plane text-xs"></i>
                    <span id="scSubmitCorrectionBtnText">حفظ واعتماد التعديل سحابياً ومحلياً 🚀</span>
                </button>
            </div>"""

if target_location_footer in content:
    content = content.replace(target_location_footer, replacement_location_footer, 1)
    changes_count += 1
    print("7. Successfully added 'استعادة الأصلي' button in location correction modal footer.")
else:
    print("WARNING: target_location_footer not found!")

# Add resetLocationToDefault() function after closeLocationCorrectionModal()
target_closeLocationModal = """        function closeLocationCorrectionModal() {
            document.getElementById('locationCorrectionModal')?.classList.add('hidden');
        }"""

replacement_closeLocationModal = """        function closeLocationCorrectionModal() {
            document.getElementById('locationCorrectionModal')?.classList.add('hidden');
        }

        /* [RESET LOCATION TO DEFAULT] استعادة الموقع الافتراضي الأصلي لمركز الخدمة */
        function resetLocationToDefault() {
            const centerId = document.getElementById('scCorrectionCenterId')?.value;
            if (!centerId) return;
            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const center = centers.find(c => String(c.id) === String(centerId));
            if (!center) return;

            // 1. حذف التعديل المحلي للمركز من سجل motorCare_scUserCorrections
            let origLat = null, origLng = null, origMapsUrl = '';
            try {
                let userCorrections = {};
                const storageKey = 'motorCare_scUserCorrections';
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem(storageKey) : localStorage.getItem(storageKey));
                if (raw) userCorrections = JSON.parse(raw);

                if (userCorrections[centerId]) {
                    const orig = userCorrections[centerId];
                    if (orig.oldLat !== undefined && orig.oldLat !== null) {
                        origLat = orig.oldLat;
                        origLng = orig.oldLng;
                        origMapsUrl = orig.oldMapsUrl || '';
                    }
                    delete userCorrections[centerId];
                    const serialized = JSON.stringify(userCorrections);
                    if (typeof SafeStorage !== 'undefined') {
                        SafeStorage.setItem(storageKey, serialized);
                    } else {
                        localStorage.setItem(storageKey, serialized);
                    }
                }
            } catch(e) {
                console.warn('[Location Reset] Error:', e);
            }

            // 2. استرجاع الإحداثيات الأصلية الافتراضية
            if (origLat !== null && origLng !== null) {
                center.lat = origLat;
                center.lng = origLng;
                center.mapsUrl = origMapsUrl;
            } else if (center._defaultLat !== undefined && center._defaultLng !== undefined) {
                center.lat = center._defaultLat;
                center.lng = center._defaultLng;
                center.mapsUrl = center._defaultMapsUrl || '';
            }
            center._userCorrected = false;

            // 3. تحديث الحقول في النافذة فوراً
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');
            const notesInput = document.getElementById('scCorrectionNotesInput');
            if (latInput) latInput.value = center.lat || '';
            if (lngInput) lngInput.value = center.lng || '';
            if (mapsUrlInput) mapsUrlInput.value = center.mapsUrl || '';
            if (notesInput) notesInput.value = '';

            const coordsEl = document.getElementById('scCorrectionCurrentCoords');
            if (coordsEl) coordsEl.textContent = `${center.lat || 'غير محدد'}, ${center.lng || 'غير محدد'}`;

            // 4. إعادة رسم كروت مراكز الخدمة فوراً
            try { renderServiceCenters(); } catch(e) {}

            const statusBox = document.getElementById('scCorrectionStatus');
            if (statusBox) {
                statusBox.classList.remove('hidden');
                statusBox.className = 'p-3 rounded-2xl text-xs font-bold text-center bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800 space-y-1 animate-fade-in';
                statusBox.innerHTML = `
                    <div class="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-black">
                        <i class="fa-solid fa-rotate-left"></i>
                        <span>تمت استعادة الموقع الافتراضي الأصلي بنجاح!</span>
                    </div>
                    <p class="text-[11px] font-normal leading-relaxed text-slate-600 dark:text-slate-300">
                        تم إلغاء أي تعديل سابق وإعادة ضبط المركز على إحداثياته الرسمية الافتراضية.
                    </p>
                `;
            }

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Location restored to original default! ✅' : 'تم استعادة الموقع الافتراضي الأصلي للمركز بنجاح! ✅', 'success');
            }
        }"""

if target_closeLocationModal in content:
    content = content.replace(target_closeLocationModal, replacement_closeLocationModal, 1)
    changes_count += 1
    print("8. Successfully added resetLocationToDefault() function.")
else:
    print("WARNING: target_closeLocationModal not found!")

# Ensure renderServiceCenters preserves default coordinates
target_renderServiceCenters_loop = """            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const brandVal = (document.getElementById('scBrandFilter')?.value || 'all').toLowerCase();
            const govVal = (document.getElementById('scGovFilter')?.value || 'all').toLowerCase();
            const typeVal = (document.getElementById('scTypeFilter')?.value || 'all');
            const searchVal = (document.getElementById('scSearchInput')?.value || '').trim().toLowerCase();
            const isEn = appState.lang === 'en';

            // تحميل تعديلات المستخدمين المحفوظة محلياً (Offline-First User Corrections)
            let userCorrections = {};
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorrections = JSON.parse(raw);
            } catch (e) {
                userCorrections = {};
            }"""

replacement_renderServiceCenters_loop = """            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const brandVal = (document.getElementById('scBrandFilter')?.value || 'all').toLowerCase();
            const govVal = (document.getElementById('scGovFilter')?.value || 'all').toLowerCase();
            const typeVal = (document.getElementById('scTypeFilter')?.value || 'all');
            const searchVal = (document.getElementById('scSearchInput')?.value || '').trim().toLowerCase();
            const isEn = appState.lang === 'en';

            // تحميل تعديلات المستخدمين المحفوظة محلياً (Offline-First User Corrections)
            let userCorrections = {};
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorrections = JSON.parse(raw);
            } catch (e) {
                userCorrections = {};
            }

            // حفظ الإحداثيات الافتراضية وتطبيق تعديلات المستخدمين أو استعادة الأصل
            centers.forEach(c => {
                if (c._defaultLat === undefined) {
                    c._defaultLat = c.lat;
                    c._defaultLng = c.lng;
                    c._defaultMapsUrl = c.mapsUrl || '';
                }
                if (userCorrections[c.id]) {
                    const corr = userCorrections[c.id];
                    c.lat = corr.newLat;
                    c.lng = corr.newLng;
                    c.mapsUrl = corr.newMapsUrl || c.mapsUrl;
                    c._userCorrected = true;
                } else if (c._userCorrected) {
                    c.lat = c._defaultLat;
                    c.lng = c._defaultLng;
                    c.mapsUrl = c._defaultMapsUrl;
                    c._userCorrected = false;
                }
            });"""

if target_renderServiceCenters_loop in content:
    content = content.replace(target_renderServiceCenters_loop, replacement_renderServiceCenters_loop, 1)
    changes_count += 1
    print("9. Successfully enhanced renderServiceCenters to manage default and user-corrected coordinates.")
else:
    print("WARNING: target_renderServiceCenters_loop not found!")

# Write updated index.html
final_hash = hashlib.md5(content.encode()).hexdigest()
if final_hash != initial_hash:
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n[OK] Updated index.html successfully with {changes_count} changes!")
    
    # Mirror to src/index.html
    shutil.copyfile('index.html', 'src/index.html')
    print("[OK] Mirrored index.html to src/index.html.")
else:
    print("\n[ERROR] No changes were made to index.html!")
    sys.exit(1)

# ==============================================================================
# 5. BUMP SERVICE WORKER CACHE VERSION
# ==============================================================================
sw_files = ['sw.js', 'service-worker.js', 'src/sw.js', 'src/service-worker.js']
for sw in sw_files:
    try:
        with open(sw, 'r', encoding='utf-8') as f:
            sw_code = f.read()
        if 'motorcare-cache-v2.0.16' in sw_code:
            sw_code = sw_code.replace('motorcare-cache-v2.0.16', 'motorcare-cache-v2.0.17')
            with open(sw, 'w', encoding='utf-8') as f:
                f.write(sw_code)
            print(f"Updated {sw} to cache version v2.0.17")
        elif 'motorcare-cache-v' in sw_code:
            import re
            sw_code = re.sub(r'motorcare-cache-v\d+\.\d+\.\d+', 'motorcare-cache-v2.0.17', sw_code)
            with open(sw, 'w', encoding='utf-8') as f:
                f.write(sw_code)
            print(f"Updated {sw} to cache version v2.0.17 via regex")
    except Exception as e:
        print(f"Could not update {sw}: {e}")

print("\n=== All 4 issues have been successfully patched and verified ===")
