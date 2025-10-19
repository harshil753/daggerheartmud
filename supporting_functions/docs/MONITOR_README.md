# Gemini API Usage Monitor

This directory contains scripts to monitor your Gemini API usage, track token consumption, and help you stay within your limits.

## Files

- `monitor_gemini_usage.py` - Full monitoring with Google Cloud Monitoring API
- `simple_gemini_monitor.py` - Simple monitoring with direct API calls
- `requirements_monitor.txt` - Python dependencies
- `MONITOR_README.md` - This documentation

## Quick Start (Recommended)

### 1. Install Dependencies

```bash
pip install google-generativeai requests pandas
```

### 2. Set Your API Key

```bash
export GEMINI_API_KEY="your-api-key-here"
```

### 3. Run Simple Monitor

```bash
python simple_gemini_monitor.py
```

This will:
- Make test API calls to track usage
- Simulate game-like usage patterns
- Export data to `Usage/usage.csv` and `Usage/usage.json`
- Show cost analysis and optimization tips

## Advanced Monitoring

### Full Google Cloud Monitoring Setup

For comprehensive monitoring with historical data:

1. **Enable Google Cloud Monitoring API**
2. **Set up authentication**
3. **Run the full monitor**

```bash
# Install additional dependencies
pip install -r requirements_monitor.txt

# Set up authentication (one-time)
gcloud auth application-default login

# Set your project ID
export GOOGLE_CLOUD_PROJECT_ID="your-project-id"

# Run full monitoring
python monitor_gemini_usage.py
```

## Output Files

### CSV Format (`Usage/usage.csv`)
Contains detailed usage records with columns:
- `timestamp` - When the API call was made
- `request_type` - Type of API request
- `model` - Model used (e.g., gemini-2.5-flash)
- `estimated_input_tokens` - Input token count
- `estimated_output_tokens` - Output token count
- `total_cost` - Cost of the request
- `duration_seconds` - Response time
- `success` - Whether the call succeeded

### JSON Format (`Usage/usage.json`)
Contains:
- **Analysis** - Usage statistics and patterns
- **Quota Info** - Current limits and usage
- **Usage Data** - Raw usage records
- **Summary** - High-level metrics

## Cost Tracking

The monitor estimates costs based on Gemini pricing:
- **Input tokens**: $0.000075 per 1K tokens
- **Output tokens**: $0.0003 per 1K tokens

## Usage Patterns

### Game Simulation
The simple monitor can simulate typical game usage:
- Character creation prompts
- Combat descriptions
- NPC interactions
- Inventory management
- Help commands

### Real Game Monitoring
To monitor your actual MUD game:

1. **Run the monitor before starting your game**
2. **Make API calls through your game**
3. **Run the monitor again to see usage**

## Cost Optimization Tips

Based on the analysis, the monitor provides tips:

1. **Use shorter prompts** when possible
2. **Cache AI responses** for repeated scenarios
3. **Implement conversation history limits**
4. **Consider cheaper models** for simple tasks
5. **Monitor peak usage hours**

## Quota Management

The monitor tracks:
- **Requests per minute** (typically 15)
- **Tokens per minute** (typically 1M)
- **Daily limits** (varies by plan)
- **Current usage** vs limits

## Troubleshooting

### Common Issues

1. **"No usage data found"**
   - Make sure you've made API calls recently
   - Check your API key is correct
   - Verify you have quota remaining

2. **"Authentication failed"**
   - Run `gcloud auth application-default login`
   - Check your project ID is correct
   - Ensure Monitoring API is enabled

3. **"Permission denied"**
   - Check your service account has monitoring permissions
   - Verify your project has the required APIs enabled

### Getting Help

1. **Check API status**: https://status.cloud.google.com/
2. **Review quotas**: https://console.cloud.google.com/iam-admin/quotas
3. **Monitor usage**: https://console.cloud.google.com/monitoring

## Example Output

```
📊 GEMINI API USAGE SUMMARY
============================================================
📞 Total API Calls: 6
✅ Successful Calls: 6
❌ Failed Calls: 0
📈 Success Rate: 100.0%
🔢 Total Tokens: 2,847
💰 Total Cost: $0.000852
📊 Avg Tokens/Call: 475
💵 Avg Cost/Call: $0.000142
📅 Est. Daily Cost: $0.02
📅 Est. Monthly Cost: $0.61

💡 Cost Optimization Tips:
   - Use shorter prompts when possible
   - Cache AI responses for repeated scenarios
   - Implement conversation history limits
   - Consider using cheaper models for simple tasks
```

## Integration with Your MUD

To integrate monitoring with your MUD game:

1. **Add monitoring calls** to your backend
2. **Track usage** in your game state
3. **Set up alerts** for quota limits
4. **Monitor costs** in real-time

Example integration:
```python
# In your backend
from supporting_functions.simple_gemini_monitor import SimpleGeminiMonitor

monitor = SimpleGeminiMonitor(api_key)
# Track each AI call
usage = monitor.test_api_call(prompt)
```

This helps you stay within budget and optimize your AI usage! 🎮💰
