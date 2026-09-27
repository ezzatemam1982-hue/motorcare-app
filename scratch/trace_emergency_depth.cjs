const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

// Find all modals between line 3300 and 4200
let insideEmergency = false;
let depth = 0;

for (let i = 3305; i < 4100; i++) {
    const line = lines[i];
    if (line.includes('id="emergencyModal"')) {
        insideEmergency = true;
        depth = 0;
        console.log(`Line ${i + 1}: emergencyModal START`);
    }
    
    if (insideEmergency) {
        // Count open and close div tags
        const opens = (line.match(/<div(\s|>)/gi) || []).length;
        const closes = (line.match(/<\/div>/gi) || []).length;
        depth += (opens - closes);
        
        if (line.includes('id="customReportExportModal"')) {
            console.log(`Line ${i + 1}: customReportExportModal reached, emergency depth = ${depth}`);
        }
        if (line.includes('id="obdEncyclopediaModal"')) {
            console.log(`Line ${i + 1}: obdEncyclopediaModal reached, emergency depth = ${depth}`);
        }
        if (line.includes('id="driverToolsModal"')) {
            console.log(`Line ${i + 1}: driverToolsModal reached, emergency depth = ${depth}`);
        }
        
        if (depth <= 0) {
            console.log(`Line ${i + 1}: emergencyModal CLOSED!`);
            insideEmergency = false;
        }
    }
}
