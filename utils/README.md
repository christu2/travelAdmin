# Utility Functions

This directory contains utility functions and helpers for the travel admin dashboard.

## Files

### `firebaseHelpers.js`
Firebase-related utility functions:
- User authentication helpers
- Firestore data fetching and updating
- Real-time listeners for trip updates

### `dataHelpers.js`
Data manipulation and formatting utilities:
- Date formatting functions
- Trip data transformations
- Cost calculation helpers
- ID generation functions

### `constants.js`
Application constants:
- Default values for forms
- Category options
- Priority levels
- Payment types

## Usage

Import utilities into components as needed:

```javascript
// In component files
const { formatDate, generateId } = window.DataHelpers;
const { fetchUserPoints, updateTrip } = window.FirebaseHelpers;
```

## Organization

Each utility file exposes functions via window globals for compatibility with the current script-based architecture.