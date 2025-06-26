# Hotel Content API Setup Guide

## Overview

This guide explains how to set up and use the hotel content API integration in your Travel Admin Dashboard. The system provides hotel search functionality with multiple data sources and automatic direct booking recommendations.

## Architecture

```
Browser → Hotel Proxy Server (port 3002) → TripAdvisor/Foursquare APIs → Hotel Data
```

## API Sources

### 1. TripAdvisor Content API (Primary)
- **Type**: Free content API for qualified applications
- **Coverage**: 7.5M+ venues, 1B+ reviews in 29 languages
- **Data**: Hotel details, ratings, reviews, location information
- **Rate Limits**: Generous for content access

### 2. Foursquare Places API (Fallback)
- **Type**: Free tier available
- **Coverage**: 105M+ points of interest globally
- **Data**: Hotel location, basic details, user tips
- **Categories**: Supports hotel category filtering (19014)

### 3. Mock Data (Development Fallback)
- **Purpose**: Testing and development when APIs are unavailable
- **Data**: Sample hotels with major chain examples

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the `travelAdmin` directory:

```bash
# TripAdvisor Content API (Optional - will fallback to Foursquare/Mock)
TRIPADVISOR_API_KEY=your_tripadvisor_api_key_here

# Foursquare Places API (Optional - will fallback to Mock)
FOURSQUARE_API_KEY=your_foursquare_api_key_here

# Hotel Proxy Server Port (Optional - defaults to 3002)
HOTEL_PROXY_PORT=3002
```

### 2. Install Dependencies (Already Done)

The hotel proxy server uses the same dependencies as the flight proxy:

```bash
cd travelAdmin
npm install
# Dependencies: express, cors, node-fetch, dotenv
```

### 3. Start the Hotel Proxy Server

```bash
# Start hotel proxy server
npm run start:hotel

# Or for development with auto-reload
npm run dev:hotel
```

The server will start on `http://localhost:3002`

### 4. Start the Admin Dashboard

```bash
# In another terminal, start the web server
python3 -m http.server 8000

# Then open: http://localhost:8000/admin-dashboard.html
```

## API Endpoints

### Hotel Search
```
GET /api/hotels/search?location=NYC&checkIn=2024-07-01&checkOut=2024-07-03&guests=2
```

**Parameters:**
- `location` (required): City name or address to search
- `checkIn` (required): Check-in date (YYYY-MM-DD format)
- `checkOut` (required): Check-out date (YYYY-MM-DD format)
- `guests` (optional): Number of guests (default: 2)

**Response:**
```json
{
  "success": true,
  "hotels": [
    {
      "id": "hotel_123",
      "name": "Marriott Hotel NYC",
      "address": "123 Main Street, New York, NY",
      "rating": 4.2,
      "numReviews": 1247,
      "priceLevel": "$$$",
      "hotelChain": "marriott",
      "directBookingUrl": "https://www.marriott.com/...",
      "bookingInstructions": "Book direct with Marriott for Bonvoy points",
      "phone": "+1-555-0123",
      "website": "https://www.marriott.com",
      "amenities": ["WiFi", "Pool", "Gym", "Business Center"],
      "source": "tripadvisor"
    }
  ],
  "source": "tripadvisor",
  "searchParams": {
    "location": "NYC",
    "checkIn": "2024-07-01",
    "checkOut": "2024-07-03",
    "guests": 2
  }
}
```

### Health Check
```
GET /api/health
```

## Using the Hotel Search Feature

### 1. Access the Feature

1. Open the admin dashboard: `http://localhost:8000/admin-dashboard.html`
2. Navigate to the "Accommodations" tab in the itinerary builder
3. Click the "🏨 Search Hotels" button

### 2. Search for Hotels

1. **Enter Location**: City name, neighborhood, or specific address
2. **Select Dates**: Check-in and check-out dates
3. **Choose Guests**: Number of guests (1-5+)
4. **Click Search**: The system will search across available APIs

### 3. Review Results

Hotels are displayed with:
- **Hotel Name** and chain affiliation
- **Star Rating** and review count
- **Price Level** ($ to $$$$)
- **Address** and location
- **Amenities** (top 3 shown)
- **Booking Instructions** (direct vs. platform recommendations)

### 4. Select a Hotel

1. **Click "Select Hotel"** or click anywhere on the hotel card
2. The hotel will be automatically added to your accommodations
3. All fields will be pre-populated:
   - Hotel name and location
   - Check-in/check-out dates
   - Estimated cost based on price level
   - Booking URL and instructions
   - Contact information

## Direct Booking Integration

