const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.HOTEL_PROXY_PORT || 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// TripAdvisor Content API configuration
const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;
const TRIPADVISOR_BASE_URL = 'https://api.content.tripadvisor.com/api/v1';

// Foursquare Places API configuration (fallback)
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3/places';

// Hotel chain direct booking URL generators
const generateDirectBookingUrl = (hotelChain, hotelName, checkIn, checkOut, guests = 2) => {
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    };

    const checkInFormatted = formatDate(checkIn);
    const checkOutFormatted = formatDate(checkOut);

    const urlMappings = {
        'marriott': `https://www.marriott.com/search/submitSearch.mi?searchType=REP&fromDate=${checkInFormatted}&toDate=${checkOutFormatted}&numRooms=1&roomType=GTD&adults=${guests}`,
        'hilton': `https://www.hilton.com/en/book/reservation/deeplink/?&checkInDate=${checkInFormatted}&checkOutDate=${checkOutFormatted}&rooms=1&adults=${guests}`,
        'hyatt': `https://www.hyatt.com/shop/search?location=${encodeURIComponent(hotelName)}&checkinDate=${checkInFormatted}&checkoutDate=${checkOutFormatted}&rooms=1&adults=${guests}`,
        'ihg': `https://www.ihg.com/hotels/us/en/find-hotels/hotel/rooms?qDest=${encodeURIComponent(hotelName)}&qCiMy=${checkInFormatted.slice(5,7)}&qCiD=${checkInFormatted.slice(8,10)}&qCiY=${checkInFormatted.slice(0,4)}&qCoMy=${checkOutFormatted.slice(5,7)}&qCoD=${checkOutFormatted.slice(8,10)}&qCoY=${checkOutFormatted.slice(0,4)}&qAdlt=${guests}&qChld=0&qRms=1`,
        'accor': `https://all.accor.com/hotel/search/index.en.shtml?destination=${encodeURIComponent(hotelName)}&dateIn=${checkInFormatted}&dateOut=${checkOutFormatted}&adults=${guests}&children=0&rooms=1`
    };

    return urlMappings[hotelChain.toLowerCase()] || null;
};

// Detect hotel chain from hotel name
const detectHotelChain = (hotelName) => {
    const chainKeywords = {
        'marriott': ['marriott', 'courtyard', 'residence inn', 'fairfield', 'springhill', 'ritz-carlton', 'w hotel', 'sheraton', 'westin', 'renaissance', 'autograph'],
        'hilton': ['hilton', 'hampton', 'doubletree', 'embassy suites', 'homewood', 'home2', 'waldorf astoria', 'conrad', 'canopy'],
        'hyatt': ['hyatt', 'grand hyatt', 'park hyatt', 'andaz', 'alila', 'miraval', 'thompson'],
        'ihg': ['holiday inn', 'crowne plaza', 'intercontinental', 'regent', 'six senses', 'vignette', 'avid'],
        'accor': ['sofitel', 'pullman', 'novotel', 'mercure', 'ibis', 'mgallery', 'raffles', 'fairmont']
    };

    const lowerName = hotelName.toLowerCase();
    for (const [chain, keywords] of Object.entries(chainKeywords)) {
        if (keywords.some(keyword => lowerName.includes(keyword))) {
            return chain;
        }
    }
    return null;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'hotel-proxy-server',
        port: PORT,
        timestamp: new Date().toISOString(),
        apis: {
            tripadvisor: TRIPADVISOR_API_KEY ? 'configured' : 'not configured',
            foursquare: FOURSQUARE_API_KEY ? 'configured' : 'not configured'
        }
    });
});

// TripAdvisor API key test endpoint
app.get('/api/test/tripadvisor', async (req, res) => {
    if (!TRIPADVISOR_API_KEY) {
        return res.json({ 
            error: 'TripAdvisor API key not configured',
            configured: false 
        });
    }

    try {
        // Test with a simple location search using official API format
        const testUrl = `${TRIPADVISOR_BASE_URL}/location/search?searchQuery=NYC&category=hotels&language=en&key=${TRIPADVISOR_API_KEY}`;
        
        const response = await fetch(testUrl, {
            headers: { 
                'Accept': 'application/json',
                'User-Agent': 'TravelAdmin/1.0'
            }
        });

        const responseText = await response.text();
        
        res.json({
            configured: true,
            status: response.status,
            statusText: response.statusText,
            success: response.ok,
            response: responseText.substring(0, 500), // First 500 chars
            url: testUrl.replace(TRIPADVISOR_API_KEY, 'HIDDEN_API_KEY')
        });
    } catch (error) {
        res.json({
            configured: true,
            error: error.message,
            success: false
        });
    }
});

