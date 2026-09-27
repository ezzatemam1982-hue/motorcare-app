const fs = require('fs');
const path = require('path');

console.log('--- Testing Analytics Date Range Picker & Financial Filter Upgrade ---');

// Mock browser environment
const domElements = {};
function createMockElement(id, initialProps = {}) {
    return {
        id,
        value: initialProps.value || '',
        innerText: '',
        innerHTML: '',
        classList: {
            classes: new Set(initialProps.classes || []),
            add(...c) { c.forEach(x => this.classes.add(x)); },
            remove(...c) { c.forEach(x => this.classes.delete(x)); },
            contains(x) { return this.classes.has(x); }
        },
        getContext: () => ({
            clearRect: () => {},
            fillRect: () => {}
        })
    };
}

const mockIds = [
    'analyticsQuickBtnCurrent',
    'analyticsQuickBtnAll',
    'analyticsQuickBtnRange',
    'analyticsQuickBtnCustomDate',
    'analyticsSingleYearBox',
    'analyticsRangeYearBox',
    'analyticsCustomDateBox',
    'analyticsYearInput',
    'analyticsFromYearInput',
    'analyticsToYearInput',
    'analyticsFromDate',
    'analyticsToDate',
    'analyticsKpiTotalCost',
    'analyticsKpiMaintCost',
    'analyticsKpiFuelCost',
    'analyticsKpiCount',
    'costBreakdownChart',
    'monthlyCostChart'
];

mockIds.forEach(id => {
    domElements[id] = createMockElement(id);
});

global.document = {
    getElementById: (id) => domElements[id] || null
};
global.window = {
    Chart: function MockChart(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.destroy = () => {};
    }
};
global.Chart = global.window.Chart;
global.currentActiveTab = 'analytics';
global.appState = {
    darkMode: false,
    lang: 'ar'
};

const sampleCar = {
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    history: [
        { date: '2025-12-15', partsCost: 1000, laborCost: 200, totalCost: 1200 },
        { date: '2026-01-10', partsCost: 500, laborCost: 150, totalCost: 650 },
        { date: '2026-02-20', partsCost: 800, laborCost: 250, totalCost: 1050 },
        { date: '2026-03-05', partsCost: 300, laborCost: 100, totalCost: 400 }
    ],
    fuelLogs: [
        { date: '2025-11-20', cost: 600, liters: 40 },
        { date: '2026-01-15', cost: 700, liters: 45 },
        { date: '2026-02-25', cost: 750, liters: 48 },
        { date: '2026-03-12', cost: 800, liters: 50 }
    ]
};
global.getCurrentCar = () => sampleCar;

// Load analytics.js code
const analyticsJs = fs.readFileSync(path.join(__dirname, '../js/features/analytics.js'), 'utf8');
eval(analyticsJs);

// Test 1: Quick mode switches
console.log('Testing setAnalyticsFilterQuick:');
setAnalyticsFilterQuick('current');
if (window.analyticsFilterMode !== 'current') throw new Error('Failed to set current mode');
if (domElements['analyticsSingleYearBox'].classList.contains('hidden')) throw new Error('singleYearBox should not be hidden in current mode');
if (!domElements['analyticsCustomDateBox'].classList.contains('hidden')) throw new Error('customDateBox should be hidden in current mode');
console.log('  PASS: Mode "current" correctly toggled.');

setAnalyticsFilterQuick('range');
if (window.analyticsFilterMode !== 'range') throw new Error('Failed to set range mode');
if (domElements['analyticsRangeYearBox'].classList.contains('hidden')) throw new Error('rangeYearBox should not be hidden in range mode');
console.log('  PASS: Mode "range" correctly toggled.');

setAnalyticsFilterQuick('customDate');
if (window.analyticsFilterMode !== 'customDate') throw new Error('Failed to set customDate mode');
if (domElements['analyticsCustomDateBox'].classList.contains('hidden')) throw new Error('customDateBox should be visible in customDate mode');
if (!domElements['analyticsFromDate'].value || !domElements['analyticsToDate'].value) throw new Error('Default dates should be set');
console.log('  PASS: Mode "customDate" correctly toggled with default date boundaries.');

// Test 2: Custom Date Range Filtering with Timestamp Comparison
console.log('Testing custom date filtering (2026-01-01 to 2026-02-28):');
domElements['analyticsFromDate'].value = '2026-01-01';
domElements['analyticsToDate'].value = '2026-02-28';
onAnalyticsDateInputChange();

// Expected in Jan-Feb 2026:
// History: Jan 10 (650), Feb 20 (1050) -> parts = 1300, labor = 400, maint = 1700
// Fuel: Jan 15 (700), Feb 25 (750) -> fuel = 1450
// Total = 3150, Count = 4
console.log('  KPI Total Cost text:', domElements['analyticsKpiTotalCost'].innerText);
console.log('  KPI Maint Cost text:', domElements['analyticsKpiMaintCost'].innerText);
console.log('  KPI Fuel Cost text:', domElements['analyticsKpiFuelCost'].innerText);
console.log('  KPI Invoices Count text:', domElements['analyticsKpiCount'].innerText);

if (!domElements['analyticsKpiTotalCost'].innerText.includes('3,150')) {
    throw new Error(`Expected 3,150 in total cost, got: ${domElements['analyticsKpiTotalCost'].innerText}`);
}
if (!domElements['analyticsKpiMaintCost'].innerText.includes('1,700')) {
    throw new Error(`Expected 1,700 in maint cost, got: ${domElements['analyticsKpiMaintCost'].innerText}`);
}
if (!domElements['analyticsKpiFuelCost'].innerText.includes('1,450')) {
    throw new Error(`Expected 1,450 in fuel cost, got: ${domElements['analyticsKpiFuelCost'].innerText}`);
}
if (!domElements['analyticsKpiCount'].innerText.includes('4')) {
    throw new Error(`Expected 4 operations in KPI count, got: ${domElements['analyticsKpiCount'].innerText}`);
}
console.log('  PASS: Exact date range timestamp comparison correctly filtered expenses and updated KPIs.');

// Test 3: Change range to include March 2026 only
console.log('Testing single month range (2026-03-01 to 2026-03-31):');
domElements['analyticsFromDate'].value = '2026-03-01';
domElements['analyticsToDate'].value = '2026-03-31';
onAnalyticsDateInputChange();

// History: Mar 05 (400) -> parts 300, labor 100
// Fuel: Mar 12 (800)
// Total = 1200, Count = 2
if (!domElements['analyticsKpiTotalCost'].innerText.includes('1,200')) {
    throw new Error(`Expected 1,200 in March total cost, got: ${domElements['analyticsKpiTotalCost'].innerText}`);
}
console.log('  PASS: Single month range correctly calculated without page refresh.');

console.log('--- ALL ANALYTICS CALENDAR FILTER TESTS PASSED SUCCESSFULLY! ---');
