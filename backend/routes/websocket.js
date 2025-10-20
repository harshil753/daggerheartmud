const CommandParser = require('../services/commandParser');
const GameStateManager = require('../services/gameStateManager');
const DungeonMaster = require('../services/dungeonMaster');
const CombatManager = require('../services/combatManager');

/**
 * WebSocket route handlers for game communication
 */
class WebSocketHandler {
  constructor(io) {
    this.io = io;
    this.commandParser = new CommandParser();
    this.gameStateManager = new GameStateManager();
    this.dungeonMaster = DungeonMaster.getInstance();
    this.combatManager = new CombatManager();
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);

      // Handle player connection
      socket.on('join_game', async (data) => {
        await this.handleJoinGame(socket, data);
      });

      // Handle player commands
      socket.on('player_command', async (data) => {
        await this.handlePlayerCommand(socket, data);
      });

      // Handle character creation
      socket.on('create_character', async (data) => {
        await this.handleCharacterCreation(socket, data);
      });

      // Handle campaign creation
      socket.on('create_campaign', async (data) => {
        await this.handleCampaignCreation(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle keep-alive ping
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Handle player joining the game
   */
  async handleJoinGame(socket, data) {
    try {
      const { userId, isGuest = false } = data;
      
      // Initialize game state
      const gameState = await this.gameStateManager.initializeSession(
        socket.id, 
        userId, 
        isGuest
      );

      socket.emit('game_joined', {
        success: true,
        sessionId: socket.id,
        gameState
      });

      // Send welcome message
      socket.emit('game_message', {
        type: 'welcome',
        message: 'Welcome to Daggerheart MUD! Type "help" for available commands or "start" to begin.'
      });

    } catch (error) {
      console.error('Join game error:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  }

  /**
   * Handle player command input
   */
  async handlePlayerCommand(socket, data) {
    try {
      const { command } = data;
      const gameState = this.gameStateManager.getGameState(socket.id);
      
      if (!gameState) {
        socket.emit('error', { message: 'No active game session' });
        return;
      }

      // Parse command
      const parsedCommand = this.commandParser.parseCommand(command);
      
      // Execute command through AI DM
      const result = await this.commandParser.executeCommand(
        parsedCommand, 
        gameState, 
        this.dungeonMaster
      );

      // Update game state if needed
      if (result.success && result.data) {
        this.gameStateManager.updateGameState(socket.id, result.data);
      }

      // Send response to player
      socket.emit('command_response', {
        success: result.success,
        message: result.message,
        type: result.type,
        data: result.data
      });

      // Handle special response types
      if (result.type === 'combat_start') {
        await this.handleCombatStart(socket, gameState);
      } else if (result.type === 'location_change') {
        await this.handleLocationChange(socket, gameState, result);
      }

    } catch (error) {
      console.error('Command processing error:', error);
      socket.emit('error', { message: 'Command processing failed' });
    }
  }

  /**
   * Handle character creation
   */
  async handleCharacterCreation(socket, data) {
    try {
      const { characterData } = data;
      const gameState = this.gameStateManager.getGameState(socket.id);
      
      if (!gameState) {
        socket.emit('error', { message: 'No active game session' });
        return;
      }

      // Validate character data
      const validation = this.validateCharacterData(characterData);
      if (!validation.valid) {
        socket.emit('character_creation_error', {
          message: validation.message
        });
        return;
      }

      // Create character through AI DM
      const result = await this.dungeonMaster.processCommand(
        'create_character',
        [JSON.stringify(characterData)],
        gameState
      );

      if (result.success) {
        // Update game state with new character
        gameState.character = characterData;
        this.gameStateManager.updateGameState(socket.id, { character: characterData });

        socket.emit('character_created', {
          success: true,
          character: characterData,
          message: result.message
        });
      } else {
        socket.emit('character_creation_error', {
          message: result.message
        });
      }

    } catch (error) {
      console.error('Character creation error:', error);
      socket.emit('error', { message: 'Character creation failed' });
    }
  }

  /**
   * Handle campaign creation
   */
  async handleCampaignCreation(socket, data) {
    try {
      const { storyLength } = data;
      const gameState = this.gameStateManager.getGameState(socket.id);
      
      if (!gameState) {
        socket.emit('error', { message: 'No active game session' });
        return;
      }

      // Generate campaign through AI
      const campaignData = await this.dungeonMaster.generateCampaign(storyLength);
      
      if (campaignData.error) {
        socket.emit('campaign_creation_error', {
          message: campaignData.error
        });
        return;
      }

      // Create campaign record
      const campaign = {
        id: require('uuid').v4(),
        title: `AI Generated ${storyLength} Campaign`,
        description: `A ${storyLength} adventure generated by the AI Dungeon Master`,
        story_length: storyLength,
        total_chapters: campaignData.chapters?.length || 5,
        current_chapter: 1,
        campaign_data: campaignData,
        world_state: {},
        is_active: true
      };

      // Update game state
      gameState.campaign = campaign;
      this.gameStateManager.updateGameState(socket.id, { campaign });

      socket.emit('campaign_created', {
        success: true,
        campaign,
        message: `Campaign created with ${campaign.total_chapters} chapters!`
      });

    } catch (error) {
      console.error('Campaign creation error:', error);
      socket.emit('error', { message: 'Campaign creation failed' });
    }
  }

  /**
   * Handle combat start
   */
  async handleCombatStart(socket, gameState) {
    try {
      // Check if character exists
      if (!gameState.character) {
        socket.emit('command_response', {
          success: false,
          message: 'You need to create a character first before starting combat.'
        });
        return;
      }

      // Create combat encounter
      const participants = [gameState.character];
      const combat = await this.combatManager.startCombat(
        participants,
        gameState.campaign?.id,
        socket.id
      );

      // Update game state
      gameState.combat = combat;
      this.gameStateManager.updateGameState(socket.id, { combat });

      socket.emit('combat_started', {
        combat,
        message: 'Combat has begun!'
      });

    } catch (error) {
      console.error('Combat start error:', error);
      socket.emit('error', { message: 'Failed to start combat' });
    }
  }

  /**
   * Handle location change
   */
  async handleLocationChange(socket, gameState, result) {
    try {
      // Update current location in game state
      if (result.data && result.data.location) {
        gameState.currentLocation = result.data.location;
        this.gameStateManager.updateGameState(socket.id, { 
          currentLocation: result.data.location 
        });
      }
    } catch (error) {
      console.error('Location change error:', error);
    }
  }

  /**
   * Handle player disconnection
   */
  handleDisconnect(socket) {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Save game state before cleanup
    this.gameStateManager.endSession(socket.id);
  }

  /**
   * Validate character creation data
   */
  validateCharacterData(characterData) {
    const required = ['name', 'ancestry', 'class', 'community'];
    
    for (const field of required) {
      if (!characterData[field]) {
        return {
          valid: false,
          message: `Missing required field: ${field}`
        };
      }
    }

    // Validate ancestry
    const validAncestries = ['Elf', 'Dwarf', 'Human', 'Orc', 'Halfling'];
    if (!validAncestries.includes(characterData.ancestry)) {
      return {
        valid: false,
        message: `Invalid ancestry: ${characterData.ancestry}`
      };
    }

    // Validate class
    const validClasses = ['Warrior', 'Wizard', 'Rogue', 'Cleric', 'Ranger'];
    if (!validClasses.includes(characterData.class)) {
      return {
        valid: false,
        message: `Invalid class: ${characterData.class}`
      };
    }

    return { valid: true };
  }
}

module.exports = WebSocketHandler;
