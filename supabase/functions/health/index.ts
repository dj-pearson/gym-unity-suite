// Simple health check endpoint for Docker healthcheck
export default async (req: Request): Promise<Response> => {
  return new Response(
    JSON.stringify({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "edge-functions",
      method: req.method 
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }
  );
};
