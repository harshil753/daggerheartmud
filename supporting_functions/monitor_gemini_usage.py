#!/usr/bin/env python3
"""
Gemini API Usage Monitor
========================

This script monitors your Gemini API usage to help track token consumption,
costs, and ensure you stay within your limits. It fetches usage data from
Google Cloud Console and exports it to CSV and JSON formats.

Requirements:
- google-cloud-monitoring library
- google-auth library
- Service account with monitoring permissions

Usage:
    python monitor_gemini_usage.py

Output:
    - Usage/usage.csv
    - Usage/usage.json
"""

import os
import json
import csv
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import requests
from google.auth import default
from google.cloud import monitoring_v3
from google.cloud.monitoring_v3 import query
import pandas as pd
from dotenv import load_dotenv

class GeminiUsageMonitor:
    def __init__(self, project_id: str, api_key: str):
        """
        Initialize the Gemini Usage Monitor
        
        Args:
            project_id: Google Cloud Project ID
            api_key: Gemini API Key for direct API calls
        """
        self.project_id = project_id
        self.api_key = api_key
        self.client = monitoring_v3.MetricServiceClient()
        self.project_name = f"projects/{project_id}"
        
        # Create Usage directory if it doesn't exist
        self.usage_dir = "Usage"
        os.makedirs(self.usage_dir, exist_ok=True)
        
    def get_api_usage_via_rest(self, days_back: int = 7) -> List[Dict[str, Any]]:
        """
        Get API usage data via REST API calls to Gemini API
        This method makes direct calls to track usage in real-time
        """
        print("🔍 Fetching API usage via REST API...")
        
        usage_data = []
        current_time = datetime.now()
        
        # Note: Gemini API doesn't provide direct usage history via REST
        # This is a placeholder for future implementation
        # For now, we'll use the monitoring API approach
        
        print("⚠️  Note: Direct REST API usage tracking not available for Gemini")
        print("   Using Google Cloud Monitoring API instead...")
        
        return usage_data
    
    def get_api_usage_via_monitoring(self, days_back: int = 7) -> List[Dict[str, Any]]:
        """
        Get API usage data via Google Cloud Monitoring API
        """
        print("🔍 Fetching API usage via Google Cloud Monitoring...")
        
        try:
            # Set up time range
            end_time = datetime.now()
            start_time = end_time - timedelta(days=days_back)
            
            # Convert to RFC3339 format
            start_time_str = start_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            end_time_str = end_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            
            print(f"📅 Time range: {start_time_str} to {end_time_str}")
            
            # Query for Gemini API metrics
            metrics_to_query = [
                "generativelanguage.googleapis.com/generate_content_requests",
                "generativelanguage.googleapis.com/generate_content_tokens",
                "generativelanguage.googleapis.com/generate_content_paid_tier_input_token_count",
                "generativelanguage.googleapis.com/generate_content_paid_tier_output_token_count",
                "generativelanguage.googleapis.com/generate_content_paid_tier_total_token_count"
            ]
            
            usage_data = []
            
            for metric_type in metrics_to_query:
                print(f"📊 Querying metric: {metric_type}")
                
                try:
                    # Create time series query
                    filter_str = f'metric.type="{metric_type}"'
                    
                    # Execute query
                    request = monitoring_v3.ListTimeSeriesRequest(
                        name=self.project_name,
                        filter=filter_str,
                        interval=monitoring_v3.TimeInterval({
                            "start_time": {"seconds": int(start_time.timestamp())},
                            "end_time": {"seconds": int(end_time.timestamp())}
                        }),
                        view=monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL
                    )
                    
                    response = self.client.list_time_series(request=request)
                    
                    for series in response:
                        for point in series.points:
                            timestamp = datetime.fromtimestamp(point.interval.end_time.seconds)
                            
                            usage_entry = {
                                "timestamp": timestamp.isoformat(),
                                "metric_type": metric_type,
                                "value": float(point.value.double_value) if point.value.double_value else 0,
                                "request_type": "API_CALL",
                                "model": self._extract_model_from_labels(series.resource.labels),
                                "cost_estimate": self._calculate_cost_estimate(metric_type, point.value.double_value),
                                "time_range": f"{start_time_str} to {end_time_str}"
                            }
                            
                            usage_data.append(usage_entry)
                            
                except Exception as e:
                    print(f"⚠️  Error querying {metric_type}: {str(e)}")
                    continue
            
            print(f"✅ Retrieved {len(usage_data)} usage records")
            return usage_data
            
        except Exception as e:
            print(f"❌ Error fetching monitoring data: {str(e)}")
            return []
    
    def _extract_model_from_labels(self, labels) -> str:
        """Extract model name from resource labels"""
        if hasattr(labels, 'get'):
            return labels.get('model', 'unknown')
        return 'unknown'
    
    def _calculate_cost_estimate(self, metric_type: str, value: float) -> float:
        """
        Calculate estimated cost based on metric type and value
        Gemini pricing (as of 2024):
        - Input tokens: $0.000075 per 1K tokens
        - Output tokens: $0.0003 per 1K tokens
        """
        if not value:
            return 0.0
            
        # Convert to thousands of tokens
        tokens_k = value / 1000
        
        if "input_token" in metric_type:
            return tokens_k * 0.000075
        elif "output_token" in metric_type:
            return tokens_k * 0.0003
        elif "total_token" in metric_type:
            # Estimate 70% input, 30% output for total tokens
            input_cost = (tokens_k * 0.7) * 0.000075
            output_cost = (tokens_k * 0.3) * 0.0003
            return input_cost + output_cost
        else:
            return 0.0
    
    def get_quota_limits(self) -> Dict[str, Any]:
        """
        Get current quota limits and usage
        """
        print("📊 Fetching quota limits...")
        
        try:
            # This would require additional API calls to get quota information
            # For now, return estimated limits based on common Gemini quotas
            return {
                "requests_per_minute": 15,
                "tokens_per_minute": 1000000,
                "tokens_per_day": 50000000,
                "requests_per_day": 1000
            }
        except Exception as e:
            print(f"⚠️  Could not fetch quota limits: {str(e)}")
            return {}
    
    def analyze_usage_patterns(self, usage_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze usage patterns and provide insights
        """
        if not usage_data:
            return {}
        
        print("📈 Analyzing usage patterns...")
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(usage_data)
        
        analysis = {
            "total_requests": len(usage_data),
            "total_cost_estimate": sum(entry.get("cost_estimate", 0) for entry in usage_data),
            "average_tokens_per_request": 0,
            "peak_usage_hour": "Unknown",
            "most_used_model": "Unknown",
            "cost_breakdown": {}
        }
        
        if not df.empty:
            # Calculate averages
            if "value" in df.columns:
                analysis["average_tokens_per_request"] = df["value"].mean()
            
            # Find peak usage hour
            if "timestamp" in df.columns:
                df["hour"] = pd.to_datetime(df["timestamp"]).dt.hour
                peak_hour = df["hour"].mode().iloc[0] if not df["hour"].mode().empty else "Unknown"
                analysis["peak_usage_hour"] = f"{peak_hour}:00"
            
            # Find most used model
            if "model" in df.columns:
                most_used = df["model"].mode().iloc[0] if not df["model"].mode().empty else "Unknown"
                analysis["most_used_model"] = most_used
            
            # Cost breakdown by metric type
            if "metric_type" in df.columns and "cost_estimate" in df.columns:
                cost_breakdown = df.groupby("metric_type")["cost_estimate"].sum().to_dict()
                analysis["cost_breakdown"] = cost_breakdown
        
        return analysis
    
    def export_to_csv(self, usage_data: List[Dict[str, Any]], filename: str = "usage.csv"):
        """Export usage data to CSV"""
        if not usage_data:
            print("⚠️  No data to export to CSV")
            return
        
        filepath = os.path.join(self.usage_dir, filename)
        
        try:
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = usage_data[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for row in usage_data:
                    writer.writerow(row)
            
            print(f"✅ CSV exported to: {filepath}")
        except Exception as e:
            print(f"❌ Error exporting CSV: {str(e)}")
    
    def export_to_json(self, usage_data: List[Dict[str, Any]], analysis: Dict[str, Any], filename: str = "usage.json"):
        """Export usage data and analysis to JSON"""
        filepath = os.path.join(self.usage_dir, filename)
        
        try:
            export_data = {
                "export_timestamp": datetime.now().isoformat(),
                "project_id": self.project_id,
                "analysis": analysis,
                "usage_data": usage_data,
                "summary": {
                    "total_records": len(usage_data),
                    "date_range": {
                        "start": min(entry["timestamp"] for entry in usage_data) if usage_data else None,
                        "end": max(entry["timestamp"] for entry in usage_data) if usage_data else None
                    }
                }
            }
            
            with open(filepath, 'w', encoding='utf-8') as jsonfile:
                json.dump(export_data, jsonfile, indent=2, ensure_ascii=False)
            
            print(f"✅ JSON exported to: {filepath}")
        except Exception as e:
            print(f"❌ Error exporting JSON: {str(e)}")
    
    def print_usage_summary(self, analysis: Dict[str, Any]):
        """Print a summary of usage analysis"""
        print("\n" + "="*60)
        print("📊 GEMINI API USAGE SUMMARY")
        print("="*60)
        
        print(f"📈 Total Requests: {analysis.get('total_requests', 0)}")
        print(f"💰 Estimated Total Cost: ${analysis.get('total_cost_estimate', 0):.4f}")
        print(f"📊 Average Tokens per Request: {analysis.get('average_tokens_per_request', 0):.0f}")
        print(f"🕐 Peak Usage Hour: {analysis.get('peak_usage_hour', 'Unknown')}")
        print(f"🤖 Most Used Model: {analysis.get('most_used_model', 'Unknown')}")
        
        if analysis.get('cost_breakdown'):
            print("\n💰 Cost Breakdown by Metric Type:")
            for metric, cost in analysis['cost_breakdown'].items():
                print(f"   {metric}: ${cost:.4f}")
        
        print("="*60)
    
    def run_monitoring(self, days_back: int = 7):
        """Run the complete monitoring process"""
        print("🚀 Starting Gemini API Usage Monitoring...")
        print(f"📅 Monitoring last {days_back} days")
        
        # Get usage data
        usage_data = self.get_api_usage_via_monitoring(days_back)
        
        if not usage_data:
            print("⚠️  No usage data found. This could mean:")
            print("   - No API calls made in the specified time range")
            print("   - Monitoring API not properly configured")
            print("   - Insufficient permissions")
            
            # Create empty files for consistency
            self.export_to_csv([], "usage.csv")
            self.export_to_json([], {}, "usage.json")
            return
        
        # Analyze usage patterns
        analysis = self.analyze_usage_patterns(usage_data)
        
        # Export data
        self.export_to_csv(usage_data, "usage.csv")
        self.export_to_json(usage_data, analysis, "usage.json")
        
        # Print summary
        self.print_usage_summary(analysis)
        
        print(f"\n✅ Monitoring complete! Files saved to: {self.usage_dir}/")
        print("📁 Files created:")
        print(f"   - {self.usage_dir}/usage.csv")
        print(f"   - {self.usage_dir}/usage.json")

def main():
    """Main function"""
    print("🔍 Gemini API Usage Monitor")
    print("=" * 40)
    
    # Load environment variables from backend/.env file
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"✅ Loaded environment variables from: {env_path}")
    else:
        print(f"⚠️  .env file not found at: {env_path}")
        print("   Trying to load from system environment variables...")
    
    # Get configuration from environment variables (matching backend/.env format)
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
    api_key = os.getenv('GEMINI_API_KEY')
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    
    print(f"📋 Project ID: {project_id if project_id else 'NOT FOUND'}")
    print(f"🔑 API Key: {'*' * 10 if api_key else 'NOT FOUND'}")
    print(f"🔐 Credentials: {credentials_path if credentials_path else 'NOT SET'}")
    
    # Check for Google Cloud credentials file
    if credentials_path:
        # Convert relative path to absolute path
        if not os.path.isabs(credentials_path):
            # If it's a relative path, make it relative to the current working directory
            credentials_path = os.path.join(os.getcwd(), credentials_path)
        
        # Normalize the path to handle any .. or . components
        credentials_path = os.path.normpath(credentials_path)
        
        if os.path.exists(credentials_path):
            print(f"✅ Google Cloud credentials file found: {credentials_path}")
            # Set the environment variable to the absolute path for Google Cloud libraries
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
        else:
            print(f"⚠️  Credentials file not found at: {credentials_path}")
            print(f"   Looking for: {os.path.abspath(credentials_path)}")
            print(f"   Current working directory: {os.getcwd()}")
            print(f"   Script directory: {os.path.dirname(__file__)}")
    else:
        print("⚠️  GOOGLE_APPLICATION_CREDENTIALS not set in .env file")
    
    if not project_id or not api_key:
        print("❌ Project ID and API Key are required!")
        print("💡 Make sure your backend/.env file contains:")
        print("   GOOGLE_CLOUD_PROJECT=your_actual_project_id")
        print("   GEMINI_API_KEY=your_gemini_api_key_here")
        print("   GOOGLE_APPLICATION_CREDENTIALS=../supporting_functions/credentials/gemini-monitoring-key.json")
        print("\n📝 Example .env file format:")
        print("   GOOGLE_CLOUD_PROJECT=daggerheartmud")
        print("   GEMINI_API_KEY=your_actual_api_key")
        print("   GOOGLE_APPLICATION_CREDENTIALS=../supporting_functions/credentials/gemini-monitoring-key.json")
        sys.exit(1)
    
    # Create monitor instance
    monitor = GeminiUsageMonitor(project_id, api_key)
    
    # Run monitoring
    try:
        monitor.run_monitoring(days_back=7)
    except Exception as e:
        print(f"❌ Error during monitoring: {str(e)}")
        print("\n💡 Troubleshooting tips:")
        print("   1. Ensure you have Google Cloud Monitoring API enabled")
        print("   2. Check that your service account has monitoring permissions")
        print("   3. Verify your project ID is correct")
        print("   4. Make sure you have made some API calls recently")

if __name__ == "__main__":
    main()
