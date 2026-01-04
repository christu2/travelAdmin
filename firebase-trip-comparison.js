#!/usr/bin/env node

/**
 * Firebase Trip Document Comparison Script
 * 
 * This script retrieves and compares two specific trip documents from Firebase Firestore
 * to identify structural differences that might cause iOS app parsing issues.
 * 
 * Usage: node firebase-trip-comparison.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase configuration
const firebaseConfig = {
    projectId: "travel-consulting-app-1"
};

// Trip IDs to compare
const WORKING_TRIP_ID = "zfszkeCOJOHRznZj3BiM";  // Working properly in iOS app
const PROBLEMATIC_TRIP_ID = "2YCrbxW9LbrgznOXcpZt";  // Not showing up properly in iOS app

// Initialize Firebase Admin (using Application Default Credentials)
try {
    admin.initializeApp({
        projectId: firebaseConfig.projectId
    });
    console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    console.log('\n📝 Setup Instructions:');
    console.log('1. Install Firebase Admin SDK: npm install firebase-admin');
    console.log('2. Set up authentication using one of these methods:');
    console.log('   - Set GOOGLE_APPLICATION_CREDENTIALS environment variable to point to service account key');
    console.log('   - Run: gcloud auth application-default login');
    console.log('   - Use Firebase CLI: firebase login');
    process.exit(1);
}

const db = admin.firestore();

/**
 * Retrieves a trip document from Firestore
 */
async function getTripDocument(tripId) {
    try {
        console.log(`🔍 Retrieving trip document: ${tripId}`);
        const docRef = db.collection('trips').doc(tripId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            console.log(`❌ Document ${tripId} does not exist`);
            return null;
        }
        
        const data = doc.data();
        console.log(`✅ Successfully retrieved trip: ${tripId}`);
        return {
            id: doc.id,
            ...data
        };
    } catch (error) {
        console.error(`❌ Error retrieving trip ${tripId}:`, error.message);
        return null;
    }
}

/**
 * Analyzes the structure of an object recursively
 */
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
                elements: obj.length > 0 ? analyzeStructure(obj[0], `${path}[0]`, depth + 1, maxDepth) : { type: 'empty' }
            };
        } else if (obj.constructor?.name === 'Timestamp') {
            return {
                type: 'firebase_timestamp',
                value: obj.toDate().toISOString()
            };
        } else {
            const structure = {};
            for (const [key, value] of Object.entries(obj)) {
                structure[key] = analyzeStructure(value, `${path}.${key}`, depth + 1, maxDepth);
            }
            return {
                type: 'object',
                properties: structure
            };
        }
    }
    
    return { type, value: type === 'string' ? obj.substring(0, 100) : obj };
}

/**
 * Compares two structures and identifies differences
 */
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
        return differences; // Don't continue if types don't match
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
                    path: `${path}.${key}`,
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
                    path: `${path}.${key}`,
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
                    `${path}.${key}`
                );
                differences.push(...nestedDiffs);
            }
        }
    }
    
    return differences;
}

/**
 * Formats differences for display
 */
function formatDifferences(differences) {
    if (differences.length === 0) {
        return "✅ No structural differences found!";
    }
    
    let output = `\n🔍 Found ${differences.length} structural differences:\n`;
    output += "=" . repeat(60) + "\n";
    
    // Group by severity
    const grouped = {
        high: differences.filter(d => d.severity === 'high'),
        medium: differences.filter(d => d.severity === 'medium'),
        low: differences.filter(d => d.severity === 'low')
    };
    
    for (const [severity, diffs] of Object.entries(grouped)) {
        if (diffs.length === 0) continue;
        
        const icon = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : 'ℹ️';
        output += `\n${icon} ${severity.toUpperCase()} SEVERITY (${diffs.length} issues):\n`;
        output += "-" . repeat(40) + "\n";
        
        for (const diff of diffs) {
            output += `Path: ${diff.path || 'root'}\n`;
            output += `Issue: ${diff.issue.replace(/_/g, ' ')}\n`;
            output += `Working trip (${WORKING_TRIP_ID}): ${diff.working_trip}\n`;
            output += `Problematic trip (${PROBLEMATIC_TRIP_ID}): ${diff.problematic_trip}\n`;
            output += "\n";
        }
    }
    
    return output;
}

