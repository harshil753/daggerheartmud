'use client';

interface SimplifiedInventoryPanelProps {
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

export default function SimplifiedInventoryPanel({
  inventory = [],
  equipped = {},
  onEquip,
  onUnequip,
  onUse
}: SimplifiedInventoryPanelProps) {
  // Placeholder data for demonstration
  const placeholderInventory = [
    { id: '1', name: 'Health Potion', type: 'consumable', quantity: 3 },
    { id: '2', name: 'Iron Sword', type: 'weapon', quantity: 1 },
    { id: '3', name: 'Leather Armor', type: 'armor', quantity: 1 },
    { id: '4', name: 'Gold Coins', type: 'currency', quantity: 150 }
  ];

  const placeholderEquipped = {
    primary_weapon: { name: 'Iron Sword', type: 'weapon' },
    armor: { name: 'Leather Armor', type: 'armor' }
  };

  const displayInventory = inventory.length > 0 ? inventory : placeholderInventory;
  const displayEquipped = Object.keys(equipped).length > 0 ? equipped : placeholderEquipped;

  return (
    <div className="inventory-panel">
      <div className="panel-header">
        <h3>Inventory</h3>
      </div>
      
      <div className="panel-content">
        {/* Equipped Items */}
        <div className="equipped-section">
          <h4 className="section-title">Equipped</h4>
          <div className="equipped-items">
            {displayEquipped.primary_weapon && (
              <div className="equipped-item">
                <span className="item-name">{displayEquipped.primary_weapon.name}</span>
                <span className="item-type">Primary Weapon</span>
              </div>
            )}
            {displayEquipped.secondary_weapon && (
              <div className="equipped-item">
                <span className="item-name">{displayEquipped.secondary_weapon.name}</span>
                <span className="item-type">Secondary Weapon</span>
              </div>
            )}
            {displayEquipped.armor && (
              <div className="equipped-item">
                <span className="item-name">{displayEquipped.armor.name}</span>
                <span className="item-type">Armor</span>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Items */}
        <div className="inventory-section">
          <h4 className="section-title">Items</h4>
          <div className="inventory-items">
            {displayInventory.map((item) => (
              <div key={item.id} className="inventory-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                </div>
                <span className="item-type">{item.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder for future functionality */}
        <div className="inventory-actions">
          <p className="text-xs text-gray-400 mt-4">
            💡 Inventory management will be integrated with the AI chat system
          </p>
        </div>
      </div>
    </div>
  );
}
