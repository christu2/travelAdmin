/**
 * LogisticsTab Component
 * 
 * Handles inter-city transportation with transport segments and options
 * Includes the comprehensive TransportOptionForm component with flight search capabilities
 * 
 * @param {Object} recommendation - Trip recommendation data
 * @param {Function} updateRecommendation - Function to update recommendation data
 * @param {Function} addTransportSegment - Function to add transport segment
 * @param {Function} removeTransportSegment - Function to remove transport segment
 * @param {Function} addTransportOption - Function to add transport option
 * @param {Function} removeTransportOption - Function to remove transport option
 */

window.LogisticsTab = ({ 
    recommendation, 
    updateRecommendation,
    addTransportSegment,
    removeTransportSegment,
    addTransportOption,
    removeTransportOption
}) => {
    // Ensure logistics and transportSegments arrays exist
    const transportSegments = recommendation?.logistics?.transportSegments || [];
    
    return React.createElement('div', {}, [
        React.createElement('div', {
            key: 'header',
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
        }, [
            React.createElement('h3', { key: 'title' }, `Inter-City Transportation (${transportSegments.length})`),
            React.createElement('button', {
                key: 'add-btn',
                className: 'btn btn-secondary',
                onClick: addTransportSegment
            }, 'Add Transport Segment')
        ]),

        ...transportSegments.map((segment, segmentIndex) => {
            // Ensure transportOptions array exists
            const transportOptions = segment?.transportOptions || [];
            
            return React.createElement('div', {
                key: segment.id,
                className: 'transport-segment'
            }, [
                React.createElement('div', {
                    key: 'segment-header',
                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }
                }, [
                    React.createElement('h4', { key: 'title' }, `Transport Segment ${segmentIndex + 1}`),
                    transportSegments.length > 1 ? React.createElement('button', {
                        key: 'remove-btn',
                        className: 'btn btn-danger',
                        onClick: () => removeTransportSegment(segmentIndex)
                    }, 'Remove Segment') : null
                ]),

                // Segment Details Form
                React.createElement('div', {
                    key: 'segment-details',
                    style: { 
                        background: '#f8f9fa', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        border: '1px solid #e2e8f0'
                    }
                }, [
                    React.createElement('h5', {
                        key: 'segment-details-title',
                        style: { margin: '0 0 15px 0', color: '#2d3748' }
                    }, '🚗 Segment Details'),
                    
                    React.createElement('div', { key: 'segment-row1', className: 'form-row' }, [
                        React.createElement('div', { key: 'from-city-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'from-city-label' }, 'From City'),
                            React.createElement('input', {
                                key: 'from-city-input',
                                type: 'text',
                                value: segment.fromCity || '',
                                onChange: (e) => updateRecommendation(`logistics.transportSegments[${segmentIndex}].fromCity`, e.target.value),
                                placeholder: 'e.g., Chicago, Paris, Rome'
                            })
                        ]),
                        React.createElement('div', { key: 'to-city-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'to-city-label' }, 'To City'),
                            React.createElement('input', {
                                key: 'to-city-input',
                                type: 'text',
                                value: segment.toCity || '',
                                onChange: (e) => updateRecommendation(`logistics.transportSegments[${segmentIndex}].toCity`, e.target.value),
                                placeholder: 'e.g., Chicago, Paris, Rome'
                            })
                        ])
                    ]),
                    
                    React.createElement('div', { key: 'segment-row2', className: 'form-row' }, [
                        React.createElement('div', { key: 'departure-date-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'departure-date-label' }, 'Departure Date'),
                            React.createElement('input', {
                                key: 'departure-date-input',
                                type: 'date',
                                value: segment.departureDate || '',
                                onChange: (e) => {
                                    const newDate = e.target.value;
                                    updateRecommendation(`logistics.transportSegments[${segmentIndex}].departureDate`, newDate);
                                    
                                    // Auto-fill all transport option search dates with the new segment date
                                    if (newDate && transportOptions.length > 0) {
                                        transportOptions.forEach((option, optionIndex) => {
                                            // Only auto-fill if the search date is empty or matches the old segment date
                                            const currentSearchDate = option.details?.departure?.date || '';
                                            const oldSegmentDate = segment.departureDate || '';
                                            
                                            if (!currentSearchDate || currentSearchDate === oldSegmentDate) {
                                                updateRecommendation(`logistics.transportSegments[${segmentIndex}].transportOptions[${optionIndex}].details.departure.date`, newDate);
                                            }
                                        });
                                    }
                                }
                            })
                        ]),
                        React.createElement('div', { key: 'segment-type-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'segment-type-label' }, 'Segment Type'),
                            React.createElement('select', {
                                key: 'segment-type-select',
                                value: segment.segmentType || 'outbound',
                                onChange: (e) => updateRecommendation(`logistics.transportSegments[${segmentIndex}].segmentType`, e.target.value)
                            }, [
                                React.createElement('option', { key: 'outbound', value: 'outbound' }, 'Outbound'),
                                React.createElement('option', { key: 'inbound', value: 'inbound' }, 'Inbound'),
                                React.createElement('option', { key: 'domestic', value: 'domestic' }, 'Domestic'),
                                React.createElement('option', { key: 'connecting', value: 'connecting' }, 'Connecting')
                            ])
                        ])
                    ]),
                    
                    React.createElement('div', { key: 'segment-row3', className: 'form-row' }, [
                        React.createElement('div', { key: 'booking-group-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'booking-group-label' }, [
                                'Booking Group ID ',
                                React.createElement('span', {
                                    key: 'booking-group-help',
                                    style: { fontSize: '12px', color: '#718096' }
                                }, '(for round-trip bookings)')
                            ]),
                            React.createElement('input', {
                                key: 'booking-group-input',
                                type: 'text',
                                value: segment.bookingGroupId || '',
                                onChange: (e) => updateRecommendation(`logistics.transportSegments[${segmentIndex}].bookingGroupId`, e.target.value || null),
                                placeholder: 'e.g., round-trip-1 (leave empty for individual booking)'
                            })
                        ]),
                        React.createElement('div', { key: 'display-sequence-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'display-sequence-label' }, [
                                'Display Sequence ',
                                React.createElement('span', {
                                    key: 'display-sequence-help',
                                    style: { fontSize: '12px', color: '#718096' }
                                }, '(travel order)')
                            ]),
                            React.createElement('input', {
                                key: 'display-sequence-input',
                                type: 'number',
                                value: segment.displaySequence || '',
                                onChange: (e) => updateRecommendation(`logistics.transportSegments[${segmentIndex}].displaySequence`, e.target.value ? parseInt(e.target.value) : null),
                                placeholder: '1, 2, 3...',
                                min: '1'
                            })
                        ])
                    ]),
                    
                    // Visual preview
                    (segment.fromCity && segment.toCity) ? React.createElement('div', {
                        key: 'segment-preview',
                        style: {
                            background: 'white',
                            padding: '12px',
                            borderRadius: '6px',
                            marginTop: '15px',
                            border: '2px solid #e2e8f0',
                            textAlign: 'center'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'preview-text',
                            style: { fontSize: '16px', fontWeight: '600', color: '#2d3748' }
                        }, `${segment.fromCity} → ${segment.toCity}`),
                        segment.departureDate ? React.createElement('div', {
                            key: 'preview-date',
                            style: { fontSize: '14px', color: '#718096', marginTop: '4px' }
                        }, (() => {
                            // Parse date safely to avoid timezone issues
                            try {
                                const dateParts = segment.departureDate.split('-');
                                if (dateParts.length === 3) {
                                    const year = parseInt(dateParts[0]);
                                    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
                                    const day = parseInt(dateParts[2]);
                                    const date = new Date(year, month, day);
                                    return `Departure: ${date.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                    })}`;
                                } else {
                                    return `Departure: ${segment.departureDate}`;
                                }
                            } catch (error) {
                                return `Departure: ${segment.departureDate}`;
                            }
                        })()) : null
                    ]) : null
                ]),

                React.createElement('div', {
                    key: 'transport-options',
                    style: { marginTop: '20px' }
                }, [
                    React.createElement('div', {
                        key: 'options-header',
                        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }
                    }, [
                        React.createElement('h5', { key: 'title' }, `Transport Options (${transportOptions.length})`),
                        React.createElement('button', {
                            key: 'add-btn',
                            className: 'add-button',
                            onClick: () => addTransportOption(segmentIndex)
                        }, 'Add Option')
                    ]),

                    ...transportOptions.map((option, optionIndex) =>
                        React.createElement('div', {
                            key: option.id,
                            style: { border: '1px solid #e2e8f0', borderRadius: '6px', padding: '15px', marginBottom: '10px', background: '#f9f9f9' }
                        }, [
                            React.createElement('div', {
                                key: 'option-header',
                                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }
                            }, [
                                React.createElement('h6', { key: 'title' }, `Option ${optionIndex + 1}`),
                                React.createElement('div', {
                                    key: 'controls',
                                    style: { display: 'flex', alignItems: 'center' }
                                }, [
                                    React.createElement('div', {
                                        key: 'priority-selector',
                                        className: 'priority-selector'
                                    }, [
                                        React.createElement('label', {
                                            key: 'label',
                                            style: { marginRight: '5px', fontSize: '12px' }
                                        }, 'Priority:'),
                                        React.createElement('select', {
                                            key: 'select',
                                            value: option.priority,
                                            onChange: (e) => updateRecommendation(`logistics.transportSegments[${segmentIndex}].transportOptions[${optionIndex}].priority`, parseInt(e.target.value))
                                        }, [
                                            React.createElement('option', { key: '1', value: 1 }, '1 (Highest)'),
                                            React.createElement('option', { key: '2', value: 2 }, '2'),
                                            React.createElement('option', { key: '3', value: 3 }, '3')
                                        ])
                                    ]),
                                    transportOptions.length > 1 ? React.createElement('button', {
                                        key: 'remove-btn',
                                        className: 'remove-button',
                                        onClick: () => removeTransportOption(segmentIndex, optionIndex)
                                    }, 'Remove') : null
                                ])
                            ]),

                            // Round-trip and recommendation fields
                            React.createElement('div', { key: 'option-meta-fields', className: 'form-row', style: { marginBottom: '15px' } }, [
                                React.createElement('div', { key: 'round-trip-group', className: 'form-group' }, [
                                    React.createElement('label', {
                                        key: 'round-trip-label',
                                        style: { display: 'flex', alignItems: 'center', gap: '8px' }
                                    }, [
                                        React.createElement('input', {
                                            key: 'round-trip-checkbox',
                                            type: 'checkbox',
                                            checked: option.isRoundTrip || false,
                                            onChange: (e) => updateRecommendation(`logistics.transportSegments[${segmentIndex}].transportOptions[${optionIndex}].isRoundTrip`, e.target.checked)
                                        }),
                                        'Round-trip booking'
                                    ])
                                ]),
                                React.createElement('div', { key: 'recommended-group', className: 'form-group' }, [
                                    React.createElement('label', {
                                        key: 'recommended-label',
                                        style: { display: 'flex', alignItems: 'center', gap: '8px' }
                                    }, [
                                        React.createElement('input', {
                                            key: 'recommended-checkbox',
                                            type: 'checkbox',
                                            checked: option.recommendedSelection || false,
                                            onChange: (e) => updateRecommendation(`logistics.transportSegments[${segmentIndex}].transportOptions[${optionIndex}].recommendedSelection`, e.target.checked)
                                        }),
                                        'Recommended selection'
                                    ])
                                ])
                            ]),
                            
                            // Linked segment field for round-trip bookings
                            option.isRoundTrip ? React.createElement('div', { key: 'linked-segment-field', className: 'form-group', style: { marginBottom: '15px' } }, [
                                React.createElement('label', { key: 'linked-segment-label' }, [
                                    'Linked Return Segment ',
                                    React.createElement('span', {
                                        key: 'linked-segment-help',
                                        style: { fontSize: '12px', color: '#718096' }
                                    }, '(select the return segment for this round-trip)')
                                ]),
                                React.createElement('select', {
                                    key: 'linked-segment-select',
                                    value: option.linkedSegmentId || '',
                                    onChange: (e) => updateRecommendation(`logistics.transportSegments[${segmentIndex}].transportOptions[${optionIndex}].linkedSegmentId`, e.target.value || null),
                                    style: { width: '100%' }
                                }, [
                                    React.createElement('option', { key: 'empty', value: '' }, 'Select return segment...'),
                                    ...transportSegments
                                        .map((seg, idx) => {
                                            // Don't show current segment as an option
                                            if (idx === segmentIndex) return null;
                                            
                                            const displayName = seg.fromCity && seg.toCity ? 
                                                `${seg.fromCity} → ${seg.toCity}` : 
                                                `Segment ${idx + 1}`;
                                            const displayDate = seg.departureDate ? 
                                                (() => {
                                                    // Parse date safely to avoid timezone issues
                                                    try {
                                                        const dateParts = seg.departureDate.split('-');
                                                        if (dateParts.length === 3) {
                                                            const year = parseInt(dateParts[0]);
                                                            const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
                                                            const day = parseInt(dateParts[2]);
                                                            const date = new Date(year, month, day);
                                                            return ` (${date.toLocaleDateString('en-US', { 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })})`;
                                                        } else {
                                                            return ` (${seg.departureDate})`;
                                                        }
                                                    } catch (error) {
                                                        return ` (${seg.departureDate})`;
                                                    }
                                                })() : 
                                                '';
                                            
                                            return React.createElement('option', {
                                                key: seg.id || idx,
                                                value: seg.id || `segment-${idx}`
                                            }, `${displayName}${displayDate}`);
                                        })
                                        .filter(Boolean)
                                ]),
                                React.createElement('div', {
                                    key: 'linked-segment-info',
                                    style: { fontSize: '11px', color: '#718096', marginTop: '4px' }
                                }, [
                                    'Selected ID: ',
                                    React.createElement('code', {
                                        key: 'segment-id',
                                        style: { background: '#f1f5f9', padding: '2px 4px', borderRadius: '3px' }
                                    }, option.linkedSegmentId || 'None')
                                ])
                            ]) : null,

                            React.createElement(window.TransportOptionForm, {
                                key: 'option-form',
                                option: option,
                                basePath: `logistics.transportSegments[${segmentIndex}].transportOptions[${optionIndex}]`,
                                updateRecommendation: updateRecommendation
                            })
                        ])
                    )
                ])
            ]);
        })
    ]);
};

