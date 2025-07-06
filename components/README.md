# Dashboard Components

This directory contains modular React components for the travel admin dashboard.

## Component Structure

### Core Components
- `UserPointsDisplay.js` - Displays user's points across all programs
- `TripsList.js` - Lists all trips in card format
- `TripDetailView.js` - Shows detailed trip information and intake form data
- `TripCard.js` - Individual trip card component

### Tab Components
- `ActivitiesTab.js` - Destination-based activity and restaurant recommendations
- `DestinationsTab.js` - Multi-destination management with hotels
- `LogisticsTab.js` - Transportation planning between destinations
- `CostsTab.js` - Cost calculation and breakdown
- `OverviewTab.js` - Trip overview and summary

### Utility Components
- `TabNavigation.js` - Tab switching interface
- `LoadingSpinner.js` - Loading indicators

## Usage

Each component is designed to be imported into the main template:

```html
<script src="components/UserPointsDisplay.js"></script>
<script src="components/TripsList.js"></script>
<!-- etc -->
```

## Data Flow

Components receive props from the main Dashboard component:
- `currentUser` - Current authenticated user
- `recommendation` - Trip recommendation data
- `updateRecommendation` - Function to update recommendation
- Event handlers for specific actions

## File Organization

Each component file includes:
1. Component definition
2. Required helper functions
3. Component-specific styles (if any)
4. JSDoc documentation