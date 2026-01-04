#!/usr/bin/env node

/**
 * Web Firebase Trip Document Comparison Script
 * 
 * This script uses the Firebase Web SDK to retrieve and compare trip documents
 * using the same configuration as the admin dashboard.
 */

const fs = require('fs');
const path = require('path');

// Import Firebase web SDK (we'll use a different approach since we need web SDK)
console.log('This script needs to be run in a browser environment.');
console.log('Instead, let me create a browser-based solution...');

// Create an HTML file that can run in the browser with Firebase Web SDK
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firebase Trip Comparison Tool</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/firebase/10.7.1/firebase-app-compat.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/firebase/10.7.1/firebase-auth-compat.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/firebase/10.7.1/firebase-firestore-compat.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .trip-data {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border: 1px solid #dee2e6;
        }
        .difference {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
        }
        .difference.high {
            background: #f8d7da;
            border-color: #f5c6cb;
        }
        .difference.medium {
            background: #fff3cd;
            border-color: #ffeaa7;
        }
        .difference.low {
            background: #d1ecf1;
            border-color: #bee5eb;
        }
        .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .btn:hover {
            background: #0056b3;
        }
        .btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .status.loading {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
        }
        .status.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
        }
        pre {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            max-height: 400px;
            border: 1px solid #dee2e6;
        }
        .comparison-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        h2 {
            color: #495057;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
        }
        h3 {
            color: #6c757d;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Firebase Trip Comparison Tool</h1>
        <p>This tool compares two trip documents to identify structural differences that might cause iOS app parsing issues.</p>
        
        <div class="trip-info">
            <h3>Trip IDs to Compare:</h3>
            <p><strong>Working Trip:</strong> zfszkeCOJOHRznZj3BiM (works properly in iOS app)</p>
            <p><strong>Problematic Trip:</strong> 2YCrbxW9LbrgznOXcpZt (not showing up properly in iOS app)</p>
        </div>

        <button id="authenticateBtn" class="btn">🔐 Authenticate with Firebase</button>
        <button id="compareBtn" class="btn" disabled>🔍 Compare Trip Documents</button>
        <button id="downloadBtn" class="btn" disabled>💾 Download JSON Files</button>

        <div id="status" class="status" style="display: none;"></div>
        
        <div id="results" style="display: none;">
            <h2>📊 Comparison Results</h2>
            
            <div class="comparison-grid">
                <div>
                    <h3>Working Trip (zfszkeCOJOHRznZj3BiM)</h3>
                    <div id="workingTripSummary" class="trip-data"></div>
                </div>
                <div>
                    <h3>Problematic Trip (2YCrbxW9LbrgznOXcpZt)</h3>
                    <div id="problematicTripSummary" class="trip-data"></div>
                </div>
            </div>

            <h3>🚨 Structural Differences</h3>
            <div id="differences"></div>

            <h3>📱 iOS-Specific Issues</h3>
            <div id="iosIssues"></div>

            <h3>📋 Full JSON Data</h3>
            <div class="comparison-grid">
                <div>
                    <h4>Working Trip JSON</h4>
                    <pre id="workingTripJson"></pre>
                </div>
                <div>
                    <h4>Problematic Trip JSON</h4>
                    <pre id="problematicTripJson"></pre>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Firebase configuration (same as admin dashboard)
        const firebaseConfig = {
            apiKey: "AIzaSyC4GMsZnSo6zYvBSFIqnWh07PMy0yWTYKM",
            authDomain: "travel-consulting-app-1.firebaseapp.com",
            projectId: "travel-consulting-app-1",
            storageBucket: "travel-consulting-app-1.firebasestorage.app",
            messagingSenderId: "123591590128",
            appId: "1:123591590128:ios:ef15580e6e03d5e6160235"
        };

        // Trip IDs
        const WORKING_TRIP_ID = "zfszkeCOJOHRznZj3BiM";
        const PROBLEMATIC_TRIP_ID = "2YCrbxW9LbrgznOXcpZt";

        let currentUser = null;
        let workingTrip = null;
        let problematicTrip = null;

        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            firebase.firestore().settings({
                experimentalForceLongPolling: true,
                experimentalAutoDetectLongPolling: false,
                merge: true
            });
        }

        // DOM elements
        const authenticateBtn = document.getElementById('authenticateBtn');
        const compareBtn = document.getElementById('compareBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const statusDiv = document.getElementById('status');
        const resultsDiv = document.getElementById('results');

        // Authentication
        authenticateBtn.addEventListener('click', async () => {
            try {
                showStatus('Authenticating...', 'loading');
                
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await firebase.auth().signInWithPopup(provider);
                currentUser = result.user;
                
                showStatus(\`✅ Authenticated as: \${currentUser.email}\`, 'success');
                authenticateBtn.textContent = \`✅ Signed in as \${currentUser.email}\`;
                authenticateBtn.disabled = true;
                compareBtn.disabled = false;
                
            } catch (error) {
                console.error('Authentication error:', error);
                showStatus(\`❌ Authentication failed: \${error.message}\`, 'error');
            }
        });

        // Compare documents
        compareBtn.addEventListener('click', async () => {
            if (!currentUser) {
                showStatus('❌ Please authenticate first', 'error');
                return;
            }

            try {
                showStatus('📥 Retrieving trip documents...', 'loading');
                
                // Retrieve both documents
                const [workingDoc, problematicDoc] = await Promise.all([
                    firebase.firestore().collection('trips').doc(WORKING_TRIP_ID).get(),
                    firebase.firestore().collection('trips').doc(PROBLEMATIC_TRIP_ID).get()
                ]);

                if (!workingDoc.exists || !problematicDoc.exists) {
                    throw new Error('One or both trip documents do not exist');
                }

                workingTrip = { id: workingDoc.id, ...workingDoc.data() };
                problematicTrip = { id: problematicDoc.id, ...problematicDoc.data() };

                showStatus('✅ Documents retrieved successfully', 'success');
                
                // Analyze and display results
                analyzeAndDisplayResults();
                downloadBtn.disabled = false;
                resultsDiv.style.display = 'block';

            } catch (error) {
                console.error('Error retrieving documents:', error);
                showStatus(\`❌ Error: \${error.message}\`, 'error');
            }
        });

        // Download JSON files
        downloadBtn.addEventListener('click', () => {
            if (!workingTrip || !problematicTrip) return;

            // Convert Firebase timestamps to ISO strings for download
            const workingTripJson = JSON.stringify(convertFirebaseTimestamps(workingTrip), null, 2);
            const problematicTripJson = JSON.stringify(convertFirebaseTimestamps(problematicTrip), null, 2);

            downloadFile(\`working-trip-\${WORKING_TRIP_ID}.json\`, workingTripJson);
            downloadFile(\`problematic-trip-\${PROBLEMATIC_TRIP_ID}.json\`, problematicTripJson);
        });

        function showStatus(message, type) {
            statusDiv.textContent = message;
            statusDiv.className = \`status \${type}\`;
            statusDiv.style.display = 'block';
        }

        function analyzeAndDisplayResults() {
            // Display trip summaries
            displayTripSummary('workingTripSummary', workingTrip);
            displayTripSummary('problematicTripSummary', problematicTrip);

            // Analyze structures
            const workingStructure = analyzeStructure(workingTrip);
            const problematicStructure = analyzeStructure(problematicTrip);
            
            // Compare structures
            const differences = compareStructures(workingStructure, problematicStructure);
            displayDifferences(differences);

            // Identify iOS issues
            const iosIssues = identifyIosIssues(workingTrip, problematicTrip);
            displayIosIssues(iosIssues);

            // Display full JSON
            document.getElementById('workingTripJson').textContent = JSON.stringify(convertFirebaseTimestamps(workingTrip), null, 2);
            document.getElementById('problematicTripJson').textContent = JSON.stringify(convertFirebaseTimestamps(problematicTrip), null, 2);
        }

        function displayTripSummary(elementId, trip) {
            const element = document.getElementById(elementId);
            const destinations = trip.destinations || trip.destination || 'N/A';
            const createdAt = trip.createdAt?.toDate?.()?.toISOString() || trip.createdAt || 'N/A';
            
            element.innerHTML = \`
                <strong>Destinations:</strong> \${Array.isArray(destinations) ? destinations.join(' → ') : destinations}<br>
                <strong>Status:</strong> \${trip.status || 'N/A'}<br>
                <strong>Created:</strong> \${createdAt}<br>
                <strong>User ID:</strong> \${trip.userId || 'N/A'}<br>
                <strong>Group Size:</strong> \${trip.groupSize || 'N/A'}
            \`;
        }

        function displayDifferences(differences) {
            const container = document.getElementById('differences');
            
            if (differences.length === 0) {
                container.innerHTML = '<div class="difference low">✅ No structural differences found!</div>';
                return;
            }

            let html = \`<p>Found \${differences.length} structural differences:</p>\`;
            
            differences.forEach(diff => {
                html += \`
                <div class="difference \${diff.severity}">
                    <strong>\${diff.severity.toUpperCase()}: \${diff.issue.replace(/_/g, ' ')}</strong><br>
                    <strong>Path:</strong> \${diff.path || 'root'}<br>
                    <strong>Working Trip:</strong> \${diff.working_trip}<br>
                    <strong>Problematic Trip:</strong> \${diff.problematic_trip}
                </div>
                \`;
            });
            
            container.innerHTML = html;
        }

        function displayIosIssues(issues) {
            const container = document.getElementById('iosIssues');
            
            if (issues.length === 0) {
                container.innerHTML = '<div class="difference low">✅ No iOS-specific issues identified!</div>';
                return;
            }

            let html = \`<p>Found \${issues.length} potential iOS issues:</p>\`;
            
            issues.forEach(issue => {
                html += \`
                <div class="difference high">
                    <strong>📱 \${issue.type.replace(/_/g, ' ').toUpperCase()}</strong><br>
                    <strong>Path:</strong> \${issue.path}<br>
                    <strong>Description:</strong> \${issue.description}<br>
                    <strong>Recommendation:</strong> \${issue.recommendation}
                </div>
                \`;
            });
            
            container.innerHTML = html;
        }

        function analyzeStructure(obj, path = '', depth = 0, maxDepth = 10) {
            if (depth > maxDepth) return { type: 'max_depth_reached' };
            
            if (obj === null) return { type: 'null' };
            if (obj === undefined) return { type: 'undefined' };
            
            const type = typeof obj;
            
            if (type === 'object') {
                if (Array.isArray(obj)) {
                    return {
                        type: 'array',
                        length: obj.length,
                        elements: obj.length > 0 ? analyzeStructure(obj[0], \`\${path}[0]\`, depth + 1, maxDepth) : { type: 'empty' }
                    };
                } else if (obj.constructor?.name === 'Timestamp' || (obj.toDate && typeof obj.toDate === 'function')) {
                    return {
                        type: 'firebase_timestamp',
                        value: obj.toDate().toISOString()
                    };
                } else {
                    const structure = {};
                    for (const [key, value] of Object.entries(obj)) {
                        structure[key] = analyzeStructure(value, \`\${path}.\${key}\`, depth + 1, maxDepth);
                    }
                    return {
                        type: 'object',
                        properties: structure
                    };
                }
            }
            
            return { type, value: type === 'string' ? obj.substring(0, 100) : obj };
        }

        function compareStructures(struct1, struct2, path = '') {
            const differences = [];
            
            // Type comparison
            if (struct1?.type !== struct2?.type) {
                differences.push({
                    path,
                    issue: 'type_mismatch',
                    working_trip: struct1?.type || 'missing',
                    problematic_trip: struct2?.type || 'missing',
                    severity: 'high'
                });
                return differences;
            }
            
            // Array length comparison
            if (struct1?.type === 'array' && struct2?.type === 'array') {
                if (struct1.length !== struct2.length) {
                    differences.push({
                        path,
                        issue: 'array_length_mismatch',
                        working_trip: struct1.length,
                        problematic_trip: struct2.length,
                        severity: 'medium'
                    });
                }
            }
            
            // Object property comparison
            if (struct1?.type === 'object' && struct2?.type === 'object') {
                const keys1 = new Set(Object.keys(struct1.properties || {}));
                const keys2 = new Set(Object.keys(struct2.properties || {}));
                
                // Missing properties in problematic trip
                for (const key of keys1) {
                    if (!keys2.has(key)) {
                        differences.push({
                            path: \`\${path}.\${key}\`,
                            issue: 'missing_property',
                            working_trip: 'present',
                            problematic_trip: 'missing',
                            severity: 'high'
                        });
                    }
                }
                
                // Extra properties in problematic trip
                for (const key of keys2) {
                    if (!keys1.has(key)) {
                        differences.push({
                            path: \`\${path}.\${key}\`,
                            issue: 'extra_property',
                            working_trip: 'missing',
                            problematic_trip: 'present',
                            severity: 'low'
                        });
                    }
                }
                
                // Recursively compare common properties
                for (const key of keys1) {
                    if (keys2.has(key)) {
                        const nestedDiffs = compareStructures(
                            struct1.properties[key],
                            struct2.properties[key],
                            \`\${path}.\${key}\`
                        );
                        differences.push(...nestedDiffs);
                    }
                }
            }
            
            return differences;
        }

        function identifyIosIssues(workingTrip, problematicTrip) {
            const iosIssues = [];
            
            // Check for null/undefined values
            function checkForNulls(obj, path = '') {
                if (obj === null || obj === undefined) {
                    iosIssues.push({
                        type: 'null_undefined_value',
                        path,
                        description: 'iOS apps often have trouble with null/undefined values',
                        recommendation: 'Replace with empty string, empty array, or default value'
                    });
                    return;
                }
                
                if (typeof obj === 'object' && !Array.isArray(obj) && !obj.toDate) {
                    for (const [key, value] of Object.entries(obj)) {
                        checkForNulls(value, \`\${path}.\${key}\`);
                    }
                } else if (Array.isArray(obj)) {
                    obj.forEach((item, index) => {
                        checkForNulls(item, \`\${path}[\${index}]\`);
                    });
                }
            }
            
            checkForNulls(problematicTrip, 'problematic_trip');
            
            // Check for timestamp format issues
            const timestampFields = ['createdAt', 'updatedAt', 'startDate', 'endDate'];
            for (const field of timestampFields) {
                const workingValue = workingTrip[field];
                const problematicValue = problematicTrip[field];
                
                if (workingValue && problematicValue) {
                    const workingType = workingValue.constructor?.name || typeof workingValue;
                    const problematicType = problematicValue.constructor?.name || typeof problematicValue;
                    
                    if (workingType !== problematicType) {
                        iosIssues.push({
                            type: 'timestamp_format_mismatch',
                            path: field,
                            description: \`Timestamp format differs: \${workingType} vs \${problematicType}\`,
                            recommendation: 'Ensure consistent timestamp format (preferably Firebase Timestamp)'
                        });
                    }
                }
            }
            
            // Check for array consistency
            const arrayFields = ['destinations', 'interests'];
            for (const field of arrayFields) {
                const workingValue = workingTrip[field];
                const problematicValue = problematicTrip[field];
                
                if (Array.isArray(workingValue) && !Array.isArray(problematicValue)) {
                    iosIssues.push({
                        type: 'array_type_mismatch',
                        path: field,
                        description: \`Working trip has array, problematic trip has \${typeof problematicValue}\`,
                        recommendation: 'Ensure field is always an array, even if empty'
                    });
                }
            }
            
            return iosIssues;
        }

        function convertFirebaseTimestamps(obj) {
            return JSON.parse(JSON.stringify(obj, (key, value) => {
                if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
                    return {
                        _type: 'timestamp',
                        _value: value.toDate().toISOString()
                    };
                }
                return value;
            }));
        }

        function downloadFile(filename, content) {
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Check if user is already signed in
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                authenticateBtn.textContent = \`✅ Signed in as \${user.email}\`;
                authenticateBtn.disabled = true;
                compareBtn.disabled = false;
                showStatus(\`✅ Already authenticated as: \${user.email}\`, 'success');
            }
        });
    </script>
</body>
</html>`;

// Write the HTML file
const outputPath = path.join(__dirname, 'firebase-trip-comparison-tool.html');
fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Browser-based Firebase Trip Comparison Tool created!');
console.log(`📂 File location: ${outputPath}`);
console.log('');
console.log('🚀 To use this tool:');
console.log('1. Open the HTML file in your web browser');
console.log('2. Click "Authenticate with Firebase" and sign in with Google');
console.log('3. Click "Compare Trip Documents" to analyze the differences');
console.log('4. Use "Download JSON Files" to save the full document data');
console.log('');
console.log('🔍 The tool will:');
console.log('- Retrieve both trip documents from Firestore');
console.log('- Compare their structures and identify differences');
console.log('- Highlight potential iOS parsing issues');
console.log('- Allow you to download the full JSON data for manual inspection');