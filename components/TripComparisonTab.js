/**
 * TripComparisonTab Component
 * 
 * Compares two specific trips to identify structural differences
 * that could be causing iOS app parsing issues
 */

window.TripComparisonTab = ({ currentUser, selectedTrip }) => {
    const [comparisonData, setComparisonData] = React.useState({ trip1: null, trip2: null, differences: [] });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [comparisonTripId, setComparisonTripId] = React.useState('');

    // Default comparison trips for reference
    const DEFAULT_WORKING_TRIP = 'zfszkeCOJOHRznZj3BiM';
    const DEFAULT_PROBLEMATIC_TRIP = '2YCrbxW9LbrgznOXcpZt';

    const findDifferences = (obj1, obj2, path = '') => {
        const differences = [];
        
        // Helper function to check if value is empty/null/undefined
        const isEmpty = (value) => {
            return value === null || value === undefined || 
                   (Array.isArray(value) && value.length === 0) ||
                   (typeof value === 'string' && value.trim() === '') ||
                   (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);
        };

        // Ensure we're only working with objects
        if (!obj1 || !obj2 || typeof obj1 !== 'object' || typeof obj2 !== 'object' || 
            Array.isArray(obj1) || Array.isArray(obj2) || 
            obj1 instanceof Date || obj2 instanceof Date) {
            return differences;
        }

        // Check for keys in obj1 but not in obj2
        Object.keys(obj1).forEach(key => {
            const currentPath = path ? `${path}.${key}` : key;
            if (!(key in obj2)) {
                differences.push({
                    type: 'missing_in_problematic',
                    path: currentPath,
                    workingValue: obj1[key],
                    severity: 'high'
                });
            } else if (typeof obj1[key] !== typeof obj2[key]) {
                differences.push({
                    type: 'type_mismatch',
                    path: currentPath,
                    workingType: typeof obj1[key],
                    problematicType: typeof obj2[key],
                    workingValue: obj1[key],
                    problematicValue: obj2[key],
                    severity: 'critical'
                });
            } else if (obj1[key] !== null && obj2[key] !== null && 
                       typeof obj1[key] === 'object' && typeof obj2[key] === 'object' &&
                       !Array.isArray(obj1[key]) && !Array.isArray(obj2[key]) &&
                       !(obj1[key] instanceof Date) && !(obj2[key] instanceof Date)) {
                // Recursively compare objects
                differences.push(...findDifferences(obj1[key], obj2[key], currentPath));
            } else if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
                // Compare array lengths and structures
                if (obj1[key].length !== obj2[key].length) {
                    differences.push({
                        type: 'array_length_difference',
                        path: currentPath,
                        workingLength: obj1[key].length,
                        problematicLength: obj2[key].length,
                        severity: 'medium'
                    });
                }
                // Compare first elements if arrays exist
                if (obj1[key].length > 0 && obj2[key].length > 0) {
                    differences.push(...findDifferences(obj1[key][0], obj2[key][0], `${currentPath}[0]`));
                }
            } else if (obj1[key] !== obj2[key]) {
                // Check if one is empty and the other isn't (common iOS issue)
                if (isEmpty(obj1[key]) !== isEmpty(obj2[key])) {
                    differences.push({
                        type: 'null_vs_value',
                        path: currentPath,
                        workingValue: obj1[key],
                        problematicValue: obj2[key],
                        severity: 'high'
                    });
                } else {
                    differences.push({
                        type: 'value_difference',
                        path: currentPath,
                        workingValue: obj1[key],
                        problematicValue: obj2[key],
                        severity: 'low'
                    });
                }
            }
        });

        // Check for keys in obj2 but not in obj1
        Object.keys(obj2).forEach(key => {
            const currentPath = path ? `${path}.${key}` : key;
            if (!(key in obj1)) {
                differences.push({
                    type: 'extra_in_problematic',
                    path: currentPath,
                    problematicValue: obj2[key],
                    severity: 'medium'
                });
            }
        });

        return differences;
    };

    const compareTrips = async (trip1Id = null, trip2Id = null) => {
        if (!currentUser) {
            setError('Please sign in to compare trips');
            return;
        }

        // Determine which trips to compare
        let firstTripId, secondTripId;
        
        if (trip1Id && trip2Id) {
            // Custom comparison
            firstTripId = trip1Id;
            secondTripId = trip2Id;
        } else if (selectedTrip && comparisonTripId) {
            // Compare selected trip with user input
            firstTripId = selectedTrip.id;
            secondTripId = comparisonTripId;
        } else {
            // Default comparison
            firstTripId = DEFAULT_WORKING_TRIP;
            secondTripId = DEFAULT_PROBLEMATIC_TRIP;
        }

        setLoading(true);
        setError('');

        try {
            const db = firebase.firestore();
            
            // Fetch both trips
            const [trip1Doc, trip2Doc] = await Promise.all([
                db.collection('trips').doc(firstTripId).get(),
                db.collection('trips').doc(secondTripId).get()
            ]);
            
            if (!trip1Doc.exists) {
                throw new Error(`Trip ${firstTripId} not found`);
            }
            if (!trip2Doc.exists) {
                throw new Error(`Trip ${secondTripId} not found`);
            }

            const trip1Data = trip1Doc.data();
            const trip2Data = trip2Doc.data();
            
            // Find differences
            const differences = findDifferences(trip1Data, trip2Data);
            
            // Sort by severity
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            differences.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
            
            setComparisonData({
                trip1: trip1Data,
                trip2: trip2Data,
                differences
            });
            
        } catch (error) {
            console.error('Error comparing trips:', error);
            setError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadComparison = () => {
        if (!comparisonData.trip1 || !comparisonData.trip2) {
            alert('Please run the comparison first!');
            return;
        }

        const comparison = {
            working_trip: comparisonData.trip1,
            problematic_trip: comparisonData.trip2,
            differences: comparisonData.differences,
            timestamp: new Date().toISOString(),
            analysis: {
                total_differences: comparisonData.differences.length,
                critical_issues: comparisonData.differences.filter(d => d.severity === 'critical').length,
                high_priority: comparisonData.differences.filter(d => d.severity === 'high').length
            }
        };

        const blob = new Blob([JSON.stringify(comparison, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trip-comparison-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'critical': return '#dc3545';
            case 'high': return '#fd7e14';
            case 'medium': return '#ffc107';
            case 'low': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const getSeverityIcon = (severity) => {
        switch(severity) {
            case 'critical': return '🚨';
            case 'high': return '⚠️';
            case 'medium': return '🔶';
            case 'low': return 'ℹ️';
            default: return 'ℹ️';
        }
    };

    // Auto-run comparison on component mount
    React.useEffect(() => {
        if (currentUser && !comparisonData.trip1) {
            compareTrips();
        }
    }, [currentUser]);

    return React.createElement('div', { className: 'form-section' }, [
        React.createElement('h3', { key: 'title' }, '🔍 Trip Structure Comparison'),
        
        React.createElement('div', {
            key: 'description',
            style: {
                background: '#e7f3ff',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
            }
        }, [
            React.createElement('strong', { key: 'desc-title' }, 'Trip Structure Comparison Tool'),
            React.createElement('p', { key: 'desc-text', style: { margin: '10px 0' } }, 
                'Compare trip structures to identify differences that could cause iOS parsing issues.'),
            
            selectedTrip && React.createElement('div', { key: 'current-trip', style: { marginTop: '10px' } }, [
                React.createElement('strong', { key: 'current-label' }, 'Current Trip: '),
                `${selectedTrip.id} (${selectedTrip.destinations ? selectedTrip.destinations.join(' → ') : selectedTrip.destination})`
            ])
        ]),

        // Trip Comparison Input
        React.createElement('div', {
            key: 'comparison-input',
            style: {
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
            }
        }, [
            React.createElement('div', {
                key: 'input-section',
                style: { marginBottom: '15px' }
            }, [
                React.createElement('label', {
                    key: 'input-label',
                    style: { display: 'block', marginBottom: '5px', fontWeight: '600' }
                }, selectedTrip ? 'Compare current trip with:' : 'Trip ID to compare:'),
                React.createElement('input', {
                    key: 'trip-input',
                    type: 'text',
                    value: comparisonTripId,
                    onChange: (e) => setComparisonTripId(e.target.value),
                    placeholder: selectedTrip ? 'Enter trip ID to compare with current trip' : 'Enter trip ID',
                    style: {
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }
                })
            ]),
            
            React.createElement('div', {
                key: 'quick-actions',
                style: { fontSize: '12px', color: '#6c757d' }
            }, [
                React.createElement('strong', { key: 'quick-label' }, 'Quick comparisons: '),
                React.createElement('button', {
                    key: 'default-btn',
                    onClick: () => compareTrips(),
                    style: {
                        background: 'none',
                        border: '1px solid #007bff',
                        color: '#007bff',
                        padding: '4px 8px',
                        margin: '0 5px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }
                }, 'Working vs Problematic'),
                selectedTrip && React.createElement('button', {
                    key: 'vs-working-btn',
                    onClick: () => {
                        setComparisonTripId(DEFAULT_WORKING_TRIP);
                        compareTrips(selectedTrip.id, DEFAULT_WORKING_TRIP);
                    },
                    style: {
                        background: 'none',
                        border: '1px solid #28a745',
                        color: '#28a745',
                        padding: '4px 8px',
                        margin: '0 5px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }
                }, 'vs Working Trip')
            ])
        ]),

        React.createElement('div', {
            key: 'controls',
            style: { marginBottom: '20px' }
        }, [
            React.createElement('button', {
                key: 'compare-btn',
                className: 'btn btn-primary',
                onClick: () => compareTrips(),
                disabled: loading || !currentUser || (!selectedTrip && !comparisonTripId),
                style: { marginRight: '10px' }
            }, loading ? '🔄 Comparing...' : '🔍 Compare Trips'),
            
            comparisonData.differences.length > 0 && React.createElement('button', {
                key: 'download-btn',
                className: 'btn btn-secondary',
                onClick: downloadComparison
            }, '📥 Download Comparison')
        ]),

        error && React.createElement('div', {
            key: 'error',
            style: {
                background: '#f8d7da',
                color: '#721c24',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
            }
        }, error),

        loading && React.createElement('div', {
            key: 'loading',
            style: {
                textAlign: 'center',
                padding: '40px',
                color: '#6c757d'
            }
        }, '🔄 Analyzing trip structures...'),

        comparisonData.differences.length > 0 && React.createElement('div', {
            key: 'results',
            style: {
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
            }
        }, [
            React.createElement('h4', {
                key: 'results-title',
                style: { marginTop: 0, color: '#2d3748' }
            }, `🚨 Found ${comparisonData.differences.length} Structural Differences`),

            React.createElement('div', {
                key: 'summary',
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '10px',
                    marginBottom: '20px'
                }
            }, [
                ['critical', 'Critical Issues'],
                ['high', 'High Priority'],
                ['medium', 'Medium Priority'],
                ['low', 'Low Priority']
            ].map(([severity, label]) => {
                const count = comparisonData.differences.filter(d => d.severity === severity).length;
                return React.createElement('div', {
                    key: severity,
                    style: {
                        background: 'white',
                        padding: '10px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: `2px solid ${getSeverityColor(severity)}`
                    }
                }, [
                    React.createElement('div', {
                        key: 'count',
                        style: { fontSize: '20px', fontWeight: 'bold', color: getSeverityColor(severity) }
                    }, count),
                    React.createElement('div', {
                        key: 'label',
                        style: { fontSize: '12px', color: '#6c757d' }
                    }, label)
                ]);
            })),

            React.createElement('div', { key: 'differences-list' }, 
                comparisonData.differences.map((diff, index) => 
                    React.createElement('div', {
                        key: index,
                        style: {
                            background: 'white',
                            padding: '15px',
                            marginBottom: '10px',
                            borderRadius: '6px',
                            border: `1px solid ${getSeverityColor(diff.severity)}`,
                            borderLeftWidth: '4px'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'header',
                            style: { 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '10px'
                            }
                        }, [
                            React.createElement('strong', {
                                key: 'path',
                                style: { color: '#2d3748' }
                            }, `${getSeverityIcon(diff.severity)} ${diff.path}`),
                            React.createElement('span', {
                                key: 'severity',
                                style: {
                                    background: getSeverityColor(diff.severity),
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    textTransform: 'uppercase'
                                }
                            }, diff.severity)
                        ]),
                        
                        React.createElement('div', {
                            key: 'details',
                            style: { fontSize: '14px', color: '#4a5568' }
                        }, (() => {
                            switch(diff.type) {
                                case 'missing_in_problematic':
                                    return `Missing in problematic trip. Working trip has: ${JSON.stringify(diff.workingValue)}`;
                                case 'extra_in_problematic':
                                    return `Extra field in problematic trip: ${JSON.stringify(diff.problematicValue)}`;
                                case 'type_mismatch':
                                    return `Type mismatch - Working: ${diff.workingType}, Problematic: ${diff.problematicType}`;
                                case 'null_vs_value':
                                    return `Null/empty difference - Working: ${JSON.stringify(diff.workingValue)}, Problematic: ${JSON.stringify(diff.problematicValue)}`;
                                case 'array_length_difference':
                                    return `Array length differs - Working: ${diff.workingLength} items, Problematic: ${diff.problematicLength} items`;
                                case 'value_difference':
                                    return `Value differs - Working: ${JSON.stringify(diff.workingValue)}, Problematic: ${JSON.stringify(diff.problematicValue)}`;
                                default:
                                    return 'Unknown difference type';
                            }
                        })())
                    ])
                )
            )
        ])
    ]);
};

console.log('✅ TripComparisonTab component loaded');