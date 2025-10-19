'use client';

import { calculateLevelProgression, getLevelProgressionInfo, validateCampaign } from '../utils/levelSystem';

interface LevelProgressionDisplayProps {
  totalChapters: number;
}

export default function LevelProgressionDisplay({ totalChapters }: LevelProgressionDisplayProps) {
  const progression = calculateLevelProgression(totalChapters);
  const validation = validateCampaign(totalChapters);
  
  if (!validation.valid) {
    return (
      <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded p-4 text-red-300">
        <h3 className="font-bold mb-2">Campaign Configuration Issues:</h3>
        <ul className="list-disc list-inside space-y-1">
          {validation.issues.map((issue, index) => (
            <li key={index}>{issue}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded p-4 text-gray-300">
      <h3 className="text-lg font-bold mb-3 text-white">Campaign Level Progression</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-400">Total Chapters</div>
          <div className="text-xl font-bold">{progression.totalChapters}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Starting Level</div>
          <div className="text-xl font-bold text-blue-400">{progression.startingLevel}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Target Chapter</div>
          <div className="text-xl font-bold text-green-400">Chapter {progression.targetChapter}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Final Level</div>
          <div className="text-xl font-bold text-yellow-400">Level 10</div>
        </div>
      </div>

      <div className="bg-gray-700 rounded p-3 mb-4">
        <h4 className="font-semibold mb-2 text-white">Level Progression Timeline:</h4>
        <div className="space-y-1 text-sm">
          {Array.from({ length: progression.totalChapters }, (_, i) => {
            const chapterNum = i + 1;
            const levelAtChapter = Math.min(10, progression.startingLevel + i);
            const isTargetChapter = chapterNum === progression.targetChapter;
            const isCompleted = chapterNum <= progression.targetChapter;
            
            return (
              <div 
                key={chapterNum}
                className={`flex justify-between items-center p-2 rounded ${
                  isTargetChapter 
                    ? 'bg-green-600 bg-opacity-30 border border-green-500' 
                    : isCompleted 
                    ? 'bg-blue-600 bg-opacity-20' 
                    : 'bg-gray-600 bg-opacity-20'
                }`}
              >
                <span>Chapter {chapterNum}</span>
                <span className={`font-bold ${
                  isTargetChapter ? 'text-green-400' : 
                  isCompleted ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  Level {levelAtChapter}
                  {isTargetChapter && ' (Target)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-gray-400">
        <p>• Players level up upon completing each chapter</p>
        <p>• Level 10 is reached at {Math.floor(progression.totalChapters * 0.8)}0% campaign completion</p>
        <p>• Starting level ensures progression to level 10 by target chapter</p>
      </div>
    </div>
  );
}
