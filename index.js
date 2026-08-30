const express = require("express");
const axios = require("axios");
const youtubeDl = require("youtube-dl-exec");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

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

    const result = await youtubeDl(videoUrl, {
      dumpSingleJson: true,
      noPlaylist: true,
      noWarnings: true,
      format: "bestaudio/best"
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