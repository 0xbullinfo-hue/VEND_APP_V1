-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Profiles & Roles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'vendor')),
    points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Localities (LGA/Ward tracking for Milestone check)
CREATE TABLE IF NOT EXISTS public.localities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT DEFAULT 'Lagos' NOT NULL,
    boundary GEOMETRY(Polygon, 4326), -- Polygon representation of the locality
    center_location GEOGRAPHY(Point, 4326) NOT NULL, -- Center of the locality for fuzzy mapping
    registered_users_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Customers Profile Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    locality_id INTEGER REFERENCES public.localities(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Vendors Profile Table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    business_name TEXT NOT NULL,
    bio TEXT,
    category VARCHAR(50) NOT NULL,
    is_open BOOLEAN DEFAULT true,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5.00),
    locality_id INTEGER REFERENCES public.localities(id) ON DELETE SET NULL,
    is_home_based BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    subscription_tier INTEGER DEFAULT 1 CHECK (subscription_tier IN (1, 2)), -- 1: Free (basic visibility, limited listings), 2: Pro Boosted (priority visibility, more listings, future features) - billed in NGN via Paystack only, no crypto
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Vendor Exact Spatial Locations (Secured Table - No Direct Client Access)
CREATE TABLE IF NOT EXISTS public.vendor_locations (
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE PRIMARY KEY,
    exact_location GEOGRAPHY(Point, 4326) NOT NULL, -- Exact GPS coordinate
    street_address TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Products / Services Listing Table (No Price field - Location map and details only)
CREATE TABLE IF NOT EXISTS public.products_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    images TEXT[] DEFAULT '{}', -- Array of image URLs
    is_available BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Direction Requests Audits
CREATE TABLE IF NOT EXISTS public.direction_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_active_request UNIQUE (customer_id, vendor_id, status)
);

-- 8. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Emergency Contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    relationship TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Help Center Tickets
CREATE TABLE IF NOT EXISTS public.help_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── SECURITY VIEWS & PROCEDURES FOR MASKING LOCATION ──

-- Public View for Vendors returning Fuzzy location for Home-Based vendors
CREATE OR REPLACE VIEW public.vendors_public_view AS
SELECT 
    v.id,
    v.business_name,
    v.bio,
    v.category,
    v.is_open,
    v.rating,
    v.locality_id,
    v.is_home_based,
    v.is_active,
    v.subscription_tier,
    l.name AS locality_name,
    -- If vendor is home-based and no confirmed request exists for the current user, show locality center. Otherwise, show exact location.
    CASE 
        WHEN v.is_home_based = true THEN
            CASE
                WHEN EXISTS (
                    SELECT 1 FROM public.direction_requests dr 
                    WHERE dr.vendor_id = v.id 
                    AND dr.customer_id = auth.uid() 
                    AND dr.status IN ('approved', 'completed')
                ) THEN vl.exact_location
                ELSE l.center_location
            END
        ELSE vl.exact_location
    END AS display_location,
    -- Same logic for string address
    CASE 
        WHEN v.is_home_based = true THEN
            CASE
                WHEN EXISTS (
                    SELECT 1 FROM public.direction_requests dr 
                    WHERE dr.vendor_id = v.id 
                    AND dr.customer_id = auth.uid() 
                    AND dr.status IN ('approved', 'completed')
                ) THEN vl.street_address
                ELSE 'Approximate Area: ' || l.name
            END
        ELSE vl.street_address
    END AS display_address
FROM public.vendors v
LEFT JOIN public.vendor_locations vl ON v.id = vl.vendor_id
LEFT JOIN public.localities l ON v.locality_id = l.id
WHERE v.is_active = true;

-- ── TRIGGER FUNCTIONS ──

-- Update registered users counter in Localities table
CREATE OR REPLACE FUNCTION public.increment_locality_users()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.locality_id IS NOT NULL) THEN
        UPDATE public.localities
        SET registered_users_count = registered_users_count + 1
        WHERE id = NEW.locality_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_customer_locality_signup
