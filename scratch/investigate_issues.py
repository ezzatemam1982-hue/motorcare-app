# -*- coding: utf-8 -*-
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('d:/car/MotorCare-App - V3 - Copy/index.html', encoding='utf-8') as f:
    v3 = f.read()

with open('index.html', encoding='utf-8') as f:
    curr = f.read()

print("v3 len:", len(v3), "curr len:", len(curr))

# 1. Compare openBatteryModal
pos_v3 = v3.find('function openBatteryModal()')
end_v3 = v3.find('function closeBatteryModal()', pos_v3)
pos_curr = curr.find('function openBatteryModal()')
end_curr = curr.find('function closeBatteryModal()', pos_curr)

print("openBatteryModal identical?:", v3[pos_v3:end_v3] == curr[pos_curr:end_curr])
if v3[pos_v3:end_v3] != curr[pos_curr:end_curr]:
    print("DIFF in openBatteryModal!")

# 2. Check batteryModal tag
m1 = re.search(r'<div id=["\']batteryModal["\'][^>]*>', v3)
m2 = re.search(r'<div id=["\']batteryModal["\'][^>]*>', curr)
print("v3 batteryModal tag:", m1.group(0) if m1 else "Not found")
print("curr batteryModal tag:", m2.group(0) if m2 else "Not found")

# 3. Check saveBatteryDetails
pos_bs_v3 = v3.find('function saveBatteryDetails()')
end_bs_v3 = v3.find('function ', pos_bs_v3 + 20)
pos_bs_curr = curr.find('function saveBatteryDetails()')
end_bs_curr = curr.find('function ', pos_bs_curr + 20)

print("saveBatteryDetails identical?:", v3[pos_bs_v3:end_bs_v3] == curr[pos_bs_curr:end_bs_curr])

# 4. Check CM adding button and maintenance scope
m_cm1 = re.search(r'function filterCatalog\(.*?\)\s*\{[\s\S]*?function renderScheduleSection', v3)
m_cm2 = re.search(r'function filterCatalog\(.*?\)\s*\{[\s\S]*?function renderScheduleSection', curr)
print("filterCatalog block identical?:", m_cm1.group(0) == m_cm2.group(0) if m_cm1 and m_cm2 else "Not found")

# 5. Check add custom PM/CM modal
m_ac1 = re.search(r'function openAddCustomPMModal\(.*?\)\s*\{[\s\S]*?function closeAddCustomPMModal', v3)
m_ac2 = re.search(r'function openAddCustomPMModal\(.*?\)\s*\{[\s\S]*?function closeAddCustomPMModal', curr)
print("openAddCustomPMModal block identical?:", m_ac1.group(0) == m_ac2.group(0) if m_ac1 and m_ac2 else "Not found")