// Hotel details endpoint using TripAdvisor Location Details API
app.get('/api/hotels/details/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const { language = 'en' } = req.query;

        if (!locationId) {
            return res.status(400).json({ 
                error: 'Location ID parameter is required',
                source: 'hotel-proxy-server'
            });
        }

        console.log(`[Hotel Details] Getting details for location ID: ${locationId}`);

        let hotelDetails = null;

        // Try TripAdvisor Location Details API
        if (TRIPADVISOR_API_KEY) {
            try {
                const detailsUrl = `${TRIPADVISOR_BASE_URL}/location/${locationId}/details?language=${language}&key=${TRIPADVISOR_API_KEY}`;
                console.log(`[TripAdvisor] Getting hotel details: ${detailsUrl.replace(TRIPADVISOR_API_KEY, 'HIDDEN_API_KEY')}`);

                const response = await fetch(detailsUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'TravelAdmin/1.0'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    hotelDetails = parseTripadvisorDetails(data);
                    console.log(`[TripAdvisor] Hotel details retrieved successfully`);
                } else {
                    console.log(`[TripAdvisor] API error: ${response.status} - ${response.statusText}`);
                    
                    try {
                        const errorBody = await response.text();
                        console.log(`[TripAdvisor] Error response: ${errorBody}`);
                    } catch (e) {
                        console.log(`[TripAdvisor] Could not read error response`);
                    }
                }
            } catch (error) {
                console.log(`[TripAdvisor] Request failed: ${error.message}`);
            }
        }

        // Return results or error
        if (hotelDetails) {
            res.json({
                success: true,
                hotel: hotelDetails,
                source: 'tripadvisor'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Hotel details not found',
                locationId: locationId
            });
        }

    } catch (error) {
        console.error('[Hotel Details] Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Hotel search endpoint using TripAdvisor Content API
app.get('/api/hotels/search', async (req, res) => {
    try {
        const { location, checkIn, checkOut, guests = 2 } = req.query;

        if (!location) {
            return res.status(400).json({ 
                error: 'Location parameter is required',
                source: 'hotel-proxy-server'
            });
        }

        console.log(`[Hotel Search] Location: ${location}, Check-in: ${checkIn}, Check-out: ${checkOut}, Guests: ${guests}`);

        let hotelData = [];

        // Try TripAdvisor API first
        if (TRIPADVISOR_API_KEY) {
            try {
                // Use official TripAdvisor Content API format from documentation
                // Documentation: https://tripadvisor-content-api.readme.io/reference/searchforlocations
                const apiUrl = `${TRIPADVISOR_BASE_URL}/location/search?searchQuery=${encodeURIComponent(location)}&category=hotels&language=en&key=${TRIPADVISOR_API_KEY}`;
                
                console.log(`[TripAdvisor] Searching for hotels in: ${location}`);
                console.log(`[TripAdvisor] API call: ${apiUrl.replace(TRIPADVISOR_API_KEY, 'HIDDEN_API_KEY')}`);

                const response = await fetch(apiUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'TravelAdmin/1.0'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    hotelData = parseTripadvisorData(data, checkIn, checkOut, guests);
                    console.log(`[TripAdvisor] Success! Found ${hotelData.length} hotels`);
                } else {
                    console.log(`[TripAdvisor] API error: ${response.status} - ${response.statusText}`);
                    
                    // Log response body for debugging
                    try {
                        const errorBody = await response.text();
                        console.log(`[TripAdvisor] Error response: ${errorBody}`);
                    } catch (e) {
                        console.log(`[TripAdvisor] Could not read error response`);
                    }
                }
            } catch (error) {
                console.log(`[TripAdvisor] Request failed: ${error.message}`);
            }
        }

        // Fallback to Foursquare if TripAdvisor fails or returns no results
        if (hotelData.length === 0 && FOURSQUARE_API_KEY) {
            try {
                const searchUrl = `${FOURSQUARE_BASE_URL}/search?query=hotel&near=${encodeURIComponent(location)}&categories=19014&limit=20`;
                
                const response = await fetch(searchUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': FOURSQUARE_API_KEY
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    hotelData = parseFoursquareData(data, checkIn, checkOut, guests);
                    console.log(`[Foursquare] Found ${hotelData.length} hotels`);
                } else {
                    console.log(`[Foursquare] API error: ${response.status}`);
                }
            } catch (error) {
                console.log(`[Foursquare] Request failed: ${error.message}`);
            }
        }

        // Fallback to mock data if both APIs fail
        if (hotelData.length === 0) {
            console.log('[Fallback] Using mock hotel data');
            hotelData = generateMockHotelData(location, checkIn, checkOut, guests);
        }

        res.json({
            success: true,
            hotels: hotelData,
            source: hotelData.length > 0 && hotelData[0].source ? hotelData[0].source : 'mock',
            searchParams: { location, checkIn, checkOut, guests }
        });

    } catch (error) {
        console.error('[Hotel Search] Error:', error);
        res.status(500).json({ 
            error: 'Internal server error during hotel search',
            message: error.message 
        });
    }
});

// Parse TripAdvisor API response
const parseTripadvisorData = (data, checkIn, checkOut, guests) => {
    if (!data.data || !Array.isArray(data.data)) {
        return [];
    }

    return data.data
        .slice(0, 10) // Limit to top 10 results
        .map(hotel => {
            const hotelChain = detectHotelChain(hotel.name);
            const directBookingUrl = hotelChain ? 
                generateDirectBookingUrl(hotelChain, hotel.name, checkIn, checkOut, guests) : null;

            // Format address from address_obj
            let address = 'Address not available';
            if (hotel.address_obj) {
                const addressParts = [
                    hotel.address_obj.street1,
                    hotel.address_obj.city,
                    hotel.address_obj.country
                ].filter(part => part && part.trim());
                address = addressParts.join(', ');
            }

            return {
                id: hotel.location_id,
                name: hotel.name,
                address: address,
                rating: parseFloat(hotel.rating) || 4.0, // Default rating if not provided
                numReviews: parseInt(hotel.num_reviews) || 0,
                priceLevel: hotel.price_level || '$$$', // Default price level
                hotelChain: hotelChain,
                directBookingUrl: directBookingUrl,
                bookingInstructions: directBookingUrl ? 
                    `Book direct with ${hotelChain.charAt(0).toUpperCase() + hotelChain.slice(1)} for best rates and loyalty benefits` :
                    'Compare rates across booking platforms',
                phone: hotel.phone || null,
                website: hotel.website || null,
                amenities: [], // TripAdvisor Content API may not include amenities in search results
                source: 'tripadvisor'
            };
        });
};

// Parse TripAdvisor Location Details API response
const parseTripadvisorDetails = (data) => {
    if (!data) {
        return null;
    }

    // Build TripAdvisor URL
    const tripadvisorUrl = data.web_url || `https://www.tripadvisor.com/Hotel_Review-d${data.location_id}.html`;

    // Parse photos (limit to first 10 for performance)
    const photos = [];
    if (data.photos && Array.isArray(data.photos)) {
        data.photos.slice(0, 10).forEach(photo => {
            if (photo.images && photo.images.large) {
                photos.push({
                    url: photo.images.large.url,
                    caption: photo.caption || '',
                    width: photo.images.large.width,
                    height: photo.images.large.height
                });
            } else if (photo.images && photo.images.medium) {
                photos.push({
                    url: photo.images.medium.url,
                    caption: photo.caption || '',
                    width: photo.images.medium.width,
                    height: photo.images.medium.height
                });
            }
        });
    }

    // Parse amenities
    const amenities = [];
    if (data.amenities && Array.isArray(data.amenities)) {
        data.amenities.forEach(amenity => {
            if (amenity.name) {
                amenities.push(amenity.name);
            }
        });
    }

    // Parse address
    let address = 'Address not available';
    if (data.address_obj) {
        const addressParts = [
            data.address_obj.street1,
            data.address_obj.city,
            data.address_obj.country
        ].filter(part => part && part.trim());
        address = addressParts.join(', ');
    }

    // Detect hotel chain for booking links
    const hotelChain = detectHotelChain(data.name);

    return {
        id: data.location_id,
        name: data.name,
        description: data.description || '',
        address: address,
        phone: data.phone || null,
        website: data.website || null,
        email: data.email || null,
        tripadvisorUrl: tripadvisorUrl,
        rating: parseFloat(data.rating) || 0,
        numReviews: parseInt(data.num_reviews) || 0,
        rankingString: data.ranking_string || '',
        priceLevel: data.price_level || null,
        hotelClass: data.hotel_class || null,
        awards: data.awards || [],
        amenities: amenities,
        photos: photos,
        hotelChain: hotelChain,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        timezone: data.timezone || null,
        checkInTime: data.check_in_time || null,
        checkOutTime: data.check_out_time || null,
        source: 'tripadvisor'
    };
};

// Parse Foursquare API response
const parseFoursquareData = (data, checkIn, checkOut, guests) => {
    if (!data.results || !Array.isArray(data.results)) {
        return [];
    }

    return data.results
        .slice(0, 10) // Limit to top 10 results
        .map(place => {
            const hotelChain = detectHotelChain(place.name);
            const directBookingUrl = hotelChain ? 
                generateDirectBookingUrl(hotelChain, place.name, checkIn, checkOut, guests) : null;

            return {
                id: place.fsq_id,
                name: place.name,
                address: place.location ? 
                    `${place.location.address || ''}, ${place.location.locality || ''}, ${place.location.country || ''}`.replace(/^, |, $/, '') : 
                    'Address not available',
                rating: place.rating ? parseFloat(place.rating) : 0,
                numReviews: place.stats ? parseInt(place.stats.total_ratings) || 0 : 0,
                priceLevel: place.price ? '$'.repeat(place.price) : 'N/A',
                hotelChain: hotelChain,
                directBookingUrl: directBookingUrl,
                bookingInstructions: directBookingUrl ? 
                    `Book direct with ${hotelChain.charAt(0).toUpperCase() + hotelChain.slice(1)} for best rates and loyalty benefits` :
                    'Compare rates across booking platforms',
                phone: place.tel || null,
                website: place.website || null,
                amenities: place.features ? place.features.map(f => f.name) : [],
                source: 'foursquare'
            };
        });
};

// Generate mock hotel data for testing
const generateMockHotelData = (location, checkIn, checkOut, guests) => {
    const mockHotels = [
        {
            id: 'mock-marriott-1',
            name: `Marriott Hotel ${location}`,
            address: `123 Main Street, ${location}`,
            rating: 4.2,
            numReviews: 1247,
            priceLevel: '$$$',
            hotelChain: 'marriott',
            directBookingUrl: generateDirectBookingUrl('marriott', `Marriott Hotel ${location}`, checkIn, checkOut, guests),
            bookingInstructions: 'Book direct with Marriott for Bonvoy points and elite benefits',
            phone: '+1-555-0123',
            website: 'https://www.marriott.com',
            amenities: ['WiFi', 'Pool', 'Gym', 'Business Center'],
            source: 'mock'
        },
        {
            id: 'mock-hilton-1',
            name: `Hilton ${location} Downtown`,
            address: `456 Business Avenue, ${location}`,
            rating: 4.4,
            numReviews: 892,
            priceLevel: '$$$',
            hotelChain: 'hilton',
            directBookingUrl: generateDirectBookingUrl('hilton', `Hilton ${location} Downtown`, checkIn, checkOut, guests),
            bookingInstructions: 'Book direct with Hilton for Honors points and complimentary WiFi',
            phone: '+1-555-0456',
            website: 'https://www.hilton.com',
            amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Room Service'],
            source: 'mock'
        },
        {
            id: 'mock-independent-1',
            name: `The Boutique ${location}`,
            address: `789 Arts District, ${location}`,
            rating: 4.6,
            numReviews: 324,
            priceLevel: '$$$$',
            hotelChain: null,
            directBookingUrl: null,
            bookingInstructions: 'Compare rates on Booking.com, Expedia, and hotel website',
            phone: '+1-555-0789',
            website: `https://www.boutique${location.toLowerCase().replace(/\s+/g, '')}.com`,
            amenities: ['WiFi', 'Spa', 'Restaurant', 'Concierge'],
            source: 'mock'
        }
    ];

    return mockHotels;
};

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('[Server Error]', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🏨 Hotel Proxy Server running on http://localhost:${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Hotel search: http://localhost:${PORT}/api/hotels/search?location=NYC&checkIn=2024-07-01&checkOut=2024-07-03&guests=2`);
    console.log(`🏨 Hotel details: http://localhost:${PORT}/api/hotels/details/{locationId}`);
    
    // Log API key status
    console.log(`🔑 TripAdvisor API Key: ${TRIPADVISOR_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`🔑 Foursquare API Key: ${FOURSQUARE_API_KEY ? 'Configured' : 'Not configured'}`);
    
    // Test TripAdvisor API on startup if configured
    if (TRIPADVISOR_API_KEY) {
        console.log(`🧪 Testing TripAdvisor API connection...`);
        
        const testUrl = `${TRIPADVISOR_BASE_URL}/location/search?searchQuery=NYC&category=hotels&language=en&key=${TRIPADVISOR_API_KEY}`;
        
        fetch(testUrl, {
            headers: { 
                'Accept': 'application/json',
                'User-Agent': 'TravelAdmin/1.0'
            }
        })
        .then(response => {
            if (response.ok) {
                console.log(`✅ TripAdvisor API: Working correctly`);
            } else if (response.status === 403 || response.status === 401) {
                console.log(`❌ TripAdvisor API: Authentication failed (${response.status})`);
                console.log(`   🔧 Check IP restrictions at: https://developer-tripadvisor.com/`);
                console.log(`   📍 Current public IP should be allowed in restrictions`);
            } else {
                console.log(`⚠️  TripAdvisor API: Unexpected status ${response.status}`);
            }
        })
        .catch(error => {
            console.log(`⚠️  TripAdvisor API: Connection test failed - ${error.message}`);
        });
    }
});

module.exports = app;