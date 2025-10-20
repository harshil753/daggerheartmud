const fs = require('fs');
const path = require('path');

/**
 * Service to load and manage prompt SDKs
 */
class PromptLoader {
  constructor() {
    this.dungeonMasterPrompt = null;
    this.imageCreatorPrompt = null;
    this.loaded = false;
  }

  /**
   * Load the Dungeon Master prompt SDK
   */
  loadDungeonMasterPrompt() {
    if (this.dungeonMasterPrompt) return this.dungeonMasterPrompt;

    try {
      const promptPath = path.join(__dirname, '../../supporting_functions/prompt_sdks/dungeon_master.txt');
      const promptContent = fs.readFileSync(promptPath, 'utf8');
      
      // Extract the system instruction text from the prompt SDK
      const systemInstructionMatch = promptContent.match(/systemInstruction:\s*\[\s*\{\s*text:\s*`([\s\S]*?)`/);
      if (systemInstructionMatch) {
        this.dungeonMasterPrompt = systemInstructionMatch[1];
        console.log('Dungeon Master prompt SDK loaded successfully');
        return this.dungeonMasterPrompt;
      } else {
        throw new Error('Could not extract system instruction from prompt SDK');
      }
    } catch (error) {
      console.error('Error loading Dungeon Master prompt SDK:', error);
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
