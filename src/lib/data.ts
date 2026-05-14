export type OrderStatus = "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
export type PaymentMethod = "wallet" | "upi" | "cod" | "card";
export type MemberTier = "standard" | "prime";

export interface Order {
  id: string;
  customer: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  status: OrderStatus;
  payment: PaymentMethod;
  driver?: string;
  placed_at: string;
  delivered_at?: string;
}

export interface Customer {
  uid: string;
  name: string;
  phone: string;
  email: string;
  membership_tier: string;
  orders_count: number;
  litres_delivered: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  size: string;
  unit: string;
  price: number;
  mrp?: number;
  category: string;
  description?: string;
  badge?: string;
  popular: boolean;
  active: boolean;
  stock: number;
  sold: number;
  deliveryType?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  active: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_per_month: number;
  features: string[];
  popular: boolean;
  delivery_frequency: string;
  active: boolean;
}

export interface HomeContent {
  stats: {
    deliveriesToday: string;
    avgDeliveryMin: number;
    rating: number;
    happyCustomers: string;
    citiesCovered: number;
  };
  trustBadges: { icon: string; label: string }[];
  banners: { id: string; title: string; sub: string; bg: string; badge: string; emoji: string }[];
  testimonials: { id: string; name: string; location: string; avatar: string; rating: number; text: string; tag: string }[];
}

export interface Subscription {
  id: string;
  user_id: string;
  customer: string;
  phone: string;
  product_name: string;
  product_id: string;
  quantity: number;
  frequency: string;
  start_date: string;
  time_slot: string;
  address: string;
  total: number;
  status: "active" | "paused" | "cancelled";
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: "available" | "on_route" | "off_duty";
  deliveriesToday: number;
  rating: number;
  zone: string;
}

/* ── Mock data (charts only — all table data comes from Supabase) ── */

export const PRODUCTS: Product[] = [
  { id: "p1",  name: "AquaPure Mini",           size: "200ml",    unit: "Bottle",  price: 10,    mrp: 12,    category: "individual", badge: "Compact",   popular: false, active: true,  stock: 500,  sold: 812  },
  { id: "p2",  name: "AquaPure Classic",         size: "500ml",    unit: "Bottle",  price: 20,    mrp: 25,    category: "individual", badge: "Bestseller",popular: true,  active: true,  stock: 800,  sold: 3241 },
  { id: "p3",  name: "AquaPure Litre",           size: "1L",       unit: "Bottle",  price: 35,    mrp: 40,    category: "individual", badge: undefined,   popular: false, active: true,  stock: 400,  sold: 1528 },
  { id: "p4",  name: "AquaPure Family",          size: "5L",       unit: "Can",     price: 90,    mrp: 110,   category: "individual", badge: undefined,   popular: false, active: true,  stock: 250,  sold: 2104 },
  { id: "p5",  name: "AquaPure Mega",            size: "10L",      unit: "Can",     price: 160,   mrp: 190,   category: "apartment",  badge: undefined,   popular: false, active: true,  stock: 120,  sold: 934  },
  { id: "p6",  name: "AquaPure Dispenser Can",   size: "25L",      unit: "Can",     price: 320,   mrp: 370,   category: "apartment",  badge: "Popular",   popular: true,  active: true,  stock: 80,   sold: 1763 },
  { id: "p7",  name: "Event Pack 12 (500ml)",    size: "12×500ml", unit: "Bundle",  price: 220,   mrp: 260,   category: "bundles",    badge: "Bundle",    popular: false, active: true,  stock: 60,   sold: 445  },
  { id: "p8",  name: "Event Pack 24 (500ml)",    size: "24×500ml", unit: "Bundle",  price: 400,   mrp: 480,   category: "bundles",    badge: "Best Value",popular: true,  active: true,  stock: 45,   sold: 1102 },
  { id: "t2",  name: "Standard Tanker",          size: "5,000L",   unit: "Tanker",  price: 2000,  mrp: undefined, category: "apartment", badge: "Tanker", popular: true,  active: true,  stock: 10,   sold: 412  },
  { id: "m1",  name: "Aqua Smart RO Purifier",   size: "15L/hr",   unit: "Machine", price: 12500, mrp: 15000, category: "machines",   badge: "New",       popular: true,  active: true,  stock: 15,   sold: 631  },
];

export const DRIVERS: Driver[] = [
  { id: "d1", name: "Suresh Dandamudi",  phone: "+91 94400 11111", vehicle: "MH-12-AB-1234", status: "on_route",  deliveriesToday: 8,  rating: 4.9, zone: "Koramangala / HSR" },
  { id: "d2", name: "Ravi Kiran",         phone: "+91 94400 22222", vehicle: "MH-12-CD-5678", status: "on_route",  deliveriesToday: 6,  rating: 4.8, zone: "Indiranagar / Whitefield" },
  { id: "d3", name: "Amit Singh",         phone: "+91 94400 33333", vehicle: "MH-12-EF-9012", status: "available", deliveriesToday: 11, rating: 4.7, zone: "Banjara Hills / Jubilee" },
  { id: "d4", name: "Mohammed Faiz",      phone: "+91 94400 44444", vehicle: "MH-12-GH-3456", status: "available", deliveriesToday: 5,  rating: 4.9, zone: "HITEC City / Madhapur" },
  { id: "d5", name: "Prakash Rao",        phone: "+91 94400 55555", vehicle: "MH-12-IJ-7890", status: "off_duty",  deliveriesToday: 0,  rating: 4.6, zone: "MG Road / Brigade" },
];

export const REVENUE_DATA = [
  { day: "Mon",  revenue: 18400, orders: 32 },
  { day: "Tue",  revenue: 22100, orders: 41 },
  { day: "Wed",  revenue: 19800, orders: 37 },
  { day: "Thu",  revenue: 25600, orders: 48 },
  { day: "Fri",  revenue: 31200, orders: 58 },
  { day: "Sat",  revenue: 28900, orders: 54 },
  { day: "Sun",  revenue: 24800, orders: 47 },
];

export const CATEGORY_DATA = [
  { name: "Individual",  value: 38 },
  { name: "Apartment",   value: 27 },
  { name: "Bundles",     value: 18 },
  { name: "Tankers",     value: 10 },
  { name: "Purifiers",   value: 7  },
];
