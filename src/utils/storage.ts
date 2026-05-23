import type {
  User, Venue, Application, VenueRanking,
  HireHistory, HirerDocuments, VendorComment
} from '../types';

export const KEYS = {
  USERS: 'vv_users',
  VENUES: 'vv_venues',
  APPLICATIONS: 'vv_applications',
  RANKINGS: 'vv_rankings',
  HIRE_HISTORY: 'vv_hire_history',
  DOCUMENTS: 'vv_documents',
  CURRENT_USER: 'vv_current_user',
  VENDOR_COMMENTS: 'vv_vendor_comments',
  SEEDED: 'vv_seeded',
} as const;

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// All app data is stored in localStorage as JSON strings.
// This is because no backend data storage was allowed to be utilised.
// Each "table" is a key in localStorage (see KEYS below).
// localStorage has around a 5MB limit, which can corrupt base64 file uploads.

//  Users
export const getUsers = (): User[] => get<User>(KEYS.USERS);
export const saveUsers = (users: User[]) => set(KEYS.USERS, users);
export const addUser = (user: User) => saveUsers([...getUsers(), user]);
export const getUserById = (id: string) => getUsers().find(u => u.id === id);
export const getUserByEmail = (email: string) =>
  getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
export const updateUser = (updated: User) =>
  saveUsers(getUsers().map(u => (u.id === updated.id ? updated : u)));

//  Session
export const getCurrentUserId = (): string | null =>
  localStorage.getItem(KEYS.CURRENT_USER);
export const setCurrentUserId = (id: string) =>
  localStorage.setItem(KEYS.CURRENT_USER, id);
export const clearCurrentUser = () =>
  localStorage.removeItem(KEYS.CURRENT_USER);
export const getCurrentUser = (): User | null => {
  const id = getCurrentUserId();
  return id ? (getUserById(id) ?? null) : null;
};

//  Venues
export const getVenues = (): Venue[] => get<Venue>(KEYS.VENUES);
export const saveVenues = (venues: Venue[]) => set(KEYS.VENUES, venues);
export const addVenue = (venue: Venue) => saveVenues([...getVenues(), venue]);
export const updateVenue = (updated: Venue) =>
  saveVenues(getVenues().map(v => (v.id === updated.id ? updated : v)));

// Applications 
export const getApplications = (): Application[] => get<Application>(KEYS.APPLICATIONS);
export const saveApplications = (apps: Application[]) => set(KEYS.APPLICATIONS, apps);
export const addApplication = (app: Application) =>
  saveApplications([...getApplications(), app]);
export const updateApplication = (updated: Application) =>
  saveApplications(getApplications().map(a => (a.id === updated.id ? updated : a)));
export const getApplicationsByHirer = (hirerId: string) =>
  getApplications().filter(a => a.hirerId === hirerId);
export const getApplicationsByVenue = (venueId: string) =>
  getApplications().filter(a => a.venueId === venueId);

// Rankings
export const getRankings = (): VenueRanking[] => get<VenueRanking>(KEYS.RANKINGS);
export const saveRankings = (rankings: VenueRanking[]) => set(KEYS.RANKINGS, rankings);
export const getRankingByHirer = (hirerId: string): VenueRanking | undefined =>
  getRankings().find(r => r.hirerId === hirerId);
export const saveRankingForHirer = (ranking: VenueRanking) => {
  const all = getRankings().filter(r => r.hirerId !== ranking.hirerId);
  saveRankings([...all, ranking]);
};

// Hire History
export const getHireHistory = (): HireHistory[] => get<HireHistory>(KEYS.HIRE_HISTORY);
export const saveHireHistory = (history: HireHistory[]) => set(KEYS.HIRE_HISTORY, history);
export const addHireHistory = (entry: HireHistory) =>
  saveHireHistory([...getHireHistory(), entry]);
export const getHireHistoryByHirer = (hirerId: string) =>
  getHireHistory().filter(h => h.hirerId === hirerId);

// Documents
export const getAllDocuments = (): HirerDocuments[] => get<HirerDocuments>(KEYS.DOCUMENTS);
export const saveAllDocuments = (docs: HirerDocuments[]) => set(KEYS.DOCUMENTS, docs);
export const getDocumentsByHirer = (hirerId: string): HirerDocuments | undefined =>
  getAllDocuments().find(d => d.hirerId === hirerId);
export const saveDocumentsForHirer = (doc: HirerDocuments) => {
  const all = getAllDocuments().filter(d => d.hirerId !== doc.hirerId);
  saveAllDocuments([...all, doc]);
};

// Vendor Comments
export const getVendorComments = (): VendorComment[] => get<VendorComment>(KEYS.VENDOR_COMMENTS);
export const saveVendorComments = (comments: VendorComment[]) =>
  set(KEYS.VENDOR_COMMENTS, comments);
export const addVendorComment = (comment: VendorComment) =>
  saveVendorComments([...getVendorComments(), comment]);
export const getCommentsByHirer = (hirerId: string) =>
  getVendorComments().filter(c => c.hirerId === hirerId);

// Reputation Score
export const getHirerReputation = (hirerId: string): number => {
  const history = getHireHistoryByHirer(hirerId);
  if (history.length === 0) return 0;
  const avg = history.reduce((sum, h) => sum + h.rating, 0) / history.length;
  return Math.round(avg * 10) / 10;
};

// Credibility Score Auto-Calculation
// Auto-calculates a 0–5 credibility score based on documents submitted.
// Formula: each document is worth an equal share of 5 stars.
// Non-business hirers have 2 possible docs each worth 2.5 stars.
// Business hirers have 3 possible docs each worth ~1.67 stars.
// This means a business applicant needs all 3 docs to reach 5 stars.
const hasValidStoredFile = (fileData?: string, fileName?: string): boolean => {
  if (!fileData || !fileName) return false

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
  const lowerName = fileName.toLowerCase()
  const hasAllowedExtension = allowedExtensions.some(ext => lowerName.endsWith(ext))

  // Base64 strings that are too short usually indicate an empty or invalid upload.
  const hasEnoughContent = fileData.length > 100

  return hasAllowedExtension && hasEnoughContent
}

// Credibility score is calculated from both the presence and quality of submitted documents.
// Validation rules:
// 1. File must exist.
// 2. File name must be present.
// 3. File must use an accepted extension: jpg, jpeg, png, or pdf.
// 4. Stored base64 data must be long enough to avoid empty/blank uploads.
// 5. Business applicants must provide an extra business certificate to reach full credibility.
export const calcCredibilityScore = (doc: Partial<HirerDocuments>): number => {
  let validDocumentCount = 0

  const isBusinessApplicant = doc.isBusinessApplicant ?? false
  const requiredDocumentCount = isBusinessApplicant ? 3 : 2
  const pointsPerDocument = 5 / requiredDocumentCount

  if (hasValidStoredFile(doc.driverLicenseData, doc.driverLicenseName)) {
    validDocumentCount += 1
  }

  if (hasValidStoredFile(doc.publicLiabilityData, doc.publicLiabilityName)) {
    validDocumentCount += 1
  }

  if (
    isBusinessApplicant &&
    hasValidStoredFile(doc.businessCertData, doc.businessCertName)
  ) {
    validDocumentCount += 1
  }

  const score = validDocumentCount * pointsPerDocument

  return Math.round(Math.min(score, 5) * 10) / 10
}

// Seeding Flag
export const isSeeded = (): boolean =>
  localStorage.getItem(KEYS.SEEDED) === 'true';
export const markSeeded = () => localStorage.setItem(KEYS.SEEDED, 'true');

// Unique ID Generator
export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);
