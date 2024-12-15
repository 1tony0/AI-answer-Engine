import { z } from "zod";
import { Groq } from "groq-sdk";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || (() => {
    throw new Error("GROQ_API_KEY is not set");
  })(),
});

// Define Zod schema
const schema = z.object({
  url: z.string().url("Invalid URL format. Must be a valid URL."),
  prompt: z.string().min(1, "Prompt is required."),
});

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate request body with Zod
    const { url, prompt } = schema.parse(body);

    // Log for debugging
    console.log("Validated URL:", url);
    console.log("Validated Prompt:", prompt);

    // Step 1: Check Cache (this is a placeholder)
    // Assume cache mechanism here. Replace with actual implementation.

    // Step 2: Perform Web Scraping using Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const content = await page.content();
    await browser.close();

    // Step 3: Parse Content with Cheerio
    const $ = cheerio.load(content);
    const extractedText = $("body").text();

    // Step 4: Generate Chat Completion Using Groq
    const chatResponse = await groq.chat.completions.create({
      model: "llama3-8b-8192", // Replace with the correct model
      messages: [
        { role: "system", content: "Extracted website text provided." },
        { role: "user", content: `${prompt}\n\n${extractedText}` },
      ],
    });

    const responseContent = chatResponse.choices[0]?.message?.content || "No response.";

    // Step 5: Return the response
    return new Response(
      JSON.stringify({
        success: true,
        data: responseContent,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in POST handler:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
