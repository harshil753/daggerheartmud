const supabase = require('../config/supabase');

/**
 * Combat system manager for Daggerheart
 */
class CombatManager {
  constructor() {
    this.activeCombats = new Map(); // combatId -> combatState
  }

  /**
   * Start a new combat encounter
   */
  async startCombat(participants, campaignId, sessionId) {
    const combatId = require('uuid').v4();
    
    // Roll initiative for all participants
    const initiativeOrder = this.rollInitiative(participants);
    
    const combatState = {
      id: combatId,
      campaignId,
      sessionId,
      participants: participants.filter(p => p !== null).map(p => ({
        ...p,
        currentHP: p.hit_points_current || 0,
        currentStress: p.stress_current || 0,
        statusEffects: []
      })),
      initiativeOrder,
      currentTurnIndex: 0,
      roundNumber: 1,
      isActive: true,
      startedAt: new Date()
    };

    this.activeCombats.set(combatId, combatState);
    
    // Save to database
    await this.saveCombatToDatabase(combatState);
    
    return combatState;
  }

  /**
   * Roll initiative for all participants
   */
  rollInitiative(participants) {
    return participants.map(participant => {
      // Ensure participant exists and has required properties
      if (!participant) {
        console.error('Null participant in combat initiative');
        return null;
      }
      
      const hopeDice = participant.hope_tokens || 0;
      const fearDice = participant.fear_tokens || 0;
      
      // Roll Hope dice (d12s)
      const hopeRolls = Array.from({ length: hopeDice }, () => this.rollD12());
      const hopeTotal = hopeRolls.reduce((sum, roll) => sum + roll, 0);
      
      // Roll Fear dice (d12s)
      const fearRolls = Array.from({ length: fearDice }, () => this.rollD12());
      const fearTotal = fearRolls.reduce((sum, roll) => sum + roll, 0);
      
      // Initiative = Hope total - Fear total + Agility
      const initiative = hopeTotal - fearTotal + (participant.agility || 0);
      
      return {
        id: participant.id,
        name: participant.name,
        initiative,
        hopeRolls,
        fearRolls,
        isPlayer: participant.isPlayer || false
      };
    }).filter(participant => participant !== null).sort((a, b) => b.initiative - a.initiative);
  }

  /**
   * Process a combat action
   */
  async processAction(combatId, actorId, action, targetId = null) {
    const combat = this.activeCombats.get(combatId);
    if (!combat || !combat.isActive) {
      return { success: false, message: 'Combat not found or inactive' };
    }

    const actor = combat.participants.find(p => p.id === actorId);
    if (!actor) {
      return { success: false, message: 'Actor not found in combat' };
    }

    // Check if it's the actor's turn
    const currentTurn = combat.initiativeOrder[combat.currentTurnIndex];
    if (currentTurn.id !== actorId) {
      return { success: false, message: 'Not your turn' };
    }

    let result;
    switch (action.type) {
      case 'attack':
        result = await this.processAttack(combat, actor, action, targetId);
        break;
      case 'cast':
        result = await this.processCast(combat, actor, action, targetId);
        break;
      case 'defend':
        result = await this.processDefend(combat, actor);
        break;
      case 'flee':
        result = await this.processFlee(combat, actor);
        break;
      default:
        return { success: false, message: 'Unknown action type' };
    }

    // Check if combat should end
    const combatEnd = this.checkCombatEnd(combat);
    if (combatEnd.ended) {
      await this.endCombat(combatId, combatEnd.result);
    } else {
      // Move to next turn
      this.nextTurn(combat);
    }

    return result;
  }

  /**
   * Process an attack action
   */
  async processAttack(combat, actor, action, targetId) {
    const target = combat.participants.find(p => p.id === targetId);
    if (!target) {
      return { success: false, message: 'Target not found' };
    }

    // Roll attack
    const attackRoll = this.rollD12();
    const attackBonus = this.getAttackBonus(actor, action.weapon);
    const totalAttack = attackRoll + attackBonus;

    // Roll defense
    const defenseRoll = this.rollD12();
    const defenseBonus = this.getDefenseBonus(target);
    const totalDefense = defenseRoll + defenseBonus;

    const hit = totalAttack > totalDefense;
    
    if (hit) {
      // Calculate damage
      const damage = this.calculateDamage(actor, action.weapon);
      target.currentHP = Math.max(0, target.currentHP - damage);
      
      return {
        success: true,
        message: `${actor.name} attacks ${target.name} for ${damage} damage!`,
        damage,
        hit: true,
        attackRoll: totalAttack,
        defenseRoll: totalDefense
      };
    } else {
      return {
        success: true,
        message: `${actor.name} attacks ${target.name} but misses!`,
        damage: 0,
        hit: false,
        attackRoll: totalAttack,
        defenseRoll: totalDefense
      };
    }
  }

  /**
   * Process a spell cast
   */
  async processCast(combat, actor, action, targetId) {
    // Implement spell casting logic
    return {
      success: true,
      message: `${actor.name} casts ${action.spell}!`,
      type: 'spell'
    };
  }

