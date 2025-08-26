// app/api/track-location/route.js (for Next.js App Router)

export async function POST(req) { // Changed handler to POST for App Router
  try {
    const { latitude, longitude } = await req.json(); // Read request body as JSON

    if (latitude === undefined || longitude === undefined) {
      return new Response(JSON.stringify({ message: 'Missing latitude or longitude in request body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Received location update: Latitude ${latitude}, Longitude ${longitude}`);

    return new Response(JSON.stringify({ message: 'Location received successfully', data: { latitude, longitude } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing location data:', error);
    return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// You can add other HTTP methods if needed, e.g., GET, PUT, DELETE
// For App Router, each HTTP method is its own export.
export async function GET() {
  return new Response(JSON.stringify({ message: 'GET method not allowed for this API route. Use POST.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}