/**
 * DestinationsTab Component
 * 
 * Handles destinations editing functionality with accommodation options
 * Includes TripAdvisor integration for hotel auto-fill
 * 
 * @param {Object} recommendation - Trip recommendation data
 * @param {Function} updateRecommendation - Function to update recommendation data
 * @param {Function} addDestination - Function to add new destination
 * @param {Function} removeDestination - Function to remove destination
 * @param {Function} addAccommodation - Function to add accommodation option
 * @param {Function} removeAccommodation - Function to remove accommodation option
 */

window.DestinationsTab = ({ 
    recommendation, 
    updateRecommendation, 
    addDestination, 
    removeDestination,
    addAccommodation,
    removeAccommodation 
}) => {
    // Ensure destinations array exists
    const destinations = recommendation?.destinations || [];

    // Helper function to create TripAdvisor booking URL with dates
    const createTripAdvisorBookingUrl = (baseUrl, checkInDate, checkOutDate) => {
        try {
            // Format dates for TripAdvisor (YYYY-MM-DD)
            const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                return date.toISOString().split('T')[0];
            };
            
            const checkIn = formatDate(checkInDate);
            const checkOut = formatDate(checkOutDate);
            
            // TripAdvisor uses semicolon-separated parameters in their URL format
            // Based on research: checkin=2013-08-30;checkout=2013-08-31;adults=2;rooms=1
            const dateParams = `checkin=${checkIn};checkout=${checkOut};adults=2;rooms=1`;
            
            // Add parameters to URL with proper separator
            if (baseUrl.includes('?')) {
                return `${baseUrl}&${dateParams}`;
            } else {
                return `${baseUrl}?${dateParams}`;
            }
        } catch (error) {
            console.log('Could not parse TripAdvisor URL for date injection:', error);
            return baseUrl; // Return original URL if parsing fails
        }
    };

    // TripAdvisor auto-fill function
    const autoFillFromTripAdvisor = async (tripAdvisorId, destIndex, accIndex) => {
        try {
            // Get the destination for date information
            const destination = destinations[destIndex];
            
            // Set the TripAdvisor ID first
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.tripadvisorId`, tripAdvisorId);
            
            // Use the configured hotel proxy server from start-services.sh
            const hotelProxyUrl = window.HOTEL_PROXY_URL || 'http://localhost:3002';
            const response = await fetch(`${hotelProxyUrl}/api/hotels/details/${tripAdvisorId}`);
                
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.hotel) {
                    const hotel = data.hotel;
                    
                    // Auto-fill hotel details from TripAdvisor proxy data
                    if (hotel.name) {
                        updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.name`, hotel.name);
                    }
                    if (hotel.rating) {
                        updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.rating`, parseFloat(hotel.rating));
                    }
                    if (hotel.address) {
                        // Ensure address is a string, not an object
                        const addressStr = typeof hotel.address === 'string' ? hotel.address : 
                                         (hotel.address && hotel.address.formatted_address) || 
                                         'Address not available';
                        updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.location`, addressStr);
                    }
                    if (hotel.description) {
                        updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.detailedDescription`, hotel.description);
                    }
                    // Create booking URL with dates if available
                    let bookingUrl = hotel.tripadvisorUrl;
                    if (destination.checkInDate && destination.checkOutDate && hotel.tripadvisorUrl) {
                        bookingUrl = createTripAdvisorBookingUrl(hotel.tripadvisorUrl, destination.checkInDate, destination.checkOutDate);
                    }
                    if (bookingUrl) {
                        updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.bookingUrl`, bookingUrl);
                    }
                    
                    console.log('✅ Auto-filled hotel details from TripAdvisor:', hotel.name);
                    return;
                }
            }
            
            // Fallback: Use TripAdvisor ID for manual lookup
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.name`, `Hotel from TripAdvisor ID: ${tripAdvisorId}`);
            
            // Create fallback booking URL with dates if available
            let fallbackUrl = `https://www.tripadvisor.com/Hotel_Review-d${tripAdvisorId}.html`;
            if (destination.checkInDate && destination.checkOutDate) {
                fallbackUrl = createTripAdvisorBookingUrl(fallbackUrl, destination.checkInDate, destination.checkOutDate);
            }
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.bookingUrl`, fallbackUrl);
            
            console.log('ℹ️ TripAdvisor API not available via hotel proxy. Using manual lookup.');
            console.log('📋 TripAdvisor ID stored:', tripAdvisorId);
            
        } catch (error) {
            // Fallback: Just set the ID and basic info
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.name`, `Hotel from TripAdvisor ID: ${tripAdvisorId}`);
            
            // Create error fallback booking URL with dates if available
            let errorFallbackUrl = `https://www.tripadvisor.com/Hotel_Review-d${tripAdvisorId}.html`;
            if (destination.checkInDate && destination.checkOutDate) {
                errorFallbackUrl = createTripAdvisorBookingUrl(errorFallbackUrl, destination.checkInDate, destination.checkOutDate);
            }
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.bookingUrl`, errorFallbackUrl);
            
            console.log('ℹ️ TripAdvisor API error, using manual lookup:', error.message);
        }
    };
    
    return React.createElement('div', {}, [
        React.createElement('div', {
            key: 'header',
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
        }, [
            React.createElement('h3', { key: 'title' }, `Destinations (${destinations.length})`),
            React.createElement('button', {
                key: 'add-btn',
                className: 'btn btn-secondary',
                onClick: addDestination
            }, 'Add Destination')
        ]),

        ...destinations.map((destination, destIndex) => 
            React.createElement('div', {
                key: destination.id,
                className: 'destination-card'
            }, [
                React.createElement('div', {
                    key: 'destination-header',
                    className: 'destination-header'
                }, [
                    React.createElement('h4', { key: 'title' }, `Destination ${destIndex + 1}`),
                    destinations.length > 1 ? React.createElement('button', {
                        key: 'remove-btn',
                        className: 'btn btn-danger',
                        onClick: () => removeDestination(destIndex)
                    }, 'Remove') : null
                ]),

                React.createElement('div', {
                    key: 'city-name-group',
                    className: 'form-group'
                }, [
                    React.createElement('label', { key: 'label' }, 'City Name'),
                    React.createElement('input', {
                        key: 'input',
                        type: 'text',
                        value: destination.cityName,
                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].cityName`, e.target.value),
                        placeholder: 'e.g., Madrid, Barcelona, Rome'
                    })
                ]),

                React.createElement('div', {
                    key: 'dates-row',
                    className: 'form-row'
                }, [
                    React.createElement('div', {
                        key: 'checkin-group',
                        className: 'form-group'
                    }, [
                        React.createElement('label', { key: 'label' }, 'Check-in Date'),
                        React.createElement('input', {
                            key: 'input',
                            type: 'date',
                            value: destination.checkInDate || '',
                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].checkInDate`, e.target.value)
                        })
                    ]),
                    React.createElement('div', {
                        key: 'checkout-group',
                        className: 'form-group'
                    }, [
                        React.createElement('label', { key: 'label' }, 'Check-out Date'),
                        React.createElement('input', {
                            key: 'input',
                            type: 'date',
                            value: destination.checkOutDate || '',
                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].checkOutDate`, e.target.value)
                        })
                    ])
                ]),

                React.createElement('div', {
                    key: 'accommodation-options',
                    className: 'accommodation-options'
                }, [
                    React.createElement('div', {
                        key: 'acc-header',
                        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }
                    }, [
                        React.createElement('h5', { key: 'title' }, `Hotel Options (${(destination.accommodationOptions || []).length})`),
                        React.createElement('button', {
                            key: 'add-btn',
                            className: 'add-button',
                            onClick: () => addAccommodation(destIndex)
                        }, 'Add Hotel Option')
                    ]),

                    ...(destination.accommodationOptions || []).map((option, accIndex) =>
                        React.createElement('div', {
                            key: option.id,
                            className: 'accommodation-option'
                        }, [
                            React.createElement('div', {
                                key: 'acc-option-header',
                                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }
                            }, [
                                React.createElement('h6', { key: 'title' }, `Hotel Option ${accIndex + 1}`),
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
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].priority`, parseInt(e.target.value))
                                        }, [
                                            React.createElement('option', { key: '1', value: 1 }, '1 (Highest)'),
                                            React.createElement('option', { key: '2', value: 2 }, '2'),
                                            React.createElement('option', { key: '3', value: 3 }, '3')
                                        ])
                                    ]),
                                    (destination.accommodationOptions || []).length > 1 ? React.createElement('button', {
                                        key: 'remove-btn',
                                        className: 'remove-button',
                                        onClick: () => removeAccommodation(destIndex, accIndex)
                                    }, 'Remove') : null
                                ])
                            ]),

                            // TripAdvisor Auto-Fill Section
                            React.createElement('div', {
                                key: 'tripadvisor-section',
                                style: { background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }
                            }, [
                                React.createElement('h6', {
                                    key: 'title',
                                    style: { margin: '0 0 15px 0', color: '#2d3748' }
                                }, '🔍 TripAdvisor Auto-Fill'),
                                React.createElement('div', {
                                    key: 'tripadvisor-input',
                                    style: { marginBottom: '10px' }
                                }, [
                                    React.createElement('label', {
                                        key: 'label',
                                        style: { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '5px' }
                                    }, 'TripAdvisor Hotel ID'),
                                    React.createElement('div', {
                                        key: 'input-row',
                                        style: { display: 'flex', gap: '8px', alignItems: 'center' }
                                    }, [
                                        React.createElement('input', {
                                            key: 'id-input',
                                            type: 'text',
                                            placeholder: 'e.g., 188154',
                                            style: { 
                                                flex: '1',
                                                padding: '6px 10px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            },
                                            onKeyPress: async (e) => {
                                                if (e.key === 'Enter') {
                                                    const tripAdvisorId = e.target.value.trim();
                                                    if (tripAdvisorId) {
                                                        await autoFillFromTripAdvisor(tripAdvisorId, destIndex, accIndex);
                                                        e.target.value = '';
                                                    }
                                                }
                                            }
                                        }),
                                        React.createElement('button', {
                                            key: 'auto-fill-btn',
                                            type: 'button',
                                            style: {
                                                padding: '6px 12px',
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                cursor: 'pointer'
                                            },
                                            onClick: async (e) => {
                                                const input = e.target.parentElement.querySelector('input');
                                                const tripAdvisorId = input.value.trim();
                                                if (tripAdvisorId) {
                                                    await autoFillFromTripAdvisor(tripAdvisorId, destIndex, accIndex);
                                                    input.value = '';
                                                }
                                            }
                                        }, 'Auto-fill')
                                    ])
                                ]),
                                option.hotel.tripadvisorId && React.createElement('div', {
                                    key: 'tripadvisor-id-display',
                                    style: { 
                                        fontSize: '11px', 
                                        color: '#10b981',
                                        background: '#f0fdf4',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        marginBottom: '8px'
                                    }
                                }, `✅ TripAdvisor ID: ${option.hotel.tripadvisorId}`)
                            ]),

                            React.createElement('div', {
                                key: 'name-rating-row',
                                className: 'form-row'
                            }, [
                                React.createElement('div', {
                                    key: 'name-group',
                                    className: 'form-group'
                                }, [
                                    React.createElement('label', { key: 'label' }, [
                                        'Hotel Name',
                                        option.hotel.tripadvisorId ? React.createElement('span', {
                                            key: 'tripadvisor-badge',
                                            style: {
                                                fontSize: '11px',
                                                color: '#38a169',
                                                marginLeft: '8px',
                                                background: '#f0fff4',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }
                                        }, '✅ From TripAdvisor') : null
                                    ]),
                                    React.createElement('input', {
                                        key: 'input',
                                        type: 'text',
                                        value: option.hotel.name,
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.name`, e.target.value)
                                    })
                                ]),
                                React.createElement('div', {
                                    key: 'rating-group',
                                    className: 'form-group'
                                }, [
                                    React.createElement('label', { key: 'label' }, 'Rating'),
                                    React.createElement('select', {
                                        key: 'select',
                                        value: option.hotel.rating,
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.rating`, parseFloat(e.target.value))
                                    }, [
                                        React.createElement('option', { key: '1', value: 1 }, '1 Star'),
                                        React.createElement('option', { key: '1.5', value: 1.5 }, '1.5 Stars'),
                                        React.createElement('option', { key: '2', value: 2 }, '2 Stars'),
                                        React.createElement('option', { key: '2.5', value: 2.5 }, '2.5 Stars'),
                                        React.createElement('option', { key: '3', value: 3 }, '3 Stars'),
                                        React.createElement('option', { key: '3.5', value: 3.5 }, '3.5 Stars'),
                                        React.createElement('option', { key: '4', value: 4 }, '4 Stars'),
                                        React.createElement('option', { key: '4.5', value: 4.5 }, '4.5 Stars'),
                                        React.createElement('option', { key: '5', value: 5 }, '5 Stars')
                                    ])
                                ])
                            ]),

                            React.createElement('div', {
                                key: 'price-nights-row',
                                className: 'form-row'
                            }, [
                                React.createElement('div', {
                                    key: 'price-group',
                                    className: 'form-group'
                                }, [
                                    React.createElement('label', { key: 'label' }, 'Price per Night ($)'),
                                    React.createElement('input', {
                                        key: 'input',
                                        type: 'number',
                                        value: option.hotel.pricePerNight,
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.pricePerNight`, parseFloat(e.target.value))
                                    })
                                ]),
                                React.createElement('div', {
                                    key: 'points-group',
                                    className: 'form-group'
                                }, [
                                    React.createElement('label', { key: 'label' }, 'Points per Night'),
                                    React.createElement('input', {
                                        key: 'input',
                                        type: 'number',
                                        value: option.hotel.pointsPerNight || 0,
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.pointsPerNight`, parseInt(e.target.value)),
                                        placeholder: 'e.g., 50000'
                                    })
                                ]),
                                React.createElement('div', {
                                    key: 'nights-info',
                                    className: 'form-group'
                                }, [
                                    React.createElement('label', { key: 'label' }, 'Total Nights'),
                                    React.createElement('div', {
                                        key: 'nights-display',
                                        style: { 
                                            padding: '8px 12px', 
                                            background: '#f7fafc', 
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            color: '#4a5568'
                                        }
                                    }, (() => {
                                        if (destination.checkInDate && destination.checkOutDate) {
                                            const checkIn = new Date(destination.checkInDate);
                                            const checkOut = new Date(destination.checkOutDate);
                                            const timeDiff = checkOut.getTime() - checkIn.getTime();
                                            const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            return nights > 0 ? `${nights} nights (calculated from dates)` : 'Please set valid dates';
                                        }
                                        return 'Set check-in and check-out dates above';
                                    })())
                                ])
                            ]),

                            React.createElement('div', {
                                key: 'loyalty-program-row',
                                className: 'form-row'
                            }, [
                                React.createElement('div', {
                                    key: 'loyalty-program-group',
                                    className: 'form-group'
                                }, [
                                    React.createElement('label', { key: 'label' }, 'Loyalty Program (for points)'),
                                    React.createElement('input', {
                                        key: 'input',
                                        type: 'text',
                                        value: option.hotel.loyaltyProgram || '',
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.loyaltyProgram`, e.target.value),
                                        placeholder: 'e.g., Marriott Bonvoy, Hilton Honors, IHG Rewards'
                                    })
                                ])
                            ]),

                            React.createElement('div', {
                                key: 'location-url-row',
                                className: 'form-row'
                            }, [
                                React.createElement('div', {
                                    key: 'location-group',
                                    className: 'form-group'
                                }, [
                                    React.createElement('label', { key: 'label' }, 'Location'),
                                    React.createElement('input', {
                                        key: 'input',
                                        type: 'text',
                                        value: option.hotel.location,
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.location`, e.target.value)
                                    })
                                ]),
                                React.createElement('div', {
                                    key: 'url-group',
                                    className: 'form-group'
                                }, [
                                    React.createElement('label', { key: 'label' }, 'Booking URL'),
                                    React.createElement('input', {
                                        key: 'input',
                                        type: 'url',
                                        value: option.hotel.bookingUrl,
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.bookingUrl`, e.target.value)
                                    })
                                ])
                            ]),

                            React.createElement('div', {
                                key: 'description-group',
                                className: 'form-group'
                            }, [
                                React.createElement('label', { key: 'label' }, 'Description'),
                                React.createElement('textarea', {
                                    key: 'textarea',
                                    value: option.hotel.detailedDescription,
                                    onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.detailedDescription`, e.target.value),
                                    rows: 3
                                })
                            ])
                        ])
                    )
                ])
            ])
        )
    ]);
};

console.log('✅ DestinationsTab component loaded');