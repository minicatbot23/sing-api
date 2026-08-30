const express = require("express");
const axios = require("axios");
const { Innertube } = require("youtubei.js");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

let youtube;

async function getYoutube() {
  if (!youtube) {
    youtube = await Innertube.create();
  }
  return youtube;
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

    const yt = await getYoutube();
    const info = await yt.music.getInfo(videoId);

    const format = info.chooseFormat({
      type: "audio",
      quality: "best",
      format: "mp4"
    });

    if (!format) {
      return res.status(404).json({
        status: false,
        message: "Audio format not found"
      });
    }

    res.json({
      status: true,
      title: info.basic_info.title,
      url: format.url,
      mimeType: format.mime_type
    });

  } catch (error) {
    console.error("Download error:", error);

    res.status(500).json({
      status: false,
      message: "Download error",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});