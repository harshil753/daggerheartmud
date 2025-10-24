const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Python Gemini Service Wrapper
 * Provides a Node.js interface to the Python Gemini service
 */
class PythonGeminiWrapper {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'pythonGeminiService.py');
  }

  /**
   * Generate AI response using Python Gemini service
   * @param {string} userInput - The user's input/command
   * @param {string} gameStateContext - Optional game state context
   * @param {boolean} isSeeding - Whether this is a seeding call (first interaction)
   * @returns {Promise<string>} - The AI response
   */
  async generateResponse(userInput, gameStateContext = '', isSeeding = false) {
    return new Promise((resolve, reject) => {
      // Escape quotes in the input
      const escapedInput = userInput.replace(/'/g, "\\'");
      const escapedContext = gameStateContext.replace(/'/g, "\\'");
      
      // Prepare command arguments
      const args = [this.pythonScriptPath, `'${escapedInput}'`];
      if (gameStateContext) {
        args.push(`'${escapedContext}'`);
      } else {
        args.push(`''`);
      }
      args.push(isSeeding.toString());
      
      console.log('🐍 Python Gemini: Calling Python service with:', { userInput: userInput.substring(0, 100) + '...' });
      
      // Load environment variables from .env file
      const env = { ...process.env };
      
      // Use Python from virtual environment
      const pythonPath = path.join(__dirname, '../../venv/Scripts/python.exe');
      
      // Spawn Python process with environment variables
      const pythonProcess = spawn(pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: path.join(__dirname, '..'), // Run from backend directory
        env: env // Pass all environment variables to Python process
      });
      
      let output = '';
      let errorOutput = '';
      
      // Collect stdout
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      // Collect stderr
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('🐍 Python Gemini: Response received successfully');
          resolve(output.trim());
        } else {
          console.error('🐍 Python Gemini: Process failed with code:', code);
          console.error('🐍 Python Gemini: Error output:', errorOutput);
          reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
        }
      });
      
      // Handle process errors
      pythonProcess.on('error', (error) => {
        console.error('🐍 Python Gemini: Process error:', error);
        reject(error);
      });
      
      // Set timeout
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python process timeout'));
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Test the Python service
   * @returns {Promise<boolean>} - True if service is working
   */
  async testService() {
    try {
      const response = await this.generateResponse('Hello, are you working?');
      console.log('🐍 Python Gemini: Test response:', response);
      return response.length > 0;
    } catch (error) {
      console.error('🐍 Python Gemini: Test failed:', error);
      return false;
    }
  }
}

module.exports = PythonGeminiWrapper;
