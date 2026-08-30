const express = require("express");
const { Innertube } = require("youtubei.js");

const app = express();
const PORT = process.env.PORT || 3000;

let yt;

// Innertube ইনিশিয়ালাইজ করা
(async () => {
  try {
    yt = await Innertube.create();
    console.log("YouTubei initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize YouTubei:", error);
  }
})();

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
      return res.status(400).json({ status: false, message: "Search query is required" });
    }

    if (!yt) {
      return res.status(500).json({ status: false, message: "YouTube client not ready yet" });
    }

    const search = await yt.search(q, { type: 'video' });
    const item = search.videos?.[0];

    if (!item) {
      return res.status(404).json({ status: false, message: "No video found" });
    }

    res.json({
      status: true,
      title: item.title.text,
      videoId: item.id,
      url: `https://www.youtube.com/watch?v=${item.id}`
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Search error",
      error: error.message
    });
  }
});

app.get("/download", async (req, res) => {
  try {
    const videoId = req.query.id;
    if (!videoId) {
      return res.status(400).json({ status: false, message: "Video ID is required" });
    }

    if (!yt) {
      return res.status(500).json({ status: false, message: "YouTube client not ready yet" });
    }

    // ইনফো ফেচ করা
    const info = await yt.getBasicInfo(videoId);
    
    // ডিরেক্ট অডিও স্ট্রিম লিংক বের করা
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });

    res.json({
      status: true,
      title: info.basic_info.title,
      url: format.url,
      mimeType: format.mime_type || "audio/mp4"
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
