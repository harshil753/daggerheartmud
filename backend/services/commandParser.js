/**
 * Command parser for player input
 */
class CommandParser {
  constructor() {
    this.commands = {
      // Basic commands
      'look': this.handleLook,
      'l': this.handleLook,
      'move': this.handleMove,
      'go': this.handleMove,
      'inventory': this.handleInventory,
      'i': this.handleInventory,
      'stats': this.handleStats,
      'equip': this.handleEquip,
      'unequip': this.handleUnequip,
      'use': this.handleUse,
      'attack': this.handleAttack,
      'cast': this.handleCast,
      'talk': this.handleTalk,
      'rest': this.handleRest,
      'help': this.handleHelp,
      'save': this.handleSave,
      'create': this.handleCreate,
      'character': this.handleCreate,
      
      // Combat commands
      'fight': this.handleAttack,
      'defend': this.handleDefend,
      'flee': this.handleFlee,
      
      // Movement shortcuts
      'north': () => this.handleMove('north'),
      'n': () => this.handleMove('north'),
      'south': () => this.handleMove('south'),
      's': () => this.handleMove('south'),
      'east': () => this.handleMove('east'),
      'e': () => this.handleMove('east'),
      'west': () => this.handleMove('west'),
      'w': () => this.handleMove('west'),
      'up': () => this.handleMove('up'),
      'u': () => this.handleMove('up'),
      'down': () => this.handleMove('down'),
      'd': () => this.handleMove('down')
    };
  }

  /**
   * Parse player input and return command object
   */
  parseCommand(input) {
    if (!input || typeof input !== 'string') {
      return { command: 'invalid', args: [], originalInput: input };
    }

    const trimmed = input.trim().toLowerCase();
    if (!trimmed) {
      return { command: 'empty', args: [], originalInput: input };
    }

    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    return {
      command,
      args,
      originalInput: input,
      isValid: this.commands.hasOwnProperty(command)
    };
  }

  /**
   * Execute a parsed command
   */
  async executeCommand(parsedCommand, gameState, aiService) {
    const { command, args, isValid } = parsedCommand;

    if (!isValid) {
      return {
        success: false,
        message: `Unknown command: ${command}. Type 'help' for available commands.`
      };
    }

    try {
      const handler = this.commands[command];
      return await handler.call(this, args, gameState, aiService);
    } catch (error) {
      console.error('Command execution error:', error);
      return {
        success: false,
        message: 'An error occurred while executing the command.'
      };
    }
  }

  // Command handlers
  async handleLook(args, gameState, aiService) {
    return await aiService.processCommand('look', args, gameState);
  }

  async handleMove(args, gameState, aiService) {
    const direction = args[0] || 'north';
    return await aiService.processCommand('move', [direction], gameState);
  }

  async handleInventory(args, gameState, aiService) {
    return await aiService.processCommand('inventory', args, gameState);
  }

  async handleStats(args, gameState, aiService) {
    return await aiService.processCommand('stats', args, gameState);
  }

  async handleEquip(args, gameState, aiService) {
    const itemName = Array.isArray(args) ? args.join(' ') : args || '';
    return await aiService.processCommand('equip', [itemName], gameState);
  }

  async handleUnequip(args, gameState, aiService) {
    const slot = Array.isArray(args) ? args[0] || 'all' : args || 'all';
    return await aiService.processCommand('unequip', [slot], gameState);
  }

  async handleUse(args, gameState, aiService) {
    const itemName = Array.isArray(args) ? args.join(' ') : args || '';
    return await aiService.processCommand('use', [itemName], gameState);
  }

  async handleAttack(args, gameState, aiService) {
    const target = Array.isArray(args) ? args.join(' ') : args || '';
    return await aiService.processCommand('attack', [target], gameState);
  }

  async handleCast(args, gameState, aiService) {
    const spell = Array.isArray(args) ? args.join(' ') : args || '';
    return await aiService.processCommand('cast', [spell], gameState);
  }

  async handleTalk(args, gameState, aiService) {
    const npc = Array.isArray(args) ? args.join(' ') : args || '';
    return await aiService.processCommand('talk', [npc], gameState);
  }

  async handleRest(args, gameState, aiService) {
    return await aiService.processCommand('rest', args, gameState);
  }

  async handleDefend(args, gameState, aiService) {
    return await aiService.processCommand('defend', args, gameState);
  }

  async handleFlee(args, gameState, aiService) {
    return await aiService.processCommand('flee', args, gameState);
  }

  async handleSave(args, gameState, aiService) {
    return await aiService.processCommand('save', args, gameState);
  }

  async handleHelp(args, gameState, aiService) {
    const helpText = `
Available Commands:

BASIC COMMANDS:
  look, l          - Examine your surroundings
  move <direction>  - Move in a direction (north, south, east, west, up, down)
  inventory, i     - View your inventory
  stats            - View character statistics
  help             - Show this help message

EQUIPMENT:
  equip <item>     - Equip a weapon or armor
  unequip <slot>   - Remove equipment from a slot
  use <item>       - Use a consumable item

COMBAT:
  attack <target>  - Attack a target
  defend           - Take defensive stance
  flee             - Attempt to flee combat
  cast <spell>     - Cast a magical ability

INTERACTION:
  talk to <npc>    - Speak with an NPC
  rest             - Rest to recover HP and stress

SYSTEM:
  save             - Create a manual save point
  create character - Start character creation process

MOVEMENT SHORTCUTS:
  n, north         - Move north
  s, south         - Move south
  e, east          - Move east
  w, west          - Move west
  u, up            - Move up
  d, down          - Move down
`;
    return {
      success: true,
      message: helpText
    };
  }

  /**
   * Handle character creation
   */
  async handleCreate(gameState, args) {
    try {
      // Check if character already exists
      if (gameState.character) {
        return {
          success: false,
          message: 'You already have a character. Use "stats" to view your character sheet.'
        };
      }

      // Start character creation process
      const dungeonMaster = require('./dungeonMaster');
      const dm = dungeonMaster.getInstance();
      
      const response = await dm.processCommand('create character', Array.isArray(args) ? args : [], gameState);
      
      return {
        success: true,
        message: response.message || 'Character creation started. Follow the prompts to create your character.'
      };
    } catch (error) {
      console.error('Character creation error:', error);
      return {
        success: false,
        message: 'Failed to start character creation. Please try again.'
      };
    }
  }
}

module.exports = CommandParser;
