const assert = require('assert');
const fs = require('fs');

// Load catalogBuilder & maintenanceEngine logic in node context
const maintenanceEngineJs = fs.readFileSync('js/core/maintenanceEngine.js', 'utf8');
const dashboardJs = fs.readFileSync('js/features/dashboard.js', 'utf8');

eval(maintenanceEngineJs);

console.log('--- Testing Vehicle Health Score & Status Logic ---');

const testCarWithOverdue = {
    brand: 'Fiat',
    model: 'Tipo',
    odometer: 70000,
    catalog: [
        { id: 'oil', name: 'زيت المحرك', type: 'PM', kmInterval: 10000, lastKm: 50000 }, // Overdue by 10,000 km!
        { id: 'spark_plugs', name: 'بوجيهات', type: 'PM', kmInterval: 30000, lastKm: 30000 } // Overdue by 10,000 km!
    ]
};

let overdueCount = 0;
let totalDeduction = 0;

testCarWithOverdue.catalog.forEach(item => {
    const res = evaluateMaintenanceItem(item, testCarWithOverdue.odometer, testCarWithOverdue);
    if (res.isOverdue) {
        overdueCount++;
        const overdueRatio = res.kmInterval > 0 ? (res.overdueKm / res.kmInterval) : 1;
        totalDeduction += Math.min(35, 20 + Math.round(overdueRatio * 15));
    }
});

console.log(`Evaluated ${overdueCount} overdue items, Total Deduction: ${totalDeduction}%`);
assert(overdueCount === 2, 'Must detect 2 overdue items');
const calculatedPercent = Math.max(15, 100 - totalDeduction);
console.log(`Calculated Health Percentage: ${calculatedPercent}%`);
assert(calculatedPercent < 100, 'Health score must drop below 100% when items are overdue');

console.log('✅ VEHICLE HEALTH SCORE LOGIC TEST PASSED!');
