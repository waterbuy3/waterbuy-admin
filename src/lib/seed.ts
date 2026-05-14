import { supabase } from "./supabase";

const PRODUCTS = [
  { id: "p1",  name: "AquaPure Mini",        size: "200ml",      unit: "Bottle",  price: 10,    mrp: 12,        category: "individual", description: "Perfect for on-the-go hydration",                  badge: "Compact",    popular: false, active: true,  stock: 500, sold: 812,  deliveryType: "All",       imageUrl: "/water-bottle.png",  rating: 4.6, reviewCount: 812  },
  { id: "p2",  name: "AquaPure Classic",      size: "500ml",      unit: "Bottle",  price: 20,    mrp: 25,        category: "individual", description: "Our bestselling everyday bottle",                  badge: "Bestseller", popular: true,  active: true,  stock: 300, sold: 3241, deliveryType: "All",       imageUrl: "/water-bottle.png",  rating: 4.9, reviewCount: 3241 },
  { id: "p3",  name: "AquaPure Litre",        size: "1L",         unit: "Bottle",  price: 35,    mrp: 40,        category: "individual", description: "Great value for daily use",                        badge: null,         popular: false, active: true,  stock: 200, sold: 1528, deliveryType: "All",       imageUrl: "/water-bottle.png",  rating: 4.7, reviewCount: 1528 },
  { id: "p4",  name: "AquaPure Family",       size: "5L",         unit: "Can",     price: 90,    mrp: 110,       category: "individual", description: "Perfect for families and homes",                   badge: null,         popular: false, active: true,  stock: 150, sold: 2104, deliveryType: "All",       imageUrl: "/water-can.png",     rating: 4.8, reviewCount: 2104 },
  { id: "p5",  name: "AquaPure Mega",         size: "10L",        unit: "Can",     price: 160,   mrp: 190,       category: "apartment",  description: "Ideal for apartments and offices",                 badge: null,         popular: false, active: true,  stock: 80,  sold: 934,  deliveryType: "All",       imageUrl: "/water-can.png",     rating: 4.7, reviewCount: 934  },
  { id: "p6",  name: "AquaPure Dispenser Can",size: "25L",        unit: "Can",     price: 320,   mrp: 370,       category: "apartment",  description: "Dispenser-ready water can",                        badge: "Popular",    popular: true,  active: true,  stock: 60,  sold: 1763, deliveryType: "All",       imageUrl: "/water-can.png",     rating: 4.8, reviewCount: 1763 },
  { id: "p7",  name: "Event Pack 12 (500ml)", size: "12 × 500ml", unit: "Bundle",  price: 220,   mrp: 260,       category: "bundles",    description: "Bundle of 12 bottles for small events",           badge: "Bundle",     popular: false, active: true,  stock: 40,  sold: 445,  deliveryType: "Scheduled", imageUrl: "/water-bundle.png",  rating: 4.6, reviewCount: 445  },
  { id: "p8",  name: "Event Pack 24 (500ml)", size: "24 × 500ml", unit: "Bundle",  price: 400,   mrp: 480,       category: "bundles",    description: "Bundle of 24 bottles for medium events",          badge: "Best Value", popular: true,  active: true,  stock: 30,  sold: 1102, deliveryType: "Scheduled", imageUrl: "/water-bundle.png",  rating: 4.8, reviewCount: 1102 },
  { id: "p9",  name: "Wedding Premium Pack",  size: "48 × 500ml", unit: "Bundle",  price: 750,   mrp: 900,       category: "wedding",    description: "Elegant branded bottles for weddings",             badge: "Premium",    popular: false, active: true,  stock: 20,  sold: 287,  deliveryType: "Scheduled", imageUrl: "/water-bundle.png",  rating: 4.9, reviewCount: 287  },
  { id: "p10", name: "Corporate Box (1L)",    size: "24 × 1L",    unit: "Bundle",  price: 800,   mrp: 960,       category: "corporate",  description: "Office supply box with branded bottles",           badge: null,         popular: false, active: true,  stock: 25,  sold: 568,  deliveryType: "Scheduled", imageUrl: "/water-bundle.png",  rating: 4.7, reviewCount: 568  },
  { id: "t1",  name: "Mini Tanker",           size: "3,000L",     unit: "Tanker",  price: 1500,  mrp: null,      category: "apartment",  description: "Mini tanker for small complexes",                  badge: "Tanker",     popular: false, active: true,  stock: 10,  sold: 193,  deliveryType: "Scheduled", imageUrl: "/tanker-5000l.png",  rating: 4.6, reviewCount: 193  },
  { id: "t2",  name: "Standard Tanker",       size: "5,000L",     unit: "Tanker",  price: 2000,  mrp: null,      category: "apartment",  description: "Standard tanker for apartments",                   badge: "Tanker",     popular: true,  active: true,  stock: 8,   sold: 412,  deliveryType: "Scheduled", imageUrl: "/tanker-5000l.png",  rating: 4.8, reviewCount: 412  },
  { id: "t3",  name: "Jumbo Tanker",          size: "10,000L",    unit: "Tanker",  price: 3500,  mrp: null,      category: "apartment",  description: "Large tanker for bulk distribution",               badge: "Tanker",     popular: false, active: true,  stock: 5,   sold: 284,  deliveryType: "Scheduled", imageUrl: "/tanker-10000l.png", rating: 4.7, reviewCount: 284  },
  { id: "t4",  name: "Mega Tanker",           size: "25,000L",    unit: "Tanker",  price: 7500,  mrp: null,      category: "apartment",  description: "Massive tanker for large housing societies",       badge: "Mega",       popular: false, active: true,  stock: 3,   sold: 97,   deliveryType: "Scheduled", imageUrl: "/tanker-10000l.png", rating: 4.9, reviewCount: 97   },
  { id: "m1",  name: "Aqua Smart RO Purifier",size: "15L/hr",     unit: "Machine", price: 12500, mrp: 15000,     category: "machines",   description: "Smart RO water purifier with mineral enrichment",  badge: "New",        popular: true,  active: true,  stock: 15,  sold: 631,  deliveryType: "Scheduled", imageUrl: "/ro-purifier.png",  rating: 4.9, reviewCount: 631  },
];

