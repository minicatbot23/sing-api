const express = require("express");
const axios = require("axios");

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
      message: "API error",
      error: error.response?.data?.error?.message || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
