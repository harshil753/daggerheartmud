const fs = require('fs');
const path = require('path');

/**
 * Equipment Manager - Tier-based equipment filtering and context-aware loading
 */
class EquipmentManager {
  constructor() {
    this.equipmentCache = new Map();
    this.usageStats = new Map();
  }

  /**
   * Load equipment based on game state context
   */
  async loadEquipmentForContext(gameState) {
    const equipment = [];
    const characterTier = this.getCharacterTier(gameState);
    
    // Load only relevant equipment types
    if (this.needsWeapons(gameState)) {
      equipment.push(await this.loadWeaponsForTier(characterTier));
    }
    
    if (this.needsArmor(gameState)) {
      equipment.push(await this.loadArmorForTier(characterTier));
    }
    
    if (this.needsConsumables(gameState)) {
      equipment.push(await this.loadConsumables());
    }
    
    if (this.needsGeneralItems(gameState)) {
      equipment.push(await this.loadGeneralItemsForTier(characterTier));
    }

    return equipment.join('\n\n---\n\n');
  }

  /**
   * Load weapons filtered by tier
   */
  async loadWeaponsForTier(tier) {
    const weapons = [];
    
    // Load primary weapons
    const primaryWeapons = await this.loadEquipmentFile('weapons_primary');
    const filteredPrimary = this.filterByTier(primaryWeapons, tier);
    if (filteredPrimary.length > 0) {
      weapons.push('## PRIMARY WEAPONS\n');
      weapons.push(this.formatEquipmentList(filteredPrimary));
    }
    
    // Load secondary weapons
    const secondaryWeapons = await this.loadEquipmentFile('weapons_secondary');
    const filteredSecondary = this.filterByTier(secondaryWeapons, tier);
    if (filteredSecondary.length > 0) {
      weapons.push('\n## SECONDARY WEAPONS\n');
      weapons.push(this.formatEquipmentList(filteredSecondary));
    }
    
    return weapons.join('\n');
  }

  /**
   * Load armor filtered by tier
   */
  async loadArmorForTier(tier) {
    const armor = await this.loadEquipmentFile('armor');
    const filteredArmor = this.filterByTier(armor, tier);
    
    if (filteredArmor.length > 0) {
      return `## ARMOR\n\n${this.formatEquipmentList(filteredArmor)}`;
    }
    
    return '';
  }

  /**
   * Load consumables (not tier-filtered)
   */
  async loadConsumables() {
    const consumables = await this.loadEquipmentFile('consumables');
    
    if (consumables.length > 0) {
      return `## CONSUMABLES\n\n${this.formatEquipmentList(consumables)}`;
    }
    
    return '';
  }

  /**
   * Load general items filtered by tier
   */
  async loadGeneralItemsForTier(tier) {
    const generalItems = await this.loadEquipmentFile('general_items');
    const filteredItems = this.filterByTier(generalItems, tier);
    
    if (filteredItems.length > 0) {
      return `## GENERAL ITEMS\n\n${this.formatEquipmentList(filteredItems)}`;
    }
    
    return '';
  }

  /**
   * Load equipment from file
   */
  async loadEquipmentFile(type) {
    if (this.equipmentCache.has(type)) {
      return this.equipmentCache.get(type);
    }

    try {
      const filePath = path.join(__dirname, '../../docs/equipment', `${type}.json`);
      const equipmentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.equipmentCache.set(type, equipmentData);
      return equipmentData;
    } catch (error) {
      console.error(`Error loading equipment file ${type}:`, error);
      return [];
    }
  }

  /**
   * Filter equipment by tier (±1 range)
   */
  filterByTier(equipment, targetTier) {
    return equipment.filter(item => {
      const itemTier = this.getItemTier(item);
      return itemTier >= Math.max(1, targetTier - 1) && itemTier <= Math.min(4, targetTier + 1);
    });
  }

