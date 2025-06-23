// FlightAware API Proxy Server
// Run with: node flight-proxy-server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// FlightAware API Configuration
const FLIGHTAWARE_CONFIG = {
    apiKey: process.env.FLIGHTAWARE_API_KEY || '',
    baseUrl: 'https://aeroapi.flightaware.com/aeroapi'
};

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Normalize flight number for FlightAware API (UA123 -> UAL123)
function normalizeFlightNumber(flightNumber) {
    const airlineMap = {
        'UA': 'UAL',
        'AA': 'AAL', 
        'DL': 'DAL',
        'WN': 'SWA',
        'B6': 'JBU',
        'AS': 'ASA',
        'NK': 'NKS',
        'F9': 'FFT',
        'G4': 'AAY'
    };
    
    const match = flightNumber.match(/^([A-Z]{2})(\d+)$/);
    if (match) {
        const [, airline, number] = match;
        const normalizedAirline = airlineMap[airline] || airline;
        return `${normalizedAirline}${number}`;
    }
    
    return flightNumber;
}

// Flight lookup endpoint
app.get('/api/flight/:flightNumber', async (req, res) => {
    try {
        const { flightNumber } = req.params;
        const { date } = req.query;
        
        console.log(`Looking up flight ${flightNumber} for date ${date}`);
        
        // Normalize flight number for FlightAware
        const flightId = normalizeFlightNumber(flightNumber);
        const apiUrl = `${FLIGHTAWARE_CONFIG.baseUrl}/flights/${flightId}`;
        
        console.log('Making FlightAware API call:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'x-apikey': FLIGHTAWARE_CONFIG.apiKey,
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('FlightAware API success');
            
            // Filter flights by date if provided
            if (date && data.flights) {
                const targetDate = new Date(date);
                const matchingFlights = data.flights.filter(flight => {
                    if (flight.scheduled_out) {
                        const flightDate = new Date(flight.scheduled_out);
                        return flightDate.toDateString() === targetDate.toDateString();
                    }
                    return false;
                });
                
                if (matchingFlights.length > 0) {
                    data.flights = matchingFlights;
                }
            }
            
            res.json(data);
        } else {
            const errorText = await response.text();
            console.log('FlightAware API error:', response.status, errorText);
            res.status(response.status).json({ 
                error: 'FlightAware API error', 
                details: errorText 
            });
        }
        
    } catch (error) {
        console.error('Proxy server error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'FlightAware proxy server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FlightAware proxy server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/flight/{flightNumber}?date={YYYY-MM-DD}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;