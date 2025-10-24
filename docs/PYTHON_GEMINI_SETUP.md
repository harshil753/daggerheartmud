# Python Gemini Service Setup

This document explains how to set up the Python-based Gemini service that provides proper system instructions support.

## Overview

The Node.js Gemini SDK doesn't support system instructions the same way as the Python SDK. To work around this limitation, we've created a Python service that handles the Gemini API calls with proper system instructions, and a Node.js wrapper to integrate it seamlessly.

## Files Created

- `backend/services/pythonGeminiService.py` - Python service that calls Gemini API with system instructions
- `backend/services/pythonGeminiWrapper.js` - Node.js wrapper to call the Python service
- `backend/requirements.txt` - Python dependencies
- `backend/setup_python.bat` - Windows setup script
- `backend/setup_python.sh` - Linux/Mac setup script
- `backend/test_python_gemini.js` - Test script

## Setup Instructions

### 1. Install Python Dependencies

**Windows:**
```bash
cd backend
setup_python.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x setup_python.sh
./setup_python.sh
```

**Manual Installation:**
```bash
cd backend
pip install -r requirements.txt
```

### 2. Test the Service

```bash
cd backend
node test_python_gemini.js
```

You should see output showing the AI responding as a Daggerheart Game Master.

### 3. Environment Variables

Make sure your `GEMINI_API_KEY` is set in your environment variables (same as before).

## How It Works

1. **Node.js DungeonMaster** calls `pythonGemini.generateResponse(userInput, context)`
2. **PythonGeminiWrapper** spawns a Python process with the input
3. **PythonGeminiService** loads system instructions from `new_dungeon_master.md`
4. **Python service** calls Gemini API with proper system instructions
5. **Response** is returned to Node.js

## Benefits

- ✅ Proper system instructions support (like Google AI Studio)
- ✅ Consistent AI behavior
- ✅ No prompt length issues
- ✅ Seamless integration with existing codebase

## Troubleshooting

### Python Not Found
- Install Python 3.8+ from python.org
- Make sure Python is in your PATH

### Module Not Found
- Run `pip install -r requirements.txt` again
- Check if you're in the correct directory

### API Key Issues
- Verify `GEMINI_API_KEY` is set in your environment
- Test with a simple Python script first

## Integration

The DungeonMaster service now automatically uses the Python service instead of the Node.js Gemini API. No changes needed to your existing game code - it's a drop-in replacement.
