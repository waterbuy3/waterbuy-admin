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
  placedAt: string;
  deliveredAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: MemberTier;
  orders: number;
  wallet: number;
  litres: number;
  joinedAt: string;
  lastOrder: string;
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
  pricePerMonth: number;
  features: string[];
  popular: boolean;
  deliveryFrequency: string;
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
  customer: string;
  phone: string;
  plan: string;
  frequency: string;
  items: string;
  nextDelivery: string;
  amount: number;
  status: "active" | "paused" | "cancelled";
  startedAt: string;
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

/* ── Mock data ── */

export const ORDERS: Order[] = [
  { id: "ORD-5021", customer: "Priya Mehta",       phone: "+91 98765 43210", address: "12/3 Green Valley, Block A",     items: "2×5L Cans",           total: 180,  status: "pending",    payment: "wallet", driver: undefined,    placedAt: "Today 10:30 AM" },
  { id: "ORD-5020", customer: "Rahul Kumar",        phone: "+91 87654 32109", address: "Floor 4, Tech Park, HITEC City", items: "1×25L Dispenser Can",  total: 320,  status: "in_transit", payment: "upi",    driver: "Suresh D",   placedAt: "Today 9:45 AM" },
  { id: "ORD-5019", customer: "Ananya Singh",       phone: "+91 76543 21098", address: "Flat 201, Sunrise Apts",         items: "1×20L Mini Tanker",    total: 1500, status: "confirmed",  payment: "upi",    driver: "Ravi K",     placedAt: "Today 9:00 AM" },
  { id: "ORD-5018", customer: "Kiran Verma",        phone: "+91 65432 10987", address: "52 MG Road",                     items: "24×500ml Bundle",       total: 400,  status: "delivered",  payment: "cod",    driver: "Amit S",     placedAt: "Yesterday 4:00 PM", deliveredAt: "Yesterday 6:20 PM" },
  { id: "ORD-5017", customer: "Meera Thampi",       phone: "+91 54321 09876", address: "8-2-120 Banjara Hills",          items: "1×1L Bottle × 5",      total: 175,  status: "delivered",  payment: "wallet", driver: "Suresh D",   placedAt: "Yesterday 2:00 PM", deliveredAt: "Yesterday 3:45 PM" },
  { id: "ORD-5016", customer: "Vikram Nair",        phone: "+91 43210 98765", address: "Plot 45, Jubilee Hills",         items: "1×500ml Bottle",        total: 20,   status: "cancelled",  payment: "wallet", driver: undefined,    placedAt: "Yesterday 11:00 AM" },
  { id: "ORD-5015", customer: "Sneha Reddy",        phone: "+91 32109 87654", address: "Flat 5B, Palm Grove Society",    items: "1×10L Mega Can",        total: 160,  status: "delivered",  payment: "upi",    driver: "Ravi K",     placedAt: "May 5, 8:00 AM", deliveredAt: "May 5, 9:30 AM" },
  { id: "ORD-5014", customer: "Arjun Prasad",       phone: "+91 21098 76543", address: "23 Koramangala 6th Block",       items: "Wedding Pack 48×500ml", total: 750,  status: "delivered",  payment: "card",   driver: "Amit S",     placedAt: "May 4, 3:00 PM", deliveredAt: "May 4, 6:00 PM" },
  { id: "ORD-5013", customer: "Divya Krishnan",     phone: "+91 10987 65432", address: "Flat 901, Sky Tower",            items: "1×25L Dispenser Can",   total: 320,  status: "delivered",  payment: "wallet", driver: "Suresh D",   placedAt: "May 4, 10:00 AM", deliveredAt: "May 4, 11:30 AM" },
  { id: "ORD-5012", customer: "Rohit Sharma",       phone: "+91 90876 54321", address: "12 Whitefield Main Road",        items: "Standard Tanker 5000L", total: 2000, status: "delivered",  payment: "upi",    driver: "Ravi K",     placedAt: "May 3, 7:00 AM", deliveredAt: "May 3, 9:00 AM" },
];

