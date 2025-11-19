export type MobileScreenContract = {
  id:
    | 'splash'
    | 'auth_login'
    | 'auth_otp'
    | 'onboarding_profile'
    | 'legal_terms'
    | 'home_dashboard'
    | 'mission_today'
    | 'mission_detail'
    | 'tree_overview'
    | 'rewards_overview'
    | 'reward_detail'
    | 'donate_overview'
    | 'donate_flow'
    | 'family_overview'
    | 'profile_overview'
    | 'settings'
    | 'offline';
  route: string;
  domain: string;
  priority: 'P0';
  apis: string[];
  actions: string[];
  stateNotes: string;
  status: 'pending' | 'in_progress' | 'stubbed' | 'done';
};

export const mobileScreenContracts: MobileScreenContract[] = [
  {
    id: 'splash',
    route: '/',
    domain: 'shell',
    priority: 'P0',
    apis: ['/api/mobile/session', '/api/mobile/app-config'],
    actions: ['hydrateSession', 'navigateToAuthOrHome'],
    stateNotes: 'loading, destination; gate keepers for feature flags + tokens',
    status: 'stubbed'
  },
  {
    id: 'auth_login',
    route: '/auth/login',
    domain: 'auth',
    priority: 'P0',
    apis: ['/api/mobile/auth/login', '/api/mobile/auth/config'],
    actions: ['submitCredentials', 'resetPasswordLink'],
    stateNotes: 'email, password, remember me, validation errors, submit status',
    status: 'stubbed'
  },
  {
    id: 'auth_otp',
    route: '/auth/otp',
    domain: 'auth',
    priority: 'P0',
    apis: ['/api/mobile/auth/otp/send', '/api/mobile/auth/otp/verify'],
    actions: ['sendOtp', 'verifyOtp'],
    stateNotes: 'phone, code, countdown timer, request status',
    status: 'stubbed'
  },
  {
    id: 'onboarding_profile',
    route: '/onboarding/profile',
    domain: 'onboarding',
    priority: 'P0',
    apis: ['/api/mobile/profile/template', '/api/mobile/profile'],
    actions: ['saveProfile', 'skipOnboarding'],
    stateNotes: 'name, DOB, goals, timezone, avatar upload status',
    status: 'stubbed'
  },
  {
    id: 'legal_terms',
    route: '/legal/terms',
    domain: 'legal',
    priority: 'P0',
    apis: ['/api/mobile/legal/terms'],
    actions: ['acceptTerms', 'openPrivacyLink'],
    stateNotes: 'markdown fetch status, accept/decline flags',
    status: 'stubbed'
  },
  {
    id: 'home_dashboard',
    route: '/home',
    domain: 'home',
    priority: 'P0',
    apis: ['/api/mobile/dashboard', '/api/mobile/missions/today', '/api/mobile/rewards/summary'],
    actions: ['openMissionChecklist', 'startDonateIntent', 'refreshDashboard'],
    stateNotes: 'cards, streaks, donate CTA state, pending refresh indicator',
    status: 'in_progress'
  },
  {
    id: 'mission_today',
    route: '/missions',
    domain: 'missions',
    priority: 'P0',
    apis: ['/api/mobile/missions/today'],
    actions: ['completeMission', 'refreshMissions'],
    stateNotes: 'checklist rows, filters, toast feedback',
    status: 'in_progress'
  },
  {
    id: 'mission_detail',
    route: '/missions/[id]',
    domain: 'missions',
    priority: 'P0',
    apis: ['/api/mobile/missions/{id}', '/api/mobile/missions/{id}/log'],
    actions: ['completeMission', 'shareMission'],
    stateNotes: 'timeline entries, sponsor metadata, CTA state',
    status: 'in_progress'
  },
  {
    id: 'tree_overview',
    route: '/tree',
    domain: 'tree',
    priority: 'P0',
    apis: ['/api/mobile/tree/state', '/api/mobile/tree/summary'],
    actions: ['openTreeEvents', 'refreshTree'],
    stateNotes: 'energy level, badges, visualization readiness',
    status: 'in_progress'
  },
  {
    id: 'rewards_overview',
    route: '/rewards',
    domain: 'rewards',
    priority: 'P0',
    apis: ['/api/mobile/rewards/catalog', '/api/mobile/rewards/balance'],
    actions: ['openRewardDetail', 'redeemQuickAction'],
    stateNotes: 'wallet balance, catalog grid, featured sponsor state',
    status: 'in_progress'
  },
  {
    id: 'reward_detail',
    route: '/rewards/[id]',
    domain: 'rewards',
    priority: 'P0',
    apis: ['/api/mobile/rewards/{id}', '/api/mobile/rewards/balance'],
    actions: ['redeemReward', 'shareReward'],
    stateNotes: 'redeem CTA disabled state, terms acceptance, success modal',
    status: 'in_progress'
  },
  {
    id: 'donate_overview',
    route: '/donate',
    domain: 'donate',
    priority: 'P0',
    apis: ['/api/mobile/donate/options', '/api/mobile/donate/summary'],
    actions: ['startDonateIntent', 'openDonateFlow'],
    stateNotes: 'history snippet, provider availability, CTA gating',
    status: 'in_progress'
  },
  {
    id: 'donate_flow',
    route: '/donate/do',
    domain: 'donate',
    priority: 'P0',
    apis: ['/api/mobile/donate/intent', '/api/mobile/donate/providers'],
    actions: ['submitDonateIntent', 'trackDonateStatus'],
    stateNotes: 'stepper progress, provider selection, VNPay/MoMo redirect data',
    status: 'in_progress'
  },
  {
    id: 'family_overview',
    route: '/family',
    domain: 'family',
    priority: 'P0',
    apis: ['/api/mobile/family', '/api/mobile/family/invites'],
    actions: ['openInvite', 'viewFamilyMember'],
    stateNotes: 'member list, pending invite count, empty states',
    status: 'in_progress'
  },
  {
    id: 'profile_overview',
    route: '/profile',
    domain: 'profile',
    priority: 'P0',
    apis: ['/api/mobile/profile', '/api/mobile/profile/preferences'],
    actions: ['editProfile', 'openSettings'],
    stateNotes: 'avatar, badges, quick link states',
    status: 'in_progress'
  },
  {
    id: 'settings',
    route: '/settings',
    domain: 'settings',
    priority: 'P0',
    apis: [],
    actions: ['togglePreferences', 'logout'],
    stateNotes: 'notifications + AI toggles, account info, logout CTA',
    status: 'in_progress'
  },
  {
    id: 'offline',
    route: '/offline',
    domain: 'system',
    priority: 'P0',
    apis: [],
    actions: ['retryConnection', 'openSupportLink'],
    stateNotes: 'network probe state, last offline timestamp',
    status: 'in_progress'
  }
];
