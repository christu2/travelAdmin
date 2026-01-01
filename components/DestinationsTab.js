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

    // Helper function to calculate and update nights and total cost
    const updateCalculatedValues = (destIndex, accIndex) => {
        // Get fresh data from recommendation instead of stale destinations array
        const destination = recommendation?.destinations?.[destIndex];
        const accommodation = destination?.accommodationOptions?.[accIndex];
        
        console.log('Updating calculated values for destination', destIndex, 'accommodation', accIndex);
        console.log('Destination dates:', destination?.arrivalDate, 'to', destination?.departureDate);
        
        if (destination?.arrivalDate && destination?.departureDate && accommodation) {
            const checkIn = new Date(destination.arrivalDate);
            const checkOut = new Date(destination.departureDate);
            const timeDiff = checkOut.getTime() - checkIn.getTime();
            const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
            
            console.log('Calculated nights:', nights);
            
            // Update the number of nights at both levels for consistency
            updateRecommendation(`destinations[${destIndex}].numberOfNights`, nights);
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.totalCost.totalNights`, nights);
            
            // Calculate and update total cost
            const pricePerNight = accommodation.hotel?.pricePerNight || 0;
            const totalCost = pricePerNight * nights;
            
            console.log('Price per night:', pricePerNight, 'Total cost:', totalCost);
            
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.totalCost.totalCashValue`, totalCost);
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.totalCost.cashAmount`, totalCost);
        } else {
            console.log('Missing data for calculation:', {
                hasArrivalDate: !!destination?.arrivalDate,
                hasDepartureDate: !!destination?.departureDate,
                hasAccommodation: !!accommodation
            });
        }
    };

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


    // TripAdvisor auto-fill function
    const autoFillFromTripAdvisor = async (tripAdvisorId, destIndex, accIndex) => {
        try {
            // Get the destination for date information
            const destination = destinations[destIndex];
            
            // Set the TripAdvisor ID first
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.tripadvisorId`, tripAdvisorId);
            
            // Use the local hotel proxy server (TripAdvisor API only works locally due to IP restrictions)
            const hotelProxyUrl = 'http://localhost:3002';
            
            // Validate URL for security
            if (window.SecurityHelpers && !window.SecurityHelpers.validateUrl(hotelProxyUrl)) {
                console.error('Invalid hotel proxy URL:', hotelProxyUrl);
                return;
            }
            
            // Check if running locally (TripAdvisor proxy only works locally due to IP restrictions)
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                alert('TripAdvisor auto-fill is only available when running locally due to API IP restrictions. You can still manually enter hotel details.');
                return;
            }
            
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
                    // Set TripAdvisor URL directly from API
                    if (hotel.tripadvisorUrl) {
                        updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.tripadvisorUrl`, hotel.tripadvisorUrl);
                    }
                    
                    console.log('✅ Auto-filled hotel details from TripAdvisor:', hotel.name);
                    return;
                }
            }
            
            // Fallback: Use TripAdvisor ID for manual lookup
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.name`, `Hotel from TripAdvisor ID: ${tripAdvisorId}`);
            
            // Create fallback TripAdvisor URL
            let fallbackTripAdvisorUrl = `https://www.tripadvisor.com/Hotel_Review-d${tripAdvisorId}.html`;
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.tripadvisorUrl`, fallbackTripAdvisorUrl);
            
            console.log('ℹ️ TripAdvisor API not available via hotel proxy. Using manual lookup.');
            console.log('📋 TripAdvisor ID stored:', tripAdvisorId);
            
        } catch (error) {
            // Fallback: Just set the ID and basic info
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.name`, `Hotel from TripAdvisor ID: ${tripAdvisorId}`);
            
            // Create error fallback TripAdvisor URL
            let errorFallbackTripAdvisorUrl = `https://www.tripadvisor.com/Hotel_Review-d${tripAdvisorId}.html`;
            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.tripadvisorUrl`, errorFallbackTripAdvisorUrl);
            
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
                            value: formatDateForInput(destination.arrivalDate) || '',
                            onChange: (e) => {
                                updateRecommendation(`destinations[${destIndex}].arrivalDate`, e.target.value);
                                
                                // Auto-set checkout date to next day if not already set
                                if (e.target.value && !destination.departureDate) {
                                    const checkInDate = new Date(e.target.value);
                                    const checkOutDate = new Date(checkInDate);
                                    checkOutDate.setDate(checkOutDate.getDate() + 1);
                                    const checkOutValue = checkOutDate.toISOString().split('T')[0];
                                    updateRecommendation(`destinations[${destIndex}].departureDate`, checkOutValue);
                                }
                                
                                // Update calculated values for all accommodations
                                // Use requestAnimationFrame to ensure DOM is updated first
                                requestAnimationFrame(() => {
                                    (recommendation?.destinations?.[destIndex]?.accommodationOptions || []).forEach((_, accIndex) => {
                                        updateCalculatedValues(destIndex, accIndex);
                                    });
                                });
                            }
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
                            value: formatDateForInput(destination.departureDate) || '',
                            min: destination.arrivalDate ? formatDateForInput(destination.arrivalDate) : undefined,
                            onChange: (e) => {
                                updateRecommendation(`destinations[${destIndex}].departureDate`, e.target.value);
                                
                                // Update calculated values for all accommodations
                                // Use requestAnimationFrame to ensure DOM is updated first
                                requestAnimationFrame(() => {
                                    (recommendation?.destinations?.[destIndex]?.accommodationOptions || []).forEach((_, accIndex) => {
                                        updateCalculatedValues(destIndex, accIndex);
                                    });
                                });
                            }
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
                                        value: typeof option.hotel.pricePerNight === 'object' ? '' : (option.hotel.pricePerNight || ''),
                                        onChange: (e) => {
                                            updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.pricePerNight`, parseFloat(e.target.value));
                                            
                                            // Update calculated values when price changes
                                            requestAnimationFrame(() => {
                                                updateCalculatedValues(destIndex, accIndex);
                                            });
                                        }
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
                                        value: typeof option.hotel.pointsPerNight === 'object' ? '' : (option.hotel.pointsPerNight || ''),
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
                                            color: '#4a5568',
                                            marginBottom: '8px'
                                        }
                                    }, (() => {
                                        if (destination.arrivalDate && destination.departureDate) {
                                            const checkIn = new Date(destination.arrivalDate);
                                            const checkOut = new Date(destination.departureDate);
                                            const timeDiff = checkOut.getTime() - checkIn.getTime();
                                            const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
                                            const pricePerNight = option.hotel.pricePerNight || 0;
                                            const totalCost = pricePerNight * nights;
                                            
                                            if (nights > 0) {
                                                return `${nights} nights × $${pricePerNight} = $${totalCost.toFixed(2)} total`;
                                            } else {
                                                return 'Please set valid dates';
                                            }
                                        }
                                        return 'Set check-in and check-out dates above';
                                    })()),
                                    React.createElement('button', {
                                        key: 'calculate-btn',
                                        type: 'button',
                                        onClick: () => updateCalculatedValues(destIndex, accIndex),
                                        style: {
                                            fontSize: '11px',
                                            padding: '4px 8px',
                                            background: '#4299e1',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }
                                    }, 'Update Database')
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
                                ]),
                                React.createElement('div', {
                                    key: 'tripadvisor-url-group',
                                    className: 'form-group'
                                }, [
                                    React.createElement('label', { key: 'label' }, 'TripAdvisor URL'),
                                    React.createElement('input', {
                                        key: 'input',
                                        type: 'url',
                                        value: option.hotel.tripadvisorUrl || '',
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.tripadvisorUrl`, e.target.value)
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