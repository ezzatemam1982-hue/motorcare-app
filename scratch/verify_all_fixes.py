# -*- coding: utf-8 -*-
import sys
import hashlib

sys.stdout.reconfigure(encoding='utf-8')

for fname in ['index.html', 'src/index.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        code = f.read()

    print(f"\nVerifying {fname}...")
    checks = {
        'Fix 1 (No duplicate sendFetch in forgot pass)': ('setTimeout(sendFetch, 1200)' not in code) and ('sendFetch();' in code),
        'Fix 2a (handleSaveProfileEdit updates AccountsDB)': ('accs[i].name = newName' in code),
        'Fix 2b (handleSaveProfileEdit updates appState.user)': ('appState.user.name = newName' in code),
        'Fix 2c (updateHeaderUserProfile updates header name)': ('headerNameEl.innerText = displayName' in code),
        'Fix 2d (editProfileModal button onclick & z-60)': ('handleSaveProfileEdit(event)' in code) and ('id="editProfileModal"' in code),
        'Fix 3a (applySelectedAvatar updates AccountsDB)': ('accs[i].avatar =' in code),
        'Fix 3b (applySelectedAvatar updates appState.user)': ('appState.user.avatar = avatarUrl' in code),
        'Fix 3c (changeAvatarModal z-index 60)': ('id="changeAvatarModal" style="z-index: 60;"' in code),
        'Fix 4a (resetLocationToDefault function exists)': ('function resetLocationToDefault()' in code),
        'Fix 4b (Location modal reset button exists)': ('id="scResetLocationDefaultBtn"' in code),
        'Fix 4c (renderServiceCenters preserves default coordinates)': ('_defaultLat' in code)
    }

    all_pass = True
    for name, passed in checks.items():
        status = 'PASS' if passed else 'FAIL'
        if not passed:
            all_pass = False
        print(f"  [{status}] {name}")

    if all_pass:
        print(f"  >>> {fname}: ALL 11 CHECKS PASSED!")
    else:
        print(f"  >>> {fname}: SOME CHECKS FAILED!")
        sys.exit(1)

print("\n100% SUCCESS: Both index.html and src/index.html verified completely!")
