const https = require('https');
const http = require('http');

const FB_SYS_TOKEN = (process.env.FB_TOKEN || '').trim().replace(/['"]/g,'');
const FB_PAGE_ID   = (process.env.FB_PAGE_ID || '1593329474221951').trim().replace(/['"]/g,'');
const CLAUDE_KEY   = (process.env.CLAUDE_KEY || '').trim().replace(/['"]/g,'');
const BASE_URL     = (process.env.BASE_URL || 'https://onehealthglobe.com').trim().replace(/['"]/g,'');
const UTM_CAMP     = (process.env.UTM_CAMP || 'pet_daily').trim().replace(/['"]/g,'');
const INTERVAL_MS  = parseInt((process.env.INTERVAL_MS || '3600000').replace(/['"]/g,''));
const ACTIVE_FROM  = parseInt((process.env.ACTIVE_FROM || '8').replace(/['"]/g,''));
const ACTIVE_TO    = parseInt((process.env.ACTIVE_TO || '22').replace(/['"]/g,''));

const POSTS = [
  {id:1, title:"Why Dog Paw Health Matters",              cat:"Dog Care",    url:`${BASE_URL}/dog-paw-scanner/`,                                                                    aff:false},
  {id:2, title:"Quality Pet Products for Every Owner",    cat:"Products",    url:`${BASE_URL}/products/`,                                                                           aff:false},
  {id:3, title:"Best Dog Nail Clipper LED Light",         cat:"Product",     url:"https://www.dhgate.com/product/led-light-pet-nail-clipper-with-amplification/1010092124.html",   aff:true},
  {id:4, title:"Best Pet Grooming Kit",                   cat:"Product",     url:"https://www.dhgate.com/product/combs-dog-hair-remover-cat-brush-grooming/1028087374.html",       aff:true},
  {id:5, title:"Best Pet Collar Camera HD 1080p",         cat:"Product",     url:"https://www.dhgate.com/product/dog-collars-hd-1080p-wireless-collar-camera/1032506070.html",    aff:true},
  {id:6, title:"Pet Stroller and Bike Trailer 2 in 1",    cat:"Product",     url:"https://bestchoiceproducts.com/products/2-in-1-pet-dog-bike-trailer",                           aff:true},
  {id:7, title:"Dog Grooming Kit 8 Piece Self Cleaning",  cat:"Product",     url:"https://www.dhgate.com/product/8pcs-set-dog-grooming-kit-self-cleaning-pet/1087614127.html",    aff:true},
  {id:8, title:"Pet Paw Cleaner Foam Waterless",          cat:"Product",     url:"https://www.dhgate.com/product/pet-foot-paw-cleaner-100ml-foam-waterless/1010228089.html",      aff:true},
  {id:9, title:"Best Dog Tooth Cleaning Care",            cat:"Product",     url:"https://www.dhgate.com/product/100-pieces-batch-of-pet-finger-toothbrushes/1010228766.html",    aff:true},
  {id:10,title:"Best Pet Shampoo for Skin Care",          cat:"Product",     url:"https://www.dhgate.com/product/pet-shampoo-for-cats-and-dogs-cleansing-bathing/1089431467.html",aff:true},
  {id:11,title:"Why Beagle Is a Perfect Family Dog",      cat:"Breed Guide", url:`${BASE_URL}/beagle-temperament/`,                                                                aff:false},
  {id:12,title:"Boxer Best Family Dog and Care Guide",    cat:"Breed Guide", url:`${BASE_URL}/boxer-breed-temperament/`,                                                           aff:false},
  {id:13,title:"Bulldog Best Dog for Kids Temperament",   cat:"Breed Guide", url:`${BASE_URL}/english-bulldog-temperament/`,                                                       aff:false},
  {id:14,title:"German Shepherd Breed Temperament",       cat:"Breed Guide", url:`${BASE_URL}/german-shepherd-temperament/`,                                                       aff:false},
  {id:15,title:"Why Rottweiler Has a Strong Bond",        cat:"Breed Guide", url:`${BASE_URL}/rottweiler-temperament/`,                                                            aff:false},
  {id:16,title:"Pomeranian Energetic Breed Guide",        cat:"Breed Guide", url:`${BASE_URL}/pomeranian-dog-breed-temperament-care-guide/`,                                       aff:false},
  {id:17,title:"Why Persian Cat Is Loved Most",           cat:"Cat Guide",   url:`${BASE_URL}/persian-cat-temperament/`,                                                           aff:false},
  {id:18,title:"Ragdoll Cat Beauty and Family Fitness",   cat:"Cat Guide",   url:`${BASE_URL}/ragdoll-temperament/`,                                                               aff:false},
  {id:19,title:"Top 5 Dog Deadly Diseases and Symptoms",  cat:"Health",      url:`${BASE_URL}/top-5-deadly-common-dog-diseases-symptoms-prevention-treatment-pictures/`,          aff:false},
  {id:20,title:"What Is in a Pet First Aid Kit",          cat:"Health",      url:`${BASE_URL}/pet-first-aid-kit-checklist/`,                                                       aff:false},
  {id:21,title:"How to Keep Vaccine Records for Pets",    cat:"Health",      url:`${BASE_URL}/pet-vaccine-tracker/`,                                                               aff:false},
  {id:22,title:"Toxic Plants List for Pets",              cat:"Health",      url:`${BASE_URL}/common-plants-that-may-be-toxic-to-pets/`,                                           aff:false},
  {id:23,title:"Complete Kitten Planner 0 to Adult",      cat:"Cat Guide",   url:`${BASE_URL}/new-kitten-planner/`,                                                                aff:false},
  {id:24,title:"Most Common Pet Food Questions Answered", cat:"Nutrition",   url:`${BASE_URL}/pet-food-queries/`,                                                                  aff:false},
  {id:25,title:"How to Groom Cat at Home Like a Pro",     cat:"Cat Guide",   url:`${BASE_URL}/cat-grooming-guide-2/`,                                                              aff:false},
  {id:26,title:"Pet Hygiene Checking Scorecard",          cat:"Health",      url:`${BASE_URL}/pet-hygiene-score-card/`,                                                            aff:false},
  {id:27,title:"Signs of Osteoarthritis in Cats",         cat:"Cat Health",  url:`${BASE_URL}/simple-tips-to-know-signs-of-osteoarthritis-in-cats/`,                              aff:false},
  {id:28,title:"How to Prevent Cat Paw Scratches at Home",cat:"Cat Health",  url:`${BASE_URL}/how-to-prevent-cat-paw-scratches-at-home/`,                                         aff:false},
  {id:29,title:"How to Harness Train a Cat at Home",      cat:"Cat Guide",   url:`${BASE_URL}/how-to-walk-your-cat-safely-harness-training-for-beginners/`,                       aff:false},
  {id:30,title:"How to Prevent Zoonosis at Home",         cat:"Health",      url:`${BASE_URL}/digital-awareness-to-minimize-zoonosis-spread/`,                                    aff:false},
  {id:31,title:"Echo Water Flask Rehydration Wellness",   cat:"General",     url:"https://echowater.com/products/echo-flask",                                                     aff:true},
];

const STYLES = ["Educational","Storytelling","How-To","Hook/Viral","FAQ/List"];
let postIndex = 0;
let styleIndex = 0;
let totalPosted = 0;
let logs = [];
let PAGE_TOKEN = '';

function log(msg) {
  const t = new Date().toISOString();
  const line = `[${t}] ${msg}`;
  console.log(line);
  logs.unshift(line);
  if(logs.length > 200) logs = logs.slice(0,200);
}

function isActiveHour() {
  const est = new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const h = est.getHours();
  return h >= ACTIVE_FROM && h <= ACTIVE_TO;
}

function buildUTM(post) {
  if(post.aff) return post.url;
  const sep = post.url.includes('?') ? '&' : '?';
  return `${post.url}${sep}utm_source=facebook&utm_medium=page&utm_campaign=${UTM_CAMP}&utm_content=p${String(post.id).padStart(2,'0')}`;
}

function apiRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({raw: data}); }
      });
    });
    req.on('error', reject);
    if(body) req.write(body);
    req.end();
  });
}

async function fetchPageToken() {
  log('Fetching Page Access Token from Graph API...');
  log(`System token length: ${FB_SYS_TOKEN.length} | starts: ${FB_SYS_TOKEN.substring(0,8)}`);
  const options = {
    hostname: 'graph.facebook.com',
    path: `/v19.0/me/accounts?access_token=${FB_SYS_TOKEN}`,
    method: 'GET'
  };
  try {
    const data = await apiRequest(options, null);
    if(data.error) {
      log(`ERROR fetching page token: ${data.error.message}`);
      PAGE_TOKEN = FB_SYS_TOKEN;
      return;
    }
    if(data.data && data.data.length > 0) {
      const page = data.data.find(p => p.id === FB_PAGE_ID) || data.data[0];
      PAGE_TOKEN = page.access_token;
      log(`Page token fetched for: ${page.name}`);
      log(`Page token length: ${PAGE_TOKEN.length}`);
    } else {
      log('No pages found, using system token');
      PAGE_TOKEN = FB_SYS_TOKEN;
    }
  } catch(e) {
    log(`Exception: ${e.message}`);
    PAGE_TOKEN = FB_SYS_TOKEN;
  }
}

async function generateCaption(post, style) {
  const prompt = `Write a Facebook post caption for USA pet owners.
Title: "${post.title}"
Category: ${post.cat}
Style: ${style}
Rules:
- First line: ALL CAPS punchy headline (max 8 words, rewrite the title as a hook)
- Blank line
- 2-3 sentences: SEO-optimized, warm tone, 2-3 relevant emojis
- NO hashtags, NO URLs (link added separately)
Return caption text ONLY.`;

  const body = JSON.stringify({
    model: "claude-sonnet-4-5",
    max_tokens: 350,
    messages: [{role:"user", content:prompt}]
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const data = await apiRequest(options, body);
  if(data.error) throw new Error('Claude API: ' + data.error.message);
  return data.content[0].text.trim();
}

// Pre-scrape OG image from URL using Facebook's own scraper API
// This tells FB to crawl the page and extract the image — no Railway network issue
async function getFBScrapedImage(utm) {
  log(`Asking Facebook to scrape image from: ${utm.substring(0,60)}...`);
  const encodedUrl = encodeURIComponent(utm);
  const options = {
    hostname: 'graph.facebook.com',
    path: `/v19.0/?id=${encodedUrl}&scrape=true&access_token=${PAGE_TOKEN}`,
    method: 'POST',
    headers: { 'Content-Length': 0 }
  };
  try {
    const data = await apiRequest(options, '');
    if(data.og_object && data.og_object.image && data.og_object.image[0]) {
      const imgUrl = data.og_object.image[0].url || data.og_object.image[0].secure_url;
      log(`FB scraped image: ${imgUrl ? imgUrl.substring(0,70) : 'none'}`);
      return imgUrl || null;
    }
    if(data.image && data.image[0]) {
      const imgUrl = data.image[0].url || data.image[0].secure_url;
      log(`FB scraped image (alt): ${imgUrl ? imgUrl.substring(0,70) : 'none'}`);
      return imgUrl || null;
    }
    log(`FB scrape result: no image found. Keys: ${Object.keys(data).join(', ')}`);
    return null;
  } catch(e) {
    log(`FB scrape error: ${e.message}`);
    return null;
  }
}

// Build full caption with visible URL line
function buildFullCaption(caption, utm, post) {
  const siteLine = post.aff ? '' : '\n\nonehealthglobe.com';
  return `${caption}\n\n🔗 For the full guide, visit: ${utm}${siteLine}`;
}

// Photo post — image clickable, opens UTM url
async function publishWithImage(fullCaption, imageUrl, utm) {
  log(`Publishing photo post...`);
  const body = JSON.stringify({
    caption: fullCaption,
    url: imageUrl,
    link: utm,
    published: true,
    access_token: PAGE_TOKEN
  });
  const options = {
    hostname: 'graph.facebook.com',
    path: `/v19.0/${FB_PAGE_ID}/photos`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  const data = await apiRequest(options, body);
  if(data.error) throw new Error('FB Photo API: ' + data.error.message);
  return data.id || data.post_id;
}

// Fallback: link post — FB auto-shows OG image as large card
async function publishLinkPost(fullCaption, utm) {
  log('Publishing link post (FB will show OG image card)...');
  const body = JSON.stringify({
    message: fullCaption,
    link: utm,
    access_token: PAGE_TOKEN
  });
  const options = {
    hostname: 'graph.facebook.com',
    path: `/v19.0/${FB_PAGE_ID}/feed`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  const data = await apiRequest(options, body);
  if(data.error) throw new Error('Facebook API: ' + data.error.message);
  return data.id;
}

async function runPost() {
  if(!isActiveHour()) {
    log(`SKIP — Outside active hours (${ACTIVE_FROM}:00-${ACTIVE_TO}:00 EST)`);
    return;
  }
  if(!PAGE_TOKEN) {
    log('No page token — fetching...');
    await fetchPageToken();
  }

  const post = POSTS[postIndex % 31];
  const style = STYLES[styleIndex % 5];
  const utm = buildUTM(post);

  log(`START — P${String(post.id).padStart(2,'0')}: ${post.title}`);

  try {
    const caption = await generateCaption(post, style);
    log(`Caption ready (${caption.length} chars)`);
    const fullCaption = buildFullCaption(caption, utm, post);

    // Use Facebook's own scraper to get the OG image (bypasses Railway network block)
    const imageUrl = await getFBScrapedImage(utm);

    let postId;
    if(imageUrl) {
      try {
        postId = await publishWithImage(fullCaption, imageUrl, utm);
        log(`SUCCESS (photo post) — FB Post ID: ${postId}`);
      } catch(imgErr) {
        log(`Photo post failed: ${imgErr.message} — falling back to link post`);
        postId = await publishLinkPost(fullCaption, utm);
        log(`SUCCESS (link post fallback) — FB Post ID: ${postId}`);
      }
    } else {
      postId = await publishLinkPost(fullCaption, utm);
      log(`SUCCESS (link post, FB shows OG card) — FB Post ID: ${postId}`);
    }

    totalPosted++;
    postIndex++;
    styleIndex++;
    log(`Total posted: ${totalPosted} | Next: P${String(POSTS[postIndex%31].id).padStart(2,'0')}`);
  } catch(err) {
    log(`ERROR — ${err.message}`);
    if(err.message.includes('token') || err.message.includes('OAuthException')) {
      log('Token error — refreshing...');
      await fetchPageToken();
    }
    postIndex++;
    styleIndex++;
  }
}

// STARTUP
log('OHG Pet Autopilot Server v5 starting...');
log(`Config: PAGE=${FB_PAGE_ID} | INTERVAL=${INTERVAL_MS/60000}min | HOURS=${ACTIVE_FROM}-${ACTIVE_TO} EST`);
log(`System token: ${FB_SYS_TOKEN ? 'SET (len='+FB_SYS_TOKEN.length+')' : 'MISSING'}`);
log(`Claude key: ${CLAUDE_KEY ? 'SET (len='+CLAUDE_KEY.length+')' : 'MISSING'}`);

fetchPageToken().then(() => {
  log(`Scheduler active — first post in 15 seconds, then every ${INTERVAL_MS/60000} minutes`);
  setTimeout(runPost, 15000);
  setInterval(runPost, INTERVAL_MS);
});

// Dashboard
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  const est = new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const nextPost = POSTS[postIndex % 31];
  const html = `<!DOCTYPE html>
<html><head><title>OHG Pet Autopilot v5</title>
<meta http-equiv="refresh" content="30">
<style>
body{font-family:Arial;background:#0a0f0d;color:#e8f5ec;padding:20px;max-width:900px;margin:0 auto;}
h1{color:#2dff8e;}
.stat{display:inline-block;background:#111a15;border:1px solid #1e2e23;border-radius:8px;padding:12px 20px;margin:6px;text-align:center;}
.sv{font-size:28px;font-weight:bold;color:#2dff8e;}
.sl{font-size:11px;color:#4a6652;margin-top:4px;}
.log{background:#000;border-radius:8px;padding:14px;font-family:monospace;font-size:11px;max-height:500px;overflow-y:auto;}
.log div{padding:2px 0;border-bottom:1px solid #111;}
.badge{background:#1a2e20;border:1px solid #2dff8e;border-radius:4px;padding:2px 8px;font-size:11px;color:#2dff8e;margin-left:8px;}
</style></head>
<body>
<h1>🐾 OHG Pet Autopilot v5 <span class="badge">FB Scrape + Image</span></h1>
<p style="color:#4a6652;font-size:13px">Auto-refreshes every 30s | ${est.toLocaleString('en-US',{timeZone:'America/New_York'})} EST</p>
<div>
<div class="stat"><div class="sv">${totalPosted}</div><div class="sl">Published</div></div>
<div class="stat"><div class="sv">${postIndex%31+1}/31</div><div class="sl">Post Index</div></div>
<div class="stat"><div class="sv">${isActiveHour()?'ACTIVE':'SLEEPING'}</div><div class="sl">Status</div></div>
<div class="stat"><div class="sv">${PAGE_TOKEN?'OK':'MISSING'}</div><div class="sl">Page Token</div></div>
</div>
<h3 style="color:#7a9e85;margin-top:20px">Next: P${String(nextPost.id).padStart(2,'0')} — ${nextPost.title}</h3>
<h3 style="color:#7a9e85;margin-top:16px">Log</h3>
<div class="log">${logs.map(l=>`<div style="color:${l.includes('SUCCESS')?'#2dff8e':l.includes('ERROR')?'#ff5252':l.includes('SKIP')?'#ffb830':'#7a9e85'}">${l}</div>`).join('')}</div>
</body></html>`;
  res.writeHead(200,{'Content-Type':'text/html'});
  res.end(html);
}).listen(PORT, () => log(`Dashboard on port ${PORT}`));
