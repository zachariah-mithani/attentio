# Setup Instructions for Real YouTube Videos

## Quick Start

### 1. Get API Keys

#### Gemini API Key (Required)
- You should already have this from the original app setup
- If not, visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create an API key for Gemini

#### YouTube Data API v3 Key (Required for real videos)
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select an existing one
- Navigate to "APIs & Services" → "Library"
- Search for "YouTube Data API v3" and enable it
- Go to "Credentials" → "Create Credentials" → "API Key"
- Copy your API key

### 2. Configure `.env.local`

**IMPORTANT:** The variable names must be exactly as shown below:

```bash
API_KEY=your_actual_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

⚠️ **Common mistakes:**
- Using `GEMINI_API_KEY` instead of `API_KEY` (won't work!)
- Leaving `PLACEHOLDER_API_KEY` as the value (won't work!)
- Not restarting the dev server after changing `.env.local`

### 3. Install and Run

```bash
npm install
npm run dev
```

### 4. Restart Required

**After editing `.env.local`, you MUST restart the dev server:**
- Stop the server (Ctrl+C in terminal)
- Run `npm run dev` again

### 5. Test the App

- Open http://localhost:5173 in your browser
- Select "Quick Dive" mode (for real YouTube videos)
- Search for a topic (e.g., "Machine Learning")
- You should see real, playable YouTube videos embedded in cards

---

## API Quotas

- **YouTube API**: 10,000 units/day (free tier)
- Each search costs ~100 units = ~100 searches per day
- **Gemini API**: Check your Google AI Studio quota

---

## Troubleshooting

### Error: "System unable to retrieve data"

**Cause:** Missing or invalid API key

**Solution:**
1. Check `.env.local` has the correct variable names (`API_KEY`, not `GEMINI_API_KEY`)
2. Ensure API key values are not placeholders
3. Restart the dev server after editing `.env.local`
4. Check browser console (F12) for detailed error messages

### No videos showing

**Cause:** YouTube API key missing or invalid

**Solution:**
1. Verify `YOUTUBE_API_KEY` is set correctly in `.env.local`
2. Check the API key is enabled for YouTube Data API v3 in Google Cloud Console
3. Check browser console for quota or permission errors

### TypeScript errors in IDE

**Normal before running:** TypeScript errors about missing modules are expected before `npm install` runs. They will disappear after installation.

