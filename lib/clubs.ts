import { databases, Query } from '@/lib/appwrite';

export type ClubCoreMember = {
  profile_id: string;
  name: string;
  year?: string;
  role?: string;
  profile_pic?: string;
};

export type Club = {
  id: string;
  name: string;
  description?: string;
  founded_year?: number;
  logo_url?: string;
  faculty_coordinator?: { name?: string; email?: string };
  committee?: { core_team?: ClubCoreMember[] };
  social_links?: { instagram?: string; linkedin?: string; website?: string };
};

export type ClubsResponse = { clubs_and_cells: Club[] };

const databaseId = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || '68c58e83000a2666b4d9';
const associationCollectionId = (process.env.EXPO_PUBLIC_APPWRITE_ASSOCIATION_COLLECTION_ID as string) || 'association';

function safeNumber(val: any): number | undefined {
  const n = typeof val === 'number' ? val : parseInt(String(val ?? ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function fetchClubs(): Promise<ClubsResponse> {
  const apiUrl = process.env.EXPO_PUBLIC_CLUBS_API_URL as string | undefined;
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = (await res.json()) as ClubsResponse;
        if (data && Array.isArray(data.clubs_and_cells)) return data;
      }
    } catch {}
  }
  // Fallback to fetching from Appwrite Association collection and mapping
  const res = await databases.listDocuments(databaseId, associationCollectionId, [
    Query.equal('isActive', true),
    Query.orderAsc('name'),
    Query.limit(200)
  ]);
  const clubs: Club[] = (res.documents || []).map((d: any) => {
    // Prefer explicit fields if present; otherwise derive sensible defaults
    const logo = d.logo_url ?? d.images ?? undefined;
    const founded = d.founded_year ?? d.foundedYear ?? undefined;
    const faculty = d.faculty_coordinator ?? d.facultyCoordinator ?? undefined;
    const committee = d.committee ?? undefined;
    const links = d.social_links ?? d.socialLinks ?? undefined;
    return {
      id: d.$id,
      name: d.name,
      description: d.description ?? undefined,
      founded_year: safeNumber(founded),
      logo_url: typeof logo === 'string' ? logo : undefined,
      faculty_coordinator: faculty ?? undefined,
      committee: committee ?? undefined,
      social_links: links ?? undefined,
    } as Club;
  });
  return { clubs_and_cells: clubs };
}
