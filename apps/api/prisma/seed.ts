import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { COIMBATORE_POIS } from "@civicresolve/shared";

const prisma = new PrismaClient();

// Helper to calculate distance in meters (Haversine formula)
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function calculatePoiScore(lat: number, lng: number) {
  let minDistance = Infinity;
  let nearestPoi = "";

  for (const poi of COIMBATORE_POIS) {
    const dist = haversineDistanceMeters(lat, lng, poi.lat, poi.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestPoi = poi.name;
    }
  }

  let poiProximityScore = 0;
  if (minDistance <= 200) poiProximityScore = 25;
  else if (minDistance <= 500) poiProximityScore = 15;
  else if (minDistance <= 1000) poiProximityScore = 5;

  return { poiProximityScore, nearestPoi, minDistance };
}

async function main() {
  console.info("🌱 Starting database seed...");

  // 1. Clean existing records in cascade order
  await prisma.complaintSupport.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users (Admin & Citizen)
  const passwordHash = await bcrypt.hash("Admin@123", 10);
  const citizenPasswordHash = await bcrypt.hash("Citizen@123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@civicresolve.gov.in",
      fullName: "City Commissioner Office",
      passwordHash,
      role: "ADMIN",
    },
  });

  const citizen = await prisma.user.create({
    data: {
      email: "citizen@civicresolve.org",
      fullName: "Kavitha Sundaram",
      passwordHash: citizenPasswordHash,
      role: "CITIZEN",
    },
  });

  console.info(`✓ Users seeded: Admin (${admin.email}), Citizen (${citizen.email})`);

  // 3. Create Departments
  const departmentsData = [
    {
      code: "ROADS",
      name: "Roads & Bridges Department",
      slaHours: 48,
      description: "Maintenance of city roads, pavements, potholes, and flyovers",
    },
    {
      code: "SANITATION",
      name: "Solid Waste Management",
      slaHours: 24,
      description: "Garbage disposal, street sweeping, dump yards, and sanitary maintenance",
    },
    {
      code: "ELECTRICAL",
      name: "Electrical & Street Lighting",
      slaHours: 24,
      description: "Streetlamps, electrical posts, wiring hazards, and municipal lighting",
    },
    {
      code: "WATER_DRAINAGE",
      name: "Water Supply & Underground Drainage",
      slaHours: 36,
      description: "Drinking water distribution pipelines, sewage, and stormwater drains",
    },
  ];

  const depts: Record<string, { id: string; slaHours: number }> = {};
  for (const d of departmentsData) {
    const dept = await prisma.department.create({ data: d });
    depts[d.code] = { id: dept.id, slaHours: dept.slaHours };
  }
  console.info("✓ Departments seeded");

  // 4. Seed 40 Complaints around Coimbatore
  const sampleComplaints = [
    {
      title: "Massive crater pothole causing vehicle skid",
      description:
        "A deep 2-foot pothole near PSG Tech bus stop on Avinashi Road. Two two-wheelers already lost balance this morning.",
      category: "POTHOLE",
      deptCode: "ROADS",
      lat: 11.0245,
      lng: 77.0012,
      address: "Avinashi Road, Near PSG Tech, Peelamedu, Coimbatore",
      priority: "CRITICAL",
      urgency: 30,
      safetyHazard: 25,
      status: "ESCALATED",
      hoursAgo: 60,
    },
    {
      title: "Garbage overflowing from community bin on DB Road",
      description:
        "Waste has piled up onto the pedestrian walkway for 3 days. Stray dogs and foul odor affecting local businesses.",
      category: "GARBAGE",
      deptCode: "SANITATION",
      lat: 11.0112,
      lng: 76.9534,
      address: "D.B. Road, R.S. Puram, Coimbatore",
      priority: "HIGH",
      urgency: 22,
      safetyHazard: 15,
      status: "IN_PROGRESS",
      hoursAgo: 16,
    },
    {
      title: "Series of dark streetlights creating blind spot",
      description:
        "Five consecutive sodium street lamps are unlit on Race Course pedestrian walking loop after 7 PM.",
      category: "STREETLIGHT",
      deptCode: "ELECTRICAL",
      lat: 11.0089,
      lng: 76.9745,
      address: "Race Course Road, Gopalapuram, Coimbatore",
      priority: "MEDIUM",
      urgency: 14,
      safetyHazard: 12,
      status: "REPORTED",
      hoursAgo: 6,
    },
    {
      title: "Potable water pipeline rupture flooding main junction",
      description:
        "Clean municipal drinking water gushing at high pressure from broken underground pipe, eroding road gravel.",
      category: "WATER_LEAKAGE",
      deptCode: "WATER_DRAINAGE",
      lat: 11.0167,
      lng: 76.9612,
      address: "Ram Nagar 2nd Street, Near Ganga Hospital, Coimbatore",
      priority: "HIGH",
      urgency: 22,
      safetyHazard: 18,
      status: "RESOLVED",
      hoursAgo: 40,
    },
    {
      title: "Open stormwater drain slab collapsed",
      description:
        "Heavy cement slab over the storm drain broke down. Foot-deep gap right in front of government school gate.",
      category: "DRAINAGE",
      deptCode: "WATER_DRAINAGE",
      lat: 11.0125,
      lng: 76.9738,
      address: "Opposite Stanes Anglo Indian HSS, Coimbatore",
      priority: "CRITICAL",
      urgency: 30,
      safetyHazard: 25,
      status: "IN_PROGRESS",
      hoursAgo: 12,
    },
    {
      title: "Severely battered asphalt with exposed metal grids",
      description:
        "Entire 200m stretch has disintegrating bitumen, heavy dust and loose pebbles hitting pedestrians.",
      category: "BAD_ROAD",
      deptCode: "ROADS",
      lat: 11.0312,
      lng: 76.9412,
      address: "NSR Road, Saibaba Colony, Coimbatore",
      priority: "MEDIUM",
      urgency: 14,
      safetyHazard: 15,
      status: "REPORTED",
      hoursAgo: 8,
    },
  ];

  // Procedural generator to round up to 40 realistic issues
  const locations = [
    { name: "Gandhipuram Cross Cut Road", lat: 11.0175, lng: 76.9678 },
    { name: "Ukkadam Junction", lat: 10.9892, lng: 76.9621 },
    { name: "Singanallur Bus Stand", lat: 10.9994, lng: 77.0267 },
    { name: "Saravanampatti IT Corridor", lat: 11.0821, lng: 76.9954 },
    { name: "Ganapathy Main Road", lat: 11.0365, lng: 76.9782 },
    { name: "Vadavalli Marudhamalai Road", lat: 11.0248, lng: 76.9082 },
    { name: "Town Hall Big Bazaar", lat: 10.9961, lng: 76.9615 },
    { name: "Puliyakulam Mariamman Kovil Street", lat: 11.0062, lng: 76.9894 },
    { name: "Ramanathapuram Trichy Road", lat: 10.9982, lng: 77.0011 },
    { name: "Kuniyamuthur Palakkad Road", lat: 10.9578, lng: 76.9532 },
    { name: "Thudiyalur Mettupalayam Road", lat: 11.0772, lng: 76.9463 },
    { name: "Kovaipudur Main Circle", lat: 10.9382, lng: 76.9391 },
    { name: "Ondipudur Flyover Ramp", lat: 10.9972, lng: 77.0423 },
    { name: "Hope College Junction", lat: 11.0298, lng: 77.0142 },
    { name: "Hopes - Sitra Airport Road", lat: 11.0345, lng: 77.0298 },
    { name: "Podanur Railway Station Road", lat: 10.9654, lng: 76.9876 },
    { name: "Sundarapuram Kurichi", lat: 10.9512, lng: 76.9723 },
    { name: "Sivananda Colony", lat: 11.0305, lng: 76.9541 },
  ];

  const categoriesConfig = [
    {
      cat: "POTHOLE",
      dept: "ROADS",
      titles: [
        "Dangerous pothole on commute lane",
        "Wheel rim damaged by deep road cavity",
        "Pothole cluster after heavy rains",
      ],
    },
    {
      cat: "GARBAGE",
      dept: "SANITATION",
      titles: [
        "Commercial waste dumped on pavement",
        "Community trash bin overturned",
        "Plastic & organic debris blocking walkway",
      ],
    },
    {
      cat: "STREETLIGHT",
      dept: "ELECTRICAL",
      titles: [
        "Flickering streetlight causing dark patches",
        "Damaged light pole leaning towards road",
        "Non-functional LED street lamp cluster",
      ],
    },
    {
      cat: "WATER_LEAKAGE",
      dept: "WATER_DRAINAGE",
      titles: [
        "Subsurface pipeline burst leaking gallons",
        "Valve leakage creating waterlogged ditch",
        "Drinking water main leaking near bus shelter",
      ],
    },
    {
      cat: "BAD_ROAD",
      dept: "ROADS",
      titles: [
        "Unfinished road trench left without barricades",
        "Sunken road surface after cable laying",
        "Uneven asphalt causing severe vehicular vibration",
      ],
    },
    {
      cat: "DRAINAGE",
      dept: "WATER_DRAINAGE",
      titles: [
        "Sewage overflowing onto roadside during peak hours",
        "Choked silt in drain causing foul backflow",
        "Missing manhole cover on walking lane",
      ],
    },
  ];

  const statuses = ["REPORTED", "IN_PROGRESS", "RESOLVED", "ESCALATED"] as const;
  const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

  let totalCount = 0;

  // Insert explicit sample complaints
  for (let i = 0; i < sampleComplaints.length; i++) {
    const sc = sampleComplaints[i]!;
    const dept = depts[sc.deptCode]!;
    const poi = calculatePoiScore(sc.lat, sc.lng);
    const totalScore = Math.min(100, sc.urgency + sc.safetyHazard + poi.poiProximityScore);
    const trackingCode = `CR-2024-${String(1001 + totalCount).padStart(4, "0")}`;
    const createdAt = new Date(Date.now() - sc.hoursAgo * 3600 * 1000);
    const slaDueAt = new Date(createdAt.getTime() + dept.slaHours * 3600 * 1000);
    const isEscalated = sc.status === "ESCALATED" || Date.now() > slaDueAt.getTime();

    const complaint = await prisma.complaint.create({
      data: {
        trackingCode,
        title: sc.title,
        description: sc.description,
        originalText: sc.description,
        language: "en",
        category: sc.category,
        status: isEscalated && sc.status !== "RESOLVED" ? "ESCALATED" : sc.status,
        priority: sc.priority,
        impactScore: totalScore,
        scoreBreakdown: JSON.stringify({
          urgency: sc.urgency,
          safetyHazard: sc.safetyHazard,
          poiProximity: poi.poiProximityScore,
          nearestPoiName: poi.nearestPoi,
          distanceToPoiMeters: poi.minDistance,
          supportBoost: 0,
          ageBoost: Math.min(10, Math.floor(sc.hoursAgo / 6)),
          total: totalScore,
        }),
        aiReasoning: `Detected ${sc.category.toLowerCase()} with high impact near ${poi.nearestPoi || "urban zone"}.`,
        aiSource: "GEMINI",
        lat: sc.lat,
        lng: sc.lng,
        address: sc.address,
        imageUrl: `/uploads/sample-${sc.category.toLowerCase()}.jpg`,
        afterImageUrl:
          sc.status === "RESOLVED"
            ? `/uploads/sample-${sc.category.toLowerCase()}-after.jpg`
            : null,
        verificationResult:
          sc.status === "RESOLVED"
            ? JSON.stringify({
                verified: true,
                confidence: 0.95,
                reason:
                  "Before and after comparison confirms the issue was completely cleared and rectified.",
              })
            : null,
        supportCount: Math.floor(Math.random() * 5),
        slaDueAt,
        isEscalated: isEscalated && sc.status !== "RESOLVED",
        citizenId: citizen.id,
        departmentId: dept.id,
        createdAt,
      },
    });

    // Add status events
    await prisma.statusEvent.create({
      data: {
        complaintId: complaint.id,
        status: "REPORTED",
        remarks: "Complaint registered by citizen with photo attachment.",
        updatedById: citizen.id,
        createdAt,
      },
    });

    if (sc.status === "IN_PROGRESS" || sc.status === "RESOLVED" || sc.status === "ESCALATED") {
      await prisma.statusEvent.create({
        data: {
          complaintId: complaint.id,
          status: "IN_PROGRESS",
          remarks: "Inspected by field team and assigned to maintenance contractor.",
          updatedById: admin.id,
          createdAt: new Date(createdAt.getTime() + 4 * 3600 * 1000),
        },
      });
    }

    if (sc.status === "RESOLVED") {
      await prisma.statusEvent.create({
        data: {
          complaintId: complaint.id,
          status: "RESOLVED",
          remarks: "Work completed on site and verified by Gemini AI multimodal analysis.",
          updatedById: admin.id,
          createdAt: new Date(createdAt.getTime() + 24 * 3600 * 1000),
        },
      });
    }

    totalCount++;
  }

  // Generate remaining to make at least 40
  while (totalCount < 40) {
    const loc = locations[totalCount % locations.length]!;
    const catGroup = categoriesConfig[totalCount % categoriesConfig.length]!;
    const status: string = statuses[totalCount % statuses.length]!;
    const priority = priorities[totalCount % priorities.length]!;
    const dept = depts[catGroup.dept]!;

    // Slightly randomize coordinates around the location (+- 0.003 deg)
    const lat = loc.lat + (Math.random() - 0.5) * 0.006;
    const lng = loc.lng + (Math.random() - 0.5) * 0.006;
    const poi = calculatePoiScore(lat, lng);

    const urgency =
      priority === "CRITICAL" ? 30 : priority === "HIGH" ? 22 : priority === "MEDIUM" ? 14 : 6;
    const safetyHazard = Math.floor(Math.random() * 15) + 8;
    const hoursAgo = Math.floor(Math.random() * 72) + 2;
    const totalScore = Math.min(100, urgency + safetyHazard + poi.poiProximityScore);
    const trackingCode = `CR-2024-${String(1001 + totalCount).padStart(4, "0")}`;
    const createdAt = new Date(Date.now() - hoursAgo * 3600 * 1000);
    const slaDueAt = new Date(createdAt.getTime() + dept.slaHours * 3600 * 1000);
    const isEscalated =
      status === "ESCALATED" || (Date.now() > slaDueAt.getTime() && status !== "RESOLVED");

    const complaint = await prisma.complaint.create({
      data: {
        trackingCode,
        title: `${catGroup.titles[totalCount % catGroup.titles.length]} near ${loc.name}`,
        description: `Civic issue reported in ${loc.name}. Urgent municipal intervention requested for public convenience and safety.`,
        originalText: `Civic issue reported in ${loc.name}. Urgent municipal intervention requested for public convenience and safety.`,
        language: totalCount % 5 === 0 ? "ta" : totalCount % 7 === 0 ? "hi" : "en",
        category: catGroup.cat,
        status: isEscalated && status !== "RESOLVED" ? "ESCALATED" : status,
        priority,
        impactScore: totalScore,
        scoreBreakdown: JSON.stringify({
          urgency,
          safetyHazard,
          poiProximity: poi.poiProximityScore,
          nearestPoiName: poi.nearestPoi,
          distanceToPoiMeters: poi.minDistance,
          supportBoost: Math.min(10, (totalCount % 5) * 2),
          ageBoost: Math.min(10, Math.floor(hoursAgo / 6)),
          total: totalScore,
        }),
        aiReasoning: `Identified ${catGroup.cat.toLowerCase()} in ${loc.name}. Proximity to ${poi.nearestPoi || "residential hub"} assessed.`,
        aiSource: totalCount % 4 === 0 ? "RULE_BASED" : "GEMINI",
        lat,
        lng,
        address: `${loc.name}, Coimbatore, Tamil Nadu`,
        imageUrl: `/uploads/sample-${catGroup.cat.toLowerCase()}.jpg`,
        afterImageUrl:
          status === "RESOLVED" ? `/uploads/sample-${catGroup.cat.toLowerCase()}-after.jpg` : null,
        verificationResult:
          status === "RESOLVED"
            ? JSON.stringify({
                verified: true,
                confidence: 0.92,
                reason:
                  "Repair work verified. Before and after photo comparison shows the defect is completely resolved.",
              })
            : null,
        supportCount: totalCount % 6,
        slaDueAt,
        isEscalated: isEscalated && status !== "RESOLVED",
        citizenId: totalCount % 3 === 0 ? null : citizen.id, // Some anonymous reports
        departmentId: dept.id,
        createdAt,
      },
    });

    await prisma.statusEvent.create({
      data: {
        complaintId: complaint.id,
        status: "REPORTED",
        remarks: "Citizen grievance submitted.",
        updatedById: citizen.id,
        createdAt,
      },
    });

    if (status === "IN_PROGRESS" || status === "RESOLVED") {
      await prisma.statusEvent.create({
        data: {
          complaintId: complaint.id,
          status: "IN_PROGRESS",
          remarks: "Dispatched municipal crew to the site.",
          updatedById: admin.id,
          createdAt: new Date(createdAt.getTime() + 3 * 3600 * 1000),
        },
      });
    }

    if (status === "RESOLVED") {
      await prisma.statusEvent.create({
        data: {
          complaintId: complaint.id,
          status: "RESOLVED",
          remarks: "Resolved and closed after photo verification.",
          updatedById: admin.id,
          createdAt: new Date(createdAt.getTime() + 18 * 3600 * 1000),
        },
      });
    }

    totalCount++;
  }

  console.info(`✓ Seeded ${totalCount} realistic complaints around Coimbatore!`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
