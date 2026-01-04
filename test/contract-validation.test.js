/**
 * Contract Tests: Admin Dashboard Schema Validation
 *
 * These tests ensure the Admin Dashboard's constants stay compatible with Backend.
 * If these tests fail, it means a schema change has broken the contract.
 */

const { constants } = require('@wandermint/shared-schemas');
const {
  BUDGET_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  isValidBudget,
  isValidTravelStyle,
  validateBudgetValue,
  validateTravelStyleValue
} = require('../src/types/budget-constants.js');

describe('Admin Contract: Budget Constants', () => {
  test('Admin BUDGET_OPTIONS match shared-schemas constants', () => {
    const adminBudgetValues = BUDGET_OPTIONS.map(opt => opt.value);
    expect(adminBudgetValues).toEqual(constants.BUDGET_VALUES);
  });

  test('Admin has all 5 budget options', () => {
    expect(BUDGET_OPTIONS).toHaveLength(5);
    expect(BUDGET_OPTIONS.map(opt => opt.value)).toEqual([
      'Budget',
      'Comfortable',
      'Mid-range',
      'Luxury',
      'Ultra-Luxury'
    ]);
  });

  test('Admin can validate all valid budget values', () => {
    constants.BUDGET_VALUES.forEach(value => {
      expect(isValidBudget(value)).toBe(true);
      expect(validateBudgetValue(value).valid).toBe(true);
    });
  });

  test('Admin rejects invalid budget values', () => {
    expect(isValidBudget('$1500')).toBe(false);
    expect(isValidBudget('Adventure')).toBe(false);
    expect(isValidBudget('Invalid')).toBe(false);
  });

  test('Admin validateBudgetValue rejects travelStyle-only values', () => {
    const result = validateBudgetValue('Adventure');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('only valid for Travel Style');
  });
});

describe('Admin Contract: TravelStyle Constants', () => {
  test('Admin TRAVEL_STYLE_OPTIONS match shared-schemas constants', () => {
    const adminTravelStyleValues = TRAVEL_STYLE_OPTIONS.map(opt => opt.value);
    expect(adminTravelStyleValues).toEqual(constants.TRAVEL_STYLE_VALUES);
  });

  test('Admin has all 5 travelStyle options', () => {
    expect(TRAVEL_STYLE_OPTIONS).toHaveLength(5);
    expect(TRAVEL_STYLE_OPTIONS.map(opt => opt.value)).toEqual([
      'Budget',
      'Comfortable',
      'Luxury',
      'Adventure',
      'Relaxation'
    ]);
  });

  test('Admin can validate all valid travelStyle values', () => {
    constants.TRAVEL_STYLE_VALUES.forEach(value => {
      expect(isValidTravelStyle(value)).toBe(true);
      expect(validateTravelStyleValue(value).valid).toBe(true);
    });
  });

  test('Admin rejects invalid travelStyle values', () => {
    expect(isValidTravelStyle('Mid-range')).toBe(false);
    expect(isValidTravelStyle('Ultra-Luxury')).toBe(false);
    expect(isValidTravelStyle('Invalid')).toBe(false);
  });

  test('Admin validateTravelStyleValue rejects budget-only values', () => {
    const result = validateTravelStyleValue('Mid-range');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('only valid for Budget');
  });
});

describe('Admin Contract: Enum Separation', () => {
  test('Budget-only values are not in TravelStyle', () => {
    const budgetOnlyValues = ['Mid-range', 'Ultra-Luxury'];
    const travelStyleValues = TRAVEL_STYLE_OPTIONS.map(opt => opt.value);

    budgetOnlyValues.forEach(value => {
      expect(travelStyleValues).not.toContain(value);
    });
  });

  test('TravelStyle-only values are not in Budget', () => {
    const travelStyleOnlyValues = ['Adventure', 'Relaxation'];
    const budgetValues = BUDGET_OPTIONS.map(opt => opt.value);

    travelStyleOnlyValues.forEach(value => {
      expect(budgetValues).not.toContain(value);
    });
  });

  test('Shared values exist in both Budget and TravelStyle', () => {
    const sharedValues = ['Budget', 'Comfortable', 'Luxury'];
    const budgetValues = BUDGET_OPTIONS.map(opt => opt.value);
    const travelStyleValues = TRAVEL_STYLE_OPTIONS.map(opt => opt.value);

    sharedValues.forEach(value => {
      expect(budgetValues).toContain(value);
      expect(travelStyleValues).toContain(value);
    });
  });
});
