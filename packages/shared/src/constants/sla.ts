import { ComplaintCategory } from "./categories";

export interface DepartmentConfig {
  code: string;
  name: string;
  slaHours: number;
  categories: ComplaintCategory[];
  description: string;
}

export const DEFAULT_DEPARTMENTS: DepartmentConfig[] = [
  {
    code: "ROADS",
    name: "Roads & Bridges Department",
    slaHours: 48,
    categories: ["POTHOLE", "BAD_ROAD"],
    description: "Maintenance of city roads, pavements, potholes, and flyovers",
  },
  {
    code: "SANITATION",
    name: "Solid Waste Management",
    slaHours: 24,
    categories: ["GARBAGE"],
    description: "Garbage disposal, street sweeping, dump yards, and sanitary maintenance",
  },
  {
    code: "ELECTRICAL",
    name: "Electrical & Street Lighting",
    slaHours: 24,
    categories: ["STREETLIGHT"],
    description: "Streetlamps, electrical posts, wiring hazards, and municipal lighting",
  },
  {
    code: "WATER_DRAINAGE",
    name: "Water Supply & Underground Drainage",
    slaHours: 36,
    categories: ["WATER_LEAKAGE", "DRAINAGE"],
    description: "Drinking water distribution pipelines, sewage, and stormwater drains",
  },
];
