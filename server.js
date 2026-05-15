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

// High-CTR titles + image prompts for AI image generation
const POSTS = [
  {id:1,  title:"Is Your Dog's Paw Trying to Tell You Something?",       cat:"Dog Care",    url:`${BASE_URL}/dog-paw-scanner/`,                                                                    imgPrompt:"close up healthy dog paw on grass, golden light, warm and caring, photorealistic",                                aff:false},
  {id:2,  title:"Top Pet Products Every Owner Wishes They Had Sooner",    cat:"Products",    url:`${BASE_URL}/products/`,                                                                           imgPrompt:"happy dog and cat with pet care products on clean white background, bright colors",                                aff:false},
  {id:3,  title:"The Nail Clipper That Makes Grooming Stress-Free",       cat:"Product",     url:"https://www.dhgate.com/product/led-light-pet-nail-clipper-with-amplification/1010092124.html",   imgPrompt:"dog nail clipper with LED light on wooden surface, product photography, clean",                                   aff:true},
  {id:4,  title:"One Kit That Handles All Your Pet's Grooming Needs",     cat:"Product",     url:"https://www.dhgate.com/product/combs-dog-hair-remover-cat-brush-grooming/1028087374.html",       imgPrompt:"pet grooming kit laid out neatly, brushes and combs, professional product photo",                                aff:true},
  {id:5,  title:"See What Your Dog Does When You're Not Home",            cat:"Product",     url:"https://www.dhgate.com/product/dog-collars-hd-1080p-wireless-collar-camera/1032506070.html",    imgPrompt:"dog wearing smart collar with camera outdoors, curious expression, sunny day",                                    aff:true},
  {id:6,  title:"The 2-in-1 Pet Stroller That Changes Everything",        cat:"Product",     url:"https://bestchoiceproducts.com/products/2-in-1-pet-dog-bike-trailer",                           imgPrompt:"small dog in a pet stroller on a park path, happy owner, sunshine",                                              aff:true},
  {id:7,  title:"8-Piece Grooming Kit That Cleans Itself While You Use It",cat:"Product",   url:"https://www.dhgate.com/product/8pcs-set-dog-grooming-kit-self-cleaning-pet/1087614127.html",    imgPrompt:"dog grooming session with electric brush, fluffy dog looking happy, bright studio",                               aff:true},
  {id:8,  title:"Clean Paws in 10 Seconds – No Water Needed",             cat:"Product",     url:"https://www.dhgate.com/product/pet-foot-paw-cleaner-100ml-foam-waterless/1010228089.html",      imgPrompt:"dog paw being cleaned with foam spray, cute dog looking up, white background",                                   aff:true},
  {id:9,  title:"The Easiest Way to Keep Your Dog's Teeth Sparkling",     cat:"Product",     url:"https://www.dhgate.com/product/100-pieces-batch-of-pet-finger-toothbrushes/1010228766.html",    imgPrompt:"dog teeth cleaning with finger toothbrush, happy dog, close-up, bright and clean",                               aff:true},
  {id:10, title:"Why Vets Recommend This Shampoo for Sensitive Skin",     cat:"Product",     url:"https://www.dhgate.com/product/pet-shampoo-for-cats-and-dogs-cleansing-bathing/1089431467.html","imgPrompt":"dog bath time with gentle shampoo, fluffy clean dog, warm bathroom, cozy",                                    aff:true},
  {id:11, title:"Why Beagles Make the Most Loyal Family Dogs",            cat:"Breed Guide", url:`${BASE_URL}/beagle-temperament/`,                                                                imgPrompt:"adorable beagle dog with family in park, warm golden hour light, photorealistic",                                aff:false},
  {id:12, title:"The Boxer: A Gentle Giant Your Kids Will Love",          cat:"Breed Guide", url:`${BASE_URL}/boxer-breed-temperament/`,                                                           imgPrompt:"boxer dog playing gently with children in backyard, sunny day, warm colors",                                     aff:false},
  {id:13, title:"Why the Bulldog Is Actually Perfect for Apartment Life", cat:"Breed Guide", url:`${BASE_URL}/english-bulldog-temperament/`,                                                       imgPrompt:"cute english bulldog relaxing on couch in apartment, cozy home setting",                                         aff:false},
  {id:14, title:"German Shepherd: The Dog That Would Do Anything for You",cat:"Breed Guide", url:`${BASE_URL}/german-shepherd-temperament/`,                                                       imgPrompt:"majestic german shepherd dog looking loyal and alert, golden field, photorealistic",                              aff:false},
  {id:15, title:"Rottweilers Are Misunderstood – Here's the Real Truth",  cat:"Breed Guide", url:`${BASE_URL}/rottweiler-temperament/`,                                                            imgPrompt:"friendly rottweiler dog with owner in park, gentle expression, warm lighting",                                   aff:false},
  {id:16, title:"The Pomeranian: Big Personality in a Tiny Body",         cat:"Breed Guide", url:`${BASE_URL}/pomeranian-dog-breed-temperament-care-guide/`,                                       imgPrompt:"fluffy pomeranian dog posing playfully, bright background, adorable expression",                                 aff:false},
  {id:17, title:"Why Everyone Falls in Love with Persian Cats",           cat:"Cat Guide",   url:`${BASE_URL}/persian-cat-temperament/`,                                                           imgPrompt:"beautiful persian cat with long fur, sitting elegantly, soft pastel background",                                 aff:false},
  {id:18, title:"The Ragdoll Cat: Floppy, Fluffy and Totally Irresistible",cat:"Cat Guide", url:`${BASE_URL}/ragdoll-temperament/`,                                                               imgPrompt:"ragdoll cat being held, blue eyes, fluffy and relaxed, warm cozy home",                                         aff:false},
  {id:19, title:"5 Dog Diseases Most Owners Don't Catch in Time",         cat:"Health",      url:`${BASE_URL}/top-5-deadly-common-dog-diseases-symptoms-prevention-treatment-pictures/`,          imgPrompt:"veterinarian examining dog with care and concern, clinic setting, professional",                                  aff:false},
  {id:20, title:"What's Actually Supposed to Be in a Pet First Aid Kit",  cat:"Health",      url:`${BASE_URL}/pet-first-aid-kit-checklist/`,                                                       imgPrompt:"pet first aid kit open with supplies, red cross symbol, clean white background",                                 aff:false},
  {id:21, title:"Never Miss a Pet Vaccine Again With This Simple System", cat:"Health",      url:`${BASE_URL}/pet-vaccine-tracker/`,                                                               imgPrompt:"vet giving dog a vaccine, caring hands, clinical setting, warm and professional",                                aff:false},
  {id:22, title:"These Common Plants Are Secretly Poisoning Your Pet",    cat:"Health",      url:`${BASE_URL}/common-plants-that-may-be-toxic-to-pets/`,                                           imgPrompt:"cat near houseplants, cautionary mood, green plants with warning feel, bright home",                             aff:false},
  {id:23, title:"Your Complete Month-by-Month Kitten Growth Guide",       cat:"Cat Guide",   url:`${BASE_URL}/new-kitten-planner/`,                                                                imgPrompt:"tiny kitten growing up, multiple stages, warm and playful, pastel colors",                                      aff:false},
  {id:24, title:"Answers to Pet Food Questions You Were Afraid to Ask",   cat:"Nutrition",   url:`${BASE_URL}/pet-food-queries/`,                                                                  imgPrompt:"dog and cat eating from bowls together, healthy food, bright clean kitchen",                                     aff:false},
  {id:25, title:"Groom Your Cat at Home Like a Pro – No Scratches",       cat:"Cat Guide",   url:`${BASE_URL}/cat-grooming-guide-2/`,                                                              imgPrompt:"cat being gently groomed at home, calm cat, owner brushing fur, cozy setting",                                   aff:false},
  {id:26, title:"Score Your Pet's Hygiene in Under 5 Minutes",            cat:"Health",      url:`${BASE_URL}/pet-hygiene-score-card/`,                                                            imgPrompt:"clean and groomed dog and cat side by side, healthy shiny fur, bright background",                               aff:false},
  {id:27, title:"Is Your Cat Moving Less Lately? Read This Now",          cat:"Cat Health",  url:`${BASE_URL}/simple-tips-to-know-signs-of-osteoarthritis-in-cats/`,                              imgPrompt:"senior cat resting comfortably, caring owner nearby, soft warm light, empathetic mood",                          aff:false},
  {id:28, title:"How to Stop Cat Scratches Before They Happen",           cat:"Cat Health",  url:`${BASE_URL}/how-to-prevent-cat-paw-scratches-at-home/`,                                         imgPrompt:"cat paw with scratching post, prevention theme, playful and safe home environment",                              aff:false},
  {id:29, title:"Yes, You Can Walk Your Cat – Here's Exactly How",        cat:"Cat Guide",   url:`${BASE_URL}/how-to-walk-your-cat-safely-harness-training-for-beginners/`,                       imgPrompt:"cat wearing harness on a leash outside, curious cat exploring, sunny day",                                       aff:false},
  {id:30, title:"Simple Daily Habits That Protect Your Family from Pet Diseases",cat:"Health",url:`${BASE_URL}/digital-awareness-to-minimize-zoonosis-spread/`,                                   imgPrompt:"happy family with clean healthy pets at home, hygiene theme, warm and safe feeling",                             aff:false},
  {id:31, title:"The Water Bottle That Keeps You Hydrated All Day",       cat:"General",     url:"https://echowater.com/products/echo-flask",                                                     imgPrompt:"sleek modern water flask on a clean desk, lifestyle product photo, minimal design",                              aff:true},
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
  log('Fetching Page Access Token...');
  log(`System token: len=${FB_SYS_TOKEN.length} starts=${FB_SYS_TOKEN.substring(0,8)}`);
  const options = {
    hostname: 'graph.facebook.com',
    path: `/v19.0/me/accounts?access_token=${FB_SYS_TOKEN}`,
    method: 'GET'
  };
  try {
    const data = await apiRequest(options, null);
    if(data.error) { log(`Token error: ${data.error.message}`); PAGE_TOKEN = FB_SYS_TOKEN; return; }
    if(data.data && data.data.length > 0) {
      const page = data.data.find(p => p.id === FB_PAGE_ID) || data.data[0];
      PAGE_TOKEN = page.access_token;
      log(`Page token OK for: ${page.name} (len=${PAGE_TOKEN.length})`);
    } else { PAGE_TOKEN = FB_SYS_TOKEN; }
  } catch(e) { log(`Token exception: ${e.message}`); PAGE_TOKEN = FB_SYS_TOKEN; }
}

