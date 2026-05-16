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
const GMAIL_USER   = (process.env.GMAIL_USER || 'usamanazeerrp1@gmail.com').trim();
const GMAIL_PASS   = (process.env.GMAIL_PASS || '').trim().replace(/\s/g,'');
const NOTIFY_EMAIL = (process.env.NOTIFY_EMAIL || 'usamanazeerrp1@gmail.com').trim();

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

// ── POSTS — 62 REAL OHG URLS + PREMIUM IMAGE PROMPTS ───────────────────────
// Image prompt rules: photorealistic, premium brand style, magazine quality,
// warm natural lighting, proper composition, NOT cartoon, NOT illustration
const POSTS = [
  // ── DOG HEALTH & DISEASES ──
  {id:1,  title:"5 Silent Dog Diseases That Kill Before Owners Realize",
          cat:"Dog Health",
          url:`${BASE_URL}/top-5-deadly-common-dog-diseases-symptoms-prevention-treatment-pictures/`,
          imgPrompt:"close-up of a concerned veterinarian in white coat gently examining a golden retriever on a stainless steel exam table, soft clinic lighting, shallow depth of field, National Geographic style, photorealistic 4K",
          aff:false},
  {id:2,  title:"Why Dog Vaccines Are the Most Important Thing You Do This Year",
          cat:"Dog Health",
          url:`${BASE_URL}/dog-vaccines-matter-why-staying-current-protects-health-one-health-globe/`,
          imgPrompt:"professional vet carefully administering vaccine to a calm labrador puppy, warm golden clinic light, compassionate expression, clean medical setting, sharp focus on hands and dog, magazine-quality photograph",
          aff:false},
  {id:3,  title:"Is Your Dog's Paw Trying to Tell You Something?",
          cat:"Dog Care",
          url:`${BASE_URL}/dog-paw-scanner/`,
          imgPrompt:"extreme close-up of a healthy golden retriever paw held gently in human hands on green grass, warm sunlight, soft bokeh background, premium pet lifestyle photography, crystal clear detail",
          aff:false},
  {id:4,  title:"Ticks on Your Cat? Here's What You Must Do Right Now",
          cat:"Cat Health",
          url:`${BASE_URL}/protecting-cats-from-ticks-indoor-and-outdoor-risks-explained/`,
          imgPrompt:"focused lifestyle photo of a worried pet owner carefully checking a tabby cat's fur in a bright living room, natural window light, warm tones, sharp detail, cinematic composition",
          aff:false},
  {id:5,  title:"Your Cat Is Slowing Down — This Could Be Why",
          cat:"Cat Health",
          url:`${BASE_URL}/simple-tips-to-know-signs-of-osteoarthritis-in-cats/`,
          imgPrompt:"elegant senior cat lying peacefully on a cream-colored sofa, soft morning light from window, slight sad but serene expression, premium lifestyle photography, shallow depth of field, warm muted tones",
          aff:false},
  {id:6,  title:"The Zoonosis Risk In Your Home You Don't Know About",
          cat:"Pet Health",
          url:`${BASE_URL}/digital-awareness-to-minimize-zoonosis-spread/`,
          imgPrompt:"loving family — father, mother, child — sitting safely with a healthy clean dog on a bright living room floor, warm afternoon light, clean home, joyful yet educational mood, premium lifestyle photo",
          aff:false},
  {id:7,  title:"Animal Safety Is Human Safety — The One Health Connection",
          cat:"One Health",
          url:`${BASE_URL}/animal-safety-protects-human-safety-one-health-guide/`,
          imgPrompt:"aerial-style lifestyle photo of vet, family and healthy dog in green park, golden hour light, hopeful and educational mood, professional magazine composition, photorealistic",
          aff:false},

  // ── PET SAFETY & HOME ──
  {id:8,  title:"Room-by-Room Pet Safety Guide Every Owner Needs",
          cat:"Pet Safety",
          url:`${BASE_URL}/room-by-room-pet-safety-guide-for-families/`,
          imgPrompt:"bright modern home interior with a curious golden puppy exploring a spotless kitchen, safety-aware composition, warm natural light, premium real estate + pet lifestyle photography fusion",
          aff:false},
  {id:9,  title:"Indoor Cat Safety Mistakes That Put Your Pet at Risk",
          cat:"Cat Safety",
          url:`${BASE_URL}/indoor-cat-safety-checklist-for-everyday-home-risks/`,
          imgPrompt:"sleek tabby cat sitting on a modern minimalist kitchen counter, dramatic side window light, luxury home interior, fine art pet photography style, tack-sharp focus",
          aff:false},
  {id:10, title:"Family Pet Emergency Plan — Are You Prepared?",
          cat:"Pet Safety",
          url:`${BASE_URL}/family-pet-emergency-plan-template/`,
          imgPrompt:"responsible father holding a first aid kit with a golden retriever beside him, family in background, strong and calm emergency-preparedness mood, cinematic warm light, photorealistic",
          aff:false},
  {id:11, title:"New Dog Owner? This Safety Checklist Could Save Your Pet",
          cat:"Dog Safety",
          url:`${BASE_URL}/pet-safety-checklist-for-new-dog-owners/`,
          imgPrompt:"young excited couple holding a small puppy in a bright clean apartment, checklist visible on tablet, warm lifestyle photography, genuine emotion, bokeh background, premium quality",
          aff:false},
  {id:12, title:"Spring Pet Safety Checklist for Dogs and Cats",
          cat:"Pet Safety",
          url:`${BASE_URL}/spring-pet-safety-checklist-for-dogs-and-cats-easy-home-and-garden-tips/`,
          imgPrompt:"happy labrador running through a lush spring garden, golden sunlight, vibrant green grass, flowers in background, action photography freeze frame, premium lifestyle quality",
          aff:false},
  {id:13, title:"Pet-Friendly Garden Ideas That Keep Your Pet Safe",
          cat:"Pet Safety",
          url:`${BASE_URL}/pet-friendly-garden-ideas-for-safer-outdoor-play/`,
          imgPrompt:"beautiful well-designed garden with a beagle playing safely among pet-friendly plants, warm golden hour, professional garden lifestyle photography, lush and inviting composition",
          aff:false},
  {id:14, title:"Spring Break Pet Travel — The Complete Family Checklist",
          cat:"Pet Travel",
          url:`${BASE_URL}/spring-break-pet-travel-checklist-for-families/`,
          imgPrompt:"happy family loading car for road trip with golden retriever looking excited out the window, bright sunny day, lifestyle adventure photography, warm authentic emotion",
          aff:false},
  {id:15, title:"The Complete Pet Safety Hub for Responsible Owners",
          cat:"Pet Safety",
          url:`${BASE_URL}/pet-safety-hub/`,
          imgPrompt:"confident smiling pet owner sitting with a healthy well-groomed dog and cat together on a clean modern sofa, professional lifestyle photography, warm tones, premium composition",
          aff:false},

  // ── BREED GUIDES ──
  {id:16, title:"Why Beagles Make the Most Loyal Family Dogs",
          cat:"Breed Guide",
          url:`${BASE_URL}/beagle-temperament/`,
          imgPrompt:"adorable beagle with soulful brown eyes sitting in a sun-drenched park, family blurred in background, golden hour bokeh, premium pet portrait photography, sharp eyes in focus",
          aff:false},
  {id:17, title:"The Boxer Dog — Gentle Giant Your Whole Family Will Love",
          cat:"Breed Guide",
          url:`${BASE_URL}/boxer-breed-temperament/`,
          imgPrompt:"powerful yet gentle boxer dog sitting proudly in a lush backyard, child laughing beside it, warm afternoon light, full-frame professional pet photography, beautiful coat detail",
          aff:false},
  {id:18, title:"Why the Bulldog Is Actually Perfect for Apartment Life",
          cat:"Breed Guide",
          url:`${BASE_URL}/english-bulldog-temperament/`,
          imgPrompt:"wrinkly English bulldog relaxing on a luxury velvet sofa in a stylish apartment, moody warm light, editorial pet photography, perfect wrinkle texture detail, premium composition",
          aff:false},
  {id:19, title:"German Shepherd — The Dog That Would Do Anything for You",
          cat:"Breed Guide",
          url:`${BASE_URL}/german-shepherd-temperament/`,
          imgPrompt:"majestic German shepherd standing alert in a golden wheat field at sunset, dramatic backlight, hero dog portrait, National Geographic style, photorealistic 4K quality",
          aff:false},
  {id:20, title:"Rottweilers Are Deeply Misunderstood — Here's the Truth",
          cat:"Breed Guide",
          url:`${BASE_URL}/rottweiler-temperament/`,
          imgPrompt:"gentle rottweiler resting its head on owner's lap in a cozy living room, soft candlelight warmth, intimate bond captured beautifully, premium lifestyle pet photography",
          aff:false},
  {id:21, title:"The Pomeranian — Big Personality in an Irresistible Body",
          cat:"Breed Guide",
          url:`${BASE_URL}/pomeranian-dog-breed-temperament-care-guide/`,
          imgPrompt:"perfectly groomed fluffy pomeranian with fox-like face sitting on a white marble surface, studio-quality lighting, luxury pet photography, cloud-like fur detail, sharp eyes",
          aff:false},
  {id:22, title:"Labrador Retriever — The World's Most Beloved Family Dog",
          cat:"Breed Guide",
          url:`${BASE_URL}/`,
          imgPrompt:"golden labrador retriever catching a ball mid-air at sunset beach, action freeze photography, golden light, spray of water, powerful and joyful, premium sports pet photography",
          aff:false},
  {id:23, title:"French Bulldog — Small Dog With the Biggest Heart",
          cat:"Breed Guide",
          url:`${BASE_URL}/`,
          imgPrompt:"bat-eared French bulldog with striking blue eyes sitting on a cobblestone city street, editorial fashion-meets-pet photography, moody urban light, magazine cover quality",
          aff:false},
  {id:24, title:"Border Collie — The Smartest Dog Breed on Earth",
          cat:"Breed Guide",
          url:`${BASE_URL}/`,
          imgPrompt:"black and white border collie mid-herd in misty green Scottish highlands, professional wildlife-style photography, dramatic cloudy sky, intense focused eyes, photorealistic",
          aff:false},
  {id:25, title:"Cat Breeds Compared — Which One Is Right for Your Home?",
          cat:"Cat Guide",
          url:`${BASE_URL}/cat-breeds-comparison/`,
          imgPrompt:"four elegant cat breeds sitting together on a clean white studio backdrop — Persian, Siamese, Maine Coon, Ragdoll — professional studio lighting, luxury catalog photography",
          aff:false},

  // ── CAT GUIDES ──
  {id:26, title:"Why Everyone Falls in Love with Persian Cats",
          cat:"Cat Guide",
          url:`${BASE_URL}/persian-cat-temperament/`,
          imgPrompt:"stunning white Persian cat with amber eyes sitting on a velvet royal blue cushion, dramatic soft studio lighting, silk-like fur detail, luxury pet portrait photography, magazine quality",
          aff:false},
  {id:27, title:"The Ragdoll Cat — Floppy, Fluffy and Totally Irresistible",
          cat:"Cat Guide",
          url:`${BASE_URL}/ragdoll-temperament/`,
          imgPrompt:"beautiful blue-eyed ragdoll cat being cradled like a baby by a smiling woman in a sunlit room, ultra-soft fur visible, warm lifestyle photography, genuine bonding moment captured",
          aff:false},
  {id:28, title:"Your Complete Month-by-Month Kitten Growth Guide",
          cat:"Cat Guide",
          url:`${BASE_URL}/new-kitten-planner/`,
          imgPrompt:"tiny orange tabby kitten at exactly 8 weeks old sitting in a wicker basket surrounded by soft white blankets, natural window light, fine art pet photography, irresistible cuteness",
          aff:false},
  {id:29, title:"Groom Your Cat at Home Like a Pro — Zero Scratches",
          cat:"Cat Care",
          url:`${BASE_URL}/cat-grooming-guide-2/`,
          imgPrompt:"woman calmly grooming a fluffy Maine Coon cat with professional brush on a clean bathroom counter, soft warm lighting, focused and relaxed cat, premium lifestyle photography",
          aff:false},
  {id:30, title:"Yes, You Can Walk Your Cat — Here's the Complete Guide",
          cat:"Cat Guide",
          url:`${BASE_URL}/how-to-walk-your-cat-safely-harness-training-for-beginners/`,
          imgPrompt:"adventurous tabby cat confidently walking on a leash in a lush green park, owner's hand holding the leash visible, golden afternoon light, lifestyle adventure pet photography",
          aff:false},
  {id:31, title:"How to Stop Cat Scratches Before They Draw Blood",
          cat:"Cat Care",
          url:`${BASE_URL}/how-to-prevent-cat-paw-scratches-at-home/`,
          imgPrompt:"playful kitten batting at a premium cat scratching post with extended claws, freeze-frame action shot, warm home interior, sharp claw detail, professional pet photography",
          aff:false},
  {id:32, title:"The Healthy Cat-Human Bond That Changes Everything",
          cat:"Cat Guide",
          url:`${BASE_URL}/healthy-cat-bond-for-young-ladies-at-home/`,
          imgPrompt:"young woman lying on a cozy bedroom floor reading with a purring cat on her chest, afternoon golden light through curtains, intimate lifestyle photography, warm and peaceful mood",
          aff:false},

  // ── HEALTH & WELLNESS ──
  {id:33, title:"What's Actually Inside a Pet First Aid Kit?",
          cat:"Pet Health",
          url:`${BASE_URL}/pet-first-aid-kit-checklist/`,
          imgPrompt:"flat-lay top-down shot of an organized pet first aid kit contents on white marble — bandages, gloves, antiseptic, thermometer — perfect product styling photography, clinical and clean",
          aff:false},
  {id:34, title:"Never Miss a Pet Vaccine Again With This Tracker",
          cat:"Pet Health",
          url:`${BASE_URL}/pet-vaccine-tracker/`,
          imgPrompt:"organized vaccine record booklet beside a healthy beagle puppy on a clean vet desk, stethoscope visible, warm clinical light, premium healthcare lifestyle photography",
          aff:false},
  {id:35, title:"These Common House Plants Are Silently Poisoning Your Pet",
          cat:"Pet Safety",
          url:`${BASE_URL}/common-plants-that-may-be-toxic-to-pets/`,
          imgPrompt:"curious golden kitten sniffing a beautiful potted lily plant indoors, warning-awareness mood, dramatic side light, sharp focus on dangerous plant and cat face, editorial quality",
          aff:false},
  {id:36, title:"Score Your Pet's Hygiene — Take the 5-Minute Test",
          cat:"Pet Hygiene",
          url:`${BASE_URL}/pet-hygiene-score-card/`,
          imgPrompt:"freshly groomed happy golden retriever and Persian cat sitting side-by-side on a white studio backdrop, gleaming clean fur, bright professional studio lighting, luxury pet photography",
          aff:false},
  {id:37, title:"Answers to Pet Food Questions You Were Afraid to Ask",
          cat:"Pet Nutrition",
          url:`${BASE_URL}/pet-food-queries/`,
          imgPrompt:"premium dog food ingredients artfully arranged — fresh meat, vegetables, grains — alongside a healthy labrador looking up eagerly, styled food photography meets pet lifestyle",
          aff:false},
  {id:38, title:"Healthy Pets + Happy Humans — The Bond Science Proves",
          cat:"Pet Wellness",
          url:`${BASE_URL}/healthy-pets-and-human-bond-for-family-life/`,
          imgPrompt:"joyful family of four running in a park with their golden retriever, sunset light, motion blur on grass, candid lifestyle photography, genuine happiness, cinematic composition",
          aff:false},
  {id:39, title:"Brain Games for Dogs and Cats That Prevent Boredom",
          cat:"Pet Training",
          url:`${BASE_URL}/best-cognitive-exercises-that-can-change-your-brain/`,
          imgPrompt:"smart border collie solving a wooden puzzle toy with intense focus, premium lifestyle photography, sharp eye detail, warm indoor light, intellectual and engaging composition",
          aff:false},
  {id:40, title:"Basic Pet Training Tools That Actually Work at Home",
          cat:"Pet Training",
          url:`${BASE_URL}/basic-pet-training-tools-for-better-command-prompting-and-home-behavior/`,
          imgPrompt:"dog trainer in modern home holding clicker while labrador sits perfectly on command, clean composition, warm natural light, professional training lifestyle photography",
          aff:false},
  {id:41, title:"Your Dog and Cat Vaccine Record — Keep It Updated",
          cat:"Pet Health",
          url:`${BASE_URL}/dog-and-cat-vaccine-tracker-for-pet-owners/`,
          imgPrompt:"close-up of organized colorful pet health records on a desk with a pen and a happy puppy in the background, premium lifestyle and healthcare photography blend",
          aff:false},

  // ── PET CARE RESOURCES ──
  {id:42, title:"The Ultimate Pet Safety Hub — Everything in One Place",
          cat:"Resources",
          url:`${BASE_URL}/useful-checklists-and-care-resources-to-support-everyday-pet-life/`,
          imgPrompt:"neat flat-lay of pet care essentials — leash, brush, bowl, treats, toy, first aid — on a clean wooden surface, professional product styling, warm natural light, magazine quality",
          aff:false},
  {id:43, title:"Free Pet Care Booklet — Download and Save It Today",
          cat:"Resources",
          url:`${BASE_URL}/free-pet-care-faq-booklet/`,
          imgPrompt:"attractive pet care guide booklet on a clean wooden desk with a happy dog beside it, warm home office light, editorial lifestyle photography, premium and trustworthy",
          aff:false},
  {id:44, title:"Helpful Everyday Wellness Ideas for Safer, Smarter Pets",
          cat:"Pet Wellness",
          url:`${BASE_URL}/helpful-everyday-wellness-ideas-for-safer-pets-and-smarter-homes/`,
          imgPrompt:"woman doing morning yoga while her calm cat sits on a mat beside her, soft sunrise light, holistic wellness lifestyle photography, serene and aspirational mood",
          aff:false},
  {id:45, title:"Pet Home Safety — The Room-by-Room Guide for Families",
          cat:"Pet Safety",
          url:`${BASE_URL}/pet-home-safety-guide-for-families-2/`,
          imgPrompt:"architect-style overhead view of a beautiful modern home floor plan with a golden retriever visible in kitchen, premium interior lifestyle photography, editorial quality",
          aff:false},

  // ── AFFILIATE PRODUCTS ──
  {id:46, title:"The LED Nail Clipper That Makes Grooming Stress-Free",
          cat:"Product",
          url:"https://www.dhgate.com/product/led-light-pet-nail-clipper-with-amplification/1010092124.html",
          imgPrompt:"premium LED pet nail clipper displayed on a clean marble surface with soft diffused studio light, luxury product photography, sharp detail on the clipper head, white background",
          aff:true},
  {id:47, title:"This Grooming Kit Handles Everything Your Pet Needs",
          cat:"Product",
          url:"https://www.dhgate.com/product/combs-dog-hair-remover-cat-brush-grooming/1028087374.html",
          imgPrompt:"elegant flat-lay of a complete pet grooming kit — combs, brushes, scissors — arranged perfectly on a dark wood surface, luxury product styling, dramatic moody lighting",
          aff:true},
  {id:48, title:"See Exactly What Your Dog Does When You're Not Home",
          cat:"Product",
          url:"https://www.dhgate.com/product/dog-collars-hd-1080p-wireless-collar-camera/1032506070.html",
          imgPrompt:"sleek smart dog collar with embedded camera on a golden retriever's neck outdoors, tech product meets lifestyle photography, shallow depth of field, premium gadget feel",
          aff:true},
  {id:49, title:"The 2-in-1 Pet Stroller That Changes Every Walk",
          cat:"Product",
          url:"https://bestchoiceproducts.com/products/2-in-1-pet-dog-bike-trailer",
          imgPrompt:"happy small white dog sitting regally in a premium navy blue pet stroller in a sunny park, lifestyle product photography, lush green background, luxury pet brand feel",
          aff:true},
  {id:50, title:"8-Piece Grooming Kit That Cleans Itself While You Use It",
          cat:"Product",
          url:"https://www.dhgate.com/product/8pcs-set-dog-grooming-kit-self-cleaning-pet/1087614127.html",
          imgPrompt:"satisfied fluffy Samoyed dog mid-groom with electric self-cleaning brush, studio lighting, clean white background, professional pet product photography, sharp fur detail",
          aff:true},
  {id:51, title:"Clean Your Dog's Paws in 10 Seconds — No Water Needed",
          cat:"Product",
          url:"https://www.dhgate.com/product/pet-foot-paw-cleaner-100ml-foam-waterless/1010228089.html",
          imgPrompt:"dog paw being sprayed with foam cleanser held by careful hands, clean white background, clinical product photography, sharp foam and paw detail, premium and trustworthy",
          aff:true},
  {id:52, title:"Keep Your Dog's Teeth Sparkling With This Simple Tool",
          cat:"Product",
          url:"https://www.dhgate.com/product/100-pieces-batch-of-pet-finger-toothbrushes/1010228766.html",
          imgPrompt:"dog smiling with clean white teeth as owner uses finger toothbrush, close-up dental lifestyle photography, bright clean tones, premium pet health product visual",
          aff:true},
  {id:53, title:"Vet-Recommended Shampoo for Dogs With Sensitive Skin",
          cat:"Product",
          url:"https://www.dhgate.com/product/pet-shampoo-for-cats-and-dogs-cleansing-bathing/1089431467.html",
          imgPrompt:"golden retriever in a luxury bath tub being washed with premium shampoo, spa-style pet photography, warm steamy bathroom light, fluffy suds, joyful dog expression",
          aff:true},

  // ── SPECIAL TOPICS ──
  {id:54, title:"How a Healthy Bond With Your Cat Improves Your Life",
          cat:"Cat Wellness",
          url:`${BASE_URL}/healthy-cat-bond-for-young-ladies-at-home/`,
          imgPrompt:"peaceful young woman meditating on a white bed while an elegant cat sits beside her, soft morning light, fine art lifestyle photography, calm and aspirational mood",
          aff:false},
  {id:55, title:"Safe Drinking Water for Pets — 7 Rules You Must Follow",
          cat:"Pet Health",
          url:`${BASE_URL}/safe-drinking-water-at-home-7-hygiene-rules-2/`,
          imgPrompt:"happy golden retriever drinking from a sparkling clean modern pet water fountain, premium lifestyle photography, clean kitchen backdrop, crystal clear water detail",
          aff:false},
  {id:56, title:"How Pets Protect Children's Mental Health at Home",
          cat:"Pet Wellness",
          url:`${BASE_URL}/kids-off-screens-best-alternatives-for-eye-health/`,
          imgPrompt:"young child laughing and playing with a fluffy puppy on a bright living room rug, genuine joy captured, warm natural light, premium lifestyle family photography",
          aff:false},
  {id:57, title:"One Health — Why Protecting Animals Protects All of Us",
          cat:"One Health",
          url:`${BASE_URL}/one-health-a-pillar-for-climate-sustainability/`,
          imgPrompt:"wildlife veterinarian examining a bird in lush green forest, golden light rays through trees, documentary-style photography, powerful One Health message, National Geographic quality",
          aff:false},
  {id:58, title:"Your Pet Is Your Family — Here's How to Treat Them Like It",
          cat:"Pet Wellness",
          url:`${BASE_URL}/pet-safety-hub/`,
          imgPrompt:"multi-generational family — grandparents, parents, children — all sitting together with a golden retriever in a sunlit living room, authentic joy, premium lifestyle photography",
          aff:false},
  {id:59, title:"The Complete Dog Vaccine Guide — What Every Owner Must Know",
          cat:"Dog Health",
          url:`${BASE_URL}/pet-vaccine-tracker/`,
          imgPrompt:"vet in a modern clinic showing vaccine schedule on tablet to attentive dog owner with golden puppy on the table, trust and professionalism, warm clinical lifestyle photography",
          aff:false},
  {id:60, title:"Pet Food FAQ — Every Question Answered By Experts",
          cat:"Pet Nutrition",
          url:`${BASE_URL}/pet-food-queries/`,
          imgPrompt:"premium dry and wet pet food perfectly plated in ceramic bowls beside healthy dog and cat, styled food + lifestyle photography, warm kitchen backdrop, magazine quality",
          aff:false},
  {id:61, title:"How to Keep Your Pet Safe This Season — Full Guide",
          cat:"Pet Safety",
          url:`${BASE_URL}/pet-safety-hub/`,
          imgPrompt:"responsible pet owner reading a safety guide with a healthy husky beside them in a cozy autumn home, warm amber light, lifestyle editorial photography, premium composition",
          aff:false},
  {id:62, title:"Train Your Pet Better With These 5 Proven Tools",
          cat:"Pet Training",
          url:`${BASE_URL}/basic-pet-training-tools-for-better-command-prompting-and-home-behavior/`,
          imgPrompt:"confident dog trainer working with an attentive German shepherd using hand signals in a bright outdoor setting, professional training lifestyle photography, warm light, sharp focus",
          aff:false},
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

  const idx = postIndex % 62;
  const round = Math.floor(postIndex / 62) + 1;
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
      lastPagePostUrl = `https://www.facebook.com/${FB_PAGE_ID}/posts/${pageId.split('_')[1]||pageId}`;
      lastPagePostTitle = post.title;
      // Send hourly email with next 2 groups to share manually
      sendHourlyGroupEmail(lastPagePostUrl, lastPagePostTitle).catch(e => log('📧 Email err: '+e.message));
    } catch(e) { log(`❌ PAGE failed: ${e.message}`); }

    await postToGroupWithRetry(fullCaption, imageUrl, utm, post);

    postIndex++;
    styleIndex++;
    const nextPost = POSTS[postIndex % 62];
    log(`Done. Total: ${totalPosted} page | ${totalGroupPosted} group | Pending: ${pendingGroupPosts.length}`);
    log(`Next: P${String(nextPost.id).padStart(2,'0')} — ${nextPost.title}`);

  } catch(err) {
    log(`ERROR — ${err.message}`);
    if(err.message.includes('token') || err.message.includes('OAuthException')) await fetchPageToken();
    postIndex++; styleIndex++;
  }
}

