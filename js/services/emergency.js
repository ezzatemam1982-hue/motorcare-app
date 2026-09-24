        /* ==========================================================================
           [MODULE 17] خدمات وطوارئ الطريق السريعة (Emergency Roadside Assistance & SOS)
           ========================================================================== */
        const MotorCareEmergency = {
            activeSection: 'gps',

            officialDirectory: [
                {
                    id: 'police',
                    nameAr: 'شرطة النجدة',
                    nameEn: 'Police Emergency',
                    number: '122',
                    descAr: 'للطوارئ الأمنية والحوادث الجسيمة وتأمين المواطنين',
                    descEn: 'Security emergencies, severe accidents & police assistance',
                    icon: 'fa-shield-halved',
                    badgeBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                },
                {
                    id: 'ambulance',
                    nameAr: 'الإسعاف المصري',
                    nameEn: 'Egyptian Ambulance',
                    number: '123',
                    descAr: 'طوارئ الإصابات، الحوادث المرورية، والرعاية الطبية العاجلة',
                    descEn: 'Traffic casualties, medical emergencies & first aid',
                    icon: 'fa-truck-medical',
                    badgeBg: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                },
                {
                    id: 'highway',
                    nameAr: 'طوارئ وإغاثة الطرق السريعة',
                    nameEn: 'Highway Patrol & Rescue',
                    number: '01221111256',
                    descAr: 'إغاثة الأعطال والحوادث على الطرق السريعة والصحراوية والزراعية',
                    descEn: 'Breakdowns & rescue on desert & intercity highways',
                    icon: 'fa-road',
                    badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                },
                {
                    id: 'traffic_general',
                    nameAr: 'إدارة المرور العامة',
                    nameEn: 'General Traffic Police',
                    number: '128',
                    descAr: 'بلاغات الشلل المروري، إغلاق الطرق، وأوناش المرور المركزية',
                    descEn: 'Traffic jams, highway road closures & central cranes',
                    icon: 'fa-traffic-light',
                    badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                },
                {
                    id: 'traffic_cairo',
                    nameAr: 'مرور القاهرة والجيزة (الخط الساخن)',
                    nameEn: 'Cairo & Giza Traffic Hotline',
                    number: '136',
                    descAr: 'أوناش سحب سيارات الأعطال والحوادث داخل العاصمة والمدن',
                    descEn: 'Urban breakdown towing & emergency traffic support',
                    icon: 'fa-truck-pickup',
                    badgeBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                },
                {
                    id: 'civil_defense',
                    nameAr: 'الحماية المدنية والمطافئ',
                    nameEn: 'Civil Defense & Fire Service',
                    number: '180',
                    descAr: 'طوارئ الحرائق، تسريب الوقود، وعمليات الإنقاذ المعقدة',
                    descEn: 'Vehicle fires, fuel leaks & specialized rescue',
                    icon: 'fa-fire-extinguisher',
                    badgeBg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                }
            ],

            nearbyServices: [
                {
                    id: 'towing',
                    queryAr: 'ونش انقاذ سيارات',
                    queryEn: 'car towing service'
                },
                {
                    id: 'gas_station',
                    queryAr: 'محطة وقود بنزينة',
                    queryEn: 'gas station petrol'
                },
                {
                    id: 'tire_repair',
                    queryAr: 'تصليح كاوتش بنشر سيارات',
                    queryEn: 'tire repair shop flat tire'
                },
                {
                    id: 'mechanic',
                    queryAr: 'كهربائي سيارات ميكانيكي طوارئ',
                    queryEn: 'auto electrician car mechanic'
                }
            ],

            switchSection(sectionId) {
                this.activeSection = sectionId;
                ['gps', 'official', 'personal'].forEach(sec => {
                    const secEl = document.getElementById(`emergencySection-${sec}`);
                    const btnEl = document.getElementById(`emergencyTabBtn-${sec}`);
                    if (secEl) {
                        if (sec === sectionId) secEl.classList.remove('hidden');
                        else secEl.classList.add('hidden');
                    }
                    if (btnEl) {
                        if (sec === sectionId) {
                            btnEl.className = 'flex-1 py-2 rounded-xl transition-all cursor-pointer bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs text-center flex items-center justify-center gap-1.5 font-black';
                        } else {
                            btnEl.className = 'flex-1 py-2 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-center flex items-center justify-center gap-1.5 font-bold';
                        }
                    }
                });

                if (sectionId === 'official') this.renderOfficialDirectory();
                if (sectionId === 'personal') this.renderPersonalContacts();
            },

            currentCoords: null,
            isLocating: false,

            safelyOpenUrl(url) {
                try {
                    const win = window.open(url, '_blank');
                    if (!win || win.closed || typeof win.closed === 'undefined') {
                        window.location.href = url;
                    }
                } catch(e) {
                    window.location.href = url;
                }
            },

            requestGpsLocation(isManual = false, callback = null) {
                const isEn = appState.lang === 'en';
                const iconBox = document.getElementById('emergencyGpsIconBox');
                const titleEl = document.getElementById('emergencyGpsTitle');
                const badgeEl = document.getElementById('emergencyGpsBadge');
                const descEl = document.getElementById('emergencyGpsDesc');
                const actionBtn = document.getElementById('emergencyGpsActionBtn');
                const btnText = document.getElementById('emergencyGpsActionBtnText');
                const viewBtn = document.getElementById('emergencyGpsViewBtn');

                if (this.isLocating) return;

                if (!('geolocation' in navigator)) {
                    if (titleEl) titleEl.innerText = isEn ? 'GPS Not Supported' : 'تحديد الموقع غير مدعوم';
                    if (badgeEl) {
                        badgeEl.innerText = isEn ? 'Unavailable' : 'غير متاح';
                        badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300';
                    }
                    if (descEl) descEl.innerText = isEn ? 'Your browser or device does not support geolocation. You can still search directly.' : 'جهازك أو متصفحك لا يدعم سحب الموقع الجغرافي، ولكن يمكنك النقر على أي خدمة أدناه للبحث مباشرة.';
                    if (callback) callback(null);
                    return;
                }

                this.isLocating = true;
                if (iconBox) iconBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sky-500"></i>';
                if (titleEl) titleEl.innerText = isEn ? 'Locating via GPS Satellite...' : 'جاري البحث عن الأقمار الصناعية وسحب موقعك... 🛰️';
                if (badgeEl) {
                    badgeEl.innerText = isEn ? 'Locating...' : 'جاري التحديد...';
                    badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 animate-pulse';
                }
                if (descEl) descEl.innerText = isEn ? 'Please grant location permission if prompted by your phone or browser.' : 'يرجى الموافقة على إذن الوصول للموقع (GPS) إذا ظهر لك في الهاتف.';
                if (btnText) btnText.innerText = isEn ? 'Locating...' : 'جاري التحديد...';
                if (actionBtn) actionBtn.classList.add('opacity-70', 'pointer-events-none');

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        this.isLocating = false;
                        this.currentCoords = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            accuracy: pos.coords.accuracy
                        };
                        
                        if (iconBox) iconBox.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-500"></i>';
                        if (titleEl) titleEl.innerText = isEn ? 'Location Successfully Identified 📍' : 'تم تحديد موقعك بدقة بنجاح 📍';
                        if (badgeEl) {
                            badgeEl.innerText = `${this.currentCoords.lat.toFixed(3)}, ${this.currentCoords.lng.toFixed(3)}`;
                            badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300';
                        }
                        if (descEl) descEl.innerText = isEn ? 'Location ready! Clicking any service below will target nearby spots around you.' : 'موقعك جاهز ومربوط! بالنقر على أي خدمة أدناه سيتم توجيهك لأقرب الأماكن في محيطك فوراً.';
                        if (btnText) btnText.innerText = isEn ? 'تحديث الـ GPS 🔄' : 'تحديث الـ GPS 🔄';
                        if (actionBtn) actionBtn.classList.remove('opacity-70', 'pointer-events-none');
                        if (viewBtn) viewBtn.classList.remove('hidden');

                        if (callback) callback(this.currentCoords);
                        if (isManual && typeof showNotification === 'function') {
                            showNotification(isEn ? 'Location determined successfully! 📍' : 'تم تحديد موقعك بدقة بنجاح عبر الأقمار الصناعية! 📍', 'success');
                        }
                    },
                    (err) => {
                        this.isLocating = false;
                        console.warn('[MotorCare GPS] Geolocation error:', err.message);
                        
                        if (iconBox) iconBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-500"></i>';
                        if (titleEl) titleEl.innerText = isEn ? 'GPS Location Standby / Off' : 'تحديد الموقع التلقائي (في وضع الانتظار)';
                        if (badgeEl) {
                            badgeEl.innerText = isEn ? 'Standby' : 'انتظار الإذن';
                            badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300';
                        }
                        if (descEl) descEl.innerText = isEn ? 'Ensure GPS is ON in settings. You can still click any service to search Google Maps directly.' : 'تأكد من تفعيل الـ GPS في الهاتف وإعطاء الإذن. يمكنك النقر على أي خدمة للبحث المباشر بخرائط جوجل.';
                        if (btnText) btnText.innerText = isEn ? 'تحديد موقعي الآن 🛰️' : 'تحديد موقعي الآن 🛰️';
                        if (actionBtn) actionBtn.classList.remove('opacity-70', 'pointer-events-none');
                        
                        if (callback) callback(null);
                        if (isManual && typeof showNotification === 'function') {
                            showNotification(isEn ? 'Could not access GPS. Please check location settings.' : 'تعذر الوصول للـ GPS. تأكد من تفعيل خدمة الموقع وإعطاء الإذن للمتصفح.', 'warning');
                        }
                    },
                    { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
                );
            },

            viewCurrentLocationOnMap() {
                if (!this.currentCoords || !this.currentCoords.lat) {
                    this.requestGpsLocation(true, (coords) => {
                        if (coords) this.viewCurrentLocationOnMap();
                    });
                    return;
                }
                // رابط جوجل ماب الدقيق مع تثبيت دبوس (Pin) أحمر على موقعك الفعلي
                const url = `https://www.google.com/maps/search/?api=1&query=${this.currentCoords.lat},${this.currentCoords.lng}`;
                this.safelyOpenUrl(url);
            },

            findNearby(serviceId) {
                const isEn = appState.lang === 'en';
                const srv = this.nearbyServices.find(s => s.id === serviceId) || this.nearbyServices[0];
                const query = isEn ? srv.queryEn : srv.queryAr;

                if (typeof showNotification === 'function') {
                    showNotification(isEn ? `Opening Google Maps for nearest ${query}...` : `جاري فتح خرائط جوجل لأقرب ${srv.queryAr}... 🗺️`, 'info');
                }

                if (this.currentCoords && this.currentCoords.lat) {
                    // البحث القياسي المعتمد في خرائط جوجل بحسب إحداثيات موقعك الحي
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&center=${this.currentCoords.lat},${this.currentCoords.lng}`;
                    this.safelyOpenUrl(url);
                } else {
                    // البحث عن الخدمة الأقرب في محيط المستخدم مباشرة
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + (isEn ? ' near me' : ' بالقرب مني'))}`;
                    this.safelyOpenUrl(url);
                    // تفعيل سحب الإحداثيات في الخلفية
                    this.requestGpsLocation(false);
                }
            },

            renderOfficialDirectory() {
                const container = document.getElementById('emergencyOfficialList');
                if (!container) return;
                const isEn = appState.lang === 'en';

                let html = '';
                this.officialDirectory.forEach(item => {
                    const name = isEn ? item.nameEn : item.nameAr;
                    const desc = isEn ? item.descEn : item.descAr;
                    html += `
                        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all">
                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl ${item.badgeBg} flex items-center justify-center shrink-0 text-base mt-0.5">
                                    <i class="fa-solid ${item.icon}"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between gap-1">
                                        <h5 class="text-xs font-black text-slate-900 dark:text-white">${name}</h5>
                                        <span class="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 tracking-wider">${item.number}</span>
                                    </div>
                                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">${desc}</p>
                                </div>
                            </div>
                            <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                                <a href="tel:${item.number}" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                                    <i class="fa-solid fa-phone"></i>
                                    <span>${isEn ? 'Call Now' : 'اتصال مباشر'} (${item.number})</span>
                                </a>
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = html;
            },

            getPersonalContacts() {
                try {
                    const raw = SafeStorage.getItem('motorCare_PersonalEmergencyContacts');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) return parsed;
                    }
                } catch(e) {}
                return [];
            },

            savePersonalContacts(contacts) {
                try {
                    SafeStorage.setItem('motorCare_PersonalEmergencyContacts', JSON.stringify(contacts));
                    // المزامنة السحابية الفورية لأرقام الطوارئ المفضلة مع السيرفر
                    if (typeof syncUserDataToCloud === 'function') {
                        syncUserDataToCloud('emergency_contacts_updated');
                    }
                } catch(e) {}
            },

            async pickDeviceContact() {
                const isEn = appState.lang === 'en';
                this.toggleAddContactForm(true);

                // فحص دعم Contact Picker API في متصفحات الموبايل (Chrome Android / PWA)
                if ('contacts' in navigator && 'select' in navigator.contacts) {
                    try {
                        const props = ['name', 'tel'];
                        const contacts = await navigator.contacts.select(props, { multiple: false });
                        if (contacts && contacts.length > 0) {
                            const picked = contacts[0];
                            const name = (picked.name && picked.name.length > 0) ? picked.name[0] : '';
                            let phone = (picked.tel && picked.tel.length > 0) ? picked.tel[0] : '';
                            phone = phone.replace(/[^\d+]/g, '');

                            const nameInput = document.getElementById('emergencyContactNameInput');
                            const phoneInput = document.getElementById('emergencyContactPhoneInput');
                            if (nameInput && name) nameInput.value = name;
                            if (phoneInput && phone) phoneInput.value = phone;

                            if (typeof showNotification === 'function') {
                                showNotification(isEn ? 'Contact imported successfully! 📱' : `تم سحب جهة الاتصال (${name || phone}) من هاتفك بنجاح! 📱`, 'success');
                            }
                        }
                    } catch (err) {
                        console.log('[MotorCare] Contact picker dismissed or error:', err);
                    }
                } else {
                    // بديل متوافق للأجهزة التي لا تدعم Contact Picker API (اختيار ملف .vcf أو إدخال يدوي)
                    const vcfInput = document.getElementById('emergencyVcfFileInput');
                    if (vcfInput) {
                        if (typeof showNotification === 'function') {
                            showNotification(isEn ? 'Opening contact card (.vcf) picker...' : 'سحب جهات الاتصال التلقائي يعمل في متصفح كروم وتطبيق الهاتف، يمكنك اختيار كارت جهة الاتصال (.vcf) أو إدخاله يدوياً 📇', 'info');
                        }
                        vcfInput.click();
                    } else if (typeof showNotification === 'function') {
                        showNotification(isEn ? 'Direct contact access is available on Mobile Chrome / Android PWA.' : 'ميزة سحب جهات الاتصال المباشرة مدعومة على متصفح كروم بالهاتف وتطبيق PWA.', 'info');
                    }
                }
            },

            handleVcfImport(event) {
                const file = event.target.files && event.target.files[0];
                if (!file) return;
                const isEn = appState.lang === 'en';
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target.result;
                    let name = '';
                    let phone = '';
                    const lines = text.split(/\r\n|\r|\n/);
                    for (const line of lines) {
                        if (line.toUpperCase().startsWith('FN:') || line.toUpperCase().startsWith('FN;')) {
                            name = line.substring(line.indexOf(':') + 1).trim();
                        } else if (line.toUpperCase().startsWith('TEL') && line.includes(':')) {
                            phone = line.substring(line.indexOf(':') + 1).trim();
                        }
                    }
                    if (name || phone) {
                        this.toggleAddContactForm(true);
                        const nameInput = document.getElementById('emergencyContactNameInput');
                        const phoneInput = document.getElementById('emergencyContactPhoneInput');
                        if (nameInput && name) nameInput.value = name;
                        if (phoneInput && phone) phoneInput.value = phone.replace(/[^\d+]/g, '');
                        if (typeof showNotification === 'function') {
                            showNotification(isEn ? 'Contact card imported successfully! 📇' : `تم استيراد جهة الاتصال (${name || phone}) من الكارت بنجاح! 📇`, 'success');
                        }
                    }
                };
                reader.readAsText(file);
                event.target.value = '';
            },

            toggleAddContactForm(show = null) {
                const form = document.getElementById('emergencyAddContactForm');
                const btnText = document.getElementById('btnToggleAddContactText');
                if (!form) return;
                const isCurrentlyHidden = form.classList.contains('hidden');
                const shouldShow = (show === null) ? isCurrentlyHidden : show;

                if (shouldShow) {
                    form.classList.remove('hidden');
                    if (btnText) btnText.innerText = 'إغلاق النموذج ✕';
                    const nameInput = document.getElementById('emergencyContactNameInput');
                    if (nameInput) nameInput.focus();
                } else {
                    form.classList.add('hidden');
                    if (btnText) btnText.innerText = 'إضافة رقم ➕';
                }
            },

            handleSaveContactSubmit() {
                const nameInput = document.getElementById('emergencyContactNameInput');
                const phoneInput = document.getElementById('emergencyContactPhoneInput');
                const roleSelect = document.getElementById('emergencyContactRoleSelect');
                const notesInput = document.getElementById('emergencyContactNotesInput');

                const rawName = nameInput ? nameInput.value : '';
                const rawPhone = phoneInput ? phoneInput.value : '';
                const name = MotorCareSecurity.sanitizeText(rawName, 80);
                const phone = MotorCareSecurity.sanitizeText(rawPhone, 30);
                const role = MotorCareSecurity.sanitizeText(roleSelect ? roleSelect.value : 'ميكانيكي خاص', 50);
                const notes = MotorCareSecurity.sanitizeText(notesInput ? notesInput.value : '', 150);

                if (!name || !phone) {
                    if (typeof showNotification === 'function') {
                        showNotification(appState.lang === 'en' ? 'Please enter contact name and phone number.' : 'يرجى إدخال اسم جهة الخدمة ورقم الهاتف.', 'warning');
                    }
                    return;
                }

                const contacts = this.getPersonalContacts();
                contacts.unshift({
                    id: 'EC_' + Date.now(),
                    name,
                    phone,
                    role,
                    notes,
                    createdAt: new Date().toISOString()
                });

                this.savePersonalContacts(contacts);
                this.toggleAddContactForm(false);
                if (nameInput) nameInput.value = '';
                if (phoneInput) phoneInput.value = '';
                if (notesInput) notesInput.value = '';
                this.renderPersonalContacts();

                if (typeof showNotification === 'function') {
                    showNotification(appState.lang === 'en' ? 'Emergency contact saved successfully! 📞' : 'تم حفظ جهة الاتصال في دفتر الطوارئ بنجاح! 📞', 'success');
                }
            },

            deletePersonalContact(contactId) {
                const isEn = appState.lang === 'en';
                const msg = isEn ? 'Are you sure you want to remove this contact from your emergency notebook?' : 'هل أنت متأكد من رغبتك في حذف هذا الرقم من دفتر الطوارئ؟';
                if (typeof showCustomConfirm === 'function') {
                    showCustomConfirm(msg, () => {
                        let contacts = this.getPersonalContacts();
                        contacts = contacts.filter(c => c.id !== contactId);
                        this.savePersonalContacts(contacts);
                        this.renderPersonalContacts();
                        if (typeof showNotification === 'function') {
                            showNotification(isEn ? 'Contact removed.' : 'تم حذف الرقم بنجاح.', 'info');
                        }
                    });
                } else if (confirm(msg)) {
                    let contacts = this.getPersonalContacts();
                    contacts = contacts.filter(c => c.id !== contactId);
                    this.savePersonalContacts(contacts);
                    this.renderPersonalContacts();
                    if (typeof showNotification === 'function') {
                        showNotification(isEn ? 'Contact removed.' : 'تم حذف الرقم بنجاح.', 'info');
                    }
                }
            },

            renderPersonalContacts() {
                const container = document.getElementById('emergencyPersonalList');
                if (!container) return;
                const isEn = appState.lang === 'en';
                const contacts = this.getPersonalContacts();

                if (contacts.length === 0) {
                    container.innerHTML = `
                        <div class="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                            <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto text-xl">
                                <i class="fa-solid fa-address-book"></i>
                            </div>
                            <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200">${isEn ? 'No Personal Emergency Numbers Saved Yet' : 'لم تقم بحفظ أي أرقام طوارئ خاصة بعد'}</h5>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                                ${isEn 
                                    ? 'Add your trusted mechanic, personal towing truck, or auto electrician numbers to have them ready with one tap whenever needed.' 
                                    : 'أضف أرقام الميكانيكي الخاص بك، ونش تثق به، أو كهربائي سيارتك ليكونوا دائماً بضغطة زر واحدة عند حدوث أي طارئ على الطريق.'}
                            </p>
                            <div class="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
                                <button type="button" onclick="MotorCareEmergency.pickDeviceContact()" class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs inline-flex items-center gap-1.5 active:scale-95">
                                    <i class="fa-solid fa-address-book"></i>
                                    <span>${isEn ? 'Import From Phone 📱' : 'سحب من الهاتف 📱'}</span>
                                </button>
                                <button type="button" onclick="MotorCareEmergency.toggleAddContactForm(true)" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs inline-flex items-center gap-1.5 active:scale-95">
                                    <i class="fa-solid fa-plus"></i>
                                    <span>${isEn ? 'Manual Entry ✍️' : 'إدخال يدوي ✍️'}</span>
                                </button>
                            </div>
                        </div>
                    `;
                    return;
                }

                let html = '';
                contacts.forEach(c => {
                    const safeName = MotorCareSecurity.escapeHtml(c.name || '');
                    const safeRole = MotorCareSecurity.escapeHtml(c.role || '');
                    const safePhone = MotorCareSecurity.escapeHtml(c.phone || '');
                    const safeNotes = MotorCareSecurity.escapeHtml(c.notes || '');
                    const cleanTel = (c.phone || '').replace(/[^\d+]/g, '');

                    html += `
                        <div class="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shadow-2xs hover:border-indigo-500/50 transition-all">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 text-sm">
                                    <i class="fa-solid fa-wrench"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h5 class="text-xs font-black text-slate-900 dark:text-white">${safeName}</h5>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">${safeRole}</span>
                                    </div>
                                    <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                        <span class="font-mono">${safePhone}</span>
                                        ${safeNotes ? `<span class="text-slate-400 text-[10px] truncate max-w-[200px]">• ${safeNotes}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <a href="tel:${cleanTel}" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs" title="${isEn ? 'Call directly' : 'اتصال مباشر'}">
                                    <i class="fa-solid fa-phone text-[10px]"></i>
                                    <span>${isEn ? 'Call' : 'اتصال'}</span>
                                </a>
                                <button type="button" onclick="MotorCareEmergency.deletePersonalContact('${c.id}')" class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors" title="${isEn ? 'Delete contact' : 'حذف الرقم'}">
                                    <i class="fa-solid fa-trash-can text-xs"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = html;
            }
        };

        function openEmergencyModal() {
            const modal = document.getElementById('emergencyModal');
            if (!modal) return;
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            MotorCareEmergency.switchSection('gps');
            // استدعاء فوري وسلس للـ GPS في الخلفية ليكون جاهزاً فور نقر أي زر
            if (typeof MotorCareEmergency !== 'undefined' && MotorCareEmergency.requestGpsLocation) {
                MotorCareEmergency.requestGpsLocation(false);
            }
        }

        function closeEmergencyModal() {
            const modal = document.getElementById('emergencyModal');
            if (!modal) return;
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof MotorCareEmergency !== 'undefined') window.MotorCareEmergency = MotorCareEmergency; } catch (e) {}
try { if (typeof openEmergencyModal !== 'undefined') window.openEmergencyModal = openEmergencyModal; } catch (e) {}
try { if (typeof closeEmergencyModal !== 'undefined') window.closeEmergencyModal = closeEmergencyModal; } catch (e) {}
