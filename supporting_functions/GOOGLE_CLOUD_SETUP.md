# Google Cloud Credentials Setup Guide

## Step 1: Create Service Account

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**: `daggerheartmud`
3. **Navigate to IAM & Admin > Service Accounts**:
   - URL: https://console.cloud.google.com/iam-admin/serviceaccounts
4. **Create Service Account**:
   - Click "Create Service Account"
   - Name: `gemini-monitoring-service`
   - Description: `Service account for Gemini API usage monitoring`
   - Click "Create and Continue"

## Step 2: Assign Permissions

Add these roles to the service account:
- `Monitoring Viewer` - to read monitoring data
- `Cloud Monitoring API User` - to access monitoring APIs
- Click "Continue"

## Step 3: Create and Download Key

1. **Create Key**:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Click "Create"
   - **Save the downloaded JSON file as**: `gemini-monitoring-key.json`

## Step 4: Place Credentials File

1. **Move the JSON file** to: `supporting_functions/credentials/gemini-monitoring-key.json`
2. **Update your backend/.env file** to include:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=../supporting_functions/credentials/gemini-monitoring-key.json
   ```

## Step 5: Enable Required APIs

1. **Go to APIs & Services**: https://console.cloud.google.com/apis/library
2. **Enable these APIs**:
   - Cloud Monitoring API
   - Generative Language API (if not already enabled)

## Step 6: Test the Setup

Run the monitoring script:
```bash
python supporting_functions/monitor_gemini_usage.py
```

## Troubleshooting

### Common Issues:

1. **"Default credentials not found"**
   - Make sure `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
   - Verify the JSON file path is correct

2. **"Permission denied"**
   - Ensure the service account has the required roles
   - Check that the APIs are enabled

3. **"Project not found"**
   - Verify your project ID in the `.env` file
   - Make sure you're using the correct project

### File Structure:
```
daggerheartmud/
├── backend/
│   └── .env (contains GOOGLE_APPLICATION_CREDENTIALS)
└── supporting_functions/
    ├── credentials/
    │   └── gemini-monitoring-key.json
    └── monitor_gemini_usage.py
```