const CATEGORIES = [
  { id: "individual", name: "Individual", description: "Personal hydration packs",     icon: "🧑", color: "from-blue-400 to-blue-600",    order: 1, active: true },
  { id: "corporate",  name: "Corporate",  description: "Office & workplace supply",    icon: "🏢", color: "from-cyan-400 to-cyan-600",    order: 2, active: true },
  { id: "events",     name: "Events",     description: "Parties, conferences & more", icon: "🎉", color: "from-teal-400 to-teal-600",    order: 3, active: true },
  { id: "wedding",    name: "Wedding",    description: "Premium wedding packages",     icon: "💒", color: "from-sky-400 to-indigo-500",   order: 4, active: true },
  { id: "apartment",  name: "Apartment",  description: "Bulk & tanker delivery",       icon: "🏠", color: "from-blue-500 to-blue-700",    order: 5, active: true },
  { id: "bundles",    name: "Bundles",    description: "Packs of 12 or 24",           icon: "📦", color: "from-indigo-400 to-indigo-600",order: 6, active: true },
  { id: "machines",   name: "Purifiers",  description: "RO systems and filters",      icon: "💧", color: "from-blue-300 to-cyan-500",    order: 7, active: true },
];

const PLANS = [
  { id: "basic",            name: "Basic Daily",    description: "Daily hydration for one",       price_per_month: 899,  delivery_frequency: "Daily",           popular: false, active: true, features: ["1 × 1L bottle delivered daily","Free morning delivery","Pause delivery anytime (Vacation Mode)","Cancel anytime"] },
  { id: "alternate",        name: "Alternate Days", description: "Perfect for couples",           price_per_month: 1299, delivery_frequency: "Alternate Days",  popular: true,  active: true, features: ["2 × 5L cans delivered alternate days","Flexible morning/evening slots","Pause delivery anytime","Free dispenser"] },
  { id: "weekly",           name: "Weekly Family",  description: "Ideal for families",            price_per_month: 1999, delivery_frequency: "Weekly",          popular: false, active: true, features: ["4 × 25L cans per week","Dedicated weekend delivery","Free dispenser maintenance","Pause delivery anytime"] },
  { id: "monthly_corporate",name: "Corporate Bulk", description: "For offices & large families", price_per_month: 8999, delivery_frequency: "Monthly",         popular: false, active: true, features: ["50 × 25L cans monthly quota","Call to dispatch anytime","Dedicated account manager","Custom branding available"] },
];

