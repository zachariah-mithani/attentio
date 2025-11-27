<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lumina Focus Learning - Run and Deploy

A content suggestion app that displays **real YouTube videos** and links to authoritative articles and courses.

View your app in AI Studio: https://ai.studio/apps/drive/1DCUFxNqzj6wmfbs5VeapYGN5BtMvUS9B

## Run Locally

**Prerequisites:**  Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up API keys in `.env.local`:**
   ```
   API_KEY=your_gemini_api_key_here
   YOUTUBE_API_KEY=your_youtube_data_api_v3_key_here
   ```
   
   See [SETUP.md](SETUP.md) for detailed instructions on getting a YouTube API key.

3. **Run the app:**
   ```bash
   npm run dev
   ```

## Features

- 🎥 **Real YouTube Videos**: Fetches and embeds actual YouTube videos using YouTube Data API v3
- 📚 **Quality Content**: Links to authoritative articles and courses from trusted sources
- ⚡ **Smart Hybrid Approach**: Combines real YouTube data with AI-curated educational resources
- 🎯 **Advanced Filtering**: Filter by type (Video/Article/Course) and sort by various criteria
