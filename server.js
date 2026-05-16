const https = require('https');
const http = require('http');

const FB_SYS_TOKEN = (process.env.FB_TOKEN || '').trim().replace(/['"]/g,'');
const FB_PAGE_ID   = (process.env.FB_PAGE_ID || '1593329474221951').trim().replace(/['"]/g,'');
const CLAUDE_KEY   = (process.env.CLAUDE_KEY || '').trim().replace(/['"]/g,'');
const GROUP_TOKEN  = (process.env.GROUP_TOKEN || process.env.FB_TOKEN || '').trim().replace(/['"]/g,'');
const BASE_URL     = (process.env.BASE_URL || 'https://onehealthglobe.com').trim().replace(/['"]/g,'');
const UTM_CAMP     = (process.env.UTM_CAMP || 'pet_daily').trim().replace(/['"]/g,'');
const INTERVAL_MS  = parseInt((process.env.INTERVAL_MS || '3600000').replace(/['"]/g,''));
const ACTIVE_FROM  = parseInt((process.env.ACTIVE_FROM || '0').replace(/['"]/g,''));
const ACTIVE_TO    = parseInt((process.env.ACTIVE_TO || '23').replace(/['"]/g,''));

// ── 51 REAL PET GROUPS (verified member) ────────────────────────────────────
const PET_GROUPS = [
  { id:'500368749468100',   name:'Pet Group 1'  },
  { id:'3600051136946931',  name:'Pet Group 2'  },
  { id:'292334551733098',   name:'Pet Group 3'  },
  { id:'1646335478949432',  name:'Pet Group 4'  },
  { id:'2554385438000835',  name:'Pet Group 5'  },
  { id:'789150111541632',   name:'Pet Group 6'  },
  { id:'7744997858907035',  name:'Pet Group 7'  },
  { id:'1353490842230101',  name:'Pet Group 8'  },
  { id:'1834108936746147',  name:'Pet Group 9'  },
  { id:'330254270730994',   name:'Pet Group 10' },
  { id:'1248873522784379',  name:'Pet Group 11' },
  { id:'1014385262861627',  name:'Pet Group 12' },
  { id:'675797020593657',   name:'Pet Group 13' },
  { id:'583620043376368',   name:'Pet Group 14' },
  { id:'2547506902152954',  name:'Pet Group 15' },
  { id:'3140451742656289',  name:'Pet Group 16' },
  { id:'1480786079452455',  name:'Pet Group 17' },
  { id:'1326944118206638',  name:'Pet Group 18' },
  { id:'307580381503430',   name:'Pet Group 19' },
  { id:'461184931334541',   name:'Pet Group 20' },
  { id:'1295942594553524',  name:'Pet Group 21' },
  { id:'192587185534663',   name:'Pet Group 22' },
  { id:'377755187101689',   name:'Pet Group 23' },
  { id:'326167946033084',   name:'Pet Group 24' },
  { id:'610566119052717',   name:'Pet Group 25' },
  { id:'1674732609491439',  name:'Pet Group 26' },
  { id:'933217017720614',   name:'Pet Group 27' },
  { id:'431295184113190',   name:'Pet Group 28' },
  { id:'767624587087131',   name:'Pet Group 29' },
  { id:'594418657651256',   name:'Pet Group 30' },
  { id:'270108283813237',   name:'Pet Group 31' },
  { id:'301989663212504',   name:'Pet Group 32' },
  { id:'1849264732136206',  name:'Pet Group 33' },
  { id:'227331692369249',   name:'Pet Group 34' },
  { id:'789914661870430',   name:'Pet Group 35' },
  { id:'298318892925167',   name:'Pet Group 36' },
  { id:'832559748915714',   name:'Pet Group 37' },
  { id:'364649314053230',   name:'Pet Group 38' },
  { id:'1194573492507061',  name:'Pet Group 39' },
  { id:'915924780333480',   name:'Pet Group 40' },
  { id:'657070631294038',   name:'Pet Group 41' },
  { id:'804913806896277',   name:'Pet Group 42' },
  { id:'2312541602348749',  name:'Pet Group 43' },
  { id:'3487960294831161',  name:'Pet Group 44' },
  { id:'164790994147723',   name:'Pet Group 45' },
  { id:'633599764751170',   name:'Pet Group 46' },
  { id:'2506890209',        name:'Pet Group 47' },
  { id:'1331075681160221',  name:'Pet Group 48' },
  { id:'1097715307889750',  name:'Pet Group 49' },
  { id:'411960037377198',   name:'Pet Group 50' },
  { id:'610787807923198',   name:'Pet Group 51' },
];

// Group health tracking: success/fail counts per group
const groupStats = {};
PET_GROUPS.forEach(g => { groupStats[g.id] = { success:0, fail:0, lastFail:0, cooldown:false }; });

// Posts pending admin approval: { postId, groupId, groupName, postedAt, title, fullCaption, imageUrl, utm, triedGroups[] }
let pendingGroupPosts = [];
// Successfully posted group IDs this cycle (reset each round of 31)
let postedGroupsThisCycle = new Set();

let groupIndex = 0;

// ── POSTS ───────────────────────────────────────────────────────────────────
const POSTS = [
  {id:1,  title:"Is Your Dog's Paw Trying to Tell You Something?",         cat:"Dog Care",    url:`${BASE_URL}/dog-paw-scanner/`,                                                                    imgPrompt:"close up healthy dog paw on grass, golden light, warm and caring, photorealistic",                                aff:false},
  {id:2,  title:"Top Pet Products Every Owner Wishes They Had Sooner",      cat:"Products",    url:`${BASE_URL}/products/`,                                                                           imgPrompt:"happy dog and cat with pet care products on clean white background, bright colors",                                aff:false},
  {id:3,  title:"The Nail Clipper That Makes Grooming Stress-Free",         cat:"Product",     url:"https://www.dhgate.com/product/led-light-pet-nail-clipper-with-amplification/1010092124.html",   imgPrompt:"dog nail clipper with LED light on wooden surface, product photography, clean",                                   aff:true},
  {id:4,  title:"One Kit That Handles All Your Pet's Grooming Needs",       cat:"Product",     url:"https://www.dhgate.com/product/combs-dog-hair-remover-cat-brush-grooming/1028087374.html",       imgPrompt:"pet grooming kit laid out neatly, brushes and combs, professional product photo",                                aff:true},
  {id:5,  title:"See What Your Dog Does When You're Not Home",              cat:"Product",     url:"https://www.dhgate.com/product/dog-collars-hd-1080p-wireless-collar-camera/1032506070.html",    imgPrompt:"dog wearing smart collar with camera outdoors, curious expression, sunny day",                                    aff:true},
  {id:6,  title:"The 2-in-1 Pet Stroller That Changes Everything",          cat:"Product",     url:"https://bestchoiceproducts.com/products/2-in-1-pet-dog-bike-trailer",                           imgPrompt:"small dog in a pet stroller on a park path, happy owner, sunshine",                                              aff:true},
  {id:7,  title:"8-Piece Grooming Kit That Cleans Itself While You Use It", cat:"Product",     url:"https://www.dhgate.com/product/8pcs-set-dog-grooming-kit-self-cleaning-pet/1087614127.html",    imgPrompt:"dog grooming session with electric brush, fluffy dog looking happy, bright studio",                               aff:true},
  {id:8,  title:"Clean Paws in 10 Seconds – No Water Needed",               cat:"Product",     url:"https://www.dhgate.com/product/pet-foot-paw-cleaner-100ml-foam-waterless/1010228089.html",      imgPrompt:"dog paw being cleaned with foam spray, cute dog looking up, white background",                                   aff:true},
  {id:9,  title:"The Easiest Way to Keep Your Dog's Teeth Sparkling",       cat:"Product",     url:"https://www.dhgate.com/product/100-pieces-batch-of-pet-finger-toothbrushes/1010228766.html",    imgPrompt:"dog teeth cleaning with finger toothbrush, happy dog, close-up, bright and clean",                               aff:true},
  {id:10, title:"Why Vets Recommend This Shampoo for Sensitive Skin",       cat:"Product",     url:"https://www.dhgate.com/product/pet-shampoo-for-cats-and-dogs-cleansing-bathing/1089431467.html",imgPrompt:"dog bath time with gentle shampoo, fluffy clean dog, warm bathroom, cozy",                                     aff:true},
  {id:11, title:"Why Beagles Make the Most Loyal Family Dogs",              cat:"Breed Guide", url:`${BASE_URL}/beagle-temperament/`,                                                                imgPrompt:"adorable beagle dog with family in park, warm golden hour light, photorealistic",                                aff:false},
  {id:12, title:"The Boxer: A Gentle Giant Your Kids Will Love",            cat:"Breed Guide", url:`${BASE_URL}/boxer-breed-temperament/`,                                                           imgPrompt:"boxer dog playing gently with children in backyard, sunny day, warm colors",                                     aff:false},
  {id:13, title:"Why the Bulldog Is Actually Perfect for Apartment Life",   cat:"Breed Guide", url:`${BASE_URL}/english-bulldog-temperament/`,                                                       imgPrompt:"cute english bulldog relaxing on couch in apartment, cozy home setting",                                         aff:false},
  {id:14, title:"German Shepherd: The Dog That Would Do Anything for You",  cat:"Breed Guide", url:`${BASE_URL}/german-shepherd-temperament/`,                                                       imgPrompt:"majestic german shepherd dog looking loyal and alert, golden field, photorealistic",                              aff:false},
  {id:15, title:"Rottweilers Are Misunderstood – Here's the Real Truth",    cat:"Breed Guide", url:`${BASE_URL}/rottweiler-temperament/`,                                                            imgPrompt:"friendly rottweiler dog with owner in park, gentle expression, warm lighting",                                   aff:false},
  {id:16, title:"The Pomeranian: Big Personality in a Tiny Body",           cat:"Breed Guide", url:`${BASE_URL}/pomeranian-dog-breed-temperament-care-guide/`,                                       imgPrompt:"fluffy pomeranian dog posing playfully, bright background, adorable expression",                                 aff:false},
  {id:17, title:"Why Everyone Falls in Love with Persian Cats",             cat:"Cat Guide",   url:`${BASE_URL}/persian-cat-temperament/`,                                                           imgPrompt:"beautiful persian cat with long fur, sitting elegantly, soft pastel background",                                 aff:false},
  {id:18, title:"The Ragdoll Cat: Floppy, Fluffy and Totally Irresistible", cat:"Cat Guide",   url:`${BASE_URL}/ragdoll-temperament/`,                                                               imgPrompt:"ragdoll cat being held, blue eyes, fluffy and relaxed, warm cozy home",                                         aff:false},
  {id:19, title:"5 Dog Diseases Most Owners Don't Catch in Time",           cat:"Health",      url:`${BASE_URL}/top-5-deadly-common-dog-diseases-symptoms-prevention-treatment-pictures/`,          imgPrompt:"veterinarian examining dog with care and concern, clinic setting, professional",                                  aff:false},
  {id:20, title:"What's Actually in a Pet First Aid Kit?",                  cat:"Health",      url:`${BASE_URL}/pet-first-aid-kit-checklist/`,                                                       imgPrompt:"pet first aid kit open with supplies, red cross symbol, clean white background",                                 aff:false},
  {id:21, title:"Never Miss a Pet Vaccine Again With This Simple System",   cat:"Health",      url:`${BASE_URL}/pet-vaccine-tracker/`,                                                               imgPrompt:"vet giving dog a vaccine, caring hands, clinical setting, warm and professional",                                aff:false},
  {id:22, title:"These Common Plants Are Secretly Poisoning Your Pet",      cat:"Health",      url:`${BASE_URL}/common-plants-that-may-be-toxic-to-pets/`,                                           imgPrompt:"cat near houseplants, cautionary mood, green plants with warning feel, bright home",                             aff:false},
  {id:23, title:"Your Complete Month-by-Month Kitten Growth Guide",         cat:"Cat Guide",   url:`${BASE_URL}/new-kitten-planner/`,                                                                imgPrompt:"tiny kitten growing up, multiple stages, warm and playful, pastel colors",                                      aff:false},
  {id:24, title:"Answers to Pet Food Questions You Were Afraid to Ask",     cat:"Nutrition",   url:`${BASE_URL}/pet-food-queries/`,                                                                  imgPrompt:"dog and cat eating from bowls together, healthy food, bright clean kitchen",                                     aff:false},
  {id:25, title:"Groom Your Cat at Home Like a Pro – No Scratches",         cat:"Cat Guide",   url:`${BASE_URL}/cat-grooming-guide-2/`,                                                              imgPrompt:"cat being gently groomed at home, calm cat, owner brushing fur, cozy setting",                                   aff:false},
  {id:26, title:"Score Your Pet's Hygiene in Under 5 Minutes",              cat:"Health",      url:`${BASE_URL}/pet-hygiene-score-card/`,                                                            imgPrompt:"clean and groomed dog and cat side by side, healthy shiny fur, bright background",                               aff:false},
  {id:27, title:"Is Your Cat Moving Less Lately? Read This Now",            cat:"Cat Health",  url:`${BASE_URL}/simple-tips-to-know-signs-of-osteoarthritis-in-cats/`,                              imgPrompt:"senior cat resting comfortably, caring owner nearby, soft warm light, empathetic mood",                          aff:false},
  {id:28, title:"How to Stop Cat Scratches Before They Happen",             cat:"Cat Health",  url:`${BASE_URL}/how-to-prevent-cat-paw-scratches-at-home/`,                                         imgPrompt:"cat paw with scratching post, prevention theme, playful and safe home environment",                              aff:false},
  {id:29, title:"Yes, You Can Walk Your Cat – Here's Exactly How",          cat:"Cat Guide",   url:`${BASE_URL}/how-to-walk-your-cat-safely-harness-training-for-beginners/`,                       imgPrompt:"cat wearing harness on a leash outside, curious cat exploring, sunny day",                                       aff:false},
  {id:30, title:"Simple Daily Habits That Protect Your Family from Pet Diseases", cat:"Health",url:`${BASE_URL}/digital-awareness-to-minimize-zoonosis-spread/`,                                   imgPrompt:"happy family with clean healthy pets at home, hygiene theme, warm and safe feeling",                             aff:false},
  {id:31, title:"The Water Bottle That Keeps You Hydrated All Day",         cat:"General",     url:"https://echowater.com/products/echo-flask",                                                     imgPrompt:"sleek modern water flask on a clean desk, lifestyle product photo, minimal design",                              aff:true},
];

const STYLES = ["Educational","Storytelling","How-To","Hook/Viral","FAQ/List"];
let postIndex = 0;
let styleIndex = 0;
let totalPosted = 0;
let totalGroupPosted = 0;
let totalComments = 0;
let logs = [];
let PAGE_TOKEN = '';

function log(msg) {
  const t = new Date().toISOString();
  const line = `[${t}] ${msg}`;
  console.log(line);
  logs.unshift(line);
  if(logs.length > 400) logs = logs.slice(0,400);
}

function isActiveHour() {
  const est = new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  return est.getHours() >= ACTIVE_FROM && est.getHours() <= ACTIVE_TO;
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
        try { resolve(JSON.parse(data)); } catch(e) { resolve({raw: data}); }
      });
    });
    req.on('error', reject);
    if(body) req.write(body);
    req.end();
  });
}

async function fetchPageToken() {
  log('Fetching Page Access Token...');
  const options = { hostname:'graph.facebook.com', path:`/v19.0/me/accounts?access_token=${FB_SYS_TOKEN}`, method:'GET' };
  try {
    const data = await apiRequest(options, null);
    if(data.error) { log(`Token error: ${data.error.message}`); PAGE_TOKEN = FB_SYS_TOKEN; return; }
    if(data.data && data.data.length > 0) {
      const page = data.data.find(p => p.id === FB_PAGE_ID) || data.data[0];
      PAGE_TOKEN = page.access_token;
      log(`Page token OK: ${page.name} (len=${PAGE_TOKEN.length})`);
    } else { PAGE_TOKEN = FB_SYS_TOKEN; }
  } catch(e) { log(`Token exception: ${e.message}`); PAGE_TOKEN = FB_SYS_TOKEN; }
}

async function generateCaption(post, style) {
  const prompt = `Write a high-CTR Facebook post caption for USA pet owners.
Title: "${post.title}"
Category: ${post.cat}
Style: ${style}
Rules:
- First line: title in ALL CAPS
- Blank line
- 2-3 sentences: engaging, SEO-friendly, warm tone, 2-3 relevant emojis
- End with a clear call-to-action (no URL)
- NO hashtags
Return ONLY the caption text.`;
  const body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:350, messages:[{role:"user",content:prompt}] });
  const options = {
    hostname:'api.anthropic.com', path:'/v1/messages', method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':CLAUDE_KEY,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(body)}
  };
  const data = await apiRequest(options, body);
  if(data.error) throw new Error('Claude: ' + data.error.message);
  return data.content[0].text.trim();
}

function buildImageUrl(prompt, seed) {
  const encoded = encodeURIComponent(prompt + ', professional photography, vibrant, high quality');
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true`;
}

function buildFullCaption(caption, utm, post) {
  const siteLine = post.aff ? '' : '\n\nonehealthglobe.com';
  return `${caption}\n\n🔗 For the full guide, visit: ${utm}${siteLine}`;
}

// ── PUBLISH TO PAGE ──────────────────────────────────────────────────────────
async function publishToPage(fullCaption, imageUrl, utm) {
  const body = JSON.stringify({ caption:fullCaption, url:imageUrl, link:utm, published:true, access_token:PAGE_TOKEN });
  const options = { hostname:'graph.facebook.com', path:`/v19.0/${FB_PAGE_ID}/photos`, method:'POST',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} };
  const data = await apiRequest(options, body);
  if(data.error) {
    const b2 = JSON.stringify({ message:fullCaption, link:utm, access_token:PAGE_TOKEN });
    const o2 = { hostname:'graph.facebook.com', path:`/v19.0/${FB_PAGE_ID}/feed`, method:'POST',
      headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b2)} };
    const d2 = await apiRequest(o2, b2);
    if(d2.error) throw new Error('Page: ' + d2.error.message);
    return d2.id;
  }
  return data.id || data.post_id;
}

// ── PUBLISH TO ONE GROUP ─────────────────────────────────────────────────────
async function publishToGroup(group, fullCaption, utm) {
  const body = JSON.stringify({ message:fullCaption, link:utm, access_token:GROUP_TOKEN });
  const options = { hostname:'graph.facebook.com', path:`/v19.0/${group.id}/feed`, method:'POST',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} };
  const data = await apiRequest(options, body);
  if(data.error) throw new Error(data.error.message);
  return data.id;
}

// ── SMART GROUP SELECTOR ─────────────────────────────────────────────────────
function pickNextGroup(triedIds = []) {
  const now = Date.now();
  PET_GROUPS.forEach(g => {
    const s = groupStats[g.id];
    if(s.cooldown && (now - s.lastFail) > 24*3600000) {
      s.cooldown = false;
      log(`⟳ Cooldown lifted for ${g.name}`);
    }
  });

  let pick = PET_GROUPS.find(g =>
    !triedIds.includes(g.id) &&
    !groupStats[g.id].cooldown &&
    !groupStats[g.id].permanent &&
    !postedGroupsThisCycle.has(g.id)
  );
  if(pick) return pick;

  pick = PET_GROUPS.find(g =>
    !triedIds.includes(g.id) &&
    !groupStats[g.id].cooldown &&
    !groupStats[g.id].permanent
  );
  if(pick) return pick;

  pick = PET_GROUPS.find(g =>
    !triedIds.includes(g.id) &&
    !groupStats[g.id].permanent
  );
  if(pick) return pick;

  return null;
}

// ── POST TO GROUPS WITH SMART RETRY ─────────────────────────────────────────
async function postToGroupWithRetry(fullCaption, imageUrl, utm, post) {
  const triedIds = [];
  let attempts = 0;
  const maxAttempts = 3;

  while(attempts < maxAttempts) {
    const group = pickNextGroup(triedIds);
    if(!group) { log(`⚠️ No more groups available this attempt`); break; }

    triedIds.push(group.id);
    attempts++;

    try {
      const postId = await publishToGroup(group, fullCaption, utm);
      groupStats[group.id].success++;
      postedGroupsThisCycle.add(group.id);
      totalGroupPosted++;
      log(`✅ GROUP [${attempts}] ${group.name} — ID: ${postId}`);
      pendingGroupPosts.push({
        postId, groupId:group.id, groupName:group.name,
        postedAt:Date.now(), title:post.title,
        fullCaption, imageUrl, utm, triedGroups:[...triedIds]
      });
      return;
    } catch(e) {
      groupStats[group.id].fail++;
      groupStats[group.id].lastFail = Date.now();
      log(`⚠️ GROUP [${attempts}] ${group.name} FAILED: ${e.message.substring(0,80)}`);

      const isPermanent = e.message.includes('missing permissions') ||
                          e.message.includes('does not exist') ||
                          e.message.includes('not support this operation') ||
                          e.message.includes('Invalid OAuth') ||
                          e.message.includes('not a member');
      if(isPermanent) {
        groupStats[group.id].cooldown = true;
        groupStats[group.id].permanent = true;
        log(`🚫 ${group.name} PERMANENTLY skipped (not member / no permission)`);
      } else if(groupStats[group.id].fail >= 3) {
        groupStats[group.id].cooldown = true;
        log(`🚫 ${group.name} on 24h cooldown (3 failures)`);
      }
    }
  }
  log(`⚠️ All ${attempts} group attempts failed this round`);
}

// ── CHECK & RETRY STUCK/REJECTED GROUP POSTS ────────────────────────────────
async function retryPendingGroupPosts() {
  if(pendingGroupPosts.length === 0) return;
  log(`🔍 Checking ${pendingGroupPosts.length} pending group posts...`);
  const now = Date.now();
  const stillPending = [];

  for(const p of pendingGroupPosts) {
    const ageH = (now - p.postedAt) / 3600000;
    try {
      const options = { hostname:'graph.facebook.com',
        path:`/v19.0/${p.postId}?fields=id&access_token=${GROUP_TOKEN}`, method:'GET' };
      const data = await apiRequest(options, null);
      if(data.id) {
        if(ageH < 72) {
          stillPending.push(p);
          if(ageH > 48) log(`⏳ ${p.groupName}: post ${p.postId} still pending (${Math.round(ageH)}h)`);
        } else {
          log(`⏰ ${p.groupName}: post stuck 72h — retrying in new group`);
          await postToGroupWithRetry(p.fullCaption, p.imageUrl, p.utm, {title:p.title}, p.triedGroups);
        }
      } else if(data.error) {
        log(`❌ ${p.groupName}: post rejected/deleted after ${Math.round(ageH)}h — retrying`);
        groupStats[p.groupId].fail++;
        await postToGroupWithRetry(p.fullCaption, p.imageUrl, p.utm, {title:p.title}, p.triedGroups);
      }
    } catch(e) { stillPending.push(p); }
  }
  pendingGroupPosts = stillPending;
}

// ── MAIN RUNNER ──────────────────────────────────────────────────────────────
async function runPost() {
  if(!isActiveHour()) { log(`SKIP — Outside hours (${ACTIVE_FROM}:00-${ACTIVE_TO}:00 EST)`); return; }
  if(!PAGE_TOKEN) await fetchPageToken();

  await retryPendingGroupPosts();
  await checkAndCommentFallback();

  const idx = postIndex % 31;
  const round = Math.floor(postIndex / 31) + 1;
  const post = POSTS[idx];
  const style = STYLES[styleIndex % 5];
  const utm = buildUTM(post);
  const seed = post.id * 137 + styleIndex * 31;
  const imageUrl = buildImageUrl(post.imgPrompt, seed);

  if(idx === 0 && postIndex > 0) {
    postedGroupsThisCycle.clear();
    log(`🔄 New rotation round ${round} — group cycle reset`);
  }

  log(`━━━ P${String(post.id).padStart(2,'0')} [Round ${round}] | Group next: ${pickNextGroup()?.name||'none'}`);
  log(`Title: ${post.title}`);

  try {
    const caption = await generateCaption(post, style);
    log(`Caption ready (${caption.length} chars)`);
    const fullCaption = buildFullCaption(caption, utm, post);

    try {
      const pageId = await publishToPage(fullCaption, imageUrl, utm);
      log(`✅ PAGE — ID: ${pageId}`);
      totalPosted++;
    } catch(e) { log(`❌ PAGE failed: ${e.message}`); }

    await postToGroupWithRetry(fullCaption, imageUrl, utm, post);

    postIndex++;
    styleIndex++;
    const nextPost = POSTS[postIndex % 31];
    log(`Done. Total: ${totalPosted} page | ${totalGroupPosted} group | Pending: ${pendingGroupPosts.length}`);
    log(`Next: P${String(nextPost.id).padStart(2,'0')} — ${nextPost.title}`);

  } catch(err) {
    log(`ERROR — ${err.message}`);
    if(err.message.includes('token') || err.message.includes('OAuthException')) await fetchPageToken();
    postIndex++; styleIndex++;
  }
}

// STARTUP
log('OHG Pet Autopilot Server v5 starting...');
log(`Posts: 31 | Groups: ${PET_GROUPS.length} | Interval: ${INTERVAL_MS/60000}min | Hours: ${ACTIVE_FROM}-${ACTIVE_TO} EST`);
log(`Token: ${FB_SYS_TOKEN?'SET len='+FB_SYS_TOKEN.length:'MISSING'} | Claude: ${CLAUDE_KEY?'SET':'MISSING'}`);
log(`Group token: ${GROUP_TOKEN && GROUP_TOKEN!==FB_SYS_TOKEN?'SEPARATE (len='+GROUP_TOKEN.length+')':'using FB_TOKEN (no publish_to_groups yet)'}`);

fetchPageToken().then(() => {
  log(`Scheduler ready — first post in 15s`);
  setTimeout(runPost, 15000);
  setInterval(runPost, INTERVAL_MS);
  setInterval(retryPendingGroupPosts, 4 * 3600000);
  setInterval(checkAndCommentFallback, 30 * 60000);
});

// ── DASHBOARD ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  if(req.url && req.url.startsWith('/auth/callback')) {
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(`<!DOCTYPE html><html><body style="background:#0a0f0d;color:#2dff8e;font-family:Arial;padding:40px;text-align:center"><h2>OHG Token Capture</h2><script>const t=new URLSearchParams(window.location.hash.substring(1)).get('access_token');if(t){document.body.innerHTML+='<p style="word-break:break-all;background:#111;padding:20px;border-radius:8px"><b>YOUR GROUP_TOKEN:</b><br>'+t+'</p><p>Copy above → paste into Railway as GROUP_TOKEN</p>';}else{document.body.innerHTML+='<p>No token found in URL</p>';}<\/script></body></html>`);
    return;
  }
  if(req.url === '/api/stats') {
    const est = new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
    const nextPost = POSTS[postIndex % 31];
    const activeG  = PET_GROUPS.filter(g => !groupStats[g.id].permanent).length;
    const bannedG  = PET_GROUPS.filter(g => groupStats[g.id].permanent).length;
    const coolG    = PET_GROUPS.filter(g => groupStats[g.id].cooldown && !groupStats[g.id].permanent).length;
    const nextGroup = pickNextGroup() || PET_GROUPS[0];
    const payload = {
      server:'OHG Pet Autopilot v5', time_est:est.toISOString(), is_active:isActiveHour(),
      post_index:postIndex%31+1, round:Math.floor(postIndex/31)+1,
      total_page:totalPosted, total_group:totalGroupPosted, total_comments:totalComments,
      pending_count:pendingGroupPosts.length, groups_total:PET_GROUPS.length,
      groups_active:activeG, groups_banned:bannedG, groups_cooldown:coolG,
      groups_used_cycle:postedGroupsThisCycle.size,
      next_post:{id:nextPost.id,title:nextPost.title,cat:nextPost.cat},
      next_group:{id:nextGroup.id,name:nextGroup.name},
      page_token_len:PAGE_TOKEN?PAGE_TOKEN.length:0, sys_token_len:FB_SYS_TOKEN?FB_SYS_TOKEN.length:0,
      group_token_set:GROUP_TOKEN&&GROUP_TOKEN!==FB_SYS_TOKEN, claude_key_set:CLAUDE_KEY?true:false,
      pending_posts:pendingGroupPosts.map(p=>({title:p.title,group_name:p.groupName,age_min:Math.round((Date.now()-p.postedAt)/60000),commented:p.commentFired||false,tried:(p.triedGroups||[]).length})),
      group_stats:PET_GROUPS.map(g=>({id:g.id,name:g.name,success:groupStats[g.id].success,fail:groupStats[g.id].fail,cooldown:groupStats[g.id].cooldown,permanent:groupStats[g.id].permanent||false,is_next:nextGroup&&g.id===nextGroup.id})),
      recent_logs:logs.slice(0,60)
    };
    res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'no-cache'});
    res.end(JSON.stringify(payload));
    return;
  }
  const est = new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const nextPost = POSTS[postIndex % 31];
  const nextGroup = pickNextGroup() || PET_GROUPS[0];
  const round = Math.floor(postIndex / 31) + 1;
  const permanentGroups = PET_GROUPS.filter(g => groupStats[g.id].permanent);
  const activeGroups = PET_GROUPS.filter(g => !groupStats[g.id].permanent);
  const html = `<!DOCTYPE html>
<html><head><title>OHG Pet Autopilot v5</title><meta http-equiv="refresh" content="30">
<style>*{box-sizing:border-box;}body{font-family:Arial;background:#0a0f0d;color:#e8f5ec;padding:16px;max-width:1100px;margin:0 auto;font-size:13px;}h1{color:#2dff8e;margin:0 0 4px;}h3{color:#7a9e85;margin:12px 0 6px;}.stat{display:inline-block;background:#111a15;border:1px solid #1e2e23;border-radius:8px;padding:10px 16px;margin:4px;text-align:center;min-width:90px;}.sv{font-size:22px;font-weight:bold;color:#2dff8e;}.sl{font-size:10px;color:#4a6652;margin-top:3px;}.badge{background:#1a2e20;border:1px solid #2dff8e;border-radius:4px;padding:1px 7px;font-size:10px;color:#2dff8e;margin-left:6px;}table{width:100%;border-collapse:collapse;font-size:11px;}td,th{padding:4px 8px;text-align:left;border-bottom:1px solid #1a2e1a;}th{color:#2dff8e;background:#0d1a10;}.log{background:#000;border-radius:8px;padding:12px;font-family:monospace;font-size:10px;max-height:400px;overflow-y:auto;}.log div{padding:1px 0;border-bottom:1px solid #080808;}.box{background:#0d1a10;border:1px solid #1e2e23;border-radius:8px;padding:12px;margin:10px 0;}.warn{border-color:#ff8c00;background:#120d00;}.ok{color:#2dff8e;}.err{color:#ff5252;}.info{color:#64b5f6;}.warn-t{color:#ffb830;}</style></head>
<body>
<h1>🐾 OHG Pet Autopilot v5 <span class="badge">51 Groups · 24/7 · Smart Retry · AI Images</span></h1>
<p style="color:#4a6652">${est.toLocaleString('en-US',{timeZone:'America/New_York'})} EST &nbsp;|&nbsp; Auto-refresh 30s &nbsp;|&nbsp; Round ${round} of ∞</p>
<div>
  <div class="stat"><div class="sv">${totalPosted}</div><div class="sl">Page Posts</div></div>
  <div class="stat"><div class="sv">${totalGroupPosted}</div><div class="sl">Group Posts</div></div>
  <div class="stat"><div class="sv">${totalComments}</div><div class="sl">💬 Comments</div></div>
  <div class="stat"><div class="sv">${postIndex%31+1}/31</div><div class="sl">Post Index</div></div>
  <div class="stat"><div class="sv">R${round}</div><div class="sl">Round</div></div>
  <div class="stat"><div class="sv">${pendingGroupPosts.length}</div><div class="sl">Pending Review</div></div>
  <div class="stat"><div class="sv">${activeGroups.length}</div><div class="sl">Active Groups</div></div>
  <div class="stat"><div class="sv">${permanentGroups.length}</div><div class="sl">⛔ No Access</div></div>
  <div class="stat"><div class="sv">${isActiveHour()?'🟢':'🌙'}</div><div class="sl">${isActiveHour()?'ACTIVE':'SLEEPING'}</div></div>
  <div class="stat"><div class="sv">${PAGE_TOKEN?'✅':'⚠️'}</div><div class="sl">Page Token</div></div>
  <div class="stat"><div class="sv">${GROUP_TOKEN&&GROUP_TOKEN!==FB_SYS_TOKEN?'✅':'⚠️'}</div><div class="sl">Group Token</div></div>
</div>
<div style="margin:10px 0;padding:10px;background:#0d1a10;border-radius:8px;border:1px solid #1e2e23">
  <b>Next Post:</b> P${String(nextPost.id).padStart(2,'0')} — ${nextPost.title}<br>
  <b>Next Group:</b> ${nextGroup.name} (${nextGroup.id}) &nbsp;|&nbsp;
  <b>Groups used this cycle:</b> ${postedGroupsThisCycle.size}/${PET_GROUPS.length}
</div>
<h3>📢 ${PET_GROUPS.length} Group Status</h3>
<div class="box"><table>
<tr><th>#</th><th>Group Name</th><th>Group ID</th><th>✅ OK</th><th>❌ Fail</th><th>Status</th></tr>
${PET_GROUPS.map((g,i)=>{const s=groupStats[g.id];const isNext=nextGroup&&g.id===nextGroup.id;const usedThisCycle=postedGroupsThisCycle.has(g.id);return `<tr style="${isNext?'background:#0a2a10':usedThisCycle?'color:#4a6652':''}"><td>${i+1}</td><td>${g.name}</td><td style="font-size:10px">${g.id}</td><td class="ok">${s.success}</td><td class="${s.fail>0?'err':'ok'}">${s.fail}</td><td>${s.permanent?'<span style="color:#666">⛔ not member</span>':s.cooldown?'<span style="color:#ff5252">🚫 cooldown</span>':isNext?'<span class="ok">◀ NEXT</span>':usedThisCycle?'<span style="color:#4a6652">✓ used</span>':'<span class="ok">ready</span>'}</td></tr>`;}).join('')}
</table></div>
${pendingGroupPosts.length>0?`<h3>⏳ Pending Admin Approval (${pendingGroupPosts.length})</h3><div class="box warn"><table><tr><th>Title</th><th>Group</th><th>Age</th><th>Comment</th></tr>${pendingGroupPosts.map(p=>{const ageH=(Math.round((Date.now()-p.postedAt)/360000)/10);return `<tr><td>${p.title.substring(0,38)}</td><td>${p.groupName}</td><td class="${ageH>48?'err':'warn-t'}">${ageH}h</td><td>${p.commentFired?'<span style="color:#64b5f6">💬 commented':'<span style="color:#ffb830">⏳ waiting'}</span></td></tr>`;}).join('')}</table></div>`:'<div class="box" style="color:#2dff8e">✅ No posts stuck in review</div>'}
<h3>📋 Log</h3>
<div class="log">${logs.map(l=>`<div class="${l.includes('✅')||l.includes('SUCCESS')?'ok':l.includes('❌')||l.includes('ERROR')?'err':l.includes('🔄')||l.includes('⟳')||l.includes('🔍')?'info':l.includes('⚠️')||l.includes('🚫')||l.includes('SKIP')?'warn-t':''}"> ${l}</div>`).join('')}</div>
</body></html>`;
  res.writeHead(200,{'Content-Type':'text/html'});
  res.end(html);
}).listen(PORT, () => log(`Dashboard on port ${PORT}`));

// ── VIRAL POST COMMENT FALLBACK ──────────────────────────────────────────────
async function findViralPostInGroup(groupId) {
  try {
    const options = {hostname:'graph.facebook.com',path:`/v19.0/${groupId}/feed?fields=id,message,likes.summary(true),comments.summary(true),created_time&limit=10&access_token=${GROUP_TOKEN}`,method:'GET'};
    const data = await apiRequest(options, null);
    if(data.error || !data.data || data.data.length === 0) return null;
    let best = null, bestScore = -1;
    for(const post of data.data) {
      const likes = (post.likes&&post.likes.summary)?post.likes.summary.total_count:0;
      const comments = (post.comments&&post.comments.summary)?post.comments.summary.total_count:0;
      const score = likes + comments * 3;
      if(score > bestScore) { bestScore = score; best = post; }
    }
    if(best) log(`🔥 Viral post found in ${groupId}: score=${bestScore} id=${best.id}`);
    return best;
  } catch(e) { log(`Viral search error in ${groupId}: ${e.message}`); return null; }
}

async function postCommentOnViral(viralPostId, commentText) {
  const body = JSON.stringify({message:commentText,access_token:GROUP_TOKEN});
  const options = {hostname:'graph.facebook.com',path:`/v19.0/${viralPostId}/comments`,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
  const data = await apiRequest(options, body);
  if(data.error) throw new Error(data.error.message);
  return data.id;
}

function buildCommentText(caption, utm, post) {
  const lines = caption.split('\n').filter(l => l.trim());
  const hook = lines[0] || post.title.toUpperCase();
  const body = lines.slice(1,3).join(' ').trim();
  const siteLine = post.aff ? '' : ' | onehealthglobe.com';
  return `${hook}\n\n${body}\n\n🔗 ${utm}${siteLine}`;
}

async function checkAndCommentFallback() {
  if(pendingGroupPosts.length === 0) return;
  const now = Date.now();
  const stillPending = [];
  for(const p of pendingGroupPosts) {
    const ageMin = (now - p.postedAt) / 60000;
    if(ageMin >= 30 && !p.commentFired) {
      log(`⏱️ ${p.groupName}: post pending ${Math.round(ageMin)}min — firing comment fallback`);
      const viralPost = await findViralPostInGroup(p.groupId);
      if(viralPost) {
        try {
          const commentText = buildCommentText(p.fullCaption, p.utm, {title:p.title,aff:p.aff||false});
          const commentId = await postCommentOnViral(viralPost.id, commentText);
          log(`💬 COMMENT posted on viral post in ${p.groupName} — Comment ID: ${commentId}`);
          p.commentFired = true; p.commentId = commentId; p.commentAt = Date.now();
          totalComments++; stillPending.push(p);
        } catch(e) { log(`💬 Comment failed in ${p.groupName}: ${e.message}`); p.commentFired = true; stillPending.push(p); }
      } else { log(`💬 No viral post found in ${p.groupName} — skipping comment`); p.commentFired = true; stillPending.push(p); }
    } else if(ageMin < 30) {
      stillPending.push(p);
    } else {
      const ageH = ageMin / 60;
      if(ageH < 72) stillPending.push(p);
      else { log(`⏰ ${p.groupName}: post expired 72h — retrying in new group`); await postToGroupWithRetry(p.fullCaption, p.imageUrl, p.utm, {title:p.title}, p.triedGroups||[]); }
    }
  }
  pendingGroupPosts = stillPending;
}