async function generateCaption(post, style) {
  const prompt = `Write a high-CTR Facebook post caption for USA pet owners.
Title: "${post.title}"
Category: ${post.cat}
Style: ${style}
Rules:
- First line: the title in ALL CAPS (keep it exactly, just uppercase)
- Blank line
- 2-3 sentences: engaging, SEO-friendly, warm tone, 2-3 relevant emojis
- End with a clear call-to-action sentence (no URL, added separately)
- NO hashtags
Return ONLY the caption text.`;

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
  if(data.error) throw new Error('Claude: ' + data.error.message);
  return data.content[0].text.trim();
}

// Generate image via Pollinations.ai — free, no API key, returns image URL directly
function buildImageUrl(prompt, seed) {
  const encoded = encodeURIComponent(prompt + ', professional photography, vibrant, high quality');
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true`;
}

// Build full caption with visible URL appended
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
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  };
  const data = await apiRequest(options, body);
  if(data.error) throw new Error('FB Photo: ' + data.error.message);
  return data.id || data.post_id;
}

// Fallback link post
async function publishLinkPost(fullCaption, utm) {
  log('Publishing link post fallback...');
  const body = JSON.stringify({
    message: fullCaption,
    link: utm,
    access_token: PAGE_TOKEN
  });
  const options = {
    hostname: 'graph.facebook.com',
    path: `/v19.0/${FB_PAGE_ID}/feed`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  };
  const data = await apiRequest(options, body);
  if(data.error) throw new Error('FB Feed: ' + data.error.message);
  return data.id;
}

async function runPost() {
  if(!isActiveHour()) {
    log(`SKIP — Outside hours (${ACTIVE_FROM}:00-${ACTIVE_TO}:00 EST)`);
    return;
  }
  if(!PAGE_TOKEN) { await fetchPageToken(); }

  const post = POSTS[postIndex % 31];
  const style = STYLES[styleIndex % 5];
  const utm = buildUTM(post);
  const seed = post.id * 137 + styleIndex * 31; // deterministic but varied seed

  log(`START — P${String(post.id).padStart(2,'0')}: ${post.title}`);

  try {
    // Generate caption
    const caption = await generateCaption(post, style);
    log(`Caption ready (${caption.length} chars)`);

    const fullCaption = buildFullCaption(caption, utm, post);

    // Build Pollinations image URL (no download needed — FB fetches directly)
    const imageUrl = buildImageUrl(post.imgPrompt, seed);
    log(`Image URL built: ${imageUrl.substring(0, 80)}...`);

    let postId;
    try {
      postId = await publishWithImage(fullCaption, imageUrl, utm);
      log(`SUCCESS (photo post) — FB Post ID: ${postId}`);
    } catch(imgErr) {
      log(`Photo post failed: ${imgErr.message} — fallback to link post`);
      postId = await publishLinkPost(fullCaption, utm);
      log(`SUCCESS (link post) — FB Post ID: ${postId}`);
    }

    totalPosted++;
    postIndex++;
    styleIndex++;
    log(`Total posted: ${totalPosted} | Next: P${String(POSTS[postIndex%31].id).padStart(2,'0')}`);
  } catch(err) {
    log(`ERROR — ${err.message}`);
    if(err.message.includes('token') || err.message.includes('OAuthException')) {
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
  log(`Scheduler active — first post in 15s, then every ${INTERVAL_MS/60000}min`);
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
<h1>🐾 OHG Pet Autopilot v5 <span class="badge">AI Image + Caption</span></h1>
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
