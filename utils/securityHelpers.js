/**
 * Security Helper Functions
 * 
 * Provides secure utilities for input validation, sanitization, and authorization
 */

window.SecurityHelpers = {
    
    /**
     * Sanitize user input to prevent XSS attacks
     * @param {string} input - The input string to sanitize
     * @returns {string} - Sanitized string
     */
    sanitizeInput: function(input) {
        if (typeof input !== 'string') return '';
        
        // Remove HTML tags and encode special characters
        return input
            .replace(/[<>'"&]/g, function(char) {
                const entityMap = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;',
                    '&': '&amp;'
                };
                return entityMap[char];
            })
            .trim();
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid email format
     */
    validateEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Check if user has admin privileges
     * @param {Object} user - Firebase user object
     * @returns {boolean} - True if user is authorized admin
     */
    isAuthorizedAdmin: function(user) {
        if (!user || !user.email) return false;
        
        // Define authorized admin emails
        const authorizedAdmins = [
            'nchristus93@gmail.com'
            // Add more admin emails here as needed
        ];
        
        return authorizedAdmins.includes(user.email.toLowerCase());
    },

    /**
     * Validate and sanitize trip data
     * @param {Object} tripData - Trip data to validate
     * @returns {Object} - Sanitized trip data or null if invalid
     */
    validateTripData: function(tripData) {
        if (!tripData || typeof tripData !== 'object') return null;
        
        const sanitized = {};
        
        // Sanitize string fields
        const stringFields = ['destination', 'budget', 'travelStyle', 'flightClass', 'additionalNotes'];
        stringFields.forEach(field => {
            if (tripData[field]) {
                sanitized[field] = this.sanitizeInput(tripData[field]);
            }
        });
        
        // Validate dates
        if (tripData.startDate) {
            const startDate = new Date(tripData.startDate);
            if (!isNaN(startDate.getTime())) {
                sanitized.startDate = startDate.toISOString();
            }
        }
        
        if (tripData.endDate) {
            const endDate = new Date(tripData.endDate);
            if (!isNaN(endDate.getTime())) {
                sanitized.endDate = endDate.toISOString();
            }
        }
        
        // Validate numeric fields
        if (tripData.groupSize && !isNaN(tripData.groupSize)) {
            sanitized.groupSize = Math.max(1, parseInt(tripData.groupSize));
        }
        
        // Sanitize arrays
        if (Array.isArray(tripData.destinations)) {
            sanitized.destinations = tripData.destinations
                .map(dest => this.sanitizeInput(dest))
                .filter(dest => dest.length > 0);
        }
        
        if (Array.isArray(tripData.interests)) {
            sanitized.interests = tripData.interests
                .map(interest => this.sanitizeInput(interest))
                .filter(interest => interest.length > 0);
        }
        
        return sanitized;
    },

    /**
     * Generate secure random ID
     * @returns {string} - Random ID string
     */
    generateSecureId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Validate URL to prevent SSRF attacks
     * @param {string} url - URL to validate
     * @returns {boolean} - True if URL is safe
     */
    validateUrl: function(url) {
        if (!url || typeof url !== 'string') return false;
        
        try {
            const urlObj = new URL(url);
            
            // Only allow HTTPS in production
            if (window.location.protocol === 'https:' && urlObj.protocol !== 'https:') {
                return false;
            }
            
            // Block internal network addresses
            const hostname = urlObj.hostname.toLowerCase();
            const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
            const isInternalNetwork = blockedHosts.includes(hostname) ||
                hostname.startsWith('192.168.') ||
                hostname.startsWith('10.') ||
                hostname.startsWith('172.');
            
            // Allow localhost only in development
            if (isInternalNetwork && window.location.protocol === 'https:') {
                return false;
            }
            
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Rate limiting for API calls (simple implementation)
     */
    rateLimiter: {
        calls: new Map(),
        
        isAllowed: function(key, maxCalls = 10, windowMs = 60000) {
            const now = Date.now();
            const windowStart = now - windowMs;
            
            if (!this.calls.has(key)) {
                this.calls.set(key, []);
            }
            
            const userCalls = this.calls.get(key);
            
            // Remove old calls outside the window
            const recentCalls = userCalls.filter(timestamp => timestamp > windowStart);
            this.calls.set(key, recentCalls);
            
            if (recentCalls.length >= maxCalls) {
                return false;
            }
            
            recentCalls.push(now);
            return true;
        }
    }
};

console.log('✅ SecurityHelpers loaded');