const https = require('https');
const http = require('http');

const FB_SYS_TOKEN = (process.env.FB_TOKEN || '').trim().replace(/['"]/g,'');
const FB_PAGE_ID   = (process.env.FB_PAGE_ID || '1593329474221951').trim().replace(/['"]/g,'');
const FB_APP_ID    = (process.env.FB_APP_ID    || '').trim().replace(/['"]/g,'');
const FB_APP_SECRET= (process.env.FB_APP_SECRET|| '').trim().replace(/['"]/g,'');
const CLAUDE_KEY   = (process.env.CLAUDE_KEY || '').trim().replace(/['"]/g,'');
const GROUP_TOKEN  = (process.env.GROUP_TOKEN || process.env.FB_TOKEN || '').trim().replace(/['"]/g,'');
const BASE_URL     = (process.env.BASE_URL || 'https://onehealthglobe.com').trim().replace(/['"]/g,'');
const UTM_CAMP     = (process.env.UTM_CAMP || 'pet_daily').trim().replace(/['"]/g,'');
const INTERVAL_MS  = parseInt((process.env.INTERVAL_MS || '10800000').replace(/['"]/g,''));
const ACTIVE_FROM  = parseInt((process.env.ACTIVE_FROM || '0').replace(/['"]/g,''));
const ACTIVE_TO    = parseInt((process.env.ACTIVE_TO || '23').replace(/['"]/g,''));
const NOTIFY_EMAIL = (process.env.NOTIFY_EMAIL || 'usamanazeerrp1@gmail.com').trim();

const IMG_SUFFIX = ', single scene only, photorealistic, National Geographic quality, natural lighting, NO text overlay, NO collage, NO split panels, NO distorted anatomy, NO multiple images, ultra sharp focus, 4K professional photography, genuine authentic look';

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

const groupStats = {};
PET_GROUPS.forEach(g => { groupStats[g.id] = { success:0, fail:0, lastFail:0, cooldown:false }; });
let pendingGroupPosts = [];
let postedGroupsThisCycle = new Set();

const POSTS = [
  {id:1,  title:"5 Silent Dog Diseases That Kill Before Owners Realize", cat:"Dog Health", url:`${BASE_URL}/top-5-deadly-common-dog-diseases-symptoms-prevention-treatment-pictures/`, imgPrompt:"a caring male veterinarian in white coat examining a calm golden retriever on a clinic table, vet face fully visible and natural, dog lying still with gentle eyes, bright clinic window light, single clean professional scene",aff:false},
  {id:2,  title:"Why Dog Vaccines Are the Most Important Thing You Do This Year", cat:"Dog Health", url:`${BASE_URL}/dog-vaccines-matter-why-staying-current-protects-health-one-health-globe/`, imgPrompt:"a smiling female veterinarian in scrubs standing beside a golden labrador puppy sitting on a clinic table, vet face naturally visible and warm, puppy alert and looking at camera, bright clean clinic, single professional lifestyle scene",aff:false},
  {id:3,  title:"Is Your Dog's Paw Trying to Tell You Something?", cat:"Dog Care", url:`${BASE_URL}/dog-paw-scanner/`, imgPrompt:"extreme close-up of a single healthy golden retriever paw resting on fresh green grass, paw perfectly formed with natural fur between toes, warm sunlight, soft garden bokeh background, NO humans in frame whatsoever",aff:false},
  {id:4,  title:"Ticks on Your Cat? Here's What You Must Do Right Now", cat:"Cat Health", url:`${BASE_URL}/protecting-cats-from-ticks-indoor-and-outdoor-risks-explained/`, imgPrompt:"a tabby cat sitting on a wooden floor being gently examined, woman shown from chest level wearing casual top, cat face sharp and calm looking at camera, warm living room window light, single clean indoor scene",aff:false},
  {id:5,  title:"Your Cat Is Slowing Down — This Could Be Why", cat:"Cat Health", url:`${BASE_URL}/simple-tips-to-know-signs-of-osteoarthritis-in-cats/`, imgPrompt:"a senior grey tabby cat lying peacefully on a cream sofa cushion, eyes half closed relaxed, full cat body visible, soft morning window light, no humans in frame, single serene indoor pet portrait",aff:false},
  {id:6,  title:"The Zoonosis Risk In Your Home You Don't Know About", cat:"Pet Health", url:`${BASE_URL}/digital-awareness-to-minimize-zoonosis-spread/`, imgPrompt:"a happy family of three — father mother young child — sitting on a clean bright living room rug with a healthy golden retriever, all three faces naturally smiling and clearly visible, warm afternoon sunlight, single candid lifestyle scene",aff:false},
  {id:7,  title:"Animal Safety Is Human Safety — The One Health Connection", cat:"One Health", url:`${BASE_URL}/animal-safety-protects-human-safety-one-health-guide/`, imgPrompt:"a confident female vet in green scrubs crouching beside a healthy border collie in a bright green park, vet face naturally smiling and visible, dog alert looking forward, golden afternoon light, single clean outdoor scene",aff:false},
  {id:8,  title:"Room-by-Room Pet Safety Guide Every Owner Needs", cat:"Pet Safety", url:`${BASE_URL}/room-by-room-pet-safety-guide-for-families/`, imgPrompt:"a golden retriever puppy sitting on a clean bright modern kitchen floor looking curiously at camera, natural morning light from large window, full dog body visible, no humans, single indoor pet lifestyle scene",aff:false},
  {id:9,  title:"Indoor Cat Safety Mistakes That Put Your Pet at Risk", cat:"Cat Safety", url:`${BASE_URL}/indoor-cat-safety-checklist-for-everyday-home-risks/`, imgPrompt:"an elegant short-haired tabby cat sitting upright on a white kitchen counter looking directly at camera, dramatic side window light, clean minimalist background, no humans, single focused indoor cat portrait",aff:false},
  {id:10, title:"Family Pet Emergency Plan — Are You Prepared?", cat:"Pet Safety", url:`${BASE_URL}/family-pet-emergency-plan-template/`, imgPrompt:"a confident father standing in a bright living room holding a red first aid kit with a golden retriever sitting beside his feet, man face fully visible and calm, dog looking at camera, warm home lighting, single clean lifestyle scene",aff:false},
  {id:11, title:"New Dog Owner? This Safety Checklist Could Save Your Pet", cat:"Dog Safety", url:`${BASE_URL}/pet-safety-checklist-for-new-dog-owners/`, imgPrompt:"a happy young couple sitting on a bright apartment floor with a small beagle puppy between them, both faces fully visible and genuinely smiling, puppy looking at camera, warm indoor light, single candid lifestyle scene",aff:false},
  {id:12, title:"Spring Pet Safety Checklist for Dogs and Cats", cat:"Pet Safety", url:`${BASE_URL}/spring-pet-safety-checklist-for-dogs-and-cats-easy-home-and-garden-tips/`, imgPrompt:"a golden labrador running joyfully through a lush spring garden, full dog body in motion captured mid-stride, tongue out happily, vibrant green grass, soft flower bokeh background, no humans, single energetic outdoor scene",aff:false},
  {id:13, title:"Pet-Friendly Garden Ideas That Keep Your Pet Safe", cat:"Pet Safety", url:`${BASE_URL}/pet-friendly-garden-ideas-for-safer-outdoor-play/`, imgPrompt:"a beagle dog standing in a beautifully maintained garden with colorful safe flowers, full dog body visible and alert, warm golden hour light, lush green surrounding plants, no humans, single serene garden scene",aff:false},
  {id:14, title:"Spring Break Pet Travel — The Complete Family Checklist", cat:"Pet Travel", url:`${BASE_URL}/spring-break-pet-travel-checklist-for-families/`, imgPrompt:"a happy family loading a car on a sunny day, a golden retriever sitting in the open car boot looking excitedly at camera, family members faces visible and smiling in background, single bright outdoor candid scene",aff:false},
  {id:15, title:"The Complete Pet Safety Hub for Responsible Owners", cat:"Pet Safety", url:`${BASE_URL}/pet-safety-hub/`, imgPrompt:"a smiling woman sitting on a white modern sofa with a well-groomed golden retriever on her right and a fluffy cat on her lap, woman face clearly visible and natural, both pets calm looking at camera, warm home lighting, single lifestyle scene",aff:false},
  {id:16, title:"Why Beagles Make the Most Loyal Family Dogs", cat:"Breed Guide", url:`${BASE_URL}/beagle-temperament/`, imgPrompt:"a beautiful beagle sitting upright in a sunny park, face forward with soulful brown eyes tack-sharp, golden hour light warming the coat, green blurred background, no humans, single premium pet portrait",aff:false},
  {id:17, title:"The Boxer Dog — Gentle Giant Your Whole Family Will Love", cat:"Breed Guide", url:`${BASE_URL}/boxer-breed-temperament/`, imgPrompt:"a powerful brindle boxer dog sitting proudly in a green backyard, full body visible, face sharp and alert toward camera, warm afternoon sunlight on coat, no humans, single outdoor pet portrait",aff:false},
  {id:18, title:"Why the Bulldog Is Actually Perfect for Apartment Life", cat:"Breed Guide", url:`${BASE_URL}/english-bulldog-temperament/`, imgPrompt:"a wrinkly English bulldog lying comfortably on a grey velvet sofa in a stylish apartment, face forward in sharp focus showing natural wrinkles, warm lamp light, no humans, single cozy indoor scene",aff:false},
  {id:19, title:"German Shepherd — The Dog That Would Do Anything for You", cat:"Breed Guide", url:`${BASE_URL}/german-shepherd-temperament/`, imgPrompt:"a majestic black and tan German shepherd standing alert in an open golden wheat field at sunset, full body side profile, ears erect, dramatic warm backlight rim lighting fur, no humans, single heroic outdoor portrait",aff:false},
  {id:20, title:"Rottweilers Are Deeply Misunderstood — Here's the Truth", cat:"Breed Guide", url:`${BASE_URL}/rottweiler-temperament/`, imgPrompt:"a gentle Rottweiler with soft eyes lying with its head resting on a couch cushion in a cozy living room, full dog face in sharp focus, warm lamp light, no humans visible, single intimate indoor pet portrait",aff:false},
  {id:21, title:"The Pomeranian — Big Personality in an Irresistible Body", cat:"Breed Guide", url:`${BASE_URL}/pomeranian-dog-breed-temperament-care-guide/`, imgPrompt:"a perfectly groomed fluffy orange Pomeranian sitting on a clean white surface, face forward with bright eyes and fox-like expression, soft studio light from left, no humans, single premium luxury pet portrait",aff:false},
  {id:22, title:"Labrador Retriever — The World's Most Beloved Family Dog", cat:"Breed Guide", url:`${BASE_URL}/`, imgPrompt:"a golden Labrador retriever leaping joyfully at a beach at sunset, full body airborne freeze frame, warm golden light, ocean bokeh background, no humans, single dynamic outdoor pet scene",aff:false},
  {id:23, title:"French Bulldog — Small Dog With the Biggest Heart", cat:"Breed Guide", url:`${BASE_URL}/`, imgPrompt:"a French bulldog with large bat ears sitting on a cobblestone street, face in sharp focus looking at camera with expressive eyes, moody soft city light, no humans, single street-style pet portrait",aff:false},
  {id:24, title:"Border Collie — The Smartest Dog Breed on Earth", cat:"Breed Guide", url:`${BASE_URL}/`, imgPrompt:"a black and white border collie standing alert in a misty highland meadow, intense eyes looking directly at camera, full body visible, dramatic sky background, no humans, single premium outdoor portrait",aff:false},
  {id:25, title:"Cat Breeds Compared — Which One Is Right for Your Home?", cat:"Cat Guide", url:`${BASE_URL}/cat-breeds-comparison/`, imgPrompt:"a single fluffy white Persian cat sitting elegantly on a light wooden floor, face forward with large amber eyes in sharp focus, soft diffused studio light, no humans, single luxury cat portrait",aff:false},
  {id:26, title:"Why Everyone Falls in Love with Persian Cats", cat:"Cat Guide", url:`${BASE_URL}/persian-cat-temperament/`, imgPrompt:"a stunning white Persian cat sitting on a royal blue velvet cushion, amber eyes glowing and sharp, silky fur perfectly groomed, dramatic overhead studio light, no humans, single premium cat portrait",aff:false},
  {id:27, title:"The Ragdoll Cat — Floppy, Fluffy and Totally Irresistible", cat:"Cat Guide", url:`${BASE_URL}/ragdoll-temperament/`, imgPrompt:"a beautiful blue-eyed ragdoll cat being cradled in the arms of a smiling woman, woman face naturally visible and warm, cat completely relaxed looking at camera, soft sunlit indoor scene, single lifestyle portrait",aff:false},
  {id:28, title:"Your Complete Month-by-Month Kitten Growth Guide", cat:"Cat Guide", url:`${BASE_URL}/new-kitten-planner/`, imgPrompt:"a tiny orange tabby kitten sitting inside a small wicker basket lined with soft white wool, eyes wide and curious looking at camera, natural side window light, no humans, single irresistible pet portrait",aff:false},
  {id:29, title:"Groom Your Cat at Home Like a Pro — Zero Scratches", cat:"Cat Care", url:`${BASE_URL}/cat-grooming-guide-2/`, imgPrompt:"a relaxed fluffy Maine Coon cat sitting calmly being gently brushed, woman shown from shoulders down in casual clothes, cat face in sharp focus looking peaceful, warm bathroom light, single clean lifestyle scene",aff:false},
  {id:30, title:"Yes, You Can Walk Your Cat — Here's the Complete Guide", cat:"Cat Guide", url:`${BASE_URL}/how-to-walk-your-cat-safely-harness-training-for-beginners/`, imgPrompt:"a confident tabby cat walking on a harness through a lush green park path, full cat body visible mid-stride, warm afternoon sunlight, leash visible extending off frame, no human visible, single adventurous outdoor scene",aff:false},
  {id:31, title:"How to Stop Cat Scratches Before They Draw Blood", cat:"Cat Care", url:`${BASE_URL}/how-to-prevent-cat-paw-scratches-at-home/`, imgPrompt:"a playful tabby kitten with claws extended mid-swipe at a tall sisal scratching post, freeze frame action, full kitten body visible, warm living room light, no humans, single energetic indoor scene",aff:false},
  {id:32, title:"The Healthy Cat-Human Bond That Changes Everything", cat:"Cat Guide", url:`${BASE_URL}/healthy-cat-bond-for-young-ladies-at-home/`, imgPrompt:"a young woman lying on a cozy bedroom rug reading a book with a purring tabby cat resting beside her, woman face naturally relaxed and visible, warm golden afternoon light through curtains, single intimate lifestyle scene",aff:false},
  {id:33, title:"What's Actually Inside a Pet First Aid Kit?", cat:"Pet Health", url:`${BASE_URL}/pet-first-aid-kit-checklist/`, imgPrompt:"a neat top-down flat-lay of pet first aid items on white marble — bandage roll, antiseptic bottle, latex gloves, thermometer — each item clearly visible and separated, clean bright overhead light, no text labels, no animals",aff:false},
  {id:34, title:"Never Miss a Pet Vaccine Again With This Tracker", cat:"Pet Health", url:`${BASE_URL}/pet-vaccine-tracker/`, imgPrompt:"a healthy beagle puppy sitting alert on a clean clinic table, face sharp and bright eyes looking at camera, soft clinic lighting, no hands or needles in frame, no humans, single clean professional pet portrait",aff:false},
  {id:35, title:"These Common House Plants Are Silently Poisoning Your Pet", cat:"Pet Safety", url:`${BASE_URL}/common-plants-that-may-be-toxic-to-pets/`, imgPrompt:"a curious golden kitten sniffing a potted lily plant on a windowsill, kitten face in sharp focus with wide alert eyes, soft natural window light, full plant visible and recognizable, no humans, single clean indoor scene",aff:false},
  {id:36, title:"Score Your Pet's Hygiene — Take the 5-Minute Test", cat:"Pet Hygiene", url:`${BASE_URL}/pet-hygiene-score-card/`, imgPrompt:"a freshly groomed golden retriever and a fluffy white Persian cat sitting side by side on a clean white backdrop, both animals facing camera with gleaming healthy coats, bright even studio lighting, no humans, single premium animal portrait",aff:false},
  {id:37, title:"Answers to Pet Food Questions You Were Afraid to Ask", cat:"Pet Nutrition", url:`${BASE_URL}/pet-food-queries/`, imgPrompt:"a healthy golden labrador sitting beside two ceramic bowls filled with fresh dry kibble and wet food on a clean kitchen floor, dog looking at the food with eager expression, warm kitchen light, no humans, single lifestyle scene",aff:false},
  {id:38, title:"Healthy Pets + Happy Humans — The Bond Science Proves", cat:"Pet Wellness", url:`${BASE_URL}/healthy-pets-and-human-bond-for-family-life/`, imgPrompt:"a joyful family of four running through a green park at golden sunset with a golden retriever running alongside them, all faces naturally happy and visible, motion captured authentically, single wide outdoor lifestyle scene",aff:false},
  {id:39, title:"Brain Games for Dogs and Cats That Prevent Boredom", cat:"Pet Training", url:`${BASE_URL}/best-cognitive-exercises-that-can-change-your-brain/`, imgPrompt:"a focused border collie using its nose to push a wooden puzzle toy on a hardwood floor, full dog body visible, intense concentrated expression, warm indoor natural light, no humans, single smart pet activity scene",aff:false},
  {id:40, title:"Basic Pet Training Tools That Actually Work at Home", cat:"Pet Training", url:`${BASE_URL}/basic-pet-training-tools-for-better-command-prompting-and-home-behavior/`, imgPrompt:"a golden labrador sitting perfectly upright in a bright living room in obedient sit-stay position, alert and looking forward, warm natural light, full dog body visible, no humans, single clean indoor training scene",aff:false},
  {id:41, title:"Your Dog and Cat Vaccine Record — Keep It Updated", cat:"Pet Health", url:`${BASE_URL}/dog-and-cat-vaccine-tracker-for-pet-owners/`, imgPrompt:"a golden retriever puppy sitting on a vet clinic table looking healthy and alert, face sharp with bright eyes looking at camera, warm clinic background softly blurred, no hands or syringes visible, single professional pet portrait",aff:false},
  {id:42, title:"The Ultimate Pet Safety Hub — Everything in One Place", cat:"Resources", url:`${BASE_URL}/useful-checklists-and-care-resources-to-support-everyday-pet-life/`, imgPrompt:"a clean flat-lay of pet care items arranged neatly on a natural wood surface — red leash, grooming brush, ceramic bowl, rope toy, small first aid box — items separated clearly, warm overhead light, no text, no animals, single styled product scene",aff:false},
  {id:43, title:"Free Pet Care Booklet — Download and Save It Today", cat:"Resources", url:`${BASE_URL}/free-pet-care-faq-booklet/`, imgPrompt:"a golden retriever sitting beside a clean wooden desk with a closed notebook on it, dog looking at camera with bright eyes, warm home office light from window, no humans, single clean lifestyle scene",aff:false},
  {id:44, title:"Helpful Everyday Wellness Ideas for Safer, Smarter Pets", cat:"Pet Wellness", url:`${BASE_URL}/helpful-everyday-wellness-ideas-for-safer-pets-and-smarter-homes/`, imgPrompt:"a woman in yoga pose on a mat in a sunlit living room with a calm tabby cat sitting beside the mat watching her, woman face naturally visible in profile, soft morning light, single peaceful wellness lifestyle scene",aff:false},
  {id:45, title:"Pet Home Safety — The Room-by-Room Guide for Families", cat:"Pet Safety", url:`${BASE_URL}/pet-home-safety-guide-for-families-2/`, imgPrompt:"a golden retriever puppy sitting in the center of a bright modern living room, full dog body visible and alert, clean tidy home surroundings, warm natural light from window, no humans, single safe home scene",aff:false},
  {id:46, title:"The LED Nail Clipper That Makes Grooming Stress-Free", cat:"Product", url:"https://www.dhgate.com/product/led-light-pet-nail-clipper-with-amplification/1010092124.html", imgPrompt:"a modern silver LED pet nail clipper placed on a white marble surface, product in sharp focus showing the LED lens and clipper head clearly, soft diffused studio light from above, no animals no humans in frame, single clean product photography",aff:true},
  {id:47, title:"This Grooming Kit Handles Everything Your Pet Needs", cat:"Product", url:"https://www.dhgate.com/product/combs-dog-hair-remover-cat-brush-grooming/1028087374.html", imgPrompt:"a slicker brush, wide-tooth comb and small scissors arranged neatly on a dark wood surface, each item clearly separated and in focus, moody dramatic overhead light, no animals no humans, single clean product flat-lay scene",aff:true},
  {id:48, title:"See Exactly What Your Dog Does When You're Not Home", cat:"Product", url:"https://www.dhgate.com/product/dog-collars-hd-1080p-wireless-collar-camera/1032506070.html", imgPrompt:"a golden retriever wearing a sleek black smart collar with a small camera module clearly visible on it, dog sitting outdoors in natural daylight, full dog face and collar in sharp focus, no humans, single clean tech pet scene",aff:true},
  {id:49, title:"The 2-in-1 Pet Stroller That Changes Every Walk", cat:"Product", url:"https://bestchoiceproducts.com/products/2-in-1-pet-dog-bike-trailer", imgPrompt:"a small fluffy white dog sitting inside an open navy blue pet stroller in a sunny park, dog face alert and looking at camera, full stroller visible, green blurred trees background, no humans, single clean outdoor product lifestyle scene",aff:true},
  {id:50, title:"8-Piece Grooming Kit That Cleans Itself While You Use It", cat:"Product", url:"https://www.dhgate.com/product/8pcs-set-dog-grooming-kit-self-cleaning-pet/1087614127.html", imgPrompt:"a fluffy white Samoyed dog being groomed with an electric slicker brush, dog face in sharp focus looking relaxed and happy, brush visible against fluffy coat, clean white studio background, no human faces visible, single premium grooming scene",aff:true},
  {id:51, title:"Clean Your Dog's Paws in 10 Seconds — No Water Needed", cat:"Product", url:"https://www.dhgate.com/product/pet-foot-paw-cleaner-100ml-foam-waterless/1010228089.html", imgPrompt:"a single golden retriever paw on a clean white surface with white foam cleanser applied to it, paw perfectly formed with natural fur between toes, soft studio light, absolutely NO human hands or body parts in frame, single close-up product scene",aff:true},
  {id:52, title:"Keep Your Dog's Teeth Sparkling With This Simple Tool", cat:"Product", url:"https://www.dhgate.com/product/100-pieces-batch-of-pet-finger-toothbrushes/1010228766.html", imgPrompt:"a happy golden retriever with mouth open showing clean white teeth, face in sharp focus with bright expression, clean white studio background, soft even light, no human hands visible in frame, single premium dental dog portrait",aff:true},
  {id:53, title:"Vet-Recommended Shampoo for Dogs With Sensitive Skin", cat:"Product", url:"https://www.dhgate.com/product/pet-shampoo-for-cats-and-dogs-cleansing-bathing/1089431467.html", imgPrompt:"a golden retriever in a white bathtub covered in fluffy white shampoo suds, dog face looking happy with mouth open, warm bright bathroom light, no human faces visible, single clean pet bathing lifestyle scene",aff:true},
  {id:54, title:"How a Healthy Bond With Your Cat Improves Your Life", cat:"Cat Wellness", url:`${BASE_URL}/healthy-cat-bond-for-young-ladies-at-home/`, imgPrompt:"a young woman sitting cross-legged on a white bed in morning light with an elegant grey cat sitting beside her, woman face naturally peaceful and visible, cat looking at camera, soft diffused window light, single calm lifestyle scene",aff:false},
  {id:55, title:"Safe Drinking Water for Pets — 7 Rules You Must Follow", cat:"Pet Health", url:`${BASE_URL}/safe-drinking-water-at-home-7-hygiene-rules-2/`, imgPrompt:"a golden retriever drinking from a modern stainless steel pet water fountain on a clean kitchen floor, dog face in sharp focus mid-drink, water stream clearly visible and crystal clear, warm kitchen light, no humans, single lifestyle scene",aff:false},
  {id:56, title:"How Pets Protect Children's Mental Health at Home", cat:"Pet Wellness", url:`${BASE_URL}/kids-off-screens-best-alternatives-for-eye-health/`, imgPrompt:"a young child around 7 years old sitting on a bright living room rug laughing naturally while a fluffy golden puppy sits beside them, child face fully visible and joyful, puppy cute and energetic, warm natural light, single candid lifestyle scene",aff:false},
  {id:57, title:"One Health — Why Protecting Animals Protects All of Us", cat:"One Health", url:`${BASE_URL}/one-health-a-pillar-for-climate-sustainability/`, imgPrompt:"a wildlife veterinarian in khaki field uniform crouching in a lush green forest examining a small bird held gently in gloved hands, vet face naturally visible and focused, golden light through forest canopy, single documentary nature scene",aff:false},
  {id:58, title:"Your Pet Is Your Family — Here's How to Treat Them Like It", cat:"Pet Wellness", url:`${BASE_URL}/pet-safety-hub/`, imgPrompt:"a multi-generational family of five — grandparents parents and child — sitting together in a sunlit living room with a golden retriever lying among them, all faces naturally visible and happy, warm afternoon light, single wide family lifestyle scene",aff:false},
  {id:59, title:"The Complete Dog Vaccine Guide — What Every Owner Must Know", cat:"Dog Health", url:`${BASE_URL}/pet-vaccine-tracker/`, imgPrompt:"a female veterinarian in white coat showing a tablet to a man in a bright modern clinic, golden puppy sitting on exam table between them, both adult faces naturally visible and engaged, warm clinical light, single professional lifestyle scene",aff:false},
  {id:60, title:"Pet Food FAQ — Every Question Answered By Experts", cat:"Pet Nutrition", url:`${BASE_URL}/pet-food-queries/`, imgPrompt:"two ceramic bowls side by side on a clean kitchen counter — dry kibble in one and wet food in other — a healthy cat and dog sitting calmly behind the bowls looking at camera, warm kitchen light, no humans, single clean food lifestyle scene",aff:false},
  {id:61, title:"How to Keep Your Pet Safe This Season — Full Guide", cat:"Pet Safety", url:`${BASE_URL}/pet-safety-hub/`, imgPrompt:"a husky dog lying contentedly on a cozy sofa in an autumn living room, full dog body visible and relaxed, warm amber lamp light, autumn leaves visible through window, no humans, single warm indoor lifestyle scene",aff:false},
  {id:62, title:"Train Your Pet Better With These 5 Proven Tools", cat:"Pet Training", url:`${BASE_URL}/basic-pet-training-tools-for-better-command-prompting-and-home-behavior/`, imgPrompt:"a male dog trainer in outdoor setting giving a clear hand signal to an attentive German shepherd sitting perfectly in front of him, trainer face naturally confident and visible, dog alert looking up at trainer, warm daylight, single professional training scene",aff:false},
];

const STYLES = ["Educational","Storytelling","How-To","Hook/Viral","FAQ/List"];
let postIndex = 0;
let styleIndex = 0;
let totalPosted = 0;
let totalGroupPosted = 0;
let totalComments = 0;
let logs = [];
let PAGE_TOKEN = '';
let lastPagePostUrl = '';
let lastPagePostTitle = '';
let groupEmailIndex = 0;
// ─── FIX: track token failure state ───────────────────────────────────────────
let tokenRefreshAttempts = 0;
let lastTokenError = '';

// ── PINTEREST MODULE ──────────────────────────────────────────────────────────
const PINTEREST_INTERVAL_MS = 9000000;
const PT_BOARDS = {
  dog_care:      { id: process.env.PINTEREST_BOARD_DOG_CARE      || '', name: 'Dog Care Advice' },
  cat_tips:      { id: process.env.PINTEREST_BOARD_CAT_CARE_TIPS || '', name: 'Cat Care Tips' },
  cat_advice:    { id: process.env.PINTEREST_BOARD_CAT_CARE_ADV  || '', name: 'Cat Care Advice' },
  safety:        { id: process.env.PINTEREST_BOARD_SAFETY        || '', name: 'Pet Safety Tips' },
  food:          { id: process.env.PINTEREST_BOARD_FOOD          || '', name: 'Pet Food' },
  hygiene:       { id: process.env.PINTEREST_BOARD_HYGIENE       || '', name: 'Pet Hygiene & Cleaning' },
  training:      { id: process.env.PINTEREST_BOARD_TRAINING      || '', name: 'Pet Training Basics' },
  pets_care:     { id: process.env.PINTEREST_BOARD_PETS_CARE     || '', name: 'Pets Care' },
  family_health: { id: process.env.PINTEREST_BOARD_FAMILY_HEALTH || '', name: 'Family & Pet Health' },
  ohg_blog:      { id: process.env.PINTEREST_BOARD_OHG_BLOG      || '', name: 'One Health Globe Blog' },
  healthy_home:  { id: process.env.PINTEREST_BOARD_HEALTHY_HOME  || '', name: 'Healthy Home for Pets' },
  seasonal:      { id: process.env.PINTEREST_BOARD_SEASONAL      || '', name: 'Seasonal Pet Safety' },
  wellness:      { id: process.env.PINTEREST_BOARD_WELLNESS      || '', name: 'Pet Wellness Products' },
};
const PT_POSTS = [
  { url:`${BASE_URL}/beagle-temperament/`,                                         board:'dog_care',      topic:'Beagle dog breed complete guide for families' },
  { url:`${BASE_URL}/boxer-breed-temperament/`,                                    board:'dog_care',      topic:'Boxer dog breed personality and care guide' },
  { url:`${BASE_URL}/english-bulldog-temperament/`,                                board:'dog_care',      topic:'Bulldog breed temperament and daily care tips' },
  { url:`${BASE_URL}/german-shepherd-temperament/`,                                board:'dog_care',      topic:'German Shepherd breed facts and training tips' },
  { url:`${BASE_URL}/rottweiler-temperament/`,                                     board:'dog_care',      topic:'Rottweiler breed guide: loyalty and training' },
  { url:`${BASE_URL}/pomeranian-dog-breed-temperament-care-guide/`,                board:'dog_care',      topic:'Pomeranian: small dog with a huge personality' },
  { url:`${BASE_URL}/how-to-walk-your-cat-safely-harness-training-for-beginners/`, board:'training',      topic:"How to harness train your dog or cat safely" },
  { url:`${BASE_URL}/dog-paw-scanner/`,                                            board:'dog_care',      topic:"Dog paw health: what your dog's paws are telling you" },
  { url:`${BASE_URL}/simple-tips-to-know-signs-of-osteoarthritis-in-cats/`,       board:'family_health', topic:'Osteoarthritis in pets: signs, causes and relief' },
  { url:`${BASE_URL}/persian-cat-temperament/`,                                    board:'cat_tips',      topic:'Persian cat breed guide: grooming and temperament' },
  { url:`${BASE_URL}/ragdoll-temperament/`,                                        board:'cat_tips',      topic:'Ragdoll cat: the gentle giant indoor breed' },
  { url:`${BASE_URL}/new-kitten-planner/`,                                         board:'cat_advice',    topic:'New kitten checklist: complete first-week planner' },
  { url:`${BASE_URL}/cat-grooming-guide-2/`,                                       board:'hygiene',       topic:'Complete cat grooming guide you can do at home' },
  { url:`${BASE_URL}/pet-hygiene-score-card/`,                                     board:'hygiene',       topic:'Pet hygiene scorecard: is your pet clean enough?' },
  { url:`${BASE_URL}/top-5-deadly-common-dog-diseases-symptoms-prevention-treatment-pictures/`, board:'family_health', topic:'10 deadly pet diseases every owner must recognize' },
  { url:`${BASE_URL}/pet-first-aid-kit-checklist/`,                                board:'safety',        topic:'Pet first aid guide: save your dog or cat in an emergency' },
  { url:`${BASE_URL}/pet-vaccine-tracker/`,                                        board:'family_health', topic:'Essential pet vaccines: complete schedule guide' },
  { url:`${BASE_URL}/common-plants-that-may-be-toxic-to-pets/`,                   board:'safety',        topic:'Toxic houseplants dangerous to dogs and cats' },
  { url:`${BASE_URL}/digital-awareness-to-minimize-zoonosis-spread/`,             board:'family_health', topic:'Zoonosis: diseases pets can spread to your family' },
  { url:`${BASE_URL}/pet-food-queries/`,                                           board:'food',          topic:'Pet food FAQ: what to actually feed your pet' },
  { url:`${BASE_URL}/dog-and-cat-vaccine-tracker-for-pet-owners/`,                board:'family_health', topic:'Dog and cat vaccine tracker every owner needs' },
  { url:`${BASE_URL}/room-by-room-pet-safety-guide-for-families/`,                board:'safety',        topic:'Room-by-room pet safety guide for families' },
  { url:`${BASE_URL}/indoor-cat-safety-checklist-for-everyday-home-risks/`,       board:'safety',        topic:'Indoor cat safety mistakes that put your pet at risk' },
  { url:`${BASE_URL}/pet-safety-hub/`,                                             board:'pets_care',     topic:'The complete pet safety hub for responsible owners' },
  { url:`${BASE_URL}/healthy-pets-and-human-bond-for-family-life/`,               board:'family_health', topic:'Healthy pets and happy humans: the bond science proves' },
  { url:`${BASE_URL}/basic-pet-training-tools-for-better-command-prompting-and-home-behavior/`, board:'training', topic:'Basic pet training tools that actually work at home' },
  { url:`${BASE_URL}/spring-pet-safety-checklist-for-dogs-and-cats-easy-home-and-garden-tips/`, board:'seasonal', topic:'Spring pet safety checklist for dogs and cats' },
  { url:`${BASE_URL}/helpful-everyday-wellness-ideas-for-safer-pets-and-smarter-homes/`, board:'wellness', topic:'Everyday wellness ideas for safer smarter pets' },
  { url:`${BASE_URL}/safe-drinking-water-at-home-7-hygiene-rules-2/`,             board:'healthy_home',  topic:'Safe drinking water for pets: 7 rules you must follow' },
  { url:`${BASE_URL}/`,                                                            board:'ohg_blog',      topic:'One Health Globe: expert pet care and safety guides' },
  { url:`${BASE_URL}/dog-vaccines-matter-why-staying-current-protects-health-one-health-globe/`, board:'family_health', topic:'Why dog vaccines are the most important thing this year' },
  { url:`${BASE_URL}/protecting-cats-from-ticks-indoor-and-outdoor-risks-explained/`, board:'cat_tips', topic:'Ticks on your cat: what you must do right now' },
  { url:`${BASE_URL}/how-to-prevent-cat-paw-scratches-at-home/`,                  board:'cat_advice',    topic:'How to stop cat scratches before they draw blood' },
];
let ptIndex = 0;
let ptPostCount = 0;
let ptLastPost = null;
let ptLog = [];

function pinterestRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const token = process.env.PINTEREST_TOKEN;
    if (!token) return reject(new Error('PINTEREST_TOKEN not set'));
    const data = body ? JSON.stringify(body) : null;
    const isSandbox = !(process.env.PINTEREST_STANDARD === 'true');
    const options = {
      hostname: isSandbox ? 'api-sandbox.pinterest.com' : 'api.pinterest.com',
      path: `/v5${path}`, method,
      headers: {
        'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error(`Pinterest ${res.statusCode}: ${JSON.stringify(parsed)}`));
        } catch(e) { reject(new Error(`Pinterest parse error: ${raw.substring(0,200)}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function generatePinContent(post) {
  return new Promise((resolve) => {
    const prompt = `You are a Pinterest SEO expert for a pet care website targeting US pet owners.\nWrite Pinterest pin content for: "${post.topic}"\nURL: ${post.url}\nRules:\n- Title: max 100 chars, compelling, includes main keyword, no emoji, no quotes\n- Description: 200-300 chars, keyword-rich, natural language, ends with CTA like "Read the full guide"\n- Target: US pet owners, warm buying audience, Pinterest search optimized\nRespond ONLY in this exact JSON format, no preamble:\n{"title":"...","description":"..."}`;
    const body = JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:300, messages:[{role:'user',content:prompt}] });
    const options = { hostname:'api.anthropic.com', path:'/v1/messages', method:'POST', headers:{'x-api-key':CLAUDE_KEY,'anthropic-version':'2023-06-01','Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          const text = parsed.content?.[0]?.text || '';
          resolve(JSON.parse(text.replace(/```json|```/g,'').trim()));
        } catch { resolve({ title: post.topic, description: `${post.topic} — expert advice for pet owners. Read the full guide on OneHealthGlobe!` }); }
      });
    });
    req.on('error', () => resolve({ title: post.topic, description: `${post.topic} — expert pet care advice on OneHealthGlobe!` }));
    req.write(body); req.end();
  });
}

async function runPinterestScheduler() {
  if (!process.env.PINTEREST_TOKEN) { log('[Pinterest] Skipping — PINTEREST_TOKEN not set'); return; }
  const post = PT_POSTS[ptIndex % PT_POSTS.length];
  ptIndex++;
  const board = PT_BOARDS[post.board];
  if (!board || !board.id) {
    const msg = `[Pinterest] Board ID not set for "${post.board}" — add PINTEREST_BOARD_* to Railway vars`;
    log(msg); ptLog.unshift({ time: new Date().toISOString(), error: msg, topic: post.topic }); return;
  }
  try {
    log(`[Pinterest] Pinning → ${board.name}: ${post.topic}`);
    const content = await generatePinContent(post);
    const result = await pinterestRequest('POST', '/pins', {
      link: post.url, title: content.title, description: content.description, board_id: board.id,
      media_source: { source_type: 'image_url', url: `${post.url}?og=1` },
    });
    ptPostCount++;
    ptLastPost = { time: new Date().toISOString(), topic: post.topic, url: post.url, board: board.name, pinId: result.id, title: content.title };
    ptLog.unshift(ptLastPost);
    if (ptLog.length > 20) ptLog.pop();
    log(`[Pinterest] ✅ Pin posted! ID: ${result.id} → ${board.name}`);
  } catch(err) {
    const entry = { time: new Date().toISOString(), error: err.message, topic: post.topic };
    ptLog.unshift(entry); if (ptLog.length > 20) ptLog.pop();
    log(`[Pinterest] ❌ ${err.message}`);
  }
}

async function fetchPinterestBoards() {
  const result = await pinterestRequest('GET', '/boards?page_size=25');
  if (result.items) {
    log('\n=== PINTEREST BOARD IDs — ADD TO RAILWAY ===');
    result.items.forEach(b => { const key = b.name.toLowerCase().replace(/[^a-z0-9]+/g,'_').toUpperCase(); log(`PINTEREST_BOARD_${key} = ${b.id}  # ${b.name}`); });
    log('============================================\n');
  }
  return result;
}
// ── END PINTEREST ─────────────────────────────────────────────────────────────

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
  return `${post.url}${sep}utm_source=facebook&utm_medium=page&utm_campaign=${UTM_CAMP}&utm_content=p${String(post.id).padStart(2,'00')}`;
}

function apiRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({raw:data}); } });
    });
    req.on('error', reject);
    if(body) req.write(body);
    req.end();
  });
}

// ─── FIX: improved token fetch with error tracking ────────────────────────────
async function fetchPageToken() {
  if(!FB_SYS_TOKEN) {
    log('ERROR: FB_TOKEN is empty — set it in Railway Variables');
    lastTokenError = 'FB_TOKEN not set';
    return;
  }
  // Try to get Page Access Token using the page ID directly
  // This works for both System User tokens and regular user tokens
  log('Fetching Page Access Token via page endpoint...');
  const options = {
    hostname: 'graph.facebook.com',
    path: `/v19.0/${FB_PAGE_ID}?fields=access_token,name&access_token=${FB_SYS_TOKEN}`,
    method: 'GET'
  };
  try {
    const data = await apiRequest(options, null);
    if(data.access_token) {
      PAGE_TOKEN = data.access_token;
      tokenRefreshAttempts = 0;
      lastTokenError = '';
      log(`✅ Page token fetched: ${data.name} (len=${PAGE_TOKEN.length})`);
      return;
    }
    if(data.error) {
      log(`Page token fetch failed: ${data.error.message} — using system token as fallback`);
      // Fallback: use system user token directly
      PAGE_TOKEN = FB_SYS_TOKEN;
      lastTokenError = '';
      log(`Fallback: using FB_TOKEN directly (len=${PAGE_TOKEN.length})`);
      return;
    }
  } catch(e) {
    log(`Page token exception: ${e.message} — using system token as fallback`);
  }
  // Final fallback
  PAGE_TOKEN = FB_SYS_TOKEN;
  lastTokenError = '';
  log(`Fallback token set (len=${PAGE_TOKEN.length})`);
}

// ─── FIX: token alert email ────────────────────────────────────────────────────
async function sendTokenAlertEmail(errorMsg) {
  const subject = '🚨 OHG Autopilot: FB Token Expired — Action Required';
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border-top:4px solid #dc2626">
<h2 style="color:#dc2626;margin:0 0 16px">🚨 Facebook Token Expired</h2>
<p style="color:#333">Your OHG Pet Autopilot has stopped posting because the Facebook access token has expired.</p>
<div style="background:#fff1f2;border:1px solid #fca5a5;border-radius:8px;padding:12px;margin:16px 0;font-family:monospace;font-size:12px;color:#991b1b">${errorMsg}</div>
<h3 style="color:#333;margin:16px 0 8px">How to fix (5 minutes):</h3>
<ol style="color:#555;line-height:2">
<li>Go to <a href="https://developers.facebook.com/tools/explorer/" style="color:#1a6b4a">Meta Graph API Explorer</a></li>
<li>Select your app → Generate User Access Token</li>
<li>Permissions: pages_manage_posts, pages_read_engagement, groups_access_member_info, publish_to_groups</li>
<li>Click <strong>Generate Access Token</strong></li>
<li>Exchange for long-lived token at:<br><code style="font-size:11px">https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_SECRET&fb_exchange_token=YOUR_TOKEN</code></li>
<li>Go to Railway → Variables → Update <strong>FB_TOKEN</strong> → Redeploy</li>
</ol>
<p style="color:#888;font-size:12px;margin-top:16px">Server: ohg-pet-autopilot-production.up.railway.app</p>
</div></body></html>`;
  await sendEmail(subject, html);
  log('🚨 Token alert email sent');
}

async function generateCaption(post, style) {
  const prompt = `Write a high-CTR Facebook post caption for USA pet owners.\nTitle: "${post.title}"\nCategory: ${post.cat}\nStyle: ${style}\nRules:\n- First line: title in ALL CAPS\n- Blank line\n- 2-3 sentences: engaging, SEO-friendly, warm tone, 2-3 relevant emojis\n- End with a clear call-to-action (no URL)\n- NO hashtags\nReturn ONLY the caption text.`;
  const body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:350, messages:[{role:"user",content:prompt}] });
  const options = { hostname:'api.anthropic.com', path:'/v1/messages', method:'POST', headers:{'Content-Type':'application/json','x-api-key':CLAUDE_KEY,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(body)} };
  const data = await apiRequest(options, body);
  if(data.error) throw new Error('Claude: ' + data.error.message);
  return data.content[0].text.trim();
}

async function generateImagePrompt(post, style) {
  const prompt = `You are a professional photography art director for a premium pet care brand (onehealthglobe.com).
Generate a Pollinations.ai image prompt for this Facebook post topic.

Post title: "${post.title}"
Category: ${post.cat}
Style: ${style}

Rules for the prompt:
- Describe ONE single scene only — no collage, no split panels
- All subjects FULLY in frame — never cut off faces, heads, or bodies
- Subjects centered and properly composed with breathing room around edges
- Photorealistic, National Geographic quality, natural lighting
- If humans: faces fully visible, natural expressions, camera-facing
- If animals: full body visible OR head fully in frame with clear eyes
- If products: sharp focus, white or neutral background, studio lighting
- NO text overlay, NO watermarks, NO distorted anatomy
- Ultra sharp focus, 4K professional photography
- Always end with: single scene, centered composition, full subject in frame, professional photography

Return ONLY the image description — no preamble, no quotes, no extra text. Max 200 words.`;

  const body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:300, messages:[{role:"user",content:prompt}] });
  const options = { hostname:'api.anthropic.com', path:'/v1/messages', method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':CLAUDE_KEY,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(body)} };
  try {
    const data = await apiRequest(options, body);
    if(data.error) throw new Error(data.error.message);
    const generatedPrompt = data.content[0].text.trim();
    log(`🎨 Image prompt generated (${generatedPrompt.length} chars)`);
    return generatedPrompt;
  } catch(e) {
    log(`🎨 Prompt generation failed: ${e.message} — using fallback`);
    return post.imgPrompt; // fallback to static prompt
  }
}


function buildImageUrl(prompt, seed) {
  const fullPrompt = prompt + IMG_SUFFIX;
  const encoded = encodeURIComponent(fullPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true&enhance=true`;
}

function buildFullCaption(caption, utm, post) {
  const siteLine = post.aff ? '' : '\n\nonehealthglobe.com';
  return `${caption}\n\n🔗 For the full guide, visit: ${utm}${siteLine}`;
}

async function publishToPage(fullCaption, imageUrl, utm) {
  const body = JSON.stringify({ caption:fullCaption, url:imageUrl, link:utm, published:true, access_token:PAGE_TOKEN });
  const options = { hostname:'graph.facebook.com', path:`/v19.0/${FB_PAGE_ID}/photos`, method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} };
  const data = await apiRequest(options, body);
  if(data.error) {
    const b2 = JSON.stringify({ message:fullCaption, link:utm, access_token:PAGE_TOKEN });
    const o2 = { hostname:'graph.facebook.com', path:`/v19.0/${FB_PAGE_ID}/feed`, method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b2)} };
    const d2 = await apiRequest(o2, b2);
    if(d2.error) throw new Error('Page: ' + d2.error.message);
    return d2.id;
  }
  return data.id || data.post_id;
}

async function publishToGroup(group, fullCaption, utm) {
  const body = JSON.stringify({ message:fullCaption, link:utm, access_token:GROUP_TOKEN });
  const options = { hostname:'graph.facebook.com', path:`/v19.0/${group.id}/feed`, method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} };
  const data = await apiRequest(options, body);
  if(data.error) throw new Error(data.error.message);
  return data.id;
}

function pickNextGroup(triedIds = []) {
  const now = Date.now();
  PET_GROUPS.forEach(g => {
    const s = groupStats[g.id];
    if(s.cooldown && (now - s.lastFail) > 24*3600000) { s.cooldown = false; log(`⟳ Cooldown lifted: ${g.name}`); }
  });
  let pick = PET_GROUPS.find(g => !triedIds.includes(g.id) && !groupStats[g.id].cooldown && !groupStats[g.id].permanent && !postedGroupsThisCycle.has(g.id));
  if(pick) return pick;
  pick = PET_GROUPS.find(g => !triedIds.includes(g.id) && !groupStats[g.id].cooldown && !groupStats[g.id].permanent);
  if(pick) return pick;
  pick = PET_GROUPS.find(g => !triedIds.includes(g.id) && !groupStats[g.id].permanent);
  return pick || null;
}

async function postToGroupWithRetry(fullCaption, imageUrl, utm, post) {
  const triedIds = [];
  let attempts = 0;
  while(attempts < 3) {
    const group = pickNextGroup(triedIds);
    if(!group) { log(`⚠️ No more groups available`); break; }
    triedIds.push(group.id);
    attempts++;
    try {
      const postId = await publishToGroup(group, fullCaption, utm);
      groupStats[group.id].success++;
      postedGroupsThisCycle.add(group.id);
      totalGroupPosted++;
      log(`✅ GROUP [${attempts}] ${group.name} — ID: ${postId}`);
      pendingGroupPosts.push({ postId, groupId:group.id, groupName:group.name, postedAt:Date.now(), title:post.title, fullCaption, imageUrl, utm, triedGroups:[...triedIds] });
      return;
    } catch(e) {
      groupStats[group.id].fail++;
      groupStats[group.id].lastFail = Date.now();
      log(`⚠️ GROUP [${attempts}] ${group.name} FAILED: ${e.message.substring(0,80)}`);
      const isPermanent = e.message.includes('missing permissions') || e.message.includes('does not exist') ||
                          e.message.includes('not support this operation') || e.message.includes('Invalid OAuth') ||
                          e.message.includes('not a member');
      if(isPermanent) { groupStats[group.id].cooldown = true; groupStats[group.id].permanent = true; log(`🚫 ${group.name} PERMANENTLY skipped`); }
      else if(groupStats[group.id].fail >= 3) { groupStats[group.id].cooldown = true; log(`🚫 ${group.name} on cooldown`); }
    }
  }
}

async function retryPendingGroupPosts() {
  if(pendingGroupPosts.length === 0) return;
  log(`🔍 Checking ${pendingGroupPosts.length} pending...`);
  const now = Date.now();
  const stillPending = [];
  for(const p of pendingGroupPosts) {
    const ageH = (now - p.postedAt) / 3600000;
    try {
      const options = { hostname:'graph.facebook.com', path:`/v19.0/${p.postId}?fields=id&access_token=${GROUP_TOKEN}`, method:'GET' };
      const data = await apiRequest(options, null);
      if(data.id) {
        if(ageH < 72) { stillPending.push(p); }
        else { log(`⏰ ${p.groupName}: stuck 72h — retrying`); await postToGroupWithRetry(p.fullCaption, p.imageUrl, p.utm, {title:p.title}); }
      } else if(data.error) {
        log(`❌ ${p.groupName}: rejected — retrying`);
        groupStats[p.groupId].fail++;
        await postToGroupWithRetry(p.fullCaption, p.imageUrl, p.utm, {title:p.title});
      }
    } catch(e) { stillPending.push(p); }
  }
  pendingGroupPosts = stillPending;
}

// ─── FIX: runPost now sends email even when page post fails ────────────────────
async function runPost() {
  if(!isActiveHour()) { log(`SKIP — Outside active hours`); return; }
  if(!PAGE_TOKEN) await fetchPageToken();
  // await retryPendingGroupPosts(); // GROUP DISABLED
  // await checkAndCommentFallback(); // GROUP DISABLED
  const idx = postIndex % 62;
  const round = Math.floor(postIndex / 62) + 1;
  const post = POSTS[idx];
  const style = STYLES[styleIndex % 5];
  const utm = buildUTM(post);
  // Generate fresh Claude image prompt for this post/style combination
  const dynamicPrompt = await generateImagePrompt(post, style);
  const seed = Date.now() % 999999; // random seed each time for variety
  const imageUrl = buildImageUrl(dynamicPrompt, seed);
  if(idx === 0 && postIndex > 0) { postedGroupsThisCycle.clear(); log(`🔄 New round ${round} — group cycle reset`); }
  log(`━━━ P${String(post.id).padStart(2,'0')} [Round ${round}] | Next group: ${pickNextGroup()?.name||'none'}`);
  log(`Title: ${post.title}`);
  try {
    const caption = await generateCaption(post, style);
    log(`Caption ready (${caption.length} chars)`);
    const fullCaption = buildFullCaption(caption, utm, post);
    let pagePostSuccess = false;
    try {
      const pageId = await publishToPage(fullCaption, imageUrl, utm);
      log(`✅ PAGE — ID: ${pageId}`);
      totalPosted++;
      const rawId = pageId.split('_')[1] || pageId;
      lastPagePostUrl = `https://www.facebook.com/${FB_PAGE_ID}/posts/${rawId}`;
      lastPagePostTitle = post.title;
      pagePostSuccess = true;
      // Send email with actual post URL
      sendHourlyGroupEmail(lastPagePostUrl, lastPagePostTitle).catch(e => log('📧 Email err: '+e.message));
    } catch(e) {
      log(`❌ PAGE failed: ${e.message}`);
      // ─── FIX: send email with previous URL even if page post failed ────────
      if(lastPagePostUrl) {
        log('📧 Sending email with previous post URL (page post failed)');
        sendHourlyGroupEmail(lastPagePostUrl, post.title + ' [repost]').catch(err => log('📧 Email err: '+err.message));
      } else {
        log('❌ Page post failed, no previous URL to email — check FB_TOKEN permissions');
      }
    }
    // GROUP POSTING DISABLED — re-enable when publish_to_groups permission added
    // await postToGroupWithRetry(fullCaption, imageUrl, utm, post);
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

function sendEmail(subject, htmlBody) {
  return new Promise((resolve) => {
    const resendKey = (process.env.RESEND_KEY || '').trim();
    if(!resendKey) { log('Email skipped - no RESEND_KEY'); resolve(false); return; }
    try {
      const body = JSON.stringify({ from:'OHG Autopilot <onboarding@resend.dev>', to:[NOTIFY_EMAIL], subject, html:htmlBody });
      const options = { hostname:'api.resend.com', path:'/emails', method:'POST', headers:{'Authorization':'Bearer '+resendKey,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} };
      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if(res.statusCode===200||res.statusCode===201) { log('✅ Email sent: '+subject); resolve(true); }
          else { log('Email error '+res.statusCode+': '+data.substring(0,80)); resolve(false); }
        });
      });
      req.on('error', e => { log('Email error: '+e.message); resolve(false); });
      req.write(body); req.end();
    } catch(e) { log('Email exception: '+e.message); resolve(false); }
  });
}

function buildHourlyEmail(postUrl, postTitle, group1, group2, groupNum1, groupNum2, totalGroups) {
  const now = new Date().toLocaleString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',hour12:true});
  const dateStr = new Date().toLocaleDateString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric'});
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0"><title>OHG Share</title></head>
<body style="margin:0;padding:0;background:#ECE5DD;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;">
<div style="max-width:500px;margin:0 auto;background:#ECE5DD;min-height:100vh;">
<div style="background:#075E54;padding:12px 16px;display:flex;align-items:center;gap:10px;">
  <div style="width:40px;height:40px;border-radius:50%;background:#128C7E;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🐾</div>
  <div style="flex:1;"><div style="color:#FFF;font-size:16px;font-weight:700;">OHG Pet Autopilot</div><div style="color:#B2DFDB;font-size:12px;">${now} EST &bull; Hourly Reminder</div></div>
  <div style="background:#25D366;border-radius:20px;padding:3px 10px;"><span style="color:#fff;font-size:10px;font-weight:800;letter-spacing:1px;">LIVE</span></div>
</div>
<div style="padding:14px 12px;">
  <div style="text-align:center;margin-bottom:14px;"><span style="background:rgba(255,255,255,0.8);color:#667781;font-size:11px;padding:3px 12px;border-radius:8px;display:inline-block;">${dateStr}</span></div>
  <div style="display:flex;gap:8px;margin-bottom:10px;align-items:flex-end;">
    <div style="width:26px;height:26px;border-radius:50%;background:#128C7E;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">🤖</div>
    <div style="background:#FFF;border-radius:2px 14px 14px 14px;padding:11px 14px;max-width:87%;box-shadow:0 1px 3px rgba(0,0,0,0.12);">
      <div style="color:#128C7E;font-size:10px;font-weight:800;letter-spacing:0.8px;margin-bottom:5px;text-transform:uppercase;">📌 Post to Share</div>
      <div style="color:#111;font-size:15px;font-weight:700;line-height:1.4;margin-bottom:10px;">${postTitle}</div>
      <a href="${postUrl}" style="display:block;background:#E8F5E9;border-left:3px solid #25D366;padding:8px 10px;border-radius:0 6px 6px 0;text-decoration:none;color:#075E54;font-size:13px;font-weight:600;">👁 View Page Post →</a>
      <div style="color:#8696A0;font-size:10px;text-align:right;margin-top:5px;">${now} ✓✓</div>
    </div>
  </div>
  <div style="text-align:center;margin:14px 0 6px;"><span style="background:rgba(255,255,255,0.8);color:#667781;font-size:11px;padding:4px 14px;border-radius:8px;display:inline-block;">📤 Tap button → FB post opens → Share → Share to a Group</span></div>
  <div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-end;">
    <div style="width:26px;height:26px;border-radius:50%;background:#128C7E;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">🤖</div>
    <div style="background:#FFF;border-radius:2px 14px 14px 14px;padding:14px;max-width:87%;box-shadow:0 1px 3px rgba(0,0,0,0.12);width:100%;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#128C7E;font-size:10px;font-weight:800;text-transform:uppercase;">STEP 1 — GROUP 1</span>
        <span style="background:#E8F5E9;color:#075E54;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;">${groupNum1} of ${totalGroups}</span>
      </div>
      <div style="background:#F0FFF4;border:2px solid #25D366;border-radius:10px;padding:10px 12px;margin-bottom:12px;">
        <div style="color:#111;font-size:16px;font-weight:800;">📍 ${group1.name}</div>
        <div style="color:#128C7E;font-size:11px;margin-top:2px;">Type this name in Share to Group</div>
      </div>
      <a href="${postUrl}" style="display:block;background:#25D366;color:#FFF;text-decoration:none;text-align:center;padding:18px 16px;border-radius:14px;font-size:19px;font-weight:900;box-shadow:0 4px 12px rgba(37,211,102,0.5);">
        📤 &nbsp;OPEN POST → SHARE TO GROUP 1
        <div style="font-size:11px;font-weight:500;opacity:0.92;margin-top:4px;">tap Share → type: ${group1.name}</div>
      </a>
    </div>
  </div>
  <div style="display:flex;gap:8px;margin-bottom:8px;padding-left:34px;">
    <div style="background:#FFF;border-radius:2px 14px 14px 14px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.12);">
      <div style="color:#555;font-size:13px;">⏱ Done Group 1? Wait <strong style="color:#111;">1 minute</strong> then tap Group 2</div>
    </div>
  </div>
  <div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-end;">
    <div style="width:26px;height:26px;border-radius:50%;background:#128C7E;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">🤖</div>
    <div style="background:#FFF;border-radius:2px 14px 14px 14px;padding:14px;max-width:87%;box-shadow:0 1px 3px rgba(0,0,0,0.12);width:100%;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#128C7E;font-size:10px;font-weight:800;text-transform:uppercase;">STEP 2 — GROUP 2</span>
        <span style="background:#E8F5E9;color:#075E54;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;">${groupNum2} of ${totalGroups}</span>
      </div>
      <div style="background:#F0FFF4;border:2px solid #25D366;border-radius:10px;padding:10px 12px;margin-bottom:12px;">
        <div style="color:#111;font-size:16px;font-weight:800;">📍 ${group2.name}</div>
        <div style="color:#128C7E;font-size:11px;margin-top:2px;">Type this name in Share to Group</div>
      </div>
      <a href="${postUrl}" style="display:block;background:#25D366;color:#FFF;text-decoration:none;text-align:center;padding:18px 16px;border-radius:14px;font-size:19px;font-weight:900;box-shadow:0 4px 12px rgba(37,211,102,0.5);">
        📤 &nbsp;OPEN POST → SHARE TO GROUP 2
        <div style="font-size:11px;font-weight:500;opacity:0.92;margin-top:4px;">tap Share → type: ${group2.name}</div>
      </a>
    </div>
  </div>
  <div style="display:flex;gap:8px;margin-bottom:20px;padding-left:34px;">
    <div style="background:#FFF;border-radius:2px 14px 14px 14px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.12);">
      <div style="color:#555;font-size:12px;line-height:1.6;">🎉 Both groups shared! Great job.<br><span style="color:#25D366;font-weight:700;">Next post in ~60 minutes.</span></div>
    </div>
  </div>
  <div style="background:rgba(255,255,255,0.75);border-radius:14px;padding:12px 8px;margin-bottom:8px;">
    <div style="display:flex;justify-content:space-around;align-items:center;">
      <div style="text-align:center;"><div style="color:#111;font-size:18px;font-weight:900;">62</div><div style="color:#8696A0;font-size:9px;">Posts</div></div>
      <div style="width:1px;height:28px;background:#DDD;"></div>
      <div style="text-align:center;"><div style="color:#111;font-size:18px;font-weight:900;">51</div><div style="color:#8696A0;font-size:9px;">Groups</div></div>
      <div style="width:1px;height:28px;background:#DDD;"></div>
      <div style="text-align:center;"><div style="color:#25D366;font-size:18px;font-weight:900;">24/7</div><div style="color:#8696A0;font-size:9px;">Autopilot</div></div>
    </div>
  </div>
  <div style="text-align:center;padding:8px 0 16px;">
    <a href="https://ohg-pet-autopilot-production.up.railway.app" style="color:#128C7E;font-size:11px;text-decoration:none;">📊 Live Dashboard</a>
    <span style="color:#CCC;font-size:11px;"> &bull; </span>
    <span style="color:#8696A0;font-size:11px;">onehealthglobe.com</span>
  </div>
</div></div></body></html>`;
}

async function sendHourlyGroupEmail(postUrl, postTitle) {
  const activeGroups = PET_GROUPS.filter(g => !groupStats[g.id].permanent);
  if(activeGroups.length < 2) { log('📧 Not enough active groups'); return; }
  const idx1 = groupEmailIndex % activeGroups.length;
  const idx2 = (groupEmailIndex + 1) % activeGroups.length;
  const group1 = activeGroups[idx1];
  const group2 = activeGroups[idx2];
  const groupNum1 = groupEmailIndex + 1;
  const groupNum2 = groupEmailIndex + 2;
  const totalGroups = activeGroups.length;
  groupEmailIndex = (groupEmailIndex + 2) % activeGroups.length;
  const subject = `🐾 Share Now: ${group1.name} + ${group2.name} — "${postTitle.substring(0,40)}"`;
  const html = buildHourlyEmail(postUrl, postTitle, group1, group2, groupNum1, groupNum2, totalGroups);
  await sendEmail(subject, html);
  log(`📧 Email sent → ${group1.name} + ${group2.name}`);
}

log('OHG Pet Autopilot Server v7.7 starting — Claude dynamic image prompts, 3hr interval, groups disabled...');
log(`FB Posts: 62 | Groups: ${PET_GROUPS.length} | Interval: ${INTERVAL_MS/60000}min | Hours: ${ACTIVE_FROM}-${ACTIVE_TO} EST`);
log(`Pinterest: ${process.env.PINTEREST_TOKEN ? '✅ Token set' : '⚠️ No token'}`);
log(`Token: ${FB_SYS_TOKEN?'SET len='+FB_SYS_TOKEN.length:'MISSING'} | Claude: ${CLAUDE_KEY?'SET':'MISSING'}`);
log(`Email: ${process.env.RESEND_KEY?'✅ Resend → '+NOTIFY_EMAIL:'⚠️ RESEND_KEY not set'}`);

fetchPageToken().then(() => {
  log(`Scheduler ready — first FB post in 15s`);
  setTimeout(runPost, 15000);
  setInterval(runPost, INTERVAL_MS);
  // setInterval(retryPendingGroupPosts, 4 * 3600000); // GROUP DISABLED
  // setInterval(checkAndCommentFallback, 30 * 60000); // GROUP DISABLED
  setTimeout(() => { log('[Pinterest] First pin firing...'); runPinterestScheduler(); }, 60000);
  setInterval(runPinterestScheduler, PINTEREST_INTERVAL_MS);
  log(`[Pinterest] Scheduler armed — every ${PINTEREST_INTERVAL_MS/3600000}hrs`);
});

// ── HTTP SERVER ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
http.createServer(async (req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── CLAUDE PROXY ──────────────────────────────────────────────────────────
  if (req.url === '/claude-proxy' && req.method === 'POST') {
    let rawBody = '';
    req.on('data', chunk => rawBody += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(rawBody);
        payload.model = payload.model || 'claude-sonnet-4-5';
        const bodyStr = JSON.stringify(payload);
        const options = {
          hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
          headers: { 'Content-Type':'application/json', 'x-api-key':CLAUDE_KEY, 'anthropic-version':'2023-06-01', 'anthropic-beta':'web-search-2025-03-05', 'Content-Length':Buffer.byteLength(bodyStr) },
        };
        const req2 = https.request(options, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => { res.writeHead(res2.statusCode, {'Content-Type':'application/json'}); res.end(data); log(`[Proxy] Claude call — status ${res2.statusCode}`); });
        });
        req2.on('error', (e) => { log(`[Proxy] Error: ${e.message}`); res.writeHead(500,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:{message:e.message}})); });
        req2.write(bodyStr); req2.end();
      } catch (e) { log(`[Proxy] Parse error: ${e.message}`); res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:{message:'Invalid JSON: '+e.message}})); }
    });
    return;
  }

  // ── TOKEN REFRESH HELPER ROUTES ──────────────────────────────────────────────
  // GET /get-token-url — returns the Facebook OAuth login URL
  if (req.url === '/get-token-url') {
    if (!FB_APP_ID) {
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({
        error: true,
        message: 'FB_APP_ID not set in Railway variables. Add it to Railway → Variables → FB_APP_ID',
        fix: 'Go to Railway Variables and add FB_APP_ID = your_facebook_app_id_number'
      }));
      return;
    }
    const loginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=https://ohg-pet-autopilot-production.up.railway.app/auth/callback&scope=pages_manage_posts,pages_read_engagement,publish_to_groups,groups_access_member_info,pages_show_list&response_type=token`;
    const extendUrl = FB_APP_ID && FB_APP_SECRET && FB_SYS_TOKEN
      ? `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${FB_SYS_TOKEN}`
      : null;
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({
      loginUrl,
      extendUrl,
      appIdSet: !!FB_APP_ID,
      appSecretSet: !!FB_APP_SECRET,
      currentTokenLen: FB_SYS_TOKEN.length,
      pageId: FB_PAGE_ID,
      instructions: [
        '1. Open loginUrl in browser to get a new short-lived token',
        '2. The token appears at /auth/callback on Railway',
        '3. If FB_APP_SECRET is set, use extendUrl to make it long-lived (60 days)',
        '4. Paste the new token as FB_TOKEN in Railway Variables'
      ]
    }));
    return;
  }

  // GET /extend-token — auto-extends current token if APP_ID + SECRET are set
  if (req.url === '/extend-token') {
    if (!FB_APP_ID || !FB_APP_SECRET) {
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({
        error: true,
        message: 'FB_APP_ID and FB_APP_SECRET must both be set in Railway variables to auto-extend',
        appIdSet: !!FB_APP_ID,
        appSecretSet: !!FB_APP_SECRET
      }));
      return;
    }
    const extendOptions = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${encodeURIComponent(FB_SYS_TOKEN)}`,
      method: 'GET'
    };
    const extendReq = https.request(extendOptions, (extendRes) => {
      let data = '';
      extendRes.on('data', chunk => data += chunk);
      extendRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.access_token) {
            log(`✅ Token extended! New token len: ${result.access_token.length}. Update FB_TOKEN in Railway.`);
            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(JSON.stringify({
              success: true,
              newToken: result.access_token,
              expiresIn: result.expires_in,
              tokenType: result.token_type,
              action: 'Copy newToken value and paste it as FB_TOKEN in Railway Variables, then redeploy'
            }));
          } else {
            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ error: true, response: result }));
          }
        } catch(e) {
          res.writeHead(500, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ error: e.message, raw: data.substring(0,300) }));
        }
      });
    });
    extendReq.on('error', (e) => {
      res.writeHead(500, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ error: e.message }));
    });
    extendReq.end();
    return;
  }
  // ── END TOKEN REFRESH HELPER ROUTES ──────────────────────────────────────────

  if(req.url && req.url.startsWith('/auth/callback')) {
    res.writeHead(200,{'Content-Type':'text/html'});
    res.end(`<!DOCTYPE html><html><body style="background:#0a0f0d;color:#2dff8e;font-family:Arial;padding:40px;text-align:center"><h2>OHG Token Capture</h2><script>const t=new URLSearchParams(window.location.hash.substring(1)).get('access_token');if(t){document.body.innerHTML+='<p style="word-break:break-all;background:#111;padding:20px;border-radius:8px"><b>YOUR GROUP_TOKEN:</b><br>'+t+'</p>';}else{document.body.innerHTML+='<p>No token found</p>';}<\/script></body></html>`);
    return;
  }
  if(req.url === '/pinterest/boards') {
    fetchPinterestBoards().then(data => { res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(data,null,2)); }).catch(err => { res.writeHead(500,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:err.message})); });
    return;
  }
  if(req.url === '/pinterest/stats') {
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({ totalPins:ptPostCount, lastPin:ptLastPost, nextPost:PT_POSTS[ptIndex%PT_POSTS.length]?.topic, log:ptLog, boardsReady:Object.values(PT_BOARDS).filter(b=>b.id).length, totalBoards:Object.keys(PT_BOARDS).length, totalPosts:PT_POSTS.length, tokenSet:!!process.env.PINTEREST_TOKEN }));
    return;
  }
  if(req.url === '/pinterest/post-now' && req.method === 'POST') {
    runPinterestScheduler().then(() => { res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({success:true,lastPin:ptLastPost})); }).catch(err => { res.writeHead(500,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:err.message})); });
    return;
  }
  if(req.url && req.url.startsWith('/pinterest/callback')) {
    res.writeHead(200,{'Content-Type':'text/html'});
    res.end(`<html><body style="background:#0a0f0d;color:#2dff8e;font-family:Arial;padding:40px"><h2>Pinterest OAuth</h2><pre>${JSON.stringify(Object.fromEntries(new URL('http://x'+req.url).searchParams),null,2)}</pre></body></html>`);
    return;
  }
  if(req.url === '/api/stats') {
    const est = new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
    const nextPost = POSTS[postIndex%62];
    const activeG = PET_GROUPS.filter(g=>!groupStats[g.id].permanent).length;
    const bannedG = PET_GROUPS.filter(g=>groupStats[g.id].permanent).length;
    const coolG = PET_GROUPS.filter(g=>groupStats[g.id].cooldown&&!groupStats[g.id].permanent).length;
    const nextGroup = pickNextGroup()||PET_GROUPS[0];
    const payload = {
      server:'OHG v7.7', time_est:est.toISOString(), is_active:isActiveHour(),
      post_index:postIndex%62+1, round:Math.floor(postIndex/62)+1,
      total_page:totalPosted, total_group:totalGroupPosted, total_comments:totalComments,
      pending_count:pendingGroupPosts.length, groups_total:PET_GROUPS.length,
      groups_active:activeG, groups_banned:bannedG, groups_cooldown:coolG,
      groups_used_cycle:postedGroupsThisCycle.size,
      token_status: lastTokenError ? 'ERROR: '+lastTokenError.substring(0,60) : 'OK',
      token_refresh_attempts: tokenRefreshAttempts,
      pinterest:{totalPins:ptPostCount,lastPin:ptLastPost,boardsReady:Object.values(PT_BOARDS).filter(b=>b.id).length},
      next_post:{id:nextPost.id,title:nextPost.title,cat:nextPost.cat},
      next_group:{id:nextGroup.id,name:nextGroup.name},
      page_token_ok: PAGE_TOKEN ? true : false,
      recent_logs:logs.slice(0,60)
    };
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-cache'});
    res.end(JSON.stringify(payload));
    return;
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  const est = new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const nextPost = POSTS[postIndex%62];
  const nextGroup = pickNextGroup()||PET_GROUPS[0];
  const round = Math.floor(postIndex/62)+1;
  const activeGroups = PET_GROUPS.filter(g=>!groupStats[g.id].permanent);
  const permanentGroups = PET_GROUPS.filter(g=>groupStats[g.id].permanent);
  const cooldownGroups = PET_GROUPS.filter(g=>groupStats[g.id].cooldown&&!groupStats[g.id].permanent);
  const ptBoardsReady = Object.values(PT_BOARDS).filter(b=>b.id).length;
  const tokenOk = !lastTokenError;

  const dashHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>OHG Pet Autopilot v7.7</title><meta http-equiv="refresh" content="30">
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0b1a0f;color:#e2f0e6;min-height:100vh;font-size:13px;}.topbar{background:#0d1f13;border-bottom:1px solid #1a3020;padding:14px 20px;display:flex;align-items:center;gap:12px;}.logo{width:38px;height:38px;background:#1a9e5c;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}.logo-title{font-size:15px;font-weight:600;color:#e2f0e6;}.logo-sub{font-size:11px;color:#5a8a6a;margin-top:1px;}.live-pill{background:#0f3a1e;border:1px solid #1a9e5c;border-radius:20px;padding:4px 12px;display:flex;align-items:center;gap:6px;margin-left:auto;}.dot{width:7px;height:7px;border-radius:50%;background:#1a9e5c;animation:blink 2s infinite;}@keyframes blink{0%,100%{opacity:1;}50%{opacity:.35;}}.live-pill span{font-size:11px;color:#1a9e5c;font-weight:600;}.main{padding:16px 20px;max-width:1200px;margin:0 auto;}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px;}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}.card{background:#0d1f13;border:1px solid #1a3020;border-radius:10px;padding:14px 16px;}.label{font-size:10px;color:#5a8a6a;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;}.val{font-size:26px;font-weight:600;color:#e2f0e6;line-height:1;}.sub{font-size:11px;color:#5a8a6a;margin-top:4px;}.val.green{color:#1a9e5c;}.val.amber{color:#c8900a;}.val.red{color:#e05555;}.alert-card{background:#1a0808;border:1px solid #5a2020;border-radius:10px;padding:14px 16px;margin-bottom:12px;}.alert-title{font-size:12px;color:#e05555;font-weight:700;margin-bottom:6px;}.alert-msg{font-size:11px;color:#c08080;line-height:1.6;}.pt-card{background:#0a0f1a;border:1px solid #1a2a3a;border-radius:10px;padding:14px 16px;margin-bottom:12px;}.pt-title{font-size:11px;color:#4a7aaa;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;}.pt-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}.pt-box{background:#0d1525;border-radius:8px;padding:10px;text-align:center;}.pt-val{font-size:20px;font-weight:600;color:#4a9ed4;}.pt-lbl{font-size:9px;color:#3a5a7a;margin-top:3px;}.card-title{font-size:11px;color:#5a8a6a;text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px;display:flex;align-items:center;gap:6px;}.next-box{background:#0f3a1e;border:1px solid #1a4a26;border-radius:8px;padding:10px 12px;margin-bottom:10px;}.next-tag{font-size:9px;color:#1a9e5c;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;}.next-title{font-size:13px;color:#e2f0e6;font-weight:500;line-height:1.4;}.next-meta{font-size:11px;color:#5a8a6a;margin-top:4px;}.bar-wrap{background:#1a3020;border-radius:3px;height:5px;overflow:hidden;margin-bottom:5px;}.bar-fill{height:100%;border-radius:3px;}.bar-green{background:#1a9e5c;}.bar-blue{background:#4a9ed4;}.bar-label{display:flex;justify-content:space-between;font-size:10px;color:#5a8a6a;margin-bottom:10px;}.mini3{display:flex;gap:8px;margin-top:8px;}.mini-box{flex:1;background:#0f3a1e;border-radius:7px;padding:8px;text-align:center;}.mini-val{font-size:17px;font-weight:600;color:#1a9e5c;}.mini-lbl{font-size:9px;color:#5a8a6a;margin-top:2px;}.g-scroll{max-height:200px;overflow-y:auto;}.g-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #0f1f14;}.g-row:last-child{border:none;}.g-num{font-size:10px;color:#2a4a32;min-width:22px;}.g-name{flex:1;font-size:12px;color:#a0c0a8;}.g-id{font-size:9px;color:#2a4a32;font-family:monospace;}.badge{font-size:9px;padding:2px 7px;border-radius:4px;font-weight:600;white-space:nowrap;}.b-ok{background:#0f3a1e;color:#1a9e5c;}.b-ban{background:#2a1010;color:#7a3535;}.b-cool{background:#2a1f08;color:#8a6018;}.b-next{background:#1a4a26;color:#2dff8e;border:1px solid #1a9e5c;}.b-used{background:#111f16;color:#3a5a44;}.log-wrap{max-height:200px;overflow-y:auto;font-family:monospace;font-size:11px;}.log-line{padding:3px 0;border-bottom:1px solid #0c1810;color:#4a6a52;line-height:1.4;}.log-ok{color:#1a9e5c;}.log-err{color:#e05555;}.log-warn{color:#c8900a;}.log-info{color:#4a9ed4;}.proxy-card{background:#0a1520;border:1px solid #1a3a50;border-radius:10px;padding:14px 16px;margin-bottom:12px;}.proxy-title{font-size:11px;color:#4a9ed4;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;}.foot{border-top:1px solid #1a3020;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;}.foot a{color:#1a9e5c;font-size:11px;text-decoration:none;}.foot span{font-size:11px;color:#3a5a44;}</style></head>
<body>
<div class="topbar">
  <div class="logo">🐾</div>
  <div><div class="logo-title">OHG Pet Autopilot <span style="font-size:11px;color:#1a9e5c;background:#0f3a1e;padding:2px 8px;border-radius:4px;margin-left:6px;">v7.7</span></div>
  <div class="logo-sub">${est.toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} EST &nbsp;·&nbsp; Auto-refresh 30s</div></div>
  <div class="live-pill"><div class="dot"></div><span>${isActiveHour() ? 'Active' : 'Sleeping'}</span></div>
</div>
<div class="main">
  ${!tokenOk ? `<div class="alert-card"><div class="alert-title">🚨 FB TOKEN EXPIRED — Action Required</div><div class="alert-msg">${lastTokenError}<br><br>Fix: Go to Meta Graph Explorer → Generate new long-lived token → Update FB_TOKEN in Railway → Redeploy<br>A fix email has been sent to ${NOTIFY_EMAIL}</div></div>` : ''}
  <div class="grid4">
    <div class="card"><div class="label">Page posts</div><div class="val green">${totalPosted}</div><div class="sub">Total published</div></div>
    <div class="card"><div class="label">Group posts</div><div class="val" style="font-size:14px;color:#5a8a6a">Paused</div><div class="sub">Enable when ready</div></div>
    <div class="card"><div class="label">Comments</div><div class="val">${totalComments}</div><div class="sub">Viral fallback</div></div>
    <div class="card"><div class="label">FB Token</div><div class="val ${tokenOk?'green':'red'}" style="font-size:20px">${tokenOk?'✅':'⚠️'}</div><div class="sub">${tokenOk?'Connected':'EXPIRED — check email'}</div></div>
  </div>
  <div style="background:#1a0d00;border:1px solid #5a3010;border-radius:10px;padding:14px 16px;margin-bottom:12px;">
    <div style="font-size:11px;color:#c8900a;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">🔑 Token Manager — Fix Expired FB Token</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
      <a href="/get-token-url" target="_blank" style="display:block;background:#0f3a1e;border:1px solid #1a9e5c;border-radius:8px;padding:10px;text-align:center;text-decoration:none;">
        <div style="font-size:18px;margin-bottom:4px;">🔗</div>
        <div style="font-size:10px;color:#1a9e5c;font-weight:600;">Get Login URL</div>
        <div style="font-size:9px;color:#5a8a6a;margin-top:2px;">Opens OAuth flow</div>
      </a>
      <a href="/extend-token" target="_blank" style="display:block;background:#0f3a1e;border:1px solid #1a9e5c;border-radius:8px;padding:10px;text-align:center;text-decoration:none;">
        <div style="font-size:18px;margin-bottom:4px;">⏱️</div>
        <div style="font-size:10px;color:#1a9e5c;font-weight:600;">Auto-Extend Token</div>
        <div style="font-size:9px;color:#5a8a6a;margin-top:2px;">Needs APP_SECRET</div>
      </a>
      <a href="/auth/callback" target="_blank" style="display:block;background:#0f3a1e;border:1px solid #1a9e5c;border-radius:8px;padding:10px;text-align:center;text-decoration:none;">
        <div style="font-size:18px;margin-bottom:4px;">📋</div>
        <div style="font-size:10px;color:#1a9e5c;font-weight:600;">View Callback</div>
        <div style="font-size:9px;color:#5a8a6a;margin-top:2px;">Token capture page</div>
      </a>
    </div>
    <div style="font-size:10px;color:#8a6018;line-height:1.8;background:#2a1508;border-radius:6px;padding:8px 10px;">
      Required Railway vars: <code style="color:#c8900a">FB_APP_ID</code> (App ID number) + <code style="color:#c8900a">FB_APP_SECRET</code> (optional, for auto-extend)<br>
      Status: APP_ID ${FB_APP_ID ? '✅ set' : '⚠️ NOT SET — add FB_APP_ID to Railway vars'} &nbsp;·&nbsp; APP_SECRET ${FB_APP_SECRET ? '✅ set' : '⚠️ not set'}
    </div>
  </div>
  <div class="proxy-card">
    <div class="proxy-title">🔌 Claude Proxy — Content Manager Bridge</div>
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
      <div style="font-size:12px;color:#a0c0d8;line-height:1.7;"><span style="color:#4a9ed4;">POST</span> <code style="background:#0d1f2e;padding:2px 8px;border-radius:4px;font-size:11px;">/claude-proxy</code> — active ✅<br><span style="font-size:10px;color:#3a5a7a;">Used by OHG-Content-Manager.html to call Claude API securely</span></div>
      <div style="margin-left:auto;text-align:right;"><div style="font-size:11px;color:#4a9ed4;">CORS: enabled ✅</div><div style="font-size:10px;color:#3a5a7a;">web-search beta: enabled ✅</div></div>
    </div>
  </div>
  <div class="pt-card">
    <div class="pt-title">📌 Pinterest Autopilot</div>
    <div class="pt-grid">
      <div class="pt-box"><div class="pt-val">${ptPostCount}</div><div class="pt-lbl">Pins posted</div></div>
      <div class="pt-box"><div class="pt-val">${ptBoardsReady}<span style="font-size:12px;color:#3a5a7a;">/${Object.keys(PT_BOARDS).length}</span></div><div class="pt-lbl">Boards ready</div></div>
      <div class="pt-box"><div class="pt-val">${PT_POSTS.length}</div><div class="pt-lbl">Posts in rotation</div></div>
      <div class="pt-box"><div class="pt-val" style="font-size:14px;">${process.env.PINTEREST_TOKEN ? '✅' : '⚠️'}</div><div class="pt-lbl">${process.env.PINTEREST_TOKEN ? 'Token set' : 'No token'}</div></div>
    </div>
    ${ptLastPost ? `<div style="margin-top:10px;padding:8px 10px;background:#0d1525;border-radius:6px;font-size:11px;color:#4a7aaa;">✅ Last pin: <span style="color:#a0c0d8;">${ptLastPost.topic}</span> → ${ptLastPost.board}</div>` : `<div style="margin-top:10px;padding:8px 10px;background:#0d1525;border-radius:6px;font-size:11px;color:#3a5a7a;">⏳ ${ptBoardsReady===0?'Add board IDs to Railway vars':'Waiting for next interval'}</div>`}
    <div style="margin-top:8px;font-size:10px;color:#3a5a7a;">Posts every 2.5hrs · <a href="/pinterest/boards" style="color:#4a7aaa;text-decoration:none;">Get board IDs →</a></div>
  </div>
  <div class="grid4">
    <div class="card"><div class="label">Post index</div><div class="val">${postIndex%62+1}<span style="font-size:14px;color:#5a8a6a;">/62</span></div><div class="sub">Round ${round}</div></div>
    <div class="card"><div class="label">Active groups</div><div class="val green">${activeGroups.length}</div><div class="sub">${permanentGroups.length} banned · ${cooldownGroups.length} cooldown</div></div>
    <div class="card"><div class="label">Used this cycle</div><div class="val">${postedGroupsThisCycle.size}</div><div class="sub">of 51 groups</div></div>
    <div class="card"><div class="label">Token refreshes</div><div class="val ${tokenRefreshAttempts>0?'amber':'green'}">${tokenRefreshAttempts}</div><div class="sub">${tokenRefreshAttempts>0?'errors detected':'clean'}</div></div>
  </div>
  <div class="grid2">
    <div class="card">
      <div class="card-title">Next scheduled FB post</div>
      <div class="next-box"><div class="next-tag">P${String(nextPost.id).padStart(2,'0')} &nbsp;·&nbsp; ${nextPost.cat}</div><div class="next-title">${nextPost.title}</div><div class="next-meta">Next group: ${nextGroup.name}</div></div>
      <div style="font-size:11px;color:#5a8a6a;">Fires every 60 min · 24/7 active</div>
    </div>
    <div class="card">
      <div class="card-title">Cycle progress</div>
      <div class="bar-wrap"><div class="bar-fill bar-green" style="width:${Math.round(((postIndex%62+1)/62)*100)}%"></div></div>
      <div class="bar-label"><span>FB posts cycle</span><span>${Math.round(((postIndex%62+1)/62)*100)}%</span></div>
      <div class="bar-wrap"><div class="bar-fill bar-blue" style="width:${Math.round((ptPostCount/PT_POSTS.length)*100)}%"></div></div>
      <div class="bar-label"><span>Pinterest cycle</span><span>${Math.round((ptPostCount/PT_POSTS.length)*100)}%</span></div>
      <div class="mini3">
        <div class="mini-box"><div class="mini-val">62</div><div class="mini-lbl">FB Posts</div></div>
        <div class="mini-box"><div class="mini-val">${PT_POSTS.length}</div><div class="mini-lbl">PT Posts</div></div>
        <div class="mini-box" style="background:#1a2e10;"><div class="mini-val" style="color:#c8900a;">R${round}</div><div class="mini-lbl">Round</div></div>
      </div>
    </div>
  </div>
  <div class="card" style="margin-bottom:12px;">
    <div class="card-title">Group rotation — ${PET_GROUPS.length} groups <span style="margin-left:auto;font-size:10px;background:#0f3a1e;color:#1a9e5c;padding:2px 8px;border-radius:4px;">${activeGroups.length} ready · ${permanentGroups.length} banned</span></div>
    <div class="g-scroll">${PET_GROUPS.map((g,i)=>{const s=groupStats[g.id];const isNext=nextGroup&&g.id===nextGroup.id;const used=postedGroupsThisCycle.has(g.id);let badge='';if(isNext)badge='<span class="badge b-next">◀ next</span>';else if(s.permanent)badge='<span class="badge b-ban">⛔ banned</span>';else if(s.cooldown)badge='<span class="badge b-cool">🚫 cooldown</span>';else if(used)badge='<span class="badge b-used">✓ used</span>';else badge='<span class="badge b-ok">ready</span>';const stats=(s.success>0||s.fail>0)?`<span style="font-size:10px;color:#3a5a44;margin-right:6px;">✅${s.success} ❌${s.fail}</span>`:'';return `<div class="g-row"><span class="g-num">${i+1}</span><span class="g-name">${g.name}</span>${stats}<span class="g-id">${g.id.substring(0,10)}...</span>${badge}</div>`;}).join('')}</div>
  </div>
  <div class="card" style="margin-bottom:16px;">
    <div class="card-title">Deploy logs <span style="margin-left:auto;font-size:10px;color:#3a5a44;">${logs.length} entries</span></div>
    <div class="log-wrap">${logs.slice(0,60).map(l=>{let cls='log-line';if(l.includes('✅')||l.includes('SUCCESS'))cls+=' log-ok';else if(l.includes('❌')||l.includes('ERROR'))cls+=' log-err';else if(l.includes('⚠️')||l.includes('🚫')||l.includes('SKIP'))cls+=' log-warn';else if(l.includes('[Pinterest]')||l.includes('📧')||l.includes('🔄')||l.includes('[Proxy]'))cls+=' log-info';const ts=l.match(/\[([\d\-T:.Z]+)\]/);const msg=ts?l.replace(ts[0],'').trim():l;const time=ts?new Date(ts[1]).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'';return `<div class="${cls}"><span style="color:#2a4a32;margin-right:8px;">${time}</span>${msg}</div>`;}).join('')}</div>
  </div>
</div>
<div class="foot">
  <a href="https://onehealthglobe.com" target="_blank">onehealthglobe.com</a>
  <span>OHG v7.7 · FB 62 posts · Pinterest ${PT_POSTS.length} posts · Claude Proxy ✅</span>
  <a href="/api/stats" target="_blank">API stats →</a>
</div></body></html>`;

  res.writeHead(200,{'Content-Type':'text/html'});
  res.end(dashHtml);
}).listen(PORT, () => log(`Dashboard on port ${PORT}`));

// ── VIRAL COMMENT FALLBACK ────────────────────────────────────────────────────
async function findViralPostInGroup(groupId) {
  try {
    const options={hostname:'graph.facebook.com',path:`/v19.0/${groupId}/feed?fields=id,message,likes.summary(true),comments.summary(true),created_time&limit=10&access_token=${GROUP_TOKEN}`,method:'GET'};
    const data=await apiRequest(options,null);
    if(data.error||!data.data||data.data.length===0) return null;
    let best=null,bestScore=-1;
    for(const post of data.data){const likes=(post.likes&&post.likes.summary)?post.likes.summary.total_count:0;const comments=(post.comments&&post.comments.summary)?post.comments.summary.total_count:0;const score=likes+comments*3;if(score>bestScore){bestScore=score;best=post;}}
    return best;
  } catch(e){log(`Viral search error: ${e.message}`);return null;}
}
async function postCommentOnViral(viralPostId,commentText){
  const body=JSON.stringify({message:commentText,access_token:GROUP_TOKEN});
  const options={hostname:'graph.facebook.com',path:`/v19.0/${viralPostId}/comments`,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
  const data=await apiRequest(options,body);
  if(data.error) throw new Error(data.error.message);
  return data.id;
}
function buildCommentText(caption,utm,post){const lines=caption.split('\n').filter(l=>l.trim());const hook=lines[0]||post.title.toUpperCase();const body=lines.slice(1,3).join(' ').trim();return `${hook}\n\n${body}\n\n🔗 ${utm}${post.aff?'':' | onehealthglobe.com'}`;}
async function checkAndCommentFallback(){
  if(pendingGroupPosts.length===0) return;
  const now=Date.now();const stillPending=[];
  for(const p of pendingGroupPosts){
    const ageMin=(now-p.postedAt)/60000;
    if(ageMin>=30&&!p.commentFired){
      log(`⏱️ ${p.groupName}: ${Math.round(ageMin)}min — comment fallback`);
      const viralPost=await findViralPostInGroup(p.groupId);
      if(viralPost){try{const commentText=buildCommentText(p.fullCaption,p.utm,{title:p.title,aff:p.aff||false});const commentId=await postCommentOnViral(viralPost.id,commentText);log(`💬 Comment posted in ${p.groupName} — ID: ${commentId}`);p.commentFired=true;p.commentId=commentId;totalComments++;stillPending.push(p);}catch(e){log(`💬 Comment failed: ${e.message}`);p.commentFired=true;stillPending.push(p);}}
      else{p.commentFired=true;stillPending.push(p);}
    }else if(ageMin<30){stillPending.push(p);}
    else{const ageH=ageMin/60;if(ageH<72)stillPending.push(p);else{log(`⏰ ${p.groupName}: expired — retrying`);await postToGroupWithRetry(p.fullCaption,p.imageUrl,p.utm,{title:p.title},p.triedGroups||[]);}}
  }
  pendingGroupPosts=stillPending;
}
