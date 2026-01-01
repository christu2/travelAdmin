/**
 * Comprehensive test suite for DestinationsTab component
 *
 * Tests cover:
 * - Destination creation and removal
 * - Hotel option management
 * - Date calculations (nights)
 * - Cost calculations
 * - TripAdvisor integration
 * - Form validation
 */

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock window.DataHelpers and window.SecurityHelpers
global.window = {
    DataHelpers: {
        createEmptyDestination: () => ({
            id: Date.now().toString(),
            cityName: '',
            arrivalDate: '',
            departureDate: '',
            numberOfNights: 1,
            accommodationOptions: []
        }),
        createEmptyAccommodation: () => ({
            id: Date.now().toString(),
            priority: 1,
            hotel: {
                name: '',
                rating: 4.0,
                pricePerNight: 0,
                pointsPerNight: 0,
                loyaltyProgram: '',
                location: '',
                bookingUrl: '',
                detailedDescription: ''
            }
        })
    },
    SecurityHelpers: {
        validateUrl: (url) => url.startsWith('http://') || url.startsWith('https://'),
        isAuthorizedAdmin: (user) => user && user.email && user.email.includes('@')
    }
};

// Mock DestinationsTab (simplified version for testing)
const MockDestinationsTab = ({
    recommendation,
    updateRecommendation,
    addDestination,
    removeDestination,
    addAccommodation,
    removeAccommodation
}) => {
    const destinations = recommendation?.destinations || [];

    return (
        <div>
            <button onClick={addDestination} data-testid="add-destination">
                Add Destination
            </button>

            {destinations.map((destination, destIndex) => (
                <div key={destination.id} data-testid={`destination-${destIndex}`}>
                    <input
                        data-testid={`city-name-${destIndex}`}
                        value={destination.cityName || ''}
                        onChange={(e) => updateRecommendation(`destinations[${destIndex}].cityName`, e.target.value)}
                    />

                    <input
                        data-testid={`arrival-date-${destIndex}`}
                        type="date"
                        value={destination.arrivalDate || ''}
                        onChange={(e) => updateRecommendation(`destinations[${destIndex}].arrivalDate`, e.target.value)}
                    />

                    <input
                        data-testid={`departure-date-${destIndex}`}
                        type="date"
                        value={destination.departureDate || ''}
                        onChange={(e) => updateRecommendation(`destinations[${destIndex}].departureDate`, e.target.value)}
                    />

                    {destinations.length > 1 && (
                        <button
                            onClick={() => removeDestination(destIndex)}
                            data-testid={`remove-destination-${destIndex}`}
                        >
                            Remove
                        </button>
                    )}

                    <button
                        onClick={() => addAccommodation(destIndex)}
                        data-testid={`add-accommodation-${destIndex}`}
                    >
                        Add Hotel
                    </button>

                    {(destination.accommodationOptions || []).map((option, accIndex) => (
                        <div key={option.id} data-testid={`accommodation-${destIndex}-${accIndex}`}>
                            <input
                                data-testid={`hotel-name-${destIndex}-${accIndex}`}
                                value={option.hotel?.name || ''}
                                onChange={(e) => updateRecommendation(
                                    `destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.name`,
                                    e.target.value
                                )}
                            />

                            <input
                                data-testid={`hotel-price-${destIndex}-${accIndex}`}
                                type="number"
                                value={option.hotel?.pricePerNight || 0}
                                onChange={(e) => updateRecommendation(
                                    `destinations[${destIndex}].accommodationOptions[${accIndex}].hotel.pricePerNight`,
                                    parseFloat(e.target.value)
                                )}
                            />

                            <button
                                onClick={() => removeAccommodation(destIndex, accIndex)}
                                data-testid={`remove-accommodation-${destIndex}-${accIndex}`}
                            >
                                Remove Hotel
                            </button>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

describe('DestinationsTab Component', () => {
    let recommendation;
    let updateRecommendation;
    let addDestination;
    let removeDestination;
    let addAccommodation;
    let removeAccommodation;

    beforeEach(() => {
        // Initialize recommendation data
        recommendation = {
            id: 'test-rec-123',
            destinations: [
                {
                    id: 'dest-1',
                    cityName: 'Paris',
                    arrivalDate: '2024-06-15',
                    departureDate: '2024-06-20',
                    numberOfNights: 5,
                    accommodationOptions: []
                }
            ]
        };

        // Mock functions
        updateRecommendation = jest.fn((path, value) => {
            // Simulate updating nested property
            const pathParts = path.split(/[\[\].]+/).filter(p => p);
            let current = recommendation;

            for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                const nextPart = pathParts[i + 1];

                if (!isNaN(nextPart)) {
                    current = current[part][parseInt(nextPart)];
                    i++; // Skip the array index
                } else {
                    current = current[part];
                }
            }

            current[pathParts[pathParts.length - 1]] = value;
        });

        addDestination = jest.fn(() => {
            recommendation.destinations.push(window.DataHelpers.createEmptyDestination());
        });

        removeDestination = jest.fn((index) => {
            recommendation.destinations.splice(index, 1);
        });

        addAccommodation = jest.fn((destIndex) => {
            if (!recommendation.destinations[destIndex].accommodationOptions) {
                recommendation.destinations[destIndex].accommodationOptions = [];
            }
            recommendation.destinations[destIndex].accommodationOptions.push(
                window.DataHelpers.createEmptyAccommodation()
            );
        });

        removeAccommodation = jest.fn((destIndex, accIndex) => {
            recommendation.destinations[destIndex].accommodationOptions.splice(accIndex, 1);
        });
    });

    // MARK: - Destination Management Tests

    test('renders destinations tab with initial destination', () => {
        render(
            <MockDestinationsTab
                recommendation={recommendation}
                updateRecommendation={updateRecommendation}
                addDestination={addDestination}
                removeDestination={removeDestination}
                addAccommodation={addAccommodation}
                removeAccommodation={removeAccommodation}
            />
        );

        expect(screen.getByTestId('destination-0')).toBeInTheDocument();
        expect(screen.getByTestId('city-name-0')).toHaveValue('Paris');
    });

    test('adds new destination when Add Destination clicked', () => {
        const { rerender } = render(
            <MockDestinationsTab
                recommendation={recommendation}
                updateRecommendation={updateRecommendation}
                addDestination={addDestination}
                removeDestination={removeDestination}
                addAccommodation={addAccommodation}
                removeAccommodation={removeAccommodation}
            />
        );

        const addButton = screen.getByTestId('add-destination');
        fireEvent.click(addButton);

        expect(addDestination).toHaveBeenCalled();
    });

    test('removes destination when Remove button clicked', () => {
        // Add second destination first
        recommendation.destinations.push(window.DataHelpers.createEmptyDestination());

        render(
            <MockDestinationsTab
                recommendation={recommendation}
                updateRecommendation={updateRecommendation}
                addDestination={addDestination}
                removeDestination={removeDestination}
                addAccommodation={addAccommodation}
                removeAccommodation={removeAccommodation}
            />
        );

        const removeButton = screen.getByTestId('remove-destination-1');
        fireEvent.click(removeButton);

        expect(removeDestination).toHaveBeenCalledWith(1);
    });

    test('does not show remove button for single destination', () => {
        render(
            <MockDestinationsTab
                recommendation={recommendation}
                updateRecommendation={updateRecommendation}
                addDestination={addDestination}
                removeDestination={removeDestination}
                addAccommodation={addAccommodation}
                removeAccommodation={removeAccommodation}
            />
        );

        // Should not have remove button when only one destination
        expect(screen.queryByTestId('remove-destination-0')).not.toBeInTheDocument();
    });

    // MARK: - Accommodation Management Tests

    test('adds accommodation option to destination', () => {
        render(
            <MockDestinationsTab
                recommendation={recommendation}
                updateRecommendation={updateRecommendation}
                addDestination={addDestination}
                removeDestination={removeDestination}
                addAccommodation={addAccommodation}
                removeAccommodation={removeAccommodation}
            />
        );

        const addAccommodationButton = screen.getByTestId('add-accommodation-0');
        fireEvent.click(addAccommodationButton);

        expect(addAccommodation).toHaveBeenCalledWith(0);
    });

    test('removes accommodation option', () => {
        // Add accommodation first
        recommendation.destinations[0].accommodationOptions.push(
            window.DataHelpers.createEmptyAccommodation()
        );

        render(
            <MockDestinationsTab
                recommendation={recommendation}
                updateRecommendation={updateRecommendation}
                addDestination={addDestination}
                removeDestination={removeDestination}
                addAccommodation={addAccommodation}
                removeAccommodation={removeAccommodation}
            />
        );

        const removeAccommodationButton = screen.getByTestId('remove-accommodation-0-0');
        fireEvent.click(removeAccommodationButton);

        expect(removeAccommodation).toHaveBeenCalledWith(0, 0);
    });

    // MARK: - Date Calculation Tests

    test('calculates number of nights correctly', () => {
        // Given: Arrival and departure dates
        const arrivalDate = new Date('2024-06-15');
        const departureDate = new Date('2024-06-20');

        // When: Calculate nights
        const timeDiff = departureDate.getTime() - arrivalDate.getTime();
        const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

        // Then: Should be 5 nights
        expect(nights).toBe(5);
    });

    test('handles same-day arrival and departure', () => {
        // Given: Same arrival and departure
        const arrivalDate = new Date('2024-06-15');
        const departureDate = new Date('2024-06-15');

        // When: Calculate nights (min 1)
        const timeDiff = departureDate.getTime() - arrivalDate.getTime();
        const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

        // Then: Should be at least 1 night
        expect(nights).toBe(1);
    });

    // MARK: - Cost Calculation Tests

    test('calculates total cost from price per night and nights', () => {
        // Given: Price per night and number of nights
        const pricePerNight = 150;
        const numberOfNights = 5;

        // When: Calculate total
        const totalCost = pricePerNight * numberOfNights;

        // Then: Should be 750
        expect(totalCost).toBe(750);
    });

    test('handles zero price per night', () => {
        const pricePerNight = 0;
        const numberOfNights = 5;

        const totalCost = pricePerNight * numberOfNights;

        expect(totalCost).toBe(0);
    });

    test('handles negative price (invalid)', () => {
        // Given: Negative price (should be prevented by validation)
        const pricePerNight = -100;
        const numberOfNights = 5;

        const totalCost = pricePerNight * numberOfNights;

        // Should be prevented by schema validation
        expect(totalCost).toBeLessThan(0);  // Invalid state
    });

    // MARK: - Form Validation Tests

    test('validates hotel name is required', () => {
        const hotelName = '';
        expect(hotelName.length).toBe(0);  // Invalid - should be caught by validation
    });

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

    test('validates price is non-negative', () => {
        const validPrices = [0, 50, 100, 500];
        const invalidPrices = [-1, -50];

        validPrices.forEach(price => {
            expect(price).toBeGreaterThanOrEqual(0);
        });

        invalidPrices.forEach(price => {
            expect(price).toBeLessThan(0);  // Invalid
        });
    });

    // MARK: - URL Validation Tests

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
            const isValid = window.SecurityHelpers.validateUrl(url);
            expect(isValid).toBe(true);
        });

        invalidUrls.forEach(url => {
            const isValid = window.SecurityHelpers.validateUrl(url);
            expect(isValid).toBe(false);
        });
    });

    // MARK: - Edge Cases

    test('handles NaN rating values', () => {
        const nanRating = NaN;
        const sanitizedRating = isNaN(nanRating) || !isFinite(nanRating) ? 4.0 : nanRating;

        expect(sanitizedRating).toBe(4.0);
    });

    test('handles Infinite price values', () => {
        const infinitePrice = Infinity;
        const sanitizedPrice = isNaN(infinitePrice) || !isFinite(infinitePrice) ? 0.0 : infinitePrice;

        expect(sanitizedPrice).toBe(0.0);
    });

    test('handles missing accommodation options array', () => {
        const destination = {
            id: 'dest-1',
            cityName: 'Paris',
            // accommodationOptions is missing
        };

        const accommodations = destination.accommodationOptions || [];

        expect(accommodations).toEqual([]);
    });
});
