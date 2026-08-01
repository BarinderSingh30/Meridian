// Pure seed data for Meridian. No Prisma calls, no logic — consumed by prisma/seed.ts.

export interface SeedCategory {
  name: string;
  slug: string;
  imageUrl?: string;
  children?: SeedCategory[];
}

export interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  brand?: string;
  sku?: string;
  priceCents: number;
  compareAtPriceCents?: number;
  stockQuantity: number;
  categorySlug: string;
  images: string[];
}

export interface SeedReviewer {
  name: string;
  email: string;
}

export interface SeedReview {
  productSlug: string;
  rating: number;
  title?: string;
  body?: string;
}

function img(slug: string): string {
  return `https://picsum.photos/seed/${slug}/800/800`;
}

function catImg(slug: string): string {
  return `https://picsum.photos/seed/cat-${slug}/600/400`;
}

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------

export const CATEGORIES: SeedCategory[] = [
  {
    name: "Electronics",
    slug: "electronics",
    imageUrl: catImg("electronics"),
    children: [
      { name: "Headphones & Audio", slug: "headphones-audio", imageUrl: catImg("headphones-audio") },
      { name: "Laptops & Computers", slug: "laptops-computers", imageUrl: catImg("laptops-computers") },
      { name: "Phones & Accessories", slug: "phones-accessories", imageUrl: catImg("phones-accessories") },
      { name: "Cameras", slug: "cameras", imageUrl: catImg("cameras") },
    ],
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    imageUrl: catImg("home-kitchen"),
    children: [
      { name: "Kitchen & Dining", slug: "kitchen-dining", imageUrl: catImg("kitchen-dining") },
      { name: "Furniture", slug: "furniture", imageUrl: catImg("furniture") },
      { name: "Home Decor", slug: "home-decor", imageUrl: catImg("home-decor") },
    ],
  },
  {
    name: "Books",
    slug: "books",
    imageUrl: catImg("books"),
    children: [
      { name: "Fiction", slug: "fiction", imageUrl: catImg("fiction") },
      { name: "Non-Fiction", slug: "non-fiction", imageUrl: catImg("non-fiction") },
      { name: "Children's Books", slug: "childrens-books", imageUrl: catImg("childrens-books") },
    ],
  },
  {
    name: "Clothing",
    slug: "clothing",
    imageUrl: catImg("clothing"),
    children: [
      { name: "Men's Clothing", slug: "mens-clothing", imageUrl: catImg("mens-clothing") },
      { name: "Women's Clothing", slug: "womens-clothing", imageUrl: catImg("womens-clothing") },
      { name: "Kids' Clothing", slug: "kids-clothing", imageUrl: catImg("kids-clothing") },
    ],
  },
  {
    name: "Beauty",
    slug: "beauty",
    imageUrl: catImg("beauty"),
    children: [
      { name: "Skincare", slug: "skincare", imageUrl: catImg("skincare") },
      { name: "Makeup", slug: "makeup", imageUrl: catImg("makeup") },
      { name: "Hair Care", slug: "hair-care", imageUrl: catImg("hair-care") },
    ],
  },
  {
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    imageUrl: catImg("sports-outdoors"),
    children: [
      { name: "Fitness Equipment", slug: "fitness-equipment", imageUrl: catImg("fitness-equipment") },
      { name: "Camping & Hiking", slug: "camping-hiking", imageUrl: catImg("camping-hiking") },
      { name: "Cycling", slug: "cycling", imageUrl: catImg("cycling") },
    ],
  },
  {
    name: "Toys & Games",
    slug: "toys-games",
    imageUrl: catImg("toys-games"),
    children: [
      { name: "Action Figures & Collectibles", slug: "action-figures-collectibles", imageUrl: catImg("action-figures-collectibles") },
      { name: "Board Games & Puzzles", slug: "board-games-puzzles", imageUrl: catImg("board-games-puzzles") },
      { name: "Building Sets", slug: "building-sets", imageUrl: catImg("building-sets") },
    ],
  },
  {
    name: "Grocery",
    slug: "grocery",
    imageUrl: catImg("grocery"),
    children: [
      { name: "Snacks & Beverages", slug: "snacks-beverages", imageUrl: catImg("snacks-beverages") },
      { name: "Pantry Staples", slug: "pantry-staples", imageUrl: catImg("pantry-staples") },
      { name: "Coffee & Tea", slug: "coffee-tea", imageUrl: catImg("coffee-tea") },
    ],
  },
  {
    name: "Office & Stationery",
    slug: "office-stationery",
    imageUrl: catImg("office-stationery"),
    children: [
      { name: "Notebooks & Paper", slug: "notebooks-paper", imageUrl: catImg("notebooks-paper") },
      { name: "Desk Accessories", slug: "desk-accessories", imageUrl: catImg("desk-accessories") },
      { name: "Writing Instruments", slug: "writing-instruments", imageUrl: catImg("writing-instruments") },
    ],
  },
  {
    name: "Pet Supplies",
    slug: "pet-supplies",
    imageUrl: catImg("pet-supplies"),
    children: [
      { name: "Dog Supplies", slug: "dog-supplies", imageUrl: catImg("dog-supplies") },
      { name: "Cat Supplies", slug: "cat-supplies", imageUrl: catImg("cat-supplies") },
      { name: "Small Pet & Aquarium", slug: "small-pet-aquarium", imageUrl: catImg("small-pet-aquarium") },
    ],
  },
];

// ---------------------------------------------------------------------------
// PRODUCTS
// ---------------------------------------------------------------------------

