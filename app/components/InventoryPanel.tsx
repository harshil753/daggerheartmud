'use client';

import { useState } from 'react';

interface InventoryPanelProps {
  inventory?: any[];
  equipped?: {
    primary_weapon?: any;
    secondary_weapon?: any;
    armor?: any;
  };
  onEquip?: (itemId: string, slot: string) => void;
  onUnequip?: (slot: string) => void;
  onUse?: (itemId: string) => void;
}

export default function InventoryPanel({ 
  inventory = [], 
  equipped = {},
  onEquip,
  onUnequip,
  onUse
}: InventoryPanelProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const getItemType = (item: any) => {
    return item.type || 'item';
  };

  const getItemProperties = (item: any) => {
    if (!item.properties) return null;
    
    const props = item.properties;
    const displayProps = [];
    
    if (props.Trait) displayProps.push(`Trait: ${props.Trait}`);
    if (props.Damage) displayProps.push(`Damage: ${props.Damage}`);
    if (props.Range) displayProps.push(`Range: ${props.Range}`);
    if (props.Burden) displayProps.push(`Burden: ${props.Burden}`);
    if (props.Tier) displayProps.push(`Tier: ${props.Tier}`);
    
    return displayProps;
  };

  const canEquip = (item: any) => {
    return ['primary_weapon', 'secondary_weapon', 'armor'].includes(item.type);
  };

  const getEquippedSlot = (item: any) => {
    if (item.type === 'primary_weapon') return 'primary_weapon';
    if (item.type === 'secondary_weapon') return 'secondary_weapon';
    if (item.type === 'armor') return 'armor';
    return null;
  };

  const isEquipped = (item: any) => {
    const slot = getEquippedSlot(item);
    return slot && equipped[slot]?.id === item.id;
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handleEquip = (item: any) => {
    const slot = getEquippedSlot(item);
    if (slot && onEquip) {
      onEquip(item.id, slot);
    }
  };

  const handleUnequip = (slot: string) => {
    if (onUnequip) {
      onUnequip(slot);
    }
  };

  const handleUse = (item: any) => {
    if (onUse) {
      onUse(item.id);
    }
  };

  return (
    <div className="inventory-panel">
      <div className="inventory-header">
        <h3>Inventory</h3>
        <span className="item-count">{inventory.length} items</span>
      </div>

      <div className="equipped-items">
        <h4>Equipped</h4>
        <div className="equipment-slots">
          <div className="equipment-slot">
            <span className="slot-label">Primary Weapon:</span>
            <span className="slot-item">
              {equipped.primary_weapon?.name || 'None'}
            </span>
            {equipped.primary_weapon && (
              <button 
                onClick={() => handleUnequip('primary_weapon')}
                className="unequip-button"
              >
                Unequip
              </button>
            )}
          </div>
          
          <div className="equipment-slot">
            <span className="slot-label">Secondary Weapon:</span>
            <span className="slot-item">
              {equipped.secondary_weapon?.name || 'None'}
            </span>
            {equipped.secondary_weapon && (
              <button 
                onClick={() => handleUnequip('secondary_weapon')}
                className="unequip-button"
              >
                Unequip
              </button>
            )}
          </div>
          
          <div className="equipment-slot">
            <span className="slot-label">Armor:</span>
            <span className="slot-item">
              {equipped.armor?.name || 'None'}
            </span>
            {equipped.armor && (
              <button 
                onClick={() => handleUnequip('armor')}
                className="unequip-button"
              >
                Unequip
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="inventory-items">
        <h4>Items</h4>
        <div className="items-list">
          {inventory.length === 0 ? (
            <div className="empty-inventory">
              No items in inventory
            </div>
          ) : (
            inventory.map((item, index) => (
              <div 
                key={item.id || index}
                className={`inventory-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-type">{getItemType(item)}</span>
                  {item.quantity > 1 && (
                    <span className="item-quantity">x{item.quantity}</span>
                  )}
                </div>
                
                {selectedItem?.id === item.id && (
                  <div className="item-details">
                    {item.description && (
                      <div className="item-description">
                        {item.description}
                      </div>
                    )}
                    
                    {getItemProperties(item) && (
                      <div className="item-properties">
                        {getItemProperties(item).map((prop, idx) => (
                          <div key={idx} className="property">
                            {prop}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="item-actions">
                      {canEquip(item) && !isEquipped(item) && (
                        <button 
                          onClick={() => handleEquip(item)}
                          className="equip-button"
                        >
                          Equip
                        </button>
                      )}
                      
                      {item.type === 'consumable' && (
                        <button 
                          onClick={() => handleUse(item)}
                          className="use-button"
                        >
                          Use
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
