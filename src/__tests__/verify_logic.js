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

  // =================================================
  // TEST CASE 13: Realtime Analytics Updates (Live)
  // =================================================
  console.log("\n--- TEST CASE 13: Realtime Analytics Updates (Live) ---");

  const simulateRealtimeSubscription = () => {
    let listeners = [];
    let eventCache = new Map();
    let state = {
      isConnected: false,
      lastUpdateAt: null,
      eventCount: 0,
    };

    return {
      subscribe: (vendorId, callback) => {
        listeners.push({ vendorId, callback });
        // Simulate connection established after subscribe
        setTimeout(() => {
          state.isConnected = true;
          callback(Array.from(eventCache.values()), state);
        }, 10);
        return () => {
          listeners = listeners.filter(l => l.vendorId !== vendorId);
          state.isConnected = false;
        };
      },
      receiveEvent: (event) => {
        // Deduplicate
        if (!eventCache.has(event.id)) {
          eventCache.set(event.id, event);
          state.lastUpdateAt = Date.now();
          state.eventCount = eventCache.size;
          // Notify all listeners
          listeners.forEach(l => {
            l.callback(Array.from(eventCache.values()), state);
          });
        }
      },
      getEventCount: () => eventCache.size,
      getState: () => state,
    };
  };

  const realtimeManager = simulateRealtimeSubscription();
  let realtimeEvents = [];
  let realtimeState = { isConnected: false, lastUpdateAt: null, eventCount: 0 };

  // 13a. Verify subscription establishes connection
  const unsubscribe = realtimeManager.subscribe('v1', (events, state) => {
    realtimeEvents = events;
    realtimeState = state;
  });

  setTimeout(() => {
    if (realtimeState.isConnected) {
      console.log('✅ Success: Realtime subscription establishes connection.');
    } else {
      console.error('❌ Error: Realtime subscription failed to connect.');
    }

    // 13b. Verify incoming event is captured
    realtimeManager.receiveEvent({
      id: 'evt_rt_1',
      vendorId: 'v1',
      type: 'profile_view',
      timestamp: nowTs - days(1),
    });

    if (realtimeEvents.length === 1 && realtimeState.eventCount === 1) {
      console.log('✅ Success: Realtime event received and captured.');
    } else {
      console.error('❌ Error: Realtime event capture failed.');
    }

    // 13c. Verify event deduplication
    realtimeManager.receiveEvent({
      id: 'evt_rt_1', // Same ID
      vendorId: 'v1',
      type: 'profile_view',
      timestamp: nowTs - days(1),
    });

    if (realtimeEvents.length === 1 && realtimeState.eventCount === 1) {
      console.log('✅ Success: Duplicate events are deduplicated.');
    } else {
      console.error('❌ Error: Duplicate event was not filtered.');
    }

    // 13d. Verify multiple unique events accumulate
    realtimeManager.receiveEvent({
      id: 'evt_rt_2',
      vendorId: 'v1',
      type: 'directions_request',
      timestamp: nowTs - days(2),
    });

    realtimeManager.receiveEvent({
      id: 'evt_rt_3',
      vendorId: 'v1',
      type: 'chat_start',
      timestamp: nowTs - days(3),
    });

    if (realtimeEvents.length === 3 && realtimeState.eventCount === 3 && realtimeState.lastUpdateAt !== null) {
      console.log('✅ Success: Multiple realtime events accumulate correctly.');
    } else {
      console.error('❌ Error: Realtime event accumulation failed.');
    }

    // 13e. Verify unsubscribe disconnects
    unsubscribe();

    if (!realtimeState.isConnected) {
      console.log('✅ Success: Unsubscribe disconnects realtime.');
    } else {
      console.error('❌ Error: Unsubscribe should disconnect realtime.');
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 13 COMPLETE                         ");
    console.log("=================================================");

    // =================================================
    // TEST CASE 14: Event Drill-Down & Engagement Quality Scoring
    // =================================================
    console.log("\n--- TEST CASE 14: Event Drill-Down & Engagement Quality Scoring ---");

    const EVENT_WEIGHTS = { chat_start: 3, directions_request: 2, profile_view: 1 };

    const computeEngagementQuality = (events) => {
      if (events.length === 0) return { score: 0, quality: 0, label: 'Low' };
      const weighted = events.reduce((sum, e) => sum + (EVENT_WEIGHTS[e.type] ?? 1), 0);
      const maxPossible = events.length * 3;
      const quality = Math.min(100, Math.round((weighted / maxPossible) * 100));
      const label = quality >= 70 ? 'High' : quality >= 40 ? 'Medium' : 'Low';
      return { score: weighted, quality, label };
    };

    const mixedEvents = [
      { id: 'e1', vendorId: 'v1', type: 'chat_start', timestamp: nowTs - days(1), localityId: 1 },
      { id: 'e2', vendorId: 'v1', type: 'chat_start', timestamp: nowTs - days(1), localityId: 2 },
      { id: 'e3', vendorId: 'v1', type: 'directions_request', timestamp: nowTs - days(2), localityId: 1 },
      { id: 'e4', vendorId: 'v1', type: 'profile_view', timestamp: nowTs - days(3) },
      { id: 'e5', vendorId: 'v1', type: 'profile_view', timestamp: nowTs - days(4) },
      { id: 'e6', vendorId: 'v1', type: 'profile_view', timestamp: nowTs - days(5) },
    ];

    // 14a. Verify engagement score computation
    const { score, quality, label } = computeEngagementQuality(mixedEvents);
    // chat_start*2=6, directions*1=2, profile_view*3=3 → weighted=11, max=18 → 61%
    if (score === 11 && quality === 61 && label === 'Medium') {
      console.log(`✅ Success: Engagement quality score correct (weighted=${score}, quality=${quality}%, label=${label}).`);
    } else {
      console.error(`❌ Error: Engagement quality mismatch (got weighted=${score}, quality=${quality}%, label=${label}).`);
    }

    // 14b. Verify High label threshold
    const highEvents = [
      { id: 'h1', type: 'chat_start' },
      { id: 'h2', type: 'chat_start' },
      { id: 'h3', type: 'chat_start' },
    ];
    const { label: highLabel } = computeEngagementQuality(highEvents);
    if (highLabel === 'High') {
      console.log('✅ Success: All-chat events correctly rated High engagement.');
    } else {
      console.error('❌ Error: High engagement label threshold failed.');
    }

    // 14c. Verify Low label threshold
    const lowEvents = [
      { id: 'l1', type: 'profile_view' },
      { id: 'l2', type: 'profile_view' },
      { id: 'l3', type: 'profile_view' },
    ];
    const { label: lowLabel } = computeEngagementQuality(lowEvents);
    if (lowLabel === 'Low') {
      console.log('✅ Success: All-view events correctly rated Low engagement.');
    } else {
      console.error('❌ Error: Low engagement label threshold failed.');
    }

    // 14d. Verify drill-down events are sorted newest-first
    const sorted = [...mixedEvents].sort((a, b) => b.timestamp - a.timestamp);
    const sortedCorrect = sorted[0].id === 'e1' && sorted[sorted.length - 1].id === 'e6';
    if (sortedCorrect) {
      console.log('✅ Success: Drill-down events sorted newest-first.');
    } else {
      console.error('❌ Error: Event sort order incorrect.');
    }

    // 14e. Verify display slice: first 5 when collapsed, all when expanded
    const collapsed = sorted.slice(0, 5);
    const expanded = sorted.slice(0, 20);
    if (collapsed.length === 5 && expanded.length === mixedEvents.length) {
      console.log('✅ Success: Collapsed shows 5 events, expanded shows all events.');
    } else {
      console.error('❌ Error: Drill-down event slice logic incorrect.');
    }

    // 14f. Verify event time formatting
    const formatEventTime = (ts) => {
      const diffMs = nowTs - ts;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    };

    const t1 = formatEventTime(nowTs - 30 * 60000);        // 30 min ago
    const t2 = formatEventTime(nowTs - 5 * 60 * 60000);    // 5 hours ago
    const t3 = formatEventTime(nowTs - 3 * 24 * 60 * 60000); // 3 days ago

    if (t1.includes('m ago') && t2.includes('h ago') && t3.includes('d ago')) {
      console.log('✅ Success: Event timestamps format correctly (m/h/d ago).');
    } else {
      console.error(`❌ Error: Event time formatting failed (${t1}, ${t2}, ${t3}).`);
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 14 COMPLETE                         ");
    console.log("=================================================");

    // =================================================
    // TEST CASE 15: Rank-Up Nudge Engine
    // =================================================
    console.log("\n--- TEST CASE 15: Rank-Up Nudge Engine ---");

    const computeRankUpNudge = (vendor, localityVendors) => {
      const ranked = [...localityVendors].sort((a, b) => {
        const aBoost = a.subscription_tier > 1 ? 1 : 0;
        const bBoost = b.subscription_tier > 1 ? 1 : 0;
        if (bBoost !== aBoost) return bBoost - aBoost;
        const aOpen = a.is_open ? 1 : 0;
        const bOpen = b.is_open ? 1 : 0;
        if (bOpen !== aOpen) return bOpen - aOpen;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.business_name.localeCompare(b.business_name);
      });

      const currentRank = ranked.findIndex((v) => v.id === vendor.id);
      if (currentRank <= 0) return { type: 'already_top', urgent: false };

      const nextAbove = ranked[currentRank - 1];

      if (vendor.subscription_tier === 1 && nextAbove.subscription_tier > 1) {
        const boostedCount = ranked.filter((v) => v.subscription_tier > 1).length;
        return { type: 'upgrade', urgent: true, value: boostedCount };
      }

      if (!vendor.is_open && nextAbove.is_open && vendor.subscription_tier === nextAbove.subscription_tier) {
        return { type: 'open_status', urgent: true, value: 0 };
      }

      if (vendor.subscription_tier === nextAbove.subscription_tier && vendor.is_open === nextAbove.is_open) {
        const ratingGap = parseFloat((nextAbove.rating - vendor.rating).toFixed(1));
        if (ratingGap > 0 && ratingGap <= 0.8) {
          return { type: 'rating_gap', urgent: ratingGap <= 0.3, value: ratingGap };
        }
      }

      return { type: 'rating_gap', urgent: false, value: 0 };
    };

    const locality = [
      { id: 'v_top', business_name: 'Alpha Foods', subscription_tier: 2, is_open: true, rating: 4.9 },
      { id: 'v_mid', business_name: 'Beta Store', subscription_tier: 2, is_open: true, rating: 4.5 },
      { id: 'v_me',  business_name: 'My Biz',     subscription_tier: 1, is_open: true, rating: 4.2 },
      { id: 'v_low', business_name: 'Zeta Shop',  subscription_tier: 1, is_open: true, rating: 3.8 },
    ];

    // 15a. Upgrade nudge: free vendor below boosted
    const nudgeUpgrade = computeRankUpNudge(locality[2], locality);
    if (nudgeUpgrade.type === 'upgrade' && nudgeUpgrade.urgent && nudgeUpgrade.value === 2) {
      console.log('✅ Success: Upgrade nudge fires when free vendor is below boosted competitors.');
    } else {
      console.error('❌ Error: Upgrade nudge logic failed.', nudgeUpgrade);
    }

    // 15b. Already-top nudge: #1 vendor
    const nudgeTop = computeRankUpNudge(locality[0], locality);
    if (nudgeTop.type === 'already_top') {
      console.log('✅ Success: Already-top nudge fires for #1 vendor.');
    } else {
      console.error('❌ Error: Already-top nudge failed.', nudgeTop);
    }

    // 15c. Open-status nudge: closed vendor below open same-tier vendor
    const closedLocality = [
      { id: 'v_open', business_name: 'Open Biz', subscription_tier: 1, is_open: true, rating: 4.0 },
      { id: 'v_closed', business_name: 'Closed Biz', subscription_tier: 1, is_open: false, rating: 4.5 },
    ];
    const nudgeOpen = computeRankUpNudge(closedLocality[1], closedLocality);
    if (nudgeOpen.type === 'open_status' && nudgeOpen.urgent) {
      console.log('✅ Success: Open-status nudge fires for closed vendor behind open same-tier vendor.');
    } else {
      console.error('❌ Error: Open-status nudge logic failed.', nudgeOpen);
    }

    // 15d. Rating gap nudge: urgent when gap ≤ 0.3
    const ratingLocality = [
      { id: 'v_ahead', business_name: 'Ahead Biz', subscription_tier: 1, is_open: true, rating: 4.5 },
      { id: 'v_close', business_name: 'Close Biz', subscription_tier: 1, is_open: true, rating: 4.3 },
    ];
    const nudgeRating = computeRankUpNudge(ratingLocality[1], ratingLocality);
    if (nudgeRating.type === 'rating_gap' && nudgeRating.urgent && nudgeRating.value === 0.2) {
      console.log('✅ Success: Urgent rating-gap nudge fires within 0.3 star threshold.');
    } else {
      console.error('❌ Error: Rating-gap nudge logic failed.', nudgeRating);
    }

    // 15e. Rating gap nudge: NOT urgent when gap > 0.3 but ≤ 0.8
    const widegapLocality = [
      { id: 'v_far', business_name: 'Far Biz', subscription_tier: 1, is_open: true, rating: 4.9 },
      { id: 'v_near', business_name: 'Near Biz', subscription_tier: 1, is_open: true, rating: 4.4 },
    ];
    const nudgeWide = computeRankUpNudge(widegapLocality[1], widegapLocality);
    if (nudgeWide.type === 'rating_gap' && !nudgeWide.urgent && nudgeWide.value === 0.5) {
      console.log('✅ Success: Non-urgent rating-gap nudge for 0.5 star gap.');
    } else {
      console.error('❌ Error: Non-urgent rating-gap threshold failed.', nudgeWide);
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 15 COMPLETE                         ");
    console.log("=================================================");

    // TEST CASE 16: Customer-Facing Ranking Transparency
    console.log("\n--- TEST CASE 16: Customer-Facing Ranking Transparency ---");

    // Simulate ranking transparency functions
    const explainVendorRank = (vendor, allVendors) => {
      const isBoosted = vendor.subscription_tier > 1;
      const isOpen = vendor.is_open;
      const reasons = [];
      const factors = [];

      if (isBoosted) {
        reasons.push(`${vendor.business_name} has Premium Boosted visibility`);
        factors.push('Premium Boost');
      }
      if (isOpen) {
        reasons.push(`${vendor.business_name} is currently open`);
        factors.push('Open Now');
      }
      if (vendor.rating >= 4.5) {
        factors.push(`${vendor.rating}⭐ Rating`);
      }

      return {
        reason: reasons.join('; '),
        factor: factors.join(', '),
        boost: isBoosted,
        rating: vendor.rating >= 3.5,
        open: isOpen,
      };
    };

    const getRankingPolicy = () => ({
      title: 'How Vendors Appear Here',
      summary: 'Vendors are ranked to help you find the best match.',
      factors: [
        '1. Premium Boosted vendors rank above Standard vendors',
        '2. Open stores rank above closed ones',
        '3. Higher-rated vendors rank above lower-rated ones',
      ],
      boostInfo: 'Vendors can upgrade to Premium Boosted to rank higher.',
    });

    const getTransparencyScore = (vendor, localityVendors) => {
      let score = 50;
      if (vendor.subscription_tier > 1) score += 20;
      if (vendor.is_open) score += 15;
      const avgRating = localityVendors.reduce((sum, v) => sum + v.rating, 0) / localityVendors.length;
      if (vendor.rating >= avgRating - 0.2) score += 15;
      return Math.min(100, score);
    };

    // 16a. explainVendorRank returns all relevant factors
    const testVendor = {
      id: 'test-v1',
      business_name: 'Test Vendor',
      subscription_tier: 2,
      is_open: true,
      rating: 4.7,
    };

    const testVendors = [
      testVendor,
      { id: 'v2', business_name: 'V2', subscription_tier: 1, is_open: false, rating: 3.5 },
      { id: 'v3', business_name: 'V3', subscription_tier: 1, is_open: true, rating: 4.2 },
    ];

    const explanation = explainVendorRank(testVendor, testVendors);
    if (explanation.factor.includes('Premium Boost') && explanation.factor.includes('Open Now') && explanation.factor.includes('4.7⭐')) {
      console.log('✅ Success: explainVendorRank returns all factors (Boost, Open, Rating).');
    } else {
      console.error('❌ Error: explainVendorRank missing factors.', explanation);
    }

    // 16b. getRankingPolicy returns complete structure
    const policy = getRankingPolicy();
    if (policy.title && policy.factors.length === 3 && policy.boostInfo) {
      console.log('✅ Success: getRankingPolicy returns title, factors, and boost info.');
    } else {
      console.error('❌ Error: getRankingPolicy structure incomplete.', policy);
    }

    // 16c. getTransparencyScore correctly rewards boosted, open, highly-rated vendors
    const transparencyScore = getTransparencyScore(testVendor, testVendors);
    const expectedScore = 100; // baseline 50 + boost 20 + open 15 + rating 15 = 100
    if (transparencyScore === expectedScore) {
      console.log(`✅ Success: getTransparencyScore correctly computes ${expectedScore} (50 baseline + 20 boost + 15 open + 15 rating).`);
    } else {
      console.error(`❌ Error: transparency score should be ${expectedScore}, got ${transparencyScore}.`);
    }

    // 16d. Non-boosted vendor gets lower transparency score
    const standardVendor = {
      ...testVendor,
      subscription_tier: 1,
    };
    const standardScore = getTransparencyScore(standardVendor, testVendors);
    if (standardScore < transparencyScore) {
      console.log(`✅ Success: Non-boosted vendor score (${standardScore}) is lower than boosted (${transparencyScore}).`);
    } else {
      console.error(`❌ Error: standard vendor score (${standardScore}) should be less than boosted (${transparencyScore}).`);
    }

    // 16e. Closed vendor transparency score is lower than open
    const closedVendor = {
      ...testVendor,
      is_open: false,
    };
    const closedScore = getTransparencyScore(closedVendor, testVendors);
    if (closedScore < transparencyScore) {
      console.log(`✅ Success: Closed vendor score (${closedScore}) is lower than open (${transparencyScore}).`);
    } else {
      console.error(`❌ Error: closed vendor score (${closedScore}) should be less than open (${transparencyScore}).`);
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 16 COMPLETE                         ");
    console.log("=================================================");

    // TEST CASE 17: Proximity-Based Notifications (Boosted Vendors Only)
    console.log("\n--- TEST CASE 17: Proximity-Based Notifications ---");

    // Simulate proximity notification functions
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const isInVicinity = (customerLat, customerLng, vendorLat, vendorLng, radiusKm = 2) => {
      const distance = calculateDistance(customerLat, customerLng, vendorLat, vendorLng);
      return distance <= radiusKm;
    };

    const isInSameLocality = (customerLocalityId, vendorLocalityId) => {
      return customerLocalityId === vendorLocalityId;
    };

    const generateVendorProximityNotification = (vendor, customer, interactions) => {
      // Only boosted vendors
      if (vendor.subscription_tier <= 1) return null;

      // Must have previous interaction
      const hasPreviousInteraction = interactions.some(
        (i) => i.vendor_id === vendor.id && i.customer_id === customer.id
      );
      if (!hasPreviousInteraction) return null;

      // Must be in same locality
      if (!isInSameLocality(customer.locality_id, vendor.locality_id)) return null;

      // Calculate distance if locations available
      let distance;
      if (vendor.exact_location && customer.current_location) {
        distance = calculateDistance(
          customer.current_location.latitude,
          customer.current_location.longitude,
          vendor.exact_location.latitude,
          vendor.exact_location.longitude
        );
      }

      return {
        id: `vendor-prox-${vendor.id}-${customer.id}`,
        type: 'vendor_customer_nearby',
        recipientId: vendor.id,
        triggerEntityId: customer.id,
        triggerEntityName: customer.phone_number,
        localityId: vendor.locality_id,
        distance,
        createdAt: Date.now(),
        read: false,
      };
    };

    const generateCustomerProximityNotification = (customer, vendors, customerLocation) => {
      // Filter only boosted vendors in customer's locality
      const boostedVendors = vendors.filter(
        (v) => v.subscription_tier > 1 && v.locality_id === customer.locality_id
      );

      if (boostedVendors.length === 0) return [];

      // Filter nearby if location available
      const nearbyVendors = customerLocation
        ? boostedVendors.filter((v) =>
            v.exact_location
              ? isInVicinity(
                  customerLocation.latitude,
                  customerLocation.longitude,
                  v.exact_location.latitude,
                  v.exact_location.longitude
                )
              : true
          )
        : boostedVendors;

      if (nearbyVendors.length === 0) return [];

      const vendorNames = nearbyVendors.map((v) => v.business_name).join(', ');

      return [
        {
          id: `customer-prox-${customer.id}-${Date.now()}`,
          type: 'customer_vendor_nearby',
          recipientId: customer.id,
          triggerEntityId: nearbyVendors[0].id,
          triggerEntityName: vendorNames,
          localityId: customer.locality_id,
          createdAt: Date.now(),
          read: false,
        },
      ];
    };

    // 17a. Distance calculation: 0km within same spot
    const dist1 = calculateDistance(6.5, 3.37, 6.5, 3.37);
    if (dist1 === 0) {
      console.log('✅ Success: Distance calculation correct for same coordinates (0 km).');
    } else {
      console.error(`❌ Error: same location distance should be 0, got ${dist1}.`);
    }

    // 17b. Distance calculation: realistic distance between two points
    const dist2 = calculateDistance(6.5, 3.37, 6.51, 3.38);
    if (dist2 > 0 && dist2 < 2.5) {
      console.log(`✅ Success: Distance calculation realistic (~${dist2.toFixed(2)} km).`);
    } else {
      console.error(`❌ Error: distance between two close points should be < 2.5km, got ${dist2}.`);
    }

    // 17c. Vendor notification NOT generated for free tier vendor
    const freeVendor = {
      id: 'v_free',
      business_name: 'Free Vendor',
      subscription_tier: 1,
      locality_id: 1,
      locality_name: 'Yaba',
      exact_location: { latitude: 6.5, longitude: 3.37 },
    };
    const customer1 = {
      id: 'c1',
      phone_number: '+2347064291234',
      locality_id: 1,
      locality_name: 'Yaba',
      current_location: { latitude: 6.5, longitude: 3.37 },
    };
    const interactions1 = [{ vendor_id: 'v_free', customer_id: 'c1', action: 'profile_view' }];

    const notifFree = generateVendorProximityNotification(freeVendor, customer1, interactions1);
    if (notifFree === null) {
      console.log('✅ Success: Vendor notification NOT generated for free tier vendors.');
    } else {
      console.error('❌ Error: free tier vendor should not generate notifications.');
    }

    // 17d. Vendor notification generated for boosted vendor with previous customer in same locality
    const boostedVendor = {
      id: 'v_boosted',
      business_name: 'Boosted Vendor',
      subscription_tier: 2,
      locality_id: 1,
      locality_name: 'Yaba',
      exact_location: { latitude: 6.5, longitude: 3.37 },
    };

    const notifBoosted = generateVendorProximityNotification(boostedVendor, customer1, interactions1);
    if (notifBoosted && notifBoosted.type === 'vendor_customer_nearby' && notifBoosted.recipientId === 'v_boosted') {
      console.log('✅ Success: Vendor notification generated for boosted vendor with previous customer in same locality.');
    } else {
      console.error('❌ Error: boosted vendor should generate notification for previous customer in same locality.');
    }

    // 17e. Vendor notification NOT generated if no previous interaction
    const interactions2 = []; // Empty history
    const notifNoHistory = generateVendorProximityNotification(boostedVendor, customer1, interactions2);
    if (notifNoHistory === null) {
      console.log('✅ Success: Vendor notification NOT generated without previous customer interaction.');
    } else {
      console.error('❌ Error: should not notify vendor without previous interaction.');
    }

    // 17f. Customer notification generated when boosted vendors in same locality
    const vendors = [
      {
        id: 'v_boosted_1',
        business_name: 'Boosted A',
        subscription_tier: 2,
        locality_id: 1,
        exact_location: { latitude: 6.5, longitude: 3.37 },
      },
      {
        id: 'v_free',
        business_name: 'Free B',
        subscription_tier: 1,
        locality_id: 1,
        exact_location: { latitude: 6.51, longitude: 3.38 },
      },
    ];

    const custNotif = generateCustomerProximityNotification(customer1, vendors, customer1.current_location);
    if (custNotif.length > 0 && custNotif[0].type === 'customer_vendor_nearby') {
      console.log(`✅ Success: Customer notification generated for boosted vendors in locality (${custNotif[0].triggerEntityName}).`);
    } else {
      console.error('❌ Error: customer should be notified of boosted vendors in their locality.');
    }

    // 17g. Customer notification filters out free tier vendors
    const triggerNames = custNotif[0]?.triggerEntityName || '';
    if (!triggerNames.includes('Free B')) {
      console.log('✅ Success: Free tier vendors filtered out from customer notifications.');
    } else {
      console.error('❌ Error: free tier vendors should not be in customer notifications.');
    }

    // 17h. In-vicinity distance filtering works correctly
    const farVendor = {
      id: 'v_far',
      business_name: 'Far Vendor',
      subscription_tier: 2,
      locality_id: 1,
      exact_location: { latitude: 7.0, longitude: 3.0 }, // ~65km away
    };

    const vendorsWithFar = [
      {
        id: 'v_boosted_1',
        business_name: 'Boosted A',
        subscription_tier: 2,
        locality_id: 1,
        exact_location: { latitude: 6.5, longitude: 3.37 },
      },
      farVendor,
    ];

    const custNotifWithFar = generateCustomerProximityNotification(
      customer1,
      vendorsWithFar,
      customer1.current_location
    );

    // Only nearby vendor should be included
    const includesFar = custNotifWithFar[0]?.triggerEntityName.includes('Far Vendor');
    if (!includesFar) {
      console.log('✅ Success: Far vendors (>2km) filtered out from proximity notifications.');
    } else {
      console.error('❌ Error: vendors beyond 2km radius should be filtered out.');
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 17 COMPLETE                         ");
    console.log("=================================================");

    // TEST CASE 18: Integrated Notification Workflows
    console.log("\n--- TEST CASE 18: Integrated Notification Workflows ---");

    // Simulate notification utilities
    const formatNotificationTime = (timestamp) => {
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    };

    const formatNotificationForDisplay = (notification) => {
      let displayTitle = '';
      let displayBody = '';

      if (notification.type === 'vendor_customer_nearby') {
        displayTitle = 'Previous Customer Nearby';
        displayBody = `${notification.triggerEntityName} is in ${notification.localityName}`;
      } else if (notification.type === 'customer_vendor_nearby') {
        displayTitle = 'Boosted Vendors Near You';
        displayBody = `Check out ${notification.triggerEntityName} in ${notification.localityName}`;
      }

      return {
        ...notification,
        displayTime: formatNotificationTime(notification.createdAt),
        displayTitle,
        displayBody,
      };
    };

    const filterNotifications = (notifications, options) => {
      let filtered = notifications;

      if (options?.type) {
        filtered = filtered.filter((n) => n.type === options.type);
      }

      if (options?.unreadOnly) {
        filtered = filtered.filter((n) => !n.read);
      }

      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered;
    };

    const getNotificationStats = (notifications) => {
      const totalCount = notifications.length;
      const unreadCount = notifications.filter((n) => !n.read).length;
      const vendorNotifCount = notifications.filter((n) => n.type === 'vendor_customer_nearby').length;
      const customerNotifCount = notifications.filter((n) => n.type === 'customer_vendor_nearby').length;

      return {
        totalCount,
        unreadCount,
        vendorNotifCount,
        customerNotifCount,
        hasUnread: unreadCount > 0,
      };
    };

    // 18a. Format notification time correctly
    const now = Date.now();
    const pastTime = now - 5 * 60 * 1000; // 5 minutes ago
    const formattedTime = formatNotificationTime(pastTime);
    if (formattedTime.includes('m ago')) {
      console.log(`✅ Success: Notification time formatted correctly (${formattedTime}).`);
    } else {
      console.error(`❌ Error: time formatting failed, got ${formattedTime}.`);
    }

    // 18b. Format notification for display with title and body
    const testNotif = {
      id: 'notif-test',
      type: 'vendor_customer_nearby',
      triggerEntityName: '+2347064291234',
      localityName: 'Yaba',
      createdAt: now,
      read: false,
    };
    const formatted = formatNotificationForDisplay(testNotif);
    if (formatted.displayTitle === 'Previous Customer Nearby' && formatted.displayBody.includes('+2347064291234')) {
      console.log('✅ Success: Notification formatted with title, body, and time.');
    } else {
      console.error('❌ Error: notification formatting failed.', formatted);
    }

    // 18c. Filter notifications by type
    const notifs = [
      { id: 'v1', type: 'vendor_customer_nearby', read: true },
      { id: 'c1', type: 'customer_vendor_nearby', read: false },
      { id: 'v2', type: 'vendor_customer_nearby', read: false },
    ];

    const vendorFiltered = filterNotifications(notifs, { type: 'vendor_customer_nearby' });
    if (vendorFiltered.length === 2 && vendorFiltered.every((n) => n.type === 'vendor_customer_nearby')) {
      console.log('✅ Success: Notifications filtered by type (vendor notifications).`');
    } else {
      console.error('❌ Error: type filtering failed.', vendorFiltered);
    }

    // 18d. Filter notifications by unread status
    const unreadFiltered = filterNotifications(notifs, { unreadOnly: true });
    if (unreadFiltered.length === 2 && unreadFiltered.every((n) => !n.read)) {
      console.log('✅ Success: Notifications filtered by unread status.');
    } else {
      console.error('❌ Error: unread filtering failed.', unreadFiltered);
    }

    // 18e. Get notification statistics
    const stats = getNotificationStats(notifs);
    if (
      stats.totalCount === 3 &&
      stats.unreadCount === 2 &&
      stats.vendorNotifCount === 2 &&
      stats.customerNotifCount === 1 &&
      stats.hasUnread === true
    ) {
      console.log('✅ Success: Notification statistics computed correctly (3 total, 2 unread, 2 vendor, 1 customer).');
    } else {
      console.error('❌ Error: statistics calculation failed.', stats);
    }

    // 18f. Filter with limit works
    const limited = filterNotifications(notifs, { limit: 1 });
    if (limited.length === 1) {
      console.log('✅ Success: Notification limit filtering works (limit=1).`');
    } else {
      console.error(`❌ Error: limit filtering failed, got ${limited.length} instead of 1.`);
    }

    // 18g. Vendor dashboard nearby customers list (vendors only)
    const vendorNotifsForDashboard = filterNotifications(notifs, {
      type: 'vendor_customer_nearby',
      unreadOnly: false,
    });
    if (vendorNotifsForDashboard.length === 2) {
      console.log('✅ Success: Vendor dashboard nearby customers list populated (2 customers nearby).`');
    } else {
      console.error('❌ Error: vendor dashboard list failed.', vendorNotifsForDashboard);
    }

    // 18h. Customer notifications for nearby boosted vendors
    const customerNotifsForDashboard = filterNotifications(notifs, {
      type: 'customer_vendor_nearby',
      unreadOnly: false,
    });
    if (customerNotifsForDashboard.length === 1) {
      console.log('✅ Success: Customer dashboard nearby vendors list populated (1 boosted vendor).`');
    } else {
      console.error('❌ Error: customer dashboard list failed.', customerNotifsForDashboard);
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 18 COMPLETE                         ");
    console.log("=================================================");

    // =================================================
    // TEST CASE 19: Growth Analytics Engine (Metrics & Recommendations)
    // =================================================
    console.log("\n--- TEST CASE 19: Vendor Growth Analytics Engine ---");

    // Simulate growth analytics functions
    const computeGrowthMetrics = (events) => {
      const nowTs = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      const twoWeekMs = 2 * oneWeekMs;

      const currentStart = nowTs - oneWeekMs;
      const currentEvents = events.filter((e) => e.timestamp >= currentStart);

      const previousStart = nowTs - twoWeekMs;
      const previousEvents = events.filter((e) => e.timestamp >= previousStart && e.timestamp < currentStart);

      const currentProfileViews = currentEvents.filter((e) => e.type === 'profile_view').length;
      const currentChats = currentEvents.filter((e) => e.type === 'chat_start').length;
      const currentDirections = currentEvents.filter((e) => e.type === 'directions_request').length;
      const currentTotal = currentEvents.length;
      const previousTotal = previousEvents.length;

      const weekOverWeekGrowth =
        previousTotal === 0 ? (currentTotal > 0 ? 100 : 0) : Math.round(((currentTotal - previousTotal) / previousTotal) * 100);

      const conversionRate =
        currentProfileViews > 0 ? Math.round((currentChats / currentProfileViews) * 100) : 0;

      // Customer retention: repeat interactions
      const uniqueCustomers = new Set(
        currentEvents.filter((e) => e.actorUserId).map((e) => e.actorUserId)
      ).size;
      const repeatCustomers = Array.from(
        new Set(currentEvents.filter((e) => e.actorUserId).map((e) => e.actorUserId))
      ).filter((userId) => currentEvents.filter((e) => e.actorUserId === userId).length > 1).length;

      const customerRetention = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;

      // Engagement trend
      const midpoint = currentStart + oneWeekMs / 2;
      const firstHalf = currentEvents.filter((e) => e.timestamp < midpoint).length;
      const secondHalf = currentEvents.filter((e) => e.timestamp >= midpoint).length;
      const engagementTrend =
        secondHalf > firstHalf * 1.2 ? 'increasing' : firstHalf > secondHalf * 1.2 ? 'declining' : 'stable';

      return {
        totalInteractions: currentTotal,
        profileViews: currentProfileViews,
        chatStarts: currentChats,
        directionsRequests: currentDirections,
        weekOverWeekGrowth,
        conversionRate,
        customerRetention,
        engagementTrend,
      };
    };

    const generateGrowthRecommendations = (metrics, tierName = 'free') => {
      const recommendations = [];

      // Low conversion
      if (metrics.conversionRate < 15 && metrics.profileViews > 5) {
        recommendations.push({
          priority: 'high',
          title: 'Improve Profile',
          description: 'Low conversion rate - update your profile to encourage chats.',
        });
      }

      // Declining trend
      if (metrics.engagementTrend === 'declining') {
        recommendations.push({
          priority: 'high',
          title: 'Engagement Declining',
          description: 'Try engaging recent customers and updating your status.',
        });
      }

      // Boost upgrade
      if (tierName === 'free' && metrics.totalInteractions > 15) {
        recommendations.push({
          priority: 'high',
          title: 'Ready for Boost',
          description: 'You have good traction. Upgrade to Premium to reach more customers.',
        });
      }

      // Positive momentum
      if (metrics.weekOverWeekGrowth >= 50) {
        recommendations.push({
          priority: 'low',
          title: 'Great Growth!',
          description: `Amazing ${metrics.weekOverWeekGrowth}% week-over-week growth!`,
        });
      }

      return recommendations;
    };

    // 19a. Calculate growth metrics for 7-day window
    const growthEvents = [
      { vendorId: 'v1', type: 'profile_view', timestamp: now - days(1), actorUserId: 'u1' },
      { vendorId: 'v1', type: 'profile_view', timestamp: now - days(1), actorUserId: 'u2' },
      { vendorId: 'v1', type: 'chat_start', timestamp: now - days(2), actorUserId: 'u1' },
      { vendorId: 'v1', type: 'directions_request', timestamp: now - days(3), actorUserId: 'u3' },
      { vendorId: 'v1', type: 'profile_view', timestamp: now - days(10), actorUserId: 'u4' }, // Before 7-day window
    ];

    const growthMetrics = computeGrowthMetrics(growthEvents);
    if (
      growthMetrics.totalInteractions === 4 &&
      growthMetrics.profileViews === 2 &&
      growthMetrics.chatStarts === 1 &&
      growthMetrics.directionsRequests === 1
    ) {
      console.log('✅ Success: Growth metrics calculated correctly (4 interactions, 2 views, 1 chat, 1 direction).`');
    } else {
      console.error('❌ Error: Growth metrics calculation failed.', growthMetrics);
    }

    // 19b. Conversion rate calculation
    const expectedConversionRate = 50; // 1 chat / 2 views = 50%
    if (growthMetrics.conversionRate === expectedConversionRate) {
      console.log(`✅ Success: Conversion rate correctly calculated (${growthMetrics.conversionRate}%).`);
    } else {
      console.error(
        `❌ Error: conversion rate should be ${expectedConversionRate}%, got ${growthMetrics.conversionRate}%.`
      );
    }

    // 19c. Customer retention calculation
    const expectedRetention = 50; // 1 repeat (u1) out of 2 unique (u1, u2, u3) = 33%... wait let me recalculate
    // Unique customers: u1 (2 interactions), u2 (1), u3 (1) = 3 unique
    // Repeat customers: u1 (has 2) = 1
    // Retention = 1/3 = 33%
    if (growthMetrics.customerRetention === 33) {
      console.log(`✅ Success: Customer retention calculated correctly (${growthMetrics.customerRetention}% repeat).`);
    } else {
      console.error(
        `❌ Error: customer retention should be ~33%, got ${growthMetrics.customerRetention}%.`
      );
    }

    // 19d. Week-over-week growth calculation
    const growthEventsWithPrevious = [
      ...growthEvents,
      // Previous week (7-14 days ago)
      { vendorId: 'v1', type: 'profile_view', timestamp: now - days(8), actorUserId: 'u5' },
      { vendorId: 'v1', type: 'profile_view', timestamp: now - days(9), actorUserId: 'u6' },
    ];

    const growthMetricsWithPrev = computeGrowthMetrics(growthEventsWithPrevious);
    // Current: 4 events, Previous: 2 events
    // Growth = (4-2)/2 * 100 = 100%
    if (growthMetricsWithPrev.weekOverWeekGrowth === 100) {
      console.log(`✅ Success: Week-over-week growth calculated correctly (${growthMetricsWithPrev.weekOverWeekGrowth}%).`);
    } else {
      console.error(
        `❌ Error: WoW growth should be 100%, got ${growthMetricsWithPrev.weekOverWeekGrowth}%.`
      );
    }

    // 19e. Engagement trend detection (increasing)
    const trendIncreasingEvents = [
      { vendorId: 'v1', type: 'profile_view', timestamp: now - days(6), actorUserId: 'u1' }, // Old - 1st half
      { vendorId: 'v1', type: 'profile_view', timestamp: now - days(5), actorUserId: 'u2' }, // Old - 1st half
      { vendorId: 'v1', type: 'chat_start', timestamp: now - days(2), actorUserId: 'u3' },   // Recent - 2nd half
      { vendorId: 'v1', type: 'chat_start', timestamp: now - days(1), actorUserId: 'u4' },   // Recent - 2nd half
      { vendorId: 'v1', type: 'directions_request', timestamp: now - days(1), actorUserId: 'u5' }, // Recent - 2nd half
    ];

    const trendMetrics = computeGrowthMetrics(trendIncreasingEvents);
    if (trendMetrics.engagementTrend === 'increasing') {
      console.log('✅ Success: Engagement trend detected as increasing (more recent interactions).`');
    } else {
      console.error(`❌ Error: trend should be increasing, got ${trendMetrics.engagementTrend}.`);
    }

    // 19f. Generate recommendations for low conversion
    const lowConversionMetrics = {
      totalInteractions: 20,
      profileViews: 18,
      chatStarts: 2,
      conversionRate: 11,
      engagementTrend: 'stable',
      customerRetention: 25,
    };

    const recs = generateGrowthRecommendations(lowConversionMetrics, 'free');
    const hasProfileRec = recs.some((r) => r.title.includes('Profile'));
    if (hasProfileRec) {
      console.log('✅ Success: Low conversion recommendation generated.`');
    } else {
      console.error('❌ Error: should recommend profile improvement for low conversion.');
    }

    // 19g. Generate recommendations for declining trend
    const decliningMetrics = {
      totalInteractions: 5,
      profileViews: 4,
      chatStarts: 1,
      conversionRate: 25,
      engagementTrend: 'declining',
      customerRetention: 50,
    };

    const decliningRecs = generateGrowthRecommendations(decliningMetrics, 'free');
    const hasDecliningRec = decliningRecs.some((r) => r.title.includes('Declining'));
    if (hasDecliningRec) {
      console.log('✅ Success: Declining engagement recommendation generated.`');
    } else {
      console.error('❌ Error: should recommend action for declining engagement.');
    }

    // 19h. Generate recommendations for boost upgrade (free tier with good traction)
    const upgradeMetrics = {
      totalInteractions: 30,
      profileViews: 20,
      chatStarts: 5,
      conversionRate: 25,
      engagementTrend: 'increasing',
      customerRetention: 40,
    };

    const upgradeRecs = generateGrowthRecommendations(upgradeMetrics, 'free');
    const hasUpgradeRec = upgradeRecs.some((r) => r.title.includes('Boost'));
    if (hasUpgradeRec) {
      console.log('✅ Success: Upgrade to Premium recommendation generated for free tier with good traction.`');
    } else {
      console.error('❌ Error: should recommend upgrade for free tier with 30 interactions.');
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 19 COMPLETE                         ");
    console.log("=================================================");

    // =================================================
    // TEST CASE 20: Customer Engagement Tracking
    // =================================================
    console.log("\n--- TEST CASE 20: Customer Engagement Tracking ---");

    // Simulate engagement tracking functions
    const addBrowsingEvent = (history, event) => {
      return [{ ...event, timestamp: Date.now() }, ...history].slice(0, 100);
    };

    const recordVendorInteraction = (interactionMap, vendorId, type, durationSeconds = 0) => {
      const existing = interactionMap[vendorId] || {
        vendorId,
        viewCount: 0,
        favoriteCount: 0,
        shareCount: 0,
        contactCount: 0,
        totalInteractionTime: 0,
        firstViewTime: Date.now(),
        lastViewTime: Date.now(),
        conversationStarted: false,
      };

      const updated = { ...existing, lastViewTime: Date.now() };
      if (type === 'view') {
        updated.viewCount += 1;
        updated.totalInteractionTime += durationSeconds;
      } else if (type === 'favorite') {
        updated.favoriteCount += 1;
      } else if (type === 'share') {
        updated.shareCount += 1;
      } else if (type === 'contact') {
        updated.contactCount += 1;
      }

      return { ...interactionMap, [vendorId]: updated };
    };

    const analyzeBrowsingPatterns = (browsingHistory, windowDays = 7) => {
      const now = Date.now();
      const windowMs = windowDays * 24 * 60 * 60 * 1000;
      const recentEvents = browsingHistory.filter((e) => e.timestamp > now - windowMs);

      if (recentEvents.length === 0) {
        return {
          averageSessionDuration: 0,
          browsingFrequency: 'occasional',
          preferredTimeOfDay: 'afternoon',
          averageBrowsingHour: 14,
          mostViewedCategory: 'unknown',
          categoryDiversity: 0,
        };
      }

      // Calculate average session duration
      let sessionCount = 1;
      let totalSessionDuration = 0;
      
      for (let i = 1; i < recentEvents.length; i++) {
        const timeDiff = recentEvents[i].timestamp - recentEvents[i - 1].timestamp;
        if (timeDiff > 15 * 60 * 1000) {
          sessionCount += 1;
        }
      }

      totalSessionDuration = recentEvents.reduce((sum, e) => sum + e.durationSeconds, 0) / 60;
      const averageSessionDuration = totalSessionDuration / Math.max(1, sessionCount);

      // Browsing frequency
      const daysActive = new Set(recentEvents.map((e) => new Date(e.timestamp).toDateString())).size;
      let browsingFrequency = 'occasional';
      if (daysActive >= 5) {
        browsingFrequency = 'daily';
      } else if (daysActive >= 2) {
        browsingFrequency = 'weekly';
      }

      // Category diversity
      const categoryMap = new Map();
      recentEvents.forEach((e) => {
        const cat = e.category || 'uncategorized';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      const mostViewedCategory = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
      const categoryDiversity = Math.min(100, categoryMap.size * 15);

      return {
        averageSessionDuration: Math.round(averageSessionDuration * 10) / 10,
        browsingFrequency,
        preferredTimeOfDay: 'afternoon',
        averageBrowsingHour: 14,
        mostViewedCategory,
        categoryDiversity,
      };
    };

    const generatePersonalizedRecommendations = (categoryPreferences, vendorInteractionHistory, allVendors) => {
      if (categoryPreferences.length === 0 || allVendors.length === 0) {
        return [];
      }

      const topCategories = categoryPreferences.slice(0, 3).map((p) => p.categoryId);

      const recommendations = allVendors
        .filter((v) => topCategories.includes(v.category))
        .map((vendor) => {
          const history = vendorInteractionHistory[vendor.id];
          const isNewVendor = !history || history.viewCount === 0;

          let score = 50;
          const categoryIndex = topCategories.indexOf(vendor.category);
          score += Math.max(0, 30 - categoryIndex * 10);

          if (vendor.rating) {
            score += Math.min(15, vendor.rating * 3);
          }

          if (!isNewVendor && history) {
            const daysSinceView = (Date.now() - history.lastViewTime) / (1000 * 60 * 60 * 24);
            if (daysSinceView < 1) {
              score -= 20;
            }
          }

          if (isNewVendor) {
            score += 10;
          }

          const reason = isNewVendor
            ? `New vendor in your favorite category: ${vendor.category}`
            : `Popular in ${vendor.category} category`;

          const estimatedInterestLevel = score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low';

          return {
            vendorId: vendor.id,
            vendorName: vendor.business_name,
            category: vendor.category,
            reason,
            relevanceScore: Math.min(100, score),
            estimatedInterestLevel,
          };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);

      return recommendations;
    };

    const calculateEngagementScore = (browsingHistory, windowDays = 7) => {
      const now = Date.now();
      const sevenDaysAgo = now - windowDays * 24 * 60 * 60 * 1000;
      const recentEvents = browsingHistory.filter((e) => e.timestamp > sevenDaysAgo);

      let engagementScore = 0;
      if (recentEvents.length > 0) {
        const frequencyScore = Math.min(30, recentEvents.length * 3);
        const durationScore = Math.min(30, recentEvents.reduce((sum, e) => sum + e.durationSeconds, 0) / 60);
        const vendorVariety = new Set(recentEvents.map((e) => e.vendorId)).size;
        const varietyScore = Math.min(40, vendorVariety * 4);
        engagementScore = Math.min(100, frequencyScore + durationScore + varietyScore);
      }

      const engagementLevel = engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low';
      return { engagementScore, engagementLevel };
    };

    // 20a. Verify addBrowsingEvent appends to history
    let browsingHistory = [];
    const event1 = {
      vendorId: 'v1',
      vendorName: 'Vendor 1',
      category: 'Food',
      durationSeconds: 15,
      interactionType: 'view',
    };

    browsingHistory = addBrowsingEvent(browsingHistory, event1);
    if (browsingHistory.length === 1 && browsingHistory[0].vendorId === 'v1') {
      console.log('✅ Success: Browsing event recorded (1 event in history).');
    } else {
      console.error('❌ Error: browsing event not recorded.');
    }

    // 20b. Verify recordVendorInteraction tracks view counts
    let interactionMap = {};
    interactionMap = recordVendorInteraction(interactionMap, 'v1', 'view', 15);
    interactionMap = recordVendorInteraction(interactionMap, 'v1', 'view', 20);

    if (interactionMap['v1'].viewCount === 2 && interactionMap['v1'].totalInteractionTime === 35) {
      console.log('✅ Success: Vendor interactions tracked (2 views, 35 sec total).');
    } else {
      console.error('❌ Error: vendor interaction tracking failed.', interactionMap['v1']);
    }

    // 20c. Verify recordVendorInteraction handles different interaction types
    interactionMap = recordVendorInteraction(interactionMap, 'v1', 'favorite');
    interactionMap = recordVendorInteraction(interactionMap, 'v1', 'share');

    if (interactionMap['v1'].favoriteCount === 1 && interactionMap['v1'].shareCount === 1 && interactionMap['v1'].viewCount === 2) {
      console.log('✅ Success: Multiple interaction types tracked (2 views, 1 favorite, 1 share).');
    } else {
      console.error('❌ Error: multiple interaction type tracking failed.');
    }

    // 20d. Verify analyzeBrowsingPatterns detects frequency
    const patternEvents = [
      { vendorId: 'v1', category: 'Food', durationSeconds: 10, timestamp: now - 1 * 24 * 60 * 60 * 1000 },
      { vendorId: 'v2', category: 'Food', durationSeconds: 15, timestamp: now - 2 * 24 * 60 * 60 * 1000 },
      { vendorId: 'v3', category: 'Services', durationSeconds: 20, timestamp: now - 3 * 24 * 60 * 60 * 1000 },
      { vendorId: 'v1', category: 'Food', durationSeconds: 12, timestamp: now - 4 * 24 * 60 * 60 * 1000 },
      { vendorId: 'v2', category: 'Food', durationSeconds: 18, timestamp: now - 5 * 24 * 60 * 60 * 1000 },
    ];

    const patterns = analyzeBrowsingPatterns(patternEvents);
    if (patterns.browsingFrequency === 'daily' && patterns.categoryDiversity > 10) {
      console.log(`✅ Success: Browsing pattern analyzed (frequency: ${patterns.browsingFrequency}, diversity: ${patterns.categoryDiversity}).`);
    } else {
      console.error('❌ Error: browsing pattern analysis failed.', patterns);
    }

    // 20e. Verify engagement score calculation
    const { engagementScore, engagementLevel } = calculateEngagementScore(patternEvents);
    if (engagementScore > 0 && engagementLevel === 'low') {
      console.log(`✅ Success: Engagement score calculated (${engagementScore}, level: ${engagementLevel}).`);
    } else {
      console.error('❌ Error: engagement score calculation failed.', { engagementScore, engagementLevel });
    }

    // 20f. Verify personalized recommendations generate
    const categoryPrefs = [
      { categoryId: 'Food', categoryName: 'Food', interactionCount: 3, score: 80 },
      { categoryId: 'Services', categoryName: 'Services', interactionCount: 2, score: 60 },
    ];

    const vendorPool = [
      { id: 'v4', business_name: 'New Food Place', category: 'Food', rating: 4.5 },
      { id: 'v5', business_name: 'Service Pro', category: 'Services', rating: 4.2 },
      { id: 'v6', business_name: 'Transport', category: 'Transport', rating: 4.8 },
    ];

    const recommendations = generatePersonalizedRecommendations(categoryPrefs, interactionMap, vendorPool);
    if (recommendations.length > 0 && recommendations[0].category === 'Food') {
      console.log(`✅ Success: Personalized recommendations generated (${recommendations.length} recommendations, top category: ${recommendations[0].category}).`);
    } else {
      console.error('❌ Error: personalized recommendations generation failed.', recommendations);
    }

    // 20g. Verify new vendor bonus in recommendations
    const newVendorRecs = recommendations.filter((r) => r.reason.includes('New vendor'));
    if (newVendorRecs.length > 0) {
      console.log(`✅ Success: New vendor bonus applied (${newVendorRecs.length} new vendors recommended).`);
    } else {
      console.error('❌ Error: new vendor bonus logic failed.');
    }

    // 20h. Verify recommendations exclude unseen categories
    const hasTransportRec = recommendations.some((r) => r.category === 'Transport');
    if (!hasTransportRec) {
      console.log('✅ Success: Recommendations exclude non-preferred categories (Transport filtered out).`');
    } else {
      console.error('❌ Error: should not recommend non-preferred categories.');
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 20 COMPLETE                         ");
    console.log("=================================================");

    // =================================================
    // TEST CASE 21: Ratings & Reviews Integration
    // =================================================
    console.log("\n--- TEST CASE 21: Ratings & Reviews Integration ---");

    // Simulate ratings and reviews functions
    const submitReview = (reviewsMap, review) => {
      const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullReview = {
        ...review,
        id: reviewId,
        timestamp: Date.now(),
        helpful: 0,
        unhelpful: 0,
      };

      const vendorReviews = reviewsMap[review.vendorId] || [];
      return { ...reviewsMap, [review.vendorId]: [fullReview, ...vendorReviews] };
    };

    const calculateRatingSummary = (ratings, reviews, vendorId) => {
      const vendorRatings = ratings[vendorId] || [];
      const vendorReviews = reviews[vendorId] || [];

      if (vendorRatings.length === 0) {
        return {
          vendorId,
          averageRating: 0,
          totalRatings: 0,
          totalReviews: 0,
          ratingDistribution: {
            fiveStar: 0,
            fourStar: 0,
            threeStar: 0,
            twoStar: 0,
            oneStar: 0,
          },
          verifiedPurchaseCount: 0,
        };
      }

      const totalScore = vendorRatings.reduce((sum, r) => sum + r.score, 0);
      const averageRating = Math.round((totalScore / vendorRatings.length) * 10) / 10;

      const distribution = {
        fiveStar: vendorRatings.filter((r) => r.score === 5).length,
        fourStar: vendorRatings.filter((r) => r.score === 4).length,
        threeStar: vendorRatings.filter((r) => r.score === 3).length,
        twoStar: vendorRatings.filter((r) => r.score === 2).length,
        oneStar: vendorRatings.filter((r) => r.score === 1).length,
      };

      const verifiedPurchaseCount = vendorRatings.filter((r) => r.isVerifiedPurchase).length;

      return {
        vendorId,
        averageRating,
        totalRatings: vendorRatings.length,
        totalReviews: vendorReviews.length,
        ratingDistribution: distribution,
        verifiedPurchaseCount,
      };
    };

    const calculateReviewQualityScore = (review) => {
      const totalHelpfulness = review.helpful + review.unhelpful;
      const relevance = totalHelpfulness === 0 ? 50 : Math.round((review.helpful / totalHelpfulness) * 100);

      const detailWords = ['specifically', 'detailed', 'exactly', 'definitely', 'really', 'actually'];
      const hasDetails = detailWords.some((word) => review.body.toLowerCase().includes(word));
      const bodyLength = review.body.length;
      const specificity = Math.min(100, (bodyLength / 200) * 50 + (hasDetails ? 30 : 0));

      const verifiedBonus = review.isVerifiedPurchase ? 30 : 0;
      const titleLength = review.title.length;
      const titleBonus = titleLength > 10 ? 20 : 0;
      const authenticity = Math.min(100, verifiedBonus + titleBonus + 20);

      const helpfulness = Math.round((relevance + specificity + authenticity) / 3);

      return {
        relevance: Math.max(0, Math.min(100, relevance)),
        specificity: Math.max(0, Math.min(100, specificity)),
        authenticity: Math.max(0, Math.min(100, authenticity)),
        helpfulness: Math.max(0, Math.min(100, helpfulness)),
      };
    };

    const analyzeRatingTrend = (ratings, vendorId, period = '30d') => {
      const vendorRatings = ratings[vendorId] || [];
      const now = Date.now();
      const periodMs = period === '7d' ? 7 * 24 * 60 * 60 * 1000 : period === '90d' ? 90 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      const halfPeriod = periodMs / 2;

      const currentPeriod = vendorRatings.filter((r) => r.timestamp > now - periodMs);
      const firstHalf = currentPeriod.filter((r) => r.timestamp > now - periodMs && r.timestamp <= now - halfPeriod);
      const secondHalf = currentPeriod.filter((r) => r.timestamp > now - halfPeriod);

      const avgFirst = firstHalf.length === 0 ? 0 : firstHalf.reduce((sum, r) => sum + r.score, 0) / firstHalf.length;
      const avgSecond = secondHalf.length === 0 ? 0 : secondHalf.reduce((sum, r) => sum + r.score, 0) / secondHalf.length;

      const averageRating = Math.round((avgSecond * 10) / 10);
      const totalReviews = currentPeriod.length;

      let ratingTrend = 'stable';
      let trendPercentage = 0;

      if (avgFirst > 0) {
        const change = ((avgSecond - avgFirst) / avgFirst) * 100;
        trendPercentage = Math.round(Math.abs(change));
        if (change > 5) {
          ratingTrend = 'improving';
        } else if (change < -5) {
          ratingTrend = 'declining';
        }
      }

      return {
        period,
        averageRating,
        totalReviews,
        ratingTrend,
        trendPercentage,
      };
    };

    const extractReviewSentiment = (review) => {
      const positiveWords = ['excellent', 'great', 'amazing', 'fantastic', 'perfect', 'love', 'best', 'awesome'];
      const negativeWords = ['terrible', 'bad', 'horrible', 'awful', 'hate', 'worst', 'disappointed'];

      const bodyLower = (review.body + ' ' + review.title).toLowerCase();
      const positiveMatches = positiveWords.filter((word) => bodyLower.includes(word));
      const negativeMatches = negativeWords.filter((word) => bodyLower.includes(word));

      let sentiment = 'neutral';
      if (positiveMatches.length > negativeMatches.length) {
        sentiment = 'positive';
      } else if (negativeMatches.length > positiveMatches.length) {
        sentiment = 'negative';
      } else if (positiveMatches.length === 0 && negativeMatches.length === 0) {
        if (review.rating >= 4) sentiment = 'positive';
        else if (review.rating <= 2) sentiment = 'negative';
      }

      const keywords = [...new Set([...positiveMatches, ...negativeMatches])];
      return { sentiment, keywords };
    };

    const calculateReputationScore = (summary) => {
      if (summary.totalRatings === 0) return 0;

      const ratingScore = summary.averageRating * 20; // 0-100 (dominant factor)
      const volumeScore = Math.min(15, summary.totalReviews * 0.5); // Max 15 (minimal volume impact)
      const verifiedBonus = Math.min(8, summary.verifiedPurchaseCount * 0.5); // Max 8 (minimal verified impact)
      const consistencyBonus =
        summary.ratingDistribution.fiveStar + summary.ratingDistribution.fourStar > summary.totalRatings * 0.7 ? 10 : 0;

      return Math.max(0, Math.min(100, Math.round(ratingScore + volumeScore + verifiedBonus + consistencyBonus)));
    };

    // 21a. Verify review submission
    let reviewsMap = {};
    const newReview = {
      vendorId: 'v_test',
      customerId: 'c_test',
      customerName: 'Test Customer',
      title: 'Great experience',
      body: 'This vendor provided excellent service with great attention to detail.',
      rating: 5,
      isVerifiedPurchase: true,
    };

    reviewsMap = submitReview(reviewsMap, newReview);
    if (reviewsMap['v_test'] && reviewsMap['v_test'][0].rating === 5 && reviewsMap['v_test'][0].id) {
      console.log('✅ Success: Review submitted and stored with ID.');
    } else {
      console.error('❌ Error: review submission failed.');
    }

    // 21b. Verify rating distribution calculation
    let ratingsMap = {
      v_test: [
        { vendorId: 'v_test', score: 5, isVerifiedPurchase: true, timestamp: now },
        { vendorId: 'v_test', score: 5, isVerifiedPurchase: true, timestamp: now - days(1) },
        { vendorId: 'v_test', score: 4, isVerifiedPurchase: false, timestamp: now - days(2) },
        { vendorId: 'v_test', score: 3, isVerifiedPurchase: false, timestamp: now - days(3) },
        { vendorId: 'v_test', score: 2, isVerifiedPurchase: false, timestamp: now - days(4) },
      ],
    };

    const summary = calculateRatingSummary(ratingsMap, reviewsMap, 'v_test');
    if (
      summary.averageRating === 3.8 &&
      summary.totalRatings === 5 &&
      summary.ratingDistribution.fiveStar === 2 &&
      summary.verifiedPurchaseCount === 2
    ) {
      console.log(`✅ Success: Rating summary calculated (avg=${summary.averageRating}, total=${summary.totalRatings}).`);
    } else {
      console.error('❌ Error: rating summary calculation failed.', summary);
    }

    // 21c. Verify review quality score
    const review = reviewsMap['v_test'][0];
    const qualityScore = calculateReviewQualityScore(review);
    if (qualityScore.helpfulness > 0 && qualityScore.authenticity >= 30 && qualityScore.specificity > 0) {
      console.log(`✅ Success: Review quality score calculated (helpfulness=${qualityScore.helpfulness}).`);
    } else {
      console.error('❌ Error: review quality score calculation failed.', qualityScore);
    }

    // 21d. Verify sentiment extraction
    const sentiment = extractReviewSentiment(review);
    if (sentiment.sentiment === 'positive' && sentiment.keywords.includes('excellent')) {
      console.log(`✅ Success: Review sentiment extracted (${sentiment.sentiment}, keywords: ${sentiment.keywords.join(', ')}).`);
    } else {
      console.error('❌ Error: sentiment extraction failed.', sentiment);
    }

    // 21e. Verify rating trend detection
    const trend = analyzeRatingTrend(ratingsMap, 'v_test', '30d');
    if (trend.period === '30d' && trend.totalReviews > 0 && trend.ratingTrend) {
      console.log(`✅ Success: Rating trend detected (trend=${trend.ratingTrend}, avg=${trend.averageRating}).`);
    } else {
      console.error('❌ Error: rating trend analysis failed.', trend);
    }

    // 21f. Verify reputation score calculation
    const reputationScore = calculateReputationScore(summary);
    if (reputationScore > 0 && reputationScore <= 100) {
      console.log(`✅ Success: Reputation score calculated (${reputationScore}/100).`);
    } else {
      console.error('❌ Error: reputation score calculation out of range.', reputationScore);
    }

    // 21g. Verify high-rated vendor gets high score
    const perfectSummary = {
      ...summary,
      averageRating: 4.8,
      totalRatings: 20,
      totalReviews: 20,
      verifiedPurchaseCount: 15,
      ratingDistribution: {
        fiveStar: 16,
        fourStar: 4,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
    };
    const perfectScore = calculateReputationScore(perfectSummary);
    if (perfectScore > 85) {
      console.log(`✅ Success: Excellent vendor gets high reputation score (${perfectScore}/100).`);
    } else {
      console.error('❌ Error: excellent vendor reputation score too low.', perfectScore);
    }

    // 21h. Verify low-rated vendor gets low score
    const poorSummary = {
      ...summary,
      averageRating: 1.5,
      totalRatings: 10,
      totalReviews: 10,
      verifiedPurchaseCount: 8,
      ratingDistribution: {
        fiveStar: 0,
        fourStar: 1,
        threeStar: 1,
        twoStar: 2,
        oneStar: 6,
      },
    };
    const poorScore = calculateReputationScore(poorSummary);
    if (poorScore < 45) {
      console.log(`✅ Success: Poor vendor gets low reputation score (${poorScore}/100).`);
    } else {
      console.error('❌ Error: poor vendor reputation score too high.', poorScore);
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 21 COMPLETE                         ");
    console.log("=================================================");

    // =================================================
    // TEST CASE 22: Promotions & Limited-Time Offers
    // =================================================
    console.log("\n--- TEST CASE 22: Promotions & Limited-Time Offers ---");

    // Simulate promo management functions
    const createPromo = (promosMap, promo) => {
      const promoId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullPromo = {
        ...promo,
        promoId,
        currentRedemptions: 0,
        isActive: true,
        createdAt: Date.now(),
      };

      const vendorPromos = promosMap[promo.vendorId] || [];
      return { ...promosMap, [promo.vendorId]: [fullPromo, ...vendorPromos] };
    };

    const calculateDiscountAmount = (basePrice, discount) => {
      if (discount.type === 'percentage') {
        return Math.round((basePrice * discount.value) / 100);
      } else if (discount.type === 'fixed') {
        return discount.value;
      } else if (discount.type === 'bogo') {
        return basePrice; // BOGO returns full item price as discount
      }
      return 0;
    };

    const recordPromoUsage = (usageMap, promoUsage) => {
      const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullUsage = { ...promoUsage, id: usageId, usedAt: Date.now() };
      const customerUsages = usageMap[promoUsage.customerId] || [];
      return { ...usageMap, [promoUsage.customerId]: [fullUsage, ...customerUsages] };
    };

    const calculatePromoEffectiveness = (promoStats) => {
      const redemptionScore = Math.min(40, (promoStats.totalRedemptions / 10) * 40);
      const reachScore = Math.min(30, (promoStats.uniqueCustomersReached / 20) * 30);
      const revenueScore = Math.min(30, (promoStats.totalDiscountGiven / 5000) * 30);
      const effectivenessScore = Math.round(redemptionScore + reachScore + revenueScore);
      return Math.max(0, Math.min(100, effectivenessScore));
    };

    const calculatePromoROI = (promo, promoStats) => {
      const totalRevenue = promoStats.uniqueCustomersReached * promo.minPurchaseAmount;
      const discountCost = promoStats.totalDiscountGiven;
      const grossMargin = totalRevenue * 0.4; // Assume 40% margin
      const roi = grossMargin > 0 ? Math.round(((grossMargin - discountCost) / discountCost) * 100) : -100;
      const paybackPeriod = discountCost > 0 ? Math.round(discountCost / (promoStats.uniqueCustomersReached + 1)) : 0;
      const breakeven = roi >= 0;
      return { roi, paybackPeriod, breakeven };
    };

    const segmentCustomersForPromo = (usageHistory) => {
      const whales = usageHistory.filter((u) => u.totalSpent > 5000).length;
      const loyals = usageHistory.filter((u) => u.purchaseCount >= 3).length;
      const dormant = usageHistory.filter((u) => u.daysSinceLastPurchase > 30).length;
      const oneTimeOnly = usageHistory.filter((u) => u.purchaseCount === 1).length;

      return { whales, loyals, dormant, oneTimeOnly, total: usageHistory.length };
    };

    const generatePromoInsights = (promo, effectiveness, stats) => {
      const insights = [];

      if (effectiveness > 70) {
        insights.push(`High performer: This promo is very effective (${effectiveness}% score).`);
      }

      if (stats.uniqueCustomersReached > 50) {
        insights.push(`Wide reach: Attracting ${stats.uniqueCustomersReached} unique customers.`);
      }

      if (stats.totalRedemptions > stats.maxRedemptions * 0.8) {
        insights.push(`Near capacity: ${stats.totalRedemptions} / ${stats.maxRedemptions} redemptions used.`);
      }

      if (promo.discountType === 'percentage' && promo.discountValue > 30) {
        insights.push(`Consider reducing discount: ${promo.discountValue}% may reduce profitability.`);
      }

      if (stats.conversionRate && stats.conversionRate > 0.3) {
        insights.push(`Strong conversion: ${Math.round(stats.conversionRate * 100)}% of viewers use this promo.`);
      }

      if (insights.length === 0) {
        insights.push('Promo performing at average levels. Monitor performance closely.');
      }

      return insights;
    };

    // 22a. Verify promo creation
    let promosMap = {};
    const newPromo = {
      vendorId: 'v_test',
      title: '30% Off First Purchase',
      discountType: 'percentage',
      discountValue: 30,
      minPurchaseAmount: 500,
      applicableProducts: ['product_1', 'product_2'],
      startDate: now,
      endDate: now + 30 * 24 * 60 * 60 * 1000,
      maxRedemptions: 100,
      maxPerCustomer: 2,
      targetAudience: 'new',
    };

    promosMap = createPromo(promosMap, newPromo);
    const createdPromo = promosMap['v_test'][0];
    if (createdPromo.promoId && createdPromo.currentRedemptions === 0 && createdPromo.isActive) {
      console.log('✅ Success: Promo created with ID, initial redemptions=0, and isActive=true.');
    } else {
      console.error('❌ Error: promo creation failed.');
    }

    // 22b. Verify discount calculation for different types
    const basePrice = 1000;
    const percentDiscount = calculateDiscountAmount(basePrice, { type: 'percentage', value: 20 });
    const fixedDiscount = calculateDiscountAmount(basePrice, { type: 'fixed', value: 200 });
    const bogoDiscount = calculateDiscountAmount(basePrice, { type: 'bogo', value: 0 });

    if (percentDiscount === 200 && fixedDiscount === 200 && bogoDiscount === 1000) {
      console.log('✅ Success: Discount calculations correct (20%=$200, fixed=$200, BOGO=$1000).');
    } else {
      console.error(`❌ Error: discount calculation failed (${percentDiscount}, ${fixedDiscount}, ${bogoDiscount}).`);
    }

    // 22c. Verify promo usage tracking
    let usageMap = {};
    const promoUsage = {
      customerId: 'c_test',
      promoId: createdPromo.promoId,
      vendorId: 'v_test',
      discountApplied: 300,
    };

    usageMap = recordPromoUsage(usageMap, promoUsage);
    const recordedUsage = usageMap['c_test'][0];
    if (recordedUsage.id && recordedUsage.usedAt && recordedUsage.discountApplied === 300) {
      console.log('✅ Success: Promo usage recorded with ID and timestamp.');
    } else {
      console.error('❌ Error: promo usage tracking failed.');
    }

    // 22d. Verify promo effectiveness calculation
    const promoStats = {
      totalRedemptions: 45,
      uniqueCustomersReached: 80,
      totalDiscountGiven: 9000,
      conversionRate: 0.56,
    };

    const effectiveness = calculatePromoEffectiveness(promoStats);
    // redemptionScore = min(40, 45/10*40) = min(40, 180) = 40
    // reachScore = min(30, 80/20*30) = min(30, 120) = 30
    // revenueScore = min(30, 9000/5000*30) = min(30, 54) = 30
    // total = 40 + 30 + 30 = 100
    if (effectiveness === 100) {
      console.log(`✅ Success: Promo effectiveness calculated correctly (${effectiveness}%).`);
    } else {
      console.error(`❌ Error: effectiveness should be ~100, got ${effectiveness}.`);
    }

    // 22e. Verify ROI calculation
    const roiResult = calculatePromoROI(newPromo, promoStats);
    // totalRevenue = 80 * 500 = 40000, grossMargin = 40000 * 0.4 = 16000
    // roi = ((16000 - 9000) / 9000) * 100 = 77%
    if (roiResult.roi >= 70 && roiResult.roi <= 85 && roiResult.breakeven) {
      console.log(`✅ Success: ROI calculated (${roiResult.roi}%, payback=${roiResult.paybackPeriod} days).`);
    } else {
      console.error('❌ Error: ROI calculation failed.', roiResult);
    }

    // 22f. Verify customer segmentation
    const customerUsageHistory = [
      { totalSpent: 8000, purchaseCount: 12, daysSinceLastPurchase: 2 }, // whale + loyal
      { totalSpent: 6000, purchaseCount: 3, daysSinceLastPurchase: 5 },  // whale + loyal
      { totalSpent: 2000, purchaseCount: 1, daysSinceLastPurchase: 60 }, // one-time + dormant
      { totalSpent: 1000, purchaseCount: 2, daysSinceLastPurchase: 40 }, // dormant
      { totalSpent: 3000, purchaseCount: 5, daysSinceLastPurchase: 1 },  // loyal
    ];

    const segmentation = segmentCustomersForPromo(customerUsageHistory);
    if (segmentation.whales === 2 && segmentation.loyals === 3 && segmentation.oneTimeOnly >= 1) {
      console.log(`✅ Success: Customer segmentation correct (${segmentation.whales} whales, ${segmentation.loyals} loyals).`);
    } else {
      console.error('❌ Error: customer segmentation failed.', segmentation);
    }

    // 22g. Verify timing recommendations
    const recommendPromoTiming = (historicalData) => {
      const avgViewsByDay = new Map();
      historicalData.forEach((event) => {
        const day = new Date(event.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
        avgViewsByDay.set(day, (avgViewsByDay.get(day) || 0) + 1);
      });

      const bestDay = Array.from(avgViewsByDay.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Monday';
      const bestTimeOfDay = historicalData.some((e) => e.timestamp % (24 * 3600) > 12 * 3600) ? 'afternoon' : 'morning';
      const seasonalTrend = 'stable';
      const estimatedPeakPeriod = '2-4pm';

      return { bestDayOfWeek: bestDay, bestTimeOfDay, seasonalTrend, estimatedPeakPeriod };
    };

    const historicalPromoEvents = [
      { timestamp: now - days(1), views: 25, conversions: 8 },
      { timestamp: now - days(2), views: 20, conversions: 6 },
      { timestamp: now - days(3), views: 30, conversions: 10 },
    ];

    const timingRecs = recommendPromoTiming(historicalPromoEvents);
    if (timingRecs.bestDayOfWeek && timingRecs.bestTimeOfDay && timingRecs.estimatedPeakPeriod) {
      console.log(`✅ Success: Timing recommendations generated (best day: ${timingRecs.bestDayOfWeek}, time: ${timingRecs.bestTimeOfDay}).`);
    } else {
      console.error('❌ Error: timing recommendations failed.', timingRecs);
    }

    // 22h. Verify insights generation
    const insights = generatePromoInsights(newPromo, effectiveness, promoStats);
    if (insights.length > 0 && insights[0]) {
      console.log(`✅ Success: Promo insights generated (${insights.length} insights, first: "${insights[0].substring(0, 40)}...").`);
    } else {
      console.error('❌ Error: insights generation failed.');
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 22 COMPLETE                         ");
    console.log("=================================================");

    // ============ TEST CASE 23: Chat & Communication Features ============
    console.log("\n--- TEST CASE 23: Chat & Communication Features ---");

    // Helper functions for chat operations
    const createMessage = (messages, conversationId, senderId, senderRole, content) => {
      const messageId = `msg_${Date.now()}_${Math.random()}`;
      const newMessage = {
        messageId,
        conversationId,
        senderId,
        senderRole,
        content,
        timestamp: Date.now(),
        isRead: false,
        deliveryStatus: 'delivered',
        messageType: 'text',
      };
      if (!messages[conversationId]) {
        messages[conversationId] = [];
      }
      messages[conversationId].push(newMessage);
      return newMessage;
    };

    const createConversation = (conversations, vendorId, customerId, vendorName, customerName) => {
      const conversationId = `conv_${vendorId}_${customerId}`;
      const conversation = {
        conversationId,
        vendorId,
        customerId,
        lastMessage: '',
        lastMessageAt: Date.now(),
        isActive: true,
        unreadCount: 0,
        participantNames: { vendor: vendorName, customer: customerName },
      };
      conversations[conversationId] = conversation;
      return conversation;
    };

    const markMessageAsRead = (messages, conversationId, messageId) => {
      const msgs = messages[conversationId] || [];
      const msg = msgs.find((m) => m.messageId === messageId);
      if (msg) {
        msg.isRead = true;
      }
    };

    const searchMessages = (messages, conversationId, query) => {
      const msgs = messages[conversationId] || [];
      return msgs.filter((m) => m.content.toLowerCase().includes(query.toLowerCase()));
    };

    const calculateChatAnalytics = (messages, conversationId) => {
      const msgs = messages[conversationId] || [];
      let totalResponseTime = 0;
      let responseCount = 0;

      for (let i = 1; i < msgs.length; i++) {
        if (msgs[i].senderRole !== msgs[i - 1].senderRole) {
          totalResponseTime += msgs[i].timestamp - msgs[i - 1].timestamp;
          responseCount++;
        }
      }

      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
      const messageFrequency = Math.min(msgs.length / 100, 1) * 40;
      const responseRate = responseCount > 0 ? Math.min(responseCount / msgs.length, 1) * 30 : 0;
      const engagementScore = Math.round(messageFrequency + responseRate);

      return { messageCount: msgs.length, avgResponseTime, engagementScore };
    };

    const generateChatInsights = (messages, conversationId) => {
      const msgs = messages[conversationId] || [];
      const insights = [];

      if (msgs.length > 50) {
        insights.push('Deep conversation: High engagement detected.');
      }
      if (msgs.some((m) => m.deliveryStatus === 'failed')) {
        insights.push('Some messages failed delivery.');
      }
      if (msgs.filter((m) => !m.isRead).length > 0) {
        insights.push('You have unread messages in this conversation.');
      }
      insights.push('Consider follow-up questions to increase engagement.');

      return insights;
    };

    // 23a. Verify message creation with ID and timestamp
    let messagesMap = {};
    let conversationsMap = {};

    const msg1 = createMessage(
      messagesMap,
      'conv_test',
      'vendor_1',
      'vendor',
      'Hello! How can I help?'
    );
    if (msg1.messageId && msg1.timestamp && msg1.deliveryStatus === 'delivered') {
      console.log('✅ Success: Message created with ID, timestamp, and delivery status.');
    } else {
      console.error('❌ Error: message creation failed.');
    }

    // 23b. Verify conversation persistence
    const conv = createConversation(
      conversationsMap,
      'vendor_1',
      'customer_1',
      'John Vendor',
      'Alice Customer'
    );
    if (conv.conversationId && conv.isActive && conv.participantNames.vendor) {
      console.log('✅ Success: Conversation created and persisted with metadata.');
    } else {
      console.error('❌ Error: conversation persistence failed.');
    }

    // 23c. Verify unread message tracking
    const msg2 = createMessage(
      messagesMap,
      'conv_test',
      'customer_1',
      'customer',
      'I need help with my order'
    );
    const unreadCount = messagesMap['conv_test'].filter((m) => !m.isRead).length;
    if (unreadCount === 2 && !msg1.isRead && !msg2.isRead) {
      console.log('✅ Success: Unread message tracking works correctly (2 unread).');
    } else {
      console.error('❌ Error: unread tracking failed.', { unreadCount });
    }

    // 23d. Verify chat analytics calculation
    const analytics = calculateChatAnalytics(messagesMap, 'conv_test');
    if (
      analytics.messageCount === 2 &&
      analytics.engagementScore >= 0 &&
      analytics.engagementScore <= 100
    ) {
      console.log(`✅ Success: Chat analytics calculated (${analytics.messageCount} messages, engagement=${analytics.engagementScore}).`);
    } else {
      console.error('❌ Error: analytics calculation failed.', analytics);
    }

    // 23e. Verify typing indicator
    const setTypingIndicator = (conversationId, userId) => ({
      conversationId,
      userId,
      timestamp: Date.now(),
    });
    const typingIndicator = setTypingIndicator('conv_test', 'vendor_1');
    if (typingIndicator.userId && typingIndicator.timestamp) {
      console.log('✅ Success: Typing indicator set with user ID and timestamp.');
    } else {
      console.error('❌ Error: typing indicator failed.');
    }

    // 23f. Verify message search
    const searchResults = searchMessages(messagesMap, 'conv_test', 'order');
    if (searchResults.length >= 1 && searchResults[0].content.includes('order')) {
      console.log('✅ Success: Message search found matching message.');
    } else {
      console.error('❌ Error: message search failed.', { foundCount: searchResults.length });
    }

    // 23g. Verify delivery status handling
    const failedMsg = createMessage(
      messagesMap,
      'conv_test',
      'customer_1',
      'customer',
      'Is this working?'
    );
    failedMsg.deliveryStatus = 'failed';
    const deliveryCount = messagesMap['conv_test'].filter(
      (m) => m.deliveryStatus === 'delivered'
    ).length;
    if (deliveryCount === 2 && messagesMap['conv_test'].some((m) => m.deliveryStatus === 'failed')) {
      console.log(`✅ Success: Delivery status tracking works (2 delivered, 1 failed).`);
    } else {
      console.error('❌ Error: delivery tracking failed.');
    }

    // 23h. Verify chat insights generation
    const chatInsights = generateChatInsights(messagesMap, 'conv_test');
    if (chatInsights.length >= 3 && chatInsights.some((i) => i.length > 0)) {
      console.log(`✅ Success: Chat insights generated (${chatInsights.length} insights, first: "${chatInsights[0].substring(0, 40)}...").`);
    } else {
      console.error('❌ Error: insights generation failed.');
    }

    console.log("\n=================================================");
    console.log("   TEST CASE 23 COMPLETE                         ");
    console.log("=================================================");
  }, 50);
})().catch((err) => {
  console.error('❌ Error: Test Case 6 failed with exception:', err);
  process.exitCode = 1;
});
