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

  // ── DASHBOARD JS ─────────────────────────────────────────────────────────
  if(req.url === '/dashboard.js') {
    const dashJS = "'use strict';\nconst RAILWAY = window.location.origin;\n\nconst OHG_PUBLISHED = ['beagle','boxer','bulldog','german shepherd','rottweiler','pomeranian','persian cat','ragdoll','deadly dog diseases','pet first aid','pet vaccines','toxic plants','zoonosis','kitten planner','pet food faq','cat grooming','pet hygiene','osteoarthritis cats','paw scratches','harness training'];\n\nconst ZOETIS_GAPS = [\n  'why is my dog itching constantly','dog separation anxiety home treatment','how to potty train a puppy fast',\n  'dog arthritis early warning signs','why is my cat throwing up every day','signs of heartworm in dogs USA',\n  'flea and tick prevention dogs 2025','dog seasonal allergies treatment at home','cat urinary tract infection symptoms',\n  'puppy first vet visit what to expect','how to brush dog teeth at home','dog ear infection natural remedy',\n  'cat dental disease treatment','pancreatitis in dogs home care','dog food allergies vs intolerances',\n  'cat hairball remedies that work','dog hot spots treatment at home','kennel cough in dogs recovery',\n  'cat hyperthyroidism signs and diet','dog hip dysplasia exercises','reverse sneezing in dogs causes',\n  'dog anal gland problems relief','leptospirosis in dogs prevention','cat ringworm treatment home',\n  'dog epilepsy management','pet diabetes warning signs','how to trim dog nails safely',\n  'cat litter box avoidance reasons','dog vomiting yellow bile causes','cat overgrooming stress signs',\n  'dog skin rash treatment','parvo in vaccinated puppies','cat chronic kidney disease diet',\n  'dog congestive heart failure signs','cat eye discharge colors meaning','dog constipation home remedy',\n  'feline leukemia prevention','canine distemper vaccine schedule','cat scratch disease humans',\n  'dog ACL injury recovery','senior dog care guide 2025','cat arthritis pain management',\n  'pet insurance worth it 2025','how to give liquid medicine to cat','dog cognitive dysfunction pacing',\n  'dog liver disease diet','cat bladder stones symptoms','dog bloat GDV emergency signs',\n  'dog mange home treatment','puppy socialization critical age','indoor cat enrichment ideas',\n  'how to stop dog barking','cat scratching furniture fix','best family dog breeds USA 2025',\n  'best cats for first time owners','how often to bathe a dog','dog nail grinding vs clipping',\n  'best food for senior dogs joints','wet vs dry cat food comparison','toxic plants for cats full list',\n  'foods dogs cannot eat complete','xylitol poisoning dogs symptoms','chocolate toxicity dogs amount',\n  'dog first aid kit essentials','pet emergency preparedness plan','traveling with cats by car tips',\n  'hiking with dogs safety tips','dog swimming pool safety','cat separation anxiety solutions',\n  'dog thunder phobia treatment','how to introduce new puppy to old dog','dog resource guarding treatment',\n  'dog destructive chewing solutions','how to tell if dog is in pain','cat hiding behavior meaning',\n  'dog panting at night causes','cat not eating 2 days causes','dog drinking too much water causes',\n  'dog bad breath home treatment','dog scooting carpet fix','cat sneezing constantly causes',\n  'dog limping front leg diagnosis','dog swollen belly emergency','cat third eyelid showing causes',\n  'puppy teething relief tips','dog car sickness prevention','cat indoor safety checklist'\n];\n\nlet S = {\n  currentTopic: null, currentArticle: null, history: [],\n  cycleStart: null, totalCycles: 0, published: 0, pending: 0, lastScan: null,\n  logs: [{ts:'INIT', type:'ok', msg:'OHG Command Center ready'}]\n};\nlet timerInterval = null;\n\nfunction init() {\n  loadState();\n  startClock();\n  if (S.cycleStart) restoreTimer();\n  updateUI();\n  renderLog();\n  checkConn();\n  setInterval(() => location.reload(), 600000);\n}\n\nasync function checkConn() {\n  const el = document.getElementById('cm-conn');\n  const txt = document.getElementById('conn-text');\n  try {\n    const r = await fetch(RAILWAY + '/api/stats', {signal: AbortSignal.timeout(5000)});\n    if (r.ok || r.status < 500) {\n      if(el) { el.textContent = 'connected'; el.style.color = 'var(--green)'; }\n      if(txt) { txt.textContent = 'connected'; txt.style.color = 'var(--green)'; }\n      addLog('ok', 'Railway connected');\n    } else throw new Error('HTTP ' + r.status);\n  } catch(e) {\n    if(el) { el.textContent = 'offline'; el.style.color = 'var(--red)'; }\n    if(txt) { txt.textContent = 'offline'; txt.style.color = 'var(--red)'; }\n    addLog('warn', 'Railway: ' + e.message);\n  }\n}\n\nfunction saveState() {\n  try {\n    localStorage.setItem('ohg_cm', JSON.stringify({\n      currentTopic: S.currentTopic, currentArticle: S.currentArticle,\n      history: S.history, cycleStart: S.cycleStart, totalCycles: S.totalCycles,\n      published: S.published, pending: S.pending, lastScan: S.lastScan\n    }));\n  } catch(e) {}\n}\nfunction loadState() {\n  try {\n    const d = JSON.parse(localStorage.getItem('ohg_cm') || '{}');\n    Object.assign(S, d);\n    addLog('info', 'Loaded: ' + S.history.length + ' topics');\n  } catch(e) { addLog('info', 'Fresh start'); }\n}\nfunction resetAll() {\n  if (!confirm('Reset all content data?')) return;\n  localStorage.removeItem('ohg_cm');\n  S = {currentTopic:null,currentArticle:null,history:[],cycleStart:null,totalCycles:0,published:0,pending:0,lastScan:null,logs:[{ts:'RESET',type:'warn',msg:'Data reset'}]};\n  if (timerInterval) clearInterval(timerInterval);\n  timerInterval = null;\n  const cd = document.getElementById('countdown');\n  if(cd) cd.textContent = '24:00:00';\n  const pg = document.getElementById('prog');\n  if(pg) pg.style.width = '0%';\n  const gb = document.getElementById('gen-btn');\n  if(gb) gb.style.display = 'none';\n  const pb = document.getElementById('pub-btn');\n  if(pb) pb.style.display = 'none';\n  const tm = document.getElementById('topic-main');\n  if(tm) tm.innerHTML = '<div class=\"empty\">No topic yet. Click Run content cycle.</div>';\n  const aa = document.getElementById('article-area');\n  if(aa) aa.innerHTML = '';\n  updateUI(); renderLog();\n}\n\nfunction startClock() {\n  setInterval(() => {\n    const el = document.getElementById('clock');\n    if (el) el.textContent = new Date().toLocaleTimeString('en-US', {hour12:false});\n  }, 1000);\n}\nfunction startTimer() {\n  S.cycleStart = Date.now(); saveState();\n  if (timerInterval) clearInterval(timerInterval);\n  timerInterval = setInterval(tickTimer, 1000);\n}\nfunction restoreTimer() {\n  if (timerInterval) clearInterval(timerInterval);\n  timerInterval = setInterval(tickTimer, 1000);\n}\nfunction tickTimer() {\n  if (!S.cycleStart) return;\n  const rem = Math.max(0, 24*3600000 - (Date.now() - S.cycleStart));\n  const h = Math.floor(rem/3600000), m = Math.floor((rem%3600000)/60000), s = Math.floor((rem%60000)/1000);\n  const el = document.getElementById('countdown');\n  if (el) el.textContent = pad(h)+':'+pad(m)+':'+pad(s);\n  const pf = document.getElementById('prog');\n  if (pf) pf.style.width = Math.min(100,((Date.now()-S.cycleStart)/86400000)*100).toFixed(2)+'%';\n  if (rem === 0) { clearInterval(timerInterval); addLog('ok','24h cycle complete'); }\n}\nfunction pad(n) { return String(n).padStart(2,'0'); }\n\nfunction addLog(type, msg) {\n  const ts = new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});\n  S.logs.unshift({ts, type, msg});\n  if (S.logs.length > 100) S.logs.pop();\n  renderLog();\n}\nfunction renderLog() {\n  const box = document.getElementById('log-area');\n  if (!box) return;\n  const cls = {ok:'ll-ok', info:'ll-info', warn:'ll-warn', err:'ll-err'};\n  box.innerHTML = S.logs.map(l =>\n    '<div class=\"ll\"><span class=\"lts\">'+esc(l.ts)+'</span><span class=\"'+(cls[l.type]||'')+'\">'+esc(l.msg)+'</span></div>'\n  ).join('');\n}\n\nfunction updateUI() {\n  set('s-total', S.totalCycles);\n  set('s-art', S.history.filter(h=>h.hasArticle).length);\n  set('s-pend', S.pending);\n  set('s-pub', S.published);\n  const rem = Math.max(0, ZOETIS_GAPS.length - S.totalCycles);\n  set('cm-gap-info', rem + ' gaps remaining');\n  set('history-count', S.history.length + ' topics');\n  renderHistory();\n  if (S.currentTopic) renderCurrentTopic();\n  if (S.lastScan) set('scan-info','last scan: '+S.lastScan);\n  const pb = document.getElementById('pub-btn');\n  if (pb) pb.style.display = (S.currentTopic && S.currentTopic.status !== 'published') ? 'block' : 'none';\n  const gb = document.getElementById('gen-btn');\n  if (gb) {\n    if (S.currentTopic) {\n      gb.style.display = 'block';\n      gb.textContent = S.currentArticle ? 'Regenerate article' : 'Generate article';\n    } else {\n      gb.style.display = 'none';\n    }\n  }\n}\n\nfunction renderCurrentTopic() {\n  const t = S.currentTopic; if(!t) return;\n  const isPub = t.status === 'published';\n  document.getElementById('topic-main').innerHTML =\n    '<div style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:5px\">'+\n    '<span class=\"'+(isPub?'badge-pub':'badge-pend')+'\">'+(isPub?'published':'pending')+'</span>'+\n    '<span style=\"font-size:10px;color:var(--muted);font-family:DM Mono,monospace\">cycle #'+(t.cycleNum||S.totalCycles)+' - '+(t.date||'')+'</span></div>'+\n    '<div class=\"topic-title\">'+esc(t.title)+'</div>'+\n    '<div style=\"font-size:10px;color:var(--muted);margin-bottom:6px;display:flex;gap:6px;flex-wrap:wrap\">'+\n    '<span style=\"background:var(--bg);padding:2px 6px;border-radius:3px\">difficulty: '+esc(t.difficulty||'low')+'</span>'+\n    '<span style=\"background:var(--bg);padding:2px 6px;border-radius:3px\">intent: '+esc(t.intent||'informational')+'</span></div>'+\n    '<div class=\"kw-row\">'+(t.keywords||[]).map((k,i)=>'<span class=\"kw '+(i===0?'k1':'')+'\">#'+(i+1)+' '+esc(k)+'</span>').join('')+'</div>'+\n    '<div class=\"info-row\">'+esc(t.rationale||'')+'</div>'+\n    '<div style=\"display:flex;gap:6px;flex-wrap:wrap\">'+(S.currentArticle?'<button class=\"btn sm blue-btn\" onclick=\"downloadArticle()\">Download HTML</button><button class=\"btn sm\" onclick=\"copyArticle()\">Copy</button>':'')+'</div>';\n}\n\nfunction renderHistory() {\n  const area = document.getElementById('history-area'); if(!area) return;\n  if (!S.history.length) { area.innerHTML='<div class=\"empty\" style=\"padding:16px\">No history yet</div>'; return; }\n  area.innerHTML = '<div style=\"max-height:180px;overflow-y:auto\">'+\n    S.history.slice().reverse().map((h,i)=>\n      '<div class=\"hrow\"><span class=\"hnum\">#'+(S.history.length-i)+'</span>'+\n      '<div style=\"flex:1\"><div class=\"htitle\">'+esc(h.title)+'</div>'+\n      '<div class=\"hmeta\">'+(h.date||'')+(h.hasArticle?' - article':'')+'</div></div>'+\n      '<span class=\"hstatus '+(h.status==='published'?'pub':'p')+'\">'+(h.status==='published'?'done':'pending')+'</span></div>'\n    ).join('')+'</div>';\n}\n\n// \u2500\u2500 CLAUDE API \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nasync function callClaude(messages, useSearch) {\n  const body = {model:'claude-sonnet-4-5', max_tokens:(useSearch?1500:4000), messages:messages};\n  if (useSearch) body.tools = [{type:'web_search_20250305', name:'web_search'}];\n  const r = await fetch(RAILWAY+'/claude-proxy', {\n    method:'POST', headers:{'Content-Type':'application/json'},\n    body:JSON.stringify(body), signal:AbortSignal.timeout(90000)\n  });\n  if (!r.ok) {\n    const txt = await r.text();\n    let errMsg = 'Railway '+r.status;\n    try { const e = JSON.parse(txt); errMsg = e.error?.message || errMsg; } catch(ex) {}\n    if (r.status === 429) throw new Error('RATE_LIMIT:'+errMsg);\n    throw new Error(errMsg);\n  }\n  const d = await r.json();\n  if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));\n  return (d.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');\n}\n\nasync function callClaudeWithRetry(messages, useSearch) {\n  for (let i = 0; i < 3; i++) {\n    try {\n      return await callClaude(messages, useSearch);\n    } catch(e) {\n      if (e.message.startsWith('RATE_LIMIT') && i < 2) {\n        const wait = 60;\n        addLog('warn', 'Rate limited \u2014 waiting '+wait+'s before retry '+(i+2)+'/3...');\n        showWait(wait);\n        await new Promise(r => setTimeout(r, wait*1000));\n      } else {\n        throw e;\n      }\n    }\n  }\n}\n\nfunction showWait(secs) {\n  const tm = document.getElementById('topic-main');\n  if (!tm) return;\n  let rem = secs;\n  tm.innerHTML = '<div class=\"empty\" style=\"color:var(--amber)\">Rate limited by Claude API.<br>Retrying in <strong id=\"wait-count\">'+rem+'</strong>s...<br><span style=\"font-size:10px;color:var(--muted)\">This is normal when autopilot runs simultaneously.</span></div>';\n  const tick = setInterval(()=>{\n    rem--;\n    const el = document.getElementById('wait-count');\n    if(el) el.textContent = rem;\n    if (rem <= 0) clearInterval(tick);\n  }, 1000);\n}\n\n// \u2500\u2500 RUN CYCLE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nasync function runCycle() {\n  const btn = document.getElementById('run-btn');\n  btn.disabled = true; btn.textContent = 'Running...';\n  addLog('info', 'Content cycle started');\n  document.getElementById('topic-main').innerHTML =\n    '<div class=\"empty\"><span class=\"spin\" style=\"width:18px;height:18px;border-width:3px;display:block;margin:0 auto 8px\"></span>'+\n    '<span style=\"color:var(--blue)\">Searching USA pet trends + gaps...</span></div>';\n\n  const used = S.history.map(h=>h.title.split(' ').slice(0,3).join(' ')).slice(-10).join(', ') || 'none';\n  const gaps = ZOETIS_GAPS.filter(g=>!S.history.some(h=>h.title.toLowerCase().includes(g.split(' ')[0]))).slice(0,10).join(', ');\n  const today = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});\n\n  const prompt = 'Pet health SEO strategist for onehealthglobe.com (DR0). Today: '+today+'\\nAvoid these recent topics: '+used+'\\nSuggest from these gaps: '+gaps+'\\nPick ONE low-competition USA pet health topic (KD<20, informational).\\nRespond ONLY with valid JSON:\\n{\"title\":\"...\",\"keywords\":[\"primary\",\"secondary\",\"longtail\"],\"rationale\":\"1 sentence.\",\"difficulty\":\"low\",\"intent\":\"informational\"}';\n\n  try {\n    addLog('info', 'Calling Claude...');\n    const text = await callClaudeWithRetry([{role:'user',content:prompt}], true);\n    addLog('info', 'Parsing response...');\n    const s = text.indexOf('{'), e = text.lastIndexOf('}');\n    if (s<0||e<0) throw new Error('No JSON in response: '+text.substring(0,200));\n    const topic = JSON.parse(text.slice(s,e+1));\n    if (!topic.title||!Array.isArray(topic.keywords)) throw new Error('Invalid JSON format');\n    topic.status='pending'; topic.date=today; topic.id=Date.now();\n    topic.cycleNum=S.totalCycles+1; topic.hasArticle=false;\n    S.currentTopic=topic; S.currentArticle=null;\n    S.history.push(Object.assign({},topic)); S.totalCycles++; S.pending++;\n    addLog('ok','Topic: '+topic.title);\n    addLog('ok','Keywords: '+topic.keywords.join(' | '));\n    document.getElementById('gen-btn').style.display='block';\n    document.getElementById('gen-btn').textContent='Generate article';\n    document.getElementById('pub-btn').style.display='block';\n    startTimer(); updateUI(); saveState();\n  } catch(e) {\n    const msg = e.message.replace('RATE_LIMIT:','');\n    addLog('err', msg);\n    document.getElementById('topic-main').innerHTML =\n      '<div class=\"err-box\"><strong>Error</strong><br>'+esc(msg)+\n      '<div class=\"err-fix\">If rate limited: wait 60s then try again.<br>Railway/Claude key issue: check Railway vars.</div></div>';\n  }\n  btn.disabled=false; btn.textContent='Run content cycle';\n}\n\n// \u2500\u2500 GENERATE ARTICLE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nasync function generateArticle() {\n  if (!S.currentTopic) return;\n  const btn = document.getElementById('gen-btn');\n  btn.disabled=true; btn.textContent='Writing...';\n  addLog('info','Generating article...');\n  document.getElementById('article-area').innerHTML =\n    '<div class=\"cm-topic\" style=\"margin-top:8px\"><div class=\"empty\">'+\n    '<span class=\"spin\" style=\"width:18px;height:18px;border-width:3px;display:block;margin:0 auto 8px\"></span>'+\n    '<span style=\"color:var(--blue)\">Writing full article with OHG brand system...</span></div></div>';\n\n  const t = S.currentTopic;\n  const today = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});\n  const prompt = [\n    'Write a complete OHG-branded HTML article for onehealthglobe.com.',\n    'Topic: '+t.title,\n    'Primary keyword: '+t.keywords[0],\n    'Secondary keywords: '+(t.keywords.slice(1)).join(', '),\n    'Date: '+today,\n    '',\n    'Brand: DM Serif Display headings, DM Sans body.',\n    'Colors: --g1:#0b1f13 --g2:#145238 --g3:#1a6b4a --g4:#2d9c6e --g5:#e8f5ef --gold:#d4a04a --red:#dc2626 --cream:#fdfaf6',\n    '',\n    'Must include ALL these sections: VetBanner, StickyNav, Hero (H1+disclaimer), QuickTable, ContentSections, GlanceBox, FAQAccordion(3-5 questions), ResourceGrid, FinalCTA',\n    '',\n    'Required internal links: /dog-paw-scanner/ /pet-vaccine-tracker/ /pet-first-aid-kit-checklist/ /pet-safety-hub/ /',\n    'SEO: BreadcrumbList+Article+FAQPage JSON-LD, 50-60 char title, 145-155 char desc, 900-1100 words.',\n    'EEAT: include \"veterinarians recommend\" and \"vet-reviewed\".',\n    '',\n    'Output: complete HTML only, from <!DOCTYPE html> to </html>, no explanation.'\n  ].join('\\n');\n\n  try {\n    const html = await callClaudeWithRetry([{role:'user',content:prompt}], false);\n    S.currentArticle = html;\n    const wc = html.replace(/<[^>]+>/g,'').split(/\\s+/).filter(Boolean).length;\n    addLog('ok','Article ready: ~'+wc+' words');\n    const idx = S.history.findIndex(h=>h.id===t.id);\n    if(idx>=0){S.history[idx].hasArticle=true;S.history[idx].wordCount=wc;}\n    if(S.currentTopic) S.currentTopic.hasArticle=true;\n    saveState(); updateUI();\n    document.getElementById('article-area').innerHTML =\n      '<div class=\"article-card\">'+\n      '<div style=\"font-size:13px;font-weight:600;margin-bottom:7px\">'+esc(t.title)+'</div>'+\n      '<div style=\"font-size:10px;color:var(--muted);margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap\">'+\n      '<span style=\"background:var(--bg);padding:2px 6px;border-radius:3px\">~'+wc+' words</span>'+\n      '<span style=\"background:var(--bg);padding:2px 6px;border-radius:3px\">schema OK</span>'+\n      '<span style=\"background:var(--bg);padding:2px 6px;border-radius:3px\">OHG brand OK</span></div>'+\n      '<div style=\"display:flex;gap:6px;margin-bottom:8px\">'+\n      '<button class=\"btn sm blue-btn\" onclick=\"downloadArticle()\">Download HTML</button>'+\n      '<button class=\"btn sm\" onclick=\"copyArticle()\">Copy HTML</button></div>'+\n      '<div class=\"wp-steps\">WordPress: Pages > Add New > Code Editor > Paste > Publish</div>'+\n      '<div class=\"code-preview\">'+esc(html)+'</div></div>';\n    renderCurrentTopic();\n  } catch(e) {\n    addLog('err','Article error: '+e.message);\n    const aa = document.getElementById('article-area');\n    if(aa) aa.innerHTML='<div class=\"err-box\"><strong>Article Error</strong><br>'+esc(e.message)+'<div class=\"err-fix\">If rate limited: wait 60s. If timeout: article too long, try again.</div></div>';\n  }\n  try { btn.disabled=false; btn.textContent='Regenerate article'; } catch(ex) {}\n}\n\nfunction downloadArticle() {\n  if (!S.currentArticle||!S.currentTopic) return;\n  const blob = new Blob([S.currentArticle],{type:'text/html;charset=utf-8'});\n  const url = URL.createObjectURL(blob);\n  const a = document.createElement('a');\n  a.href=url; a.download='ohg-'+S.currentTopic.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,55)+'.html';\n  document.body.appendChild(a); a.click(); document.body.removeChild(a);\n  URL.revokeObjectURL(url); addLog('ok','Downloaded');\n}\nfunction copyArticle() {\n  if (!S.currentArticle) return;\n  navigator.clipboard.writeText(S.currentArticle)\n    .then(()=>{ addLog('ok','Copied'); alert('Copied! Paste into WordPress Code Editor.'); })\n    .catch(()=>addLog('warn','Clipboard unavailable - use Download'));\n}\nfunction markPublished() {\n  if (!S.currentTopic) return;\n  S.currentTopic.status='published';\n  const idx = S.history.findIndex(h=>h.id===S.currentTopic.id);\n  if(idx>=0) S.history[idx].status='published';\n  S.pending=Math.max(0,S.pending-1); S.published++;\n  const pb = document.getElementById('pub-btn');\n  if(pb) pb.style.display='none';\n  addLog('ok','Published: '+S.currentTopic.title);\n  renderCurrentTopic(); updateUI(); saveState();\n}\nasync function scanSite() {\n  addLog('info','Scanning sitemap...'); set('scan-info','scanning...');\n  try {\n    const text = await callClaude([{role:'user',content:'Search onehealthglobe.com sitemap. List 8 most recently updated page URLs, numbered.'}],true);\n    addLog('ok','Scan done');\n    text.split('\\n').filter(l=>l.trim()).slice(0,8).forEach(l=>addLog('info',l.trim().slice(0,90)));\n    const now = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});\n    S.lastScan=now; set('scan-info','last: '+now); saveState();\n  } catch(e) { addLog('err','Scan: '+e.message); set('scan-info','failed'); }\n}\n\nfunction esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;'); }\nfunction set(id,val) { const el=document.getElementById(id); if(el) el.textContent=val; }\n\ninit();\n";
    res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-cache'});
    res.end(dashJS);
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

  const dashHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>OHG Command Center v7.7</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>">
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#070d0a;--s1:#0d1610;--s2:#111e14;
  --border:#1e3025;--border2:#243b2e;
  --green:#00e5a0;--green2:#00c48a;--blue:#3d8bff;--red:#ff5252;--amber:#f5a623;
  --text:#d4e8dc;--muted:#4a7060;--muted2:#2a4a38;
}
html,body{font-family:'Sora',sans-serif;font-size:13px;background:var(--bg);color:var(--text);min-height:100vh}
/* TOPBAR */
.topbar{background:var(--s1);border-bottom:1px solid var(--border);padding:0 20px;height:52px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:100}
.brand-icon{width:34px;height:34px;background:linear-gradient(135deg,#0b3020,#00e5a030);border:1px solid var(--green);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.brand-name{font-family:'DM Mono',monospace;font-size:13px;color:var(--green);letter-spacing:0.05em}
.brand-sub{font-size:9px;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase}
.status-pill{display:flex;align-items:center;gap:5px;padding:4px 10px;background:var(--s2);border:1px solid var(--border);border-radius:20px;margin-left:auto}
.dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
/* LAYOUT */
.layout{display:grid;grid-template-columns:210px 1fr;min-height:calc(100vh - 52px - 38px)}
/* SIDEBAR */
.sidebar{background:var(--s1);border-right:1px solid var(--border);padding:14px 12px;display:flex;flex-direction:column;gap:8px;position:sticky;top:52px;height:calc(100vh - 52px - 38px);overflow-y:auto}
.slabel{font-size:9px;font-family:'DM Mono',monospace;color:var(--muted);letter-spacing:0.14em;text-transform:uppercase;margin-top:4px}
.sdiv{height:1px;background:var(--border)}
/* STAT CARDS */
.sc-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.sc{background:var(--s2);border:1px solid var(--border);border-radius:7px;padding:9px 10px}
.sc-val{font-size:20px;font-weight:600;font-family:'DM Mono',monospace;line-height:1}
.sc-val.g{color:var(--green)}.sc-val.b{color:var(--blue)}.sc-val.a{color:var(--amber)}.sc-val.r{color:var(--red)}
.sc-lbl{font-size:9px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:0.06em}
/* SIDEBAR BTNS */
.sbtn{display:block;background:var(--s2);border:1px solid var(--border);border-radius:6px;padding:8px 10px;text-decoration:none;color:var(--text);font-size:11px;cursor:pointer;font-family:'Sora',sans-serif;width:100%;text-align:left;transition:border-color 0.15s}
.sbtn:hover{border-color:var(--green)}
.sbtn.green{border-color:var(--green);color:var(--green)}
.sbtn.blue{border-color:var(--blue);color:var(--blue)}
.sbtn.red{border-color:var(--red);color:var(--red)}
/* CONTENT */
.content{padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto}
/* SECTION HEADERS */
.sec-head{font-size:10px;font-family:'DM Mono',monospace;color:var(--muted);text-transform:uppercase;letter-spacing:0.12em;padding:6px 0 4px;border-bottom:1px solid var(--border);margin-bottom:2px;display:flex;align-items:center;justify-content:space-between}
/* CARDS */
.card{background:var(--s2);border:1px solid var(--border);border-radius:9px;padding:13px 15px}
.card-lbl{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
/* NEXT POST */
.next-box{background:linear-gradient(135deg,#0b2018,#0f2e20);border:1px solid #1a4a2a;border-radius:7px;padding:11px}
.next-tag{font-size:9px;color:var(--green);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px}
.next-title{font-size:13px;font-weight:600;line-height:1.4}
/* PROGRESS */
.pbar{background:var(--border);border-radius:3px;height:4px;overflow:hidden;margin-bottom:3px}
.pfill{height:100%;border-radius:3px;background:var(--green)}
.pfill.b{background:var(--blue)}
.prow{display:flex;justify-content:space-between;font-size:9px;color:var(--muted);margin-bottom:7px}
/* GROUP LIST */
.gscroll{max-height:160px;overflow-y:auto}
.grow{display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid var(--border2);font-size:11px}
.grow:last-child{border:none}
.gnum{color:var(--muted2);min-width:20px;font-family:'DM Mono',monospace;font-size:10px}
.gname{flex:1;color:var(--text)}
.gbadge{font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600}
.gb-ok{background:#0a2a18;color:var(--green)}.gb-ban{background:#2a0f0f;color:#ff6060}
.gb-next{background:#0f3a1e;color:#2dff8e;border:1px solid var(--green)}
.gb-used{background:#0e1e15;color:var(--muted)}
/* LOG */
.log-box{max-height:160px;overflow-y:auto;font-family:'DM Mono',monospace;font-size:10px}
.ll{padding:2px 0;border-bottom:1px solid var(--border2);line-height:1.5;color:var(--muted)}
.ll-ok{color:var(--green)}.ll-err{color:var(--red)}.ll-warn{color:var(--amber)}.ll-info{color:var(--blue)}
.lts{color:var(--muted2);margin-right:6px}
/* TOK BTNS */
.tok-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.tok-btn{display:block;background:#0b2010;border:1px solid var(--green);border-radius:6px;padding:8px 6px;text-align:center;text-decoration:none;transition:background 0.15s}
.tok-btn:hover{background:#0f3018}
.tok-icon{font-size:14px;margin-bottom:2px}
.tok-lbl{font-size:9px;color:var(--green);font-weight:600}
.tok-sub{font-size:8px;color:var(--muted)}
/* ══ CONTENT MANAGER SECTION ══ */
.cm-section{background:var(--s2);border:1px solid var(--border);border-radius:9px;padding:13px 15px}
.cm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.cm-actions{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}
/* CM BUTTONS */
.btn{background:transparent;border:1px solid var(--border);color:var(--text);padding:7px 12px;border-radius:6px;cursor:pointer;font-family:'Sora',sans-serif;font-size:12px;transition:all 0.14s;display:inline-flex;align-items:center;gap:6px}
.btn:hover{border-color:var(--green);background:#00e5a010}
.btn.primary{background:var(--green);color:#000;border-color:var(--green);font-weight:600}
.btn.primary:hover{background:var(--green2)}
.btn.primary:disabled{background:var(--s2);color:var(--muted);border-color:var(--border);cursor:not-allowed}
.btn.blue-btn{border-color:var(--blue);color:var(--blue)}
.btn.blue-btn:hover{background:#3d8bff10}
.btn.green-btn{border-color:var(--green);color:var(--green)}
.btn.green-btn:hover{background:#00e5a010}
.btn.red-btn{border-color:var(--red);color:var(--red)}
.btn.red-btn:hover{background:#ff525210}
.btn.sm{padding:4px 9px;font-size:11px}
/* CM CONTENT AREA */
.cm-topic{background:var(--s1);border:1px solid var(--border);border-radius:8px;padding:11px 13px;margin-bottom:8px}
.cm-topic.lit{border-color:var(--green);background:#00e5a006}
.topic-title{font-size:14px;font-weight:600;line-height:1.4;margin-bottom:7px}
.kw-row{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px}
.kw{background:#3d8bff15;border:1px solid #3d8bff40;color:var(--blue);font-size:10px;padding:2px 7px;border-radius:10px;font-family:'DM Mono',monospace}
.kw.k1{background:#00e5a012;border-color:#00e5a040;color:var(--green)}
.info-row{font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;line-height:1.7;padding:7px 9px;background:var(--bg);border-radius:5px;margin-bottom:7px}
.badge-pend{background:#f5a62318;border:1px solid #f5a62340;color:var(--amber);font-size:10px;padding:2px 7px;border-radius:10px;font-family:'DM Mono',monospace}
.badge-pub{background:#00e5a015;border:1px solid #00e5a040;color:var(--green);font-size:10px;padding:2px 7px;border-radius:10px;font-family:'DM Mono',monospace}
.article-card{background:var(--s1);border:1px solid var(--green);border-radius:8px;padding:11px 13px;margin-top:8px}
.code-preview{background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:9px;max-height:200px;overflow-y:auto;font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);white-space:pre-wrap;word-break:break-word;line-height:1.5;margin-top:8px}
.wp-steps{background:#3d8bff08;border:1px solid #3d8bff20;border-radius:6px;padding:8px 10px;margin-top:8px;font-size:10px;color:var(--blue);font-family:'DM Mono',monospace;line-height:1.8}
/* History */
.hrow{display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)}
.hrow:last-child{border:none}
.hnum{font-family:'DM Mono',monospace;color:var(--muted);font-size:11px;min-width:20px}
.htitle{font-size:12px;line-height:1.4}
.hmeta{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;margin-top:2px}
.hstatus.p{color:var(--amber);font-size:10px;font-family:'DM Mono',monospace;white-space:nowrap}
.hstatus.pub{color:var(--green);font-size:10px;font-family:'DM Mono',monospace;white-space:nowrap}
/* Timer */
.timer-val{font-size:20px;font-weight:600;font-family:'DM Mono',monospace;color:var(--green)}
.pttrack{height:3px;background:var(--border);border-radius:2px;margin-top:5px;overflow:hidden}
.ptfill{height:100%;background:var(--green);border-radius:2px;transition:width 1s linear;width:0%}
/* Spinner */
.spin{display:inline-block;width:11px;height:11px;border:2px solid var(--border);border-top-color:var(--green);border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:-2px;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
/* Error */
.err-box{background:#ff525208;border:1px solid #ff525230;border-radius:7px;padding:10px;font-size:11px;color:var(--red);font-family:'DM Mono',monospace;line-height:1.7}
.err-fix{margin-top:7px;padding-top:7px;border-top:1px solid #ff525220;color:var(--amber)}
/* Empty */
.empty{text-align:center;padding:24px;color:var(--muted);font-family:'DM Mono',monospace;font-size:12px;line-height:2}
.em-cta{color:var(--green)}
/* Alert */
.alert-card{background:#1a0808;border:1px solid #4a1515;border-radius:9px;padding:11px 13px;margin-bottom:4px}
/* Footer */
.foot{background:var(--s1);border-top:1px solid var(--border);padding:9px 20px;display:flex;align-items:center;justify-content:space-between}
.foot a{color:var(--green);font-size:10px;text-decoration:none;font-family:'DM Mono',monospace}
.foot span{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace}
/* Scrollbar */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
</style>
</head>
<body>

<!-- TOPBAR -->
<div class="topbar">
  <div class="brand-icon">🐾</div>
  <div>
    <div class="brand-name">OHG COMMAND CENTER</div>
    <div class="brand-sub">v7.7 · onehealthglobe.com</div>
  </div>
  <div class="status-pill">
    <div class="dot"></div>
    <span style="color:var(--green);font-size:11px;font-family:'DM Mono',monospace">${isActiveHour() ? 'Active' : 'Sleeping'} · ${est.toLocaleString('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit'})} EST</span>
  </div>
  <span style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">Auto-refresh 30s</span>
</div>

<div class="layout">

<!-- ══ SIDEBAR ══ -->
<div class="sidebar">
  <div class="slabel">Autopilot Stats</div>
  <div class="sc-grid">
    <div class="sc"><div class="sc-val g">${totalPosted}</div><div class="sc-lbl">Page posts</div></div>
    <div class="sc"><div class="sc-val b">${ptPostCount}</div><div class="sc-lbl">Pins</div></div>
    <div class="sc"><div class="sc-val ${!lastTokenError?'g':'r'}" style="font-size:15px">${!lastTokenError?'✅':'⚠️'}</div><div class="sc-lbl">FB Token</div></div>
    <div class="sc"><div class="sc-val" style="font-size:13px;color:#2a4a38">Paused</div><div class="sc-lbl">Groups</div></div>
  </div>
  <div class="sdiv"></div>
  <div class="slabel">Content Manager</div>
  <div class="sc-grid">
    <div class="sc"><div class="sc-val g" id="s-total">0</div><div class="sc-lbl">Topics</div></div>
    <div class="sc"><div class="sc-val b" id="s-art">0</div><div class="sc-lbl">Articles</div></div>
    <div class="sc"><div class="sc-val a" id="s-pend">0</div><div class="sc-lbl">Pending</div></div>
    <div class="sc"><div class="sc-val g" id="s-pub">0</div><div class="sc-lbl">Published</div></div>
  </div>
  <div style="background:var(--s2);border:1px solid var(--border);border-radius:7px;padding:8px 10px">
    <div class="timer-val" id="countdown">24:00:00</div>
    <div style="font-size:9px;color:var(--muted);font-family:'DM Mono',monospace">Next content cycle</div>
    <div class="pttrack"><div class="ptfill" id="prog"></div></div>
  </div>
  <div class="sdiv"></div>
  <div class="slabel">CM Actions</div>
  <button class="sbtn green" id="run-btn" onclick="runCycle()">▶ Run content cycle</button>
  <button class="sbtn blue" id="gen-btn" style="display:none" onclick="generateArticle()">✦ Generate article</button>
  <button class="sbtn green" id="pub-btn" style="display:none" onclick="markPublished()">✓ Mark published</button>
  <button class="sbtn blue" onclick="scanSite()">⊙ Scan sitemap</button>
  <button class="sbtn red" onclick="resetAll()">↺ Reset CM data</button>
  <div style="font-size:9px;color:var(--muted);font-family:'DM Mono',monospace" id="scan-info">last scan: never</div>
  <div class="sdiv"></div>
  <div class="slabel">Quick Links</div>
  <a href="/api/stats" target="_blank" class="sbtn">📊 API Stats</a>
  <a href="/pinterest/stats" target="_blank" class="sbtn">📌 Pinterest</a>
  <a href="/pinterest/boards" target="_blank" class="sbtn">📋 Board IDs</a>
  <div style="font-size:9px;color:var(--muted);font-family:'DM Mono',monospace;margin-top:4px">
    Railway: <span id="conn-text" style="color:var(--amber)">checking...</span><br>
    <span id="clock">--:--:--</span>
  </div>
</div>

<!-- ══ MAIN CONTENT ══ -->
<div class="content">

  ${!lastTokenError ? '' : `<div class="alert-card"><div style="font-size:12px;color:var(--red);font-weight:700;margin-bottom:4px">🚨 FB TOKEN ISSUE</div><div style="font-size:10px;color:#c08080">${lastTokenError} — Use Token Manager below to fix.</div></div>`}

  <!-- AUTOPILOT SECTION -->
  <div class="sec-head">⚡ Autopilot <span style="color:var(--green)">${isActiveHour()?'ACTIVE':'SLEEPING'} · ${INTERVAL_MS/60000}min interval</span></div>

  <div class="grid4">
    <div class="card">
      <div class="card-lbl">Post Index</div>
      <div style="font-size:24px;font-weight:600;font-family:'DM Mono',monospace">${postIndex%62+1}<span style="font-size:13px;color:var(--muted)">/62</span></div>
      <div style="font-size:10px;color:var(--muted)">Round ${Math.floor(postIndex/62)+1}</div>
    </div>
    <div class="card">
      <div class="card-lbl">Active Groups</div>
      <div style="font-size:24px;font-weight:600;font-family:'DM Mono',monospace;color:var(--green)">${PET_GROUPS.filter(g=>!groupStats[g.id].permanent).length}</div>
      <div style="font-size:10px;color:var(--muted)">${PET_GROUPS.filter(g=>groupStats[g.id].permanent).length} banned</div>
    </div>
    <div class="card">
      <div class="card-lbl">Interval</div>
      <div style="font-size:24px;font-weight:600;font-family:'DM Mono',monospace;color:var(--blue)">${INTERVAL_MS/60000}<span style="font-size:11px;color:var(--muted)">min</span></div>
      <div style="font-size:10px;color:var(--muted)">${INTERVAL_MS/3600000}hr cycle</div>
    </div>
    <div class="card">
      <div class="card-lbl">Token Refreshes</div>
      <div style="font-size:24px;font-weight:600;font-family:'DM Mono',monospace;color:${tokenRefreshAttempts>0?'var(--amber)':'var(--green)'}">${tokenRefreshAttempts}</div>
      <div style="font-size:10px;color:var(--muted)">${tokenRefreshAttempts>0?'errors':'clean run'}</div>
    </div>
  </div>

  <div class="grid2">
    <div class="card">
      <div class="card-lbl">Next Scheduled Post</div>
      <div class="next-box">
        <div class="next-tag">P${String(POSTS[postIndex%62].id).padStart(2,'0')} · ${POSTS[postIndex%62].cat}</div>
        <div class="next-title">${POSTS[postIndex%62].title}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">Every ${INTERVAL_MS/3600000}hrs · Claude AI image · 24/7</div>
      </div>
    </div>
    <div class="card">
      <div class="card-lbl">Cycle Progress</div>
      <div class="pbar"><div class="pfill" style="width:${Math.round(((postIndex%62+1)/62)*100)}%"></div></div>
      <div class="prow"><span>FB Posts (62)</span><span>${Math.round(((postIndex%62+1)/62)*100)}%</span></div>
      <div class="pbar"><div class="pfill b" style="width:${Math.round((ptPostCount/PT_POSTS.length)*100)}%"></div></div>
      <div class="prow"><span>Pinterest (${PT_POSTS.length})</span><span>${Math.round((ptPostCount/PT_POSTS.length)*100)}%</span></div>
      <div style="font-size:10px;color:var(--muted)">Pinterest: ${ptLastPost?ptLastPost.topic.substring(0,35)+'...':'⏳ next in 2.5hrs'}</div>
    </div>
  </div>

  <!-- TOKEN MANAGER -->
  <div class="card">
    <div class="card-lbl">🔑 Token Manager <span style="color:${FB_APP_ID?'var(--green)':'var(--amber)'}">APP_ID: ${FB_APP_ID?'✅':'⚠️ not set'} · SECRET: ${FB_APP_SECRET?'✅':'⚠️ not set'}</span></div>
    <div class="tok-grid">
      <a href="/get-token-url" target="_blank" class="tok-btn"><div class="tok-icon">🔗</div><div class="tok-lbl">Get Login URL</div><div class="tok-sub">OAuth flow</div></a>
      <a href="/extend-token" target="_blank" class="tok-btn"><div class="tok-icon">⏱️</div><div class="tok-lbl">Auto-Extend</div><div class="tok-sub">Needs SECRET</div></a>
      <a href="/auth/callback" target="_blank" class="tok-btn"><div class="tok-icon">📋</div><div class="tok-lbl">View Callback</div><div class="tok-sub">Token capture</div></a>
    </div>
  </div>

  <!-- GROUP ROTATION -->
  <div class="card">
    <div class="card-lbl">Group Rotation — ${PET_GROUPS.length} groups <span style="color:var(--green)">${PET_GROUPS.filter(g=>!groupStats[g.id].permanent).length} ready · ${PET_GROUPS.filter(g=>groupStats[g.id].permanent).length} banned · Groups posting paused</span></div>
    <div class="gscroll">${PET_GROUPS.map((g,i)=>{
      const s=groupStats[g.id];const isNext=pickNextGroup()&&g.id===pickNextGroup().id;const used=postedGroupsThisCycle.has(g.id);
      let badge=isNext?'<span class="gbadge gb-next">◀ next</span>':s.permanent?'<span class="gbadge gb-ban">banned</span>':used?'<span class="gbadge gb-used">used</span>':'<span class="gbadge gb-ok">ready</span>';
      return `<div class="grow"><span class="gnum">${i+1}</span><span class="gname">${g.name}</span>${badge}</div>`;
    }).join('')}</div>
  </div>

  <!-- LOGS -->
  <div class="card">
    <div class="card-lbl">Deploy Logs <span style="color:var(--muted)">${logs.length} entries</span></div>
    <div class="log-box">${logs.slice(0,50).map(l=>{
      let cls='ll';
      if(l.includes('✅')) cls+=' ll-ok';
      else if(l.includes('❌')||l.includes('ERROR')) cls+=' ll-err';
      else if(l.includes('⚠️')||l.includes('🚫')) cls+=' ll-warn';
      else if(l.includes('📧')||l.includes('🎨')||l.includes('[Pinterest]')||l.includes('[Proxy]')) cls+=' ll-info';
      const ts=l.match(/\[([\d\-T:.Z]+)\]/);
      const msg=ts?l.replace(ts[0],'').trim():l;
      const time=ts?new Date(ts[1]).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'';
      return `<div class="${cls}"><span class="lts">${time}</span>${msg}</div>`;
    }).join('')}</div>
  </div>

  <!-- CONTENT MANAGER SECTION -->
  <div class="sec-head">✦ Content Manager <span id="cm-conn" style="color:var(--muted)">checking...</span></div>

  <!-- CM TOPIC -->
  <div class="card">
    <div class="card-lbl">Current Topic <span id="cm-gap-info" style="color:var(--muted)">400+ Zoetis gaps available</span></div>
    <div class="cm-topic lit" id="topic-main">
      <div class="empty">🐾 No topic yet.<br>Click <span class="em-cta">▶ Run content cycle</span> in sidebar to start.<br><span style="font-size:10px">Searches USA pet trends · Zoetis 400+ gaps · picks best low-competition topic</span></div>
    </div>
    <div id="article-area"></div>
  </div>

  <!-- CM HISTORY + LOG -->
  <div class="grid2">
    <div class="card">
      <div class="card-lbl">Topic History <span id="history-count" style="color:var(--muted)"></span></div>
      <div id="history-area"><div class="empty" style="padding:16px">📋 No history yet</div></div>
    </div>
    <div class="card">
      <div class="card-lbl">CM Activity Log</div>
      <div class="log-box" id="log-area">
        <div class="ll"><span class="lts">INIT</span><span class="ll-ok">OHG Command Center ready</span></div>
      </div>
    </div>
  </div>

</div><!-- end content -->
</div><!-- end layout -->

<div class="foot">
  <a href="https://onehealthglobe.com" target="_blank">onehealthglobe.com</a>
  <span>OHG v7.7 · 62 FB Posts · ${PT_POSTS.length} Pinterest · Claude AI images · 3hr interval · Groups paused</span>
  <span>${est.toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric'})} EST</span>
</div>

<script src="/dashboard.js"></script>
</body></html>`;

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