  /**
   * Get item tier from equipment data
   */
  getItemTier(item) {
    if (item.properties && item.properties.Tier) {
      return item.properties.Tier;
    }
    // Default to tier 1 if no tier specified
    return 1;
  }

  /**
   * Get character tier based on level
   */
  getCharacterTier(gameState) {
    if (!gameState.character || !gameState.character.level) {
      return 1; // Default to tier 1
    }
    
    const level = gameState.character.level;
    if (level <= 2) return 1;
    if (level <= 4) return 2;
    if (level <= 6) return 3;
    return 4;
  }

  /**
   * Context detection methods
   */
  needsWeapons(gameState) {
    return gameState.combat || 
           (gameState.character && gameState.character.class && 
            ['warrior', 'ranger', 'rogue', 'guardian'].includes(gameState.character.class.toLowerCase()));
  }

  needsArmor(gameState) {
    return gameState.combat || 
           (gameState.character && gameState.character.class && 
            ['warrior', 'guardian', 'ranger'].includes(gameState.character.class.toLowerCase()));
  }

  needsConsumables(gameState) {
    return gameState.character && gameState.character.level > 1;
  }

  needsGeneralItems(gameState) {
    return gameState.character && gameState.character.level > 1;
  }

  /**
   * Format equipment list for AI consumption
   */
  formatEquipmentList(equipment) {
    return equipment.map(item => {
      let formatted = `**${item.name}** (${item.type})`;
      
      if (item.properties) {
        const props = item.properties;
        if (props.Tier) formatted += ` - Tier ${props.Tier}`;
        if (props.Damage) formatted += ` - ${props.Damage}`;
        if (props.Range) formatted += ` - Range: ${props.Range}`;
        if (props.Trait) formatted += ` - Trait: ${props.Trait}`;
        if (props.Burden) formatted += ` - ${props.Burden}`;
        if (props.Base_Score) formatted += ` - Armor Score: ${props.Base_Score}`;
        if (props.Feature) {
          formatted += ` - Feature: ${props.Feature.Feature_Name} (${props.Feature.Effect})`;
        }
      }
      
      if (item.description) {
        formatted += `\n  ${item.description}`;
      }
      
      return formatted;
    }).join('\n');
  }

  /**
   * Get equipment by specific criteria
   */
  async getEquipmentByType(type) {
    return await this.loadEquipmentFile(type);
  }

  /**
   * Get equipment by tier
   */
  async getEquipmentByTier(tier) {
    const allEquipment = [];
    const types = ['weapons_primary', 'weapons_secondary', 'armor', 'general_items'];
    
    for (const type of types) {
      const equipment = await this.loadEquipmentFile(type);
      allEquipment.push(...this.filterByTier(equipment, tier));
    }
    
    return allEquipment;
  }

  /**
   * Search equipment by name or properties
   */
  async searchEquipment(query, gameState) {
    const allEquipment = [];
    const types = ['weapons_primary', 'weapons_secondary', 'armor', 'consumables', 'general_items'];
    
    for (const type of types) {
      const equipment = await this.loadEquipmentFile(type);
      allEquipment.push(...equipment);
    }
    
    const queryLower = query.toLowerCase();
    return allEquipment.filter(item => 
      item.name.toLowerCase().includes(queryLower) ||
      (item.properties && Object.values(item.properties).some(prop => 
        prop && prop.toString().toLowerCase().includes(queryLower)
      ))
    );
  }

  /**
   * Track equipment usage
   */
  trackEquipmentUsage(type, context) {
    if (!this.usageStats.has(type)) {
      this.usageStats.set(type, { count: 0, contexts: [] });
    }
    
    const stats = this.usageStats.get(type);
    stats.count++;
    if (!stats.contexts.includes(context)) {
      stats.contexts.push(context);
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return Object.fromEntries(this.usageStats);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.equipmentCache.clear();
  }
}

module.exports = EquipmentManager;
