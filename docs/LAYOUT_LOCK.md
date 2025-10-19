# Daggerheart MUD - Layout Lock Documentation

## 🔒 LOCKED LAYOUT - DO NOT MODIFY

This document records the final, approved layout structure for the Daggerheart MUD game interface. **NO CHANGES** should be made to the div structure, positioning, or sizing described below.

## 📐 Final Layout Structure

### Header Section
- **Game Title**: Left side with "Daggerheart MUD" title and status badges
- **Guest Info Header**: Center section (only when in guest mode) with:
  - "Play as Guest" heading
  - Description text
  - "Start Guest Session" button
- **Game Controls**: Right side with Terminal, Inventory, Stats, Logout buttons

### Main Content Area
- **Left Section**: 75% width
  - Terminal panel (primary)
  - Inventory panel
  - Stats panel
- **Right Sidebar**: 25% width
  - Quick Actions (Roll Dice, Save, Rest)
  - Quick Help (command list)

### Footer Section
- Game version and chapter information

## 🎯 Key Measurements
- **Terminal Width**: 75% of screen width
- **Sidebar Width**: 25% of screen width
- **Header Height**: Fixed with proper spacing
- **Guest Info**: Horizontal layout with warning and action button

## ⚠️ IMPORTANT RESTRICTIONS
1. **DO NOT** change the 75%/25% width split
2. **DO NOT** move guest session container from header
3. **DO NOT** modify the div structure in GameSession.tsx
4. **DO NOT** change the CSS classes or their positioning
5. **DO NOT** alter the terminal or sidebar sizing

## 📝 Files with Locked Layout
- `app/components/GameSession.tsx` - Main layout structure
- `app/globals.css` - CSS styling and positioning
- `app/components/Terminal.tsx` - Terminal functionality
- `app/components/GuestSession.tsx` - Guest session handling

## 🔧 Future Development
Any new features should:
- Work within the existing layout structure
- Not require changes to div positioning or sizing
- Use the existing CSS classes and structure
- Maintain the 75%/25% width split

---
**Layout Locked**: December 2024
**Status**: FINAL - NO MODIFICATIONS ALLOWED