export const PRODUCTS: SeedProduct[] = [
  // ---- Electronics / Headphones & Audio ----
  {
    slug: "wireless-noise-cancelling-headphones",
    name: "Aria Voyage Wireless Noise-Cancelling Headphones",
    description:
      "Over-ear headphones built for long flights and louder offices, with adaptive active noise cancellation that adjusts to ambient sound in real time. 40-hour battery life on a single charge, plush memory-foam ear cushions, and multipoint Bluetooth 5.3 pairing so you can jump between your laptop and phone without re-pairing.",
    brand: "Aria",
    sku: "ARA-WH-100",
    priceCents: 24900,
    compareAtPriceCents: 29900,
    stockQuantity: 84,
    categorySlug: "headphones-audio",
    images: [img("wireless-noise-cancelling-headphones"), img("wireless-noise-cancelling-headphones-2")],
  },
  {
    slug: "bluetooth-earbuds-pro",
    name: "Aria Pulse True Wireless Earbuds",
    description:
      "Compact true-wireless earbuds with a secure ear-tip fit for running and the gym. IPX5 sweat and splash resistance, 7-hour playtime per charge (28 hours with the case), and touch controls for calls, volume, and voice assistant access.",
    brand: "Aria",
    sku: "ARA-EB-200",
    priceCents: 8900,
    stockQuantity: 156,
    categorySlug: "headphones-audio",
    images: [img("bluetooth-earbuds-pro")],
  },
  {
    slug: "portable-bluetooth-speaker",
    name: "Coastal Roam 20W Portable Bluetooth Speaker",
    description:
      "A rugged IP67 waterproof speaker that floats and survives drops from up to 1.5 meters, with 20 hours of playtime and surprisingly deep bass for its size. Pair two units together for stereo sound at a campsite or backyard party.",
    brand: "Coastal",
    priceCents: 6900,
    stockQuantity: 112,
    categorySlug: "headphones-audio",
    images: [img("portable-bluetooth-speaker")],
  },
  {
    slug: "soundbar-with-subwoofer",
    name: "Aria Cinema 2.1 Soundbar with Wireless Subwoofer",
    description:
      "A 36-inch soundbar with a wireless subwoofer that adds real low-end punch to movie nights, connecting via HDMI ARC for one-remote control with most TVs. Includes dedicated dialogue enhancement mode and Bluetooth streaming from any phone or tablet.",
    brand: "Aria",
    sku: "ARA-SB-310",
    priceCents: 17900,
    compareAtPriceCents: 21900,
    stockQuantity: 47,
    categorySlug: "headphones-audio",
    images: [img("soundbar-with-subwoofer")],
  },
  {
    slug: "studio-monitor-headphones",
    name: "Aria Session Studio Monitor Headphones",
    description:
      "Wired reference headphones tuned flat for accurate mixing and mastering, with 50mm drivers and a detachable coiled cable. A favorite among home-studio producers who need to hear exactly what's in the recording, not a bass-boosted version of it.",
    brand: "Aria",
    priceCents: 14900,
    stockQuantity: 5,
    categorySlug: "headphones-audio",
    images: [img("studio-monitor-headphones")],
  },

  // ---- Electronics / Laptops & Computers ----
  {
    slug: "14-inch-ultrabook-laptop",
    name: "Northline Slate 14 Ultrabook",
    description:
      "A 2.6-pound ultrabook with a 14-inch 1920x1200 anti-glare display, all-day 16-hour battery life, and a fanless design that stays silent during video calls. 16GB RAM and a 512GB NVMe SSD make it fast enough for everyday multitasking and light photo editing.",
    brand: "Northline",
    sku: "NL-SL14-512",
    priceCents: 99900,
    compareAtPriceCents: 114900,
    stockQuantity: 3,
    categorySlug: "laptops-computers",
    images: [img("14-inch-ultrabook-laptop"), img("14-inch-ultrabook-laptop-2")],
  },
  {
    slug: "gaming-desktop-tower-pc",
    name: "Vantage Forge Gaming Desktop Tower",
    description:
      "A pre-built gaming tower with a 12-core processor, dedicated 12GB graphics card, and 32GB of RAM, ready to run modern titles at 1440p high settings out of the box. Tempered-glass side panel and three-fan intake keep temperatures low even under sustained load.",
    brand: "Vantage",
    sku: "VG-FRG-32",
    priceCents: 149900,
    stockQuantity: 0,
    categorySlug: "laptops-computers",
    images: [img("gaming-desktop-tower-pc")],
  },
  {
    slug: "27-inch-4k-monitor",
    name: "Northline ClearView 27-Inch 4K Monitor",
    description:
      "A 27-inch IPS panel with true 4K resolution, 99% sRGB color accuracy, and a 60Hz refresh rate suited to design work and everyday productivity. Height-adjustable stand, USB-C input with 65W power delivery, and slim bezels for a clean dual-monitor setup.",
    brand: "Northline",
    priceCents: 39900,
    stockQuantity: 61,
    categorySlug: "laptops-computers",
    images: [img("27-inch-4k-monitor")],
  },
  {
    slug: "mechanical-keyboard-rgb",
    name: "Vantage Keystrike Mechanical Keyboard",
    description:
      "A tenkeyless mechanical keyboard with hot-swappable tactile switches, per-key RGB lighting, and a aluminum top plate that eliminates flex. Detachable USB-C cable and dedicated media keys round out a build made for both typing and gaming.",
    brand: "Vantage",
    priceCents: 10900,
    stockQuantity: 73,
    categorySlug: "laptops-computers",
    images: [img("mechanical-keyboard-rgb")],
  },
  {
    slug: "wireless-ergonomic-mouse",
    name: "Northline Curve Wireless Ergonomic Mouse",
    description:
      "A vertical-grip wireless mouse designed to keep your wrist in a natural handshake position during long work sessions. Silent clicks, a 4000 DPI optical sensor, and up to 4 months of battery life on two AA batteries.",
    brand: "Northline",
    priceCents: 3900,
    stockQuantity: 98,
    categorySlug: "laptops-computers",
    images: [img("wireless-ergonomic-mouse")],
  },

  // ---- Electronics / Phones & Accessories ----
  {
    slug: "unlocked-smartphone-128gb",
    name: "Vantage Nova 128GB Unlocked Smartphone",
    description:
      "A carrier-unlocked smartphone with a 6.5-inch OLED display, triple rear camera system with 2x optical zoom, and 128GB of storage. All-day battery backed by 33W fast charging, and IP68 water resistance for everyday peace of mind.",
    brand: "Vantage",
    sku: "VG-NV-128",
    priceCents: 64900,
    stockQuantity: 39,
    categorySlug: "phones-accessories",
    images: [img("unlocked-smartphone-128gb"), img("unlocked-smartphone-128gb-2")],
  },
  {
    slug: "fast-wireless-charging-pad",
    name: "Aria Glide 15W Wireless Charging Pad",
    description:
      "A slim charging pad that delivers up to 15W of fast wireless charging to Qi-compatible phones, with a soft anti-slip surface and a discreet LED indicator that dims after your phone connects. Case-friendly up to 5mm thickness.",
    brand: "Aria",
    priceCents: 2900,
    stockQuantity: 143,
    categorySlug: "phones-accessories",
    images: [img("fast-wireless-charging-pad")],
  },
  {
    slug: "20000mah-portable-power-bank",
    name: "Vantage Reserve 20000mAh Power Bank",
    description:
      "A high-capacity power bank that can fully recharge most phones four to five times, with dual USB-C and USB-A ports for charging two devices at once. 20W USB-C power delivery gets a dead phone back to 50% in about 30 minutes.",
    brand: "Vantage",
    priceCents: 4500,
    stockQuantity: 167,
    categorySlug: "phones-accessories",
    images: [img("20000mah-portable-power-bank")],
  },

  // ---- Electronics / Cameras ----
  {
    slug: "mirrorless-digital-camera",
    name: "Northline Aperture X1 Mirrorless Camera",
    description:
      "A 24-megapixel APS-C mirrorless camera with in-body image stabilization and hybrid autofocus that tracks eyes and faces in both photo and 4K video. Weather-sealed magnesium-alloy body pairs with the included 18-55mm kit lens for travel and everyday shooting.",
    brand: "Northline",
    sku: "NL-AX1-KIT",
    priceCents: 119900,
    stockQuantity: 0,
    categorySlug: "cameras",
    images: [img("mirrorless-digital-camera")],
  },
  {
    slug: "compact-4k-action-camera",
    name: "Coastal Drift 4K Action Camera",
    description:
      "A palm-sized action camera that shoots stabilized 4K60 video and is waterproof to 33 feet without a housing. Voice control, a touchscreen for framing shots, and a magnetic quick-release mount make it easy to move between a helmet, handlebar, or tripod.",
    brand: "Coastal",
    priceCents: 29900,
    compareAtPriceCents: 34900,
    stockQuantity: 54,
    categorySlug: "cameras",
    images: [img("compact-4k-action-camera")],
  },

  // ---- Home & Kitchen / Kitchen & Dining ----
  {
    slug: "stainless-steel-chef-knife-set",
    name: "Coastal Kitchen Forged Chef Knife Set (6-Piece)",
    description:
      "A six-piece forged stainless-steel knife set including an 8-inch chef's knife, bread knife, and utility knife, each full-tang for balance and edge retention. Comes with a walnut storage block and a lifetime sharpening guarantee.",
    brand: "Coastal Kitchen",
    sku: "CK-KNF-6PC",
    priceCents: 14900,
    compareAtPriceCents: 18900,
    stockQuantity: 42,
    categorySlug: "kitchen-dining",
    images: [img("stainless-steel-chef-knife-set")],
  },
  {
    slug: "non-stick-ceramic-cookware-set",
    name: "Coastal Kitchen Ceramic Nonstick Cookware Set (10-Piece)",
    description:
      "A 10-piece cookware set with a mineral-reinforced ceramic nonstick coating free of PFOA and PTFE, oven-safe to 500°F. Includes two frying pans, two saucepans, a stockpot, and tempered-glass lids that stack for compact storage.",
    brand: "Coastal Kitchen",
    priceCents: 18900,
    stockQuantity: 33,
    categorySlug: "kitchen-dining",
    images: [img("non-stick-ceramic-cookware-set")],
  },
  {
    slug: "programmable-drip-coffee-maker",
    name: "Coastal Kitchen 12-Cup Programmable Coffee Maker",
    description:
      "A 12-cup drip coffee maker with a 24-hour programmable timer, adjustable brew strength, and a thermal carafe that keeps coffee hot for hours without a hotplate burning it. Removable water reservoir and reusable gold-tone filter included.",
    brand: "Coastal Kitchen",
    priceCents: 8900,
    stockQuantity: 76,
    categorySlug: "kitchen-dining",
    images: [img("programmable-drip-coffee-maker")],
  },
  {
    slug: "stand-mixer-5-5-quart",
    name: "Coastal Kitchen 5.5-Quart Stand Mixer",
    description:
      "A 500-watt stand mixer with a tilt-head design and a 5.5-quart stainless steel bowl large enough for a double batch of cookie dough. Comes with a flat beater, dough hook, and wire whisk, plus a splash guard to keep flour off the counter.",
    brand: "Coastal Kitchen",
    sku: "CK-MIX-55",
    priceCents: 27900,
    stockQuantity: 28,
    categorySlug: "kitchen-dining",
    images: [img("stand-mixer-5-5-quart")],
  },
  {
    slug: "electric-gooseneck-kettle",
    name: "Coastal Kitchen Precision Gooseneck Electric Kettle",
    description:
      "A variable-temperature gooseneck kettle built for pour-over coffee and tea, with presets from 140°F to 212°F and a 60-minute keep-warm mode. The slim spout gives you full control over pour speed for even extraction.",
    brand: "Coastal Kitchen",
    priceCents: 6900,
    stockQuantity: 58,
    categorySlug: "kitchen-dining",
    images: [img("electric-gooseneck-kettle")],
  },

  // ---- Home & Kitchen / Furniture ----
  {
    slug: "mid-century-modern-accent-chair",
    name: "Crestwood Alder Mid-Century Accent Chair",
    description:
      "A mid-century inspired accent chair with a solid rubberwood frame, tapered legs, and high-density foam cushioning wrapped in stain-resistant woven fabric. Ships flat with tool-free leg assembly that takes about ten minutes.",
    brand: "Crestwood",
    priceCents: 32900,
    stockQuantity: 22,
    categorySlug: "furniture",
    images: [img("mid-century-modern-accent-chair")],
  },
  {
    slug: "adjustable-height-standing-desk",
    name: "Crestwood Rise Electric Standing Desk",
    description:
      "A dual-motor electric standing desk that adjusts from 24 to 50 inches with four programmable height presets, moving smoothly and quietly under load. The 55x28-inch bamboo top comfortably fits dual monitors and a full desk setup.",
    brand: "Crestwood",
    sku: "CW-RISE-55",
    priceCents: 44900,
    compareAtPriceCents: 52900,
    stockQuantity: 31,
    categorySlug: "furniture",
    images: [img("adjustable-height-standing-desk"), img("adjustable-height-standing-desk-2")],
  },
  {
    slug: "5-tier-ladder-bookshelf",
    name: "Crestwood Loft 5-Tier Ladder Bookshelf",
    description:
      "A space-saving ladder-style bookshelf that leans against the wall for a modern look without wall mounting. Five open shelves in a graduated design hold everything from paperbacks to potted plants, with a weight capacity of 30 pounds per shelf.",
    brand: "Crestwood",
    priceCents: 12900,
    stockQuantity: 47,
    categorySlug: "furniture",
    images: [img("5-tier-ladder-bookshelf")],
  },
  {
    slug: "memory-foam-mattress-queen",
    name: "Crestwood Cloudrest 10-Inch Queen Memory Foam Mattress",
    description:
      "A 10-inch queen mattress layering cooling gel memory foam over a high-density support base, designed to relieve pressure points while keeping the sleep surface cool. Compressed and shipped in a box, it expands to full size within 48 hours.",
    brand: "Crestwood",
    priceCents: 59900,
    compareAtPriceCents: 79900,
    stockQuantity: 18,
    categorySlug: "furniture",
    images: [img("memory-foam-mattress-queen")],
  },

  // ---- Home & Kitchen / Home Decor ----
  {
    slug: "hand-woven-wool-area-rug",
    name: "Crestwood Meadow Hand-Woven Wool Area Rug (5x7)",
    description:
      "A hand-woven 5x7 area rug made from 100% New Zealand wool with a low pile that's easy to vacuum and durable enough for high-traffic living rooms. Each rug carries slight variations in pattern, a natural result of the handmade process.",
    brand: "Crestwood",
    priceCents: 21900,
    stockQuantity: 26,
    categorySlug: "home-decor",
    images: [img("hand-woven-wool-area-rug")],
  },
  {
    slug: "soy-wax-candle-gift-set",
    name: "Solace Hearth Soy Candle Gift Set (4-Piece)",
    description:
      "Four hand-poured soy wax candles in cedarwood, sea salt, fig, and vanilla bean, each burning cleanly for 40-plus hours in a reusable amber glass jar. Packaged in a ribboned box that's ready to give as-is.",
    brand: "Solace",
    priceCents: 3400,
    stockQuantity: 91,
    categorySlug: "home-decor",
    images: [img("soy-wax-candle-gift-set")],
  },
  {
    slug: "ceramic-table-lamp-linen-shade",
    name: "Solace Kiln Ceramic Table Lamp with Linen Shade",
    description:
      "A hand-finished ceramic table lamp in a matte glaze with a natural linen drum shade that softens light for reading nooks and bedside tables. Uses a standard E26 bulb (not included) and includes an in-line on/off switch.",
    brand: "Solace",
    priceCents: 7900,
    stockQuantity: 39,
    categorySlug: "home-decor",
    images: [img("ceramic-table-lamp-linen-shade")],
  },
  {
    slug: "framed-botanical-wall-art-set",
    name: "Solace Botanical Framed Wall Art Set (3-Piece)",
    description:
      "A set of three framed botanical prints in matching black wood frames, printed on textured archival paper for a gallery-wall look straight out of the box. Pre-attached wall hooks make them level and easy to hang in minutes.",
    brand: "Solace",
    priceCents: 5900,
    stockQuantity: 63,
    categorySlug: "home-decor",
    images: [img("framed-botanical-wall-art-set")],
  },

  // ---- Books / Fiction ----
  {
    slug: "the-midnight-orchard",
    name: "The Midnight Orchard: A Novel",
    description:
      "A generational saga set in an aging apple orchard, following three sisters who return home after their mother's death to untangle a decades-old family secret. A slow-burn literary novel about memory, land, and what we inherit whether we want to or not.",
    brand: "Harrow & Vale Press",
    priceCents: 1699,
    stockQuantity: 120,
    categorySlug: "fiction",
    images: [img("the-midnight-orchard")],
  },
  {
    slug: "silent-tide",
    name: "Silent Tide",
    description:
      "A coastal thriller about a marine biologist who discovers a body washed ashore during a research trip and is drawn into a town full of people determined to keep it quiet. Tense, atmospheric, and paced for a single weekend read.",
    brand: "Harrow & Vale Press",
    priceCents: 1599,
    stockQuantity: 98,
    categorySlug: "fiction",
    images: [img("silent-tide")],
  },
  {
    slug: "the-clockmakers-daughter",
    name: "The Clockmaker's Daughter",
    description:
      "Set in 1890s Vienna, this historical novel follows a clockmaker's daughter who inherits her father's workshop and, with it, a set of mysterious unfinished commissions that unravel a conspiracy reaching into the royal court.",
    brand: "Harrow & Vale Press",
    priceCents: 1799,
    stockQuantity: 71,
    categorySlug: "fiction",
    images: [img("the-clockmakers-daughter")],
  },

  // ---- Books / Non-Fiction ----
  {
    slug: "deep-focus-mastering-attention",
    name: "Deep Focus: Mastering Attention in a Distracted World",
    description:
      "A practical, research-backed guide to reclaiming sustained attention in an age of constant notifications, drawing on interviews with neuroscientists and case studies of high performers. Includes a 30-day plan for rebuilding your ability to focus.",
    brand: "Harrow & Vale Press",
    priceCents: 1899,
    stockQuantity: 84,
    categorySlug: "non-fiction",
    images: [img("deep-focus-mastering-attention")],
  },
  {
    slug: "the-frugal-investors-handbook",
    name: "The Frugal Investor's Handbook",
    description:
      "A plain-language introduction to index investing, retirement accounts, and building an emergency fund, written for readers who find most finance books either too technical or too preachy. No stock-picking gimmicks, just the fundamentals.",
    brand: "Harrow & Vale Press",
    priceCents: 1699,
    stockQuantity: 66,
    categorySlug: "non-fiction",
    images: [img("the-frugal-investors-handbook")],
  },
  {
    slug: "wild-kitchens-culinary-journey",
    name: "Wild Kitchens: A Culinary Journey Through Five Continents",
    description:
      "A photo-rich travel and food memoir documenting home cooking traditions from five continents, complete with 60 tested recipes adapted for a standard home kitchen. As much a coffee-table book as it is a cookbook.",
    brand: "Harrow & Vale Press",
    priceCents: 2499,
    stockQuantity: 41,
    categorySlug: "non-fiction",
    images: [img("wild-kitchens-culinary-journey")],
  },
  {
    slug: "the-minimalist-home",
    name: "The Minimalist Home: A Guide to Simple Living",
    description:
      "A room-by-room framework for decluttering and organizing a home without resorting to buying more storage bins. Covers the psychology of accumulation, a two-week decluttering plan, and maintenance habits to keep spaces clear long-term.",
    brand: "Harrow & Vale Press",
    priceCents: 1599,
    stockQuantity: 59,
    categorySlug: "non-fiction",
    images: [img("the-minimalist-home")],
  },

  // ---- Books / Children's Books ----
  {
    slug: "luna-and-the-star-whale",
    name: "Luna and the Star Whale",
    description:
      "A gently illustrated picture book about a girl who befriends a whale made of stars and helps guide it home across the night sky. A bedtime favorite for ages 4-8, with full-spread watercolor illustrations on every page.",
    brand: "Harrow & Vale Press",
    priceCents: 1299,
    stockQuantity: 88,
    categorySlug: "childrens-books",
    images: [img("luna-and-the-star-whale")],
  },
  {
    slug: "the-brave-little-robot",
    name: "The Brave Little Robot",
    description:
      "A picture book about a small repair robot who overcomes his fear of the dark factory basement to save his friends, told in simple rhyming text for early readers ages 3-6. Bright, blocky illustrations make it easy to follow along.",
    brand: "Harrow & Vale Press",
    priceCents: 1199,
    stockQuantity: 103,
    categorySlug: "childrens-books",
    images: [img("the-brave-little-robot")],
  },

  // ---- Clothing / Men's Clothing ----
  {
    slug: "classic-fit-oxford-shirt",
    name: "Pinecrest Classic Fit Oxford Button-Down Shirt",
    description:
      "A wrinkle-resistant cotton oxford shirt cut for a classic fit through the chest and shoulders, suitable for both the office and weekend wear. Button-down collar, single chest pocket, and a locker loop on the back yoke.",
    brand: "Pinecrest",
    priceCents: 5400,
    stockQuantity: 134,
    categorySlug: "mens-clothing",
    images: [img("classic-fit-oxford-shirt")],
  },
  {
    slug: "slim-straight-stretch-jeans",
    name: "Pinecrest Slim Straight Stretch Jeans",
    description:
      "Mid-weight denim with a touch of stretch that holds its shape through the day, cut slim through the thigh and straight from the knee down. Five-pocket styling in a versatile dark indigo wash.",
    brand: "Pinecrest",
    priceCents: 6900,
    stockQuantity: 112,
    categorySlug: "mens-clothing",
    images: [img("slim-straight-stretch-jeans")],
  },
  {
    slug: "merino-wool-crewneck-sweater",
    name: "Pinecrest Merino Wool Crewneck Sweater",
    description:
      "A fine-gauge 100% merino wool sweater that's warm without bulk, naturally moisture-wicking and odor-resistant enough to wear multiple times between washes. Ribbed cuffs and hem hold their shape wash after wash.",
    brand: "Pinecrest",
    priceCents: 8900,
    compareAtPriceCents: 10900,
    stockQuantity: 4,
    categorySlug: "mens-clothing",
    images: [img("merino-wool-crewneck-sweater")],
  },

  // ---- Clothing / Women's Clothing ----
  {
    slug: "wrap-midi-dress",
    name: "Bloomfield Sienna Wrap Midi Dress",
    description:
      "A flowing wrap dress in a soft crepe fabric that skims rather than clings, with an adjustable tie waist that flatters multiple body shapes. Midi length with three-quarter sleeves, easily dressed up or down.",
    brand: "Bloomfield",
    priceCents: 7900,
    stockQuantity: 67,
    categorySlug: "womens-clothing",
    images: [img("wrap-midi-dress")],
  },
  {
    slug: "high-waist-yoga-leggings",
    name: "Bloomfield Flex High-Waist Yoga Leggings",
    description:
      "Squat-proof, high-waist leggings made from a four-way stretch fabric that moves with you through vinyasa flows or HIIT circuits. A hidden waistband pocket fits a phone or key without bouncing.",
    brand: "Bloomfield",
    priceCents: 5400,
    stockQuantity: 145,
    categorySlug: "womens-clothing",
    images: [img("high-waist-yoga-leggings")],
  },
  {
    slug: "cropped-denim-jacket",
    name: "Bloomfield Rosewood Cropped Denim Jacket",
    description:
      "A cropped denim jacket in a lightly distressed mid-wash, cut to hit right at the waist for layering over dresses or high-waist bottoms. Classic button front and chest flap pockets.",
    brand: "Bloomfield",
    priceCents: 8900,
    stockQuantity: 52,
    categorySlug: "womens-clothing",
    images: [img("cropped-denim-jacket")],
  },

  // ---- Clothing / Kids' Clothing ----
  {
    slug: "graphic-print-cotton-tshirt-kids",
    name: "Bloomfield Kids Graphic Print Cotton Tee",
    description:
      "A soft, pre-shrunk 100% cotton t-shirt with a playful screen-printed graphic that holds up wash after wash. Reinforced shoulder seams and a tagless neck label to reduce itchiness.",
    brand: "Bloomfield",
    priceCents: 1800,
    stockQuantity: 176,
    categorySlug: "kids-clothing",
    images: [img("graphic-print-cotton-tshirt-kids")],
  },
  {
    slug: "fleece-zip-hoodie-kids",
    name: "Bloomfield Kids Fleece Zip-Up Hoodie",
    description:
      "A brushed-fleece zip-up hoodie with a kangaroo pocket and an adjustable drawstring hood, built to handle recess, playgrounds, and everything in between. Machine washable and holds its shape after repeated washes.",
    brand: "Bloomfield",
    priceCents: 2900,
    stockQuantity: 121,
    categorySlug: "kids-clothing",
    images: [img("fleece-zip-hoodie-kids")],
  },

  // ---- Beauty / Skincare ----
  {
    slug: "vitamin-c-brightening-serum",
    name: "Solstice Glow Vitamin C Brightening Serum",
    description:
      "A 15% vitamin C serum formulated with ferulic acid and vitamin E to brighten dull skin and soften the look of dark spots over time. Lightweight, fast-absorbing, and layers well under moisturizer and sunscreen.",
    brand: "Solstice",
    priceCents: 3200,
    stockQuantity: 87,
    categorySlug: "skincare",
    images: [img("vitamin-c-brightening-serum")],
  },
  {
    slug: "hydrating-gel-moisturizer",
    name: "Solstice Dewpoint Hydrating Gel Moisturizer",
    description:
      "An oil-free gel moisturizer built around hyaluronic acid and squalane to hydrate without leaving a greasy finish, suited to combination and oily skin types. Absorbs in seconds and layers smoothly under makeup.",
    brand: "Solstice",
    priceCents: 2600,
    stockQuantity: 104,
    categorySlug: "skincare",
    images: [img("hydrating-gel-moisturizer")],
  },
  {
    slug: "mineral-sunscreen-spf-50",
    name: "Solstice Shield Mineral Sunscreen SPF 50",
    description:
      "A zinc-oxide mineral sunscreen with broad-spectrum SPF 50 protection that blends in clear with no white cast on most skin tones. Fragrance-free and reef-safe, formulated for daily wear under makeup.",
    brand: "Solstice",
    priceCents: 2200,
    stockQuantity: 132,
    categorySlug: "skincare",
    images: [img("mineral-sunscreen-spf-50")],
  },

  // ---- Beauty / Makeup ----
  {
    slug: "matte-liquid-lipstick",
    name: "Solstice Velour Matte Liquid Lipstick",
    description:
      "A long-wear liquid lipstick that dries down to a comfortable matte finish without cracking or feathering into fine lines. One swipe delivers full opacity, available in a range of everyday and bold shades.",
    brand: "Solstice",
    priceCents: 1900,
    stockQuantity: 118,
    categorySlug: "makeup",
    images: [img("matte-liquid-lipstick")],
  },

  // ---- Beauty / Hair Care ----
  {
    slug: "argan-oil-repair-shampoo",
    name: "Solstice Restore Argan Oil Repair Shampoo",
    description:
      "A sulfate-free shampoo formulated with argan oil and keratin proteins to strengthen damaged, color-treated hair over repeated use. Gently cleanses without stripping color or natural oils.",
    brand: "Solstice",
    priceCents: 1800,
    stockQuantity: 96,
    categorySlug: "hair-care",
    images: [img("argan-oil-repair-shampoo")],
  },
  {
    slug: "leave-in-detangling-conditioner",
    name: "Solstice Restore Leave-In Detangling Spray",
    description:
      "A lightweight leave-in conditioner spray that smooths cuticles and cuts down on morning detangling time, especially for curly and textured hair. Doubles as a heat protectant up to 400°F before styling.",
    brand: "Solstice",
    priceCents: 1600,
    stockQuantity: 89,
    categorySlug: "hair-care",
    images: [img("leave-in-detangling-conditioner")],
  },

  // ---- Sports & Outdoors / Fitness Equipment ----
  {
    slug: "adjustable-dumbbell-set",
    name: "Trailhead FlexLoad Adjustable Dumbbell Set (5-50 lbs)",
    description:
      "A pair of adjustable dumbbells that replace up to 15 sets of traditional weights, dialing from 5 to 50 pounds per hand with a quick turn of the selector dial. Compact tray footprint fits under most beds or in a closet.",
    brand: "Trailhead",
    sku: "TH-DB-5050",
    priceCents: 29900,
    compareAtPriceCents: 34900,
    stockQuantity: 5,
    categorySlug: "fitness-equipment",
    images: [img("adjustable-dumbbell-set")],
  },
  {
    slug: "extra-thick-yoga-mat",
    name: "Trailhead Grounded Extra-Thick Yoga Mat",
    description:
      "A 6mm thick yoga mat with a textured, moisture-resistant surface that stays grippy through hot yoga sessions. Extra cushioning protects knees and elbows on hard floors, and it rolls up with an included carry strap.",
    brand: "Trailhead",
    priceCents: 3900,
    stockQuantity: 143,
    categorySlug: "fitness-equipment",
    images: [img("extra-thick-yoga-mat")],
  },
  {
    slug: "resistance-bands-set-5-piece",
    name: "Trailhead Loop Resistance Bands Set (5-Piece)",
    description:
      "A set of five fabric resistance bands ranging from light to extra-heavy tension, ideal for glute activation, mobility work, and travel workouts. Non-slip woven design won't roll or pinch skin like rubber bands.",
    brand: "Trailhead",
    priceCents: 2200,
    stockQuantity: 168,
    categorySlug: "fitness-equipment",
    images: [img("resistance-bands-set-5-piece")],
  },

  // ---- Sports & Outdoors / Camping & Hiking ----
  {
    slug: "2-person-backpacking-tent",
    name: "Trailhead Ridgeline 2-Person Backpacking Tent",
    description:
      "A freestanding 2-person tent that packs down to the size of a loaf of bread and weighs just 3.2 pounds, built for three-season backpacking trips. Fully seam-sealed rainfly and two vestibules for gear storage on both sides.",
    brand: "Trailhead",
    priceCents: 19900,
    stockQuantity: 0,
    categorySlug: "camping-hiking",
    images: [img("2-person-backpacking-tent")],
  },
  {
    slug: "insulated-sleeping-bag-0f",
    name: "Trailhead Frostline 0°F Insulated Sleeping Bag",
    description:
      "A mummy-shaped sleeping bag rated to 0°F with synthetic insulation that retains warmth even if it gets damp, unlike down. Full-length draft tube and an insulated hood collar seal in heat on cold nights.",
    brand: "Trailhead",
    priceCents: 12900,
    stockQuantity: 34,
    categorySlug: "camping-hiking",
    images: [img("insulated-sleeping-bag-0f")],
  },
  {
    slug: "trekking-poles-pair",
    name: "Trailhead Summit Carbon Trekking Poles (Pair)",
    description:
      "A pair of carbon-fiber trekking poles that collapse to 15 inches for easy packing, with cork grips that wick away sweat on long climbs. Quick-flip locks adjust length in seconds, and interchangeable tips handle trail, snow, or pavement.",
    brand: "Trailhead",
    priceCents: 5400,
    stockQuantity: 61,
    categorySlug: "camping-hiking",
    images: [img("trekking-poles-pair")],
  },

  // ---- Sports & Outdoors / Cycling ----
  {
    slug: "road-bike-helmet-mips",
    name: "Trailhead Velocity Road Bike Helmet with MIPS",
    description:
      "A road cycling helmet with MIPS rotational-impact protection and 22 vents for airflow on long climbs. In-mold construction keeps weight under 280 grams, with a dial-adjust fit system for a secure, even fit.",
    brand: "Trailhead",
    priceCents: 7900,
    stockQuantity: 3,
    categorySlug: "cycling",
    images: [img("road-bike-helmet-mips")],
  },
  {
    slug: "rechargeable-bike-light-set",
    name: "Trailhead Beacon Rechargeable Bike Light Set",
    description:
      "A front-and-rear bike light set with USB-C rechargeable batteries, offering up to 10 hours of runtime on steady mode and five flash patterns for daytime visibility. Tool-free silicone mounts fit most handlebars and seat posts.",
    brand: "Trailhead",
    priceCents: 2900,
    stockQuantity: 122,
    categorySlug: "cycling",
    images: [img("rechargeable-bike-light-set")],
  },

  // ---- Toys & Games / Action Figures & Collectibles ----
  {
    slug: "galaxy-defender-action-figure",
    name: "Galaxy Defender Rex Action Figure",
    description:
      "A 6-inch articulated action figure with 22 points of movement and interchangeable hands for posing with included weapon and shield accessories. Part of the Galaxy Defenders collectible line, packaged in a display-ready window box.",
    brand: "Playforge",
    priceCents: 1999,
    stockQuantity: 87,
    categorySlug: "action-figures-collectibles",
    images: [img("galaxy-defender-action-figure")],
  },

  // ---- Toys & Games / Board Games & Puzzles ----
  {
    slug: "kingdom-traders-strategy-board-game",
    name: "Kingdom Traders Strategy Board Game",
    description:
      "A resource-trading strategy board game for 2-5 players where you build trade routes, negotiate with rivals, and race to establish the wealthiest kingdom. Average playtime is 60-90 minutes, with modular boards for high replayability.",
    brand: "Tablewright Games",
    priceCents: 3900,
    stockQuantity: 2,
    categorySlug: "board-games-puzzles",
    images: [img("kingdom-traders-strategy-board-game")],
  },
  {
    slug: "1000-piece-jigsaw-puzzle-mountain-lake",
    name: "1000-Piece Jigsaw Puzzle: Mountain Lake at Dawn",
    description:
      "A 1000-piece jigsaw puzzle featuring a photographed mountain lake scene at sunrise, printed on thick puzzle-grade board that resists bending. Finished size is 27x20 inches, suitable for framing once completed.",
    brand: "Tablewright Games",
    priceCents: 1899,
    stockQuantity: 74,
    categorySlug: "board-games-puzzles",
    images: [img("1000-piece-jigsaw-puzzle-mountain-lake")],
  },
  {
    slug: "family-trivia-card-game",
    name: "Family Trivia Card Game: Around the World Edition",
    description:
      "A trivia card game with 1,200 questions across six categories and three difficulty tiers, designed so kids and adults can play together on an even footing. Compact box makes it an easy pick for game night or road trips.",
    brand: "Tablewright Games",
    priceCents: 2200,
    stockQuantity: 98,
    categorySlug: "board-games-puzzles",
    images: [img("family-trivia-card-game")],
  },

  // ---- Toys & Games / Building Sets ----
  {
    slug: "500-piece-construction-brick-set",
    name: "BrickWorks City Skyline 500-Piece Construction Set",
    description:
      "A 500-piece interlocking brick set for building a five-building city skyline, compatible with most major building-brick brands. Includes an illustrated step-by-step booklet and a reusable storage tub for sorting pieces.",
    brand: "BrickWorks",
    priceCents: 4900,
    stockQuantity: 63,
    categorySlug: "building-sets",
    images: [img("500-piece-construction-brick-set")],
  },
  {
    slug: "magnetic-tile-building-set-60pc",
    name: "BrickWorks Magnetic Tile Building Set (60-Piece)",
    description:
      "A 60-piece set of translucent magnetic building tiles in squares, triangles, and windows, letting kids build towers, castles, and cars that snap together instantly. Tiles are compatible with most other magnetic building brands on the market.",
    brand: "BrickWorks",
    priceCents: 4400,
    stockQuantity: 77,
    categorySlug: "building-sets",
    images: [img("magnetic-tile-building-set-60pc")],
  },

  // ---- Grocery / Snacks & Beverages ----
  {
    slug: "sparkling-water-variety-pack-12can",
    name: "Meadowfresh Sparkling Water Variety Pack (12-Can)",
    description:
      "A 12-can variety pack of unsweetened sparkling water in four fruit-forward flavors, with zero calories, zero sugar, and no artificial sweeteners. Brewed with real fruit essence and finely carbonated for a crisp finish.",
    brand: "Meadowfresh",
    priceCents: 899,
    stockQuantity: 214,
    categorySlug: "snacks-beverages",
    images: [img("sparkling-water-variety-pack-12can")],
  },
  {
    slug: "dark-chocolate-almond-bars-12ct",
    name: "Meadowfresh Dark Chocolate Almond Bars (Box of 12)",
    description:
      "Individually wrapped 70% dark chocolate bars studded with roasted almonds and a touch of sea salt, made with fair-trade certified cocoa. A box of 12 makes for easy grab-and-go snacking or lunchbox additions.",
    brand: "Meadowfresh",
    priceCents: 1299,
    stockQuantity: 156,
    categorySlug: "snacks-beverages",
    images: [img("dark-chocolate-almond-bars-12ct")],
  },
  {
    slug: "kettle-cooked-sea-salt-chips",
    name: "Meadowfresh Kettle-Cooked Sea Salt Potato Chips",
    description:
      "Thick-cut potato chips kettle-cooked in small batches for extra crunch, seasoned simply with sea salt and nothing else. Non-GMO potatoes, cooked in avocado oil for a cleaner ingredient list.",
    brand: "Meadowfresh",
    priceCents: 449,
    stockQuantity: 189,
    categorySlug: "snacks-beverages",
    images: [img("kettle-cooked-sea-salt-chips")],
  },

  // ---- Grocery / Pantry Staples ----
  {
    slug: "organic-extra-virgin-olive-oil-500ml",
    name: "Meadowfresh Organic Extra Virgin Olive Oil (500ml)",
    description:
      "A cold-pressed, organic extra virgin olive oil with a peppery finish, bottled from a single harvest for consistent flavor. Packaged in a dark glass bottle to protect against light degradation, ideal for finishing dishes or everyday cooking.",
    brand: "Meadowfresh",
    priceCents: 1699,
    stockQuantity: 92,
    categorySlug: "pantry-staples",
    images: [img("organic-extra-virgin-olive-oil-500ml")],
  },

  // ---- Grocery / Coffee & Tea ----
  {
    slug: "single-origin-ethiopian-coffee-beans",
    name: "Meadowfresh Single-Origin Ethiopian Coffee Beans (12oz)",
    description:
      "Light-roast whole bean coffee sourced from a single farm cooperative in the Yirgacheffe region, with tasting notes of blueberry, bergamot, and brown sugar. Roasted in small batches weekly and shipped within days of roasting for peak freshness.",
    brand: "Meadowfresh",
    priceCents: 1599,
    stockQuantity: 104,
    categorySlug: "coffee-tea",
    images: [img("single-origin-ethiopian-coffee-beans")],
  },
  {
    slug: "organic-green-tea-bags-100ct",
    name: "Meadowfresh Organic Green Tea Bags (100-Count)",
    description:
      "A 100-count box of organic green tea in individually wrapped bags for freshness, sourced from high-elevation gardens for a smooth, grassy flavor without bitterness. Naturally low in caffeine compared to black tea or coffee.",
    brand: "Meadowfresh",
    priceCents: 999,
    stockQuantity: 138,
    categorySlug: "coffee-tea",
    images: [img("organic-green-tea-bags-100ct")],
  },

  // ---- Office & Stationery / Notebooks & Paper ----
  {
    slug: "dot-grid-bullet-journal",
    name: "Fieldnote Dot Grid Bullet Journal",
    description:
      "A 240-page dot grid notebook with a numbered table of contents, an elastic closure band, and a ribbon bookmark, sized for bullet journaling or daily planning. Thick 120gsm paper resists bleed-through from most fountain and gel pens.",
    brand: "Fieldnote",
    priceCents: 1499,
    stockQuantity: 167,
    categorySlug: "notebooks-paper",
    images: [img("dot-grid-bullet-journal")],
  },
  {
    slug: "recycled-sticky-notes-pack",
    name: "Fieldnote Recycled Sticky Notes Pack (12-Pad)",
    description:
      "A 12-pad pack of 3x3 sticky notes made from 100% recycled paper with a strong-hold adhesive that stays put on monitors, notebooks, and desks. Available in a mix of pastel colors for easy color-coding.",
    brand: "Fieldnote",
    priceCents: 799,
    stockQuantity: 203,
    categorySlug: "notebooks-paper",
    images: [img("recycled-sticky-notes-pack")],
  },

  // ---- Office & Stationery / Desk Accessories ----
  {
    slug: "bamboo-monitor-stand",
    name: "Fieldnote Bamboo Monitor Stand with Storage",
    description:
      "A solid bamboo monitor stand that raises your screen 4 inches to a more ergonomic eye level, with an open shelf underneath for a keyboard or notebooks. Rated to hold monitors up to 44 pounds.",
    brand: "Fieldnote",
    priceCents: 3400,
    stockQuantity: 78,
    categorySlug: "desk-accessories",
    images: [img("bamboo-monitor-stand")],
  },
  {
    slug: "adjustable-led-desk-lamp",
    name: "Fieldnote Focus Adjustable LED Desk Lamp",
    description:
      "A flicker-free LED desk lamp with five brightness levels and three color temperatures, controlled through a touch-sensitive base with memory of your last setting. A built-in USB-A port lets you charge a phone without an extra outlet.",
    brand: "Fieldnote",
    priceCents: 3900,
    stockQuantity: 91,
    categorySlug: "desk-accessories",
    images: [img("adjustable-led-desk-lamp")],
  },

  // ---- Office & Stationery / Writing Instruments ----
  {
    slug: "12-color-gel-pen-set",
    name: "Fieldnote 12-Color Gel Pen Set",
    description:
      "A set of 12 gel pens in vibrant, richly pigmented colors with a smooth 0.7mm tip that glides without skipping. Comfort grip barrels reduce hand fatigue during long journaling or planning sessions.",
    brand: "Fieldnote",
    priceCents: 1199,
    stockQuantity: 146,
    categorySlug: "writing-instruments",
    images: [img("12-color-gel-pen-set")],
  },

  // ---- Pet Supplies / Dog Supplies ----
  {
    slug: "orthopedic-memory-foam-dog-bed",
    name: "Pawline Orthopedic Memory Foam Dog Bed (Large)",
    description:
      "A large orthopedic dog bed with a 4-inch memory foam base that supports joints and hips, especially helpful for senior dogs or larger breeds. The removable cover unzips for machine washing, and a waterproof liner protects the foam from accidents.",
    brand: "Pawline",
    priceCents: 6900,
    compareAtPriceCents: 8400,
    stockQuantity: 44,
    categorySlug: "dog-supplies",
    images: [img("orthopedic-memory-foam-dog-bed")],
  },
  {
    slug: "durable-rope-chew-toy",
    name: "Pawline Tuff Braid Rope Chew Toy",
    description:
      "A tightly braided cotton rope toy built for tug-of-war and solo chewing, with fibers that help clean teeth and massage gums as your dog plays. Machine washable and free of dyes or artificial additives.",
    brand: "Pawline",
    priceCents: 1200,
    stockQuantity: 187,
    categorySlug: "dog-supplies",
    images: [img("durable-rope-chew-toy")],
  },

  // ---- Pet Supplies / Cat Supplies ----
  {
    slug: "self-cleaning-litter-box",
    name: "Pawline AutoScoop Self-Cleaning Litter Box",
    description:
      "An automatic litter box that rakes waste into a sealed compartment within minutes of your cat leaving, cutting down on odor and daily scooping. Quiet motor operation and a safety sensor pause cleaning cycles whenever a cat is inside.",
    brand: "Pawline",
    sku: "PL-LB-AUTO",
    priceCents: 15900,
    stockQuantity: 0,
    categorySlug: "cat-supplies",
    images: [img("self-cleaning-litter-box")],
  },
  {
    slug: "interactive-feather-wand-cat-toy",
    name: "Pawline Flutter Interactive Feather Wand",
    description:
      "A telescoping wand toy with a feather-and-bell attachment that taps into a cat's natural prey drive for active, engaging play sessions. Extends to 3 feet for interactive play and collapses to 14 inches for easy storage.",
    brand: "Pawline",
    priceCents: 999,
    stockQuantity: 164,
    categorySlug: "cat-supplies",
    images: [img("interactive-feather-wand-cat-toy")],
  },

  // ---- Pet Supplies / Small Pet & Aquarium ----
  {
    slug: "10-gallon-aquarium-starter-kit",
    name: "Pawline 10-Gallon Aquarium Starter Kit",
    description:
      "A complete 10-gallon aquarium starter kit including a quiet filtration system, LED hood light, and a heater rated for tropical fish, everything needed to set up a first freshwater tank. Includes a water conditioner sample and setup guide.",
    brand: "Pawline",
    priceCents: 8900,
    stockQuantity: 37,
    categorySlug: "small-pet-aquarium",
    images: [img("10-gallon-aquarium-starter-kit")],
  },
];

