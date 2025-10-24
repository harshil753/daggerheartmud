#!/usr/bin/env python3
"""
Python service to handle Gemini API calls with proper system instructions.
This service accepts input via command line arguments and returns the AI response.
"""

import sys
import json
import os

# Try different import methods for google-genai
try:
    from google import genai
    from google.genai import types
except ImportError:
    try:
        import google.genai as genai
        from google.genai import types
    except ImportError:
        # Fallback: try to import directly
        import genai
        from genai import types

def load_system_instructions():
    """Load system instructions from the prompt SDK file"""
    try:
        # Get the directory of this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_path = os.path.join(script_dir, '../../supporting_functions/prompt_sdks/new_dungeon_master.md')
        
        with open(prompt_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract system instructions from <system> tags
        import re
        system_match = re.search(r'<system>([\s\S]*?)</system>', content)
        if system_match:
            return system_match.group(1).strip()
        else:
            # Fallback to full content if no system tags found
            return content
    except Exception as e:
        print(f"Error loading system instructions: {e}", file=sys.stderr)
        return "You are a Daggerheart Game Master."

def load_seed_data():
    """Load rulebook and equipment data for seeding the AI"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Load rulebook
        rulebook_path = os.path.join(script_dir, '../../supporting_functions/Results/daggerheart rulebook.md')
        with open(rulebook_path, 'r', encoding='utf-8') as f:
            rulebook_content = f.read()
        
        # Load equipment data
        equipment_path = os.path.join(script_dir, '../../supporting_functions/Results/equipment_data.json')
        with open(equipment_path, 'r', encoding='utf-8') as f:
            equipment_content = f.read()
        
        return f"""
DAGGERHEART RULEBOOK DATA:
{rulebook_content}

EQUIPMENT DATA:
{equipment_content}
"""
    except Exception as e:
        print(f"Error loading seed data: {e}", file=sys.stderr)
        return ""

def generate_response(user_input, game_state_context="", is_seeding=False):
    """Generate AI response using Gemini with system instructions"""
    try:
        # Get API key from environment
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return "Error: GEMINI_API_KEY environment variable not set"
        
        # Initialize Gemini client
        client = genai.Client(
            api_key=api_key,
        )
        
        # Load system instructions
        system_instructions = load_system_instructions()
        
        # Prepare the full prompt
        if is_seeding:
            # Load seed data for first interaction only
            print("🌱 SEEDING AI WITH RULEBOOK AND EQUIPMENT DATA", file=sys.stderr)
            seed_data = load_seed_data()
            full_prompt = f"{seed_data}\n\n{user_input}"
            print(f"🌱 Seed data length: {len(seed_data)} characters", file=sys.stderr)
        else:
            # Regular interaction
            full_prompt = user_input
            if game_state_context:
                full_prompt = f"{game_state_context}\n\n{user_input}"
        
        # Create content for the API
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=full_prompt),
                ],
            ),
        ]
        
        # Configure generation
        generate_content_config = types.GenerateContentConfig(
            temperature=0.8,
            top_k=40,
            top_p=0.95,
            max_output_tokens=2048,
            system_instruction=[
                types.Part.from_text(text=system_instructions),
            ],
        )
        
        # Generate response
        model = "gemini-2.5-flash"
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )
        
        return response.text
        
    except Exception as e:
        return f"Error generating response: {str(e)}"

def main():
    """Main function to handle command line input"""
    if len(sys.argv) < 2:
        print("Usage: python pythonGeminiService.py '<user_input>' '[game_state_context]' '[is_seeding]'")
        sys.exit(1)
    
    user_input = sys.argv[1]
    game_state_context = sys.argv[2] if len(sys.argv) > 2 else ""
    is_seeding = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else False
    
    try:
        response = generate_response(user_input, game_state_context, is_seeding)
        print(response)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
