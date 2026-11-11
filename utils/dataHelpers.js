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

// Date formatting function for display
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

// Date formatting function for HTML date inputs (yyyy-MM-dd)
const formatDateForInput = (dateInput) => {
    if (!dateInput) return '';
    
    let date;
    if (dateInput.toDate) {
        // Firebase Timestamp
        date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        // If already in yyyy-MM-dd format, return as-is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            return dateInput;
        }
        date = new Date(dateInput);
    } else {
        return '';
    }
    
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
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
    recommendedRestaurants: [],
    selectedAccommodationId: null
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
        pricePerNight: 0,
        pointsPerNight: 0,
        loyaltyProgram: '',
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
        },
        tripadvisorId: '',
        tripadvisorUrl: '',
        detailedDescription: ''
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
            arrivalDate: '',
            departureDate: '',
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
            arrivalDate: '',
            departureDate: '',
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
        id: generateId(),
        tripOverview: '',
        destinations: defaultDestinations,
        logistics: {
            transportSegments: [createEmptyTransportSegment()],
            bookingDeadlines: [],
            generalInstructions: ''
        },
        totalCost: {
            totalEstimate: 0,
            flights: 0,
            accommodation: 0,
            activities: 0,
            food: 0,
            localTransport: 0,
            miscellaneous: 0,
            currency: 'USD'
        },
        createdAt: null
    };
};

// Create empty transport segment
const createEmptyTransportSegment = () => ({
    id: generateId(),
    fromCity: '',
    toCity: '',
    departureDate: '',
    transportOptions: [],
    selectedOptionId: null,
    segmentType: 'outbound', // outbound, inbound, domestic, connecting
    bookingGroupId: null,
    displaySequence: null
});

// Create empty transport option
const createEmptyTransportOption = (segmentDate = null) => ({
    id: generateId(),
    transportType: 'flight',
    priority: 1,
    cost: {
        paymentType: 'cash',
        cashAmount: 0,
        totalCashValue: 0,
        pointsAmount: null,
        pointsProgram: null
    },
    details: createEmptyTransportDetails('flight', segmentDate),
    duration: '',
    bookingUrl: '',
    notes: '',
    isRoundTrip: false,
    linkedSegmentId: null,
    recommendedSelection: false
});

// Create empty transport details based on type
const createEmptyTransportDetails = (transportType, segmentDate = null) => {
    switch (transportType) {
        case 'flight':
            return {
                flightNumber: '',
                airline: '',
                departureAirportName: '',
                arrivalAirportName: '',
                class: 'economy',
                aircraft: '',
                details: {
                    departure: {
                        airportCode: '',
                        time: '',
                        date: segmentDate || '' // Auto-fill with segment departure date
                    },
                    arrival: {
                        airportCode: '',
                        time: '',
                        date: ''
                    },
                    route: '',
                    showDateChange: false
                }
            };
        case 'train':
            return {
                details: {
                    operatorName: '',
                    trainNumber: '',
                    departure: {
                        stationCode: '',
                        time: '',
                        date: ''
                    },
                    arrival: {
                        stationCode: '',
                        time: '',
                        date: ''
                    }
                }
            };
        case 'car':
            return {
                details: {
                    company: '',
                    carType: '',
                    pickupLocation: '',
                    dropoffLocation: ''
                }
            };
        default:
            return {};
    }
};

// Convert legacy recommendation format to new format
const convertLegacyRecommendation = (legacyRec) => {
    // Implementation would depend on legacy format structure
    // For now, return the legacy recommendation as-is
    return legacyRec;
};

