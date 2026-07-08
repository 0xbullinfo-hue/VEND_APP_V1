import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_VENDORS } from './mockData';
import { VendorProfile } from '../types';
import { rankVendorsForCustomer } from './vendorRanking';

interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

interface VendorPublicRow {
  id: string;
  business_name: string;
  bio: string;
  category: string;
  is_open: boolean;
  rating: number;
  locality_id: number;
  is_home_based: boolean;
  subscription_tier: number;
  display_address?: string;
  display_location?: GeoPoint;
}

interface ProductServiceRow {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
}

const toMockVendors = (localityId?: number): VendorProfile[] => {
  const rows = localityId ? MOCK_VENDORS.filter((v) => v.locality_id === localityId) : MOCK_VENDORS;
  return rankVendorsForCustomer(rows.map((v) => ({ ...v, realtime_source: 'mock' as const })));
};

const pointToLatLng = (point?: GeoPoint) => {
  if (!point || !Array.isArray(point.coordinates) || point.coordinates.length < 2) {
    return null;
  }
  const [lng, lat] = point.coordinates;
  return { latitude: lat, longitude: lng };
};

const mapRowsToVendorProfiles = (
  vendorRows: VendorPublicRow[],
  serviceRows: ProductServiceRow[]
): VendorProfile[] => {
  const servicesByVendor = serviceRows.reduce<Record<string, ProductServiceRow[]>>((acc, item) => {
    const bucket = acc[item.vendor_id] || [];
    bucket.push(item);
    acc[item.vendor_id] = bucket;
    return acc;
  }, {});

  return vendorRows.map((row) => {
    const location = pointToLatLng(row.display_location);
    const serviceItems = (servicesByVendor[row.id] || []).map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description || '',
      category: row.category,
      price: 0,
      stock: 99,
      stockStatus: 'in_stock',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
    }));

    return {
      id: row.id,
      business_name: row.business_name,
      bio: row.bio || 'No description provided yet.',
      category: row.category,
      sub_category: serviceItems[0]?.category || 'General Services',
      rating: Number(row.rating || 0),
      is_open: !!row.is_open,
      is_home_based: !!row.is_home_based,
      locality_id: row.locality_id || 1,
      subscription_tier: row.subscription_tier || 1,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
      street_address: row.display_address || 'Address not available',
      exact_location: location || { latitude: 6.5165, longitude: 3.3792 },
      services: serviceItems,
      realtime_source: 'supabase',
      last_seen_at: new Date().toISOString(),
    };
  });
};

export const fetchVendorsByLocality = async (localityId?: number): Promise<VendorProfile[]> => {
  if (!isSupabaseConfigured()) {
    return toMockVendors(localityId);
  }

  // 1. Auth check
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (__DEV__) {
        console.warn('[vendorDataProvider] No active session found. Returning mock vendors.');
      }
      return toMockVendors(localityId);
    }
  } catch (authErr) {
    if (__DEV__) {
      console.warn('[vendorDataProvider] Auth session check failed:', authErr);
    }
    return toMockVendors(localityId);
  }

  // Timeout helper
  const withTimeout = <T>(promise: Promise<T>, ms = 15000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Query timeout')), ms))
    ]);
  };

  try {
    let vendorQuery = supabase.from('vendors_public_view').select(
      'id,business_name,bio,category,is_open,rating,locality_id,is_home_based,subscription_tier,display_address,display_location'
    );

    if (localityId) {
      vendorQuery = vendorQuery.eq('locality_id', localityId);
    }

    vendorQuery = vendorQuery
      .order('subscription_tier', { ascending: false })
      .order('is_open', { ascending: false })
      .order('rating', { ascending: false })
      .order('business_name', { ascending: true })
      .range(0, 50); // Limit to 50 for initial premium performance. Scale later with pagination.

    // 2. Query execution with timeout
    const { data: vendorRows, error: vendorError, status: vendorStatus } = await withTimeout(Promise.resolve(vendorQuery));

    if (vendorError) {
      // 3. Handle auth expired errors (401/403)
      if (vendorStatus === 401 || vendorStatus === 403) {
        console.error('[vendorDataProvider] Session expired or unauthorized (401/403).');
        // Let it fallback to mock or bubble up. For now, fallback to mock.
      }
      return toMockVendors(localityId);
    }

    if (!vendorRows || vendorRows.length === 0) {
      return [];
    }

    const vendorIds = vendorRows.map((v: VendorPublicRow) => v.id);
    const serviceQuery = supabase
      .from('products_services')
      .select('id,vendor_id,title,description')
      .in('vendor_id', vendorIds);

    const { data: serviceRows, error: serviceError } = await withTimeout(Promise.resolve(serviceQuery));

    if (serviceError) {
      return mapRowsToVendorProfiles(vendorRows as VendorPublicRow[], []);
    }

    return rankVendorsForCustomer(mapRowsToVendorProfiles(
      vendorRows as VendorPublicRow[],
      (serviceRows || []) as ProductServiceRow[]
    ));
  } catch (err) {
    if (__DEV__) {
      console.warn('[vendorDataProvider] Fetch failed or timed out:', err);
    }
    return toMockVendors(localityId);
  }
};

export const subscribeToVendorRealtime = (
  localityId: number | undefined,
  onRefresh: () => Promise<void>
) => {
  if (!localityId || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`vendors-locality-${localityId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vendors',
        filter: `locality_id=eq.${localityId}`,
      },
      async () => {
        await onRefresh();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vendor_locations',
      },
      async () => {
        await onRefresh();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
