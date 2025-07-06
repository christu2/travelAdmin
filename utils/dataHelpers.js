/**
 * Data Helper Utilities
 * 
 * Common data manipulation and formatting functions
 * Used across multiple components for consistency
 */

// ID generation function
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Date formatting function
const formatDate = (dateInput) => {
    if (!dateInput) return '';
    
    let date;
    if (dateInput.toDate) {
        // Firebase Timestamp
        date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
    } else {
        return '';
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Trip status formatting
const formatTripStatus = (status) => {
    const statusMap = {
        'pending': 'Pending Review',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
};

// Cost formatting
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

// Points formatting
const formatPoints = (points) => {
    if (typeof points !== 'number') return '0';
    return points.toLocaleString();
};

// Empty object creators for forms
const createEmptyFlexibleCost = () => ({
    paymentType: 'cash',
    cashAmount: 0,
    pointsAmount: null,
    pointsProgram: null,
    totalCashValue: 0,
    notes: null
});

const createEmptyDestination = () => ({
    id: generateId(),
    cityName: '',
    arrivalDate: '',
    departureDate: '',
    numberOfNights: 1,
    accommodationOptions: [],
    recommendedActivities: [],
    recommendedRestaurants: []
});

const createEmptyActivityRecommendation = () => ({
    id: generateId(),
    name: '',
    description: '',
    category: 'sightseeing',
    location: {
        name: '',
        address: '',
        coordinates: null,
        nearbyLandmarks: null
    },
    estimatedDuration: '',
    estimatedCost: createEmptyFlexibleCost(),
    bestTimeToVisit: '',
    bookingRequired: false,
    bookingUrl: null,
    bookingInstructions: null,
    tips: [],
    priority: 'medium'
});

const createEmptyRestaurantRecommendation = () => ({
    id: generateId(),
    name: '',
    cuisine: '',
    description: '',
    location: {
        name: '',
        address: '',
        coordinates: null,
        nearbyLandmarks: null
    },
    priceRange: '$$',
    mealType: 'dinner',
    estimatedCost: createEmptyFlexibleCost(),
    reservationRequired: false,
    reservationUrl: null,
    reservationInstructions: null,
    specialties: [],
    tips: [],
    priority: 'medium'
});

const createEmptyAccommodation = () => ({
    id: generateId(),
    priority: 1,
    hotel: {
        name: '',
        rating: 4,
        pricePerNight: createEmptyFlexibleCost(),
        totalNights: 1,
        totalCost: createEmptyFlexibleCost(),
        checkIn: '',
        checkOut: '',
        amenities: [],
        location: {
            name: '',
            address: '',
            coordinates: null,
            nearbyLandmarks: ''
        },
        bookingUrl: '',
        bookingInstructions: '',
        cancellationPolicy: '',
        contactInfo: {
            phone: '',
            email: '',
            website: ''
        }
    }
});

// Trip data validation
const validateTripData = (trip) => {
    const errors = [];
    
    if (!trip.destinations && !trip.destination) {
        errors.push('Destination is required');
    }
    
    if (!trip.startDate) {
        errors.push('Start date is required');
    }
    
    if (!trip.endDate) {
        errors.push('End date is required');
    }
    
    if (trip.startDate && trip.endDate) {
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        if (startDate >= endDate) {
            errors.push('End date must be after start date');
        }
    }
    
    return errors;
};

// Calculate trip duration
const calculateTripDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Extract user-friendly destination string
const formatDestinations = (destinations, fallbackDestination) => {
    if (destinations && Array.isArray(destinations) && destinations.length > 0) {
        return destinations.join(' → ');
    }
    return fallbackDestination || 'Unknown Destination';
};

// Set nested object property using dot notation
const setNestedProperty = (obj, path, value) => {
    const keys = path.split(/[\.\[\]]+/).filter(key => key !== '');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
};

// Create empty recommendation structure
const createEmptyRecommendation = (trip) => {
    const destinations = trip.destinations || [trip.destination].filter(Boolean);
    
    // Create default destination if none exist
    const defaultDestinations = destinations.length > 0 
        ? destinations.map(cityName => ({
            id: generateId(),
            cityName: cityName,
            checkInDate: '',
            checkOutDate: '',
            numberOfNights: 1,
            accommodationOptions: [{
                id: generateId(),
                priority: 1,
                hotel: {
                    name: '',
                    rating: 4,
                    pricePerNight: 0,
                    pointsPerNight: 0,
                    loyaltyProgram: '',
                    location: '',
                    bookingUrl: '',
                    detailedDescription: '',
                    tripadvisorId: ''
                }
            }],
            recommendedActivities: [],
            recommendedRestaurants: []
        }))
        : [{
            id: generateId(),
            cityName: '',
            checkInDate: '',
            checkOutDate: '',
            numberOfNights: 1,
            accommodationOptions: [{
                id: generateId(),
                priority: 1,
                hotel: {
                    name: '',
                    rating: 4,
                    pricePerNight: 0,
                    pointsPerNight: 0,
                    loyaltyProgram: '',
                    location: '',
                    bookingUrl: '',
                    detailedDescription: '',
                    tripadvisorId: ''
                }
            }],
            recommendedActivities: [],
            recommendedRestaurants: []
        }];
    
    return {
        tripOverview: '',
        destinations: defaultDestinations,
        logistics: {
            transportSegments: [{
                id: generateId(),
                type: 'flight',
                from: '',
                to: '',
                date: '',
                time: '',
                airline: '',
                flightNumber: '',
                cost: 0,
                pointsCost: 0,
                bookingUrl: '',
                notes: ''
            }]
        },
        totalCost: {
            accommodation: 0,
            flights: 0,
            total: 0
        }
    };
};

// Convert legacy recommendation format to new format
const convertLegacyRecommendation = (legacyRec) => {
    // Implementation would depend on legacy format structure
    // For now, return the legacy recommendation as-is
    return legacyRec;
};

// Export all functions globally for script-based architecture
window.DataHelpers = {
    generateId,
    formatDate,
    formatTripStatus,
    formatCurrency,
    formatPoints,
    createEmptyFlexibleCost,
    createEmptyDestination,
    createEmptyActivityRecommendation,
    createEmptyRestaurantRecommendation,
    createEmptyAccommodation,
    validateTripData,
    calculateTripDuration,
    formatDestinations,
    setNestedProperty,
    createEmptyRecommendation,
    convertLegacyRecommendation
};

console.log('✅ DataHelpers utility loaded');