// Transport Option Form Component
window.TransportOptionForm = ({ option, basePath, updateRecommendation }) => {
    const transportType = option.transportType || 'flight';
    const [flightSearchResults, setFlightSearchResults] = React.useState([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchError, setSearchError] = React.useState('');
    
    // Helper function to format dates for HTML date input
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        
        // If already in yyyy-MM-dd format, return as-is
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        
        // Parse various date formats and convert to yyyy-MM-dd
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    };
    
    // Helper function to format duration from minutes to "Xh Ym" format
    const formatDuration = (durationInMinutes) => {
        if (!durationInMinutes || isNaN(durationInMinutes)) return '';
        
        const minutes = parseInt(durationInMinutes);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0 && remainingMinutes > 0) {
            return `${hours}h ${remainingMinutes}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${remainingMinutes}m`;
        }
    };

    // Flight search function using SerpAPI
    const searchFlights = async () => {
        const departureCode = option.details.details?.departure?.airportCode || '';
        const arrivalCode = option.details.details?.arrival?.airportCode || '';
        const searchDate = option.details.details?.departure?.date || '';
        
        if (!departureCode || !arrivalCode || !searchDate) {
            setSearchError('Please enter departure airport, arrival airport, and date first');
            return;
        }
        
        setIsSearching(true);
        setSearchError('');
        setFlightSearchResults([]);
        
        try {
            console.log(`Searching flights: ${departureCode} → ${arrivalCode} on ${searchDate}`);
            
            // Use local proxy server to avoid CORS issues
            const baseUrl = window.location.protocol === 'https:' ? 'https://your-production-domain.com' : 'http://localhost:3003';
            const apiUrl = `${baseUrl}/api/flights/search?departure_id=${departureCode}&arrival_id=${arrivalCode}&outbound_date=${searchDate}&currency=USD&hl=en`;
            
            // Validate URL for security
            if (window.SecurityHelpers && !window.SecurityHelpers.validateUrl(apiUrl)) {
                console.error('Invalid flight search URL:', apiUrl);
                return;
            }
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('SerpAPI response:', data);
            console.log('First flight booking data:', data.best_flights?.[0] || data.other_flights?.[0]);
            
            if (data.best_flights || data.other_flights) {
                const allFlights = [...(data.best_flights || []), ...(data.other_flights || [])];
                
                const processedFlights = allFlights.slice(0, 10).map((flight, index) => {
                    const firstSegment = flight.flights[0];
                    const lastSegment = flight.flights[flight.flights.length - 1];
                    
                    // Build route description with layovers
                    const routeParts = flight.flights.map(segment => segment.departure_airport.id);
                    routeParts.push(lastSegment.arrival_airport.id);
                    const routeDescription = routeParts.join(' → ');
                    
                    // Get layover airports and duration details
                    const layoverAirports = flight.flights.slice(0, -1).map(s => s.arrival_airport.id);
                    
                    // Check for overnight indicators and date changes
                    const departureDate = new Date(firstSegment.departure_airport.time);
                    const arrivalDate = new Date(lastSegment.arrival_airport.time);
                    const hasDateChange = departureDate.toDateString() !== arrivalDate.toDateString();
                    
                    // Check for overnight layovers (layovers > 6 hours)
                    let hasOvernightLayover = false;
                    if (flight.flights.length > 1) {
                        for (let i = 0; i < flight.flights.length - 1; i++) {
                            const currentArrival = new Date(flight.flights[i].arrival_airport.time);
                            const nextDeparture = new Date(flight.flights[i + 1].departure_airport.time);
                            const layoverHours = (nextDeparture - currentArrival) / (1000 * 60 * 60);
                            if (layoverHours >= 6) {
                                hasOvernightLayover = true;
                                break;
                            }
                        }
                    }
                    
                    // Check if it's a red-eye flight (departure between 9 PM - 6 AM)
                    const depHour = departureDate.getHours();
                    const isRedEye = depHour >= 21 || depHour <= 6;
                    
                    const segments = flight.flights.map((segment, segIndex) => {
                        const segDepDate = new Date(segment.departure_airport.time);
                        const segArrDate = new Date(segment.arrival_airport.time);
                        const segHasDateChange = segDepDate.toDateString() !== segArrDate.toDateString();
                        
                        return {
                            from: segment.departure_airport.id,
                            fromName: segment.departure_airport.name,
                            to: segment.arrival_airport.id,
                            toName: segment.arrival_airport.name,
                            airline: segment.airline,
                            flightNumber: segment.flight_number,
                            duration: formatDuration(segment.duration),
                            aircraft: segment.airplane || 'N/A',
                            departureDate: segDepDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            arrivalDate: segArrDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            hasDateChange: segHasDateChange
                        };
                    });
                    
                    return {
                        id: `serpapi-${index}`,
                        // Primary airline (usually first segment)
                        airline: firstSegment.airline,
                        flightNumber: flight.flights.length > 1 ? 
                            flight.flights.map(seg => seg.flight_number).join(', ') : 
                            firstSegment.flight_number,
                        // Full journey endpoints
                        departure: {
                            airport: firstSegment.departure_airport.id,
                            airportName: firstSegment.departure_airport.name,
                            time: firstSegment.departure_airport.time,
                            localTime: new Date(firstSegment.departure_airport.time).toLocaleTimeString('en-US', {
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            date: departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        },
                        arrival: {
                            airport: lastSegment.arrival_airport.id,
                            airportName: lastSegment.arrival_airport.name,
                            time: lastSegment.arrival_airport.time,
                            localTime: new Date(lastSegment.arrival_airport.time).toLocaleTimeString('en-US', {
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            date: arrivalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        },
                        // Enhanced connection details
                        route: routeDescription,
                        totalDuration: formatDuration(flight.total_duration),
                        segments: segments,
                        layovers: flight.flights.length - 1,
                        layoverAirports: layoverAirports,
                        aircraft: segments.map(s => s.aircraft).join(', '),
                        price: flight.price,
                        carbonEmissions: flight.carbon_emissions?.this_flight || 0,
                        travelClass: flight.travel_class || 'Economy',
                        // Booking information
                        bookingToken: flight.booking_token,
                        bookingUrl: flight.booking?.url || flight.booking_url,
                        // Overnight indicators
                        hasDateChange: hasDateChange,
                        hasOvernightLayover: hasOvernightLayover,
                        isRedEye: isRedEye
                    };
                });
                
                setFlightSearchResults(processedFlights);
                console.log(`Found ${processedFlights.length} flights`);
            } else {
                setSearchError('No flights found for this route and date');
            }
        } catch (error) {
            console.error('Flight search error:', error);
            setSearchError(`Search failed: ${error.message}`);
        } finally {
            setIsSearching(false);
        }
    };
    
    // Apply selected flight data to form
    const selectFlight = (flight) => {
        // Fix path structure - form uses option.details.flightNumber, not option.details.details.flightNumber
        updateRecommendation(`${basePath}.details.flightNumber`, flight.flightNumber);
        updateRecommendation(`${basePath}.details.airline`, flight.airline);
        updateRecommendation(`${basePath}.details.details.departure.airportCode`, flight.departure.airport);
        updateRecommendation(`${basePath}.details.details.arrival.airportCode`, flight.arrival.airport);
        updateRecommendation(`${basePath}.details.departureAirportName`, flight.departure.airportName);
        updateRecommendation(`${basePath}.details.arrivalAirportName`, flight.arrival.airportName);
        updateRecommendation(`${basePath}.details.details.departure.time`, flight.departure.localTime);
        updateRecommendation(`${basePath}.details.details.arrival.time`, flight.arrival.localTime);
        
        // Fix date format - convert date to proper yyyy-MM-dd format
        const formatDateForForm = (dateStr) => {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().split('T')[0];
            } catch (error) {
                return '';
            }
        };
        
        // Use the search date for departure date (not the actual flight time which might be different timezone)
        const searchDate = option.details.details?.departure?.date;
        if (searchDate) {
            updateRecommendation(`${basePath}.details.details.departure.date`, searchDate);
        } else {
            updateRecommendation(`${basePath}.details.details.departure.date`, formatDateForForm(flight.departure.time));
        }
        
        // For arrival date, calculate based on search date + any day changes
        const arrivalDate = searchDate && flight.hasDateChange ? 
            (() => {
                const depDate = new Date(searchDate);
                depDate.setDate(depDate.getDate() + 1);
                return depDate.toISOString().split('T')[0];
            })() :
            searchDate || formatDateForForm(flight.arrival.time);
        
        updateRecommendation(`${basePath}.details.details.arrival.date`, arrivalDate);
        updateRecommendation(`${basePath}.duration`, flight.totalDuration || flight.duration);
        updateRecommendation(`${basePath}.cost.cashAmount`, flight.price);
        updateRecommendation(`${basePath}.cost.totalCashValue`, flight.price);
        updateRecommendation(`${basePath}.details.aircraft`, flight.aircraft);
        
        // Store booking information
        if (flight.bookingUrl) {
            updateRecommendation(`${basePath}.bookingUrl`, flight.bookingUrl);
        }
        
        // Store enhanced connection data
        if (flight.route) {
            updateRecommendation(`${basePath}.details.details.route`, flight.route);
        }
        if (flight.segments) {
            updateRecommendation(`${basePath}.details.segments`, flight.segments);
        }
        if (flight.layoverAirports && flight.layoverAirports.length > 0) {
            updateRecommendation(`${basePath}.details.layoverAirports`, flight.layoverAirports);
        }
        updateRecommendation(`${basePath}.details.layovers`, flight.layovers);
        
        // Store overnight indicators
        updateRecommendation(`${basePath}.details.hasDateChange`, flight.hasDateChange);
        updateRecommendation(`${basePath}.details.hasOvernightLayover`, flight.hasOvernightLayover);
        updateRecommendation(`${basePath}.details.isRedEye`, flight.isRedEye);
        
        // Don't overwrite the dates we just set above - these would be the API flight dates
        // which might be in different timezone or format than what we want
        // The dates are already set correctly above using the search date
        
        console.log(`Selected flight: ${flight.route || flight.airline + ' ' + flight.flightNumber} (${flight.layovers === 0 ? 'Direct' : flight.layovers + ' stops'})`);
    };

    const renderDetailsForm = () => {
        switch (transportType) {
            case 'flight':
                return React.createElement(React.Fragment, {}, [
                    // Flight Search Section
                    React.createElement('div', {
                        key: 'flight-search',
                        style: { background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }
                    }, [
                        React.createElement('h6', {
                            key: 'search-title',
                            style: { margin: '0 0 15px 0', color: '#2d3748' }
                        }, '🔍 Search Real Flights'),
                        React.createElement('div', { key: 'search-row1', className: 'form-row' }, [
                            React.createElement('div', { key: 'from-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'from-label' }, 'From Airport'),
                                React.createElement('input', {
                                    key: 'from-input',
                                    type: 'text',
                                    value: option.details.details?.departure?.airportCode || '',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.details.departure.airportCode`, e.target.value.toUpperCase()),
                                    placeholder: 'e.g., JFK, LAX, ORD',
                                    style: { textTransform: 'uppercase' }
                                })
                            ]),
                            React.createElement('div', { key: 'to-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'to-label' }, 'To Airport'),
                                React.createElement('input', {
                                    key: 'to-input',
                                    type: 'text',
                                    value: option.details.details?.arrival?.airportCode || '',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.details.arrival.airportCode`, e.target.value.toUpperCase()),
                                    placeholder: 'e.g., JFK, LAX, ORD',
                                    style: { textTransform: 'uppercase' }
                                })
                            ])
                        ]),
                        React.createElement('div', { key: 'search-row2', className: 'form-row' }, [
                            React.createElement('div', { key: 'date-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'date-label' }, [
                                    'Search Date',
                                    React.createElement('span', {
                                        key: 'auto-fill-note',
                                        style: { 
                                            fontSize: '11px', 
                                            color: '#718096', 
                                            fontWeight: 'normal',
                                            marginLeft: '8px'
                                        }
                                    }, '(auto-filled from segment date, editable)')
                                ]),
                                React.createElement('input', {
                                    key: 'date-input',
                                    type: 'date',
                                    value: formatDateForInput(option.details.details?.departure?.date) || '',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.details.departure.date`, e.target.value),
                                    placeholder: 'Search date for flights'
                                })
                            ]),
                            React.createElement('div', { key: 'search-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'search-label' }, 'Search Flights'),
                                React.createElement('button', {
                                    key: 'search-btn',
                                    type: 'button',
                                    className: 'btn btn-primary',
                                    onClick: searchFlights,
                                    disabled: isSearching,
                                    style: { width: '100%', marginTop: '8px' }
                                }, isSearching ? '🔍 Searching...' : '🔍 Search Flights')
                            ])
                        ]),
                        searchError ? React.createElement('div', {
                            key: 'search-error',
                            style: {
                                background: '#fed7d7',
                                color: '#e53e3e',
                                padding: '10px',
                                borderRadius: '6px',
                                marginTop: '10px',
                                fontSize: '14px'
                            }
                        }, searchError) : null
                    ]),

                    // Flight Search Results
                    flightSearchResults.length > 0 ? React.createElement('div', {
                        key: 'search-results',
                        style: { marginBottom: '20px' }
                    }, [
                        React.createElement('div', {
                            key: 'results-header',
                            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }
                        }, [
                            React.createElement('h6', {
                                key: 'results-title',
                                style: { margin: 0, color: '#2d3748' }
                            }, `✈️ Available Flights (${flightSearchResults.length})`),
                            React.createElement('div', {
                                key: 'legend',
                                style: { fontSize: '11px', color: '#718096' }
                            }, '🌙 Red-eye flight • ⏰ Overnight layover (6+ hrs)')
                        ]),
                        React.createElement('div', {
                            key: 'results-list',
                            style: { maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }
                        }, flightSearchResults.map((flight, index) =>
                            React.createElement('div', {
                                key: flight.id,
                                style: {
                                    padding: '15px',
                                    borderBottom: index < flightSearchResults.length - 1 ? '1px solid #e2e8f0' : 'none',
                                    cursor: 'pointer',
                                    background: 'white',
                                    transition: 'background-color 0.2s'
                                },
                                onMouseOver: (e) => e.target.style.background = '#f7fafc',
                                onMouseOut: (e) => e.target.style.background = 'white',
                                onClick: () => selectFlight(flight)
                            }, [
                                React.createElement('div', {
                                    key: 'flight-header',
                                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }
                                }, [
                                    React.createElement('div', {
                                        key: 'flight-info',
                                        style: { fontWeight: '600', color: '#2d3748' }
                                    }, [
                                        `${flight.airline} ${flight.flightNumber}`,
                                        flight.bookingUrl ? React.createElement('span', {
                                            key: 'bookable-badge',
                                            style: {
                                                fontSize: '11px',
                                                color: '#38a169',
                                                marginLeft: '8px',
                                                background: '#f0fff4',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }
                                        }, '🔗 Bookable') : null
                                    ]),
                                    React.createElement('div', {
                                        key: 'price',
                                        style: { fontSize: '18px', fontWeight: '700', color: '#38a169' }
                                    }, `$${flight.price}`)
                                ]),
                                React.createElement('div', {
                                    key: 'flight-details',
                                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#4a5568' }
                                }, [
                                    React.createElement('div', { key: 'route' }, [
                                        React.createElement('strong', { key: 'dep' }, flight.departure.airport),
                                        ` ${flight.departure.localTime}`,
                                        flight.hasDateChange ? React.createElement('span', {
                                            key: 'dep-date',
                                            style: { fontSize: '11px', color: '#718096' }
                                        }, ` ${flight.departure.date}`) : null,
                                        ' → ',
                                        React.createElement('strong', { key: 'arr' }, flight.arrival.airport),
                                        ` ${flight.arrival.localTime}`,
                                        flight.hasDateChange ? React.createElement('span', {
                                            key: 'arr-date',
                                            style: { fontSize: '11px', color: '#718096' }
                                        }, ` ${flight.arrival.date}`) : null
                                    ]),
                                    React.createElement('div', {
                                        key: 'duration-info',
                                        style: { textAlign: 'right' }
                                    }, [
                                        React.createElement('div', { key: 'duration' }, flight.totalDuration || flight.duration),
                                        React.createElement('div', {
                                            key: 'stops',
                                            style: { fontSize: '12px', color: '#718096' }
                                        }, [
                                            flight.layovers === 0 ? 'Direct' : `${flight.layovers} stop${flight.layovers > 1 ? 's' : ''}`,
                                            flight.isRedEye ? React.createElement('span', {
                                                key: 'redeye',
                                                style: { color: '#9f7aea', marginLeft: '5px' }
                                            }, '🌙') : null,
                                            flight.hasOvernightLayover ? React.createElement('span', {
                                                key: 'overnight',
                                                style: { color: '#f56565', marginLeft: '5px' }
                                            }, '⏰') : null
                                        ])
                                    ])
                                ]),
                                React.createElement('div', {
                                    key: 'route-description',
                                    style: { fontSize: '12px', color: '#718096', marginTop: '5px' }
                                }, flight.route || `${flight.departure.airportName} → ${flight.arrival.airportName}`),
                                flight.layovers > 0 ? React.createElement('div', {
                                    key: 'layover-info',
                                    style: { fontSize: '11px', color: '#9ca3af', marginTop: '3px', fontStyle: 'italic' }
                                }, `via ${flight.layoverAirports?.join(', ')} • ${flight.segments?.length} segments`) : null
                            ])
                        ))
                    ]) : null,

                    // Manual/Selected Flight Details
                    React.createElement('div', {
                        key: 'flight-details',
                        style: { background: '#f0fff4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }
                    }, [
                        React.createElement('h6', {
                            key: 'details-title',
                            style: { margin: '0 0 15px 0', color: '#2d3748' }
                        }, '✈️ Selected Flight Details'),
                        React.createElement('div', { key: 'details-row1', className: 'form-row' }, [
                            React.createElement('div', { key: 'flight-number-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'flight-number-label' }, 'Flight Number'),
                                React.createElement('input', {
                                    key: 'flight-number-input',
                                    type: 'text',
                                    value: option.details.flightNumber || '',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.flightNumber`, e.target.value),
                                    placeholder: 'e.g., UA467, AA123'
                                })
                            ]),
                            React.createElement('div', { key: 'airline-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'airline-label' }, 'Airline'),
                                React.createElement('input', {
                                    key: 'airline-input',
                                    type: 'text',
                                    value: option.details.airline || '',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.airline`, e.target.value),
                                    placeholder: 'e.g., United Airlines'
                                })
                            ])
                        ]),
                        React.createElement('div', { key: 'details-row2', className: 'form-row' }, [
                            React.createElement('div', { key: 'dep-airport-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'dep-airport-label' }, 'Departure Airport Name'),
                                React.createElement('input', {
                                    key: 'dep-airport-input',
                                    type: 'text',
                                    value: option.details.departureAirportName || '',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.departureAirportName`, e.target.value),
                                    placeholder: 'e.g., John F. Kennedy International Airport'
                                })
                            ]),
                            React.createElement('div', { key: 'arr-airport-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'arr-airport-label' }, 'Arrival Airport Name'),
                                React.createElement('input', {
                                    key: 'arr-airport-input',
                                    type: 'text',
                                    value: option.details.arrivalAirportName || '',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.arrivalAirportName`, e.target.value),
                                    placeholder: 'e.g., Los Angeles International Airport'
                                })
                            ])
                        ]),
                        React.createElement('div', { key: 'details-row3', className: 'form-row' }, [
                            React.createElement('div', { key: 'class-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'class-label' }, 'Class'),
                                React.createElement('select', {
                                    key: 'class-select',
                                    value: option.details.class || 'economy',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.class`, e.target.value)
                                }, [
                                    React.createElement('option', { key: 'economy', value: 'economy' }, 'Economy'),
                                    React.createElement('option', { key: 'premium', value: 'premium' }, 'Premium Economy'),
                                    React.createElement('option', { key: 'business', value: 'business' }, 'Business'),
                                    React.createElement('option', { key: 'first', value: 'first' }, 'First')
                                ])
                            ]),
                            React.createElement('div', { key: 'aircraft-group', className: 'form-group' }, [
                                React.createElement('label', { key: 'aircraft-label' }, 'Aircraft Type'),
                                React.createElement('input', {
                                    key: 'aircraft-input',
                                    type: 'text',
                                    value: option.details.aircraft || '',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.aircraft`, e.target.value),
                                    placeholder: 'e.g., Boeing 737-800'
                                })
                            ])
                        ])
                    ])
                ]);
            case 'train':
                return React.createElement(React.Fragment, {}, [
                    React.createElement('div', { key: 'train-row', className: 'form-row' }, [
                        React.createElement('div', { key: 'operator-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'operator-label' }, 'Operator'),
                            React.createElement('input', {
                                key: 'operator-input',
                                type: 'text',
                                value: option.details.details?.operatorName || '',
                                onChange: (e) => updateRecommendation(`${basePath}.details.details.operatorName`, e.target.value)
                            })
                        ]),
                        React.createElement('div', { key: 'train-number-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'train-number-label' }, 'Train Number'),
                            React.createElement('input', {
                                key: 'train-number-input',
                                type: 'text',
                                value: option.details.details?.trainNumber || '',
                                onChange: (e) => updateRecommendation(`${basePath}.details.details.trainNumber`, e.target.value)
                            })
                        ])
                    ])
                ]);
            case 'car':
                return React.createElement(React.Fragment, {}, [
                    React.createElement('div', { key: 'car-row', className: 'form-row' }, [
                        React.createElement('div', { key: 'company-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'company-label' }, 'Rental Company'),
                            React.createElement('input', {
                                key: 'company-input',
                                type: 'text',
                                value: option.details.details?.company || '',
                                onChange: (e) => updateRecommendation(`${basePath}.details.details.company`, e.target.value)
                            })
                        ]),
                        React.createElement('div', { key: 'car-type-group', className: 'form-group' }, [
                            React.createElement('label', { key: 'car-type-label' }, 'Car Type'),
                            React.createElement('input', {
                                key: 'car-type-input',
                                type: 'text',
                                value: option.details.details?.carType || '',
                                onChange: (e) => updateRecommendation(`${basePath}.details.details.carType`, e.target.value)
                            })
                        ])
                    ])
                ]);
            default:
                return null;
        }
    };

    return React.createElement(React.Fragment, {}, [
        // Transport Type Selection
        React.createElement('div', { key: 'transport-type-row', className: 'form-row' }, [
            React.createElement('div', { key: 'transport-type-group', className: 'form-group' }, [
                React.createElement('label', { key: 'transport-type-label' }, 'Transport Type'),
                React.createElement('select', {
                    key: 'transport-type-select',
                    value: transportType,
                    onChange: (e) => {
                        updateRecommendation(`${basePath}.transportType`, e.target.value);
                        // Update details structure when transport type changes
                        updateRecommendation(`${basePath}.details`, window.DataHelpers?.createEmptyTransportDetails?.(e.target.value) || {});
                    }
                }, [
                    React.createElement('option', { key: 'flight', value: 'flight' }, 'Flight'),
                    React.createElement('option', { key: 'train', value: 'train' }, 'Train'),
                    React.createElement('option', { key: 'bus', value: 'bus' }, 'Bus'),
                    React.createElement('option', { key: 'ferry', value: 'ferry' }, 'Ferry'),
                    React.createElement('option', { key: 'car', value: 'car' }, 'Car Rental')
                ])
            ])
        ]),

        React.createElement('div', { key: 'time-row', className: 'form-row' }, [
            React.createElement('div', { key: 'departure-time-group', className: 'form-group' }, [
                React.createElement('label', { key: 'departure-time-label' }, 'Departure Time'),
                React.createElement('input', {
                    key: 'departure-time-input',
                    type: 'time',
                    value: option.details.details?.departure?.time || '',
                    onChange: (e) => updateRecommendation(`${basePath}.details.details.departure.time`, e.target.value)
                })
            ]),
            React.createElement('div', { key: 'arrival-time-group', className: 'form-group' }, [
                React.createElement('label', { key: 'arrival-time-label' }, 'Arrival Time'),
                React.createElement('div', {
                    key: 'arrival-time-wrapper',
                    style: { display: 'flex', alignItems: 'center', gap: '8px' }
                }, [
                    React.createElement('input', {
                        key: 'arrival-time-input',
                        type: 'time',
                        value: option.details.details?.arrival?.time || '',
                        onChange: (e) => updateRecommendation(`${basePath}.details.details.arrival.time`, e.target.value),
                        style: { flex: 1 }
                    }),
                    React.createElement('div', {
                        key: 'date-change-controls',
                        style: { display: 'flex', alignItems: 'center', gap: '8px' }
                    }, [
                        // Manual override checkbox
                        React.createElement('label', {
                            key: 'manual-override-label',
                            style: { 
                                fontSize: '11px', 
                                color: '#718096', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                cursor: 'pointer'
                            }
                        }, [
                            React.createElement('input', {
                                key: 'manual-override-checkbox',
                                type: 'checkbox',
                                checked: option.details.details?.showDateChange || false,
                                onChange: (e) => updateRecommendation(`${basePath}.details.details.showDateChange`, e.target.checked),
                                style: { margin: 0 }
                            }),
                            '+1 day'
                        ]),
                        
                        // Show the +1 indicator based on manual override
                        option.details.details?.showDateChange ? 
                            React.createElement('span', {
                                key: 'date-change-indicator',
                                style: {
                                    fontSize: '12px',
                                    color: '#f56565',
                                    fontWeight: '600',
                                    background: '#fed7d7',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }
                            }, '+1') : null
                    ])
                ])
            ])
        ]),

        renderDetailsForm(),

        // Round-trip pricing guidance
        option.isRoundTrip && React.createElement('div', {
            key: 'round-trip-pricing-guide',
            style: {
                background: '#fef3cd',
                border: '1px solid #fbbf24',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '15px'
            }
        }, [
            React.createElement('div', {
                key: 'guide-title',
                style: { fontWeight: '600', color: '#92400e', marginBottom: '8px', fontSize: '14px' }
            }, '💡 Round-Trip Pricing Guide'),
            React.createElement('div', {
                key: 'guide-text',
                style: { fontSize: '13px', color: '#92400e', lineHeight: '1.4' }
            }, [
                React.createElement('div', { key: 'line1' }, '• Enter the TOTAL round-trip price in this segment'),
                React.createElement('div', { key: 'line2' }, '• Set the return segment price to $0'),
                React.createElement('div', { key: 'line3' }, '• This prevents double-counting and matches real bookings')
            ])
        ]),

        // Cost Structure - iOS FlexibleCost format (cash and points)
        React.createElement('div', { key: 'cost-row1', className: 'form-row' }, [
            React.createElement('div', { key: 'cash-amount-group', className: 'form-group' }, [
                React.createElement('label', { key: 'cash-amount-label' }, [
                    'Cash Amount',
                    option.isRoundTrip && React.createElement('span', {
                        key: 'round-trip-hint',
                        style: {
                            fontSize: '11px',
                            color: '#f59e0b',
                            marginLeft: '8px',
                            fontWeight: '600'
                        }
                    }, '(Total round-trip price)')
                ]),
                React.createElement('input', {
                    key: 'cash-amount-input',
                    type: 'number',
                    value: option.cost?.cashAmount || 0,
                    onChange: (e) => {
                        const amount = parseFloat(e.target.value);
                        updateRecommendation(`${basePath}.cost.cashAmount`, amount);
                        updateRecommendation(`${basePath}.cost.totalCashValue`, amount);
                    },
                    placeholder: option.isRoundTrip ? 'Enter total round-trip price' : '0'
                })
            ])
        ]),
        React.createElement('div', { key: 'cost-row2', className: 'form-row' }, [
            React.createElement('div', { key: 'points-amount-group', className: 'form-group' }, [
                React.createElement('label', { key: 'points-amount-label' }, 'Points Amount'),
                React.createElement('input', {
                    key: 'points-amount-input',
                    type: 'number',
                    value: option.cost?.pointsAmount || '',
                    onChange: (e) => updateRecommendation(`${basePath}.cost.pointsAmount`, e.target.value ? parseInt(e.target.value) : null),
                    placeholder: '0 points'
                })
            ]),
            React.createElement('div', { key: 'points-program-group', className: 'form-group' }, [
                React.createElement('label', { key: 'points-program-label' }, 'Points Program'),
                React.createElement('input', {
                    key: 'points-program-input',
                    type: 'text',
                    value: option.cost?.pointsProgram || '',
                    onChange: (e) => updateRecommendation(`${basePath}.cost.pointsProgram`, e.target.value || null),
                    placeholder: 'e.g., Chase, Amex'
                })
            ])
        ]),

        React.createElement('div', { key: 'duration-row', className: 'form-row' }, [
            React.createElement('div', { key: 'duration-group', className: 'form-group' }, [
                React.createElement('label', { key: 'duration-label' }, 'Duration'),
                React.createElement('input', {
                    key: 'duration-input',
                    type: 'text',
                    value: option.duration || '',
                    onChange: (e) => updateRecommendation(`${basePath}.duration`, e.target.value),
                    placeholder: 'e.g., 2h 30m'
                })
            ])
        ]),

        React.createElement('div', { key: 'booking-url-group', className: 'form-group' }, [
            React.createElement('label', { key: 'booking-url-label' }, [
                'Booking URL',
                option.bookingUrl && option.details.bookingToken ? React.createElement('span', {
                    key: 'google-flights-badge',
                    style: {
                        fontSize: '11px',
                        color: '#38a169',
                        marginLeft: '8px',
                        background: '#f0fff4',
                        padding: '2px 6px',
                        borderRadius: '4px'
                    }
                }, '🔗 From Google Flights') : null
            ]),
            React.createElement('div', {
                key: 'booking-url-wrapper',
                style: { display: 'flex', alignItems: 'center', gap: '8px' }
            }, [
                React.createElement('input', {
                    key: 'booking-url-input',
                    type: 'url',
                    value: option.bookingUrl || '',
                    onChange: (e) => updateRecommendation(`${basePath}.bookingUrl`, e.target.value),
                    style: { flex: 1 },
                    placeholder: 'Enter booking URL or select flight from search above'
                }),
                option.bookingUrl ? React.createElement('a', {
                    key: 'booking-url-link',
                    href: option.bookingUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    style: {
                        background: '#667eea',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: '500'
                    }
                }, '🔗 Open') : null
            ])
        ]),

        React.createElement('div', { key: 'notes-group', className: 'form-group' }, [
            React.createElement('label', { key: 'notes-label' }, 'Notes'),
            React.createElement('textarea', {
                key: 'notes-textarea',
                value: option.notes || '',
                onChange: (e) => updateRecommendation(`${basePath}.notes`, e.target.value),
                rows: 2
            })
        ])
    ]);
};

console.log('✅ LogisticsTab and TransportOptionForm components loaded');