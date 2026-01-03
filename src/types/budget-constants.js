/**
 * Budget and TravelStyle constants for Admin Dashboard
 *
 * IMPORTANT: These values are derived from shared-schemas/
 * They match the TypeScript types in schemas.ts
 *
 * Single source of truth ensures iOS, Backend, and Admin all use the same values.
 */

// Budget enum values (from budget.schema.json)
export const BUDGET_OPTIONS = [
  { value: 'Budget', label: 'Budget', description: 'Budget-conscious accommodations and activities' },
  { value: 'Comfortable', label: 'Comfortable', description: 'Moderate comfort with good value' },
  { value: 'Mid-range', label: 'Mid-range', description: 'Mid-range pricing tier' },
  { value: 'Luxury', label: 'Luxury', description: 'High-end experiences and premium services' },
  { value: 'Ultra-Luxury', label: 'Ultra-Luxury', description: 'Top-tier luxury accommodations' }
];

// TravelStyle enum values (from travel-style.schema.json)
export const TRAVEL_STYLE_OPTIONS = [
  { value: 'Budget', label: 'Budget', description: 'Budget-conscious travel style' },
  { value: 'Comfortable', label: 'Comfortable', description: 'Moderate comfort with good value' },
  { value: 'Luxury', label: 'Luxury', description: 'High-end experiences' },
  { value: 'Adventure', label: 'Adventure', description: 'Active, fast-paced, outdoor/adventure-focused' },
  { value: 'Relaxation', label: 'Relaxation', description: 'Slow-paced, restful, spa/beach-focused' }
];

// Validation helpers
export function isValidBudget(value) {
  return BUDGET_OPTIONS.some(opt => opt.value === value);
}

export function isValidTravelStyle(value) {
  return TRAVEL_STYLE_OPTIONS.some(opt => opt.value === value);
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
      error: `"${value}" is not a valid budget option. Use: ${BUDGET_OPTIONS.map(o => o.value).join(', ')}`
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
      error: `"${value}" is not a valid travel style. Use: ${TRAVEL_STYLE_OPTIONS.map(o => o.value).join(', ')}`
    };
  }

  return { valid: true };
}