// Admin Mirror Management Functions
const AdminMirrorHelpers = {
    // Create or update admin mirror record
    async createOrUpdateMirror(tripData, adminEmail) {
        const adminUsername = adminEmail.split('@')[0];
        const mirrorId = `${adminUsername}_${tripData.id}`;
        
        const mirrorRef = firebase.firestore().collection('admin_mirrors').doc(mirrorId);
        
        const mirrorData = {
            ...tripData,
            userEmail: adminEmail,
            email: adminEmail,
            _mirrorMetadata: {
                originalTripId: tripData.id,
                adminUsername: adminUsername,
                originalUserEmail: tripData.userEmail || tripData.email,
                lastSyncedAt: firebase.firestore.FieldValue.serverTimestamp(),
                purpose: 'ios_app_preview'
            }
        };
        
        await mirrorRef.set(mirrorData, { merge: true });
        console.log(`Mirror record created/updated: ${mirrorId}`);
        return mirrorId;
    },
    
    // Delete admin mirror record
    async deleteMirror(tripId, adminEmail) {
        const adminUsername = adminEmail.split('@')[0];
        const mirrorId = `${adminUsername}_${tripId}`;
        
        try {
            await firebase.firestore().collection('admin_mirrors').doc(mirrorId).delete();
            console.log(`Mirror record deleted: ${mirrorId}`);
        } catch (error) {
            console.error('Error deleting mirror record:', error);
        }
    },
    
    // Get admin's view of a trip (from mirror)
    async getAdminViewOfTrip(tripId, adminEmail) {
        const adminUsername = adminEmail.split('@')[0];
        const mirrorId = `${adminUsername}_${tripId}`;
        
        try {
            const mirrorDoc = await firebase.firestore().collection('admin_mirrors').doc(mirrorId).get();
            return mirrorDoc.exists ? mirrorDoc.data() : null;
        } catch (error) {
            console.error('Error fetching mirror record:', error);
            return null;
        }
    },
    
    // Clean up all mirrors for a deleted trip (call this when deleting trips)
    async cleanupMirrorsForTrip(tripId) {
        try {
            const mirrorsQuery = firebase.firestore()
                .collection('admin_mirrors')
                .where('_mirrorMetadata.originalTripId', '==', tripId);
            
            const snapshot = await mirrorsQuery.get();
            
            if (!snapshot.empty) {
                const batch = firebase.firestore().batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log(`Cleaned up ${snapshot.size} mirror records for trip: ${tripId}`);
            }
        } catch (error) {
            console.error('Error cleaning up mirror records:', error);
        }
    }
};

