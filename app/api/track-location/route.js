// app/api/locations/route.js

// This object will hold our in-memory location data.
// It's outside the handler function so it persists across requests
// for a single server instance.
const activeLocations = {}; // userId: { latitude, longitude, timestamp, isTracking }

// Cleanup mechanism: Remove inactive users after a certain period
const CLEANUP_INTERVAL_MS = 10 * 1000; // Check every 30 seconds
const INACTIVITY_TIMEOUT_MS = 180 * 1000; // Remove if inactive for 60 seconds (1 minute)

setInterval(() => {
  const now = Date.now();
  for (const userId in activeLocations) {
    if (activeLocations.hasOwnProperty(userId)) {
      const locationData = activeLocations[userId];
      // Remove if not tracking AND last updated beyond timeout
      // OR if tracking but no update for a very long time (e.g., app closed without stopping)
      if ((!locationData.isTracking && (now - locationData.timestamp > INACTIVITY_TIMEOUT_MS)) ||
          (now - locationData.timestamp > INACTIVITY_TIMEOUT_MS * 5 && locationData.isTracking)) { // More aggressive cleanup for truly stale tracking
        console.log(`Cleaning up inactive user: ${userId}`);
        delete activeLocations[userId];
      }
    }
  }
}, CLEANUP_INTERVAL_MS);


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

    console.log(`Received update for ${userId}: Lat ${latitude}, Lng ${longitude}, Tracking: ${isTracking}`);

    return new Response(JSON.stringify({ message: 'Location received successfully', data: activeLocations[userId] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing location data:', error);
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

// 2. app/api/locations/route.js (for GET - fetch all active locations)
export async function GET() {
  try {
    const activeTrackers = Object.entries(activeLocations)
      .filter(([userId, data]) => data.isTracking) // Only return actively tracking users
      .map(([userId, data]) => ({ userId, ...data })); // Include userId in the object

    console.log(`Dashboard requested all active locations. Found ${activeTrackers.length} active trackers.`);

    return new Response(JSON.stringify(activeTrackers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching all locations:', error);
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