/**
 * Identifies common iOS parsing issues
 */
function identifyIosIssues(workingTrip, problematicTrip, differences) {
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
        
        if (typeof obj === 'object' && !Array.isArray(obj) && obj.constructor?.name !== 'Timestamp') {
            for (const [key, value] of Object.entries(obj)) {
                checkForNulls(value, `${path}.${key}`);
            }
        } else if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                checkForNulls(item, `${path}[${index}]`);
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
            const workingType = workingValue.constructor?.name;
            const problematicType = problematicValue.constructor?.name;
            
            if (workingType !== problematicType) {
                iosIssues.push({
                    type: 'timestamp_format_mismatch',
                    path: field,
                    description: `Timestamp format differs: ${workingType} vs ${problematicType}`,
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
                description: `Working trip has array, problematic trip has ${typeof problematicValue}`,
                recommendation: 'Ensure field is always an array, even if empty'
            });
        }
    }
    
    return iosIssues;
}

/**
 * Main execution function
 */
async function main() {
    console.log('🚀 Starting Firebase Trip Comparison');
    console.log('=====================================');
    
    try {
        // Retrieve both trip documents
        const [workingTrip, problematicTrip] = await Promise.all([
            getTripDocument(WORKING_TRIP_ID),
            getTripDocument(PROBLEMATIC_TRIP_ID)
        ]);
        
        if (!workingTrip || !problematicTrip) {
            console.error('❌ Failed to retrieve one or both trip documents');
            return;
        }
        
        console.log('\n📊 Document Summary:');
        console.log('====================');
        console.log(`Working Trip (${WORKING_TRIP_ID}):`);
        console.log(`  - Destinations: ${workingTrip.destinations || workingTrip.destination || 'N/A'}`);
        console.log(`  - Status: ${workingTrip.status || 'N/A'}`);
        console.log(`  - Created: ${workingTrip.createdAt?.toDate?.()?.toISOString() || workingTrip.createdAt || 'N/A'}`);
        
        console.log(`\nProblematic Trip (${PROBLEMATIC_TRIP_ID}):`);
        console.log(`  - Destinations: ${problematicTrip.destinations || problematicTrip.destination || 'N/A'}`);
        console.log(`  - Status: ${problematicTrip.status || 'N/A'}`);
        console.log(`  - Created: ${problematicTrip.createdAt?.toDate?.()?.toISOString() || problematicTrip.createdAt || 'N/A'}`);
        
        // Export full JSON structures
        const outputDir = path.join(__dirname, 'trip-comparison-output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        
        // Convert Firestore timestamps to ISO strings for JSON export
        const workingTripJson = JSON.parse(JSON.stringify(workingTrip, (key, value) => {
            if (value && typeof value === 'object' && value.constructor?.name === 'Timestamp') {
                return {
                    _type: 'timestamp',
                    _value: value.toDate().toISOString()
                };
            }
            return value;
        }));
        
        const problematicTripJson = JSON.parse(JSON.stringify(problematicTrip, (key, value) => {
            if (value && typeof value === 'object' && value.constructor?.name === 'Timestamp') {
                return {
                    _type: 'timestamp',
                    _value: value.toDate().toISOString()
                };
            }
            return value;
        }));
        
        fs.writeFileSync(
            path.join(outputDir, `working-trip-${WORKING_TRIP_ID}.json`),
            JSON.stringify(workingTripJson, null, 2)
        );
        
        fs.writeFileSync(
            path.join(outputDir, `problematic-trip-${PROBLEMATIC_TRIP_ID}.json`),
            JSON.stringify(problematicTripJson, null, 2)
        );
        
        console.log(`\n💾 Full JSON exports saved to: ${outputDir}`);
        
        // Analyze structures
        console.log('\n🔬 Analyzing document structures...');
        const workingStructure = analyzeStructure(workingTrip);
        const problematicStructure = analyzeStructure(problematicTrip);
        
        // Compare structures
        const differences = compareStructures(workingStructure, problematicStructure);
        
        // Display structural differences
        console.log(formatDifferences(differences));
        
        // Identify iOS-specific issues
        const iosIssues = identifyIosIssues(workingTrip, problematicTrip, differences);
        
        if (iosIssues.length > 0) {
            console.log('\n📱 Potential iOS App Issues:');
            console.log('============================');
            
            for (const issue of iosIssues) {
                console.log(`\n🔸 ${issue.type.replace(/_/g, ' ').toUpperCase()}`);
                console.log(`   Path: ${issue.path}`);
                console.log(`   Description: ${issue.description}`);
                console.log(`   Recommendation: ${issue.recommendation}`);
            }
        }
        
        // Generate summary report
        const reportPath = path.join(outputDir, 'comparison-report.md');
        const report = generateMarkdownReport(workingTrip, problematicTrip, differences, iosIssues);
        fs.writeFileSync(reportPath, report);
        
        console.log(`\n📋 Detailed comparison report saved to: ${reportPath}`);
        console.log('\n✅ Comparison completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during comparison:', error.message);
        console.error(error.stack);
    } finally {
        // Clean up Firebase connection
        await admin.app().delete();
    }
}

/**
 * Generates a markdown report
 */
function generateMarkdownReport(workingTrip, problematicTrip, differences, iosIssues) {
    const now = new Date().toISOString();
    
    return `# Firebase Trip Comparison Report

Generated: ${now}

## Trip Documents

### Working Trip (${WORKING_TRIP_ID})
- **Destinations:** ${workingTrip.destinations || workingTrip.destination || 'N/A'}
- **Status:** ${workingTrip.status || 'N/A'}
- **Created:** ${workingTrip.createdAt?.toDate?.()?.toISOString() || workingTrip.createdAt || 'N/A'}
- **User ID:** ${workingTrip.userId || 'N/A'}

### Problematic Trip (${PROBLEMATIC_TRIP_ID})
- **Destinations:** ${problematicTrip.destinations || problematicTrip.destination || 'N/A'}
- **Status:** ${problematicTrip.status || 'N/A'}
- **Created:** ${problematicTrip.createdAt?.toDate?.()?.toISOString() || problematicTrip.createdAt || 'N/A'}
- **User ID:** ${problematicTrip.userId || 'N/A'}

## Structural Differences

${differences.length === 0 ? 'No structural differences found.' : differences.map(diff => `
### ${diff.path || 'Root'}
- **Issue:** ${diff.issue.replace(/_/g, ' ')}
- **Severity:** ${diff.severity.toUpperCase()}
- **Working Trip:** ${diff.working_trip}
- **Problematic Trip:** ${diff.problematic_trip}
`).join('\n')}

## iOS-Specific Issues

${iosIssues.length === 0 ? 'No iOS-specific issues identified.' : iosIssues.map(issue => `
### ${issue.type.replace(/_/g, ' ').toUpperCase()}
- **Path:** ${issue.path}
- **Description:** ${issue.description}
- **Recommendation:** ${issue.recommendation}
`).join('\n')}

## Recommendations

1. **Ensure Consistent Data Types:** Make sure similar fields have the same data types across all documents.

2. **Handle Null/Undefined Values:** Replace null or undefined values with appropriate defaults (empty strings, arrays, etc.).

3. **Validate Array Fields:** Ensure fields that should be arrays are always arrays, even if empty.

4. **Consistent Timestamp Format:** Use Firebase Timestamps consistently for all date fields.

5. **Test iOS Parsing:** After making changes, test the iOS app with the corrected document structure.

## Files Generated

- \`working-trip-${WORKING_TRIP_ID}.json\` - Full JSON export of the working trip
- \`problematic-trip-${PROBLEMATIC_TRIP_ID}.json\` - Full JSON export of the problematic trip
- \`comparison-report.md\` - This report
`;
}

// Run the comparison
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    getTripDocument,
    analyzeStructure,
    compareStructures,
    identifyIosIssues
};