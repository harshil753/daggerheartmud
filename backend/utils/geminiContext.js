const fs = require('fs');
const path = require('path');

function loadSRDContext() {
  try {
    const srdPath = path.join(__dirname, '../../supporting_functions/Results/DH_SRD_Part_01_Pages_1-415.txt');
    return fs.readFileSync(srdPath, 'utf8');
  } catch (error) {
    console.error('Error loading SRD:', error);
    return 'Daggerheart System Reference Document not found.';
  }
}

function loadEquipmentContext() {
  try {
    const equipmentPath = path.join(__dirname, '../../supporting_functions/Results/equipment_data.json');
    const equipmentData = JSON.parse(fs.readFileSync(equipmentPath, 'utf8'));
    return JSON.stringify(equipmentData, null, 2);
  } catch (error) {
    console.error('Error loading equipment data:', error);
    return 'Equipment database not found.';
  }
}

function getFullContext() {
  const srd = loadSRDContext();
  const equipment = loadEquipmentContext();
  
  return {
    srd,
    equipment,
    fullContext: `DAGGERHEART SYSTEM REFERENCE DOCUMENT:\n\n${srd}\n\nAVAILABLE EQUIPMENT:\n\n${equipment}`
  };
}

module.exports = {
  loadSRDContext,
  loadEquipmentContext,
  getFullContext
};