# Daggerheart MUD - Player Commands

## Basic Commands

### Movement
- `look` or `l` - Examine your surroundings
- `move <direction>` or `go <direction>` - Move in a direction
- `north`, `n` - Move north
- `south`, `s` - Move south
- `east`, `e` - Move east
- `west`, `w` - Move west
- `up`, `u` - Move up
- `down`, `d` - Move down

### Character Management
- `inventory` or `i` - View your inventory
- `stats` - View character statistics
- `equip <item>` - Equip a weapon or armor
- `unequip <slot>` - Remove equipment from a slot
- `use <item>` - Use a consumable item

### Combat
- `attack <target>` - Attack a target
- `defend` - Take defensive stance
- `flee` - Attempt to flee combat
- `cast <spell>` - Cast a magical ability

### Interaction
- `talk to <npc>` - Speak with an NPC
- `rest` - Rest to recover HP and stress

### System
- `save` - Create a manual save point
- `help` - Show this command list

## Character Creation

When you start a new game, the AI Dungeon Master will guide you through character creation:

1. **Choose Ancestry**: Elf, Dwarf, Human, Orc, or Halfling
2. **Choose Class**: Warrior, Wizard, Rogue, Cleric, or Ranger
3. **Choose Community**: Highborne, Loreborne, etc.
4. **Set Traits**: Distribute points across Agility, Strength, Finesse, Instinct, Presence, Knowledge

## Game Mechanics

### Traits
- **Agility**: Movement, evasion, acrobatics
- **Strength**: Physical attacks, carrying capacity
- **Finesse**: Precision, ranged attacks, sleight of hand
- **Instinct**: Awareness, survival, animal handling
- **Presence**: Charisma, leadership, intimidation
- **Knowledge**: Lore, magic, investigation

### Health & Resources
- **Hit Points (HP)**: Physical health
- **Stress**: Mental/emotional strain
- **Hope Tokens**: Positive dice for rolls
- **Fear Tokens**: Negative dice for rolls

### Combat
- **Initiative**: Hope dice - Fear dice + Agility
- **Attack**: Roll d12 + relevant trait + weapon bonus
- **Defense**: Roll d12 + armor bonus
- **Damage**: Based on weapon properties

### Equipment
- **Primary Weapon**: Main attack weapon
- **Secondary Weapon**: Off-hand weapon or shield
- **Armor**: Protection and defense bonus
- **Consumables**: Potions, scrolls, etc.

## Campaign System

### Story Lengths
- **Short**: 3-5 chapters (2-4 hours)
- **Medium**: 6-10 chapters (6-8 hours)
- **Long**: 11-15 chapters (10+ hours)

### Save System
- **Auto-save**: On chapter completion
- **Manual save**: Use `save` command
- **Load**: Resume from last save point

## Tips for Players

### Getting Started
1. Create a character that fits your playstyle
2. Read the room descriptions carefully
3. Use `look` to examine your surroundings
4. Talk to NPCs for information and quests

### Combat Tips
1. Use `defend` when low on HP
2. Manage your Hope and Fear tokens
3. Use consumables strategically
4. Consider fleeing if outmatched

### Exploration
1. Check all exits from each room
2. Look for hidden items or passages
3. Talk to NPCs for clues
4. Use your character's abilities creatively

### Inventory Management
1. Equip your best weapons and armor
2. Keep consumables for emergencies
3. Use `inventory` to see what you're carrying
4. Drop items you don't need

## Troubleshooting

### Common Issues
- **Command not recognized**: Check spelling, use `help` for list
- **Can't move**: Check if path is blocked or locked
- **Combat stuck**: Use `flee` to escape
- **Lost items**: Check inventory, may have been dropped

### Getting Help
- Use `help` command for command list
- Check character stats with `stats`
- Examine your surroundings with `look`
- Talk to NPCs for guidance

## Advanced Features

### AI Dungeon Master
- Responds to natural language
- Adapts to your choices
- Creates dynamic encounters
- Manages world state

### Persistent World
- Your actions affect the world
- NPCs remember interactions
- Choices have consequences
- Story adapts to your decisions

### Multiplayer Ready
- Built for 1-4 players
- Shared world state
- Collaborative storytelling
- Team combat mechanics

## Command Examples

```
> look
You are in a dimly lit tavern. The air is thick with smoke and the sound of conversation. A barkeep tends to the counter, and several patrons sit at tables.

> talk to barkeep
The barkeep looks up from cleaning a mug. "Welcome, traveler. What can I get you?"

> inventory
You are carrying:
- Rusty Sword (equipped)
- Leather Armor (equipped)
- Healing Potion
- 10 gold coins

> stats
Name: Thorne
Level: 1
HP: 12/12
Stress: 0/6
Hope: 2, Fear: 1

> attack goblin
You swing your sword at the goblin! (Roll: 8 + 3 = 11 vs 7) Hit! The goblin takes 6 damage.
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `look` | Examine surroundings |
| `move <dir>` | Move in direction |
| `inventory` | View items |
| `stats` | Character info |
| `attack <target>` | Combat action |
| `talk to <npc>` | NPC interaction |
| `rest` | Recover HP/stress |
| `save` | Manual save |
| `help` | Command list |
