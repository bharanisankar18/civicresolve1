export interface SensitivePOI {
  name: string;
  type: "HOSPITAL" | "SCHOOL";
  lat: number;
  lng: number;
}

/**
 * Seeded Coimbatore Hospitals and Educational Institutions
 * Latitude approx: 11.00 - 11.04, Longitude approx: 76.94 - 77.02
 */
export const COIMBATORE_POIS: SensitivePOI[] = [
  {
    name: "Coimbatore Medical College Hospital (CMCH)",
    type: "HOSPITAL",
    lat: 11.0016,
    lng: 76.9664,
  },
  {
    name: "PSG Hospitals, Peelamedu",
    type: "HOSPITAL",
    lat: 11.0267,
    lng: 77.0028,
  },
  {
    name: "Ganga Hospital, Ram Nagar",
    type: "HOSPITAL",
    lat: 11.0183,
    lng: 76.9587,
  },
  {
    name: "KMCH (Kovai Medical Center & Hospital)",
    type: "HOSPITAL",
    lat: 11.0475,
    lng: 77.0378,
  },
  {
    name: "Stanes Anglo Indian Higher Secondary School",
    type: "SCHOOL",
    lat: 11.0118,
    lng: 76.9735,
  },
  {
    name: "Lisieux Matriculation Higher Secondary School, Saibaba Colony",
    type: "SCHOOL",
    lat: 11.0289,
    lng: 76.9421,
  },
  {
    name: "G.D. Matriculation Higher Secondary School",
    type: "SCHOOL",
    lat: 11.0152,
    lng: 76.9821,
  },
  {
    name: "Mani Higher Secondary School, Pappanaickenpalayam",
    type: "SCHOOL",
    lat: 11.0135,
    lng: 76.9856,
  },
];
