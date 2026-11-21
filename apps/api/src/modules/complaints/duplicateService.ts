import { complaintRepository } from "./complaintRepository";
import { haversineDistanceMeters } from "../../utils/haversine";
import { ComplaintCategory } from "@civicresolve/shared";

export interface DuplicateMatch {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  category: string;
  status: string;
  distanceMeters: number;
  supportCount: number;
  imageUrl?: string | null;
  createdAt: Date;
}

/**
 * Duplicate Complaint Detector.
 * Finds any open complaints within a given radius (default 100 meters) matching category.
 */
export async function findNearbyDuplicates(params: {
  lat: number;
  lng: number;
  radiusMeters?: number;
  category?: ComplaintCategory;
}): Promise<DuplicateMatch[]> {
  const { lat, lng, radiusMeters = 100, category } = params;

  // Spatial bounding-box query using lat/lng index
  const openComplaints = await complaintRepository.findOpenComplaintsNearby({
    lat,
    lng,
    radiusMeters,
    category,
  });

  const duplicates: DuplicateMatch[] = [];

  for (const c of openComplaints) {
    const dist = haversineDistanceMeters(lat, lng, c.lat, c.lng);
    if (dist <= radiusMeters) {
      duplicates.push({
        id: c.id,
        trackingCode: c.trackingCode,
        title: c.title,
        description: c.description,
        category: c.category,
        status: c.status,
        distanceMeters: dist,
        supportCount: c.supportCount,
        imageUrl: c.imageUrl,
        createdAt: c.createdAt,
      });
    }
  }

  // Sort by closest distance first
  return duplicates.sort((a, b) => a.distanceMeters - b.distanceMeters);
}
