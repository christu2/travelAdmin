/**
 * TripCard Component
 * 
 * Displays a single trip as a clickable card with essential information
 * Shows destinations, dates, status, and basic trip metadata
 * 
 * @param {Object} trip - Trip data object
 * @param {Function} onSelect - Callback when trip is selected for viewing
 * @param {Function} onEdit - Callback when trip is selected for editing
 * @param {boolean} isSelected - Whether this trip is currently selected
 */

window.TripCard = ({ trip, onSelect, onEdit, isSelected = false }) => {
    const handleCardClick = (e) => {
        onSelect(trip);
    };

    return React.createElement('div', {
        className: `trip-card ${isSelected ? 'selected' : ''}`,
        onClick: handleCardClick,
        style: {
            cursor: 'pointer'
        }
    }, [
        // Trip metadata (date and ID)
        React.createElement('div', {
            key: 'meta',
            className: 'trip-meta'
        }, [
            window.DataHelpers.formatDate(trip.createdAt),
            ' • ID: ',
            trip.id.substring(0, 8)
        ].join('')),

        // Trip title (destinations)
        React.createElement('div', {
            key: 'title',
            className: 'trip-title'
        }, trip.destinations ? trip.destinations.join(' → ') : trip.destination),

        // Trip dates
        React.createElement('div', {
            key: 'dates',
            className: 'trip-destinations'
        }, [
            trip.startDate && window.DataHelpers.formatDate(trip.startDate),
            trip.endDate && window.DataHelpers.formatDate(trip.endDate)
        ].filter(Boolean).join(' - ')),

        // Enhanced Trip Information
        React.createElement('div', {
            key: 'enhanced-info',
            style: { fontSize: '14px', color: '#4a5568', marginTop: '10px' }
        }, [
            trip.budget && React.createElement('div', {
                key: 'budget',
                style: { marginBottom: '4px' }
            }, [
                React.createElement('strong', null, 'Budget: '),
                trip.budget
            ]),
            trip.groupSize && React.createElement('div', {
                key: 'groupSize',
                style: { marginBottom: '4px' }
            }, [
                React.createElement('strong', null, 'Group: '),
                `${trip.groupSize} ${trip.groupSize === 1 ? 'person' : 'people'}`
            ]),
            trip.travelStyle && React.createElement('div', {
                key: 'travelStyle',
                style: { marginBottom: '4px' }
            }, [
                React.createElement('strong', null, 'Style: '),
                trip.travelStyle
            ]),
            trip.flightClass && React.createElement('div', {
                key: 'flightClass',
                style: { marginBottom: '4px' }
            }, [
                React.createElement('strong', null, 'Flight Class: '),
                trip.flightClass
            ]),
            trip.interests && trip.interests.length > 0 && React.createElement('div', {
                key: 'interests',
                style: { marginBottom: '4px' }
            }, [
                React.createElement('strong', null, 'Interests: '),
                trip.interests.slice(0, 3).join(', ') + (trip.interests.length > 3 ? '...' : '')
            ]),
            trip.flexibleDates && React.createElement('div', {
                key: 'flexible',
                style: { fontSize: '12px', color: '#48bb78', marginTop: '6px' }
            }, '✓ Flexible dates')
        ]),

        // Bottom section with status and actions
        React.createElement('div', {
            key: 'bottom-section',
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px'
            }
        }, [
            React.createElement('span', {
                key: 'status',
                className: `status-badge status-${trip.status}`
            }, trip.status),
            React.createElement('div', {
                key: 'action-hint',
                style: { fontSize: '12px', color: '#718096' }
            }, 'Click to edit recommendation')
        ])
    ]);
};

console.log('✅ TripCard component loaded');