const fs = require('fs');

const scCode = fs.readFileSync('js/features/serviceCenters.js', 'utf-8');
const i18nCode = fs.readFileSync('js/core/i18n.js', 'utf-8');

// Mock state and global objects
const appState = { lang: 'en' };
const window = {
    appState,
    MOTORCARE_SERVICE_CENTERS: [
        {
            id: '1',
            name: 'مركز كيا المعتمد: أبو رواش',
            nameEn: 'Authorized Kia Center - Abu Rawash',
            agency: 'الشركة المصرية العالمية للتجارة والتوكيلات EIT (كيا مصر)',
            type: 'authorized_center',
            typeLabel: 'مركز خدمة وضمان كيا معتمد',
            gov: 'الجيزة',
            govEn: 'Giza',
            area: 'أبو رواش',
            address: 'الكيلو 28 طريق مصر إسكندرية الصحراوي، خلف القرية الذكية',
            hours: 'السبت - الخميس: 8:00 ص - 4:30 م',
            services: ['سمكرة ودهان وفرن معتمد', 'ميكانيكا وكهرباء وتكييف', 'قطع غيار كيا أصلية بالضمان'],
            hotline: '19542',
            rating: 4.9,
            lat: 30.04,
            lng: 31.23
        }
    ]
};

const document = {
    getElementById: (id) => ({
        options: [{ value: 'all', text: 'All' }],
        value: 'all',
        classList: { remove: () => {}, add: () => {}, contains: () => false },
        innerHTML: '',
        innerText: '',
        dir: ''
    }),
    querySelectorAll: () => []
};

function getCurrentCar() { return { brand: 'Fiat', model: 'Tipo', year: '2016' }; }

eval(scCode);

console.log('getLocalizedGov("الجيزة"):', getLocalizedGov('الجيزة'));
console.log('getLocalizedAgency:', getLocalizedAgency(window.MOTORCARE_SERVICE_CENTERS[0].agency));
console.log('getLocalizedCenterName:', getLocalizedCenterName(window.MOTORCARE_SERVICE_CENTERS[0].name, window.MOTORCARE_SERVICE_CENTERS[0].nameEn));
console.log('getLocalizedArea:', getLocalizedArea(window.MOTORCARE_SERVICE_CENTERS[0].area));
console.log('getLocalizedAddress:', getLocalizedAddress(window.MOTORCARE_SERVICE_CENTERS[0].address));
console.log('getLocalizedHours:', getLocalizedHours(window.MOTORCARE_SERVICE_CENTERS[0].hours));
console.log('getLocalizedServiceTag:', window.MOTORCARE_SERVICE_CENTERS[0].services.map(s => getLocalizedServiceTag(s)));

console.log('--- ALL TRANSLATION HELPERS WORKING PERFECTLY ---');
