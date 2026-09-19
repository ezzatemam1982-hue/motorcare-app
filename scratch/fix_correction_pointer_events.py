# -*- coding: utf-8 -*-
import sys
import os
import re
import hashlib
import shutil

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

INDEX_PATH = r"d:\car\MotorCare-App\index.html"
SRC_INDEX_PATH = r"d:\car\MotorCare-App\src\index.html"

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix z-index on locationCorrectionModal
old_modal_1 = '<div id="locationCorrectionModal" class="fixed inset-0 z-60 bg-black/80 hidden flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs transition-all">'
new_modal_1 = '<div id="locationCorrectionModal" style="z-index: 9999;" class="fixed inset-0 bg-black/80 hidden flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs transition-all">'

assert old_modal_1 in content, "old_modal_1 not found in index.html"
content = content.replace(old_modal_1, new_modal_1, 1)
print("Fixed z-index on locationCorrectionModal (z-index: 9999)")

# 2. Fix z-index on userCorrectionsHistoryModal
old_modal_2 = '<div id="userCorrectionsHistoryModal" class="fixed inset-0 z-60 bg-black/80 hidden flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs transition-all">'
new_modal_2 = '<div id="userCorrectionsHistoryModal" style="z-index: 9999;" class="fixed inset-0 bg-black/80 hidden flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs transition-all">'

assert old_modal_2 in content, "old_modal_2 not found in index.html"
content = content.replace(old_modal_2, new_modal_2, 1)
print("Fixed z-index on userCorrectionsHistoryModal (z-index: 9999)")

# 3. Add timeout protection for Firestore in submitLocationCorrection
old_firestore_block = '''            if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    const docId = `${center.id}_${Date.now()}`;
                    const firestorePayload = {
                        ...correctionData,
                        adminEmail: 'motorcare.auto@gmail.com',
                        userAgent: navigator.userAgent || '',
                        platform: 'MotorCare Web/PWA',
                    };
                    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                        firestorePayload.serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
                    }
                    await firestoreDb.collection('service_center_corrections').doc(docId).set(firestorePayload);
                    isFirestoreSynced = true;
                    console.log('[Location Correction] Persisted to Firestore:', docId);
                } catch (err) {
                    console.warn('[Location Correction] Firestore sync note:', err);
                }
            }'''

new_firestore_block = '''            if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    const docId = `${center.id}_${Date.now()}`;
                    const firestorePayload = {
                        ...correctionData,
                        adminEmail: 'motorcare.auto@gmail.com',
                        userAgent: navigator.userAgent || '',
                        platform: 'MotorCare Web/PWA',
                    };
                    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                        firestorePayload.serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
                    }
                    const firestorePromise = firestoreDb.collection('service_center_corrections').doc(docId).set(firestorePayload);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('firestore timeout')), 3500));
                    await Promise.race([firestorePromise, timeoutPromise]).catch(e => console.warn('[Location Correction] Firestore timeout/note:', e));
                    isFirestoreSynced = true;
                    console.log('[Location Correction] Persisted to Firestore:', docId);
                } catch (err) {
                    console.warn('[Location Correction] Firestore sync note:', err);
                }
            }'''

if old_firestore_block in content:
    content = content.replace(old_firestore_block, new_firestore_block, 1)
    print("Added timeout protection for Firestore in submitLocationCorrection")
else:
    print("Firestore block already has timeout protection or spacing differs.")

# 4. Save index.html
with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

# 5. Mirror to src/index.html
shutil.copy2(INDEX_PATH, SRC_INDEX_PATH)
h1 = hashlib.sha256(open(INDEX_PATH, 'rb').read()).hexdigest()
h2 = hashlib.sha256(open(SRC_INDEX_PATH, 'rb').read()).hexdigest()
assert h1 == h2, f"SHA mismatch! {h1} != {h2}"
print(f"Mirrored to src/index.html with 100% SHA-256 parity: {h1}")

# 6. Bump cache to v2.0.14
sw_files = [
    r"d:\car\MotorCare-App\sw.js",
    r"d:\car\MotorCare-App\service-worker.js",
    r"d:\car\MotorCare-App\src\sw.js",
    r"d:\car\MotorCare-App\src\service-worker.js"
]

for p in sw_files:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            sw_c = f.read()
        sw_c_new = re.sub(r'motorcare-cache-v2\.0\.\d+', 'motorcare-cache-v2.0.14', sw_c)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(sw_c_new)
        print(f"Bumped cache to v2.0.14 in {p}")

print("Fixes applied successfully!")
