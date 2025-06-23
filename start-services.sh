#!/bin/bash

# Start both FlightAware proxy server and Python HTTP server
echo "🚀 Starting FlightAware proxy server and Python HTTP server..."

# Start FlightAware proxy server in background
echo "Starting FlightAware proxy server on port 3001..."
node flight-proxy-server.js &
PROXY_PID=$!

# Wait a moment for proxy server to start
sleep 2

# Start Python HTTP server in background
echo "Starting Python HTTP server on port 8000..."
python3 -m http.server 8000 &
HTTP_PID=$!

echo ""
echo "✅ Both services are running:"
echo "   📡 FlightAware proxy: http://localhost:3001"
echo "   🌐 HTTP server: http://localhost:8000"
echo ""
echo "To stop both services, press Ctrl+C or run: kill $PROXY_PID $HTTP_PID"

# Keep script running and handle Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $PROXY_PID $HTTP_PID 2>/dev/null; exit" INT

# Wait for background processes
wait