// Normalize and automatically calculate nights & cost totals on any recommendation object
const normalizeAndCalculateRecommendation = (rawRec) => {
    if (!rawRec || typeof rawRec !== 'object') return rawRec;
    const rec = JSON.parse(JSON.stringify(rawRec));

    rec.id = rec.id || generateId();
    rec.tripOverview = rec.tripOverview || '';
    rec.costNotes = rec.costNotes || '';
    rec._schemaVersion = '2.1.0';
    rec._lastModifiedBy = rec._lastModifiedBy || 'admin_dashboard';

    let accommodationCashTotal = 0;
    let activitiesCashTotal = 0;
    let foodCashTotal = 0;
    let flightsCashTotal = 0;
    let localTransportCashTotal = 0;
    const pointsUsed = {};

    // Normalize destinations
    rec.destinations = Array.isArray(rec.destinations) ? rec.destinations.map((dest) => {
        const d = { ...dest };
        d.id = d.id || generateId();
        d.cityName = d.cityName || d.name || '';
        d.arrivalDate = formatDateForInput(d.arrivalDate || d.checkInDate || '');
        d.departureDate = formatDateForInput(d.departureDate || d.checkOutDate || '');

        if (d.arrivalDate && d.departureDate) {
            const checkIn = new Date(d.arrivalDate);
            const checkOut = new Date(d.departureDate);
            const diffDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
            if (diffDays > 0) {
                d.numberOfNights = diffDays;
            }
        }
        d.numberOfNights = Math.max(1, parseInt(d.numberOfNights, 10) || 1);
        d.overview = d.overview || '';

        d.accommodationOptions = Array.isArray(d.accommodationOptions) ? d.accommodationOptions.map((opt, idx) => {
            const acc = { ...opt };
            acc.id = acc.id || generateId();
            acc.priority = parseInt(acc.priority, 10) || (idx + 1);
            const h = { ...(acc.hotel || {}) };
            h.name = h.name || '';
            h.rating = Math.min(5, Math.max(1, parseFloat(h.rating) || 4.5));
            h.pricePerNight = Math.max(0, parseFloat(h.pricePerNight) || 0);
            h.pointsPerNight = Math.max(0, parseInt(h.pointsPerNight, 10) || 0);
            h.loyaltyProgram = h.loyaltyProgram || '';
            h.location = typeof h.location === 'object'
                ? (h.location?.address || h.location?.name || '')
                : (h.location || d.cityName || '');
            h.bookingUrl = h.bookingUrl || '';
            h.bookingInstructions = h.bookingInstructions || acc.bookingInstructions || '';
            h.detailedDescription = h.detailedDescription || h.description || '';
            h.photoUrl = h.photoUrl || (Array.isArray(h.photos) && h.photos[0]) || '';
            h.tripadvisorUrl = h.tripadvisorUrl || '';
            acc.bookingInstructions = acc.bookingInstructions || h.bookingInstructions || '';
            acc.hotel = h;
            return acc;
        }) : [];

        // Add accommodation cost for selected or priority-1 hotel
        if (d.accommodationOptions.length > 0) {
            const sortedAcc = [...d.accommodationOptions].sort((a, b) => (a.priority || 1) - (b.priority || 1));
            const chosenAcc = sortedAcc[0];
            if (chosenAcc?.hotel) {
                accommodationCashTotal += (chosenAcc.hotel.pricePerNight || 0) * d.numberOfNights;
                const pts = (chosenAcc.hotel.pointsPerNight || 0) * d.numberOfNights;
                if (pts > 0) {
                    const prog = chosenAcc.hotel.loyaltyProgram || 'Hotel Points';
                    pointsUsed[prog] = (pointsUsed[prog] || 0) + pts;
                }
            }
        }

        d.recommendedActivities = Array.isArray(d.recommendedActivities) ? d.recommendedActivities.map((act, idx) => {
            const a = { ...act };
            a.id = a.id || generateId();
            a.name = a.name || a.title || '';
            a.description = a.description || '';
            a.category = a.category || 'Sightseeing';
            a.estimatedDuration = a.estimatedDuration || a.duration || '';
            a.priority = parseInt(a.priority, 10) || (idx + 1);
            a.bestTimeToVisit = a.bestTimeToVisit || '';
            a.bookingRequired = Boolean(a.bookingRequired);
            a.bookingInstructions = a.bookingInstructions || '';
            a.tips = Array.isArray(a.tips) ? a.tips.join('; ') : (a.tips || '');
            a.website = a.website || '';
            a.tripadvisorUrl = a.tripadvisorUrl || '';
            a.bookingUrl = a.bookingUrl || '';
            if (typeof a.location === 'string') {
                a.location = { name: a.location, address: a.location };
            } else {
                a.location = {
                    name: a.location?.name || a.location?.address || d.cityName || '',
                    address: a.location?.address || a.location?.name || ''
                };
            }
            const cashVal = typeof a.estimatedCost === 'number'
                ? a.estimatedCost
                : (parseFloat(a.estimatedCost?.cashAmount) || 0);
            a.estimatedCost = {
                paymentType: 'cash',
                cashAmount: Math.max(0, cashVal)
            };
            activitiesCashTotal += Math.max(0, cashVal);
            return a;
        }) : [];

        d.recommendedRestaurants = Array.isArray(d.recommendedRestaurants) ? d.recommendedRestaurants.map((rest, idx) => {
            const r = { ...rest };
            r.id = r.id || generateId();
            r.name = r.name || '';
            r.cuisine = r.cuisine || '';
            r.mealType = r.mealType || 'Dinner';
            r.priority = parseInt(r.priority, 10) || (idx + 1);
            r.priceRange = ['$', '$$', '$$$', '$$$$'].includes(r.priceRange) ? r.priceRange : '$$';
            r.description = r.description || '';
            r.reservationRequired = Boolean(r.reservationRequired);
            r.reservationUrl = r.reservationUrl || '';
            r.reservationInstructions = r.reservationInstructions || '';
            r.specialties = Array.isArray(r.specialties) ? r.specialties.join(', ') : (r.specialties || '');
            r.tips = Array.isArray(r.tips) ? r.tips.join('; ') : (r.tips || '');
            r.yelpUrl = r.yelpUrl || '';
            r.website = r.website || '';
            if (typeof r.location === 'string') {
                r.location = { name: r.location, address: r.location };
            } else {
                r.location = {
                    name: r.location?.name || r.location?.address || d.cityName || '',
                    address: r.location?.address || r.location?.name || ''
                };
            }
            const cashVal = typeof r.estimatedCost === 'number'
                ? r.estimatedCost
                : (parseFloat(r.estimatedCost?.cashAmount) || 0);
            r.estimatedCost = {
                paymentType: 'cash',
                cashAmount: Math.max(0, cashVal)
            };
            foodCashTotal += Math.max(0, cashVal);
            return r;
        }) : [];

        return d;
    }) : [];

    // Normalize logistics
    if (!rec.logistics || typeof rec.logistics !== 'object') {
        rec.logistics = { transportSegments: [], bookingDeadlines: [], generalInstructions: '' };
    }
    rec.logistics.bookingDeadlines = Array.isArray(rec.logistics.bookingDeadlines) ? rec.logistics.bookingDeadlines : [];
    rec.logistics.generalInstructions = rec.logistics.generalInstructions || '';

    rec.logistics.transportSegments = Array.isArray(rec.logistics.transportSegments) ? rec.logistics.transportSegments.map((seg) => {
        const s = { ...seg };
        s.id = s.id || generateId();
        s.fromCity = s.fromCity || s.originCity || '';
        s.toCity = s.toCity || s.destinationCity || '';
        s.departureDate = formatDateForInput(s.departureDate || s.dateRange || '');
        s.segmentType = s.segmentType || 'outbound';

        s.transportOptions = Array.isArray(s.transportOptions) ? s.transportOptions.map((opt, idx) => {
            const o = { ...opt };
            o.id = o.id || generateId();
            const rawType = (o.transportType || o.type || 'flight').toLowerCase();
            o.transportType = rawType === 'car_rental' ? 'car' : rawType;
            o.priority = parseInt(o.priority, 10) || (idx + 1);
            o.duration = o.duration || '';
            o.bookingUrl = o.bookingUrl || '';
            o.notes = o.notes || '';
            o.isRoundTrip = Boolean(o.isRoundTrip);
            o.linkedSegmentId = o.linkedSegmentId || null;
            o.recommendedSelection = o.recommendedSelection !== undefined ? Boolean(o.recommendedSelection) : (idx === 0);

            // Normalize cost
            if (typeof o.cost === 'number') {
                o.cost = {
                    paymentType: 'cash',
                    cashAmount: Math.max(0, o.cost),
                    totalCashValue: Math.max(0, o.cost),
                    pointsAmount: null,
                    pointsProgram: null
                };
            } else {
                const c = o.cost || {};
                const cashAmt = Math.max(0, parseFloat(c.cashAmount ?? c.taxesAndFees ?? 0) || 0);
                const ptsAmt = Math.max(0, parseInt(c.pointsAmount ?? c.points ?? 0, 10) || 0);
                const prog = c.pointsProgram || c.program || '';
                o.cost = {
                    paymentType: ptsAmt > 0 && cashAmt > 0 ? 'hybrid' : (ptsAmt > 0 ? 'points' : 'cash'),
                    cashAmount: cashAmt,
                    totalCashValue: Math.max(cashAmt, parseFloat(c.totalCashValue) || cashAmt),
                    pointsAmount: ptsAmt > 0 ? ptsAmt : null,
                    pointsProgram: prog || null
                };
            }

            // Normalize details (especially nested flight details)
            const det = { ...(o.details || {}) };
            if (o.transportType === 'flight') {
                det.flightNumber = det.flightNumber || o.flightNumber || '';
                det.airline = det.airline || o.airline || o.provider || '';
                det.departureAirportName = det.departureAirportName || '';
                det.arrivalAirportName = det.arrivalAirportName || '';
                det.class = det.class || det.cabinClass || o.cabinClass || 'Business';
                det.aircraft = det.aircraft || '';

                const inner = { ...(det.details || {}) };
                const depCode = inner.departure?.airportCode || det.departureAirportCode || det.originAirport || '';
                const arrCode = inner.arrival?.airportCode || det.arrivalAirportCode || det.destinationAirport || '';
                inner.departure = {
                    airportCode: depCode,
                    time: inner.departure?.time || det.departureTime || o.departureTime || '',
                    date: formatDateForInput(inner.departure?.date || det.departureDate || s.departureDate || '')
                };
                inner.arrival = {
                    airportCode: arrCode,
                    time: inner.arrival?.time || det.arrivalTime || o.arrivalTime || '',
                    date: formatDateForInput(inner.arrival?.date || det.arrivalDate || s.departureDate || '')
                };
                inner.route = inner.route || (depCode && arrCode ? `${depCode} → ${arrCode}` : `${s.fromCity} → ${s.toCity}`);
                inner.showDateChange = inner.showDateChange ?? det.showDateChange ?? false;
                det.details = inner;
            }
            o.details = det;
            return o;
        }) : [];

        // Accumulate transport cost for priority 1 option
        if (s.transportOptions.length > 0) {
            const sortedOpts = [...s.transportOptions].sort((a, b) => (a.priority || 1) - (b.priority || 1));
            const chosenOpt = sortedOpts[0];
            if (chosenOpt) {
                if (chosenOpt.transportType === 'flight') {
                    flightsCashTotal += chosenOpt.cost?.cashAmount || 0;
                } else {
                    localTransportCashTotal += chosenOpt.cost?.cashAmount || 0;
                }
                const pts = chosenOpt.cost?.pointsAmount || 0;
                if (pts > 0) {
                    const prog = chosenOpt.cost?.pointsProgram || 'Airline Points';
                    pointsUsed[prog] = (pointsUsed[prog] || 0) + pts;
                }
            }
        }

        return s;
    }) : [];

    const existingMisc = Math.max(0, parseFloat(rec.totalCost?.miscellaneous) || 0);
    const computedFlights = flightsCashTotal > 0 ? flightsCashTotal : Math.max(0, parseFloat(rec.totalCost?.flights) || 0);
    const computedAcc = accommodationCashTotal > 0 ? accommodationCashTotal : Math.max(0, parseFloat(rec.totalCost?.accommodation) || 0);
    const computedAct = activitiesCashTotal > 0 ? activitiesCashTotal : Math.max(0, parseFloat(rec.totalCost?.activities) || 0);
    const computedFood = foodCashTotal > 0 ? foodCashTotal : Math.max(0, parseFloat(rec.totalCost?.food) || 0);
    const computedLocal = localTransportCashTotal > 0 ? localTransportCashTotal : Math.max(0, parseFloat(rec.totalCost?.localTransport) || 0);

    rec.totalCost = {
        flights: computedFlights,
        accommodation: computedAcc,
        activities: computedAct,
        food: computedFood,
        localTransport: computedLocal,
        miscellaneous: existingMisc,
        totalEstimate: computedFlights + computedAcc + computedAct + computedFood + computedLocal + existingMisc,
        currency: rec.totalCost?.currency || 'USD',
        pointsUsed: Object.keys(pointsUsed).length > 0 ? pointsUsed : (rec.totalCost?.pointsUsed || {})
    };

    return rec;
};

// Export all functions globally for script-based architecture
const DataHelpers = {
    generateId,
    formatDate,
    formatDateForInput,
    formatTripStatus,
    formatCurrency,
    formatPoints,
    createEmptyFlexibleCost,
    createEmptyDestination,
    createEmptyActivityRecommendation,
    createEmptyRestaurantRecommendation,
    createEmptyAccommodation,
    createEmptyTransportSegment,
    createEmptyTransportOption,
    createEmptyTransportDetails,
    validateTripData,
    calculateTripDuration,
    formatDestinations,
    setNestedProperty,
    createEmptyRecommendation,
    convertLegacyRecommendation,
    normalizeAndCalculateRecommendation
};

if (typeof window !== 'undefined') {
    window.DataHelpers = DataHelpers;
    window.AdminMirrorHelpers = AdminMirrorHelpers;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataHelpers, AdminMirrorHelpers };
}

console.log('✅ DataHelpers utility loaded');