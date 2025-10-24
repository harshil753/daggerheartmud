const fs = require('fs');
const path = require('path');

/**
 * Service to load and manage prompt SDKs and modular rule files
 */
class PromptLoader {
  constructor() {
    this.dungeonMasterPrompt = null;
    this.imageCreatorPrompt = null;
    this.ruleEnforcerPrompt = null;
    this.characterCreationRules = null;
    this.combatRules = null;
    this.inventoryRules = null;
    this.levelUpRules = null;
    this.equipmentRules = null;
    this.loaded = false;
  }

  /**
   * Load the Dungeon Master prompt SDK
   */
  loadDungeonMasterPrompt() {
    if (this.dungeonMasterPrompt) return this.dungeonMasterPrompt;

    try {
      const promptPath = path.join(__dirname, '../../supporting_functions/prompt_sdks/new_dungeon_master.md');
      const promptContent = fs.readFileSync(promptPath, 'utf8');
      
      // Extract the system instruction text from the markdown file
      const systemInstructionMatch = promptContent.match(/<system>([\s\S]*?)<\/system>/);
      if (systemInstructionMatch) {
        this.dungeonMasterPrompt = systemInstructionMatch[1];
        console.log('Dungeon Master prompt SDK loaded successfully from new_prompt 3.md');
        return this.dungeonMasterPrompt;
      } else {
        throw new Error('Could not extract system instruction from new_prompt 3.md');
      }
    } catch (error) {
      console.error('Error loading Dungeon Master prompt SDK:', error);
      return null;
    }
  }

  /**
   * Load the Rule Enforcer prompt SDK
   */
  loadRuleEnforcerPrompt() {
    if (this.ruleEnforcerPrompt) return this.ruleEnforcerPrompt;

    try {
      const promptPath = path.join(__dirname, '../../supporting_functions/prompt_sdks/rule_enforcer.txt');
      const promptContent = fs.readFileSync(promptPath, 'utf8');
      this.ruleEnforcerPrompt = promptContent;
      console.log('Rule Enforcer prompt SDK loaded successfully');
      return this.ruleEnforcerPrompt;
    } catch (error) {
      console.error('Error loading Rule Enforcer prompt SDK:', error);
      return null;
    }
  }

  /**
   * Load character creation rules
   */
  loadCharacterCreationRules() {
    if (this.characterCreationRules) return this.characterCreationRules;

    try {
      const rulesPath = path.join(__dirname, '../../supporting_functions/prompt_sdks/character_creation_rules.md');
      const rulesContent = fs.readFileSync(rulesPath, 'utf8');
      this.characterCreationRules = rulesContent;
      console.log('Character creation rules loaded successfully');
      return this.characterCreationRules;
    } catch (error) {
      console.error('Error loading character creation rules:', error);
      return null;
    }
  }

  /**
   * Load combat rules
   */
  loadCombatRules() {
    if (this.combatRules) return this.combatRules;

    try {
      const rulesPath = path.join(__dirname, '../../supporting_functions/prompt_sdks/combat_rules.md');
      const rulesContent = fs.readFileSync(rulesPath, 'utf8');
      this.combatRules = rulesContent;
      console.log('Combat rules loaded successfully');
      return this.combatRules;
    } catch (error) {
      console.error('Error loading combat rules:', error);
      return null;
    }
  }

  /**
   * Load inventory rules
   */
  loadInventoryRules() {
    if (this.inventoryRules) return this.inventoryRules;

    try {
      const rulesPath = path.join(__dirname, '../../supporting_functions/prompt_sdks/inventory_rules.md');
      const rulesContent = fs.readFileSync(rulesPath, 'utf8');
      this.inventoryRules = rulesContent;
      console.log('Inventory rules loaded successfully');
      return this.inventoryRules;
    } catch (error) {
      console.error('Error loading inventory rules:', error);
      return null;
    }
  }

