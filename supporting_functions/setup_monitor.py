#!/usr/bin/env python3
"""
Setup script for Gemini Usage Monitor
=====================================

This script helps you set up the monitoring environment quickly.
"""

import os
import sys
import subprocess

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements_simple.txt"])
        print("✅ Requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False

def check_api_key():
    """Check if API key is set"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if api_key:
        print("✅ GEMINI_API_KEY environment variable is set")
        return True
    else:
        print("⚠️  GEMINI_API_KEY environment variable not found")
        print("   You can set it with: export GEMINI_API_KEY='your-key-here'")
        return False

def create_usage_directory():
    """Create Usage directory"""
    usage_dir = "Usage"
    if not os.path.exists(usage_dir):
        os.makedirs(usage_dir)
        print(f"✅ Created {usage_dir}/ directory")
    else:
        print(f"✅ {usage_dir}/ directory already exists")

def main():
    """Main setup function"""
    print("🚀 Setting up Gemini Usage Monitor...")
    print("=" * 40)
    
    # Install requirements
    if not install_requirements():
        print("❌ Setup failed - could not install requirements")
        return
    
    # Check API key
    api_key_set = check_api_key()
    
    # Create directories
    create_usage_directory()
    
    print("\n" + "=" * 40)
    print("🎉 Setup Complete!")
    print("=" * 40)
    
    if api_key_set:
        print("\n✅ Ready to run monitoring!")
        print("   Run: python simple_gemini_monitor.py")
    else:
        print("\n⚠️  Set your API key first:")
        print("   export GEMINI_API_KEY='your-key-here'")
        print("   Then run: python simple_gemini_monitor.py")
    
    print("\n📁 Files created:")
    print("   - Usage/ (monitoring output directory)")
    print("   - requirements_simple.txt")
    print("   - simple_gemini_monitor.py")
    print("   - MONITOR_README.md")

if __name__ == "__main__":
    main()