AFTER INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.increment_locality_users();

CREATE OR REPLACE TRIGGER tr_vendor_locality_signup
AFTER INSERT ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.increment_locality_users();

-- Gating Premium Subscription Activation Trigger
CREATE OR REPLACE FUNCTION public.check_subscription_milestone_activation()
RETURNS TRIGGER AS $$
DECLARE
    users_count INTEGER;
    v_locality_id INTEGER;
BEGIN
    -- Only restrict paid tiers (Tier 2 and above). Tier 1 (Free) is always allowed.
    IF NEW.subscription_tier > 1 THEN
        SELECT locality_id INTO v_locality_id FROM public.vendors WHERE id = NEW.id;
        
        IF v_locality_id IS NOT NULL THEN
            SELECT registered_users_count INTO users_count FROM public.localities WHERE id = v_locality_id;
            
            -- Gate paid tiers until locality count hits 1000 registered users
            IF users_count < 1000 THEN
                RAISE EXCEPTION 'Milestone Not Reached: Paid subscription tiers are locked until your locality has at least 1,000 registered users (Current count: %).', users_count;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid Profile: Vendor must select a locality before subscribing.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_vendor_subscription_upgrade
BEFORE UPDATE OF subscription_tier ON public.vendors
FOR EACH ROW WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier)
EXECUTE FUNCTION public.check_subscription_milestone_activation();

-- Per-Tier Listing Limit Enforcement (defense-in-depth alongside the app layer)
-- IMPORTANT: keep these limits in sync with SUBSCRIPTION_PLANS in
-- src/lib/subscriptionPlans.ts (currently: Tier 1 = 2 listings, Tier 2 = 10 listings).
CREATE OR REPLACE FUNCTION public.check_listing_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_tier INTEGER;
    v_max_listings INTEGER;
    v_current_count INTEGER;
BEGIN
    SELECT subscription_tier INTO v_tier FROM public.vendors WHERE id = NEW.vendor_id;

    v_max_listings := CASE v_tier
        WHEN 2 THEN 10
        ELSE 2 -- Tier 1 (Free) default
    END;

    SELECT COUNT(*) INTO v_current_count FROM public.products_services WHERE vendor_id = NEW.vendor_id;

    IF v_current_count >= v_max_listings THEN
        RAISE EXCEPTION 'Listing Limit Reached: Your current plan (Tier %) allows up to % active listings. Upgrade your subscription to add more.', v_tier, v_max_listings;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_products_services_listing_limit
BEFORE INSERT ON public.products_services
FOR EACH ROW EXECUTE FUNCTION public.check_listing_limit_before_insert();

-- Enable Row Level Security (RLS) on Base Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Base Policies
CREATE POLICY "Profiles readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can edit their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Customers viewable by logged-in users" ON public.customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Customers can edit their own sub-profile" ON public.customers FOR ALL USING (auth.uid() = id);

CREATE POLICY "Vendors viewable by everyone" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Vendors can edit their own sub-profile" ON public.vendors FOR ALL USING (auth.uid() = id);

-- Exact location table is restricted: Only own vendor can see/edit, or users who have approved direction request
CREATE POLICY "Vendor location visible to owner" ON public.vendor_locations FOR ALL USING (auth.uid() = vendor_id);
CREATE POLICY "Vendor location visible to customer with approved directions request" ON public.vendor_locations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.direction_requests dr 
        WHERE dr.vendor_id = vendor_id 
        AND dr.customer_id = auth.uid() 
        AND dr.status IN ('approved', 'completed')
    )
);

CREATE POLICY "Products viewable by everyone" ON public.products_services FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own products" ON public.products_services FOR ALL USING (auth.uid() = vendor_id);

CREATE POLICY "Customers and Vendors can see relevant direction requests" ON public.direction_requests FOR SELECT 
USING (auth.uid() = customer_id OR auth.uid() = vendor_id);
CREATE POLICY "Customers can create direction requests" ON public.direction_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Involved parties can update direction requests" ON public.direction_requests FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = vendor_id);
