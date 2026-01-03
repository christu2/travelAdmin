/**
 * Budget and TravelStyle constants for Admin Dashboard
 *
 * IMPORTANT: These values are imported from @wandermint/shared-schemas NPM package
 * Single source of truth ensures iOS, Backend, and Admin all use the same values.
 */

const { constants } = require('@wandermint/shared-schemas');

// Budget enum values (from budget.schema.json via NPM package)
export const BUDGET_OPTIONS = constants.BUDGET_VALUES.map(value => ({
  value,
  label: value,
  description: getBudgetDescription(value)
}));

// TravelStyle enum values (from travel-style.schema.json via NPM package)
export const TRAVEL_STYLE_OPTIONS = constants.TRAVEL_STYLE_VALUES.map(value => ({
  value,
  label: value,
  description: getTravelStyleDescription(value)
}));

// Helper functions to get descriptions
function getBudgetDescription(value) {
  const descriptions = {
    'Budget': 'Budget-conscious accommodations and activities',
    'Comfortable': 'Moderate comfort with good value',
    'Mid-range': 'Mid-range pricing tier',
    'Luxury': 'High-end experiences and premium services',
    'Ultra-Luxury': 'Top-tier luxury accommodations'
  };
  return descriptions[value] || '';
}

function getTravelStyleDescription(value) {
  const descriptions = {
    'Budget': 'Budget-conscious travel style',
    'Comfortable': 'Moderate comfort with good value',
    'Luxury': 'High-end experiences',
    'Adventure': 'Active, fast-paced, outdoor/adventure-focused',
    'Relaxation': 'Slow-paced, restful, spa/beach-focused'
  };
  return descriptions[value] || '';
}

// Validation helpers
export function isValidBudget(value) {
  return constants.BUDGET_VALUES.includes(value);
}

export function isValidTravelStyle(value) {
  return constants.TRAVEL_STYLE_VALUES.includes(value);
}

// Important distinctions
export const BUDGET_ONLY_VALUES = ['Mid-range', 'Ultra-Luxury'];
export const TRAVEL_STYLE_ONLY_VALUES = ['Adventure', 'Relaxation'];
export const SHARED_VALUES = ['Budget', 'Comfortable', 'Luxury'];

/**
 * Validate that a value is appropriate for its context
 */
export function validateBudgetValue(value) {
  if (!value) return { valid: true };

  if (TRAVEL_STYLE_ONLY_VALUES.includes(value)) {
    return {
      valid: false,
      error: `"${value}" is only valid for Travel Style, not Budget`
    };
  }

  if (!isValidBudget(value)) {
    return {
      valid: false,
      error: `"${value}" is not a valid budget option. Use: ${constants.BUDGET_VALUES.join(', ')}`
    };
  }

  return { valid: true };
}

export function validateTravelStyleValue(value) {
  if (!value) return { valid: true };

  if (BUDGET_ONLY_VALUES.includes(value)) {
    return {
      valid: false,
      error: `"${value}" is only valid for Budget, not Travel Style`
    };
  }

  if (!isValidTravelStyle(value)) {
    return {
      valid: false,
      error: `"${value}" is not a valid travel style. Use: ${constants.TRAVEL_STYLE_VALUES.join(', ')}`
    };
  }

  return { valid: true };
}
