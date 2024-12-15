// TODO: Implement the code here to add rate limiting with Redis
// Refer to the Next.js Docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
// Refer to Redis docs on Rate Limiting: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis"; // import Redis client
import { Ratelimit } from "@upstash/ratelimit"; // import rate limit

// Initialize Redis client outside the function
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function middleware(request: NextRequest) {
  try {
    // Initialize Rate Limiter
    const rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(10, "1m"), // 10 requests per minute
    });

    // Get the client IP address
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";

    // Check rate limit
    const { success } = await rateLimiter.limit(clientIp);

    if (!success) {
      return new NextResponse("Too many requests, your limit is 10 requests per minute", { status: 429 });
    }

    // Return undefined 
    return undefined;

  } catch (error) {
    console.error("Rate limiting error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

/**
 * Check if a link exists in Upstash Redis and save it if it doesn't.
 * @param link - The URL of the link to check and save.
 * @param websiteData - An object containing the website data to save.
 */
export async function checkAndSaveLinkToRedis(link: string, websiteData: Record<string, any>) {
  try {
    // Check if the link already exists
    const existingData = await redis.get(link);
    if (existingData) {
      console.log(`Link already exists: ${link}`);
      return; // Exit if the link already exists
    }

    // Use the link as the key and the website data as the value
    await redis.set(link, JSON.stringify(websiteData));
    console.log(`Link saved: ${link}`);
  } catch (error) {
    console.error("Error checking or saving link to Redis:", error);
  }
}