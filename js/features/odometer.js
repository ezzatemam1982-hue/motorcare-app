			/* ==========================================================================
		   [MODULE - Odometer Management] محرك إدارة وتحديث قراءة العداد
		   ========================================================================== */
		function openOdometerModal() {
			const car = getCurrentCar();
			if (!car) { openAddNewCarModal(); return; }
			const input = document.getElementById('newOdometerValueInput');
			const modal = document.getElementById('odometerModal');
			if (input) input.value = car.odometer;
			if (modal) {
				modal.classList.remove('hidden');
				modal.style.display = 'flex';
			}
		}

		function closeOdometerModal() {
			const modal = document.getElementById('odometerModal');
			if (modal) {
				modal.classList.add('hidden');
				modal.style.display = 'none';
			}
		}

		function submitNewOdometer() {
			try {
				const car = getCurrentCar();
				if (!car) return;
				const input = document.getElementById('newOdometerValueInput');
				if (!input) return;
				const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
				const rawVal = input.value ? input.value.trim() : '';
				if (!rawVal) {
					alert(isEn ? 'Please enter an odometer reading.' : 'يرجى إدخال قراءة العداد.');
					input.focus();
					return;
				}
				const val = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.parsePositiveInt)
					? MotorCareSecurity.parsePositiveInt(rawVal, -1, 0, 5000000)
					: parseInt(rawVal, 10);
				if (isNaN(val) || val < 0) {
					alert(isEn ? 'Please enter a valid positive odometer reading.' : 'يرجى إدخال قراءة عداد صحيحة وموجبة بدون رموز.');
					input.focus();
					return;
				}
				car.odometer = val;
				saveAppState('odometer_updated');
				closeOdometerModal();
				renderDashboard();
				if (typeof MotorCareNotifications !== 'undefined' && MotorCareNotifications.checkMaintenanceSchedules) {
					MotorCareNotifications.checkMaintenanceSchedules({ trigger: 'odometer_update' });
				}
				if (typeof showNotification === 'function') {
					showNotification(isEn ? 'Odometer updated successfully! 🚗' : 'تم تحديث قراءة العداد بنجاح! 🚗', 'success');
				}
			} catch (err) {
				console.error('[MotorCare] Error updating odometer:', err);
			}
		}

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof closeOdometerModal !== 'undefined') window.closeOdometerModal = closeOdometerModal; } catch (e) {}
try { if (typeof openOdometerModal !== 'undefined') window.openOdometerModal = openOdometerModal; } catch (e) {}
try { if (typeof submitNewOdometer !== 'undefined') window.submitNewOdometer = submitNewOdometer; } catch (e) {}
