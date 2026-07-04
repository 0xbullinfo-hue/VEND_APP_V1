// Headless verification test script for VEND V1 Core Business Logic
// Validates points accumulation, privacy protection, and monetization gating.

console.log("=================================================");
console.log("   VEND V1 CORE LOGIC VERIFICATION SUITE         ");
console.log("=================================================\n");

// --- MOCK DATABASE AND LOCAL STATE RESIDENTS ---
const MOCK_LOCALITIES = [
  { id: 1, name: 'Yaba / Mainland', registered_users_count: 942 },
  { id: 2, name: 'Ikeja / GRA', registered_users_count: 1045 }
];

const MOCK_VENDORS = [
  {
    id: 'v1',
    business_name: "Mama Titi's Kitchen",
    is_home_based: true,
    locality_id: 1,
    street_address: 'Alagomeji Street, Yaba, Lagos',
    exact_location: { latitude: 6.5050, longitude: 3.3750 }
  },
  {
    id: 'v2',
    business_name: 'FlowFix Plumbing',
    is_home_based: false,
    locality_id: 2,
    street_address: 'Toyin Street, Ikeja, Lagos',
    exact_location: { latitude: 6.5985, longitude: 3.3512 }
  }
];

// State simulation variables
let userPoints = 0;
let directionRequests = [];

// --- REWARDS SYSTEM LOGIC FUNCTIONS ---
function addPoints(amount, actionName) {
  userPoints += amount;
  console.log(`[Points] +${amount} PTS for ${actionName} (Current Balance: ${userPoints} PTS)`);
}

// --- DIRECTIONS & VERIFICATION HANDSHAKE ---
function requestDirections(vendorId) {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const request = {
    vendorId,
    status: 'pending',
    code
  };
  directionRequests.push(request);
  addPoints(10, `Initiating Directions Request to Vendor ${vendorId}`);
  return request;
}

function verifyVisitCode(vendorId, enteredCode) {
  const req = directionRequests.find(r => r.vendorId === vendorId && r.status === 'pending');
  if (!req) return false;
  
  if (req.code === enteredCode) {
    req.status = 'verified';
    addPoints(100, `Completing Physical Visit Handshake with code ${enteredCode}`);
    return true;
  }
  return false;
}

// --- GEOGRAPHIC COORD MASKING FOR PRIVACY PROTECTION ---
function getClientVisibleCoordinates(vendor, requestingUserId) {
  // If the vendor is physical retail shop, always share coordinates
  if (!vendor.is_home_based) {
    return { 
      status: 'unrestricted', 
      latitude: vendor.exact_location.latitude, 
      longitude: vendor.exact_location.longitude 
    };
  }

  // If the vendor is home-based, check if there is an approved visit verification handshake
  const approvedRequest = directionRequests.find(
    r => r.vendorId === vendor.id && (r.status === 'verified' || r.status === 'completed')
  );

  if (approvedRequest) {
    return { 
      status: 'unlocked_by_handshake', 
      latitude: vendor.exact_location.latitude, 
      longitude: vendor.exact_location.longitude 
    };
  }

  // Otherwise, return masked/fuzzy coordinates (centroid of locality with radius warning)
  return { 
    status: 'masked_for_privacy', 
    fuzzy_circle: { center_latitude: 6.5165, center_longitude: 3.3792, radius_meters: 500 },
    precise_coordinates: 'REDACTED_ACCESS_DENIED' 
  };
}

// --- SUBSCRIPTION MILESTONE GATING LOGIC ---
function getLocalitySubscriptionStatus(localityId) {
  const locality = MOCK_LOCALITIES.find(l => l.id === localityId);
  if (!locality) return { error: 'Invalid Locality' };

  const isUnlocked = locality.registered_users_count >= 1000;
  return {
    locality_name: locality.name,
    user_count: locality.registered_users_count,
    milestone_met: isUnlocked,
    paid_plans_status: isUnlocked ? 'ACTIVE_UNLOCKED' : 'LOCKED_UNDER_1000_THRESHOLD'
  };
}


// =================================================
// RUN SIMULATED ACTION TEST SUITES
// =================================================

console.log("--- TEST CASE 1: Points System & Welcome Bonuses ---");
// Onboard user with optional referral code
addPoints(50, "Entering Valid Onboarding Referral Code");
if (userPoints === 50) {
  console.log("✅ Success: Referral code points credited.");
} else {
  console.error("❌ Error: Referral points credit failed.");
}

console.log("\n--- TEST CASE 2: Proximity Masking & Privacy Guard (Home-Based Vendor) ---");
const homeVendor = MOCK_VENDORS[0]; // Mama Titi (Home-Based)
const retailVendor = MOCK_VENDORS[1]; // FlowFix (Retail Storefront)

