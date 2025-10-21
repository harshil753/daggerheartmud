const fs = require('fs');
const path = require('path');

// Load SRD and equipment data for AI context
let srdContext = null;
let equipmentContext = null;

/**
 * Load SRD text from the processed PDF
 */
function loadSRDContext() {
  if (srdContext) return srdContext;
  
  try {
    const srdPath = path.join(__dirname, '../../supporting_functions/Results/DH_SRD_Part_01_Pages_1-415.txt');
    srdContext = fs.readFileSync(srdPath, 'utf8');
    console.log('SRD context loaded successfully');
    return srdContext;
  } catch (error) {
    console.error('Error loading SRD context:', error);
    return null;
  }
}

/**
 * Load equipment data from scraped JSON
 */
function loadEquipmentContext() {
  if (equipmentContext) return equipmentContext;
  
  try {
    const equipmentPath = path.join(__dirname, '../../supporting_functions/Results/equipment_data.json');
    const equipmentData = JSON.parse(fs.readFileSync(equipmentPath, 'utf8'));
    
    // Format equipment data for AI context
    equipmentContext = equipmentData.map(item => {
      if (item.type === 'consumable' || item.type === 'item') {
        return `${item.name} (${item.type}): ${item.description || 'No description'}`;
      } else {
        const props = item.properties || {};
        const propStr = Object.entries(props)
          .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join(', ');
        return `${item.name} (${item.type}): ${propStr}`;
      }
    }).join('\n');
    
    console.log('Equipment context loaded successfully');
    return equipmentContext;
  } catch (error) {
    console.error('Error loading equipment context:', error);
    return null;
  }
}

/**
 * Get the complete AI context with SRD and equipment
 */
function getFullContext() {
  const srd = loadSRDContext();
  const equipment = loadEquipmentContext();
  
  if (!srd || !equipment) {
    throw new Error('Failed to load AI context data');
  }
  
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
