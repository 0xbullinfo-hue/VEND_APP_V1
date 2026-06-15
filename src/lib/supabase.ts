import { createClient } from '@supabase/supabase-js';

// Access variables safely from React Native expo configuration or mock environment
const supabaseUrl = '';
const supabaseAnonKey = '';

// Create robust Supabase client
export const supabase = createClient(supabaseUrl || 'https://mock-supabase.vend.ng', supabaseAnonKey || 'mock-key');

// High-fidelity local database mock data to power immediate presentation and testing
export const MOCK_LOCALITIES = [
  { id: 1, name: 'Yaba / Mainland', state: 'Lagos', registered_users_count: 942, center_location: { latitude: 6.5165, longitude: 3.3792 } },
  { id: 2, name: 'Ikeja / GRA', state: 'Lagos', registered_users_count: 1045, center_location: { latitude: 6.5920, longitude: 3.3422 } },
  { id: 3, name: 'Victoria Island', state: 'Lagos', registered_users_count: 1205, center_location: { latitude: 6.4281, longitude: 3.4219 } },
  { id: 4, name: 'Lekki Phase 1', state: 'Lagos', registered_users_count: 812, center_location: { latitude: 6.4474, longitude: 3.4735 } },
];

export const MOCK_VENDORS = [
  {
    id: 'v1',
    business_name: "Mama Titi's Kitchen",
    bio: 'Authentic Nigerian food cooked with love. Specializing in Jollof, Amala, and Pepper Soup.',
    category: 'Food & Farming',
    sub_category: 'Nigerian Meal Prep',
    rating: 4.8,
    is_open: true,
    is_home_based: true,
    locality_id: 1,
    subscription_tier: 1,
    image: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=500&q=80',
    services: [
      { id: 's1_1', title: 'Special Party Jollof Rice (Full Tray)', description: 'Serves 15-20 people, standard Lagos style.', category: 'Food & Farming', price: 15000, stock: 5, stockStatus: 'LOW', image: 'https://images.unsplash.com/photo-1628286469449-623bb67b9d79?w=500&q=80' },
      { id: 's1_2', title: 'Gbegiri & Ewedu Soup with Assorted Meat', description: 'Freshly prepared upon order.', category: 'Food & Farming', price: 4000, stock: 24, stockStatus: '24 LEFT', image: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=500&q=80' }
    ],
    street_address: 'Alagomeji Street, Yaba, Lagos',
    exact_location: { latitude: 6.5050, longitude: 3.3750 }
  },
  {
    id: 'v2',
    business_name: 'FlowFix Plumbing',
    bio: 'Professional plumbing services. Leak detection, pipe installation, and emergency fixing.',
    category: 'Repair & Construction',
    sub_category: 'Plumbing Fixes',
    rating: 4.9,
    is_open: true,
    is_home_based: false,
    locality_id: 2,
    subscription_tier: 2, // Boosted
    image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=500&q=80',
    services: [
      { id: 's2_1', title: 'Emergency Pipe Leak Repair', description: 'Quick repair of ruptured PVC or copper piping.', category: 'Repair & Construction', price: 5000, stock: 1, stockStatus: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=500&q=80' },
      { id: 's2_2', title: 'Water Tank Cleaning & Sanitize', description: 'Complete flush and disinfection.', category: 'Repair & Construction', price: 12000, stock: 1, stockStatus: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=500&q=80' }
    ],
    street_address: 'Toyin Street, Ikeja, Lagos',
    exact_location: { latitude: 6.5985, longitude: 3.3512 }
  },
  {
    id: 'v3',
    business_name: 'The Master Tailor',
    bio: 'Bespoke native tailoring for men and women. Agbada, Senator wear, and bridal dresses.',
    category: 'Clothing & Accessories',
    sub_category: 'Bespoke Tailoring',
    rating: 4.7,
    is_open: true,
    is_home_based: true,
    locality_id: 3,
    subscription_tier: 2, // Boosted (Premium plan)
    image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500&q=80',
    services: [
      { id: 's3_1', title: 'Senator Attire Sewing (Material not included)', description: 'Slim fit sewing with high quality embroidery.', category: 'Clothing & Accessories', price: 8000, stock: 0, stockStatus: 'SOLD OUT', image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500&q=80' },
      { id: 's3_2', title: 'Agbada Premium Design Suite', description: 'Traditional three-piece stitching.', category: 'Clothing & Accessories', price: 25000, stock: 3, stockStatus: 'LOW', image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500&q=80' }
    ],
    street_address: 'Adetokunbo Ademola Street, Victoria Island, Lagos',
    exact_location: { latitude: 6.4310, longitude: 3.4240 }
  },
  {
    id: 'v4',
    business_name: 'Keziah Hair & Spa',
    bio: 'Elite braids, wigs install, and nail care in a comfortable space.',
    category: 'Personal Care',
    sub_category: 'Braiding & Nails',
    rating: 4.6,
    is_open: false,
    is_home_based: false,
    locality_id: 1,
    subscription_tier: 1,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80',
    services: [
      { id: 's4_1', title: 'Knotless Braids (Medium Length)', description: 'Neat braiding, includes washing.', category: 'Personal Care', price: 10000, stock: 5, stockStatus: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80' }
    ],
    street_address: 'Herbert Macaulay Way, Yaba, Lagos',
    exact_location: { latitude: 6.5120, longitude: 3.3770 }
  }
];

export const MOCK_CATEGORIES = [
  {
    name: 'Vehicles',
    icon: 'car-sport-outline',
    color: '#FFECEC',
    subcategories: ['Cars', 'Passenger Buses', 'Trucks & Trailers', 'Auto Parts & Accessories', 'Boats & Marine', 'Motorbikes & Scooters', 'Construction Machinery', 'Car Services']
  },
  {
    name: 'Properties',
    icon: 'home-outline',
    color: '#ECECFF',
    subcategories: ['All Properties', 'New Constructions', 'Short-Term Rentals / Short-Let', 'Land & Plots for Sale', 'Land & Plots for Rent', 'Houses & Flats for Sale', 'Houses & Flats for Rent']
  },
  {
    name: 'Phones & Tablets',
    icon: 'phone-portrait-outline',
    color: '#ECFFE8',
    subcategories: ['Mobile Phones', 'Tablets', 'Accessories & Cases', 'Replacement Parts', 'Smart Watches', 'Phone Repair Services']
  },
  {
    name: 'Gadgets & Devices',
    icon: 'laptop-outline',
    color: '#FFE8FF',
    subcategories: ['Laptops', 'Desktop Computers', 'Cameras & Camcorders', 'Video Games & Consoles', 'Audio & Music Equipment', 'TV & Projectors']
  },
  {
    name: 'Home & Furniture',
    icon: 'bed-outline',
    color: '#FFE8E8',
    subcategories: ['Furniture', 'Kitchen & Appliances', 'Bedding & Linens', 'Decorations & Rugs', 'Garden & Outdoor', 'Home Improvement Fixes']
  },
  {
    name: 'Personal Care',
    icon: 'color-palette-outline',
    color: '#FFE8F5',
    subcategories: ['Skincare Products', 'Hair Styling & Braiding', 'Make-up Services', 'Nail Salon & Manicure', 'Fragrances & Perfumes', 'Massage & Spa Treatments']
  },
  {
    name: 'Clothing & Accessories',
    icon: 'shirt-outline',
    color: '#F5E8FF',
    subcategories: ['Bespoke Tailoring', 'Ready-to-Wear Unisex', 'Bags & Purses', 'Shoes & Footwear', 'Jewelry & Watches', 'Wedding Dresses & Attire']
  },
  {
    name: 'Leisure, Arts & Outdoors',
    icon: 'basketball-outline',
    color: '#FFF8E8',
    subcategories: ['Gym Equipment', 'Sports Wear', 'Paintings & Handcrafts', 'Books & Stationery', 'Camping & Hiking Gear', 'Music Lessons']
  },
  {
    name: 'Professional Services',
    icon: 'briefcase-outline',
    color: '#E8FFF8',
    subcategories: ['Tax & Accounting', 'Legal Consulting', 'Graphic Design & Brand', 'Software Development', 'Photography & Video', 'Event Planning & Decoration']
  },
  {
    name: 'Food & Farming',
    icon: 'restaurant-outline',
    color: '#FFF3EC',
    subcategories: ['Nigerian Meal Prep', 'Catering Services', 'Farm Produce & Crops', 'Livestock & Poultry', 'Bakeries & Pastries', 'Bulk Food Supply']
  },
  {
    name: 'Commercial Equipment',
    icon: 'hammer-outline',
    color: '#ECEFF1',
    subcategories: ['Industrial Printing Press', 'Generators & Power Plants', 'Office Furniture & Setup', 'Medical Supplies', 'Salon & Spa Equipment']
  },
  {
    name: 'Repair & Construction',
    icon: 'construct-outline',
    color: '#EFEBE9',
    subcategories: ['Plumbing Fixes', 'Electrical Rewiring', 'AC Repair & Install', 'Bricklaying & Plastering', 'Carpentry & Woodwork', 'Painting & Finishing']
  }
];
