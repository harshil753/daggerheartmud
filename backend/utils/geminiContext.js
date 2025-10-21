const RuleManager = require('../services/ruleManager');
const EquipmentManager = require('../services/equipmentManager');

// Initialize managers
const ruleManager = new RuleManager();
const equipmentManager = new EquipmentManager();

/**
 * Get context for specific game state and command
 */
async function getContextForGameState(command, gameState) {
  try {
    const rules = await ruleManager.loadRulesForContext(command, gameState);
    const equipment = await equipmentManager.loadEquipmentForContext(gameState);
    
    return {
      rules,
      equipment,
      fullContext: `${rules}\n\n## EQUIPMENT DATABASE\n\n${equipment}`
    };
  } catch (error) {
    console.error('Error loading dynamic context:', error);
    // Fallback to basic context
    return {
      rules: 'Basic Daggerheart rules',
      equipment: 'Equipment database unavailable',
      fullContext: 'Daggerheart game rules and equipment'
    };
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getContextForGameState instead
 */
function getFullContext() {
  console.warn('getFullContext() is deprecated. Use getContextForGameState(command, gameState) instead.');
  
  // Return a basic context for legacy compatibility
  return {
    srd: 'Legacy SRD context',
    equipment: 'Legacy equipment context',
    fullContext: 'Legacy Daggerheart context - please use getContextForGameState() for better performance'
  };
}

module.exports = {
  getContextForGameState,
  getFullContext
};
