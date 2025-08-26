// sledzenie/app/api/track-location/route.js
// Or if your project root is 'sledzenie', then: app/api/track-location/route.js

// This object will hold our in-memory location data.
// It's outside the handler functions so it persists across requests
// for a single server instance.
const activeLocations = {}; // userId: { latitude, longitude, timestamp, isTracking }

// Cleanup mechanism: Remove inactive users after a certain period
const CLEANUP_INTERVAL_MS = 10 * 1000; // Check every 10 seconds
const INACTIVITY_TIMEOUT_MS = 180 * 1000; // Remove if inactive for 180 seconds (3 minutes)

// This interval runs on the server to clean up stale data
setInterval(() => {
  const now = Date.now();
  for (const userId in activeLocations) {
    if (Object.prototype.hasOwnProperty.call(activeLocations, userId)) {
      const locationData = activeLocations[userId];
      // Remove if not tracking AND last updated beyond timeout
      // OR if tracking but no update for a very long time (e.g., app closed without stopping)
      if ((!locationData.isTracking && (now - locationData.timestamp > INACTIVITY_TIMEOUT_MS)) ||
          (now - locationData.timestamp > INACTIVITY_TIMEOUT_MS * 5 && locationData.isTracking)) {
        console.log(`[Backend Cleanup] Removing inactive or stale user: ${userId}`);
        delete activeLocations[userId];
      }
    }
  }
}, CLEANUP_INTERVAL_MS);


// Handles POST requests for location updates from the tracking app
export async function POST(req) {
  try {
    const { userId, latitude, longitude, isTracking } = await req.json();

    if (!userId || latitude === undefined || longitude === undefined || isTracking === undefined) {
      return new Response(JSON.stringify({ message: 'Missing userId, latitude, longitude, or isTracking in request body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update or add the location to our in-memory store
    activeLocations[userId] = {
      latitude,
      longitude,
      timestamp: Date.now(), // Store timestamp as number for easier comparison
      isTracking
    };

    console.log(`[Backend POST] Received update for ${userId}: Lat ${latitude}, Lng ${longitude}, Tracking: ${isTracking}`);

    return new Response(JSON.stringify({ message: 'Location received successfully', data: activeLocations[userId] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Backend POST] Error processing location data:', error);
    let errorMessage = 'Internal server error.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ message: errorMessage, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handles GET requests to fetch all active locations for the dashboard
export async function GET() {
  try {
    const activeTrackers = Object.entries(activeLocations)
      .filter(([, data]) => data.isTracking) // Only return actively tracking users
      .map(([userId, data]) => ({ userId, ...data })); // Include userId in the object

    console.log(`[Backend GET] Dashboard requested all active locations. Found ${activeTrackers.length} active trackers.`);

    return new Response(JSON.stringify(activeTrackers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Backend GET] Error fetching all locations:', error);
    let errorMessage = 'Internal server error.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ message: errorMessage, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