const DRIVERS = [
  { id: "d1", name: "Ravi Kumar",   phone: "+91 98765 11001", vehicle: "Tata Ace · TN09 AB 1234",          zone: "North Zone",   status: "on_route",  rating: 4.9, deliveriesToday: 14 },
  { id: "d2", name: "Suresh Babu",  phone: "+91 98765 22002", vehicle: "Ashok Leyland · TN09 CD 5678",     zone: "South Zone",   status: "available", rating: 4.7, deliveriesToday: 9  },
  { id: "d3", name: "Arun Selvam",  phone: "+91 98765 33003", vehicle: "Mahindra Pickup · TN09 EF 9012",   zone: "East Zone",    status: "on_route",  rating: 4.8, deliveriesToday: 11 },
  { id: "d4", name: "Karthik M.",   phone: "+91 98765 44004", vehicle: "Mini Truck · TN09 GH 3456",        zone: "West Zone",    status: "off_duty",  rating: 4.6, deliveriesToday: 0  },
  { id: "d5", name: "Vijay Prasad", phone: "+91 98765 55005", vehicle: "Tata Ace · TN09 IJ 7890",          zone: "Central Zone", status: "available", rating: 4.9, deliveriesToday: 7  },
];

const HOME_CONTENT = {
  stats: { deliveriesToday: "12,400+", avgDeliveryMin: 8, rating: 4.9, happyCustomers: "50K+", citiesCovered: 14 },
  trustBadges: [
    { icon: "🧪", label: "Lab Tested" }, { icon: "✅", label: "BIS Certified" },
    { icon: "⚡", label: "10 Min Delivery" }, { icon: "🌿", label: "Natural Source" }, { icon: "🔒", label: "Tamper Proof" },
  ],
  banners: [
    { id: "b1", title: "Get 20% Off on Tanker Booking",   sub: "Use code TANK20",   bg: "from-blue-600 to-cyan-500",    badge: "Limited Offer",  emoji: "🚚" },
    { id: "b2", title: "Free Dispenser with 5L Can Sub",  sub: "Use code FREEDISP", bg: "from-orange-500 to-amber-400", badge: "New User",        emoji: "🎁" },
    { id: "b3", title: "Flat ₹50 Off on 12-Pack Bundles", sub: "Use code PARTY50",  bg: "from-emerald-500 to-teal-500", badge: "Weekend Special", emoji: "🎉" },
  ],
  testimonials: [
    { id: "t1", name: "Priya M.",  location: "Bangalore", avatar: "PM", rating: 5, text: "Delivered in 7 minutes flat!", tag: "Instant Delivery" },
    { id: "t2", name: "Rahul K.",  location: "Mumbai",    avatar: "RK", rating: 5, text: "Runs on autopilot!",            tag: "Subscription"     },
    { id: "t3", name: "Ananya S.", location: "Hyderabad", avatar: "AS", rating: 5, text: "The tanker was on time and the water was crystal clear.", tag: "Tanker" },
    { id: "t4", name: "Kiran V.",  location: "Chennai",   avatar: "KV", rating: 5, text: "The wedding pack was amazing — branded bottles for all guests!", tag: "Wedding" },
  ],
};

export async function seedDatabase(onProgress?: (msg: string) => void): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const log = (msg: string) => onProgress?.(msg);

  log("Seeding products…");
  await supabase.from("products").upsert(PRODUCTS, { onConflict: "id" });
  log("✓ Products done");

  log("Seeding categories…");
  await supabase.from("categories").upsert(CATEGORIES, { onConflict: "id" });
  log("✓ Categories done");

  log("Seeding subscription plans…");
  await supabase.from("subscription_plans").upsert(PLANS, { onConflict: "id" });
  log("✓ Plans done");

  log("Seeding drivers…");
  await supabase.from("drivers").upsert(DRIVERS, { onConflict: "id" });
  log("✓ Drivers done");

  log("Seeding home content…");
  await supabase.from("content").upsert({ id: "home", data: HOME_CONTENT }, { onConflict: "id" });
  log("✓ Content done");

  log("✅ Database seeded successfully!");
}

export async function isSeeded(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.from("content").select("id").eq("id", "home").single();
  return !!data;
}