// ---------------------------------------------------------------------------
// REVIEWERS
// ---------------------------------------------------------------------------

export const REVIEWERS: SeedReviewer[] = [
  { name: "Sarah Mitchell", email: "sarah.mitchell@example.com" },
  { name: "James Chen", email: "james.chen@example.com" },
  { name: "Priya Patel", email: "priya.patel@example.com" },
  { name: "Marcus Johnson", email: "marcus.johnson@example.com" },
  { name: "Elena Rodriguez", email: "elena.rodriguez@example.com" },
  { name: "David Kim", email: "david.kim@example.com" },
  { name: "Olivia Brown", email: "olivia.brown@example.com" },
  { name: "Ahmed Hassan", email: "ahmed.hassan@example.com" },
  { name: "Grace Liu", email: "grace.liu@example.com" },
  { name: "Tom Walker", email: "tom.walker@example.com" },
  { name: "Nina Petrova", email: "nina.petrova@example.com" },
  { name: "Carlos Mendes", email: "carlos.mendes@example.com" },
  { name: "Rachel Greene", email: "rachel.greene@example.com" },
  { name: "Kevin O'Brien", email: "kevin.obrien@example.com" },
  { name: "Fatima Al-Sayed", email: "fatima.alsayed@example.com" },
  { name: "Ben Thompson", email: "ben.thompson@example.com" },
  { name: "Hannah Schmidt", email: "hannah.schmidt@example.com" },
  { name: "Jorge Ramirez", email: "jorge.ramirez@example.com" },
];

