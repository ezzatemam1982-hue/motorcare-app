# -*- coding: utf-8 -*-
import sys, re

index_path = r"d:\car\MotorCare-App\index.html"
src_index_path = r"d:\car\MotorCare-App\src\index.html"

with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace from 'function handleSaveProfileEdit' down to end of 'applySelectedAvatar'
target_start = "function handleSaveProfileEdit(e) {"
target_end = "showNotification(isEn ? 'Profile avatar updated successfully! 📸' : 'تم تحديث الصورة الشخصية بنجاح! 📸', 'success');\n            }\n        }"

if target_start in content and target_end in content:
    idx_start = content.index(target_start)
    idx_end = content.index(target_end) + len(target_end)

    replacement = '''function registerSubscriberProfile(profile) {
            if (!profile) return;
            try {
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                const email = (profile.email || (typeof appState !== 'undefined' && appState.user && appState.user.email) || '').trim().toLowerCase();
                if (email) {
                    let subscribers = [];
                    const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                    if (rawSubs) subscribers = JSON.parse(rawSubs);
                    const idx = subscribers.findIndex(s => (s.email || '').toLowerCase() === email);
                    if (idx !== -1) {
                        subscribers[idx] = { ...subscribers[idx], ...profile };
                    } else {
                        subscribers.push({ ...profile, registeredAt: new Date().toISOString() });
                    }
                    SafeStorage.setItem('motorCare_RegisteredSubscribers', JSON.stringify(subscribers));
                }
            } catch(e) {
                console.warn('[MotorCare Profile] registerSubscriberProfile notice:', e);
            }
        }

        function handleSaveProfileEdit(e) {
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
        }

        function updateHeaderUserProfile() {
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
        }

        /* ==========================================================================
           منظومة تخصيص واختيار الأفاتار للمستخدم (User Avatar Customization System)
           ========================================================================== */
        let tempSelectedAvatarUrl = '';

        const PRESET_AVATARS = [
            // روبوتات الكراج الذكية ومساعد الصيانة (Smart Bots)
            'https://api.dicebear.com/7.x/bottts/svg?seed=motorcare',
            'https://api.dicebear.com/7.x/bottts/svg?seed=speedster',
            'https://api.dicebear.com/7.x/bottts/svg?seed=gearhead',
            'https://api.dicebear.com/7.x/bottts/svg?seed=autobot',
            // كباتن القيادة والمغامرون (Adventurers & Drivers)
            'https://api.dicebear.com/7.x/adventurer/svg?seed=CaptainDrive',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=RoadMaster',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=DriftKing',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=SpeedQueen',
            // شخصيات عصرية أنيقة (Modern Personas)
            'https://api.dicebear.com/7.x/personas/svg?seed=Alex',
            'https://api.dicebear.com/7.x/personas/svg?seed=Sarah',
            'https://api.dicebear.com/7.x/personas/svg?seed=Omar',
            'https://api.dicebear.com/7.x/personas/svg?seed=Nour',
            // ستايل عصري راقي (Lorelei VIPs)
            'https://api.dicebear.com/7.x/lorelei/svg?seed=Felix',
            'https://api.dicebear.com/7.x/lorelei/svg?seed=Milo',
            'https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe',
            'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo'
        ];

        function openChangeAvatarModal() {
            let currentAvatar = '';
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) {
                    const profile = JSON.parse(raw);
                    currentAvatar = profile.avatar;
                }
            } catch(e) {}

            if (!currentAvatar) {
                const avatarEl = document.getElementById('accountModalAvatarImg');
                currentAvatar = avatarEl ? avatarEl.src : PRESET_AVATARS[0];
            }

            tempSelectedAvatarUrl = currentAvatar;
            updateAvatarModalPreview(tempSelectedAvatarUrl);
            renderAvatarPresets();

            const modal = document.getElementById('changeAvatarModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        }

        function closeChangeAvatarModal() {
            const modal = document.getElementById('changeAvatarModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function updateAvatarModalPreview(url) {
            const previewImg = document.getElementById('avatarModalPreviewImg');
            if (previewImg) previewImg.src = url;
        }

        function renderAvatarPresets() {
            const grid = document.getElementById('avatarPresetsGrid');
            if (!grid) return;
            grid.innerHTML = '';

            PRESET_AVATARS.forEach((url) => {
                const isSelected = tempSelectedAvatarUrl === url;
                const item = document.createElement('div');
                item.className = `cursor-pointer p-1.5 rounded-2xl border-2 transition-all flex items-center justify-center relative ${
                    isSelected 
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 ring-2 ring-sky-400/40 shadow-md scale-105' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-sky-300'
                }`;
                item.onclick = () => {
                    tempSelectedAvatarUrl = url;
                    updateAvatarModalPreview(url);
                    renderAvatarPresets();
                };
                item.innerHTML = `
                    <img src="${url}" class="w-11 h-11 rounded-xl object-cover">
                    ${isSelected ? '<span class="absolute -top-1 -right-1 bg-sky-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow"><i class="fa-solid fa-check"></i></span>' : ''}
                `;
                grid.appendChild(item);
            });
        }

        function generateRandomAvatar() {
            const styles = ['bottts', 'adventurer', 'personas', 'lorelei'];
            const style = styles[Math.floor(Math.random() * styles.length)];
            const randomSeed = 'mc_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            const randomUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${randomSeed}`;
            tempSelectedAvatarUrl = randomUrl;
            updateAvatarModalPreview(randomUrl);
            renderAvatarPresets();
        }

        function handleCustomAvatarFile(event) {
            const file = event.target?.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const maxDim = 160; // ضغط الصورة لـ 160x160 لتبقى خفيفة جداً (< 15KB) وتحفظ في localStorage دون أي مشاكل
                    canvas.width = maxDim;
                    canvas.height = maxDim;
                    const ctx = canvas.getContext('2d');
                    
                    let sx = 0, sy = 0, sw = img.width, sh = img.height;
                    if (sw > sh) {
                        sx = (sw - sh) / 2;
                        sw = sh;
                    } else if (sh > sw) {
                        sy = (sh - sw) / 2;
                        sh = sw;
                    }
                    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxDim, maxDim);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                    tempSelectedAvatarUrl = compressedBase64;
                    updateAvatarModalPreview(compressedBase64);
                    renderAvatarPresets();
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        }

        function applySelectedAvatar() {
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
        }'''

    content = content[:idx_start] + replacement + content[idx_end:]
    print("Profile and avatar section replaced successfully!")

    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)

    with open(src_index_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("index.html and src/index.html updated successfully!")
else:
    print("Could not find start or end token in content:")
    print("target_start found:", target_start in content)
    print("target_end found:", target_end in content)
