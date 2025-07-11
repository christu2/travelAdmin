/**
 * TripDetailView Component
 * 
 * Shows complete trip information including user intake form data
 * Displays user points, preferences, special requests, and all trip details
 * 
 * @param {Object} trip - Selected trip object
 * @param {Object} currentUser - Current authenticated user
 * @param {Function} onBack - Callback to return to trip list
 * @param {Function} onEdit - Callback to edit trip recommendation
 */

window.TripDetailView = ({ trip, currentUser, onBack, onEdit }) => {
    const [userPoints, setUserPoints] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchUserData = async () => {
            if (!trip.userId) return;
            
            try {
                // Fetch user points
                const pointsDoc = await firebase.firestore()
                    .collection('userPoints')
                    .doc(trip.userId)
                    .get();
                
                if (pointsDoc.exists) {
                    setUserPoints(pointsDoc.data());
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [trip.userId]);

    const formatInterests = (interests) => {
        if (!interests || !Array.isArray(interests)) return 'None specified';
        return interests.join(', ');
    };

    const formatDestinations = (destinations, destination) => {
        if (destinations && Array.isArray(destinations)) {
            return destinations.join(' → ');
        }
        return destination || 'Not specified';
    };


    return React.createElement('div', {
        className: 'trip-detail-view',
        style: {
            maxWidth: '1200px',
            margin: '0 auto'
        }
    }, [
        // Header with back button
        React.createElement('div', {
            key: 'header',
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                padding: '20px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
            }
        }, [
            React.createElement('div', { key: 'titleSection' }, [
                React.createElement('button', {
                    key: 'backBtn',
                    onClick: onBack,
                    style: {
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '10px'
                    }
                }, '← Back to Trips'),
                React.createElement('h2', {
                    key: 'title',
                    style: { margin: 0, color: '#2d3748' }
                }, formatDestinations(trip.destinations, trip.destination)),
                React.createElement('p', {
                    key: 'subtitle',
                    style: { margin: '5px 0 0 0', color: '#718096' }
                }, `Trip ID: ${trip.id} • Created: ${window.DataHelpers.formatDate(trip.createdAt)}`)
            ]),
            React.createElement('button', {
                key: 'editBtn',
                onClick: () => onEdit(trip),
                className: 'btn btn-primary'
            }, 'Edit Recommendation')
        ]),

        // User Points Section
        userPoints && React.createElement('div', {
            key: 'userPoints',
            style: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
            }
        }, [
            React.createElement('h3', {
                key: 'pointsTitle',
                style: { margin: '0 0 15px 0', fontSize: '18px' }
            }, '💳 User\'s Points Balance'),
            React.createElement('div', {
                key: 'pointsGrid',
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                }
            }, [
                // Credit Card Points
                userPoints.creditCardPoints && Object.keys(userPoints.creditCardPoints).length > 0 && 
                    React.createElement('div', {
                        key: 'creditCard',
                        style: {
                            background: 'rgba(255,255,255,0.1)',
                            padding: '12px',
                            borderRadius: '8px'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'ccTitle',
                            style: { fontSize: '14px', opacity: '0.9', marginBottom: '8px' }
                        }, '💳 Credit Cards'),
                        ...Object.entries(userPoints.creditCardPoints).map(([program, points]) =>
                            React.createElement('div', {
                                key: program,
                                style: { fontSize: '13px', marginBottom: '4px' }
                            }, `${program}: ${points.toLocaleString()} pts`)
                        )
                    ]),
                
                // Hotel Points
                userPoints.hotelPoints && Object.keys(userPoints.hotelPoints).length > 0 && 
                    React.createElement('div', {
                        key: 'hotel',
                        style: {
                            background: 'rgba(255,255,255,0.1)',
                            padding: '12px',
                            borderRadius: '8px'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'hotelTitle',
                            style: { fontSize: '14px', opacity: '0.9', marginBottom: '8px' }
                        }, '🏨 Hotels'),
                        ...Object.entries(userPoints.hotelPoints).map(([program, points]) =>
                            React.createElement('div', {
                                key: program,
                                style: { fontSize: '13px', marginBottom: '4px' }
                            }, `${program}: ${points.toLocaleString()} pts`)
                        )
                    ]),
                
                // Airline Points
                userPoints.airlinePoints && Object.keys(userPoints.airlinePoints).length > 0 && 
                    React.createElement('div', {
                        key: 'airline',
                        style: {
                            background: 'rgba(255,255,255,0.1)',
                            padding: '12px',
                            borderRadius: '8px'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'airlineTitle',
                            style: { fontSize: '14px', opacity: '0.9', marginBottom: '8px' }
                        }, '✈️ Airlines'),
                        ...Object.entries(userPoints.airlinePoints).map(([program, points]) =>
                            React.createElement('div', {
                                key: program,
                                style: { fontSize: '13px', marginBottom: '4px' }
                            }, `${program}: ${points.toLocaleString()} pts`)
                        )
                    ])
            ].filter(Boolean))
        ]),

        // Trip Information Grid
        React.createElement('div', {
            key: 'tripInfo',
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
            }
        }, [
            // Basic Trip Details
            React.createElement('div', {
                key: 'basicInfo',
                className: 'section'
            }, [
                React.createElement('h3', { key: 'basicTitle' }, '📅 Trip Details'),
                React.createElement('div', { key: 'basicContent' }, [
                    trip.departureLocation && React.createElement('p', { key: 'departure' }, [
                        React.createElement('strong', null, 'From: '),
                        trip.departureLocation
                    ]),
                    React.createElement('p', { key: 'destination' }, [
                        React.createElement('strong', null, 'To: '),
                        formatDestinations(trip.destinations, trip.destination)
                    ]),
                    React.createElement('p', { key: 'dates' }, [
                        React.createElement('strong', null, 'Dates: '),
                        trip.startDate && window.DataHelpers.formatDate(trip.startDate),
                        ' - ',
                        trip.endDate && window.DataHelpers.formatDate(trip.endDate)
                    ].filter(Boolean).join('')),
                    React.createElement('p', { key: 'flexible' }, [
                        React.createElement('strong', null, 'Flexible Dates: '),
                        trip.flexibleDates ? 'Yes' : 'No'
                    ]),
                    trip.flexibleDates && trip.tripDuration && React.createElement('p', { key: 'duration' }, [
                        React.createElement('strong', null, 'Trip Duration: '),
                        `${trip.tripDuration} ${trip.tripDuration === 1 ? 'day' : 'days'}`
                    ]),
                    React.createElement('p', { key: 'status' }, [
                        React.createElement('strong', null, 'Status: '),
                        React.createElement('span', {
                            className: `status-badge status-${trip.status}`,
                            style: { marginLeft: '8px' }
                        }, trip.status)
                    ])
                ])
            ]),

            // User Preferences
            React.createElement('div', {
                key: 'preferences',
                className: 'section'
            }, [
                React.createElement('h3', { key: 'prefTitle' }, '👤 User Preferences'),
                React.createElement('div', { key: 'prefContent' }, [
                    trip.budget && React.createElement('p', { key: 'budget' }, [
                        React.createElement('strong', null, 'Budget: '),
                        trip.budget
                    ]),
                    trip.travelStyle && React.createElement('p', { key: 'style' }, [
                        React.createElement('strong', null, 'Travel Style: '),
                        trip.travelStyle
                    ]),
                    trip.groupSize && React.createElement('p', { key: 'group' }, [
                        React.createElement('strong', null, 'Group Size: '),
                        `${trip.groupSize} ${trip.groupSize === 1 ? 'person' : 'people'}`
                    ]),
                    trip.flightClass && React.createElement('p', { key: 'class' }, [
                        React.createElement('strong', null, 'Flight Class: '),
                        trip.flightClass
                    ]),
                    React.createElement('p', { key: 'interests' }, [
                        React.createElement('strong', null, 'Interests: '),
                        formatInterests(trip.interests)
                    ])
                ].filter(Boolean))
            ])
        ]),

        // Special Requests
        trip.specialRequests && React.createElement('div', {
            key: 'specialRequests',
            className: 'section'
        }, [
            React.createElement('h3', { key: 'reqTitle' }, '📝 Special Requests'),
            React.createElement('div', {
                key: 'reqContent',
                style: {
                    background: '#f8fafc',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                }
            }, trip.specialRequests)
        ]),

        // Trip Status and Actions
        React.createElement('div', {
            key: 'actions',
            className: 'section'
        }, [
            React.createElement('h3', { key: 'actionsTitle' }, '🔧 Actions'),
            React.createElement('div', {
                key: 'actionButtons',
                style: { display: 'flex', gap: '10px' }
            }, [
                React.createElement('button', {
                    key: 'editFull',
                    onClick: () => onEdit(trip),
                    className: 'btn btn-primary'
                }, 'Edit Full Recommendation'),
                React.createElement('button', {
                    key: 'viewRecommendation',
                    onClick: () => {
                        // Could add functionality to view recommendation in read-only mode
                        console.log('View recommendation:', trip);
                    },
                    className: 'btn btn-secondary'
                }, 'View Current Recommendation')
            ])
        ])
    ]);
};

console.log('✅ TripDetailView component loaded');