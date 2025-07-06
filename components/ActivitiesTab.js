/**
 * ActivitiesTab Component
 * 
 * Handles destination-based activity and restaurant recommendations
 * Provides comprehensive forms for adding activities and restaurants per destination
 * 
 * @param {Object} recommendation - Trip recommendation data
 * @param {Function} updateRecommendation - Function to update recommendation data
 */

window.ActivitiesTab = ({ recommendation, updateRecommendation }) => {
    const addActivity = (destIndex) => {
        const updated = { ...recommendation };
        if (!updated.destinations[destIndex].recommendedActivities) {
            updated.destinations[destIndex].recommendedActivities = [];
        }
        updated.destinations[destIndex].recommendedActivities.push(window.DataHelpers?.createEmptyActivityRecommendation() || {
            id: Date.now().toString(),
            name: '',
            category: 'sightseeing',
            priority: 'medium',
            description: '',
            location: { name: '', address: '' },
            estimatedDuration: '',
            bestTimeToVisit: '',
            estimatedCost: { cashAmount: 0 },
            bookingRequired: false,
            bookingUrl: '',
            bookingInstructions: '',
            tips: []
        });
        updateRecommendation('destinations', updated.destinations);
    };

    const removeActivity = (destIndex, activityIndex) => {
        const updated = { ...recommendation };
        updated.destinations[destIndex].recommendedActivities.splice(activityIndex, 1);
        updateRecommendation('destinations', updated.destinations);
    };

    const addRestaurant = (destIndex) => {
        const updated = { ...recommendation };
        if (!updated.destinations[destIndex].recommendedRestaurants) {
            updated.destinations[destIndex].recommendedRestaurants = [];
        }
        updated.destinations[destIndex].recommendedRestaurants.push(window.DataHelpers?.createEmptyRestaurantRecommendation() || {
            id: Date.now().toString(),
            name: '',
            cuisine: '',
            mealType: 'dinner',
            description: '',
            location: { name: '', address: '' },
            priceRange: '$$',
            priority: 'medium',
            estimatedCost: { cashAmount: 0 },
            reservationRequired: false,
            reservationInstructions: '',
            specialties: [],
            tips: []
        });
        updateRecommendation('destinations', updated.destinations);
    };

    const removeRestaurant = (destIndex, restaurantIndex) => {
        const updated = { ...recommendation };
        updated.destinations[destIndex].recommendedRestaurants.splice(restaurantIndex, 1);
        updateRecommendation('destinations', updated.destinations);
    };

    return React.createElement('div', { className: 'form-section' }, [
        React.createElement('h3', { key: 'title' }, '🎯 Activities & Restaurant Recommendations'),
        React.createElement('div', {
            key: 'description',
            style: { fontSize: '14px', color: '#4a5568', marginBottom: '20px', fontStyle: 'italic' }
        }, 'Provide curated recommendations for activities and dining in each destination. Users can use these to plan their own day-by-day itinerary.'),

        ...(recommendation.destinations || []).map((destination, destIndex) => 
            React.createElement('div', {
                key: destination.id || destIndex,
                style: {
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                }
            }, [
                React.createElement('div', {
                    key: 'header',
                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
                }, [
                    React.createElement('h4', {
                        key: 'title',
                        style: { margin: 0, color: '#2d3748', fontSize: '18px' }
                    }, `📍 ${destination.cityName || `Destination ${destIndex + 1}`}`)
                ]),

                // Activities Section
                React.createElement('div', {
                    key: 'activities-section',
                    style: { marginBottom: '25px' }
                }, [
                    React.createElement('div', {
                        key: 'activities-header',
                        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }
                    }, [
                        React.createElement('h5', {
                            key: 'activities-title',
                            style: { margin: 0, color: '#2d3748', fontSize: '16px' }
                        }, '🎯 Recommended Activities'),
                        React.createElement('button', {
                            key: 'add-activity-btn',
                            type: 'button',
                            className: 'btn btn-secondary',
                            onClick: () => addActivity(destIndex),
                            style: { fontSize: '12px', padding: '6px 12px' }
                        }, '+ Add Activity')
                    ]),

                    destination.recommendedActivities && destination.recommendedActivities.length > 0 
                        ? destination.recommendedActivities.map((activity, activityIndex) =>
                            React.createElement('div', {
                                key: activity.id || activityIndex,
                                style: {
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    marginBottom: '12px'
                                }
                            }, [
                                React.createElement('div', {
                                    key: 'activity-header',
                                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }
                                }, [
                                    React.createElement('span', {
                                        key: 'activity-label',
                                        style: { fontSize: '14px', fontWeight: '600', color: '#4a5568' }
                                    }, `Activity #${activityIndex + 1}`),
                                    React.createElement('button', {
                                        key: 'remove-activity-btn',
                                        type: 'button',
                                        className: 'btn btn-danger',
                                        onClick: () => removeActivity(destIndex, activityIndex),
                                        style: { fontSize: '10px', padding: '2px 6px' }
                                    }, 'Remove')
                                ]),

                                React.createElement('div', { key: 'activity-row1', className: 'form-row' }, [
                                    React.createElement('div', { key: 'name-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'name-label' }, 'Activity Name'),
                                        React.createElement('input', {
                                            key: 'name-input',
                                            type: 'text',
                                            value: activity.name || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].name`, e.target.value),
                                            placeholder: 'e.g., Sagrada Familia Tour, Park Güell Visit'
                                        })
                                    ]),
                                    React.createElement('div', { key: 'category-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'category-label' }, 'Category'),
                                        React.createElement('select', {
                                            key: 'category-select',
                                            value: activity.category || 'sightseeing',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].category`, e.target.value)
                                        }, [
                                            React.createElement('option', { key: 'sightseeing', value: 'sightseeing' }, '🏛️ Sightseeing'),
                                            React.createElement('option', { key: 'cultural', value: 'cultural' }, '🖼️ Cultural'),
                                            React.createElement('option', { key: 'outdoor', value: 'outdoor' }, '🌳 Outdoor'),
                                            React.createElement('option', { key: 'entertainment', value: 'entertainment' }, '🎭 Entertainment'),
                                            React.createElement('option', { key: 'shopping', value: 'shopping' }, '🛍️ Shopping'),
                                            React.createElement('option', { key: 'nightlife', value: 'nightlife' }, '🍺 Nightlife'),
                                            React.createElement('option', { key: 'other', value: 'other' }, '📝 Other')
                                        ])
                                    ]),
                                    React.createElement('div', { key: 'priority-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'priority-label' }, 'Priority'),
                                        React.createElement('select', {
                                            key: 'priority-select',
                                            value: activity.priority || 'medium',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].priority`, e.target.value)
                                        }, [
                                            React.createElement('option', { key: 'high', value: 'high' }, '🔥 Must-See'),
                                            React.createElement('option', { key: 'medium', value: 'medium' }, '👍 Recommended'),
                                            React.createElement('option', { key: 'low', value: 'low' }, '💡 If Time Permits')
                                        ])
                                    ])
                                ]),

                                React.createElement('div', { key: 'description-group', className: 'form-group' }, [
                                    React.createElement('label', { key: 'description-label' }, 'Description'),
                                    React.createElement('textarea', {
                                        key: 'description-textarea',
                                        value: activity.description || '',
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].description`, e.target.value),
                                        rows: 3,
                                        placeholder: 'Detailed description of the activity, what makes it special, what to expect...'
                                    })
                                ]),

                                React.createElement('div', { key: 'location-row', className: 'form-row' }, [
                                    React.createElement('div', { key: 'location-name-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'location-name-label' }, 'Location Name'),
                                        React.createElement('input', {
                                            key: 'location-name-input',
                                            type: 'text',
                                            value: activity.location?.name || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].location.name`, e.target.value),
                                            placeholder: 'e.g., Sagrada Familia Basilica'
                                        })
                                    ]),
                                    React.createElement('div', { key: 'address-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'address-label' }, 'Address'),
                                        React.createElement('input', {
                                            key: 'address-input',
                                            type: 'text',
                                            value: activity.location?.address || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].location.address`, e.target.value),
                                            placeholder: 'e.g., Carrer de Mallorca, 401, Barcelona'
                                        })
                                    ])
                                ]),

                                React.createElement('div', { key: 'time-row', className: 'form-row' }, [
                                    React.createElement('div', { key: 'duration-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'duration-label' }, 'Estimated Duration'),
                                        React.createElement('input', {
                                            key: 'duration-input',
                                            type: 'text',
                                            value: activity.estimatedDuration || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].estimatedDuration`, e.target.value),
                                            placeholder: 'e.g., 2-3 hours, Half day, Full day'
                                        })
                                    ]),
                                    React.createElement('div', { key: 'best-time-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'best-time-label' }, 'Best Time to Visit'),
                                        React.createElement('input', {
                                            key: 'best-time-input',
                                            type: 'text',
                                            value: activity.bestTimeToVisit || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].bestTimeToVisit`, e.target.value),
                                            placeholder: 'e.g., Morning, Afternoon, Evening, Sunset'
                                        })
                                    ])
                                ]),

                                React.createElement('div', { key: 'cost-row', className: 'form-row' }, [
                                    React.createElement('div', { key: 'cost-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'cost-label' }, 'Estimated Cost ($)'),
                                        React.createElement('input', {
                                            key: 'cost-input',
                                            type: 'number',
                                            step: '0.01',
                                            value: activity.estimatedCost?.cashAmount || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].estimatedCost.cashAmount`, parseFloat(e.target.value) || 0),
                                            placeholder: '0.00'
                                        })
                                    ]),
                                    React.createElement('div', { key: 'booking-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'booking-label' }, [
                                            React.createElement('input', {
                                                key: 'booking-checkbox',
                                                type: 'checkbox',
                                                checked: activity.bookingRequired || false,
                                                onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].bookingRequired`, e.target.checked),
                                                style: { marginRight: '8px' }
                                            }),
                                            'Booking Required'
                                        ])
                                    ])
                                ]),

                                activity.bookingRequired ? React.createElement('div', { key: 'booking-details-row', className: 'form-row' }, [
                                    React.createElement('div', { key: 'booking-url-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'booking-url-label' }, 'Booking URL'),
                                        React.createElement('input', {
                                            key: 'booking-url-input',
                                            type: 'url',
                                            value: activity.bookingUrl || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].bookingUrl`, e.target.value),
                                            placeholder: 'https://...'
                                        })
                                    ]),
                                    React.createElement('div', { key: 'booking-instructions-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'booking-instructions-label' }, 'Booking Instructions'),
                                        React.createElement('input', {
                                            key: 'booking-instructions-input',
                                            type: 'text',
                                            value: activity.bookingInstructions || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].bookingInstructions`, e.target.value),
                                            placeholder: 'e.g., Book 48 hours in advance'
                                        })
                                    ])
                                ]) : null,

                                React.createElement('div', { key: 'tips-group', className: 'form-group' }, [
                                    React.createElement('label', { key: 'tips-label' }, 'Tips & Recommendations'),
                                    React.createElement('textarea', {
                                        key: 'tips-textarea',
                                        value: activity.tips?.join('\n') || '',
                                        onChange: (e) => {
                                            const tips = e.target.value.split('\n').filter(tip => tip.trim() !== '');
                                            updateRecommendation(`destinations[${destIndex}].recommendedActivities[${activityIndex}].tips`, tips);
                                        },
                                        rows: 2,
                                        placeholder: 'Enter tips separated by new lines:\nArrive early to avoid crowds\nBring comfortable walking shoes'
                                    }),
                                    React.createElement('div', {
                                        key: 'tips-hint',
                                        style: { fontSize: '12px', color: '#718096', marginTop: '4px' }
                                    }, 'Enter each tip on a new line')
                                ])
                            ])
                        )
                        : React.createElement('div', {
                            key: 'no-activities',
                            style: {
                                textAlign: 'center',
                                color: '#718096',
                                fontStyle: 'italic',
                                padding: '15px',
                                background: 'white',
                                borderRadius: '6px',
                                border: '1px dashed #cbd5e0'
                            }
                        }, 'No activities added yet. Click "Add Activity" to start adding recommendations.')
                ]),

                // Restaurants Section
                React.createElement('div', { key: 'restaurants-section' }, [
                    React.createElement('div', {
                        key: 'restaurants-header',
                        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }
                    }, [
                        React.createElement('h5', {
                            key: 'restaurants-title',
                            style: { margin: 0, color: '#2d3748', fontSize: '16px' }
                        }, '🍽️ Recommended Restaurants'),
                        React.createElement('button', {
                            key: 'add-restaurant-btn',
                            type: 'button',
                            className: 'btn btn-secondary',
                            onClick: () => addRestaurant(destIndex),
                            style: { fontSize: '12px', padding: '6px 12px' }
                        }, '+ Add Restaurant')
                    ]),

                    destination.recommendedRestaurants && destination.recommendedRestaurants.length > 0
                        ? destination.recommendedRestaurants.map((restaurant, restaurantIndex) =>
                            React.createElement('div', {
                                key: restaurant.id || restaurantIndex,
                                style: {
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    marginBottom: '12px'
                                }
                            }, [
                                React.createElement('div', {
                                    key: 'restaurant-header',
                                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }
                                }, [
                                    React.createElement('span', {
                                        key: 'restaurant-label',
                                        style: { fontSize: '14px', fontWeight: '600', color: '#4a5568' }
                                    }, `Restaurant #${restaurantIndex + 1}`),
                                    React.createElement('button', {
                                        key: 'remove-restaurant-btn',
                                        type: 'button',
                                        className: 'btn btn-danger',
                                        onClick: () => removeRestaurant(destIndex, restaurantIndex),
                                        style: { fontSize: '10px', padding: '2px 6px' }
                                    }, 'Remove')
                                ]),

                                React.createElement('div', { key: 'restaurant-row1', className: 'form-row' }, [
                                    React.createElement('div', { key: 'name-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'name-label' }, 'Restaurant Name'),
                                        React.createElement('input', {
                                            key: 'name-input',
                                            type: 'text',
                                            value: restaurant.name || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].name`, e.target.value),
                                            placeholder: 'e.g., Cal Pep, La Boqueria Market'
                                        })
                                    ]),
                                    React.createElement('div', { key: 'cuisine-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'cuisine-label' }, 'Cuisine Type'),
                                        React.createElement('input', {
                                            key: 'cuisine-input',
                                            type: 'text',
                                            value: restaurant.cuisine || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].cuisine`, e.target.value),
                                            placeholder: 'e.g., Spanish Tapas, Mediterranean, Local'
                                        })
                                    ]),
                                    React.createElement('div', { key: 'meal-type-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'meal-type-label' }, 'Meal Type'),
                                        React.createElement('select', {
                                            key: 'meal-type-select',
                                            value: restaurant.mealType || 'dinner',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].mealType`, e.target.value)
                                        }, [
                                            React.createElement('option', { key: 'breakfast', value: 'breakfast' }, '🍳 Breakfast'),
                                            React.createElement('option', { key: 'lunch', value: 'lunch' }, '🥗 Lunch'),
                                            React.createElement('option', { key: 'dinner', value: 'dinner' }, '🍽️ Dinner'),
                                            React.createElement('option', { key: 'snacks', value: 'snacks' }, '🍴 Snacks/Drinks'),
                                            React.createElement('option', { key: 'all', value: 'all' }, '🍽️ All Day')
                                        ])
                                    ])
                                ]),

                                React.createElement('div', { key: 'description-group', className: 'form-group' }, [
                                    React.createElement('label', { key: 'description-label' }, 'Description'),
                                    React.createElement('textarea', {
                                        key: 'description-textarea',
                                        value: restaurant.description || '',
                                        onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].description`, e.target.value),
                                        rows: 3,
                                        placeholder: 'Description of the restaurant, atmosphere, what makes it special...'
                                    })
                                ]),

                                React.createElement('div', { key: 'location-row', className: 'form-row' }, [
                                    React.createElement('div', { key: 'location-name-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'location-name-label' }, 'Location Name'),
                                        React.createElement('input', {
                                            key: 'location-name-input',
                                            type: 'text',
                                            value: restaurant.location?.name || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].location.name`, e.target.value),
                                            placeholder: 'e.g., El Born District'
                                        })
                                    ]),
                                    React.createElement('div', { key: 'address-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'address-label' }, 'Address'),
                                        React.createElement('input', {
                                            key: 'address-input',
                                            type: 'text',
                                            value: restaurant.location?.address || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].location.address`, e.target.value),
                                            placeholder: 'e.g., Plaça de les Olles, 8, Barcelona'
                                        })
                                    ])
                                ]),

                                React.createElement('div', { key: 'price-row', className: 'form-row' }, [
                                    React.createElement('div', { key: 'price-range-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'price-range-label' }, 'Price Range'),
                                        React.createElement('select', {
                                            key: 'price-range-select',
                                            value: restaurant.priceRange || '$$',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].priceRange`, e.target.value)
                                        }, [
                                            React.createElement('option', { key: 'budget', value: '$' }, '$ Budget-Friendly'),
                                            React.createElement('option', { key: 'mid', value: '$$' }, '$$ Mid-Range'),
                                            React.createElement('option', { key: 'upscale', value: '$$$' }, '$$$ Upscale'),
                                            React.createElement('option', { key: 'fine', value: '$$$$' }, '$$$$ Fine Dining')
                                        ])
                                    ]),
                                    React.createElement('div', { key: 'priority-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'priority-label' }, 'Priority'),
                                        React.createElement('select', {
                                            key: 'priority-select',
                                            value: restaurant.priority || 'medium',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].priority`, e.target.value)
                                        }, [
                                            React.createElement('option', { key: 'high', value: 'high' }, '🔥 Must-Try'),
                                            React.createElement('option', { key: 'medium', value: 'medium' }, '👍 Recommended'),
                                            React.createElement('option', { key: 'low', value: 'low' }, '💡 If Available')
                                        ])
                                    ]),
                                    React.createElement('div', { key: 'cost-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'cost-label' }, 'Estimated Cost ($)'),
                                        React.createElement('input', {
                                            key: 'cost-input',
                                            type: 'number',
                                            step: '0.01',
                                            value: restaurant.estimatedCost?.cashAmount || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].estimatedCost.cashAmount`, parseFloat(e.target.value) || 0),
                                            placeholder: '0.00'
                                        })
                                    ])
                                ]),

                                React.createElement('div', { key: 'reservation-row', className: 'form-row' }, [
                                    React.createElement('div', { key: 'reservation-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'reservation-label' }, [
                                            React.createElement('input', {
                                                key: 'reservation-checkbox',
                                                type: 'checkbox',
                                                checked: restaurant.reservationRequired || false,
                                                onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].reservationRequired`, e.target.checked),
                                                style: { marginRight: '8px' }
                                            }),
                                            'Reservation Required'
                                        ])
                                    ]),
                                    restaurant.reservationRequired ? React.createElement('div', { key: 'reservation-instructions-group', className: 'form-group' }, [
                                        React.createElement('label', { key: 'reservation-instructions-label' }, 'Reservation Instructions'),
                                        React.createElement('input', {
                                            key: 'reservation-instructions-input',
                                            type: 'text',
                                            value: restaurant.reservationInstructions || '',
                                            onChange: (e) => updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].reservationInstructions`, e.target.value),
                                            placeholder: 'e.g., Call ahead, Book via OpenTable'
                                        })
                                    ]) : null
                                ]),

                                React.createElement('div', { key: 'specialties-group', className: 'form-group' }, [
                                    React.createElement('label', { key: 'specialties-label' }, 'Specialties (dishes to try)'),
                                    React.createElement('textarea', {
                                        key: 'specialties-textarea',
                                        value: restaurant.specialties?.join('\n') || '',
                                        onChange: (e) => {
                                            const specialties = e.target.value.split('\n').filter(item => item.trim() !== '');
                                            updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].specialties`, specialties);
                                        },
                                        rows: 2,
                                        placeholder: 'Enter specialties separated by new lines:\nJamón Ibérico\nPatatas Bravas\nSangria'
                                    }),
                                    React.createElement('div', {
                                        key: 'specialties-hint',
                                        style: { fontSize: '12px', color: '#718096', marginTop: '4px' }
                                    }, 'Enter each specialty on a new line')
                                ]),

                                React.createElement('div', { key: 'tips-group', className: 'form-group' }, [
                                    React.createElement('label', { key: 'tips-label' }, 'Tips & Recommendations'),
                                    React.createElement('textarea', {
                                        key: 'tips-textarea',
                                        value: restaurant.tips?.join('\n') || '',
                                        onChange: (e) => {
                                            const tips = e.target.value.split('\n').filter(tip => tip.trim() !== '');
                                            updateRecommendation(`destinations[${destIndex}].recommendedRestaurants[${restaurantIndex}].tips`, tips);
                                        },
                                        rows: 2,
                                        placeholder: 'Enter tips separated by new lines:\nPopular with locals\nNo reservations - arrive early'
                                    }),
                                    React.createElement('div', {
                                        key: 'tips-hint',
                                        style: { fontSize: '12px', color: '#718096', marginTop: '4px' }
                                    }, 'Enter each tip on a new line')
                                ])
                            ])
                        )
                        : React.createElement('div', {
                            key: 'no-restaurants',
                            style: {
                                textAlign: 'center',
                                color: '#718096',
                                fontStyle: 'italic',
                                padding: '15px',
                                background: 'white',
                                borderRadius: '6px',
                                border: '1px dashed #cbd5e0'
                            }
                        }, 'No restaurants added yet. Click "Add Restaurant" to start adding recommendations.')
                ])
            ])
        ),

        (!recommendation.destinations || recommendation.destinations.length === 0) ?
            React.createElement('div', {
                key: 'no-destinations',
                style: {
                    textAlign: 'center',
                    color: '#718096',
                    fontStyle: 'italic',
                    padding: '30px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e0'
                }
            }, 'No destinations found. Please add destinations in the "Destinations" tab first, then return here to plan activities.') : null
    ]);
};

console.log('✅ ActivitiesTab component loaded');