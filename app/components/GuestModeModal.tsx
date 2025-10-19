'use client';

import { useState } from 'react';

interface GuestModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function GuestModeModal({ isOpen, onClose, onConfirm }: GuestModeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
            Guest Mode Warning
          </h3>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
            You are about to play as a guest. Please note the following limitations:
          </p>
          
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6">
            <li>Your progress will <strong>NOT be saved</strong> beyond this session</li>
            <li>When you close the game or refresh the page, all progress will be lost</li>
            <li>This mode is intended for testing and trying out the game</li>
            <li>To save your progress permanently, please create an account</li>
          </ul>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