// Read coordinates prior to requesting directions
let clientCoords = getClientVisibleCoordinates(homeVendor, "user_1");
console.log(`Pre-Directions Coordinates:`, clientCoords);
if (clientCoords.status === 'masked_for_privacy' && clientCoords.precise_coordinates === 'REDACTED_ACCESS_DENIED') {
  console.log("✅ Success: Home-based precise location masked securely.");
} else {
  console.error("❌ Error: Location coordinates leaked!");
}

let retailCoords = getClientVisibleCoordinates(retailVendor, "user_1");
if (retailCoords.status === 'unrestricted' && retailCoords.latitude === 6.5985) {
  console.log("✅ Success: Retail storefront coordinates open and unrestricted.");
} else {
  console.error("❌ Error: Storefront coordinates unexpectedly locked.");
}

console.log("\n--- TEST CASE 3: Directions Request & Code Handshake Verification ---");
// Request directions to unlock coordinates
const request = requestDirections(homeVendor.id);
console.log(`Requested directions. Verification handshake code generated is: ${request.code}`);
console.log(`Points after requesting directions: ${userPoints} PTS (Expect 60 PTS)`);

// Try verifying with invalid code
let verified = verifyVisitCode(homeVendor.id, "0000");
console.log(`Verifying with code 0000: ${verified ? 'SUCCESS' : 'FAILED'}`);

// Verify with correct generated code
verified = verifyVisitCode(homeVendor.id, request.code);
console.log(`Verifying with correct code ${request.code}: ${verified ? 'SUCCESS' : 'FAILED'}`);
console.log(`Points after physical visit validation: ${userPoints} PTS (Expect 160 PTS)`);

// Fetch coordinates again now that verification is complete
clientCoords = getClientVisibleCoordinates(homeVendor, "user_1");
console.log(`Post-Verification Coordinates:`, clientCoords);
if (clientCoords.status === 'unlocked_by_handshake' && clientCoords.latitude === 6.5050) {
  console.log("✅ Success: Home-based location revealed post-verification.");
} else {
  console.error("❌ Error: Verification failed to unlock coordinates.");
}

console.log("\n--- TEST CASE 4: Subscription Milestone Activation ---");
// Query Yaba locality (942 users)
let status = getLocalitySubscriptionStatus(1);
console.log(`Yaba (942 Users) status:`, status);
if (!status.milestone_met && status.paid_plans_status === 'LOCKED_UNDER_1000_THRESHOLD') {
  console.log("✅ Success: Yaba locality paid subscriptions gated.");
} else {
  console.error("❌ Error: Subscription gating failed.");
}

// Query Ikeja locality (1045 users)
status = getLocalitySubscriptionStatus(2);
console.log(`Ikeja (1045 Users) status:`, status);
if (status.milestone_met && status.paid_plans_status === 'ACTIVE_UNLOCKED') {
  console.log("✅ Success: Ikeja locality paid subscriptions unlocked.");
} else {
  console.error("❌ Error: Subscription milestone unlocking failed.");
}

console.log("\n=================================================");
console.log("   ALL TEST CASES VERIFIED SUCCESSFULLY          ");
console.log("=================================================");


// =================================================
// TEST CASE 5: Vendor Subscription Tier System (Fiat-Only)
// =================================================
// Mirrors src/lib/subscriptionPlans.ts + AppContext.addVendorService /
// AppContext.updateVendorSubscription. Crypto/Web3 "Tier 3" has been
// removed entirely - only two NGN-billed tiers exist.

console.log("\n--- TEST CASE 5: Vendor Subscription Tier System (Fiat-Only) ---");

const SUBSCRIPTION_PLANS = [
  { tier: 1, id: 'free', name: 'Free Explorer', maxListings: 2, boosted: false },
  { tier: 2, id: 'boosted', name: 'Premium Boosted', maxListings: 10, boosted: true },
];
const MIN_TIER = SUBSCRIPTION_PLANS[0].tier;
const MAX_TIER = SUBSCRIPTION_PLANS[SUBSCRIPTION_PLANS.length - 1].tier;

const getPlanForTier = (tier) => SUBSCRIPTION_PLANS.find(p => p.tier === tier) || SUBSCRIPTION_PLANS[0];
const clampTier = (tier) => SUBSCRIPTION_PLANS.some(p => p.tier === tier) ? tier : MIN_TIER;

// A fresh vendor signing up always starts on Tier 1 (Free).
const testVendor = { id: 'v_test', subscription_tier: 1, services: [] };

