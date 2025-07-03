# Travel Admin Dashboard

A comprehensive admin dashboard for managing travel recommendations and itineraries. This dashboard provides travel consultants with tools to create detailed, multi-destination trip recommendations with flights, hotels, activities, and restaurant suggestions.

## Features

### 🌍 Multi-Destination Trip Planning
- Support for complex, multi-city itineraries
- Destination-based organization with arrival/departure dates
- Flexible date handling for client preferences

### ✈️ Transportation Management
- Flight search integration via SerpAPI Google Flights
- Multiple transport options (flights, trains, buses, car rentals)
- Points/cash/hybrid payment support
- Real-time pricing and booking information

### 🏨 Accommodation Options
- Multiple hotel recommendations per destination
- Hotel search integration with live availability
- Flexible cost structure (cash, points, hybrid payments)
- Detailed booking and cancellation information

### 🎯 Activity & Restaurant Recommendations
- Destination-based activity suggestions (not day-by-day scheduling)
- Restaurant recommendations by cuisine and meal type
- Priority levels (Must-See, Recommended, If Time Permits)
- Booking requirements and insider tips

### 💰 Cost Management
- Automatic cost calculation (transportation + accommodations)
- Support for points, cash, and hybrid payments
- Flexible cost structures for all trip components

### 👥 User Management
- User points tracking (credit card, hotel, airline points)
- Complete trip intake form viewing
- Admin authentication and access control

## Technology Stack

- **Frontend**: React (via Babel transpilation), HTML5, CSS3
- **Backend**: Firebase Firestore for data storage
- **APIs**: 
  - SerpAPI for flight search
  - Hotel booking API integration
  - TripAdvisor API integration
- **Authentication**: Firebase Auth
- **Real-time Updates**: Firebase real-time listeners

## File Structure

```
travelAdmin/
├── README.md                              # This file
├── start-services.sh                      # Main startup script
├── destination-based-admin.template.html  # Main dashboard template
├── admin-dashboard.html                   # Generated dashboard (Git ignored)
├── admin-dashboard.template.html          # Legacy template
├── hotel-proxy-server.js                 # Hotel API proxy
├── serpapi-proxy-server.js               # Flight search proxy
├── package.json                          # Node.js dependencies
├── .env                                   # Environment variables (Git ignored)
└── docs/
    ├── HOTEL_WORKFLOW.md                  # Hotel integration guide
    ├── hotel-api-setup.md                 # Hotel API setup
    ├── aviationstack-setup.md             # Flight API setup
    ├── proxy-server-setup.md              # Proxy server guide
    └── security-best-practices.md         # Security guidelines
```

## Quick Start

### Prerequisites
- Node.js and npm installed
- Python 3 installed
- Firebase project configured
- Required API keys (see Environment Setup)

### Environment Setup

1. Create a `.env` file in the `travelAdmin` directory:
```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here

# API Keys
SERPAPI_KEY=your_serpapi_key_here
HOTEL_API_KEY=your_hotel_api_key_here
TRIPADVISOR_API_KEY=your_tripadvisor_api_key_here

# Optional: API rate limiting
SERPAPI_RATE_LIMIT=100
HOTEL_API_RATE_LIMIT=1000
```

2. Install dependencies:
```bash
npm install
```

3. Start all services:
```bash
./start-services.sh
```

This will:
- Generate the admin dashboard with API keys injected
- Start the hotel API proxy server (port 3002)
- Start the SerpAPI proxy server (port 3003)  
- Start the HTTP server (port 8000)
- Display the dashboard at: http://localhost:8000/admin-dashboard.html

## Dashboard Tabs

### 1. Overview Tab
- Trip summary and overview description
- High-level trip information
- Client preferences and requirements

### 2. Destinations Tab
- Add/edit destination cities
- Set arrival and departure dates
- Manage accommodation options per destination
- Hotel search and selection tools

### 3. Activities Tab
- **Activity Recommendations**: Curated suggestions by destination
- **Restaurant Recommendations**: Dining options by cuisine and meal type
- Priority-based recommendations (Must-See, Recommended, If Time Permits)
- No day-by-day scheduling - let clients plan their own itinerary

### 4. Logistics Tab
- Inter-city transportation planning
- Flight search with real-time pricing
- Multiple transport options per route
- Booking management and references

### 5. Costs Tab
- Automatic cost calculation
- Transportation + accommodation totals only
- Excludes activities (recommendation-only approach)
- Support for points/cash/hybrid payments

## Data Structure

The dashboard uses a destination-based data structure optimized for multi-city trips:

```javascript
{
  destinations: [
    {
      cityName: "Barcelona",
      arrivalDate: "2024-03-15",
      departureDate: "2024-03-18",
      accommodationOptions: [...],
      recommendedActivities: [...],
      recommendedRestaurants: [...]
    }
  ],
  logistics: {
    transportSegments: [...]
  },
  totalCost: {
    accommodation: 1200,
    flights: 800,
    total: 2000
  }
}
```

## iOS App Integration

The dashboard generates data structures compatible with the iOS travel app:

- **Data Models**: Matches Swift `DataModels.swift` structures
- **Flexible Costs**: Support for `FlexibleCost` payment types
- **User Points**: Integration with `UserPointsProfile` system
- **Trip Status**: Compatible with `TravelTrip` lifecycle management

## API Integration

### Flight Search (SerpAPI)
- Real-time Google Flights data
- Multiple airline options
- Price tracking and alerts
- Booking link generation

### Hotel Search
- Live availability checking
- Multiple booking platforms
- Price comparison
- Reviews and ratings integration

### Security Features
- API key injection (not stored in Git)
- Proxy servers for rate limiting
- Admin-only access control
- Secure Firebase authentication

## Development Workflow

### Template System
The dashboard uses a template-based approach for security:

1. **Template File**: `destination-based-admin.template.html` (committed to Git)
2. **Generated File**: `admin-dashboard.html` (Git ignored)
3. **API Injection**: Environment variables injected at runtime

### Making Changes
1. Edit the template file: `destination-based-admin.template.html`
2. Restart services: `./start-services.sh`
3. Test at: http://localhost:8000/admin-dashboard.html

### Adding New Features
1. Update helper functions (createEmpty... functions)
2. Add new tab components as needed
3. Update data structure and iOS compatibility
4. Test with real data and user flows

## Troubleshooting

### Common Issues

**Dashboard not loading**: Check that all services started successfully and ports are available

**API errors**: Verify `.env` file contains valid API keys

**Data not saving**: Check Firebase console for authentication and database rules

**Hotel search failing**: Verify hotel proxy server is running on port 3002

### Logs and Monitoring
- Check browser console for JavaScript errors
- Monitor proxy server logs for API issues
- Use Firebase console for database and auth debugging

## Contributing

When making changes:
1. Always edit the `.template.html` file, never the generated `.html` file
2. Test with multiple destinations and trip scenarios
3. Verify iOS app compatibility
4. Update documentation as needed

## Security Notes

- Never commit API keys to Git
- Use proxy servers for external API calls
- Implement proper access controls
- Follow security best practices in `docs/security-best-practices.md`

## Support

For issues or questions:
1. Check the documentation in the `docs/` folder
2. Review Firebase console for data/auth issues
3. Check API rate limits and quotas
4. Verify all services are running properly

---

**Dashboard URL**: http://localhost:8000/admin-dashboard.html  
**Admin Access**: Restricted to authorized email addresses  
**Data Storage**: Firebase Firestore with real-time sync