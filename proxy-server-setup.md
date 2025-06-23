# FlightAware Proxy Server Setup 🚀

## The CORS Issue

**Problem**: FlightAware API blocks direct browser calls due to CORS (Cross-Origin Resource Sharing) restrictions.

**Solution**: Local proxy server that runs on your machine and forwards requests to FlightAware.

## Quick Setup (5 minutes)

### Step 1: Install Node.js Dependencies

Open terminal in the `travelAdmin` folder and run:

```bash
# Install the required packages
npm install

# Alternative: Install individually
npm install express cors node-fetch
```

### Step 2: Start the Proxy Server

```bash
# Start the server
npm start

# Or run directly
node flight-proxy-server.js
```

You should see:
```
🚀 FlightAware proxy server running on http://localhost:3001
📡 API endpoint: http://localhost:3001/api/flight/{flightNumber}?date={YYYY-MM-DD}
🏥 Health check: http://localhost:3001/api/health
```

### Step 3: Test Your Admin Dashboard

1. **Keep the proxy server running** in one terminal
2. **Open your admin dashboard** in a browser
3. **Test flight auto-fill** with real flight numbers like `UA123`

## How It Works

### Architecture:
```
Browser ──→ Local Proxy Server ──→ FlightAware API
        ←──                    ←──
```

1. **Your admin dashboard** makes requests to `localhost:3001`
2. **Proxy server** forwards requests to FlightAware with your API key
3. **FlightAware** returns data to proxy server
4. **Proxy server** sends data back to your browser

### Smart Fallback:
- ✅ **Proxy server running** → Real FlightAware data
- ❌ **Proxy server stopped** → Automatic mock data fallback
- 🔄 **Always works** → Perfect for demos and development

## Testing the Integration

### Test Real Flight Data:
1. Start proxy server: `npm start`
2. Try these flights in your admin dashboard:
   - `UA123` with today's date
   - `AA456` with yesterday's date
   - `DL789` with any recent date

### Expected Console Output:
```
✅ Proxy server is running, making FlightAware API call...
✅ Raw FlightAware API response: { "flights": [...] }
✅ Successfully parsed FlightAware flight data
```

### Test Mock Data Fallback:
1. Stop proxy server (Ctrl+C)
2. Try any flight number
3. Should automatically use mock data

## Production Deployment

### Option 1: Simple Server (Current)
**Pros**: Easy setup, works immediately
**Cons**: Need to run server locally

### Option 2: Cloud Function
Deploy the proxy as a serverless function:
- Vercel Functions
- AWS Lambda
- Google Cloud Functions
- Netlify Functions

### Option 3: Backend Integration
Add the proxy endpoint to your existing backend server.

## Troubleshooting

### Common Issues:

1. **"npm: command not found"**
   - Install Node.js from nodejs.org
   - Restart terminal after installation

2. **"Cannot find module 'express'"**
   - Run `npm install` in the travelAdmin folder
   - Make sure package.json exists

3. **"Port 3001 already in use"**
   - Change PORT in flight-proxy-server.js
   - Update proxyUrl in admin-dashboard.html

4. **"Proxy server not running"**
   - Check if server is started: `npm start`
   - Verify health check: http://localhost:3001/api/health

### Debug Commands:

```bash
# Check if server is running
curl http://localhost:3001/api/health

# Test flight lookup directly
curl "http://localhost:3001/api/flight/UA123?date=2024-01-15"
```

## Files Created

1. **`flight-proxy-server.js`** - Main proxy server code
2. **`package.json`** - Node.js dependencies
3. **Updated `admin-dashboard.html`** - Uses proxy instead of direct API

## Benefits

### ✅ Real Flight Data:
- Live FlightAware API integration
- $5/month credit for hundreds of calls
- Professional aviation data
- Real-time flight tracking

### ✅ Seamless Fallback:
- Automatic mock data when proxy is down
- Always works for demos
- No interrupted workflow

### ✅ Development Friendly:
- Easy to start/stop
- Clear console logging
- Health check endpoint
- CORS issues solved

## Usage Summary

### During Development:
1. Run `npm start` in terminal
2. Use admin dashboard normally
3. Get real flight data automatically

### For Demos:
- Can run with or without proxy server
- Always works perfectly
- Real data when available, mock data as fallback

### For Production:
- Deploy proxy to cloud platform
- Update proxyUrl to production endpoint
- Scale as needed

Your FlightAware integration is now ready with real API data! 🎉