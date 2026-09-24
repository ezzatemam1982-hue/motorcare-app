import shutil
import os

files_to_sync = [
    ('js/services/mobile.js', 'src/js/services/mobile.js'),
    ('js/services/mobile.js', 'dist/js/services/mobile.js'),
    ('css/style.css', 'src/css/style.css'),
    ('css/style.css', 'dist/css/style.css'),
    ('js/main.js', 'src/js/main.js'),
    ('js/main.js', 'dist/js/main.js'),
    ('js/features/dashboard.js', 'src/js/features/dashboard.js'),
    ('js/features/dashboard.js', 'dist/js/features/dashboard.js'),
    ('js/services/notifications.js', 'src/js/services/notifications.js'),
    ('js/services/notifications.js', 'dist/js/services/notifications.js'),
    ('js/services/auth.js', 'src/js/services/auth.js'),
    ('js/services/auth.js', 'dist/js/services/auth.js'),
    ('js/services/firebase.js', 'src/js/services/firebase.js'),
    ('js/services/firebase.js', 'dist/js/services/firebase.js'),
    ('js/features/garage.js', 'src/js/features/garage.js'),
    ('js/features/garage.js', 'dist/js/features/garage.js'),
    ('index.html', 'src/index.html'),
    ('sw.js', 'src/sw.js'),
    ('sw.js', 'dist/sw.js'),
    ('service-worker.js', 'src/service-worker.js'),
    ('service-worker.js', 'dist/service-worker.js')
]

for src, dst in files_to_sync:
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    print(f'Synced {src} -> {dst}')

print('All files synced successfully!')
