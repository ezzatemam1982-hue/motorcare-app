const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const search = ['fuelModal', 'serviceCentersModal', 'contactCommunityModal', 'documentsModal', 'trafficFinesModal', 'emergencyModal', 'editProfileModal', 'forgotPasswordModal', 'locationCorrectionModal'];
const lines = content.split('\n');

search.forEach(s => {
  lines.forEach((l, i) => {
    if (l.includes('id="' + s + '"')) {
      for (let j = 0; j < 60; j++) {
        if (lines[i+j] && lines[i+j].toLowerCase().includes('close')) {
          console.log(s, '=> line', (i+j+1), lines[i+j].trim());
        }
      }
    }
  });
});