// ---------------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------------

export const REVIEWS: SeedReview[] = [
  // Wireless Noise-Cancelling Headphones (3)
  {
    productSlug: "wireless-noise-cancelling-headphones",
    rating: 5,
    title: "Best headphones I've owned",
    body: "The noise cancellation is genuinely impressive on flights — I couldn't hear the engine hum at all after about 30 seconds of adjusting. Battery life claims are accurate too, I got a full week of commuting out of one charge.",
  },
  {
    productSlug: "wireless-noise-cancelling-headphones",
    rating: 4,
    title: "Great sound, a little tight at first",
    body: "Sound quality and ANC are excellent. The headband was a bit snug out of the box but loosened up after a week of wear. Would still recommend.",
  },
  {
    productSlug: "wireless-noise-cancelling-headphones",
    rating: 2,
    title: "Disappointed with the multipoint pairing",
    body: "Constantly drops the connection to my laptop when my phone rings, and I have to manually reconnect. Sound is good when it works, but this bug is a dealbreaker for my workflow.",
  },

  // Bluetooth Earbuds Pro (2)
  {
    productSlug: "bluetooth-earbuds-pro",
    rating: 5,
    title: "Stay put through any workout",
    body: "I've tried four other earbuds that fell out during runs. These actually stay in place, sweat resistance works as advertised, and the case battery genuinely lasts most of the week.",
  },
  {
    productSlug: "bluetooth-earbuds-pro",
    rating: 4,
    body: "Solid everyday earbuds for the price. Touch controls take some getting used to but work reliably once you learn them.",
  },

  // 14-Inch Ultrabook Laptop (2)
  {
    productSlug: "14-inch-ultrabook-laptop",
    rating: 5,
    title: "Perfect for working from coffee shops",
    body: "Light enough that I forget it's in my bag, and the battery genuinely lasts through a full workday of writing and video calls without hunting for an outlet.",
  },
  {
    productSlug: "14-inch-ultrabook-laptop",
    rating: 3,
    title: "Good machine, fan-less means it gets warm",
    body: "Performance is fine for everyday tasks but the bottom gets noticeably warm during video calls since there's no fan to help dissipate heat. Screen and keyboard are great though.",
  },

  // Mechanical Keyboard RGB (1)
  {
    productSlug: "mechanical-keyboard-rgb",
    rating: 5,
    title: "Switches feel fantastic",
    body: "Hot-swapped mine to a different switch type in about ten minutes with no soldering needed. Typing feel is excellent and the aluminum plate makes it feel like a much more expensive board.",
  },

  // Unlocked Smartphone 128GB (2)
  {
    productSlug: "unlocked-smartphone-128gb",
    rating: 4,
    title: "Great value flagship alternative",
    body: "Camera quality punches above its price point, especially in daylight. Battery easily gets me through a full day of heavy use. Only gripe is the fingerprint sensor is occasionally slow to register.",
  },
  {
    productSlug: "unlocked-smartphone-128gb",
    rating: 5,
    body: "Switched from a much more expensive phone and honestly don't miss it. Screen is gorgeous and charging is fast.",
  },

  // 20000mAh Portable Power Bank (1)
  {
    productSlug: "20000mah-portable-power-bank",
    rating: 4,
    title: "Heavier than expected but does the job",
    body: "Definitely feels dense in a bag, but it charges my phone from empty to full more than four times before needing a recharge itself. Great for weekend trips.",
  },

  // Portable Bluetooth Speaker (1)
  {
    productSlug: "portable-bluetooth-speaker",
    rating: 5,
    title: "Survived a drop into the pool",
    body: "Literally fell off a floatie into the deep end and kept playing without missing a beat. Sound is loud and clear for the size, bass is better than I expected.",
  },

  // Stainless Steel Chef Knife Set (2)
  {
    productSlug: "stainless-steel-chef-knife-set",
    rating: 5,
    title: "Restaurant-quality edge out of the box",
    body: "These came razor sharp and have held their edge through weeks of daily prep work. The block looks great on the counter too.",
  },
  {
    productSlug: "stainless-steel-chef-knife-set",
    rating: 4,
    body: "Very happy with the knives themselves. The block is a little bigger than I expected for my counter space, but that's a minor complaint.",
  },

  // Non-Stick Ceramic Cookware Set (1)
  {
    productSlug: "non-stick-ceramic-cookware-set",
    rating: 3,
    title: "Nonstick coating wearing thin already",
    body: "Started sticking a bit after about two months of regular use, even with wooden utensils only. Pans themselves heat evenly and the lids are a nice touch.",
  },

  // Programmable Drip Coffee Maker (2)
  {
    productSlug: "programmable-drip-coffee-maker",
    rating: 5,
    title: "Timer feature is a game changer",
    body: "Wake up to a full pot every morning without thinking about it. The thermal carafe actually keeps coffee hot for hours, unlike our old hotplate model that always tasted burnt by 10am.",
  },
  {
    productSlug: "programmable-drip-coffee-maker",
    rating: 4,
    body: "Does exactly what it says. Wish the water reservoir markings were a bit easier to read but otherwise no complaints.",
  },

  // Adjustable Height Standing Desk (2)
  {
    productSlug: "adjustable-height-standing-desk",
    rating: 5,
    title: "Sturdy even at full height",
    body: "No wobble at all when raised to standing height, even with two monitors on it. The preset buttons are genuinely convenient — I switch positions multiple times a day without thinking about it.",
  },
  {
    productSlug: "adjustable-height-standing-desk",
    rating: 4,
    title: "Assembly took longer than advertised",
    body: "Took about 45 minutes with two people rather than the promised 20, but the desk itself has been rock solid since. Bamboo top looks great.",
  },

  // Mid-Century Modern Accent Chair (1)
  {
    productSlug: "mid-century-modern-accent-chair",
    rating: 4,
    body: "Comfortable and looks exactly like the pictures. Assembly was quick and straightforward.",
  },

  // The Midnight Orchard (1)
  {
    productSlug: "the-midnight-orchard",
    rating: 5,
    title: "Couldn't put it down",
    body: "The way the author weaves the three sisters' perspectives together had me reading past midnight for three nights straight. The orchard setting felt like its own character.",
  },

  // Deep Focus: Mastering Attention (1)
  {
    productSlug: "deep-focus-mastering-attention",
    rating: 4,
    body: "Practical and not preachy, which is rare for this genre. The 30-day plan actually helped me cut my phone usage significantly.",
  },

  // Luna and the Star Whale (1)
  {
    productSlug: "luna-and-the-star-whale",
    rating: 5,
    title: "Our new bedtime favorite",
    body: "My four-year-old asks for this every single night. The illustrations are gorgeous and the story is calming without being boring for adults to read aloud.",
  },

  // Wrap Midi Dress (2)
  {
    productSlug: "wrap-midi-dress",
    rating: 5,
    title: "Fits like it was tailored",
    body: "The adjustable wrap waist means it actually fits well regardless of bloating or the time of month, which I appreciate more than I expected to. Fabric doesn't wrinkle in a bag either.",
  },
  {
    productSlug: "wrap-midi-dress",
    rating: 3,
    body: "Pretty dress but ran a little large for me. Would size down if ordering again.",
  },

  // High-Waist Yoga Leggings (1)
  {
    productSlug: "high-waist-yoga-leggings",
    rating: 5,
    title: "Genuinely squat-proof",
    body: "I was skeptical but these held up through hot yoga and weightlifting without any see-through moments. The pocket is a great bonus feature.",
  },

  // Merino Wool Crewneck Sweater (1)
  {
    productSlug: "merino-wool-crewneck-sweater",
    rating: 4,
    body: "Soft, warm, and hasn't pilled after several wears. Runs slightly small so I'd size up.",
  },

  // Vitamin C Brightening Serum (2)
  {
    productSlug: "vitamin-c-brightening-serum",
    rating: 5,
    title: "Noticeable difference in a few weeks",
    body: "My dark spots from last summer are visibly fading and my skin looks brighter overall. No irritation even though I have fairly sensitive skin.",
  },
  {
    productSlug: "vitamin-c-brightening-serum",
    rating: 2,
    title: "Broke me out",
    body: "Unfortunately caused some breakouts on my cheeks after about a week of use. Might just not be right for my skin type, but wanted to flag it.",
  },

  // Argan Oil Repair Shampoo (1)
  {
    productSlug: "argan-oil-repair-shampoo",
    rating: 4,
    body: "Smells great and my hair feels noticeably softer after a couple of washes. Doesn't lather as much as I'm used to but that seems to be normal for sulfate-free formulas.",
  },

  // Adjustable Dumbbell Set (2)
  {
    productSlug: "adjustable-dumbbell-set",
    rating: 5,
    title: "Replaced my entire home gym rack",
    body: "The dial system is fast and reliable, no fumbling with pins or clips mid-workout. Saved a huge amount of floor space compared to a full rack of fixed dumbbells.",
  },
  {
    productSlug: "adjustable-dumbbell-set",
    rating: 4,
    body: "Great value for what you get, though they are noticeably bulkier than standard dumbbells at the same weight, which takes some adjustment for certain exercises.",
  },

  // Extra-Thick Yoga Mat (1)
  {
    productSlug: "extra-thick-yoga-mat",
    rating: 5,
    body: "The extra cushioning makes a real difference for kneeling poses. Grippy even when I'm sweating a lot.",
  },

  // Road Bike Helmet with MIPS (1)
  {
    productSlug: "road-bike-helmet-mips",
    rating: 4,
    title: "Light and well ventilated",
    body: "Barely notice I'm wearing it on long rides, and the vents genuinely help keep my head cool on summer climbs. Dial adjuster is easy to use with gloves on.",
  },

  // Kingdom Traders Strategy Board Game (1)
  {
    productSlug: "kingdom-traders-strategy-board-game",
    rating: 5,
    title: "New game night staple",
    body: "Deep enough to stay interesting after a dozen plays but not so complex that new players feel lost. The modular boards really do keep it fresh.",
  },

  // Single-Origin Ethiopian Coffee Beans (2)
  {
    productSlug: "single-origin-ethiopian-coffee-beans",
    rating: 5,
    title: "Best pour-over coffee I've had delivered",
    body: "The blueberry notes are not an exaggeration — genuinely tastes fruity and bright when brewed as a pour-over. Roast date on the bag was only four days old on arrival.",
  },
  {
    productSlug: "single-origin-ethiopian-coffee-beans",
    rating: 4,
    body: "Really enjoyable coffee, though it's on the pricier side for a 12oz bag. Would buy again for a special occasion.",
  },

  // Dark Chocolate Almond Bars (1)
  {
    productSlug: "dark-chocolate-almond-bars-12ct",
    rating: 5,
    body: "Perfect balance of dark chocolate bitterness and roasted almond crunch. The whole box disappeared within a week in our house.",
  },

  // Orthopedic Memory Foam Dog Bed (2)
  {
    productSlug: "orthopedic-memory-foam-dog-bed",
    rating: 5,
    title: "Our senior lab loves it",
    body: "She has hip issues and clearly gets up more easily after sleeping on this compared to her old bed. The cover has survived several washes without losing shape.",
  },
  {
    productSlug: "orthopedic-memory-foam-dog-bed",
    rating: 3,
    body: "Good support but ran smaller than expected for a 'large' size — our 70lb dog hangs off the edges a bit.",
  },

  // Interactive Feather Wand Cat Toy (1)
  {
    productSlug: "interactive-feather-wand-cat-toy",
    rating: 5,
    body: "Our normally lazy cat turned into a kitten again with this toy. The extendable wand keeps my hands safely away from claws during play.",
  },

  // Dot Grid Bullet Journal (1)
  {
    productSlug: "dot-grid-bullet-journal",
    rating: 4,
  },

  // 5-Tier Ladder Bookshelf (1)
  {
    productSlug: "5-tier-ladder-bookshelf",
    rating: 4,
  },

  // Compact 4K Action Camera (1)
  {
    productSlug: "compact-4k-action-camera",
    rating: 3,
  },
];
