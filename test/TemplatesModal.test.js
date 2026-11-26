const TemplateHelpers = require('../components/TemplatesModal');

describe('Saved Destination Templates Helpers', () => {
    const sampleRec = {
        tripOverview: 'Walkable downtown Madison getaway on Hyatt points.',
        costNotes: 'Transfer 36,000 Chase UR 1:1 to World of Hyatt.',
        destinations: [
            {
                id: 'dest_old_1',
                cityName: 'Madison, WI',
                arrivalDate: '2026-11-15',
                departureDate: '2026-11-18',
                numberOfNights: 3,
                accommodationOptions: [
                    { id: 'acc_old_1', priority: 1, isBooked: true, hotel: { name: 'Hyatt Place Madison', pointsPerNight: 12000 } }
                ],
                recommendedActivities: [
                    { id: 'act_old_1', name: 'Wisconsin State Capitol' }
                ],
                recommendedRestaurants: [
                    { id: 'rest_old_1', name: 'The Old Fashioned' }
                ]
            }
        ],
        logistics: { transportSegments: [], generalInstructions: 'Driveable', bookingDeadlines: [] },
        totalCost: { totalEstimate: 0, currency: 'USD', pointsUsed: { 'World of Hyatt': 36000 } }
    };

    test('buildTemplateFromRecommendation extracts clean summary, tags, and deep copy', () => {
        const tpl = TemplateHelpers.buildTemplateFromRecommendation({
            name: 'Madison Hyatt Weekend',
            tags: 'Hyatt, Weekend, Driveable',
            recommendation: sampleRec,
            createdBy: 'nchristus93@gmail.com'
        });

        expect(tpl.name).toBe('Madison Hyatt Weekend');
        expect(tpl.tags).toEqual(['Hyatt', 'Weekend', 'Driveable']);
        expect(tpl.cityNames).toEqual(['Madison, WI']);
        expect(tpl.summary).toEqual({ destinations: 1, hotels: 1, activities: 1, dining: 1 });
        expect(tpl.recommendation.costNotes).toContain('36,000 Chase UR');
    });

    test('applyTemplateToTrip remaps dates to new client trip, resets booking flags, and mints fresh IDs', () => {
        const tpl = TemplateHelpers.buildTemplateFromRecommendation({
            name: 'Madison Hyatt Weekend',
            recommendation: sampleRec
        });

        const newClientTrip = {
            id: 'trip_client_999',
            startDate: '2027-04-10',
            endDate: '2027-04-14'
        };

        const applied = TemplateHelpers.applyTemplateToTrip(tpl, newClientTrip);

        expect(applied.id).toBe('trip_client_999');
        expect(applied.destinations).toHaveLength(1);
        expect(applied.destinations[0].id).not.toBe('dest_old_1');
        expect(applied.destinations[0].arrivalDate).toBe('2027-04-10');
        expect(applied.destinations[0].departureDate).toBe('2027-04-14');
        expect(applied.destinations[0].numberOfNights).toBe(4);
        expect(applied.destinations[0].accommodationOptions[0].id).not.toBe('acc_old_1');
        expect(applied.destinations[0].accommodationOptions[0].isBooked).toBe(false);
        expect(applied.destinations[0].recommendedActivities[0].id).not.toBe('act_old_1');
        expect(applied.destinations[0].recommendedRestaurants[0].id).not.toBe('rest_old_1');
    });
});
