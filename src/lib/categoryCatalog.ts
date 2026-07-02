export interface CategoryCatalogItem {
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
}

export const CATEGORY_CATALOG: CategoryCatalogItem[] = [
  {
    name: 'Food & Catering',
    icon: 'restaurant-outline',
    color: '#FEF3C7',
    subcategories: ['Home-Cooked Meals', 'Pastries & Bakes', 'Event Catering', 'Jollof & Grills', 'Snacks & Small Chops'],
  },
  {
    name: 'Home Services',
    icon: 'hammer-outline',
    color: '#DBEAFE',
    subcategories: ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'AC Servicing', 'Painting'],
  },
  {
    name: 'Beauty & Personal Care',
    icon: 'color-palette-outline',
    color: '#FCE7F3',
    subcategories: ['Hair Braiding', 'Makeup', 'Nails', 'Skincare', 'Barbing', 'Spa & Massage'],
  },
  {
    name: 'Technology & Repairs',
    icon: 'phone-portrait-outline',
    color: '#E0E7FF',
    subcategories: ['Phone & Laptop Repair', 'Software Support', 'CCTV Install', 'Network Setup'],
  },
  {
    name: 'Fashion & Tailoring',
    icon: 'shirt-outline',
    color: '#D1FAE5',
    subcategories: ['Native Wear', 'Office & Corporate', 'Kids Clothing', 'Alterations & Mending'],
  },
  {
    name: 'Logistics & Dispatch',
    icon: 'bicycle-outline',
    color: '#FEE2E2',
    subcategories: ['Same-Day Delivery', 'Errand Running', 'Document Courier', 'Moving & Packing'],
  },
  {
    name: 'Health & Wellness',
    icon: 'medkit-outline',
    color: '#ECFDF5',
    subcategories: ['Home Nursing', 'Physiotherapy', 'Nutrition & Diet', 'Mental Health Support'],
  },
  {
    name: 'Professional Services',
    icon: 'briefcase-outline',
    color: '#EDE9FE',
    subcategories: ['Legal & Notary', 'Accounting & Tax', 'Business Consulting', 'Photography'],
  },
];

const CATEGORY_ICON_FALLBACK = 'grid-outline';

export const getCategoryMeta = (categoryName: string) => {
  const found = CATEGORY_CATALOG.find((item) => item.name === categoryName);
  return {
    icon: found?.icon || CATEGORY_ICON_FALLBACK,
    color: found?.color || '#EEF2FF',
  };
};
