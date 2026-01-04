/**
 * CostsTab Component
 * 
 * Displays and manages cost calculations for the trip
 * Auto-calculates totals from accommodation and transportation costs
 * 
 * @param {Object} recommendation - Trip recommendation data
 * @param {Function} updateRecommendation - Function to update recommendation data
 */

window.CostsTab = ({ recommendation, updateRecommendation }) => {
    // Calculate totals from destinations and logistics (both cash and points)
    const calculateTotals = () => {
        let accommodationCash = 0;
        let accommodationPoints = 0;
        let transportationCash = 0;
        let transportationPoints = 0;

        // Calculate accommodation costs (only highest priority option per destination)
        if (recommendation.destinations) {
            recommendation.destinations.forEach(dest => {
                if (dest.accommodationOptions && dest.accommodationOptions.length > 0) {
                    // Find highest priority option (lowest priority number)
                    const highestPriorityOption = dest.accommodationOptions.reduce((highest, current) => {
                        const currentPriority = current.priority || 999;
                        const highestPriority = highest.priority || 999;
                        return currentPriority < highestPriority ? current : highest;
                    });
                    
                    if (highestPriorityOption.hotel) {
                        // Calculate dates from destination dates
                        let nights = highestPriorityOption.hotel.totalNights || dest.numberOfNights || 1;
                        if (dest.arrivalDate && dest.departureDate) {
                            const checkIn = new Date(dest.arrivalDate);
                            const checkOut = new Date(dest.departureDate);
                            const timeDiff = checkOut.getTime() - checkIn.getTime();
                            nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
                        } else if (dest.checkInDate && dest.checkOutDate) {
                            // Fallback for older data format
                            const checkIn = new Date(dest.checkInDate);
                            const checkOut = new Date(dest.checkOutDate);
                            const timeDiff = checkOut.getTime() - checkIn.getTime();
                            nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
                        }
                        
                        const pricePerNight = highestPriorityOption.hotel.pricePerNight || 0;
                        const pointsPerNight = highestPriorityOption.hotel.pointsPerNight || 0;
                        
                        // Debug logging to check calculation
                        console.log('=== COST CALCULATION DEBUG ===');
                        console.log('Hotel:', highestPriorityOption.hotel.name);
                        console.log('Arrival date:', dest.arrivalDate);
                        console.log('Departure date:', dest.departureDate);
                        console.log('Check-in (fallback):', dest.checkInDate);
                        console.log('Check-out (fallback):', dest.checkOutDate);
                        console.log('numberOfNights from dest:', dest.numberOfNights);
                        console.log('Calculated nights:', nights);
                        console.log('Price per night (cash):', pricePerNight);
                        console.log('Points per night:', pointsPerNight);
                        console.log('Total cash for this hotel:', pricePerNight * nights);
                        console.log('Total points for this hotel:', pointsPerNight * nights);
                        console.log('=== END DEBUG ===');
                        
                        accommodationCash += pricePerNight * nights;
                        accommodationPoints += pointsPerNight * nights;
                        
                        // Also include any existing totalCost if present (backward compatibility)
                        if (highestPriorityOption.hotel.totalCost) {
                            accommodationCash += highestPriorityOption.hotel.totalCost.cashAmount || 0;
                            accommodationPoints += highestPriorityOption.hotel.totalCost.pointsAmount || 0;
                        }
                    }
                }
            });
        }

        // Calculate transportation costs (only highest priority option per segment)
        if (recommendation.logistics && recommendation.logistics.transportSegments) {
            recommendation.logistics.transportSegments.forEach(segment => {
                if (segment.transportOptions && segment.transportOptions.length > 0) {
                    // Find highest priority option (lowest priority number)
                    const highestPriorityOption = segment.transportOptions.reduce((highest, current) => {
                        const currentPriority = current.priority || 999;
                        const highestPriority = highest.priority || 999;
                        return currentPriority < highestPriority ? current : highest;
                    });
                    
                    if (highestPriorityOption.cost) {
                        transportationCash += highestPriorityOption.cost.cashAmount || 0;
                        transportationPoints += highestPriorityOption.cost.pointsAmount || 0;
                    }
                }
            });
        }

        const grandTotalCash = accommodationCash + transportationCash;
        const grandTotalPoints = accommodationPoints + transportationPoints;

        return {
            accommodationCash,
            accommodationPoints,
            transportationCash,
            transportationPoints,
            grandTotalCash,
            grandTotalPoints
        };
    };

    const { 
        accommodationCash, 
        accommodationPoints, 
        transportationCash, 
        transportationPoints, 
        grandTotalCash, 
        grandTotalPoints 
    } = calculateTotals();

    // Note: Total costs are calculated for display only, not stored in recommendation
    // since they don't make sense until user picks specific options

    return React.createElement('div', { className: 'form-section' }, [
        React.createElement('h3', { key: 'title' }, '💰 Cost Breakdown'),
        React.createElement('div', {
            key: 'description',
            style: {
                fontSize: '14px',
                color: '#4a5568',
                marginBottom: '20px',
                fontStyle: 'italic'
            }
        }, 'Cost calculation shows only the highest priority options per destination/segment since users will pick one. Activities are recommendations only and not included in totals.'),

        React.createElement('div', {
            key: 'cost-summary',
            style: {
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
            }
        }, [
            React.createElement('h4', {
                key: 'summary-title',
                style: { margin: '0 0 15px 0', color: '#2d3748' }
            }, '📊 Trip Cost Summary'),

            React.createElement('div', {
                key: 'cost-grid',
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px'
                }
            }, [
                React.createElement('div', {
                    key: 'accommodation-cost',
                    style: {
                        background: 'white',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                    }
                }, [
                    React.createElement('div', {
                        key: 'acc-label',
                        style: { fontSize: '14px', color: '#718096', marginBottom: '8px' }
                    }, '🏨 Accommodations'),
                    React.createElement('div', {
                        key: 'acc-cash',
                        style: { fontSize: '20px', fontWeight: '600', color: '#2d3748', marginBottom: '4px' }
                    }, window.DataHelpers?.formatCurrency(accommodationCash) || `$${accommodationCash.toFixed(2)}`),
                    accommodationPoints > 0 && React.createElement('div', {
                        key: 'acc-points',
                        style: { fontSize: '16px', fontWeight: '500', color: '#667eea' }
                    }, `${accommodationPoints.toLocaleString()} points`)
                ]),

                React.createElement('div', {
                    key: 'transport-cost',
                    style: {
                        background: 'white',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                    }
                }, [
                    React.createElement('div', {
                        key: 'transport-label',
                        style: { fontSize: '14px', color: '#718096', marginBottom: '8px' }
                    }, '✈️ Transportation'),
                    React.createElement('div', {
                        key: 'transport-cash',
                        style: { fontSize: '20px', fontWeight: '600', color: '#2d3748', marginBottom: '4px' }
                    }, window.DataHelpers?.formatCurrency(transportationCash) || `$${transportationCash.toFixed(2)}`),
                    transportationPoints > 0 && React.createElement('div', {
                        key: 'transport-points',
                        style: { fontSize: '16px', fontWeight: '500', color: '#667eea' }
                    }, `${transportationPoints.toLocaleString()} points`)
                ]),

                React.createElement('div', {
                    key: 'total-cost',
                    style: {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '15px',
                        borderRadius: '8px'
                    }
                }, [
                    React.createElement('div', {
                        key: 'total-label',
                        style: { fontSize: '14px', opacity: '0.9', marginBottom: '8px' }
                    }, '💎 Total Trip Cost'),
                    React.createElement('div', {
                        key: 'total-cash',
                        style: { fontSize: '24px', fontWeight: '700', marginBottom: '4px' }
                    }, window.DataHelpers?.formatCurrency(grandTotalCash) || `$${grandTotalCash.toFixed(2)}`),
                    grandTotalPoints > 0 && React.createElement('div', {
                        key: 'total-points',
                        style: { fontSize: '18px', fontWeight: '600', opacity: '0.9' }
                    }, `${grandTotalPoints.toLocaleString()} points`)
                ])
            ]),

            React.createElement('div', {
                key: 'cost-breakdown-note',
                style: {
                    background: '#e6fffa',
                    color: '#047857',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '13px'
                }
            }, [
                React.createElement('div', {
                    key: 'breakdown-title',
                    style: { fontWeight: '600', marginBottom: '6px' }
                }, '💡 Cost Breakdown Summary'),
                React.createElement('div', { key: 'breakdown-content' }, [
                    `• Accommodation: ${window.DataHelpers?.formatCurrency(accommodationCash) || `$${accommodationCash.toFixed(2)}`}${accommodationPoints > 0 ? ` + ${accommodationPoints.toLocaleString()} points` : ''}`,
                    React.createElement('br', { key: 'br1' }),
                    `• Transportation: ${window.DataHelpers?.formatCurrency(transportationCash) || `$${transportationCash.toFixed(2)}`}${transportationPoints > 0 ? ` + ${transportationPoints.toLocaleString()} points` : ''}`,
                    React.createElement('br', { key: 'br2' }),
                    React.createElement('strong', { key: 'total-strong' }, 
                        `• Total Trip Cost: ${window.DataHelpers?.formatCurrency(grandTotalCash) || `$${grandTotalCash.toFixed(2)}`}${grandTotalPoints > 0 ? ` + ${grandTotalPoints.toLocaleString()} points` : ''}`)
                ])
            ])
        ]),

        React.createElement('div', {
            key: 'notes-section',
            className: 'form-group'
        }, [
            React.createElement('label', { key: 'notes-label' }, 'Additional Cost Notes'),
            React.createElement('textarea', {
                key: 'notes-textarea',
                value: recommendation.costNotes || '',
                onChange: (e) => updateRecommendation('costNotes', e.target.value),
                placeholder: 'Add any additional cost information, payment instructions, or notes for the client...',
                rows: 4
            })
        ])
    ]);
};

console.log('✅ CostsTab component loaded');