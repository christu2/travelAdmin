// SerpAPI Proxy Server for Google Flights
// Run with: node serpapi-proxy-server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.SERPAPI_PROXY_PORT || 3003;

// SerpAPI Configuration
const SERPAPI_CONFIG = {
    apiKey: process.env.SERPAPI_KEY || '',
    baseUrl: 'https://serpapi.com/search.json'
};

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'serpapi-proxy-server',
        port: PORT,
        timestamp: new Date().toISOString(),
        serpApiConfigured: SERPAPI_CONFIG.apiKey ? 'configured' : 'not configured'
    });
});

// SerpAPI Google Flights search endpoint
app.get('/api/flights/search', async (req, res) => {
    try {
        const { departure_id, arrival_id, outbound_date, currency = 'USD', hl = 'en' } = req.query;
        
        if (!departure_id || !arrival_id || !outbound_date) {
            return res.status(400).json({ 
                error: 'Missing required parameters',
                required: ['departure_id', 'arrival_id', 'outbound_date'],
                source: 'serpapi-proxy-server'
            });
        }

        if (!SERPAPI_CONFIG.apiKey) {
            return res.status(500).json({
                error: 'SerpAPI key not configured',
                message: 'Please add SERPAPI_KEY to your .env file'
            });
        }

        console.log(`[SerpAPI] Searching flights: ${departure_id} → ${arrival_id} on ${outbound_date}`);
        
        // Build SerpAPI request URL
        const apiUrl = new URL(SERPAPI_CONFIG.baseUrl);
        apiUrl.searchParams.set('engine', 'google_flights');
        apiUrl.searchParams.set('departure_id', departure_id);
        apiUrl.searchParams.set('arrival_id', arrival_id);
        apiUrl.searchParams.set('outbound_date', outbound_date);
        apiUrl.searchParams.set('type', '2'); // 2 = One way, 1 = Round trip
        apiUrl.searchParams.set('currency', currency);
        apiUrl.searchParams.set('hl', hl);
        apiUrl.searchParams.set('api_key', SERPAPI_CONFIG.apiKey);
        
        console.log(`[SerpAPI] Making request to: ${apiUrl.toString().replace(SERPAPI_CONFIG.apiKey, 'HIDDEN_API_KEY')}`);
        
        const response = await fetch(apiUrl.toString());
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[SerpAPI] API error: ${response.status} - ${errorText}`);
            return res.status(response.status).json({ 
                error: 'SerpAPI request failed', 
                status: response.status,
                details: errorText 
            });
        }
        
        const data = await response.json();
        console.log(`[SerpAPI] Success! Response keys:`, Object.keys(data));
        
        // Check for API errors in response
        if (data.error) {
            console.error(`[SerpAPI] API returned error:`, data.error);
            return res.status(400).json({
                error: 'SerpAPI returned an error',
                details: data.error
            });
        }
        
        // Process and return the flight data
        const processedResponse = {
            success: true,
            search_parameters: data.search_parameters,
            best_flights: data.best_flights || [],
            other_flights: data.other_flights || [],
            price_insights: data.price_insights,
            search_metadata: data.search_metadata
        };
        
        const totalFlights = (processedResponse.best_flights.length || 0) + (processedResponse.other_flights.length || 0);
        console.log(`[SerpAPI] Returning ${totalFlights} flights to dashboard`);
        
        res.json(processedResponse);
        
    } catch (error) {
        console.error('[SerpAPI] Proxy server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// SerpAPI test endpoint
app.get('/api/test/serpapi', async (req, res) => {
    if (!SERPAPI_CONFIG.apiKey) {
        return res.json({ 
            error: 'SerpAPI key not configured',
            configured: false 
        });
    }

    try {
        // Test with a simple flight search
        const testUrl = new URL(SERPAPI_CONFIG.baseUrl);
        testUrl.searchParams.set('engine', 'google_flights');
        testUrl.searchParams.set('departure_id', 'JFK');
        testUrl.searchParams.set('arrival_id', 'LAX');
        // Use a date that's 2-3 months out (not too far in future)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 60);
        const dateStr = futureDate.toISOString().split('T')[0];
        testUrl.searchParams.set('outbound_date', dateStr);
        testUrl.searchParams.set('type', '2'); // 2 = One way, 1 = Round trip
        testUrl.searchParams.set('api_key', SERPAPI_CONFIG.apiKey);
        
        const response = await fetch(testUrl.toString());
        const responseText = await response.text();
        
        res.json({
            configured: true,
            status: response.status,
            statusText: response.statusText,
            success: response.ok,
            response: responseText.substring(0, 500), // First 500 chars
            url: testUrl.toString().replace(SERPAPI_CONFIG.apiKey, 'HIDDEN_API_KEY')
        });
    } catch (error) {
        res.json({
            configured: true,
            error: error.message,
            success: false
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('[SerpAPI Proxy] Server Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🔍 SerpAPI Proxy Server running on http://localhost:${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`✈️  Flight search: http://localhost:${PORT}/api/flights/search?departure_id=JFK&arrival_id=LAX&outbound_date=2025-12-25`);
    console.log(`🧪 SerpAPI test: http://localhost:${PORT}/api/test/serpapi`);
    
    // Log API key status
    console.log(`🔑 SerpAPI Key: ${SERPAPI_CONFIG.apiKey ? 'Configured' : 'Not configured'}`);
    
    // Test SerpAPI connection on startup if configured
    if (SERPAPI_CONFIG.apiKey) {
        console.log(`🧪 Testing SerpAPI connection...`);
        
        const testUrl = new URL(SERPAPI_CONFIG.baseUrl);
        testUrl.searchParams.set('engine', 'google_flights');
        testUrl.searchParams.set('departure_id', 'JFK');
        testUrl.searchParams.set('arrival_id', 'LAX');
        // Use a date that's 2-3 months out (not too far in future)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 60);
        const dateStr = futureDate.toISOString().split('T')[0];
        testUrl.searchParams.set('outbound_date', dateStr);
        testUrl.searchParams.set('type', '2'); // 2 = One way, 1 = Round trip
        testUrl.searchParams.set('api_key', SERPAPI_CONFIG.apiKey);
        
        fetch(testUrl.toString())
        .then(response => {
            if (response.ok) {
                console.log(`✅ SerpAPI: Working correctly`);
            } else if (response.status === 403 || response.status === 401) {
                console.log(`❌ SerpAPI: Authentication failed (${response.status})`);
                console.log(`   🔧 Check your API key at: https://serpapi.com/manage-api-key`);
            } else {
                console.log(`⚠️  SerpAPI: Unexpected status ${response.status}`);
            }
        })
        .catch(error => {
            console.log(`⚠️  SerpAPI: Connection test failed - ${error.message}`);
        });
    }
});

module.exports = app;