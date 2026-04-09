# OG Check

A simple web app to inspect OpenGraph and Twitter Card meta tags for any URL. Enter a URL and instantly see the parsed tags and a social share preview.

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/AlexHacksAround/OG_Check)

Click the button above to deploy your own instance. Render will use the included `render.yaml` blueprint to set everything up on the free tier automatically.

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000` in your browser.

## How It Works

- Express server fetches the target URL server-side (no CORS issues)
- Parses `og:*`, `twitter:*`, and standard meta tags from the HTML
- Renders a social preview card and a full tag listing in the browser
- No headless browser required — lightweight HTTP fetch + regex parsing