  /**
   * Process defend action
   */
  async processDefend(combat, actor) {
    // Add defensive bonus for next turn
    actor.statusEffects.push({
      type: 'defending',
      duration: 1,
      bonus: 2
    });

    return {
      success: true,
      message: `${actor.name} takes a defensive stance.`,
      type: 'defend'
    };
  }

  /**
   * Process flee action
   */
  async processFlee(combat, actor) {
    // Roll to flee
    const fleeRoll = this.rollD12() + (actor.agility || 0);
    const difficulty = 10; // Base difficulty to flee

    if (fleeRoll >= difficulty) {
      // Remove from combat
      combat.participants = combat.participants.filter(p => p.id !== actor.id);
      combat.initiativeOrder = combat.initiativeOrder.filter(p => p.id !== actor.id);
      
      return {
        success: true,
        message: `${actor.name} successfully flees from combat!`,
        fled: true
      };
    } else {
      return {
        success: true,
        message: `${actor.name} attempts to flee but fails!`,
        fled: false
      };
    }
  }

  /**
   * Move to next turn
   */
  nextTurn(combat) {
    combat.currentTurnIndex = (combat.currentTurnIndex + 1) % combat.initiativeOrder.length;
    
    // If we've completed a full round
    if (combat.currentTurnIndex === 0) {
      combat.roundNumber++;
    }
  }

  /**
   * Check if combat should end
   */
  checkCombatEnd(combat) {
    const players = combat.participants.filter(p => p.isPlayer);
    const enemies = combat.participants.filter(p => !p.isPlayer);

    const allPlayersDown = players.every(p => p.currentHP <= 0);
    const allEnemiesDown = enemies.every(p => p.currentHP <= 0);

    if (allPlayersDown) {
      return { ended: true, result: 'defeat' };
    } else if (allEnemiesDown) {
      return { ended: true, result: 'victory' };
    }

    return { ended: false };
  }

  /**
   * End combat and clean up
   */
  async endCombat(combatId, result) {
    const combat = this.activeCombats.get(combatId);
    if (combat) {
      combat.isActive = false;
      combat.endedAt = new Date();
      combat.result = result;
      
      // Update database
      await this.updateCombatInDatabase(combat);
      
      // Remove from active combats
      this.activeCombats.delete(combatId);
    }
  }

  /**
   * Get attack bonus for a character and weapon
   */
  getAttackBonus(actor, weapon) {
    let bonus = 0;
    
    // Add relevant trait bonus
    if (weapon && weapon.properties && weapon.properties.Trait) {
      const trait = weapon.properties.Trait.toLowerCase();
      bonus += actor[trait] || 0;
    }
    
    return bonus;
  }

  /**
   * Get defense bonus for a character
   */
  getDefenseBonus(target) {
    // Base defense from armor
    let bonus = 0;
    
    if (target.armor_id) {
      // Add armor defense bonus
      bonus += 2; // Simplified for now
    }
    
    return bonus;
  }

  /**
   * Calculate damage for an attack
   */
  calculateDamage(attacker, weapon) {
    if (!weapon || !weapon.properties) {
      return 1; // Base damage
    }

    const damageStr = weapon.properties.Damage;
    if (!damageStr) return 1;

    // Parse damage string like "d6+3 phy"
    const match = damageStr.match(/d(\d+)\+(\d+)/);
    if (match) {
      const diceSize = parseInt(match[1]);
      const bonus = parseInt(match[2]);
      return this.rollDice(diceSize) + bonus;
    }

    return 1;
  }

  /**
   * Roll a d12
   */
  rollD12() {
    return Math.floor(Math.random() * 12) + 1;
  }

  /**
   * Roll dice of specified size
   */
  rollDice(size) {
    return Math.floor(Math.random() * size) + 1;
  }

  /**
   * Save combat to database
   */
  async saveCombatToDatabase(combat) {
    try {
      const { error } = await supabase
        .from('combat_encounters')
        .insert({
          id: combat.id,
          campaign_id: combat.campaignId,
          session_id: combat.sessionId,
          encounter_name: `Combat Round ${combat.roundNumber}`,
          initiative_order: combat.initiativeOrder,
          current_turn_index: combat.currentTurnIndex,
          participants: combat.participants,
          is_active: combat.isActive,
          round_number: combat.roundNumber
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving combat to database:', error);
    }
  }

  /**
   * Update combat in database
   */
  async updateCombatInDatabase(combat) {
    try {
      const { error } = await supabase
        .from('combat_encounters')
        .update({
          initiative_order: combat.initiativeOrder,
          current_turn_index: combat.currentTurnIndex,
          participants: combat.participants,
          is_active: combat.isActive,
          round_number: combat.roundNumber,
          ended_at: combat.endedAt
        })
        .eq('id', combat.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating combat in database:', error);
    }
  }
}

module.exports = CombatManager;
