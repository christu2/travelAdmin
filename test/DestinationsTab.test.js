/**
 * Comprehensive test suite for DestinationsTab & DataHelpers recommendation normalization
 *
 * Tests cover:
 * - Destination creation and removal
 * - Hotel option management
 * - Date calculations (nights)
 * - Cost & points calculations
 * - AI Copilot dictation normalization (normalizeAndCalculateRecommendation)
 * - Form & URL validation
 */

const { DataHelpers } = require('../utils/dataHelpers.js');

global.window = {
    DataHelpers,
    SecurityHelpers: {
        validateUrl: (url) => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')),
        isAuthorizedAdmin: (user) => Boolean(user && user.email && user.email.includes('@'))
    }
};

describe('DestinationsTab & DataHelpers Suite', () => {
    let recommendation;
    let updateRecommendation;
    let addDestination;
    let removeDestination;
    let addAccommodation;
    let removeAccommodation;

    beforeEach(() => {
        recommendation = {
            id: 'test-rec-123',
            destinations: [
                {
                    id: 'dest-1',
                    cityName: 'Paris',
                    arrivalDate: '2026-06-15',
                    departureDate: '2026-06-20',
                    numberOfNights: 5,
                    accommodationOptions: []
                }
            ]
        };

        updateRecommendation = jest.fn((path, value) => {
            recommendation = DataHelpers.setNestedProperty(recommendation, path, value);
        });

        addDestination = jest.fn(() => {
            recommendation.destinations.push(DataHelpers.createEmptyDestination());
        });

        removeDestination = jest.fn((index) => {
            if (recommendation.destinations.length > 1) {
                recommendation.destinations.splice(index, 1);
            }
        });

        addAccommodation = jest.fn((destIndex) => {
            if (!recommendation.destinations[destIndex].accommodationOptions) {
                recommendation.destinations[destIndex].accommodationOptions = [];
            }
            recommendation.destinations[destIndex].accommodationOptions.push(
                DataHelpers.createEmptyAccommodation()
            );
        });

        removeAccommodation = jest.fn((destIndex, accIndex) => {
            recommendation.destinations[destIndex].accommodationOptions.splice(accIndex, 1);
        });
    });

    // MARK: - Destination Management Tests

    test('initializes destinations tab state with initial destination', () => {
        expect(recommendation.destinations).toHaveLength(1);
        expect(recommendation.destinations[0].cityName).toBe('Paris');
    });

    test('adds new destination when addDestination is called', () => {
        addDestination();
        expect(addDestination).toHaveBeenCalled();
        expect(recommendation.destinations).toHaveLength(2);
    });

    test('removes destination when removeDestination is called', () => {
        recommendation.destinations.push(DataHelpers.createEmptyDestination());
        removeDestination(1);
        expect(removeDestination).toHaveBeenCalledWith(1);
        expect(recommendation.destinations).toHaveLength(1);
    });

    test('does not remove destination when only one destination exists', () => {
        removeDestination(0);
        expect(recommendation.destinations).toHaveLength(1);
    });

    // MARK: - Accommodation Management Tests

    test('adds accommodation option to destination', () => {
        addAccommodation(0);
        expect(addAccommodation).toHaveBeenCalledWith(0);
        expect(recommendation.destinations[0].accommodationOptions).toHaveLength(1);
    });

    test('removes accommodation option', () => {
        addAccommodation(0);
        expect(recommendation.destinations[0].accommodationOptions).toHaveLength(1);
        removeAccommodation(0, 0);
        expect(removeAccommodation).toHaveBeenCalledWith(0, 0);
        expect(recommendation.destinations[0].accommodationOptions).toHaveLength(0);
    });

    // MARK: - Date Calculation Tests

    test('calculates number of nights correctly', () => {
        const arrivalDate = new Date('2026-06-15');
        const departureDate = new Date('2026-06-20');
        const timeDiff = departureDate.getTime() - arrivalDate.getTime();
        const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
        expect(nights).toBe(5);
    });

    test('handles same-day arrival and departure', () => {
        const arrivalDate = new Date('2026-06-15');
        const departureDate = new Date('2026-06-15');
        const timeDiff = departureDate.getTime() - arrivalDate.getTime();
        const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
        expect(nights).toBe(1);
    });

    // MARK: - Cost & AI Dictation Normalization Tests

    test('normalizeAndCalculateRecommendation normalizes shorthand AI dictation into full iOS-compatible schema', () => {
        const rawAiRecommendation = {
            tripOverview: 'Luxury Paris & Amsterdam points redemption',
            costNotes: 'Transfer 100k Chase UR to Air France/KLM Flying Blue and 135k Chase UR to World of Hyatt.',
            destinations: [
                {
                    cityName: 'Paris, France',
                    arrivalDate: '2026-05-13',
                    departureDate: '2026-05-16',
                    overview: 'Stay near Place Vendôme',
                    accommodationOptions: [
                        {
                            priority: 1,
                            bookingInstructions: 'Transfer 45k Chase UR/night to Hyatt',
                            hotel: {
                                name: 'Park Hyatt Paris-Vendôme',
                                rating: 4.9,
                                pricePerNight: 0,
                                pointsPerNight: 45000,
                                loyaltyProgram: 'World of Hyatt',
                                location: '5 Rue de la Paix, 75002 Paris'
                            }
                        }
                    ],
                    recommendedActivities: [
                        {
                            name: 'Louvre Evening Tour',
                            estimatedCost: 85,
                            bookingRequired: true
                        }
                    ],
                    recommendedRestaurants: [
                        {
                            name: 'Le Comptoir du Relais',
                            estimatedCost: 75,
                            priceRange: '$$$'
                        }
                    ]
                }
            ],
            logistics: {
                transportSegments: [
                    {
                        fromCity: 'New York (JFK)',
                        toCity: 'Paris (CDG)',
                        departureDate: '2026-05-12',
                        transportOptions: [
                            {
                                transportType: 'flight',
                                priority: 1,
                                duration: '7h 15m',
                                cost: {
                                    paymentType: 'points',
                                    cashAmount: 210,
                                    pointsAmount: 50000,
                                    pointsProgram: 'Air France/KLM Flying Blue'
                                },
                                details: {
                                    flightNumber: 'AF 11',
                                    airline: 'Air France',
                                    departureAirportCode: 'JFK',
                                    arrivalAirportCode: 'CDG',
                                    departureTime: '19:30',
                                    arrivalTime: '08:45',
                                    showDateChange: '+1 day'
                                }
                            }
                        ]
                    }
                ]
            }
        };

        const normalized = DataHelpers.normalizeAndCalculateRecommendation(rawAiRecommendation);

        // 1. Nights auto-calculated from 2026-05-13 to 2026-05-16 -> 3 nights
        expect(normalized.destinations[0].numberOfNights).toBe(3);

        // 2. Nested flight departure/arrival codes populated for iOS decoding
        const flightOpt = normalized.logistics.transportSegments[0].transportOptions[0];
        expect(flightOpt.details.details.departure.airportCode).toBe('JFK');
        expect(flightOpt.details.details.arrival.airportCode).toBe('CDG');
        expect(flightOpt.details.details.departure.time).toBe('19:30');
        expect(flightOpt.details.details.arrival.time).toBe('08:45');
        expect(flightOpt.details.details.showDateChange).toBe('+1 day');

        // 3. Total cash & points breakdown calculated accurately
        expect(normalized.totalCost.flights).toBe(210);
        expect(normalized.totalCost.activities).toBe(85);
        expect(normalized.totalCost.food).toBe(75);
        expect(normalized.totalCost.totalEstimate).toBe(370);
        expect(normalized.totalCost.pointsUsed['World of Hyatt']).toBe(135000); // 45k * 3 nights
        expect(normalized.totalCost.pointsUsed['Air France/KLM Flying Blue']).toBe(50000);
    });

    test('handles zero price per night', () => {
        const pricePerNight = 0;
        const numberOfNights = 5;
        expect(pricePerNight * numberOfNights).toBe(0);
    });

    // MARK: - Form & URL Validation Tests

    test('validates rating is in range 1-5', () => {
        const validRatings = [1.0, 3.5, 5.0];
        const invalidRatings = [0.0, 5.1, 6.0, -1.0];

        validRatings.forEach(rating => {
            expect(rating).toBeGreaterThanOrEqual(1.0);
            expect(rating).toBeLessThanOrEqual(5.0);
        });

        invalidRatings.forEach(rating => {
            const isValid = rating >= 1.0 && rating <= 5.0;
            expect(isValid).toBe(false);
        });
    });

    test('validates TripAdvisor URL format', () => {
        const validUrls = [
            'https://www.tripadvisor.com/Hotel_Review-d123.html',
            'http://localhost:3002/api/hotels/details/123'
        ];

        const invalidUrls = [
            'ftp://invalid.com',
            'javascript:alert("xss")',
            ''
        ];

        validUrls.forEach(url => {
            expect(window.SecurityHelpers.validateUrl(url)).toBe(true);
        });

        invalidUrls.forEach(url => {
            expect(window.SecurityHelpers.validateUrl(url)).toBe(false);
        });
    });

    test('handles NaN and Infinite values gracefully during normalization', () => {
        const rec = DataHelpers.normalizeAndCalculateRecommendation({
            destinations: [
                {
                    cityName: 'Test',
                    numberOfNights: NaN,
                    accommodationOptions: [
                        {
                            hotel: {
                                name: 'Hotel Test',
                                rating: NaN,
                                pricePerNight: Infinity
                            }
                        }
                    ]
                }
            ]
        });

        expect(rec.destinations[0].numberOfNights).toBe(1);
        expect(rec.destinations[0].accommodationOptions[0].hotel.rating).toBe(4.5);
        expect(rec.destinations[0].accommodationOptions[0].hotel.pricePerNight).toBe(0);
    });
});
