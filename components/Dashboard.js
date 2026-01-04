/**
 * Main Dashboard Component
 * 
 * Handles trip management, user interface, and tab navigation
 * Integrates with Firebase for real-time trip data
 */

console.log('🔧 Dashboard.js file loaded successfully - TIMESTAMP: ' + Date.now());
console.log('Current time:', new Date().toISOString());

window.Dashboard = ({ currentUser, onSignOut }) => {
    const [trips, setTrips] = React.useState([]);
    const [selectedTrip, setSelectedTrip] = React.useState(null);
    const [newRecommendation, setNewRecommendation] = React.useState(null);
    const [isFullScreenMode, setIsFullScreenMode] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [saveStatus, setSaveStatus] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [viewMode, setViewMode] = React.useState('list'); // 'list', 'detail', 'edit'

    // Load trips from Firebase
    React.useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = firebase.firestore().collection('trips')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const tripsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTrips(tripsData);
                setLoading(false);
            }, (error) => {
                console.error('Firestore connection error:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                
                // Handle specific connection errors
                if (error.code === 'unavailable' || error.message.includes('QUIC')) {
                    console.warn('Connection issue detected, attempting to reconnect...');
                    // The experimentalForceLongPolling setting should handle this
                }
                
                setLoading(false);
            });

        return () => unsubscribe();
    }, [currentUser]);

    // Admin access check using SecurityHelpers
    if (!window.SecurityHelpers?.isAuthorizedAdmin(currentUser)) {
        return React.createElement('div', { className: 'container' }, [
            React.createElement('div', {
                key: 'access-denied',
                className: 'header',
                style: { textAlign: 'center' }
            }, [
                React.createElement('h1', { key: 'title' }, 'Access Denied'),
                React.createElement('p', { key: 'message' }, 'You do not have permission to access this admin dashboard.'),
                React.createElement('button', {
                    key: 'signout',
                    className: 'btn btn-secondary',
                    onClick: onSignOut,
                    style: { marginTop: '20px' }
                }, 'Sign Out')
            ])
        ]);
    }

    const selectTrip = (trip) => {
        // Go directly to edit mode instead of detail view
        editTrip(trip);
    };

    const editTrip = (trip) => {
        setSelectedTrip(trip);
        setViewMode('edit');
        setIsFullScreenMode(true);
        
        // DEBUG: Log trip data structure
        console.log('=== DEBUGGING TRIP DATA ===');
        console.log('Full trip object:', trip);
        console.log('trip.destinationRecommendation:', trip.destinationRecommendation);
        console.log('trip.destinationRecommendation.destinations:', trip.destinationRecommendation?.destinations);
        console.log('trip.recommendation:', trip.recommendation);
        console.log('trip.destination:', trip.destination);
        console.log('trip.destinations:', trip.destinations);
        
        // Initialize recommendation data
        let recommendationData;
        if (trip.destinationRecommendation) {
            recommendationData = trip.destinationRecommendation;
            console.log('Using destinationRecommendation:', recommendationData);
            
            // If destinationRecommendation exists but destinations are empty, populate from trip data
            if (!recommendationData.destinations || recommendationData.destinations.length === 0) {
                console.log('destinationRecommendation has empty destinations, populating from trip data...');
                
                // Convert trip.destinations (string array) to destination objects
                if (trip.destinations && trip.destinations.length > 0) {
                    recommendationData.destinations = trip.destinations.map(dest => ({
                        name: dest,
                        accommodations: []
                    }));
                    console.log('Populated destinations from trip.destinations:', recommendationData.destinations);
                } else if (trip.destination) {
                    recommendationData.destinations = [{
                        name: trip.destination,
                        accommodations: []
                    }];
                    console.log('Populated destinations from trip.destination:', recommendationData.destinations);
                }
            }
        } else if (trip.recommendation) {
            // Convert legacy format if needed
            recommendationData = window.DataHelpers.convertLegacyRecommendation(trip.recommendation);
            console.log('Using converted recommendation:', recommendationData);
        } else {
            recommendationData = window.DataHelpers.createEmptyRecommendation(trip);
            console.log('Created empty recommendation:', recommendationData);
        }
        
        console.log('Final recommendation destinations:', recommendationData?.destinations);
        console.log('=== END DEBUGGING ===');
        
        setNewRecommendation(recommendationData);
    };

    const backToList = () => {
        setSelectedTrip(null);
        setViewMode('list');
        setIsFullScreenMode(false);
        setNewRecommendation(null);
    };

    const updateRecommendation = (path, value) => {
        if (!newRecommendation) return;
        
        const updated = { ...newRecommendation };
        window.DataHelpers.setNestedProperty(updated, path, value);
        setNewRecommendation(updated);
    };

    const saveRecommendation = async () => {
        if (!selectedTrip || !newRecommendation) return;
        
        // DEBUG: Log save process
        console.log('=== DEBUGGING SAVE PROCESS ===');
        console.log('Selected trip ID:', selectedTrip.id);
        console.log('Original recommendation data:', newRecommendation);
        
        // Validate and sanitize data before saving
        const sanitizedRecommendation = window.SecurityHelpers?.validateRecommendationData?.(newRecommendation) || newRecommendation;
        
        console.log('Sanitized recommendation data:', sanitizedRecommendation);
        console.log('Data being sent to Firestore:', {
            destinationRecommendation: sanitizedRecommendation,
            status: 'completed',
            updatedAt: 'SERVER_TIMESTAMP'
        });
        
        setSaveStatus('saving');
        try {
            console.log('Attempting Firestore update...');
            
            // Get admin username for mirror record
            const adminUsername = currentUser.email.split('@')[0];
            
            // Create batch for atomic operations
            const batch = firebase.firestore().batch();
            
            // Update original trip record
            const tripRef = firebase.firestore().collection('trips').doc(selectedTrip.id);
            batch.update(tripRef, {
                destinationRecommendation: sanitizedRecommendation,
                status: 'completed',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Create/update admin mirror record for iOS app preview
            const mirrorId = `${adminUsername}_${selectedTrip.id}`;
            const mirrorRef = firebase.firestore().collection('admin_mirrors').doc(mirrorId);
            
            // Copy all trip data to mirror with updated recommendation
            const mirrorData = {
                ...selectedTrip,
                destinationRecommendation: sanitizedRecommendation,
                status: 'completed',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                _mirrorMetadata: {
                    originalTripId: selectedTrip.id,
                    adminUsername: adminUsername,
                    originalUserEmail: selectedTrip.userEmail || selectedTrip.email || selectedTrip.userId || 'nchristus93@gmail.com',
                    mirrorCreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    purpose: 'ios_app_preview'
                }
            };
            
            // Replace user email with admin email so iOS app shows it under your account
            mirrorData.userEmail = currentUser.email;
            mirrorData.email = currentUser.email;
            
            batch.set(mirrorRef, mirrorData, { merge: true });
            
            await batch.commit();
            
            console.log('Firestore update successful!');
            console.log(`Mirror record created: ${mirrorId}`);
            console.log('You can now see this trip in your iOS app');
            
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
            console.error('Error saving recommendation:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 5000);
        }
        console.log('=== END SAVE DEBUGGING ===');
    };

    // Helper functions for managing destinations
    const addDestination = () => {
        if (!newRecommendation) return;
        const updated = { ...newRecommendation };
        
        // Ensure destinations array exists
        if (!updated.destinations) {
            updated.destinations = [];
        }
        
        updated.destinations.push(window.DataHelpers?.createEmptyDestination?.() || {
            id: Date.now().toString(),
            cityName: '',
            checkInDate: '',
            checkOutDate: '',
            accommodationOptions: []
        });
        setNewRecommendation(updated);
    };

    const removeDestination = (index) => {
        if (!newRecommendation || !newRecommendation.destinations) return;
        const updated = { ...newRecommendation };
        updated.destinations.splice(index, 1);
        setNewRecommendation(updated);
    };

    const addAccommodation = (destIndex) => {
        if (!newRecommendation || !newRecommendation.destinations || !newRecommendation.destinations[destIndex]) return;
        const updated = { ...newRecommendation };
        if (!updated.destinations[destIndex].accommodationOptions) {
            updated.destinations[destIndex].accommodationOptions = [];
        }
        updated.destinations[destIndex].accommodationOptions.push(window.DataHelpers?.createEmptyAccommodation?.() || {
            id: Date.now().toString(),
            priority: 1,
            hotel: {
                name: '',
                rating: 4,
                pricePerNight: 0,
                pointsPerNight: 0,
                loyaltyProgram: '',
                tripadvisorId: '',
                location: '',
                bookingUrl: '',
                detailedDescription: ''
            }
        });
        setNewRecommendation(updated);
    };

    const removeAccommodation = (destIndex, accIndex) => {
        if (!newRecommendation || !newRecommendation.destinations || !newRecommendation.destinations[destIndex] || !newRecommendation.destinations[destIndex].accommodationOptions) return;
        const updated = { ...newRecommendation };
        updated.destinations[destIndex].accommodationOptions.splice(accIndex, 1);
        setNewRecommendation(updated);
    };

    // Helper functions for managing logistics
    const addTransportSegment = () => {
        if (!newRecommendation) return;
        const updated = { ...newRecommendation };
        if (!updated.logistics) {
            updated.logistics = { transportSegments: [] };
        }
        if (!updated.logistics.transportSegments) {
            updated.logistics.transportSegments = [];
        }
        updated.logistics.transportSegments.push(window.DataHelpers?.createEmptyTransportSegment?.() || {
            id: Date.now().toString(),
            transportOptions: []
        });
        setNewRecommendation(updated);
    };

    const removeTransportSegment = (index) => {
        if (!newRecommendation || !newRecommendation.logistics || !newRecommendation.logistics.transportSegments) return;
        const updated = { ...newRecommendation };
        updated.logistics.transportSegments.splice(index, 1);
        setNewRecommendation(updated);
    };

    const addTransportOption = (segmentIndex) => {
        if (!newRecommendation || !newRecommendation.logistics || !newRecommendation.logistics.transportSegments || !newRecommendation.logistics.transportSegments[segmentIndex]) return;
        const updated = { ...newRecommendation };
        if (!updated.logistics.transportSegments[segmentIndex].transportOptions) {
            updated.logistics.transportSegments[segmentIndex].transportOptions = [];
        }
        
        // Get the segment's departure date to auto-fill the transport option
        const segmentDate = updated.logistics.transportSegments[segmentIndex].departureDate;
        
        updated.logistics.transportSegments[segmentIndex].transportOptions.push(window.DataHelpers?.createEmptyTransportOption?.(segmentDate) || {
            id: Date.now().toString(),
            transportType: 'flight',
            priority: 1,
            cost: {
                paymentType: 'cash',
                cashAmount: 0,
                totalCashValue: 0
            },
            details: {
                details: {
                    departure: {
                        date: segmentDate || ''
                    }
                }
            },
            duration: '',
            notes: ''
        });
        setNewRecommendation(updated);
    };

    const removeTransportOption = (segmentIndex, optionIndex) => {
        if (!newRecommendation || !newRecommendation.logistics || !newRecommendation.logistics.transportSegments || !newRecommendation.logistics.transportSegments[segmentIndex] || !newRecommendation.logistics.transportSegments[segmentIndex].transportOptions) return;
        const updated = { ...newRecommendation };
        updated.logistics.transportSegments[segmentIndex].transportOptions.splice(optionIndex, 1);
        setNewRecommendation(updated);
    };

    if (loading) {
        return React.createElement('div', { className: 'loading' }, 'Loading trips...');
    }

    return React.createElement('div', { className: 'container' }, [
        // Header
        React.createElement('div', { key: 'header', className: 'header' }, [
            React.createElement('div', {
                key: 'header-content',
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
            }, [
                React.createElement('div', { key: 'title-section' }, [
                    React.createElement('h1', { key: 'title' }, 'WanderMint Admin Dashboard'),
                    React.createElement('p', { key: 'subtitle' }, 'Manage multi-city trips with destination-centric recommendations')
                ]),
                React.createElement('div', {
                    key: 'user-section',
                    style: { textAlign: 'right', color: 'white' }
                }, [
                    React.createElement('div', {
                        key: 'user-email',
                        style: { marginBottom: '8px', opacity: 0.9 }
                    }, `Signed in as: ${currentUser.email}`),
                    React.createElement('button', {
                        key: 'signout-btn',
                        className: 'btn btn-secondary',
                        onClick: onSignOut,
                        style: {
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }
                    }, 'Sign Out')
                ])
            ])
        ]),


        // Main Content based on view mode
        viewMode === 'list' && React.createElement('div', { key: 'trip-list', className: 'section' }, [
            React.createElement('h2', { key: 'list-title' }, `Trip Requests (${trips.length})`),
            trips.length === 0 ? 
                React.createElement('div', {
                    key: 'no-trips',
                    style: {
                        textAlign: 'center',
                        padding: '40px',
                        color: '#718096',
                        fontStyle: 'italic'
                    }
                }, 'No trips found. Trips will appear here when users submit requests.') :
                React.createElement('div', { key: 'trip-grid', className: 'trip-grid' },
                    trips.map(trip => React.createElement(window.TripCard, {
                        key: trip.id,
                        trip: trip,
                        onSelect: selectTrip,
                        onEdit: editTrip,
                        isSelected: selectedTrip?.id === trip.id
                    }))
                )
        ]),


        // Trip Edit Mode (Full Screen)
        viewMode === 'edit' && selectedTrip && newRecommendation && React.createElement('div', {
            key: 'trip-edit',
            className: 'section'
        }, [
            // Edit Header
            React.createElement('div', {
                key: 'edit-header',
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }
            }, [
                React.createElement('div', {
                    key: 'edit-title-section',
                    style: { display: 'flex', alignItems: 'center' }
                }, [
                    React.createElement('button', {
                        key: 'back-btn',
                        className: 'btn btn-secondary',
                        onClick: backToList,
                        style: { marginRight: '15px' }
                    }, '← Back to Trips'),
                    React.createElement('h2', {
                        key: 'edit-title',
                        style: { margin: 0 }
                    }, `Editing: ${selectedTrip.destinations ? selectedTrip.destinations.join(' → ') : selectedTrip.destination}`)
                ]),
                React.createElement('div', {
                    key: 'save-section',
                    style: { display: 'flex', alignItems: 'center', gap: '10px' }
                }, [
                    saveStatus === 'saving' && React.createElement('span', {
                        key: 'saving',
                        style: { color: '#718096' }
                    }, 'Saving...'),
                    saveStatus === 'saved' && React.createElement('span', {
                        key: 'saved',
                        style: { color: '#38a169' }
                    }, '✓ Saved'),
                    saveStatus === 'error' && React.createElement('span', {
                        key: 'error',
                        style: { color: '#e53e3e' }
                    }, '✗ Error saving'),
                    React.createElement('button', {
                        key: 'save-btn',
                        className: 'btn btn-primary',
                        onClick: saveRecommendation,
                        disabled: saveStatus === 'saving'
                    }, 'Save Recommendation')
                ])
            ]),

            // User Info & Trip Details Section
            React.createElement('div', {
                key: 'user-trip-info',
                style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '20px',
                    marginBottom: '25px',
                    padding: '20px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                }
            }, [
                // User Points Display
                React.createElement('div', {
                    key: 'user-points-section',
                    style: { 
                        background: 'white',
                        padding: '15px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                    }
                }, [
                    React.createElement('h4', {
                        key: 'points-title',
                        style: { margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#2d3748' }
                    }, '💰 User Points Balance'),
                    React.createElement(window.UserPointsDisplay, {
                        key: 'points-display',
                        currentUser: currentUser,
                        userId: selectedTrip.userId,
                        compact: true
                    })
                ]),

                // Trip Details
                React.createElement('div', {
                    key: 'trip-details-section',
                    style: { 
                        background: 'white',
                        padding: '15px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                    }
                }, [
                    React.createElement('h4', {
                        key: 'trip-title',
                        style: { margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#2d3748' }
                    }, '✈️ Trip Details'),
                    React.createElement('div', {
                        key: 'trip-info',
                        style: { fontSize: '13px', lineHeight: '1.4' }
                    }, [
                        selectedTrip.departureLocation && React.createElement('div', {
                            key: 'departure',
                            style: { marginBottom: '8px' }
                        }, [
                            React.createElement('strong', null, 'From: '),
                            selectedTrip.departureLocation
                        ]),
                        React.createElement('div', {
                            key: 'destination',
                            style: { marginBottom: '8px' }
                        }, [
                            React.createElement('strong', null, 'To: '),
                            selectedTrip.destinations ? selectedTrip.destinations.join(' → ') : selectedTrip.destination
                        ]),
                        React.createElement('div', {
                            key: 'dates',
                            style: { marginBottom: '8px' }
                        }, [
                            React.createElement('strong', null, 'Dates: '),
                            `${window.DataHelpers.formatDate(selectedTrip.startDate)} - ${window.DataHelpers.formatDate(selectedTrip.endDate)}`
                        ]),
                        React.createElement('div', {
                            key: 'group-size',
                            style: { marginBottom: '8px' }
                        }, [
                            React.createElement('strong', null, 'Group: '),
                            `${selectedTrip.groupSize} ${selectedTrip.groupSize === 1 ? 'person' : 'people'}`
                        ]),
                        selectedTrip.budget && React.createElement('div', {
                            key: 'budget',
                            style: { marginBottom: '8px' }
                        }, [
                            React.createElement('strong', null, 'Budget: '),
                            selectedTrip.budget
                        ]),
                        React.createElement('div', {
                            key: 'status',
                            style: { marginBottom: '8px' }
                        }, [
                            React.createElement('strong', null, 'Status: '),
                            React.createElement('span', {
                                className: `status-badge status-${selectedTrip.status}`,
                                style: { fontSize: '11px', padding: '2px 6px' }
                            }, selectedTrip.status)
                        ])
                    ])
                ]),

                // User Preferences
                React.createElement('div', {
                    key: 'user-preferences-section',
                    style: { 
                        background: 'white',
                        padding: '15px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                    }
                }, [
                    React.createElement('h4', {
                        key: 'preferences-title',
                        style: { margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#2d3748' }
                    }, '👤 User Preferences'),
                    React.createElement('div', {
                        key: 'preferences-info',
                        style: { fontSize: '13px', lineHeight: '1.4' }
                    }, [
                        selectedTrip.travelStyle && React.createElement('div', {
                            key: 'travel-style',
                            style: { marginBottom: '8px' }
                        }, [
                            React.createElement('strong', null, 'Style: '),
                            selectedTrip.travelStyle
                        ]),
                        selectedTrip.flightClass && React.createElement('div', {
                            key: 'flight-class',
                            style: { marginBottom: '8px' }
                        }, [
                            React.createElement('strong', null, 'Flight Class: '),
                            selectedTrip.flightClass
                        ]),
                        selectedTrip.interests && selectedTrip.interests.length > 0 && React.createElement('div', {
                            key: 'interests',
                            style: { marginBottom: '8px' }
                        }, [
                            React.createElement('strong', null, 'Interests: '),
                            selectedTrip.interests.join(', ')
                        ]),
                        selectedTrip.flexibleDates && React.createElement('div', {
                            key: 'flexible',
                            style: { color: '#48bb78', fontSize: '12px', marginTop: '6px' }
                        }, '✓ Flexible dates'),
                        selectedTrip.flexibleDates && selectedTrip.tripDuration && React.createElement('div', {
                            key: 'duration',
                            style: { fontSize: '12px', marginTop: '4px' }
                        }, [
                            React.createElement('strong', null, 'Duration: '),
                            `${selectedTrip.tripDuration} ${selectedTrip.tripDuration === 1 ? 'day' : 'days'}`
                        ]),
                        selectedTrip.additionalNotes && React.createElement('div', {
                            key: 'notes',
                            style: { marginTop: '8px', padding: '8px', background: '#f7fafc', borderRadius: '4px', fontSize: '12px' }
                        }, [
                            React.createElement('strong', null, 'Notes: '),
                            selectedTrip.additionalNotes
                        ]),
                        selectedTrip.specialRequests && React.createElement('div', {
                            key: 'special-requests',
                            style: { marginTop: '8px', padding: '8px', background: '#fff5f5', borderRadius: '4px', fontSize: '12px', border: '1px solid #fed7e2' }
                        }, [
                            React.createElement('strong', null, 'Special Requests: '),
                            selectedTrip.specialRequests
                        ])
                    ])
                ])
            ]),

            // Tab Navigation
            React.createElement('div', { key: 'tab-nav', className: 'tab-nav' }, [
                React.createElement('button', {
                    key: 'overview-tab',
                    className: activeTab === 'overview' ? 'active' : '',
                    onClick: () => setActiveTab('overview')
                }, 'Overview'),
                React.createElement('button', {
                    key: 'destinations-tab',
                    className: activeTab === 'destinations' ? 'active' : '',
                    onClick: () => setActiveTab('destinations')
                }, 'Destinations'),
                React.createElement('button', {
                    key: 'activities-tab',
                    className: activeTab === 'activities' ? 'active' : '',
                    onClick: () => setActiveTab('activities')
                }, 'Activities'),
                React.createElement('button', {
                    key: 'logistics-tab',
                    className: activeTab === 'logistics' ? 'active' : '',
                    onClick: () => setActiveTab('logistics')
                }, 'Logistics'),
                React.createElement('button', {
                    key: 'costs-tab',
                    className: activeTab === 'costs' ? 'active' : '',
                    onClick: () => setActiveTab('costs')
                }, 'Costs'),
                React.createElement('button', {
                    key: 'conversations-tab',
                    className: activeTab === 'conversations' ? 'active' : '',
                    onClick: () => setActiveTab('conversations')
                }, 'Conversations'),
                React.createElement('button', {
                    key: 'comparison-tab',
                    className: activeTab === 'comparison' ? 'active' : '',
                    onClick: () => setActiveTab('comparison')
                }, 'Trip Comparison')
            ]),

            // Tab Content
            activeTab === 'overview' && (window.OverviewTab ? 
                React.createElement(window.OverviewTab, {
                    key: 'overview-content',
                    recommendation: newRecommendation,
                    updateRecommendation: updateRecommendation
                }) : React.createElement('div', {
                    key: 'overview-placeholder',
                    style: { padding: '20px', textAlign: 'center', color: '#718096' }
                }, 'Overview tab component not loaded yet - please use the original dashboard for editing')),

            activeTab === 'destinations' && (window.DestinationsTab ? 
                React.createElement(window.DestinationsTab, {
                    key: 'destinations-content',
                    recommendation: newRecommendation,
                    updateRecommendation: updateRecommendation,
                    addDestination: addDestination,
                    removeDestination: removeDestination,
                    addAccommodation: addAccommodation,
                    removeAccommodation: removeAccommodation
                }) : React.createElement('div', {
                    key: 'destinations-placeholder',
                    style: { padding: '20px', textAlign: 'center', color: '#718096' }
                }, 'Destinations tab component not loaded yet - please use the original dashboard for editing')),

            activeTab === 'activities' && (window.ActivitiesTab ? 
                React.createElement(window.ActivitiesTab, {
                    key: 'activities-content',
                    recommendation: newRecommendation,
                    updateRecommendation: updateRecommendation
                }) : React.createElement('div', {
                    key: 'activities-placeholder',
                    style: { padding: '20px', textAlign: 'center', color: '#718096' }
                }, 'Activities tab component not loaded yet - please use the original dashboard for editing')),

            activeTab === 'logistics' && (window.LogisticsTab ? 
                React.createElement(window.LogisticsTab, {
                    key: 'logistics-content',
                    recommendation: newRecommendation,
                    updateRecommendation: updateRecommendation,
                    addTransportSegment: addTransportSegment,
                    removeTransportSegment: removeTransportSegment,
                    addTransportOption: addTransportOption,
                    removeTransportOption: removeTransportOption
                }) : React.createElement('div', {
                    key: 'logistics-placeholder',
                    style: { padding: '20px', textAlign: 'center', color: '#718096' }
                }, 'Logistics tab component not loaded yet - please use the original dashboard for editing')),

            activeTab === 'costs' && (window.CostsTab ? 
                React.createElement(window.CostsTab, {
                    key: 'costs-content',
                    recommendation: newRecommendation,
                    updateRecommendation: updateRecommendation
                }) : React.createElement('div', {
                    key: 'costs-placeholder',
                    style: { padding: '20px', textAlign: 'center', color: '#718096' }
                }, 'Costs tab component not loaded yet - please use the original dashboard for editing')),

            activeTab === 'conversations' && (window.ConversationsTab ? 
                React.createElement(window.ConversationsTab, {
                    key: 'conversations-content',
                    selectedTrip: selectedTrip
                }) : React.createElement('div', {
                    key: 'conversations-placeholder',
                    style: { padding: '20px', textAlign: 'center', color: '#718096' }
                }, 'Conversations tab component not loaded yet')),

            activeTab === 'comparison' && React.createElement(window.TripComparisonTab, {
                key: 'comparison-content',
                currentUser: currentUser,
                selectedTrip: selectedTrip
            })
        ])
    ]);
};

console.log('✅ Dashboard component loaded');