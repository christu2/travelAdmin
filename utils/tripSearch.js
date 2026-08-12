/**
 * Trip Search and Filter Manager
 *
 * Provides search and filtering functionality for trip list
 *
 * Features:
 * - Search by: user name, email, destination, trip ID
 * - Filter by: status, date range, budget
 * - Sort by: newest, oldest, budget, number of destinations
 */

window.TripSearchManager = (function() {
    /**
     * Search trips by query string
     */
    function searchTrips(trips, query) {
        if (!query || query.trim() === '') {
            return trips;
        }

        const searchTerm = query.toLowerCase().trim();

        return trips.filter(trip => {
            // Search in user information
            const userName = (trip.userName || '').toLowerCase();
            const userEmail = (trip.userEmail || trip.email || '').toLowerCase();

            // Search in trip ID
            const tripId = (trip.id || '').toLowerCase();

            // Search in destinations
            const destinations = trip.destinations || [];
            const destinationString = Array.isArray(destinations)
                ? destinations.join(' ').toLowerCase()
                : (destinations || '').toLowerCase();

            // Search in single destination field (legacy)
            const destination = (trip.destination || '').toLowerCase();

            // Search in budget
            const budget = (trip.budget || '').toLowerCase();

            // Search in travel style
            const travelStyle = (trip.travelStyle || '').toLowerCase();

            // Check all fields
            return userName.includes(searchTerm) ||
                   userEmail.includes(searchTerm) ||
                   tripId.includes(searchTerm) ||
                   destinationString.includes(searchTerm) ||
                   destination.includes(searchTerm) ||
                   budget.includes(searchTerm) ||
                   travelStyle.includes(searchTerm);
        });
    }

    /**
     * Filter trips by status
     */
    function filterByStatus(trips, status) {
        if (!status || status === 'all') {
            return trips;
        }

        return trips.filter(trip => {
            const tripStatus = (trip.status || 'pending').toLowerCase();
            return tripStatus === status.toLowerCase();
        });
    }

    /**
     * Filter trips by date range
     */
    function filterByDateRange(trips, startDate, endDate) {
        if (!startDate && !endDate) {
            return trips;
        }

        return trips.filter(trip => {
            const createdAt = trip.createdAt;
            if (!createdAt) return false;

            // Convert Firestore timestamp to Date
            let tripDate;
            if (createdAt.toDate) {
                tripDate = createdAt.toDate();
            } else if (createdAt.seconds) {
                tripDate = new Date(createdAt.seconds * 1000);
            } else {
                tripDate = new Date(createdAt);
            }

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && end) {
                return tripDate >= start && tripDate <= end;
            } else if (start) {
                return tripDate >= start;
            } else if (end) {
                return tripDate <= end;
            }

            return true;
        });
    }

    /**
     * Filter trips by budget range
     */
    function filterByBudget(trips, minBudget, maxBudget) {
        if (!minBudget && !maxBudget) {
            return trips;
        }

        return trips.filter(trip => {
            const budget = parseBudget(trip.budget);
            if (budget === null) return false;

            if (minBudget !== null && maxBudget !== null) {
                return budget >= minBudget && budget <= maxBudget;
            } else if (minBudget !== null) {
                return budget >= minBudget;
            } else if (maxBudget !== null) {
                return budget <= maxBudget;
            }

            return true;
        });
    }

    /**
     * Parse budget string to number
     */
    function parseBudget(budgetStr) {
        if (!budgetStr) return null;

        // Handle enum values
        const budgetMap = {
            'budget': 1000,
            'comfortable': 3000,
            'mid-range': 5000,
            'luxury': 10000,
            'ultra-luxury': 20000
        };

        const lower = budgetStr.toLowerCase();
        if (budgetMap[lower]) {
            return budgetMap[lower];
        }

        // Try to parse as number
        const num = parseFloat(budgetStr.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? null : num;
    }

    /**
     * Sort trips
     */
    function sortTrips(trips, sortBy) {
        const sorted = [...trips]; // Create copy to avoid mutation

        switch (sortBy) {
            case 'newest':
                sorted.sort((a, b) => compareDates(b.createdAt, a.createdAt));
                break;

            case 'oldest':
                sorted.sort((a, b) => compareDates(a.createdAt, b.createdAt));
                break;

            case 'budget-high':
                sorted.sort((a, b) => {
                    const budgetA = parseBudget(a.budget) || 0;
                    const budgetB = parseBudget(b.budget) || 0;
                    return budgetB - budgetA;
                });
                break;

            case 'budget-low':
                sorted.sort((a, b) => {
                    const budgetA = parseBudget(a.budget) || 0;
                    const budgetB = parseBudget(b.budget) || 0;
                    return budgetA - budgetB;
                });
                break;

            case 'destinations':
                sorted.sort((a, b) => {
                    const destA = getDestinationCount(a);
                    const destB = getDestinationCount(b);
                    return destB - destA;
                });
                break;

            case 'user':
                sorted.sort((a, b) => {
                    const nameA = (a.userName || a.userEmail || '').toLowerCase();
                    const nameB = (b.userName || b.userEmail || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                break;

            default:
                // Default: newest first
                sorted.sort((a, b) => compareDates(b.createdAt, a.createdAt));
        }

        return sorted;
    }

    /**
     * Compare two Firestore timestamps
     */
    function compareDates(dateA, dateB) {
        const timeA = getTimestamp(dateA);
        const timeB = getTimestamp(dateB);
        return timeA - timeB;
    }

    /**
     * Get timestamp from various date formats
     */
    function getTimestamp(date) {
        if (!date) return 0;

        if (date.toDate) {
            return date.toDate().getTime();
        } else if (date.seconds) {
            return date.seconds * 1000;
        } else if (date instanceof Date) {
            return date.getTime();
        } else {
            return new Date(date).getTime();
        }
    }

    /**
     * Get destination count from trip
     */
    function getDestinationCount(trip) {
        if (trip.destinations && Array.isArray(trip.destinations)) {
            return trip.destinations.length;
        } else if (trip.destination) {
            return 1;
        }
        return 0;
    }

    /**
     * Apply all filters and search
     */
    function applyFilters(trips, filters) {
        let filtered = trips;

        // Apply search
        if (filters.searchQuery) {
            filtered = searchTrips(filtered, filters.searchQuery);
        }

        // Apply status filter
        if (filters.status) {
            filtered = filterByStatus(filtered, filters.status);
        }

        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            filtered = filterByDateRange(filtered, filters.startDate, filters.endDate);
        }

        // Apply budget filter
        if (filters.minBudget || filters.maxBudget) {
            filtered = filterByBudget(filtered, filters.minBudget, filters.maxBudget);
        }

        // Apply sort
        if (filters.sortBy) {
            filtered = sortTrips(filtered, filters.sortBy);
        }

        return filtered;
    }

    /**
     * Get filter statistics
     */
    function getFilterStats(trips) {
        const stats = {
            total: trips.length,
            byStatus: {},
            byBudget: {},
            byDestinationCount: {}
        };

        trips.forEach(trip => {
            // Count by status
            const status = (trip.status || 'pending').toLowerCase();
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // Count by budget
            const budget = (trip.budget || 'unknown').toLowerCase();
            stats.byBudget[budget] = (stats.byBudget[budget] || 0) + 1;

            // Count by destination count
            const destCount = getDestinationCount(trip);
            const countKey = destCount === 1 ? '1' : destCount === 2 ? '2' : '3+';
            stats.byDestinationCount[countKey] = (stats.byDestinationCount[countKey] || 0) + 1;
        });

        return stats;
    }

    // Public API
    return {
        searchTrips,
        filterByStatus,
        filterByDateRange,
        filterByBudget,
        sortTrips,
        applyFilters,
        getFilterStats
    };
})();

console.log('✅ TripSearchManager loaded');