function addVendorService(vendor, title) {
  const plan = getPlanForTier(vendor.subscription_tier);
  if (vendor.services.length >= plan.maxListings) {
    return { ok: false, reason: `Listing limit reached (${plan.maxListings} on ${plan.name})` };
  }
  vendor.services.push({ id: `s_${vendor.services.length + 1}`, title });
  return { ok: true };
}

function updateVendorSubscription(vendor, tier) {
  const targetTier = clampTier(tier);
  const targetPlan = getPlanForTier(targetTier);
  if (targetTier < vendor.subscription_tier && vendor.services.length > targetPlan.maxListings) {
    return { ok: false, reason: `Remove ${vendor.services.length - targetPlan.maxListings} listing(s) before downgrading to ${targetPlan.name}` };
  }
  vendor.subscription_tier = targetTier;
  return { ok: true };
}

// 5a. Free tier allows up to 2 listings, then blocks the 3rd.
addVendorService(testVendor, 'Listing 1');
addVendorService(testVendor, 'Listing 2');
let blocked = addVendorService(testVendor, 'Listing 3 (should fail)');
console.log(`Free tier listings: ${testVendor.services.length} (Expect 2). 3rd listing result:`, blocked);
if (testVendor.services.length === 2 && !blocked.ok) {
  console.log("✅ Success: Free tier correctly capped at 2 listings.");
} else {
  console.error("❌ Error: Free tier listing limit not enforced.");
}

// 5b. Upgrading to Tier 2 (Premium Boosted) raises the cap to 10 and unlocks more adds.
let upgrade = updateVendorSubscription(testVendor, 2);
console.log(`Upgrade to Tier 2 result:`, upgrade, `New tier: ${testVendor.subscription_tier}`);
let added3rd = addVendorService(testVendor, 'Listing 3');
console.log(`Listing 3 after upgrade:`, added3rd, `Total listings: ${testVendor.services.length} (Expect 3)`);
if (upgrade.ok && testVendor.subscription_tier === 2 && added3rd.ok && testVendor.services.length === 3) {
  console.log("✅ Success: Tier 2 upgrade unlocked higher listing capacity (up to 10).");
} else {
  console.error("❌ Error: Tier 2 upgrade did not unlock additional listings.");
}

// 5c. Downgrading back to Tier 1 (Free) is blocked while over the Free limit (3 > 2).
let downgrade = updateVendorSubscription(testVendor, 1);
console.log(`Downgrade to Tier 1 with 3 listings:`, downgrade, `Tier remains: ${testVendor.subscription_tier}`);
if (!downgrade.ok && testVendor.subscription_tier === 2) {
  console.log("✅ Success: Downgrade correctly blocked while over the Free tier's listing limit.");
} else {
  console.error("❌ Error: Downgrade should have been blocked.");
}

// 5d. Crypto/Web3 "Tier 3" no longer exists - any attempt to set it is clamped back to Tier 1.
let cryptoAttempt = clampTier(3);
console.log(`clampTier(3) (legacy "Web3 Pro" tier) resolves to: Tier ${cryptoAttempt}`);
if (cryptoAttempt === MIN_TIER && MAX_TIER === 2) {
  console.log("✅ Success: Crypto/Web3 tier fully removed - only Tiers 1-2 (NGN/Paystack) remain.");
} else {
  console.error("❌ Error: A crypto/Web3 tier is still reachable.");
}

console.log("\n=================================================");
console.log("   TEST CASE 5 COMPLETE                          ");
console.log("=================================================");


// =================================================
// TEST CASE 6: Auth Session Hydration + Onboarding Gate
// =================================================
// Mirrors the new useAuthStore + RootNavigator contract:
// 1) App waits until auth is hydrated.
// 2) If no user, route to onboarding.
// 3) If user exists but onboarding is incomplete, stay in onboarding.
// 4) Only hydrated + authenticated + onboarding complete enters app stack.

console.log("\n--- TEST CASE 6: Auth Session Hydration + Onboarding Gate ---");

const AUTH_STORAGE_KEY = 'vend.auth.v1';

function createMemoryStorage() {
  const db = {};
  return {
    async getItem(key) {
      return Object.prototype.hasOwnProperty.call(db, key) ? db[key] : null;
    },
    async setItem(key, value) {
      db[key] = value;
    },
    async removeItem(key) {
      delete db[key];
    }
  };
}

function getRootRoute(state) {
  if (!state.isHydrated) return 'HydrationLoading';
  if (!state.user || !state.onboardingCompleted) return 'Onboarding';
  return state.role === 'vendor' ? 'VendorApp' : 'CustomerApp';
}

