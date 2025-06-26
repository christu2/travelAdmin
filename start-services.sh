#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env..."
    set -a
    source .env
    set +a
else
    echo "⚠️  Warning: .env file not found. Create one with your API keys."
    exit 1
fi

# IP Change Detection and Monitoring
echo "🌐 Checking public IP address..."

# Get current public IP
CURRENT_IP=$(curl -s --connect-timeout 5 https://api.ipify.org 2>/dev/null || curl -s --connect-timeout 5 https://checkip.amazonaws.com 2>/dev/null | tr -d '\n' || echo "unknown")

if [ "$CURRENT_IP" = "unknown" ]; then
    echo "⚠️  Warning: Could not detect public IP address (check internet connection)"
    echo "   TripAdvisor API may fail if IP restrictions are configured"
else
    echo "📍 Current public IP: $CURRENT_IP"
    
    # Check if IP has changed since last run
    IP_LOG_FILE=".last_known_ip"
    
    if [ -f "$IP_LOG_FILE" ]; then
        LAST_IP=$(cat "$IP_LOG_FILE")
        if [ "$CURRENT_IP" != "$LAST_IP" ]; then
            echo "🚨 IP ADDRESS CHANGED!"
            echo "   Previous IP: $LAST_IP"
            echo "   Current IP:  $CURRENT_IP"
            echo ""
            echo "⚠️  ACTION REQUIRED: Update TripAdvisor API key IP restrictions"
            echo "   1. Go to: https://developer-tripadvisor.com/"
            echo "   2. Update IP restriction to: $CURRENT_IP/32"
            echo "   3. Or use IP range: ${CURRENT_IP%.*}.0/24 (recommended)"
            echo ""
        else
            echo "✅ IP address unchanged since last run"
        fi
    else
        echo "📝 First run - saving IP address for future comparison"
    fi
    
    # Save current IP for next comparison
    echo "$CURRENT_IP" > "$IP_LOG_FILE"
fi

# Generate admin dashboard with API keys
echo "🔧 Generating admin dashboard with API keys..."
if [ -f admin-dashboard.template.html ]; then
    sed -e "s/{{FIREBASE_API_KEY}}/$FIREBASE_API_KEY/g" \
        -e "s/{{FLIGHTAWARE_API_KEY}}/$FLIGHTAWARE_API_KEY/g" \
        admin-dashboard.template.html > admin-dashboard.html
    echo "✅ Admin dashboard generated with API keys injected"
else
    echo "⚠️  Warning: admin-dashboard.template.html not found"
fi

# Start both FlightAware proxy server and Python HTTP server
echo "🚀 Starting FlightAware proxy server and Python HTTP server..."

# Start FlightAware proxy server in background
echo "Starting FlightAware proxy server on port 3001..."
node flight-proxy-server.js &
FLIGHT_PROXY_PID=$!

# Start Hotel proxy server in background
echo "Starting Hotel proxy server on port 3002..."
node hotel-proxy-server.js &
HOTEL_PROXY_PID=$!

# Wait a moment for proxy servers to start
sleep 3

# Start Python HTTP server in background
echo "Starting Python HTTP server on port 8000..."
python3 -m http.server 8000 &
HTTP_PID=$!

echo ""
echo "✅ All services are running:"
echo "   📡 FlightAware proxy: http://localhost:3001"
echo "   🏨 Hotel proxy: http://localhost:3002"
echo "   🌐 HTTP server: http://localhost:8000"
echo "   📊 Admin dashboard: http://localhost:8000/admin-dashboard.html"
echo ""
echo "To stop all services, press Ctrl+C or run: kill $FLIGHT_PROXY_PID $HOTEL_PROXY_PID $HTTP_PID"

# Keep script running and handle Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $FLIGHT_PROXY_PID $HOTEL_PROXY_PID $HTTP_PID 2>/dev/null; exit" INT

# Wait for background processes
wait