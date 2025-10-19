/**
 * Chapter-based leveling system for Daggerheart MUD
 * Players level up upon completing chapters, reaching level 10 at 80% campaign completion
 */

export interface LevelProgression {
  startingLevel: number;
  targetChapter: number; // Chapter where player reaches level 10
  totalChapters: number;
  levelUps: number; // Total level ups available
}

/**
 * Calculate level progression for a campaign
 * @param totalChapters - Total number of chapters in the campaign
 * @returns Level progression details
 */
export function calculateLevelProgression(totalChapters: number): LevelProgression {
  // Calculate target chapter (80% completion, rounded down)
  const targetChapter = Math.floor(totalChapters * 0.8);
  
  // Total level ups available (from starting level to level 10)
  const levelUps = 10 - 1; // 9 level ups total (level 1 to 10)
  
  // Calculate starting level
  // If target chapter is 0 or negative, start at level 1
  const startingLevel = Math.max(1, 10 - targetChapter);
  
  return {
    startingLevel,
    targetChapter,
    totalChapters,
    levelUps
  };
}

/**
 * Get the level a player should be at after completing a specific chapter
 * @param startingLevel - Player's starting level
 * @param completedChapters - Number of chapters completed
 * @returns Current level
 */
export function getLevelAfterChapters(startingLevel: number, completedChapters: number): number {
  return Math.min(10, startingLevel + completedChapters);
}

/**
 * Check if player should level up after completing a chapter
 * @param currentLevel - Player's current level
 * @param completedChapters - Number of chapters completed
 * @param startingLevel - Player's starting level
 * @returns True if player should level up
 */
export function shouldLevelUp(currentLevel: number, completedChapters: number, startingLevel: number): boolean {
  const expectedLevel = getLevelAfterChapters(startingLevel, completedChapters);
  return currentLevel < expectedLevel;
}

/**
 * Get level progression details for display
 * @param progression - Level progression configuration
 * @returns Formatted progression information
 */
export function getLevelProgressionInfo(progression: LevelProgression): string {
  const { startingLevel, targetChapter, totalChapters, levelUps } = progression;
  
  return `Campaign Level Progression:
- Total Chapters: ${totalChapters}
- Starting Level: ${startingLevel}
- Target Chapter for Level 10: ${targetChapter}
- Total Level Ups: ${levelUps}
- Level up every chapter completion`;
}

// Example calculations for common campaign lengths
export const exampleProgressions = {
  5: calculateLevelProgression(5),   // 5 chapters: start level 6, reach 10 at chapter 4
  7: calculateLevelProgression(7), // 7 chapters: start level 5, reach 10 at chapter 5
  10: calculateLevelProgression(10), // 10 chapters: start level 3, reach 10 at chapter 8
  15: calculateLevelProgression(15), // 15 chapters: start level 1, reach 10 at chapter 12
  20: calculateLevelProgression(20), // 20 chapters: start level 1, reach 10 at chapter 16
};

/**
 * Validate campaign configuration
 * @param totalChapters - Number of chapters in campaign
 * @returns Validation result with any issues
 */
export function validateCampaign(totalChapters: number): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (totalChapters < 1) {
    issues.push('Campaign must have at least 1 chapter');
  }
  
  if (totalChapters > 50) {
    issues.push('Campaign has too many chapters (max 50 recommended)');
  }
  
  const progression = calculateLevelProgression(totalChapters);
  
  if (progression.startingLevel > 10) {
    issues.push('Campaign is too short - player would start above level 10');
  }
  
  if (progression.targetChapter < 1) {
    issues.push('Campaign is too short - player would reach level 10 before any chapters');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