### Supported Hotel Chains

The system automatically generates direct booking URLs for:

- **Marriott**: Bonvoy program, points earning
- **Hilton**: Honors program, elite benefits
- **Hyatt**: World of Hyatt, award nights
- **IHG**: Rewards Club, member rates
- **Accor**: ALL program, loyalty benefits

### Booking Recommendations

**When Direct Booking is Recommended:**
- Major hotel chains (loyalty benefits)
- Higher-tier hotels (better cancellation policies)
- Points earning opportunities

**When Platform Booking is Suggested:**
- Independent hotels
- Price-sensitive bookings
- Limited direct booking benefits

## Troubleshooting

### Hotel Proxy Server Not Starting

1. **Check Port Availability**:
   ```bash
   lsof -i :3002
   # Kill any existing processes if needed
   ```

2. **Verify Dependencies**:
   ```bash
   cd travelAdmin
   npm install
   ```

3. **Check Environment Variables**:
   ```bash
   # Verify .env file exists and has correct format
   cat .env
   ```

### No Hotel Results

1. **Check Server Status**:
   - Open browser console (F12)
   - Look for API calls to `localhost:3002`
   - Check for CORS or connection errors

2. **Try Different Search Terms**:
   - Use major city names (e.g., "New York", "Paris")
   - Avoid very specific addresses for broader results
   - Check date format (YYYY-MM-DD)

3. **API Fallback Behavior**:
   - TripAdvisor API → Foursquare API → Mock Data
   - Check console logs for which API is being used

### API Key Issues

1. **TripAdvisor API**:
   - Apply at: https://developer-tripadvisor.com/
   - Content API has generous free tier
   - May take 1-2 business days for approval

2. **Foursquare API**:
   - Sign up at: https://developer.foursquare.com/
   - 1000 free API calls per day
   - Instant approval

3. **Mock Data Fallback**:
   - Always available for testing
   - Provides 3 sample hotels per search
   - Useful for development and demos

## Integration with iOS App

The hotel search results are automatically formatted to match the existing `AccommodationDetails` data model in your iOS app:

```swift
struct AccommodationDetails: Identifiable, Codable {
    let id: String
    let name: String
    let type: AccommodationType
    let checkIn: String
    let checkOut: String
    let nights: Int
    let location: ActivityLocation
    let roomType: String
    let amenities: [String]
    let cost: FlexibleCost
    let bookingUrl: String?
    let bookingInstructions: String
    let cancellationPolicy: String
    let contactInfo: ContactInfo
}
```

## Cost Estimation

The system estimates hotel costs based on price levels:

| Price Level | Estimated Cost per Night |
|-------------|-------------------------|
| $           | $80                     |
| $$          | $150                    |
| $$$         | $250                    |
| $$$$        | $400+                   |

These estimates are used for budget planning and can be manually adjusted in the accommodation form.

## Security Best Practices

1. **API Keys**: Never commit API keys to source control
2. **Environment Variables**: Use `.env` file for sensitive data
3. **Proxy Server**: Keeps API keys server-side, prevents browser exposure
4. **CORS**: Proxy server handles cross-origin requests securely

## Monitoring and Analytics

### Server Logs

The hotel proxy server provides detailed logging:

```bash
# Start server with logging
npm run start:hotel

# Console output shows:
🏨 Hotel Proxy Server running on http://localhost:3002
🔑 TripAdvisor API Key: Configured/Not configured
🔑 Foursquare API Key: Configured/Not configured
```

### API Usage Tracking

Monitor API calls in the browser console:
- ✅ Successful API calls
- ❌ Failed API calls with error details
- ℹ️ Fallback behavior notifications

## Future Enhancements

### Planned Features

1. **Real-time Pricing**: Integration with booking APIs for live rates
2. **Room Type Selection**: Specific room categories and amenities
3. **Availability Filtering**: Real-time availability checking
4. **Photo Integration**: Hotel images from content APIs
5. **Points Calculation**: Integration with loyalty program APIs

### API Expansion

1. **Additional Sources**: 
   - Amadeus Hotel Search API
   - Booking.com Partner API
   - Google Travel Partner API

2. **Enhanced Data**:
   - Real-time availability
   - Live pricing feeds
   - Detailed room information
   - Guest reviews and ratings

## Support

For technical issues or questions:

1. **Check Console Logs**: Browser developer tools for client-side issues
2. **Server Logs**: Terminal output for server-side debugging
3. **API Documentation**: TripAdvisor and Foursquare developer portals
4. **Fallback Testing**: Verify mock data functionality when APIs are unavailable