// ── EMAIL NOTIFICATION SYSTEM ────────────────────────────────────────────────
let lastPagePostUrl = '';
let lastPagePostTitle = '';
let groupEmailIndex = 0; // tracks which 2 groups to send next

function sendEmail(subject, htmlBody) {
  return new Promise((resolve) => {
    if(!GMAIL_PASS) { log('Email skipped - GMAIL_PASS not set'); resolve(false); return; }
    const net = require('net');
    const tls = require('tls');
    const authPlain = Buffer.from('\0' + GMAIL_USER + '\0' + GMAIL_PASS).toString('base64');
    const msg = [
      'From: OHG Autopilot <' + GMAIL_USER + '>',
      'To: ' + NOTIFY_EMAIL,
      'Subject: ' + subject,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody
    ].join('\r\n');
    const tlsCmds = [
      'EHLO railway\r\n',
      'AUTH PLAIN ' + authPlain + '\r\n',
      'MAIL FROM:<' + GMAIL_USER + '>\r\n',
      'RCPT TO:<' + NOTIFY_EMAIL + '>\r\n',
      'DATA\r\n',
      msg + '\r\n.\r\n',
      'QUIT\r\n'
    ];
    let tlsStep = 0;
    let plainStep = 0;
    const sock = net.connect(587, 'smtp.gmail.com');
    sock.setTimeout(20000, () => { log('Email timeout'); sock.destroy(); resolve(false); });
    sock.on('error', e => { log('Email socket error: ' + e.message); resolve(false); });
    sock.on('data', d => {
      const r = d.toString();
      if(plainStep === 0 && r.includes('220')) { sock.write('EHLO railway\r\n'); plainStep++; return; }
      if(plainStep === 1 && r.includes('250')) { sock.write('STARTTLS\r\n'); plainStep++; return; }
      if(plainStep === 2 && r.includes('220')) {
        const tlsSock = tls.connect({socket: sock, rejectUnauthorized: false}, () => {
          tlsSock.write(tlsCmds[tlsStep++]);
          tlsSock.on('data', td => {
            const tr = td.toString();
            if(tr.includes('221')) { tlsSock.destroy(); log('Email sent OK: ' + subject); resolve(true); return; }
            if(tr.match(/^(220|250|235|354)/m) && tlsStep < tlsCmds.length) { tlsSock.write(tlsCmds[tlsStep++]); }
            else if(tr.match(/^5\d\d/m)) { log('Email TLS error: ' + tr.substring(0,60)); tlsSock.destroy(); resolve(false); }
          });
          tlsSock.on('error', e => { log('Email TLS err: ' + e.message); resolve(false); });
        });
        plainStep++;
      }
    });
  });
}