export const CUSTOMERS: Customer[] = [
  { id: "c1",  name: "Priya Mehta",   phone: "+91 98765 43210", email: "priya@example.com",   tier: "prime",    orders: 28, wallet: 850,   litres: 420,  joinedAt: "Jan 2025", lastOrder: "Today"      },
  { id: "c2",  name: "Rahul Kumar",   phone: "+91 87654 32109", email: "rahul@example.com",   tier: "prime",    orders: 41, wallet: 1200,  litres: 980,  joinedAt: "Nov 2024", lastOrder: "Today"      },
  { id: "c3",  name: "Ananya Singh",  phone: "+91 76543 21098", email: "ananya@example.com",  tier: "prime",    orders: 19, wallet: 350,   litres: 280,  joinedAt: "Feb 2025", lastOrder: "Today"      },
  { id: "c4",  name: "Kiran Verma",   phone: "+91 65432 10987", email: "kiran@example.com",   tier: "standard", orders: 7,  wallet: 80,    litres: 105,  joinedAt: "Apr 2025", lastOrder: "Yesterday"  },
  { id: "c5",  name: "Meera Thampi",  phone: "+91 54321 09876", email: "meera@example.com",   tier: "standard", orders: 15, wallet: 200,   litres: 195,  joinedAt: "Mar 2025", lastOrder: "Yesterday"  },
  { id: "c6",  name: "Vikram Nair",   phone: "+91 43210 98765", email: "vikram@example.com",  tier: "standard", orders: 3,  wallet: 0,     litres: 30,   joinedAt: "May 2025", lastOrder: "Yesterday"  },
  { id: "c7",  name: "Sneha Reddy",   phone: "+91 32109 87654", email: "sneha@example.com",   tier: "prime",    orders: 32, wallet: 650,   litres: 560,  joinedAt: "Dec 2024", lastOrder: "May 5"      },
  { id: "c8",  name: "Arjun Prasad",  phone: "+91 21098 76543", email: "arjun@example.com",   tier: "standard", orders: 5,  wallet: 0,     litres: 750,  joinedAt: "May 2025", lastOrder: "May 4"      },
  { id: "c9",  name: "Divya Krishnan",phone: "+91 10987 65432", email: "divya@example.com",   tier: "prime",    orders: 24, wallet: 900,   litres: 480,  joinedAt: "Jan 2025", lastOrder: "May 4"      },
  { id: "c10", name: "Rohit Sharma",  phone: "+91 90876 54321", email: "rohit@example.com",   tier: "prime",    orders: 11, wallet: 2500,  litres: 5000, joinedAt: "Mar 2025", lastOrder: "May 3"      },
];

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

export const SUBSCRIPTIONS: Subscription[] = [
  { id: "s1",  customer: "Priya Mehta",    phone: "+91 98765 43210", plan: "Alternate Days", frequency: "Every 2 days", items: "2×5L Cans",       nextDelivery: "Tomorrow, 7 AM",   amount: 1299, status: "active",   startedAt: "Jan 15, 2025" },
  { id: "s2",  customer: "Rahul Kumar",    phone: "+91 87654 32109", plan: "Corporate Bulk", frequency: "Monthly",      items: "50×25L Cans",     nextDelivery: "June 1, 9 AM",     amount: 8999, status: "active",   startedAt: "Nov 10, 2024" },
  { id: "s3",  customer: "Ananya Singh",   phone: "+91 76543 21098", plan: "Basic Daily",    frequency: "Daily",        items: "1×1L Bottle",     nextDelivery: "Tomorrow, 6 AM",   amount: 899,  status: "active",   startedAt: "Feb 3, 2025" },
  { id: "s4",  customer: "Sneha Reddy",    phone: "+91 32109 87654", plan: "Weekly Family",  frequency: "Weekly",       items: "4×25L Cans",      nextDelivery: "May 10, 10 AM",    amount: 1999, status: "active",   startedAt: "Dec 20, 2024" },
  { id: "s5",  customer: "Divya Krishnan", phone: "+91 10987 65432", plan: "Alternate Days", frequency: "Every 2 days", items: "2×5L Cans",       nextDelivery: "Paused",           amount: 1299, status: "paused",   startedAt: "Jan 22, 2025" },
  { id: "s6",  customer: "Rohit Sharma",   phone: "+91 90876 54321", plan: "Corporate Bulk", frequency: "Monthly",      items: "50×25L Cans",     nextDelivery: "Cancelled",        amount: 8999, status: "cancelled",startedAt: "Mar 5, 2025" },
  { id: "s7",  customer: "Meera Thampi",   phone: "+91 54321 09876", plan: "Basic Daily",    frequency: "Daily",        items: "1×1L Bottle",     nextDelivery: "Tomorrow, 6 AM",   amount: 899,  status: "active",   startedAt: "Mar 18, 2025" },
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
