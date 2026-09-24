        /* ==========================================================================
           [MODULE 10] الرخص والوثائق الرسمية
           ========================================================================== */
        function openDocumentsModal() {
            const car = getCurrentCar();
            if (!car) { openAddNewCarModal(); return; }
            const d = car.documents || {};
            document.getElementById('inputVehicleLicenseDate').value = d.vehicleLicense || '';
            document.getElementById('inputDrivingLicenseDate').value = d.drivingLicense || '';
            document.getElementById('inputInspectionDate').value = d.inspection || '';
            
            document.getElementById('inputInsuranceDate').value = d.insuranceDate || '';
            document.getElementById('inputInsuranceCompany').value = d.insuranceCompany || '';
            document.getElementById('inputInsuranceType').value = d.insuranceType || 'شامل';
            
            const notesInput = document.getElementById('inputInspectionNotes');
            if (notesInput) notesInput.value = d.inspectionNotes || '';
            
            document.getElementById('documentsModal').classList.remove('hidden');
            document.getElementById('documentsModal').style.display = 'flex';
        }

        function closeDocumentsModal() {
            const modal = document.getElementById('documentsModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function saveDocumentsSettings() {
            const car = getCurrentCar();
            car.documents = {
                vehicleLicense: document.getElementById('inputVehicleLicenseDate').value,
                drivingLicense: document.getElementById('inputDrivingLicenseDate').value,
                inspection: document.getElementById('inputInspectionDate').value,
                insuranceDate: document.getElementById('inputInsuranceDate').value,
                insuranceCompany: document.getElementById('inputInsuranceCompany').value.trim(),
                insuranceType: document.getElementById('inputInsuranceType').value,
                inspectionNotes: document.getElementById('inputInspectionNotes').value.trim(),
                doc_vehicle: tempImages['doc_vehicle'] || (car.documents ? car.documents.doc_vehicle : ''),
                doc_driver: tempImages['doc_driver'] || (car.documents ? car.documents.doc_driver : ''),
                doc_insp: tempImages['doc_insp'] || (car.documents ? car.documents.doc_insp : ''),
                doc_insurance: tempImages['doc_insurance'] || (car.documents ? car.documents.doc_insurance : '')
            };
            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            closeDocumentsModal();
            renderDashboard();
        }

        function renderDocumentsGrid() {
            const car = getCurrentCar();
            const grid = document.getElementById('documentsCardsGrid');
            if (!grid) return;
            const d = car.documents || {};
            const isEn = appState.lang === 'en';

            let insTypeStr = d.insuranceType || 'شامل';
            if (isEn) {
                if (insTypeStr === 'شامل') insTypeStr = 'Comprehensive';
                else if (insTypeStr === 'إجباري') insTypeStr = 'Mandatory';
                else if (insTypeStr === 'ضد الغير') insTypeStr = 'Third-Party';
            }

            const docs = [
                { name: isEn ? 'Vehicle License' : 'رخصة السيارة', date: d.vehicleLicense, img: d.doc_vehicle, extra: '' },
                { name: isEn ? 'Driver License' : 'رخصة القيادة', date: d.drivingLicense, img: d.doc_driver, extra: '' },
                { name: isEn ? 'Technical Inspection' : 'الفحص الفني', date: d.inspection, img: d.doc_insp, extra: '' },
                { name: isEn ? `Insurance Policy (${insTypeStr})` : `وثيقة التأمين (${insTypeStr})`, date: d.insuranceDate, img: d.doc_insurance, extra: d.insuranceCompany ? (isEn ? `Company: ${d.insuranceCompany}` : `شركة: ${d.insuranceCompany}`) : '' }
            ];

            const notSetTxt = isEn ? 'Not Set' : 'غير محدد';
            const noImgTxt = isEn ? 'No Document Attached' : 'بدون صورة';
            const viewTxt = isEn ? 'View Document' : 'عرض المستند';

            grid.innerHTML = '';
            docs.forEach(item => {
                grid.innerHTML += `
                    <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 flex flex-col justify-between">
                        <div>
                            <span class="text-slate-400 block">${item.name}:</span>
                            <strong class="text-sm text-slate-800 dark:text-slate-100 block">${item.date || notSetTxt}</strong>
                            ${item.extra ? `<span class="text-[11px] text-sky-600 dark:text-sky-400 block font-semibold">${item.extra}</span>` : ''}
                        </div>
                        <div>
                            ${item.img ? `<button onclick="openImageViewer('${item.img}')" class="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"><i class="fa-solid fa-image ml-1"></i> ${viewTxt}</button>` : `<span class="text-[11px] text-slate-400">${noImgTxt}</span>`}
                        </div>
                    </div>
                `;
            });
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof saveDocumentsSettings !== 'undefined') window.saveDocumentsSettings = saveDocumentsSettings; } catch (e) {}
try { if (typeof openDocumentsModal !== 'undefined') window.openDocumentsModal = openDocumentsModal; } catch (e) {}
try { if (typeof closeDocumentsModal !== 'undefined') window.closeDocumentsModal = closeDocumentsModal; } catch (e) {}
try { if (typeof renderDocumentsGrid !== 'undefined') window.renderDocumentsGrid = renderDocumentsGrid; } catch (e) {}
try { if (typeof downloadCurrentDocumentImage !== 'undefined') window.downloadCurrentDocumentImage = downloadCurrentDocumentImage; } catch (e) {}
try { if (typeof shareCurrentDocumentImage !== 'undefined') window.shareCurrentDocumentImage = shareCurrentDocumentImage; } catch (e) {}
try { if (typeof openImageViewer !== 'undefined') window.openImageViewer = openImageViewer; } catch (e) {}
try { if (typeof closeImageViewer !== 'undefined') window.closeImageViewer = closeImageViewer; } catch (e) {}
