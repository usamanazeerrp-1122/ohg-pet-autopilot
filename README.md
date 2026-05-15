# OHG Pet Autopilot Server

Deploy to Railway.app for FREE 24/7 auto-posting.

## Setup Steps

1. Go to github.com → Create new repository → Name: ohg-pet-autopilot
2. Upload these 3 files: server.js, package.json, README.md
3. Go to railway.app → Sign up free → New Project → Deploy from GitHub
4. Select your repo → Railway auto-deploys
5. Go to Variables tab → Add these:

| Variable | Value |
|----------|-------|
| FB_TOKEN | your never-expiring token from Meta Business Suite |
| FB_PAGE_ID | 1593329474221951 |
| CLAUDE_KEY | your sk-ant-... key |
| BASE_URL | https://onehealthglobe.com |
| UTM_CAMP | pet_daily |
| INTERVAL_MS | 3600000 (1 hour) |
| ACTIVE_FROM | 8 |
| ACTIVE_TO | 22 |

6. Click Deploy → Done! Posts every 1 hour, 8AM-10PM EST, forever.