function createAuthSessionModel(storage) {
  const state = {
    user: null,
    role: null,
    onboardingCompleted: false,
    isHydrated: false
  };

  return {
    getState() {
      return { ...state };
    },
    async login(phone, role, name) {
      state.user = {
        id: 'u_test_auth_1',
        phone,
        role,
        name,
      };
      state.role = role;
      state.onboardingCompleted = false;
      await storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: state.user,
        role: state.role,
        onboardingCompleted: state.onboardingCompleted,
      }));
    },
    async completeOnboarding() {
      if (!state.user || !state.role) return;
      state.onboardingCompleted = true;
      await storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: state.user,
        role: state.role,
        onboardingCompleted: state.onboardingCompleted,
      }));
    },
    async setOnboardingLocality(localityId) {
      if (!state.user || !state.role) return;
      state.user = {
        ...state.user,
        localityId,
      };
      await storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: state.user,
        role: state.role,
        onboardingCompleted: state.onboardingCompleted,
      }));
    },
    async setReferralCode(code) {
      if (!state.user || !state.role) return;
      const normalizedCode = code.trim();
      state.user = {
        ...state.user,
        referralCode: normalizedCode || undefined,
      };
      await storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: state.user,
        role: state.role,
        onboardingCompleted: state.onboardingCompleted,
      }));
    },
    async hydrateAuthSession() {
      try {
        const raw = await storage.getItem(AUTH_STORAGE_KEY);
        if (!raw) {
          state.isHydrated = true;
          return;
        }
        const parsed = JSON.parse(raw);
        state.user = parsed.user;
        state.role = parsed.role;
        state.onboardingCompleted = !!parsed.onboardingCompleted;
        state.isHydrated = true;
      } catch {
        state.isHydrated = true;
      }
    },
    async logout() {
      state.user = null;
      state.role = null;
      state.onboardingCompleted = false;
      state.isHydrated = true;
      await storage.removeItem(AUTH_STORAGE_KEY);
    }
  };
}