  /**
   * Load level up rules
   */
  loadLevelUpRules() {
    if (this.levelUpRules) return this.levelUpRules;

    try {
      const rulesPath = path.join(__dirname, '../../supporting_functions/prompt_sdks/level_up_rules.md');
      const rulesContent = fs.readFileSync(rulesPath, 'utf8');
      this.levelUpRules = rulesContent;
      console.log('Level up rules loaded successfully');
      return this.levelUpRules;
    } catch (error) {
      console.error('Error loading level up rules:', error);
      return null;
    }
  }

  /**
   * Load equipment rules
   */
  loadEquipmentRules() {
    if (this.equipmentRules) return this.equipmentRules;

    try {
      const rulesPath = path.join(__dirname, '../../supporting_functions/prompt_sdks/equipment_rules.md');
      const rulesContent = fs.readFileSync(rulesPath, 'utf8');
      this.equipmentRules = rulesContent;
      console.log('Equipment rules loaded successfully');
      return this.equipmentRules;
    } catch (error) {
      console.error('Error loading equipment rules:', error);
      return null;
    }
  }

  /**
   * Get event-specific rules for targeted context injection
   */
  getEventSpecificRules(eventType) {
    switch (eventType.toLowerCase()) {
      case 'character_creation':
        return this.loadCharacterCreationRules();
      case 'combat':
        return this.loadCombatRules();
      case 'inventory':
        return this.loadInventoryRules();
      case 'level_up':
        return this.loadLevelUpRules();
      case 'equipment':
        return this.loadEquipmentRules();
      default:
        console.warn(`Unknown event type: ${eventType}`);
        return null;
    }
  }

  /**
   * Load the Image Creator prompt SDK
   */
  loadImageCreatorPrompt() {
    if (this.imageCreatorPrompt) return this.imageCreatorPrompt;

    try {
      const promptPath = path.join(__dirname, '../../supporting_functions/prompt_sdks/image_creator.txt');
      const promptContent = fs.readFileSync(promptPath, 'utf8');
      
      // Extract the system instruction text from the prompt SDK
      const systemInstructionMatch = promptContent.match(/systemInstruction:\s*\[\s*\{\s*text:\s*`([\s\S]*?)`/);
      if (systemInstructionMatch) {
        this.imageCreatorPrompt = systemInstructionMatch[1];
        console.log('Image Creator prompt SDK loaded successfully');
        return this.imageCreatorPrompt;
      } else {
        throw new Error('Could not extract system instruction from prompt SDK');
      }
    } catch (error) {
      console.error('Error loading Image Creator prompt SDK:', error);
      return null;
    }
  }

  /**
   * Load all prompt SDKs
   */
  loadAllPrompts() {
    if (this.loaded) return true;

    const dmPrompt = this.loadDungeonMasterPrompt();
    const imagePrompt = this.loadImageCreatorPrompt();

    if (dmPrompt && imagePrompt) {
      this.loaded = true;
      return true;
    }

    return false;
  }

  /**
   * Get the Dungeon Master prompt with context integration
   */
  getDungeonMasterPromptWithContext(fullContext) {
    const basePrompt = this.loadDungeonMasterPrompt();
    if (!basePrompt) return null;

    // Integrate the full context (SRD + equipment) into the prompt
    return `${basePrompt}\n\n## PROVIDED GAME DATA\n\n${fullContext}\n\n## INSTRUCTIONS\n\nUse the provided Daggerheart rules and equipment data above. Store this information and reference it throughout the session. When players ask about rules or items, refer to this stored data.`;
  }

  /**
   * Get the Image Creator prompt
   */
  getImageCreatorPrompt() {
    return this.loadImageCreatorPrompt();
  }

  /**
   * Check if prompts are loaded
   */
  isLoaded() {
    return this.loaded;
  }
}

// Create singleton instance
const promptLoader = new PromptLoader();

module.exports = promptLoader;
