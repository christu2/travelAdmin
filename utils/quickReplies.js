/**
 * Quick Reply Templates Manager
 *
 * Provides pre-written message templates for common conversation responses
 *
 * Features:
 * - Built-in templates
 * - Custom templates (saved to localStorage)
 * - Template variables (userName, tripId, etc.)
 * - Quick insert functionality
 */

window.QuickRepliesManager = (function() {
    const CUSTOM_TEMPLATES_KEY = 'quick_reply_templates';

    // Built-in templates
    const builtInTemplates = [
        {
            id: 'greeting',
            name: 'Greeting',
            category: 'General',
            text: 'Hi {{userName}},\n\nThank you for submitting your trip request! I\'m reviewing your details and will have your personalized itinerary ready soon.',
            variables: ['userName']
        },
        {
            id: 'working',
            name: 'Working on Itinerary',
            category: 'Status',
            text: 'Thanks for your message. I\'m currently working on your itinerary and doing research on the best options for your trip to {{destinations}}. I\'ll have recommendations for you shortly!',
            variables: ['userName', 'destinations']
        },
        {
            id: 'ready',
            name: 'Trip Ready',
            category: 'Status',
            text: 'Great news! Your trip itinerary is ready. Check the WanderMint app to view your personalized recommendations for {{destinations}}. Let me know if you have any questions!',
            variables: ['destinations']
        },
        {
            id: 'updated',
            name: 'Itinerary Updated',
            category: 'Status',
            text: 'I\'ve updated your itinerary based on your feedback. The changes are now live in the app. Please review and let me know if you need any further adjustments.',
            variables: []
        },
        {
            id: 'research',
            name: 'Will Research',
            category: 'Response',
            text: 'That\'s a great question! Let me research that and get back to you with more information shortly.',
            variables: []
        },
        {
            id: 'clarification',
            name: 'Need Clarification',
            category: 'Response',
            text: 'Thanks for reaching out! To help you better, could you provide more details about {{topic}}? This will help me tailor the recommendations to your preferences.',
            variables: ['topic']
        },
        {
            id: 'hotel-question',
            name: 'Hotel Question',
            category: 'Specific',
            text: 'Regarding the hotel options in {{destination}}, I\'ve selected these based on your {{budget}} budget and {{travelStyle}} travel style. Each option has been chosen for {{reason}}. Would you like me to look for alternatives?',
            variables: ['destination', 'budget', 'travelStyle', 'reason']
        },
        {
            id: 'activity-question',
            name: 'Activity Question',
            category: 'Specific',
            text: 'I\'ve curated the activities based on your interests in {{interests}}. These recommendations are flexible - you can choose which ones fit your schedule. I\'ve marked the must-see attractions so you don\'t miss the highlights!',
            variables: ['interests']
        },
        {
            id: 'points-optimization',
            name: 'Points Usage',
            category: 'Specific',
            text: 'Based on your available points ({{pointsBreakdown}}), I\'ve optimized the bookings to maximize value. I recommend using points for {{pointsRecommendation}} and paying cash for {{cashRecommendation}}. This gives you the best overall value.',
            variables: ['pointsBreakdown', 'pointsRecommendation', 'cashRecommendation']
        },
        {
            id: 'availability-issue',
            name: 'Availability Issue',
            category: 'Problems',
            text: 'I wanted to let you know that {{item}} is currently showing limited availability for your dates. I\'ve included {{alternative}} as a backup option. Would you like me to check other alternatives?',
            variables: ['item', 'alternative']
        },
        {
            id: 'price-change',
            name: 'Price Change Alert',
            category: 'Problems',
            text: 'Quick update: I noticed the price for {{item}} has {{changeType}} since I initially checked. The new cost is {{newPrice}}. Would you like to proceed or explore alternatives?',
            variables: ['item', 'changeType', 'newPrice']
        },
        {
            id: 'thank-you',
            name: 'Thank You',
            category: 'General',
            text: 'Thank you for the feedback! I really appreciate you taking the time to share your thoughts. This helps me create even better recommendations for your trip.',
            variables: []
        },
        {
            id: 'closing',
            name: 'Closing',
            category: 'General',
            text: 'Have a wonderful trip! Feel free to reach out if you have any questions while traveling. Safe travels! ✈️',
            variables: []
        },
        {
            id: 'follow-up',
            name: 'Follow Up After Trip',
            category: 'General',
            text: 'Hi {{userName}},\n\nI hope you had an amazing trip to {{destinations}}! I\'d love to hear how everything went. Your feedback helps me improve recommendations for future travelers.',
            variables: ['userName', 'destinations']
        }
    ];

    /**
     * Get all templates (built-in + custom)
     */
    function getAllTemplates() {
        const customTemplates = getCustomTemplates();
        return [...builtInTemplates, ...customTemplates];
    }

    /**
     * Get templates by category
     */
    function getTemplatesByCategory() {
        const templates = getAllTemplates();
        const byCategory = {};

        templates.forEach(template => {
            const category = template.category || 'Other';
            if (!byCategory[category]) {
                byCategory[category] = [];
            }
            byCategory[category].push(template);
        });

        return byCategory;
    }

    /**
     * Get custom templates from localStorage
     */
    function getCustomTemplates() {
        try {
            const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading custom templates:', error);
            return [];
        }
    }

    /**
     * Save custom template
     */
    function saveCustomTemplate(template) {
        const customTemplates = getCustomTemplates();

        // Add ID if not present
        if (!template.id) {
            template.id = 'custom_' + Date.now();
        }

        // Check if updating existing
        const existingIndex = customTemplates.findIndex(t => t.id === template.id);
        if (existingIndex >= 0) {
            customTemplates[existingIndex] = template;
        } else {
            customTemplates.push(template);
        }

        localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
        return template;
    }

    /**
     * Delete custom template
     */
    function deleteCustomTemplate(templateId) {
        const customTemplates = getCustomTemplates();
        const filtered = customTemplates.filter(t => t.id !== templateId);
        localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
    }

    /**
     * Apply template variables
     */
    function applyVariables(templateText, variables) {
        let result = templateText;

        // Replace each variable
        Object.keys(variables).forEach(key => {
            const value = variables[key] || '';
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        });

        // Remove any unreplaced variables
        result = result.replace(/{{[^}]+}}/g, '[please fill in]');

        return result;
    }

    /**
     * Get template by ID
     */
    function getTemplateById(templateId) {
        const allTemplates = getAllTemplates();
        return allTemplates.find(t => t.id === templateId);
    }

    /**
     * Extract variables from trip data
     */
    function extractVariablesFromTrip(trip, currentUser) {
        const variables = {};

        // User information
        variables.userName = trip.userName ||
                            (trip.userEmail || trip.email || '').split('@')[0] ||
                            'there';

        // Destination(s)
        if (trip.destinations && Array.isArray(trip.destinations)) {
            variables.destinations = trip.destinations.join(', ');
        } else if (trip.destination) {
            variables.destinations = trip.destination;
        } else {
            variables.destinations = 'your destination';
        }

        // Trip details
        variables.tripId = trip.id;
        variables.budget = trip.budget || 'your budget';
        variables.travelStyle = trip.travelStyle || 'your travel style';
        variables.startDate = trip.startDate || '';
        variables.endDate = trip.endDate || '';

        // Interests
        if (trip.interests && Array.isArray(trip.interests)) {
            variables.interests = trip.interests.join(', ');
        } else {
            variables.interests = 'your interests';
        }

        // Group size
        variables.groupSize = trip.groupSize || 1;

        // Admin information
        if (currentUser) {
            variables.adminName = currentUser.displayName ||
                                 currentUser.email.split('@')[0];
        }

        return variables;
    }

    /**
     * Search templates
     */
    function searchTemplates(query) {
        if (!query) {
            return getAllTemplates();
        }

        const searchTerm = query.toLowerCase();
        return getAllTemplates().filter(template => {
            return template.name.toLowerCase().includes(searchTerm) ||
                   template.text.toLowerCase().includes(searchTerm) ||
                   (template.category || '').toLowerCase().includes(searchTerm);
        });
    }

    /**
     * Export templates
     */
    function exportTemplates() {
        const customTemplates = getCustomTemplates();
        const data = JSON.stringify(customTemplates, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quick-reply-templates-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import templates
     */
    function importTemplates(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            if (!Array.isArray(imported)) {
                throw new Error('Invalid template format');
            }

            const customTemplates = getCustomTemplates();

            // Add imported templates with unique IDs
            imported.forEach(template => {
                template.id = 'custom_' + Date.now() + '_' + Math.random();
                template.category = template.category || 'Imported';
                customTemplates.push(template);
            });

            localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
            return imported.length;
        } catch (error) {
            console.error('Error importing templates:', error);
            throw error;
        }
    }

    // Public API
    return {
        getAllTemplates,
        getTemplatesByCategory,
        getCustomTemplates,
        saveCustomTemplate,
        deleteCustomTemplate,
        getTemplateById,
        applyVariables,
        extractVariablesFromTrip,
        searchTemplates,
        exportTemplates,
        importTemplates
    };
})();

console.log('✅ QuickRepliesManager loaded');
