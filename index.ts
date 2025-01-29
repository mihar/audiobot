import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize bot with your token
const bot = new Telegraf(process.env.BOT_TOKEN || "");

// Command handler for /start
bot.command("start", (ctx) => {
  ctx.reply("Welcome! I am a simple Telegram bot.");
});

// Command handler for /help
bot.command("help", (ctx) => {
  ctx.reply(
    "Available commands:\n/start - Start the bot\n/help - Show this help message"
  );
});

// Handle text messages
bot.on(message("text"), async (ctx) => {
  ctx.reply(`You said: ${ctx.message.text}`);

  // Handle group messages
  if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
    ctx.reply(`Received message in group: ${ctx.message.text}`);
  }

  // If the message contains a link to YouTube, fetch the video title
  if (ctx.message.text.includes("youtube.com")) {
    const videoId = matchYoutubeUrlToVideoId(ctx.message.text);
    if (videoId) {
      const title = await fetchVideoTitle(videoId);
      ctx.reply(`Video Title: ${title}`);
    }
  }
});

// Error handling
bot.catch((err: unknown) => {
  console.error("Telegram bot error:", err);
});

// Start the bot
bot
  .launch()
  .then(() => {
    console.log("Bot is running...");
  })
  .catch((err) => {
    console.error("Failed to start bot:", err);
  });

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Match a YouTube URL to a video ID
function matchYoutubeUrlToVideoId(str: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = str.match(regex);
  return match ? match[1] : null;
}

// Fetch video title from YouTube URL using the Data API
async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    // Use YouTube Data API v3
    const API_KEY = process.env.YOUTUBE_API_KEY; // Make sure to add this to your .env file
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet`
    );

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error("Video not found");
    }

    return data.items[0].snippet.title;
  } catch (error) {
    console.error("Error fetching video title:", error);
    return "Unknown Title";
  }
}
