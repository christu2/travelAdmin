// AUTO-GENERATED CODE - DO NOT EDIT MANUALLY
// Generated from: shared-schemas/schemas/core/*.schema.json
// Generation Date: 2026-01-03T02:33:39.232Z
// Generator: json-schema-to-typescript
//
// IMPORTANT: This file is auto-generated from shared schemas.
// To modify types, edit the source JSON schemas and regenerate.
//
// Available types:
//   - Budget (enum)
//   - TravelStyle (enum)
//   - TripSubmission (interface)
//   - TripRecommendation (interface)
//   - CommonTypes (utility types)
//
// To regenerate:
//   cd /Users/nick/Development/travelBusiness/shared-schemas
//   npm run generate:ts
//


// Budget
/**
 * Travel budget preference levels - determines accommodation and activity pricing tiers
 */
export type Budget = 'Budget' | 'Comfortable' | 'Mid-range' | 'Luxury' | 'Ultra-Luxury';


// TravelStyle
/**
 * Travel preference style or pace - defines the TYPE and PACE of travel, NOT the budget
 */
export type TravelStyle = 'Budget' | 'Comfortable' | 'Luxury' | 'Adventure' | 'Relaxation';


// TripSubmission
/**
 * Budget preference level (NOT a monetary amount)
 */
export type Budget = 'Budget' | 'Comfortable' | 'Mid-range' | 'Luxury' | 'Ultra-Luxury';
/**
 * Travel style preference (pace and type)
 */
export type TravelStyle = 'Budget' | 'Comfortable' | 'Luxury' | 'Adventure' | 'Relaxation';

/**
 * User trip submission from iOS app - sent to Backend submitTrip endpoint
 */
export interface TripSubmission {
  /**
   * Array of destination city names (1-5 destinations)
   *
   * @minItems 1
   * @maxItems 5
   */
  destinations:
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string];
  /**
   * City where user departs from
   */
  departureLocation?: string;
  /**
   * Trip start date
   */
  startDate: string;
  /**
   * Trip end date (must be after startDate)
   */
  endDate: string;
  /**
   * Whether dates are flexible
   */
  flexibleDates?: boolean;
  /**
   * Trip duration in days (for flexible dates)
   */
  tripDuration?: number;
  budget?: Budget;
  travelStyle: TravelStyle;
  /**
   * Number of travelers
   */
  groupSize: number;
  /**
   * User interests (e.g., Food, Culture, Hiking)
   *
   * @maxItems 20
   */
  interests?:
    | []
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ];
  /**
   * Special requests or notes
   */
  specialRequests?: string;
  /**
   * Preferred flight cabin class
   */
  flightClass?: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  /**
   * Payment preference
   */
  paymentMethod?: 'cash' | 'points' | 'hybrid';
  [k: string]: any | undefined;
}


// TripRecommendation
/**
 * Trip recommendation sent from Admin dashboard or Backend to iOS app
 */
export interface TripRecommendation {
  /**
   * Unique recommendation identifier
   */
  id: string;
  /**
   * Overall trip summary and highlights
   */
  tripOverview: string;
  /**
   * @minItems 1
   * @maxItems 5
   */
  destinations:
    | [
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        }
      ]
    | [
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        }
      ]
    | [
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        }
      ]
    | [
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        }
      ]
    | [
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        },
        {
          id: string;
          cityName: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          arrivalDate: string;
          /**
           * ISO 8601 date format (YYYY-MM-DD)
           */
          departureDate: string;
          numberOfNights: number;
          overview?: string;
          accommodationOptions?: {
            id: string;
            priority: number;
            hotel: {
              name: string;
              rating: number;
              pricePerNight?: number;
              pointsPerNight?: number;
              loyaltyProgram?: string;
              location: string;
              /**
               * HTTP or HTTPS URL
               */
              bookingUrl?: string;
              detailedDescription?: string;
              tripadvisorId?: string;
              /**
               * HTTP or HTTPS URL
               */
              tripadvisorUrl?: string;
              [k: string]: any | undefined;
            };
            [k: string]: any | undefined;
          }[];
          recommendedActivities?: {
            id: string;
            name: string;
            description: string;
            location: string;
            estimatedCost: number;
            estimatedDuration: string;
            category: string;
            [k: string]: any | undefined;
          }[];
          recommendedRestaurants?: {
            id: string;
            name: string;
            cuisine: string;
            location: string;
            priceRange: '$' | '$$' | '$$$' | '$$$$';
            description: string;
            [k: string]: any | undefined;
          }[];
          logistics?: {
            flights?: any[];
            trains?: any[];
            buses?: any[];
            ferries?: any[];
            carRentals?: any[];
            [k: string]: any | undefined;
          };
          [k: string]: any | undefined;
        }
      ];
  totalCost: {
    totalEstimate: number;
    flights?: number;
    accommodation?: number;
    activities?: number;
    food?: number;
    localTransport?: number;
    miscellaneous?: number;
    /**
     * ISO 4217 currency code (3 uppercase letters)
     */
    currency: string;
    [k: string]: any | undefined;
  };
  bookingLinks?: {
    /**
     * HTTP or HTTPS URL
     */
    flights?: string;
    hotels?: string[];
    [k: string]: any | undefined;
  };
  specialNotes?: string;
  [k: string]: any | undefined;
}


// CommonTypes
/**
 * Shared type definitions used across all WanderMint schemas
 */
export interface CommonTypes {
  [k: string]: any | undefined;
}

