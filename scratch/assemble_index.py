import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html.original', 'r', encoding='utf-8', errors='ignore') as f:
    raw_lines = f.readlines()

def get_slice(start, end):
    return ''.join(raw_lines[start - 1 : end])

head_part1 = get_slice(1, 38)

head_modular_tags = """    <!-- Tailwind Custom Configuration -->
    <script src="js/config/tailwind.config.js"></script>
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- MotorCare Modular Stylesheet -->
    <link rel="stylesheet" href="css/style.css">
</head>
"""

body_markup = get_slice(2707, 6945)

trailing_modals = get_slice(27849, 27911)

script_tags = """
    <!-- ==========================================================================
         MOTORCARE MODULAR ARCHITECTURE SCRIPTS (Strict Dependency Chain)
         ========================================================================== -->
    <!-- 1. Infrastructure, Storage, Security & Cloud -->
    <script src="js/storage/storage.js"></script>
    <script src="js/security/security.js"></script>
    <script src="js/services/pwa.js"></script>
    <script src="js/services/network.js"></script>
    <script src="js/services/notifications.js"></script>
    <script src="js/services/firebase.js"></script>

    <!-- 2. Static Dictionaries, Catalogs & Brand Logos -->
    <script src="js/data/dictionary.js"></script>
    <script src="js/data/brandLogos.js"></script>
    <script src="js/data/batteryMarket.js"></script>

    <!-- 3. Core State, Internationalization & Maintenance Rules -->
    <script src="js/core/appState.js"></script>
    <script src="js/core/i18n.js"></script>
    <script src="js/core/catalogBuilder.js"></script>
    <script src="js/core/maintenanceEngine.js"></script>

    <!-- 4. Services (Authentication, Roadside SOS & Community Feedback) -->
    <script src="js/services/auth.js"></script>
    <script src="js/services/emergency.js"></script>
    <script src="js/services/feedback.js"></script>

    <!-- 5. Feature Modules -->
    <script src="js/features/dashboard.js"></script>
    <script src="js/features/maintenance.js"></script>
    <script src="js/features/fuel.js"></script>
    <script src="js/features/analytics.js"></script>
    <script src="js/features/garage.js"></script>
    <script src="js/features/documents.js"></script>
    <script src="js/features/battery.js"></script>
    <script src="js/features/serviceCenters.js"></script>
    <script src="js/features/odometer.js"></script>
    <script src="js/features/inspection.js"></script>
    <script src="js/features/obd.js"></script>
    <script src="js/features/driverTools.js"></script>
    <script src="js/features/reports.js"></script>
    <script src="js/features/admin.js"></script>

    <!-- 6. Main Bootstrap Entrypoint -->
    <script src="js/main.js"></script>
</body>
</html>
"""

new_index = head_part1 + head_modular_tags + body_markup + "\n" + trailing_modals + "\n" + script_tags

with open('index.html', 'w', encoding='utf-8') as out:
    out.write(new_index)

print(f"Generated new index.html: {len(new_index.splitlines())} lines (Original was {len(raw_lines)} lines)")
print(f"Size reduction: {len(new_index.encode('utf-8')) / 1024:.1f} KB (Original was {len(''.join(raw_lines).encode('utf-8')) / 1024:.1f} KB)")
