# Location Verification

This document outlines the location verification system implemented in CampusFix (Day 10).

## Overview

To prevent fraudulent complaints, students must verify that they are physically near the campus location they are selecting when creating a complaint. 

Frontend verification is only a user experience step. The backend performs the authoritative verification before creating a complaint.

## Process Flow

1. **Frontend GPS Collection:** When a student selects a location, they are prompted to "Verify My Location". The frontend uses `navigator.geolocation.getCurrentPosition()` to obtain the student's coordinates.
2. **Backend Verification:** The frontend sends the `locationId`, `latitude`, and `longitude` to the `POST /api/locations/verify` endpoint. 
3. **Distance Calculation:** The backend retrieves the selected location and calculates the distance using the **Haversine formula**.
4. **Allowed Radius Check:** The distance is compared to the location's `allowedRadius`. If `distance <= allowedRadius`, verification succeeds.
5. **Complaint Creation Security:** When submitting the complaint, the coordinates are sent again. The backend re-verifies the distance before saving the complaint to ensure security. The complaint is created with the student's verified `latitude` and `longitude`.

## Security Reason for Backend Verification

Never trust the client. A malicious client could send `{ verified: true }` without actually being near the location. By having the backend independently calculate the distance upon complaint creation, we ensure strict security.

## Haversine Distance Calculation

The `server/utils/distance.js` file exports a `calculateDistance` function. It calculates the great-circle distance between two points on a sphere given their longitudes and latitudes.

## Browser Permission Requirements

The student's browser must support geolocation, and the student must grant location permissions to the application. If denied, a friendly error message is shown, and the user cannot submit a complaint for that location.

## Development Placeholder Coordinates

Currently, the seeded coordinates in the MongoDB database are development placeholder coordinates.
Future updates will replace these with actual campus coordinates.
