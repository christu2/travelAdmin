# AviationStack API Setup Guide 🚀

## Step 1: Get Your AviationStack API Key

### 1. Sign up for AviationStack
1. Go to [aviationstack.com](https://aviationstack.com)
2. Click "Get Free API Access"
3. Sign up with your email
4. No credit card required for free tier!

### 2. Get Your API Key
1. Log in to your AviationStack dashboard
2. Your API key will be displayed on the main dashboard
3. Copy your access key (it looks like: `a1b2c3d4e5f6g7h8i9j0`)

## Step 2: Configure Your Admin Dashboard ✅ COMPLETED

### 1. API Key Already Configured
Your AviationStack API key has been added to the admin dashboard:

```javascript
apiKey: 'a483414e703ccc9ae62520d562c93361', // Your active API key
```

**Status**: Ready for real flight data lookups!

### 2. For Production (Recommended)
Create environment variables instead of hardcoding:
- `AVIATIONSTACK_API_KEY`

## Step 3: Test the Integration

### 1. Open your Admin Dashboard
- Load the `admin-dashboard.html` file
- Navigate to a trip and go to the "Flights" tab

### 2. Test Auto-Fill Feature
1. Add a new flight segment
2. Enter a real flight number: `UA123`, `AA1234`, `DL456`
3. Enter a departure date (today or recent date works best)
4. Click the "✈️ Auto-Fill" button

### 3. Expected Behavior
- **Real flights**: API populates with actual flight data
- **Test flights**: Mock data for AA1, UA1, DL1, BA1, LH1, EK1
- **Visual feedback**: Green background on auto-populated fields
- **Status messages**: Clear feedback about data source and success

## Step 4: API Features ✅ ACTIVE

### 1. AviationStack Advantages:
- ✅ 1,000 free calls per month (33 flights/day)
- ✅ Real-time flight data from 13,000+ airports
- ✅ All major airlines included (AA, DL, UA, BA, etc.)
- ✅ Simple REST API (no complex OAuth)
- ✅ US-friendly billing and support
- ✅ No payment method required for free tier

### 2. Current Configuration:
- **Environment**: Production API (api.aviationstack.com)
- **Free Tier**: 1,000 requests/month
- **Coverage**: Global flight data
- **Status**: Ready for real flight lookups

### 3. API Response includes:
- Flight status (scheduled, active, landed, cancelled)
- Departure/arrival times and airports
- Airline information
- Aircraft details
- Real-time tracking data

## Available Features

### Flight Data (1,000 calls/month free):
- **Flight Status** - Real-time flight tracking
- **Flight Schedules** - Departure/arrival times
- **Airport Data** - Airport names and codes
- **Airline Information** - Carrier details
- **Aircraft Data** - Equipment type

## Troubleshooting

### Common Issues:
1. **401 Unauthorized**: Check your API key is correct
2. **403 Forbidden**: Verify you haven't exceeded free tier limit
3. **No flight data found**: Flight might be too old or not in system
4. **CORS errors**: AviationStack supports CORS for frontend apps

### Debug Steps:
1. Check browser console for error messages
2. Verify API key is correct (32 character string)
3. Test with recent/current flights first
4. Check AviationStack dashboard for usage stats

## Next Steps

### Phase 1: Flight Integration ✅ COMPLETED
- [x] Auto-populate flight data from flight number + date
- [x] Live AviationStack API integration
- [x] Mock data fallback for testing
- [x] Comprehensive error handling and user feedback
- [x] Visual indicators for auto-populated fields
- [x] Real-time status feedback

### Phase 2: Enhanced Features (Coming Next)
- [ ] Airport search and autocomplete
- [ ] Flight delay predictions
- [ ] Route optimization suggestions
- [ ] Historical flight data analysis

### Phase 3: Monetization Integration
- [ ] Affiliate booking links
- [ ] Commission tracking
- [ ] Revenue optimization

## Cost Estimation

### Free Tier: 1,000 calls/month
- Approximately 33 flight searches per day
- Perfect for small travel businesses
- No credit card required

### Paid Tiers: Starting at $9.99/month
- 10,000 requests = $9.99/month
- 50,000 requests = $39.99/month
- 100,000 requests = $69.99/month
- ROI: Easily covered by booking commissions

## Support

If you run into issues:
1. Check the [AviationStack Documentation](https://aviationstack.com/documentation)
2. Review browser console errors
3. Test with mock data first before switching to live API
4. Contact AviationStack support (very responsive)

The integration is now ready for real flight data! 🎉

## API Usage Examples

### Successful Response:
```json
{
  "data": [
    {
      "flight_date": "2023-12-01",
      "flight_status": "scheduled",
      "departure": {
        "airport": "Los Angeles International Airport",
        "timezone": "America/Los_Angeles",
        "iata": "LAX",
        "scheduled": "2023-12-01T10:30:00+00:00"
      },
      "arrival": {
        "airport": "John F. Kennedy International Airport", 
        "timezone": "America/New_York",
        "iata": "JFK",
        "scheduled": "2023-12-01T19:15:00+00:00"
      },
      "airline": {
        "name": "American Airlines",
        "iata": "AA"
      },
      "flight": {
        "number": "123",
        "iata": "AA123"
      }
    }
  ]
}
```

### What Gets Auto-Filled:
- **Airline**: "American Airlines"
- **Departure Airport**: "Los Angeles International Airport"
- **Departure Code**: "LAX"
- **Departure Time**: "10:30"
- **Arrival Airport**: "John F. Kennedy International Airport"
- **Arrival Code**: "JFK"
- **Arrival Time**: "19:15"
- **Duration**: "5h 45m" (calculated)