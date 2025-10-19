'use client';

import { useState } from 'react';
import { calculateLevelProgression, validateCampaign } from '../utils/levelSystem';
import LevelProgressionDisplay from './LevelProgressionDisplay';

interface CampaignConfiguratorProps {
  onConfigure: (totalChapters: number) => void;
}

export default function CampaignConfigurator({ onConfigure }: CampaignConfiguratorProps) {
  const [totalChapters, setTotalChapters] = useState(10);
  const [showProgression, setShowProgression] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCampaign(totalChapters);
    if (validation.valid) {
      onConfigure(totalChapters);
    }
  };

  const progression = calculateLevelProgression(totalChapters);
  const validation = validateCampaign(totalChapters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Campaign Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Configure your Daggerheart MUD campaign
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="totalChapters" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Chapters in Campaign
              </label>
              <input
                type="number"
                id="totalChapters"
                min="1"
                max="50"
                value={totalChapters}
                onChange={(e) => setTotalChapters(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Players will reach level 10 at {Math.floor(totalChapters * 0.8)}0% completion
              </p>
            </div>

            {!validation.valid && (
              <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded p-4 text-red-300">
                <h3 className="font-bold mb-2">Configuration Issues:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {validation.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowProgression(!showProgression)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {showProgression ? 'Hide' : 'Show'} Level Progression
              </button>
              
              <button
                type="submit"
                disabled={!validation.valid}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Start Campaign
              </button>
            </div>
          </form>

          {showProgression && (
            <div className="mt-8">
              <LevelProgressionDisplay totalChapters={totalChapters} />
            </div>
          )}

          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Examples
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[5, 7, 10, 15].map((chapters) => {
                const exampleProgression = calculateLevelProgression(chapters);
                return (
                  <button
                    key={chapters}
                    onClick={() => setTotalChapters(chapters)}
                    className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-bold">{chapters} Chapters</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Start: Level {exampleProgression.startingLevel}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Target: Ch. {exampleProgression.targetChapter}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
