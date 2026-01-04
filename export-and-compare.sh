#!/bin/bash

# Firebase Trip Export and Comparison Script
# This script exports Firestore data and then analyzes it

echo "🚀 Firebase Trip Export and Comparison"
echo "======================================"

# Set project
firebase use travel-consulting-app-1

# Create output directory
mkdir -p trip-export-data

echo "📥 Exporting Firestore data..."

# Export the entire trips collection
firebase firestore:export trip-export-data --project travel-consulting-app-1

if [ $? -eq 0 ]; then
    echo "✅ Export completed successfully!"
    echo "📂 Data exported to: trip-export-data/"
    echo ""
    echo "🔍 To find your specific trip documents:"
    echo "1. Look in trip-export-data/all_namespaces/kind_trips/"
    echo "2. Find files named with your trip IDs:"
    echo "   - zfszkeCOJOHRznZj3BiM (working trip)"
    echo "   - 2YCrbxW9LbrgznOXcpZt (problematic trip)"
    echo ""
    echo "🛠️  Alternative: Use the browser-based comparison tool:"
    echo "   - Open firebase-trip-comparison-tool.html in your browser"
    echo "   - This provides a more user-friendly interface"
else
    echo "❌ Export failed. Trying alternative approach..."
    echo ""
    echo "🌐 Please use the browser-based tool instead:"
    echo "1. Open firebase-trip-comparison-tool.html in your web browser"
    echo "2. Sign in with your Google account"
    echo "3. The tool will retrieve and compare the documents directly"
fi

echo ""
echo "📋 Trip IDs to compare:"
echo "- Working Trip:     zfszkeCOJOHRznZj3BiM"
echo "- Problematic Trip: 2YCrbxW9LbrgznOXcpZt"