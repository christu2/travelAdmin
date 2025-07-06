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
            const apiUrl = `http://localhost:3003/api/flights/search?departure_id=${departureCode}&arrival_id=${arrivalCode}&outbound_date=${searchDate}&currency=USD&hl=en`;
            
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
                            departureDate: segDepDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            arrivalDate: segArrDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
                            date: departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
                            date: arrivalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
        updateRecommendation(`${basePath}.details.details.flightNumber`, flight.flightNumber);
        updateRecommendation(`${basePath}.details.details.airline`, flight.airline);
        updateRecommendation(`${basePath}.details.details.departure.airportCode`, flight.departure.airport);
        updateRecommendation(`${basePath}.details.details.arrival.airportCode`, flight.arrival.airport);
        updateRecommendation(`${basePath}.details.details.departure.airport`, flight.departure.airportName);
        updateRecommendation(`${basePath}.details.details.arrival.airport`, flight.arrival.airportName);
        updateRecommendation(`${basePath}.details.details.departure.time`, flight.departure.localTime);
        updateRecommendation(`${basePath}.details.details.arrival.time`, flight.arrival.localTime);
        updateRecommendation(`${basePath}.details.details.departure.date`, flight.departure.date);
        updateRecommendation(`${basePath}.details.details.arrival.date`, flight.arrival.date);
        updateRecommendation(`${basePath}.duration`, flight.totalDuration || flight.duration);
        updateRecommendation(`${basePath}.cost.cashAmount`, flight.price);
        updateRecommendation(`${basePath}.cost.totalCashValue`, flight.price);
        updateRecommendation(`${basePath}.details.details.aircraft`, flight.aircraft);
        
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
        if (flight.departure.date) {
            updateRecommendation(`${basePath}.details.departureDate`, flight.departure.date);
        }
        if (flight.arrival.date) {
            updateRecommendation(`${basePath}.details.arrivalDate`, flight.arrival.date);
        }
        
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
                                React.createElement('label', { key: 'date-label' }, 'Search Date'),
                                React.createElement('input', {
                                    key: 'date-input',
                                    type: 'date',
                                    value: option.details.details?.departure?.date || '',
                                    onChange: (e) => updateRecommendation(`${basePath}.details.details.departure.date`, e.target.value)
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
                    option.details.details?.arrival?.date && option.details.details?.departure?.date && 
                    option.details.details.arrival.date !== option.details.details.departure.date ? 
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
        ]),

        renderDetailsForm(),

        // Cost Structure - iOS FlexibleCost format (cash and points)
        React.createElement('div', { key: 'cost-row1', className: 'form-row' }, [
            React.createElement('div', { key: 'cash-amount-group', className: 'form-group' }, [
                React.createElement('label', { key: 'cash-amount-label' }, 'Cash Amount'),
                React.createElement('input', {
                    key: 'cash-amount-input',
                    type: 'number',
                    value: option.cost?.cashAmount || 0,
                    onChange: (e) => {
                        const amount = parseFloat(e.target.value);
                        updateRecommendation(`${basePath}.cost.cashAmount`, amount);
                        updateRecommendation(`${basePath}.cost.totalCashValue`, amount);
                    },
                    placeholder: '0'
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