function buildHourlyEmail(postUrl, postTitle, group1, group2, emailNum, totalGroups) {
  const now = new Date().toLocaleString('en-US', {timeZone:'America/New_York', hour:'numeric', minute:'2-digit', hour12:true});
  const shareUrl1 = `https://www.facebook.com/groups/${group1.id}`;
  const shareUrl2 = `https://www.facebook.com/groups/${group2.id}`;

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px;background:#f0f2f5">

<div style="background:#0a0f0d;color:#2dff8e;padding:20px;border-radius:12px;text-align:center;margin-bottom:16px">
  <h1 style="margin:0;font-size:22px">🐾 OHG Pet Autopilot</h1>
  <p style="margin:6px 0 0;color:#7a9e85;font-size:13px">Hourly Share Reminder • ${now} EST</p>
</div>

<div style="background:#d4edda;border:1px solid #c3e6cb;border-radius:10px;padding:18px;margin-bottom:16px;text-align:center">
  <p style="margin:0 0 6px;color:#155724;font-size:13px;font-weight:bold">📢 POST TO SHARE</p>
  <p style="margin:0 0 14px;color:#155724;font-size:15px"><strong>${postTitle}</strong></p>
  <a href="${postUrl}" style="background:#1877f2;color:white;padding:11px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">👁 View Page Post</a>
</div>

<div style="background:white;border-radius:10px;padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.1)">
  <p style="margin:0 0 16px;color:#333;font-size:15px;font-weight:bold;text-align:center">📤 Share to 2 Groups Now (takes 60 seconds)</p>

  <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:12px;text-align:center">
    <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px">Group ${emailNum * 2 - 1} of ${totalGroups}</p>
    <p style="margin:0 0 12px;color:#333;font-size:16px;font-weight:bold">${group1.name}</p>
    <a href="${shareUrl1}" style="background:#42b72a;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">✅ Open Group 1 →</a>
  </div>

  <div style="background:#f8f9fa;border-radius:8px;padding:16px;text-align:center">
    <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px">Group ${emailNum * 2} of ${totalGroups}</p>
    <p style="margin:0 0 12px;color:#333;font-size:16px;font-weight:bold">${group2.name}</p>
    <a href="${shareUrl2}" style="background:#42b72a;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">✅ Open Group 2 →</a>
  </div>
</div>

<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px;margin-bottom:16px">
  <strong>💡 How to share in 3 taps:</strong><br>
  1️⃣ Click a group button above<br>
  2️⃣ Find the pinned post or go to your Page post<br>
  3️⃣ Tap <strong>Share → Share to Group</strong> → Done!
</div>

<div style="background:white;border-radius:8px;padding:12px;font-size:11px;color:#888;text-align:center">
  Email ${emailNum} of ${totalGroups/2} today &nbsp;|&nbsp; Next email in ~1 hour<br>
  <a href="https://ohg-pet-autopilot-production.up.railway.app" style="color:#1877f2">Live Dashboard</a> • onehealthglobe.com
</div>
</body></html>`;
}

// Called right after each successful page post — sends hourly email with next 2 groups
async function sendHourlyGroupEmail(postUrl, postTitle) {
  const activeGroups = PET_GROUPS.filter(g => !groupStats[g.id].permanent);
  if(activeGroups.length < 2) { log('📧 Not enough active groups for email'); return; }

  // Pick next 2 groups in rotation
  const idx1 = groupEmailIndex % activeGroups.length;
  const idx2 = (groupEmailIndex + 1) % activeGroups.length;
  const group1 = activeGroups[idx1];
  const group2 = activeGroups[idx2];
  const emailNum = Math.floor(groupEmailIndex / 2) + 1;
  const totalGroups = Math.min(activeGroups.length, 20); // cap display at 20

  groupEmailIndex = (groupEmailIndex + 2) % activeGroups.length;

  const subject = `🐾 Share Now: ${group1.name} + ${group2.name} — "${postTitle.substring(0,35)}"`;
  const html = buildHourlyEmail(postUrl, postTitle, group1, group2, emailNum, totalGroups);
  await sendEmail(subject, html);
  log(`📧 Hourly email sent for ${group1.name} + ${group2.name}`);
}

// STARTUP
log('OHG Pet Autopilot Server v5 starting...');
log(`Posts: 62 | Groups: ${PET_GROUPS.length} | Interval: ${INTERVAL_MS/60000}min | Hours: ${ACTIVE_FROM}-${ACTIVE_TO} EST`);
log(`Token: ${FB_SYS_TOKEN?'SET len='+FB_SYS_TOKEN.length:'MISSING'} | Claude: ${CLAUDE_KEY?'SET':'MISSING'}`);
log(`Group token: ${GROUP_TOKEN && GROUP_TOKEN!==FB_SYS_TOKEN?'SEPARATE (len='+GROUP_TOKEN.length+')':'using FB_TOKEN (no publish_to_groups yet)'}`);
log(`Email: ${GMAIL_PASS?'✅ configured → '+NOTIFY_EMAIL:'⚠️ GMAIL_PASS not set'}`);

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
    const nextPost = POSTS[postIndex % 62];
    const activeG  = PET_GROUPS.filter(g => !groupStats[g.id].permanent).length;
    const bannedG  = PET_GROUPS.filter(g => groupStats[g.id].permanent).length;
    const coolG    = PET_GROUPS.filter(g => groupStats[g.id].cooldown && !groupStats[g.id].permanent).length;
    const nextGroup = pickNextGroup() || PET_GROUPS[0];
    const payload = {
      server:'OHG Pet Autopilot v5', time_est:est.toISOString(), is_active:isActiveHour(),
      post_index:postIndex%62+1, round:Math.floor(postIndex/62)+1,
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
  const nextPost = POSTS[postIndex % 62];
  const nextGroup = pickNextGroup() || PET_GROUPS[0];
  const round = Math.floor(postIndex / 62) + 1;
  const permanentGroups = PET_GROUPS.filter(g => groupStats[g.id].permanent);
  const activeGroups = PET_GROUPS.filter(g => !groupStats[g.id].permanent);
  const html = `<!DOCTYPE html>
<html><head><title>OHG Pet Autopilot v5</title><meta http-equiv="refresh" content="30">
<style>*{box-sizing:border-box;}body{font-family:Arial;background:#0a0f0d;color:#e8f5ec;padding:16px;max-width:1100px;margin:0 auto;font-size:13px;}h1{color:#2dff8e;margin:0 0 4px;}h3{color:#7a9e85;margin:12px 0 6px;}.stat{display:inline-block;background:#111a15;border:1px solid #1e2e23;border-radius:8px;padding:10px 16px;margin:4px;text-align:center;min-width:90px;}.sv{font-size:22px;font-weight:bold;color:#2dff8e;}.sl{font-size:10px;color:#4a6652;margin-top:3px;}.badge{background:#1a2e20;border:1px solid #2dff8e;border-radius:4px;padding:1px 7px;font-size:10px;color:#2dff8e;margin-left:6px;}table{width:100%;border-collapse:collapse;font-size:11px;}td,th{padding:4px 8px;text-align:left;border-bottom:1px solid #1a2e1a;}th{color:#2dff8e;background:#0d1a10;}.log{background:#000;border-radius:8px;padding:12px;font-family:monospace;font-size:10px;max-height:400px;overflow-y:auto;}.log div{padding:1px 0;border-bottom:1px solid #080808;}.box{background:#0d1a10;border:1px solid #1e2e23;border-radius:8px;padding:12px;margin:10px 0;}.warn{border-color:#ff8c00;background:#120d00;}.ok{color:#2dff8e;}.err{color:#ff5252;}.info{color:#64b5f6;}.warn-t{color:#ffb830;}</style></head>
<body>
<h1>🐾 OHG Pet Autopilot v5 <span class="badge">62 Posts · 51 Groups · 24/7 · AI Images</span></h1>
<p style="color:#4a6652">${est.toLocaleString('en-US',{timeZone:'America/New_York'})} EST &nbsp;|&nbsp; Auto-refresh 30s &nbsp;|&nbsp; Round ${round} of ∞</p>
<div>
  <div class="stat"><div class="sv">${totalPosted}</div><div class="sl">Page Posts</div></div>
  <div class="stat"><div class="sv">${totalGroupPosted}</div><div class="sl">Group Posts</div></div>
  <div class="stat"><div class="sv">${totalComments}</div><div class="sl">💬 Comments</div></div>
  <div class="stat"><div class="sv">${postIndex%62+1}/62</div><div class="sl">Post Index</div></div>
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
