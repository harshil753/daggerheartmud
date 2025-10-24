/**
 * Utility functions for processing AI responses and handling image generation triggers
 */

export interface ImageTrigger {
  type: string;
  description: string;
  fullMatch: string;
}

export interface ProcessedResponse {
  content: string;
  images: Array<{
    success: boolean;
    imageData?: string;
    mimeType?: string;
    trigger?: ImageTrigger;
    error?: string;
  }>;
  hasImages: boolean;
}

/**
 * Parse IMAGE_GENERATION_TRIGGER tags from AI response content
 * @param content - The AI response content
 * @returns Array of parsed image generation triggers
 */
export function parseImageTriggers(content: string): ImageTrigger[] {
  const imageTriggerRegex = /\[IMAGE_GENERATION_TRIGGER\s*\|\s*Type:\s*([^|]+)\s*\|\s*Description:\s*([^\]]+)\]/g;
  const triggers: ImageTrigger[] = [];
  let match;

  while ((match = imageTriggerRegex.exec(content)) !== null) {
    triggers.push({
      type: match[1].trim(),
      description: match[2].trim(),
      fullMatch: match[0]
    });
  }

  return triggers;
}

/**
 * Remove IMAGE_GENERATION_TRIGGER tags from content for display
 * @param content - The AI response content
 * @returns Content with image triggers removed
 */
export function removeImageTriggers(content: string): string {
  const imageTriggerRegex = /\[IMAGE_GENERATION_TRIGGER\s*\|\s*Type:\s*[^|]+\s*\|\s*Description:\s*[^\]]+\]/g;
  return content.replace(imageTriggerRegex, '').trim();
}

/**
 * Process AI response content and extract image triggers
 * @param content - The AI response content
 * @returns Processed response with image data
 */
export function processResponseContent(content: string): {
  displayContent: string;
  triggers: ImageTrigger[];
} {
  const triggers = parseImageTriggers(content);
  const displayContent = removeImageTriggers(content);
  
  return {
    displayContent,
    triggers
  };
}

/**
 * Format image trigger for display
 * @param trigger - The image trigger
 * @returns Formatted string for display
 */
export function formatImageTrigger(trigger: ImageTrigger): string {
  return `🎨 ${trigger.type.toUpperCase()}: ${trigger.description}`;
}

/**
 * Check if content contains image generation triggers
 * @param content - The content to check
 * @returns True if content contains image triggers
 */
export function hasImageTriggers(content: string): boolean {
  return parseImageTriggers(content).length > 0;
}
