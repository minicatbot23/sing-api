const express = require("express");
const axios = require("axios");
const youtubeDl = require("youtube-dl-exec");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

// Render-এর এনভায়রনমেন্ট ভেরিয়েবল থেকে স্বয়ংক্রিয়ভাবে cookies.txt ফাইল তৈরি করা
const cookiePath = path.join(__dirname, "cookies.txt");
if (process.env.YT_COOKIES) {
  try {
    fs.writeFileSync(cookiePath, process.env.YT_COOKIES);
    console.log("Cookies file generated successfully from environment variable!");
  } catch (err) {
    console.error("Failed to generate cookies file:", err);
  }
}

app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Song API is running"
  });
});

app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;

    if (!q) {
      return res.status(400).json({
        status: false,
        message: "Search query is required"
      });
    }

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q,
          type: "video",
          maxResults: 1,
          key: API_KEY
        }
      }
    );

    const item = response.data.items?.[0];

    if (!item) {
      return res.status(404).json({
        status: false,
        message: "No video found"
      });
    }

    res.json({
      status: true,
      title: item.snippet.title,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Search error",
      error: error.response?.data?.error?.message || error.message
    });
  }
});

app.get("/download", async (req, res) => {
  try {
    const videoId = req.query.id;

    if (!videoId) {
      return res.status(400).json({
        status: false,
        message: "Video ID is required"
      });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // yt-dlp এ কুকিজ ফাইল সহ রিকোয়েস্ট পাঠানো
    const result = await youtubeDl(videoUrl, {
      dumpSingleJson: true,
      noPlaylist: true,
      noWarnings: true,
      format: "bestaudio/best",
      cookies: cookiePath
    });

    if (!result || !result.url) {
      return res.status(404).json({
        status: false,
        message: "Audio URL not found"
      });
    }

    res.json({
      status: true,
      title: result.title,
      url: result.url,
      mimeType: result.mime_type || "audio/webm"
    });

  } catch (error) {
    console.error("Download error:", error);

    res.status(500).json({
      status: false,
      message: "Download error",
      error: error.stderr || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
