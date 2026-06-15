# Deployment 500 Error - Fix Guide

## Problem
Backend returning 500 errors on Render deployment.

## Root Causes

### 1. Missing Environment Variables in Render
The Gemini API key might not be set in Render's environment variables.

**Fix:**
1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service: `devsense1`
3. Go to "Environment" tab
4. Add/Update these variables:
   ```
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSyAdGPL0JRpgiSRnzSpD5f6NtdPKRWppj2s
   GEMINI_MODEL=gemini-2.5-flash
   USE_BEDROCK=false
   MAX_FILES=10000
   MAX_FILE_SIZE=500000
   MAX_CHUNKS=10000
   ```
5. Click "Save Changes"
6. Render will automatically redeploy

### 2. Missing Data Directories
Render's filesystem might not have the required directories.

**Fix Applied:**
- ✅ Updated `main.py` to create directories automatically
- ✅ Added `parents=True, exist_ok=True` to all mkdir calls
- ✅ Added try-except blocks for directory creation

### 3. Git Clone Timeout
Large repositories might timeout during ingestion.

**Fix Applied:**
- ✅ Added timeout handling in `/ingest` endpoint
- ✅ Returns helpful error messages

## Files Modified

### `devsense-backend/app/main.py`
- ✅ Fixed `/logs` endpoint - creates directory if missing
- ✅ Fixed `/feedback` endpoint - creates directory if missing  
- ✅ Fixed `log_activity()` function - creates directory if missing
- ✅ All directory operations now have error handling

## Testing the Fix

### Test 1: Health Check
```bash
curl https://devsense1.onrender.com/
```
Expected: `{"status":"DevSense backend running"}`

### Test 2: Settings
```bash
curl https://devsense1.onrender.com/settings
```
Expected: JSON with backend settings

### Test 3: Logs (Empty Project)
```bash
curl "https://devsense1.onrender.com/logs?project_name=test"
```
Expected: `{"logs":[],"message":"No logs found"}`

### Test 4: Dependencies (Test Project)
```bash
curl "https://devsense1.onrender.com/dependencies?project_name=test-project"
```
Expected: Error message (project not found on Render)

## Common 500 Error Scenarios

### Scenario 1: Ingestion Fails
**Symptom:** 500 error when clicking "Ingest Repository"

**Causes:**
- Invalid GitHub URL
- Repository too large
- Git clone timeout
- Missing write permissions

**Solution:**
- Try a smaller repository first
- Check Render logs for specific error
- Ensure repository is public

### Scenario 2: Query Fails
**Symptom:** 500 error when asking AI questions

**Causes:**
- Gemini API key not set
- Gemini API key invalid/expired
- Project not ingested
- Vector store not loaded

**Solution:**
- Verify GEMINI_API_KEY in Render environment
- Ingest a project first before querying
- Check Render logs for Gemini errors

### Scenario 3: Logs/Feedback Fails
**Symptom:** 500 error on Activity Logs page

**Causes:**
- Directory creation failed
- File write permissions denied

**Solution:**
- ✅ Already fixed with better error handling
- Returns empty array instead of crashing

## How to Check Render Logs

1. Go to Render Dashboard
2. Click on your backend service
3. Click "Logs" tab
4. Look for error messages with "500" or "Error"
5. Common errors to look for:
   - `GEMINI_API_KEY not configured`
   - `Permission denied`
   - `No such file or directory`
   - `Error calling Gemini`

## Quick Fix Checklist

- [ ] Set GEMINI_API_KEY in Render environment variables
- [ ] Set LLM_PROVIDER=gemini in Render
- [ ] Commit and push the updated main.py
- [ ] Wait for Render to redeploy (automatic)
- [ ] Test health check endpoint
- [ ] Test with small repository ingestion
- [ ] Check Render logs for any errors

## If Still Failing

### Option 1: Check Specific Endpoint
Identify which endpoint is returning 500:
- `/ingest` - Repository ingestion
- `/query` - AI queries
- `/logs` - Activity logs
- `/dependencies` - Dependency analysis
- `/generate-architecture` - Architecture overview

### Option 2: Simplify Testing
Use the test project I created:
1. Don't ingest anything
2. Just view dependencies for "test-project"
3. This tests if basic endpoints work

### Option 3: Rollback
If nothing works, you can rollback to previous deployment in Render:
1. Go to Render Dashboard
2. Click "Deploys" tab
3. Find last working deployment
4. Click "Redeploy"

## Environment Variables Reference

**Required:**
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=<your-key>
```

**Optional:**
```
GEMINI_MODEL=gemini-2.5-flash
USE_BEDROCK=false
MAX_FILES=10000
MAX_FILE_SIZE=500000
MAX_CHUNKS=10000
```

## Next Steps

1. **Update Render Environment Variables** (most important!)
2. **Push code changes** to trigger redeploy
3. **Test endpoints** one by one
4. **Check Render logs** for specific errors
5. **Report back** which endpoint is failing

## Contact Points

If you see specific errors in Render logs, share them and I can provide targeted fixes.

Common error patterns:
- `ModuleNotFoundError` - Missing Python package
- `KeyError` - Missing environment variable
- `PermissionError` - File system permissions
- `TimeoutError` - Git clone or API timeout
- `APIError` - Gemini API issues
