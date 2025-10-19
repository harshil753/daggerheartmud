-- Seed data for Daggerheart MUD
-- Equipment data from web scraper

-- Insert equipment items from scraped data
INSERT INTO items (name, type, description, properties, source) VALUES
-- Primary Weapons
('Aantari Bow', 'primary_weapon', 'A finely crafted bow with exceptional range and accuracy.', '{"Trait": "Finesse", "Range": "Far", "Damage": "d6+11 phy", "Burden": "Two-Handed", "Tier": 4, "Feature": {"Feature_Name": "Reliable", "Effect": "+1 to attack rolls"}}', 'scraped'),

('Advanced Arcane Gauntlets', 'primary_weapon', 'Magical gauntlets that channel arcane energy through physical strikes.', '{"Trait": "Strength", "Range": "Melee", "Damage": "d10+9 mag", "Burden": "Two-Handed", "Tier": 3}', 'scraped'),

('Advanced Arcane-Frame Wheelchair', 'primary_weapon', 'A magical wheelchair that can project arcane blasts at distant targets.', '{"Range": "Far", "Damage": "d6+6 mag", "Burden": "One-Handed", "Tier": 3, "Feature": {"Feature_Name": "Reliable", "Effect": "+1 to attack rolls"}}', 'scraped'),

('Advanced Battleaxe', 'primary_weapon', 'A heavy two-handed axe designed for devastating melee combat.', '{"Trait": "Strength", "Range": "Melee", "Damage": "d10+9 phy", "Burden": "Two-Handed", "Tier": 3}', 'scraped'),

('Advanced Broadsword', 'primary_weapon', 'A well-balanced sword that offers both offense and defense.', '{"Trait": "Agility", "Range": "Melee", "Damage": "d8+6 phy", "Burden": "One-Handed", "Tier": 3, "Feature": {"Feature_Name": "Reliable", "Effect": "+1 to attack rolls"}}', 'scraped'),

('Advanced Crossbow', 'primary_weapon', 'A precision crossbow with excellent range and stopping power.', '{"Trait": "Finesse", "Range": "Far", "Damage": "d6+7 phy", "Burden": "One-Handed", "Tier": 3}', 'scraped'),

('Advanced Dagger', 'primary_weapon', 'A sharp, quick blade perfect for swift strikes.', '{"Trait": "Finesse", "Range": "Melee", "Damage": "d8+7 phy", "Burden": "One-Handed", "Tier": 3}', 'scraped'),

('Advanced Dualstaff', 'primary_weapon', 'A magical staff that channels instinctual magic through combat.', '{"Trait": "Instinct", "Range": "Far", "Damage": "d6+9 mag", "Burden": "Two-Handed", "Tier": 3}', 'scraped'),

('Advanced Greatstaff', 'primary_weapon', 'A powerful magical staff with exceptional range.', '{"Range": "Very Far", "Damage": "d6+6 mag", "Burden": "Two-Handed", "Tier": 3}', 'scraped'),

('Advanced Greatsword', 'primary_weapon', 'A massive two-handed sword that delivers devastating blows.', '{"Trait": "Strength", "Range": "Melee", "Damage": "d10+9 phy", "Burden": "Two-Handed", "Tier": 3}', 'scraped'),

('Advanced Halberd', 'primary_weapon', 'A polearm weapon that combines axe and spear techniques.', '{"Trait": "Strength", "Damage": "d10+8 phy", "Burden": "Two-Handed", "Tier": 3}', 'scraped'),

('Advanced Hallowed Axe', 'primary_weapon', 'A blessed axe that channels divine energy.', '{"Trait": "Strength", "Range": "Melee", "Damage": "d8+7 mag", "Burden": "One-Handed", "Tier": 3}', 'scraped'),

('Advanced Glowing Rings', 'primary_weapon', 'Magical rings that project energy blasts.', '{"Trait": "Agility", "Damage": "d10+8 mag", "Burden": "Two-Handed", "Tier": 3}', 'scraped'),

-- Secondary Weapons
('Advanced Grappler', 'secondary_weapon', 'A hooked weapon designed to pull enemies closer.', '{"Trait": "Finesse", "Range": "Close", "Damage": "d6+4 phy", "Burden": "One-Handed", "Tier": 3, "Feature": {"Feature_Name": "Hooked", "Effect": "On a successful attack, you can pull the target into Melee range."}}', 'scraped'),

('Advanced Hand Crossbow', 'secondary_weapon', 'A compact crossbow perfect for off-hand use.', '{"Trait": "Finesse", "Range": "Far", "Damage": "d6+5 phy", "Burden": "One-Handed", "Tier": 3}', 'scraped'),

-- Armor
('Advanced Chainmail Armor', 'armor', 'Heavy metal armor that provides excellent protection but limits mobility.', '{"Base_Score": 6, "Tier": 3, "Feature": {"Feature_Name": "Heavy", "Effect": "−1 to Evasion"}}', 'scraped'),

('Advanced Full Plate Armor', 'armor', 'The heaviest armor available, offering maximum protection.', '{"Base_Score": 6, "Tier": 3, "Feature": {"Feature_Name": "Heavy", "Effect": "−1 to Evasion"}}', 'scraped'),

('Advanced Gambeson Armor', 'armor', 'Light padded armor that provides basic protection without mobility penalties.', '{"Base_Score": 5, "Tier": 3}', 'scraped'),

-- Consumables
('Acidpaste', 'consumable', 'This paste eats away walls and other surfaces in bright flashes.', NULL, 'scraped'),

-- Basic starting equipment for new characters
('Rusty Sword', 'primary_weapon', 'A basic sword with some wear and tear.', '{"Trait": "Strength", "Range": "Melee", "Damage": "d6+3 phy", "Burden": "One-Handed", "Tier": 1}', 'game'),

('Wooden Shield', 'secondary_weapon', 'A simple wooden shield for basic protection.', '{"Trait": "Strength", "Range": "Melee", "Damage": "d4+2 phy", "Burden": "One-Handed", "Tier": 1}', 'game'),

('Leather Armor', 'armor', 'Basic leather protection that doesn''t hinder movement.', '{"Base_Score": 3, "Tier": 1}', 'game'),

('Healing Potion', 'consumable', 'A magical potion that restores health when consumed.', NULL, 'game'),

('Rope', 'item', 'A sturdy rope useful for climbing, binding, or other tasks.', NULL, 'game'),

('Torch', 'item', 'A wooden torch that provides light in dark areas.', NULL, 'game'),

('Rations', 'consumable', 'Dried food that sustains you during long journeys.', NULL, 'game');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_type_tier ON items(type, (properties->>'Tier'));
