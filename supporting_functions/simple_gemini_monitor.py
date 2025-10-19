#!/usr/bin/env python3
"""
Simple Gemini API Usage Monitor
==============================

This script provides a simpler way to monitor Gemini API usage by:
1. Making test API calls to track token usage
2. Logging usage patterns
3. Estimating costs
4. Exporting to CSV/JSON

This version doesn't require Google Cloud Monitoring setup.

Usage:
    python simple_gemini_monitor.py

Output:
    - Usage/usage.csv
    - Usage/usage.json
"""

import os
import json
import csv
import sys
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import requests
import google.generativeai as genai

class SimpleGeminiMonitor:
    def __init__(self, api_key: str):
        """
        Initialize the Simple Gemini Monitor
        
        Args:
            api_key: Gemini API Key
        """
        self.api_key = api_key
        genai.configure(api_key=api_key)
        
        # Create Usage directory if it doesn't exist
        self.usage_dir = "Usage"
        os.makedirs(self.usage_dir, exist_ok=True)
        
        # Initialize model
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Usage tracking
        self.usage_log = []
        
    def test_api_call(self, prompt: str = "Hello, how are you?") -> Dict[str, Any]:
        """
        Make a test API call and track usage
        """
        print(f"🧪 Making test API call with prompt: '{prompt[:50]}...'")
        
        start_time = datetime.now()
        
        try:
            # Make API call
            response = self.model.generate_content(prompt)
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            # Extract usage information
            usage_info = response.usage_metadata if hasattr(response, 'usage_metadata') else None
            
            # Estimate tokens (rough calculation)
            input_tokens = len(prompt.split()) * 1.3  # Rough estimate
            output_tokens = len(response.text.split()) * 1.3 if response.text else 0
            
            # Calculate costs (Gemini pricing as of 2024)
            input_cost = (input_tokens / 1000) * 0.000075
            output_cost = (output_tokens / 1000) * 0.0003
            total_cost = input_cost + output_cost
            
            usage_entry = {
                "timestamp": start_time.isoformat(),
                "request_type": "generate_content",
                "model": "gemini-2.5-flash",
                "prompt_length": len(prompt),
                "response_length": len(response.text) if response.text else 0,
                "estimated_input_tokens": int(input_tokens),
                "estimated_output_tokens": int(output_tokens),
                "estimated_total_tokens": int(input_tokens + output_tokens),
                "input_cost": round(input_cost, 6),
                "output_cost": round(output_cost, 6),
                "total_cost": round(total_cost, 6),
                "duration_seconds": round(duration, 3),
                "success": True,
                "error": None
            }
            
            # Add actual usage metadata if available
            if usage_info:
                usage_entry.update({
                    "actual_input_tokens": getattr(usage_info, 'prompt_token_count', None),
                    "actual_output_tokens": getattr(usage_info, 'candidates_token_count', None),
                    "actual_total_tokens": getattr(usage_info, 'total_token_count', None)
                })
            
            self.usage_log.append(usage_entry)
            print(f"✅ API call successful - Cost: ${total_cost:.6f}")
            
            return usage_entry
            
        except Exception as e:
            error_entry = {
                "timestamp": start_time.isoformat(),
                "request_type": "generate_content",
                "model": "gemini-2.5-flash",
                "prompt_length": len(prompt),
                "response_length": 0,
                "estimated_input_tokens": 0,
                "estimated_output_tokens": 0,
                "estimated_total_tokens": 0,
                "input_cost": 0,
                "output_cost": 0,
                "total_cost": 0,
                "duration_seconds": 0,
                "success": False,
                "error": str(e)
            }
            
            self.usage_log.append(error_entry)
            print(f"❌ API call failed: {str(e)}")
            
            return error_entry
    
    def simulate_game_usage(self, num_calls: int = 5):
        """
        Simulate typical game usage patterns
        """
        print(f"🎮 Simulating {num_calls} game-like API calls...")
        
        # Typical game prompts
        game_prompts = [
            "You are a Dungeon Master. A player says 'look around'. Describe what they see in a fantasy tavern.",
            "A player wants to create a character. Guide them through choosing a class in Daggerheart.",
            "A player attacks a goblin with their sword. Describe the combat action and roll for damage.",
            "A player casts a fireball spell. Describe the magical effects and determine the outcome.",
            "A player talks to a merchant NPC. Roleplay the conversation about buying equipment.",
            "A player wants to rest and recover. Describe the rest scene and calculate HP recovery.",
            "A player searches for treasure. Describe what they find in the chest.",
            "A player encounters a trap. Describe the trap and how they can avoid it.",
            "A player wants to know their character stats. Display their current status.",
            "A player asks for help with commands. List available game commands."
        ]
        
        for i in range(min(num_calls, len(game_prompts))):
            print(f"🎲 Game call {i+1}/{num_calls}")
            self.test_api_call(game_prompts[i])
            time.sleep(1)  # Rate limiting
    
    def get_quota_info(self) -> Dict[str, Any]:
        """
        Get quota information (estimated based on common limits)
        """
        return {
            "requests_per_minute": 15,
            "tokens_per_minute": 1000000,
            "tokens_per_day": 50000000,
            "requests_per_day": 1000,
            "current_usage_requests": len(self.usage_log),
            "current_usage_tokens": sum(entry.get('estimated_total_tokens', 0) for entry in self.usage_log),
            "current_cost": sum(entry.get('total_cost', 0) for entry in self.usage_log)
        }
    
    def analyze_usage(self) -> Dict[str, Any]:
        """
        Analyze usage patterns
        """
        if not self.usage_log:
            return {}
        
        successful_calls = [entry for entry in self.usage_log if entry.get('success', False)]
        failed_calls = [entry for entry in self.usage_log if not entry.get('success', False)]
        
        total_tokens = sum(entry.get('estimated_total_tokens', 0) for entry in successful_calls)
        total_cost = sum(entry.get('total_cost', 0) for entry in successful_calls)
        avg_tokens = total_tokens / len(successful_calls) if successful_calls else 0
        avg_cost = total_cost / len(successful_calls) if successful_calls else 0
        
        return {
            "total_calls": len(self.usage_log),
            "successful_calls": len(successful_calls),
            "failed_calls": len(failed_calls),
            "success_rate": len(successful_calls) / len(self.usage_log) if self.usage_log else 0,
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 6),
            "average_tokens_per_call": round(avg_tokens, 2),
            "average_cost_per_call": round(avg_cost, 6),
            "estimated_daily_cost": round(total_cost * 24, 2),  # Rough estimate
            "estimated_monthly_cost": round(total_cost * 24 * 30, 2)  # Rough estimate
        }
    
    def export_to_csv(self, filename: str = "usage.csv"):
        """Export usage data to CSV"""
        if not self.usage_log:
            print("⚠️  No usage data to export")
            return
        
        filepath = os.path.join(self.usage_dir, filename)
        
        try:
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = self.usage_log[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for row in self.usage_log:
                    writer.writerow(row)
            
            print(f"✅ CSV exported to: {filepath}")
        except Exception as e:
            print(f"❌ Error exporting CSV: {str(e)}")
    
    def export_to_json(self, analysis: Dict[str, Any], filename: str = "usage.json"):
        """Export usage data and analysis to JSON"""
        filepath = os.path.join(self.usage_dir, filename)
        
        try:
            export_data = {
                "export_timestamp": datetime.now().isoformat(),
                "monitor_type": "simple_gemini_monitor",
                "analysis": analysis,
                "quota_info": self.get_quota_info(),
                "usage_data": self.usage_log,
                "summary": {
                    "total_records": len(self.usage_log),
                    "date_range": {
                        "start": min(entry["timestamp"] for entry in self.usage_log) if self.usage_log else None,
                        "end": max(entry["timestamp"] for entry in self.usage_log) if self.usage_log else None
                    }
                }
            }
            
            with open(filepath, 'w', encoding='utf-8') as jsonfile:
                json.dump(export_data, jsonfile, indent=2, ensure_ascii=False)
            
            print(f"✅ JSON exported to: {filepath}")
        except Exception as e:
            print(f"❌ Error exporting JSON: {str(e)}")
    
    def print_summary(self, analysis: Dict[str, Any]):
        """Print usage summary"""
        print("\n" + "="*60)
        print("📊 GEMINI API USAGE SUMMARY")
        print("="*60)
        
        print(f"📞 Total API Calls: {analysis.get('total_calls', 0)}")
        print(f"✅ Successful Calls: {analysis.get('successful_calls', 0)}")
        print(f"❌ Failed Calls: {analysis.get('failed_calls', 0)}")
        print(f"📈 Success Rate: {analysis.get('success_rate', 0):.1%}")
        print(f"🔢 Total Tokens: {analysis.get('total_tokens', 0):,}")
        print(f"💰 Total Cost: ${analysis.get('total_cost', 0):.6f}")
        print(f"📊 Avg Tokens/Call: {analysis.get('average_tokens_per_call', 0):.0f}")
        print(f"💵 Avg Cost/Call: ${analysis.get('average_cost_per_call', 0):.6f}")
        print(f"📅 Est. Daily Cost: ${analysis.get('estimated_daily_cost', 0):.2f}")
        print(f"📅 Est. Monthly Cost: ${analysis.get('estimated_monthly_cost', 0):.2f}")
        
        print("\n💡 Cost Optimization Tips:")
        print("   - Use shorter prompts when possible")
        print("   - Cache AI responses for repeated scenarios")
        print("   - Implement conversation history limits")
        print("   - Consider using cheaper models for simple tasks")
        
        print("="*60)
    
    def run_monitoring(self, simulate_game: bool = True, num_simulations: int = 5):
        """Run the complete monitoring process"""
        print("🚀 Starting Simple Gemini API Usage Monitoring...")
        
        # Make a basic test call
        print("\n🧪 Making basic API test...")
        self.test_api_call("Hello, this is a test of the Gemini API monitoring system.")
        
        # Simulate game usage if requested
        if simulate_game:
            print(f"\n🎮 Simulating game usage ({num_simulations} calls)...")
            self.simulate_game_usage(num_simulations)
        
        # Analyze usage
        print("\n📊 Analyzing usage patterns...")
        analysis = self.analyze_usage()
        
        # Export data
        self.export_to_csv("usage.csv")
        self.export_to_json(analysis, "usage.json")
        
        # Print summary
        self.print_summary(analysis)
        
        print(f"\n✅ Monitoring complete! Files saved to: {self.usage_dir}/")
        print("📁 Files created:")
        print(f"   - {self.usage_dir}/usage.csv")
        print(f"   - {self.usage_dir}/usage.json")

def main():
    """Main function"""
    print("🔍 Simple Gemini API Usage Monitor")
    print("=" * 40)
    
    # Get API key
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        api_key = input("Enter your Gemini API Key: ").strip()
    
    if not api_key:
        print("❌ API Key is required!")
        sys.exit(1)
    
    # Create monitor instance
    monitor = SimpleGeminiMonitor(api_key)
    
    # Ask user for simulation preferences
    simulate = input("\n🎮 Simulate game usage? (y/n): ").lower().strip() == 'y'
    num_sims = 5
    
    if simulate:
        try:
            num_sims = int(input("How many game simulations? (default 5): ") or "5")
        except ValueError:
            num_sims = 5
    
    # Run monitoring
    try:
        monitor.run_monitoring(simulate_game=simulate, num_simulations=num_sims)
    except Exception as e:
        print(f"❌ Error during monitoring: {str(e)}")
        print("\n💡 Troubleshooting tips:")
        print("   1. Check your API key is correct")
        print("   2. Ensure you have internet connection")
        print("   3. Verify you have API quota remaining")
        print("   4. Check if the Gemini API is accessible")

if __name__ == "__main__":
    main()
