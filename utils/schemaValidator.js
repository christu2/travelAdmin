/**
 * Schema Validator Utility
 * 
 * Validates recommendation data against the shared schema before saving.
 * This ensures data integrity and catches schema mismatches early.
 * 
 * NOTE: This is a client-side validation that mirrors the backend schema.
 * For full validation, the backend always validates on save.
 */

window.SchemaValidator = (function() {
    // Schema version for tracking
    const CURRENT_SCHEMA_VERSION = '2.0.0';
    
    /**
     * Validates a recommendation object against the expected schema
     * @param {Object} recommendation - The recommendation to validate
     * @returns {Object} { valid: boolean, errors: Array }
     */
    function validateRecommendation(recommendation) {
        const errors = [];
        
        if (!recommendation) {
            return { valid: false, errors: [{ field: 'root', message: 'Recommendation is null or undefined' }] };
        }
        
        // Check required root fields
        const requiredRootFields = ['id', 'tripOverview', 'destinations', 'logistics', 'totalCost'];
        for (const field of requiredRootFields) {
            if (!(field in recommendation)) {
                errors.push({ field, message: `Missing required field: ${field}` });
            }
        }
        
        // Validate destinations array
        if (recommendation.destinations) {
            if (!Array.isArray(recommendation.destinations)) {
                errors.push({ field: 'destinations', message: 'destinations must be an array' });
            } else if (recommendation.destinations.length === 0) {
                errors.push({ field: 'destinations', message: 'destinations array cannot be empty' });
            } else {
                recommendation.destinations.forEach((dest, index) => {
                    const destErrors = validateDestination(dest, index);
                    errors.push(...destErrors);
                });
            }
        }
        
        // Validate logistics
        if (recommendation.logistics) {
            const logisticsErrors = validateLogistics(recommendation.logistics);
            errors.push(...logisticsErrors);
        }
        
        // Validate totalCost
        if (recommendation.totalCost) {
            const costErrors = validateTotalCost(recommendation.totalCost);
            errors.push(...costErrors);
        }
        
        // Check schema version (warn if mismatch)
        if (recommendation._schemaVersion && recommendation._schemaVersion !== CURRENT_SCHEMA_VERSION) {
            console.warn(`Schema version mismatch: expected ${CURRENT_SCHEMA_VERSION}, got ${recommendation._schemaVersion}`);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Validates a destination object
     */
    function validateDestination(dest, index) {
        const errors = [];
        const prefix = `destinations[${index}]`;
        
        const requiredFields = ['id', 'cityName', 'arrivalDate', 'departureDate', 'numberOfNights'];
        for (const field of requiredFields) {
            if (!(field in dest)) {
                errors.push({ field: `${prefix}.${field}`, message: `Missing required field: ${field}` });
            }
        }
        
        // Validate accommodation options if present
        if (dest.accommodationOptions && Array.isArray(dest.accommodationOptions)) {
            dest.accommodationOptions.forEach((option, optIndex) => {
                if (!option.id) {
                    errors.push({ field: `${prefix}.accommodationOptions[${optIndex}].id`, message: 'Missing accommodation option id' });
                }
                if (option.hotel) {
                    const hotelRequired = ['name', 'rating', 'pricePerNight', 'location', 'bookingUrl'];
                    for (const field of hotelRequired) {
                        if (!(field in option.hotel)) {
                            errors.push({ field: `${prefix}.accommodationOptions[${optIndex}].hotel.${field}`, message: `Missing required hotel field: ${field}` });
                        }
                    }
                }
            });
        }
        
        return errors;
    }
    
    /**
     * Validates logistics object
     */
    function validateLogistics(logistics) {
        const errors = [];
        
        if (!logistics.transportSegments) {
            errors.push({ field: 'logistics.transportSegments', message: 'Missing required field: transportSegments' });
        } else if (!Array.isArray(logistics.transportSegments)) {
            errors.push({ field: 'logistics.transportSegments', message: 'transportSegments must be an array' });
        }
        
        return errors;
    }
    
    /**
     * Validates totalCost object
     */
    function validateTotalCost(totalCost) {
        const errors = [];
        
        const requiredFields = ['totalEstimate', 'flights', 'accommodation', 'activities', 'food', 'localTransport', 'miscellaneous', 'currency'];
        for (const field of requiredFields) {
            if (!(field in totalCost)) {
                errors.push({ field: `totalCost.${field}`, message: `Missing required field: ${field}` });
            }
        }
        
        // Validate currency format (ISO 4217)
        if (totalCost.currency && !/^[A-Z]{3}$/.test(totalCost.currency)) {
            errors.push({ field: 'totalCost.currency', message: 'Currency must be 3-letter ISO 4217 code (e.g., USD, EUR)' });
        }
        
        return errors;
    }
    
    /**
     * Quick validation check for common issues
     */
    function quickValidate(recommendation) {
        const issues = [];
        
        if (!recommendation.logistics?.transportSegments?.length) {
            issues.push('No transport segments defined');
        }
        
        if (!recommendation.destinations?.length) {
            issues.push('No destinations defined');
        } else {
            recommendation.destinations.forEach((dest, i) => {
                if (!dest.accommodationOptions?.length) {
                    issues.push(`Destination ${i + 1} (${dest.cityName}) has no accommodation options`);
                }
            });
        }
        
        if (recommendation.totalCost?.totalEstimate === 0) {
            issues.push('Total cost is zero - costs may not be calculated');
        }
        
        return issues;
    }
    
    // Public API
    return {
        validateRecommendation,
        quickValidate,
        CURRENT_SCHEMA_VERSION,
        
        // Convenience method for checking if data is valid (returns boolean)
        isValid(recommendation) {
            return validateRecommendation(recommendation).valid;
        }
    };
})();

console.log('✅ SchemaValidator loaded - Schema Version:', window.SchemaValidator.CURRENT_SCHEMA_VERSION);
