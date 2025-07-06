/**
 * UserPointsDisplay Component
 * 
 * Displays user's points balance across all loyalty programs (credit cards, hotels, airlines)
 * Fetches data from Firebase userPoints collection in real-time
 * 
 * @param {Object} currentUser - The authenticated user object
 */

// Expose component globally for script-based architecture
window.UserPointsDisplay = ({ currentUser, compact = false, userId = null }) => {
    const [pointsProfile, setPointsProfile] = React.useState(null);
    const [userProfile, setUserProfile] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchUserData = async () => {
            // Use provided userId or fallback to currentUser
            const targetUserId = userId || currentUser?.uid;
            if (!targetUserId) return;
            
            try {
                // Fetch user points
                const pointsDoc = await firebase.firestore().collection('userPoints').doc(targetUserId).get();
                if (pointsDoc.exists) {
                    setPointsProfile(pointsDoc.data());
                }

                // Fetch user profile for name
                const userDoc = await firebase.firestore().collection('users').doc(targetUserId).get();
                if (userDoc.exists) {
                    setUserProfile(userDoc.data());
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser, userId]);

    if (loading) return React.createElement('div', { 
        style: { fontSize: '12px', color: '#718096' } 
    }, 'Loading points...');
    
    if (!pointsProfile) {
        return React.createElement('div', {
            style: compact ? {
                fontSize: '12px',
                color: '#718096',
                fontStyle: 'italic'
            } : {
                fontSize: '14px',
                color: '#718096',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '20px'
            }
        }, 'No points data available');
    }

    return React.createElement('div', {
        style: compact ? {
            background: '#f8f9fa',
            color: '#2d3748',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
        } : {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px'
        }
    }, [
        !compact && React.createElement('h3', {
            key: 'title',
            style: { margin: '0 0 15px 0', fontSize: '18px' }
        }, [
            '💳 User Points Balance',
            userProfile?.name && React.createElement('div', {
                key: 'user-name',
                style: { fontSize: '14px', fontWeight: 'normal', marginTop: '5px', opacity: '0.9' }
            }, `👤 ${userProfile.name}`)
        ].filter(Boolean)),
        
        // User name for compact mode
        compact && userProfile?.name && React.createElement('div', {
            key: 'compact-user-name',
            style: { 
                fontSize: '12px', 
                fontWeight: '600', 
                marginBottom: '10px',
                color: '#4a5568',
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px'
            }
        }, `👤 ${userProfile.name}`),

        React.createElement('div', {
            key: 'grid',
            style: compact ? {
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            } : {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
            }
        }, [
            // Credit Card Points
            pointsProfile.creditCardPoints && Object.keys(pointsProfile.creditCardPoints).length > 0 && 
                React.createElement('div', {
                    key: 'creditCard',
                    style: compact ? {
                        background: 'rgba(0,0,0,0.02)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                    } : {
                        background: 'rgba(255,255,255,0.1)',
                        padding: '12px',
                        borderRadius: '8px'
                    }
                }, [
                    React.createElement('div', {
                        key: 'ccTitle',
                        style: compact ? {
                            fontSize: '11px',
                            fontWeight: '600',
                            marginBottom: '4px'
                        } : {
                            fontSize: '14px',
                            opacity: '0.9',
                            marginBottom: '8px'
                        }
                    }, '💳 Credit Cards'),
                    ...Object.entries(pointsProfile.creditCardPoints).map(([program, points]) =>
                        React.createElement('div', {
                            key: program,
                            style: compact ? {
                                fontSize: '11px',
                                marginBottom: '2px'
                            } : {
                                fontSize: '13px',
                                marginBottom: '4px'
                            }
                        }, React.createElement('strong', null, program + ':'), ' ' + points.toLocaleString() + ' pts')
                    )
                ]),

            // Hotel Points
            pointsProfile.hotelPoints && Object.keys(pointsProfile.hotelPoints).length > 0 && 
                React.createElement('div', {
                    key: 'hotel',
                    style: compact ? {
                        background: 'rgba(0,0,0,0.02)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                    } : {
                        background: 'rgba(255,255,255,0.1)',
                        padding: '12px',
                        borderRadius: '8px'
                    }
                }, [
                    React.createElement('div', {
                        key: 'hotelTitle',
                        style: compact ? {
                            fontSize: '11px',
                            fontWeight: '600',
                            marginBottom: '4px'
                        } : {
                            fontSize: '14px',
                            opacity: '0.9',
                            marginBottom: '8px'
                        }
                    }, '🏨 Hotels'),
                    ...Object.entries(pointsProfile.hotelPoints).map(([program, points]) =>
                        React.createElement('div', {
                            key: program,
                            style: compact ? {
                                fontSize: '11px',
                                marginBottom: '2px'
                            } : {
                                fontSize: '13px',
                                marginBottom: '4px'
                            }
                        }, React.createElement('strong', null, program + ':'), ' ' + points.toLocaleString() + ' pts')
                    )
                ]),

            // Airline Points
            pointsProfile.airlinePoints && Object.keys(pointsProfile.airlinePoints).length > 0 && 
                React.createElement('div', {
                    key: 'airline',
                    style: compact ? {
                        background: 'rgba(0,0,0,0.02)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                    } : {
                        background: 'rgba(255,255,255,0.1)',
                        padding: '12px',
                        borderRadius: '8px'
                    }
                }, [
                    React.createElement('div', {
                        key: 'airlineTitle',
                        style: compact ? {
                            fontSize: '11px',
                            fontWeight: '600',
                            marginBottom: '4px'
                        } : {
                            fontSize: '14px',
                            opacity: '0.9',
                            marginBottom: '8px'
                        }
                    }, '✈️ Airlines'),
                    ...Object.entries(pointsProfile.airlinePoints).map(([program, points]) =>
                        React.createElement('div', {
                            key: program,
                            style: compact ? {
                                fontSize: '11px',
                                marginBottom: '2px'
                            } : {
                                fontSize: '13px',
                                marginBottom: '4px'
                            }
                        }, React.createElement('strong', null, program + ':'), ' ' + points.toLocaleString() + ' pts')
                    )
                ])
        ].filter(Boolean)),
        
        !compact && React.createElement('div', {
            key: 'lastUpdated',
            style: {
                fontSize: '12px',
                opacity: '0.8',
                marginTop: '12px'
            }
        }, 'Last updated: ' + (pointsProfile.lastUpdated ? window.DataHelpers.formatDate(pointsProfile.lastUpdated) : 'Never'))
    ]);
};

console.log('✅ UserPointsDisplay component loaded');