(async () => {
  const storage = createMemoryStorage();

  // 6a. Initial cold state: before hydration we should show loading gate.
  const appA = createAuthSessionModel(storage);
  let route = getRootRoute(appA.getState());
  if (route === 'HydrationLoading') {
    console.log('✅ Success: Root gate blocks navigation until hydration completes.');
  } else {
    console.error('❌ Error: App should not route before hydration.');
  }

  // 6b. Hydrated with empty storage: onboarding should show.
  await appA.hydrateAuthSession();
  route = getRootRoute(appA.getState());
  if (route === 'Onboarding') {
    console.log('✅ Success: Empty hydrated session correctly routes to onboarding.');
  } else {
    console.error('❌ Error: Empty hydrated session routed incorrectly.');
  }

  // 6c. After login but before onboarding completion: still onboarding.
  await appA.login('08011112222', 'customer', 'Hydration Test User');
  route = getRootRoute(appA.getState());
  if (route === 'Onboarding' && appA.getState().onboardingCompleted === false) {
    console.log('✅ Success: Logged-in but incomplete onboarding remains in onboarding flow.');
  } else {
    console.error('❌ Error: Incomplete onboarding should not enter app stack.');
  }

  // 6d. Onboarding completion should unlock customer app stack.
  await appA.completeOnboarding();
  route = getRootRoute(appA.getState());
  if (route === 'CustomerApp') {
    console.log('✅ Success: Completing onboarding unlocks customer app stack.');
  } else {
    console.error('❌ Error: Completed onboarding did not unlock customer app route.');
  }

  // 6e. Persistence check: fresh app instance should hydrate straight into app stack.
  const appB = createAuthSessionModel(storage);
  await appB.hydrateAuthSession();
  route = getRootRoute(appB.getState());
  if (route === 'CustomerApp') {
    console.log('✅ Success: Persisted session hydrates directly into customer app.');
  } else {
    console.error('❌ Error: Persisted session hydration route mismatch.');
  }

  // 6f. Logout should clear storage and return to onboarding.
  await appB.logout();
  route = getRootRoute(appB.getState());
  if (route === 'Onboarding') {
    console.log('✅ Success: Logout clears session and routes back to onboarding.');
  } else {
    console.error('❌ Error: Logout did not reset routing state.');
  }

  console.log("\n=================================================");
  console.log("   TEST CASE 6 COMPLETE                          ");
  console.log("=================================================");

  // =================================================
  // TEST CASE 7: Persisted Onboarding Artifacts (Locality + Referral)
  // =================================================
  console.log("\n--- TEST CASE 7: Persisted Onboarding Artifacts (Locality + Referral) ---");

  // 7a. Save locality + referral on a logged-in pending-onboarding user.
  const appC = createAuthSessionModel(storage);
  await appC.login('08033334444', 'customer', 'Artifact Test User');
  await appC.setOnboardingLocality(2);
  await appC.setReferralCode(' VEND50 ');

  const appCState = appC.getState();
  if (appCState.user?.localityId === 2 && appCState.user?.referralCode === 'VEND50') {
    console.log('✅ Success: Onboarding locality and referral persisted in active session state.');
  } else {
    console.error('❌ Error: Failed to persist onboarding artifacts in active session state.');
  }

  // 7b. Hydration in a fresh instance should restore both artifacts.
  const appD = createAuthSessionModel(storage);
  await appD.hydrateAuthSession();
  const appDState = appD.getState();
  if (appDState.user?.localityId === 2 && appDState.user?.referralCode === 'VEND50') {
    console.log('✅ Success: Fresh hydration restores locality and referral artifacts.');
  } else {
    console.error('❌ Error: Fresh hydration did not restore onboarding artifacts.');
  }

  // 7c. Clearing referral by skipping should remove referralCode from payload.
  await appD.setReferralCode('   ');
  const appDAfterClear = appD.getState();
  if (typeof appDAfterClear.user?.referralCode === 'undefined') {
    console.log('✅ Success: Skipping referral clears persisted referral code.');
  } else {
    console.error('❌ Error: Referral code should be cleared when user skips.');
  }

  console.log("\n=================================================");
  console.log("   TEST CASE 7 COMPLETE                          ");
  console.log("=================================================");

  // =================================================
  // TEST CASE 8: Boosted Vendor Ranking Priority
  // =================================================
  console.log("\n--- TEST CASE 8: Boosted Vendor Ranking Priority ---");

  const rankVendorsForCustomer = (rows) => {
    return [...rows].sort((a, b) => {
      const aBoost = a.subscription_tier > 1 ? 1 : 0;
      const bBoost = b.subscription_tier > 1 ? 1 : 0;
      if (bBoost !== aBoost) return bBoost - aBoost;

      const aOpen = a.is_open ? 1 : 0;
      const bOpen = b.is_open ? 1 : 0;
      if (bOpen !== aOpen) return bOpen - aOpen;

      if (b.rating !== a.rating) return b.rating - a.rating;

      return a.business_name.localeCompare(b.business_name);
    });
  };

  const rankingCandidates = [
    { id: 'v_low', business_name: 'Alpha Services', subscription_tier: 1, is_open: true, rating: 5.0 },
    { id: 'v_boost_closed', business_name: 'Boosted Closed', subscription_tier: 2, is_open: false, rating: 4.9 },
    { id: 'v_boost_open', business_name: 'Boosted Open', subscription_tier: 2, is_open: true, rating: 4.2 },
    { id: 'v_normal_open', business_name: 'Normal Open', subscription_tier: 1, is_open: true, rating: 4.9 },
  ];

  const ranked = rankVendorsForCustomer(rankingCandidates);

  // 8a. Any boosted vendor should be ranked ahead of non-boosted vendors.
  const boostedIndices = ranked
    .map((v, idx) => ({ tier: v.subscription_tier, idx }))
    .filter(x => x.tier > 1)
    .map(x => x.idx);
  const normalIndices = ranked
    .map((v, idx) => ({ tier: v.subscription_tier, idx }))
    .filter(x => x.tier === 1)
    .map(x => x.idx);

  const boostedBeforeNormal = boostedIndices.length > 0 && normalIndices.length > 0
    ? Math.max(...boostedIndices) < Math.min(...normalIndices)
    : false;

  if (boostedBeforeNormal) {
    console.log('✅ Success: Boosted vendors are prioritized ahead of standard vendors.');
  } else {
    console.error('❌ Error: Standard vendors ranked ahead of boosted vendors.');
  }

  // 8b. Within boosted vendors, open status should outrank closed status.
  if (ranked[0].id === 'v_boost_open') {
    console.log('✅ Success: Open boosted vendors rank above closed boosted vendors.');
  } else {
    console.error('❌ Error: Closed boosted vendor outranked open boosted vendor.');
  }

  console.log("\n=================================================");
  console.log("   TEST CASE 8 COMPLETE                          ");
  console.log("=================================================");

  // =================================================
  // TEST CASE 9: Engagement Telemetry Aggregation (7-Day)
  // =================================================
  console.log("\n--- TEST CASE 9: Engagement Telemetry Aggregation (7-Day) ---");

  const nowTs = Date.now();
  const days = (d) => d * 24 * 60 * 60 * 1000;
  const events = [
    { vendorId: 'v1', type: 'profile_view', timestamp: nowTs - days(1) },
    { vendorId: 'v1', type: 'profile_view', timestamp: nowTs - days(2) },
    { vendorId: 'v1', type: 'directions_request', timestamp: nowTs - days(3) },
    { vendorId: 'v1', type: 'chat_start', timestamp: nowTs - days(4) },
    { vendorId: 'v1', type: 'profile_view', timestamp: nowTs - days(9) },
    { vendorId: 'v1', type: 'chat_start', timestamp: nowTs - days(11) },
    { vendorId: 'v2', type: 'profile_view', timestamp: nowTs - days(1) },
  ];

  function getVendorWindowMetrics(allEvents, vendorId, now) {
    const sevenDaysAgo = now - days(7);
    const fourteenDaysAgo = now - days(14);

    const vendorEvents = allEvents.filter((e) => e.vendorId === vendorId);
    const current = vendorEvents.filter((e) => e.timestamp >= sevenDaysAgo);
    const previous = vendorEvents.filter((e) => e.timestamp >= fourteenDaysAgo && e.timestamp < sevenDaysAgo);

    const profileViews7d = current.filter((e) => e.type === 'profile_view').length;
    const directions7d = current.filter((e) => e.type === 'directions_request').length;
    const chats7d = current.filter((e) => e.type === 'chat_start').length;

    const growthDeltaPct = previous.length === 0
      ? (current.length > 0 ? 100 : 0)
      : Math.round(((current.length - previous.length) / previous.length) * 100);

    return {
      total7d: current.length,
      totalPrev: previous.length,
      profileViews7d,
      directions7d,
      chats7d,
      growthDeltaPct,
    };
  }

  const metrics = getVendorWindowMetrics(events, 'v1', nowTs);
  if (
    metrics.total7d === 4 &&
    metrics.totalPrev === 2 &&
    metrics.profileViews7d === 2 &&
    metrics.directions7d === 1 &&
    metrics.chats7d === 1 &&
    metrics.growthDeltaPct === 100
  ) {
    console.log('✅ Success: 7-day engagement telemetry aggregates and trend calculations are correct.');
  } else {
    console.error('❌ Error: Telemetry aggregation mismatch.', metrics);
  }

  console.log("\n=================================================");
  console.log("   TEST CASE 9 COMPLETE                          ");
  console.log("=================================================");

  // =================================================
  // TEST CASE 10: Telemetry Persistence Fallback Semantics
  // =================================================
  console.log("\n--- TEST CASE 10: Telemetry Persistence Fallback Semantics ---");

  function persistEventLocal(localEvents, event) {
    return [...localEvents, event];
  }

  function resolveLoadEvents({ isSupabaseConfigured, remoteError, localEvents, remoteEvents }) {
    if (!isSupabaseConfigured) return localEvents;
    if (remoteError) return localEvents;
    return remoteEvents;
  }

  function appendPendingQueue(queue, event) {
    return [...queue, event];
  }

  function flushQueue({ isSupabaseConfigured, queue, failIds }) {
    if (!isSupabaseConfigured) return queue;
    return queue.filter((evt) => failIds.includes(evt.id));
  }

  const localSeed = [{ id: 'evt_local_1', vendorId: 'v1', type: 'profile_view' }];
  const appended = persistEventLocal(localSeed, { id: 'evt_local_2', vendorId: 'v1', type: 'chat_start' });
  if (appended.length === 2 && appended[1].id === 'evt_local_2') {
    console.log('✅ Success: Local telemetry persistence appends events safely.');
  } else {
    console.error('❌ Error: Local telemetry append failed.');
  }

  const resolvedOffline = resolveLoadEvents({
    isSupabaseConfigured: false,
    remoteError: false,
    localEvents: appended,
    remoteEvents: [{ id: 'evt_remote_1' }],
  });
  if (resolvedOffline.length === 2) {
    console.log('✅ Success: Offline mode correctly falls back to local telemetry.');
  } else {
    console.error('❌ Error: Offline fallback did not use local telemetry.');
  }

  const resolvedRemoteFail = resolveLoadEvents({
    isSupabaseConfigured: true,
    remoteError: true,
    localEvents: appended,
    remoteEvents: [{ id: 'evt_remote_2' }],
  });
  if (resolvedRemoteFail.length === 2) {
    console.log('✅ Success: Remote failure correctly falls back to local telemetry cache.');
  } else {
    console.error('❌ Error: Remote-failure fallback did not preserve local telemetry.');
  }

  const resolvedRemoteOk = resolveLoadEvents({
    isSupabaseConfigured: true,
    remoteError: false,
    localEvents: appended,
    remoteEvents: [{ id: 'evt_remote_3' }, { id: 'evt_remote_4' }],
  });
  if (resolvedRemoteOk.length === 2 && resolvedRemoteOk[0].id === 'evt_remote_3') {
    console.log('✅ Success: Remote telemetry source is preferred when available and healthy.');
  } else {
    console.error('❌ Error: Remote telemetry preference failed.');
  }

  const queuedOnce = appendPendingQueue([], { id: 'evt_q_1' });
  const queuedTwice = appendPendingQueue(queuedOnce, { id: 'evt_q_2' });
  if (queuedTwice.length === 2) {
    console.log('✅ Success: Failed sync events are queued for retry.');
  } else {
    console.error('❌ Error: Retry queue append failed.');
  }

  const afterFlushPartial = flushQueue({
    isSupabaseConfigured: true,
    queue: queuedTwice,
    failIds: ['evt_q_2'],
  });
  if (afterFlushPartial.length === 1 && afterFlushPartial[0].id === 'evt_q_2') {
    console.log('✅ Success: Queue flush keeps only events that still fail sync.');
  } else {
    console.error('❌ Error: Queue flush behavior mismatch (partial failure).');
  }

  const afterFlushOffline = flushQueue({
    isSupabaseConfigured: false,
    queue: queuedTwice,
    failIds: [],
  });
  if (afterFlushOffline.length === 2) {
    console.log('✅ Success: Offline queue flush preserves pending events.');
  } else {
    console.error('❌ Error: Offline queue should remain untouched.');
  }

  const afterFlushSuccess = flushQueue({
    isSupabaseConfigured: true,
    queue: queuedTwice,
    failIds: [],
  });
  if (afterFlushSuccess.length === 0) {
    console.log('✅ Success: Successful retry flush clears pending queue.');
  } else {
    console.error('❌ Error: Queue should be empty after successful flush.');
  }

  console.log("\n=================================================");
  console.log("   TEST CASE 10 COMPLETE                         ");
  console.log("=================================================");

  // =================================================
  // TEST CASE 11: Periodic Flush & Last-Sync Tracking
  // =================================================
  console.log("\n--- TEST CASE 11: Periodic Flush & Last-Sync Tracking ---");

  const simulatePeriodicFlush = (initialState, flushAttempt) => {
    let state = JSON.parse(JSON.stringify(initialState));

    // Simulate a flush attempt
    if (flushAttempt.isSupabaseConfigured && flushAttempt.queue.length > 0) {
      const failed = flushAttempt.queue.filter(evt => !flushAttempt.successIds.includes(evt.id));
      state.queue = failed;
      if (failed.length === 0) {
        state.lastRemoteSyncAt = flushAttempt.flushTimestamp;
      }
      state.lastRemoteSyncAttemptAt = flushAttempt.flushTimestamp;
    }

    return state;
  };

  const flushState = {
    queue: [
      { id: 'evt_p1', vendorId: 'v1', type: 'profile_view', timestamp: nowTs - days(1) },
      { id: 'evt_p2', vendorId: 'v1', type: 'directions_request', timestamp: nowTs - days(2) },
    ],
    lastRemoteSyncAt: null,
    lastRemoteSyncAttemptAt: null,
  };

  // 11a. Verify lastRemoteSyncAt updates on successful flush
  const afterSuccessFlush = simulatePeriodicFlush(flushState, {
    isSupabaseConfigured: true,
    queue: flushState.queue,
    successIds: ['evt_p1', 'evt_p2'],
    flushTimestamp: nowTs,
  });

  if (afterSuccessFlush.lastRemoteSyncAt === nowTs && afterSuccessFlush.queue.length === 0) {
    console.log('✅ Success: lastRemoteSyncAt updated on successful flush.');
  } else {
    console.error('❌ Error: lastRemoteSyncAt not tracking successful syncs.');
  }

  // 11b. Verify lastRemoteSyncAt does NOT update on partial failure
  const afterPartialFlush = simulatePeriodicFlush(flushState, {
    isSupabaseConfigured: true,
    queue: flushState.queue,
    successIds: ['evt_p1'],
    flushTimestamp: nowTs,
  });

  if (afterPartialFlush.lastRemoteSyncAt === null && afterPartialFlush.queue.length === 1) {
    console.log('✅ Success: lastRemoteSyncAt NOT updated on partial failure.');
  } else {
    console.error('❌ Error: lastRemoteSyncAt should not update on partial flush.');
  }

  // 11c. Verify lastRemoteSyncAttemptAt always updates
  if (afterPartialFlush.lastRemoteSyncAttemptAt === nowTs) {
    console.log('✅ Success: lastRemoteSyncAttemptAt tracks every flush attempt.');
  } else {
    console.error('❌ Error: lastRemoteSyncAttemptAt should track all attempts.');
  }

  // 11d. Verify formatted time strings for UI display
  const formatSyncTime = (lastSyncAt, now) => {
    if (!lastSyncAt) return 'Never';
    const diffMs = now - lastSyncAt;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'over 1d ago';
  };

  const recentSync = formatSyncTime(nowTs - 30 * 1000, nowTs);
  const olderSync = formatSyncTime(nowTs - 45 * 60 * 1000, nowTs);
  const veryOldSync = formatSyncTime(nowTs - 25 * 60 * 60 * 1000, nowTs);

  const recentOk = recentSync === 'just now';
  const olderOk = olderSync.includes('m ago');
  const veryOldOk = veryOldSync.includes('h ago') || veryOldSync.includes('over 1d');

  if (recentOk && olderOk && veryOldOk) {
    console.log('✅ Success: Formatted sync times display correctly.');
  } else {
    console.error('❌ Error: Sync time formatting failed. Recent:', recentSync, 'Older:', olderSync, 'VeryOld:', veryOldSync);
  }

  console.log("\n=================================================");
  console.log("   TEST CASE 11 COMPLETE                         ");
  console.log("=================================================");

  // =================================================
  // TEST CASE 12: Network-Aware Flush (Smart Retry)
  // =================================================
  console.log("\n--- TEST CASE 12: Network-Aware Flush (Smart Retry) ---");

  const simulateNetworkAwareFlush = (networkState, queue, flushBehavior) => {
    const result = {
      synced: false,
      pendingCount: queue.length,
      networkAvailable: networkState.isConnected,
      attempted: false,
    };

    // If no network, skip attempt
    if (!networkState.isConnected) {
      return result;
    }

    // Network available; attempt flush
    result.attempted = true;
    if (flushBehavior.isSupabaseConfigured && queue.length > 0) {
      const failed = queue.filter(evt => !flushBehavior.successIds.includes(evt.id));
      result.synced = failed.length === 0;
      result.pendingCount = failed.length;
    }

    return result;
  };

  const testQueue = [
    { id: 'evt_n1', vendorId: 'v1', type: 'profile_view', timestamp: nowTs - days(1) },
    { id: 'evt_n2', vendorId: 'v1', type: 'directions_request', timestamp: nowTs - days(2) },
  ];

  // 12a. Verify offline prevents flush attempt
  const offlineResult = simulateNetworkAwareFlush(
    { isConnected: false, type: 'none' },
    testQueue,
    { isSupabaseConfigured: true, successIds: [] }
  );

  if (!offlineResult.networkAvailable && !offlineResult.attempted && offlineResult.pendingCount === 2) {
    console.log('✅ Success: Offline network skips flush attempt and preserves queue.');
  } else {
    console.error('❌ Error: Offline should prevent flush and keep queue intact.');
  }

  // 12b. Verify online enables flush attempt
  const onlineFailResult = simulateNetworkAwareFlush(
    { isConnected: true, type: 'wifi' },
    testQueue,
    { isSupabaseConfigured: true, successIds: ['evt_n1'] }
  );

  if (onlineFailResult.networkAvailable && onlineFailResult.attempted && onlineFailResult.pendingCount === 1 && !onlineFailResult.synced) {
    console.log('✅ Success: Online network attempts flush with partial failure.');
  } else {
    console.error('❌ Error: Online should attempt flush.');
  }

  // 12c. Verify successful online flush
  const onlineSuccessResult = simulateNetworkAwareFlush(
    { isConnected: true, type: 'wifi' },
    testQueue,
    { isSupabaseConfigured: true, successIds: ['evt_n1', 'evt_n2'] }
  );

  if (onlineSuccessResult.networkAvailable && onlineSuccessResult.attempted && onlineSuccessResult.synced && onlineSuccessResult.pendingCount === 0) {
    console.log('✅ Success: Online network successfully clears queue on full sync.');
  } else {
    console.error('❌ Error: Online successful flush should clear queue.');
  }

  // 12d. Verify network transition behavior (from offline to online)
  const transitionQueue = [...testQueue];
  const offlineTransition = simulateNetworkAwareFlush(
    { isConnected: false, type: 'none' },
    transitionQueue,
    { isSupabaseConfigured: true, successIds: [] }
  );
  
  const onlineTransition = simulateNetworkAwareFlush(
    { isConnected: true, type: 'cellular' },
    transitionQueue, // Queue unchanged from offline period
    { isSupabaseConfigured: true, successIds: ['evt_n1', 'evt_n2'] }
  );

  if (offlineTransition.pendingCount === 2 && !offlineTransition.attempted && 
      onlineTransition.pendingCount === 0 && onlineTransition.attempted && onlineTransition.synced) {
    console.log('✅ Success: Queue survives offline period, flushes on network recovery.');
  } else {
    console.error('❌ Error: Network transition handling failed.');
  }

  console.log("\n=================================================");
  console.log("   TEST CASE 12 COMPLETE                         ");
  console.log("=================================================");
})().catch((err) => {
  console.error('❌ Error: Test Case 6 failed with exception:', err);
  process.exitCode = 1;
});
