import { useState, useCallback } from "react";

export interface GeoLocationState {
  lat: number;
  lng: number;
  accuracy?: number;
  loading: boolean;
  error?: string;
}

// Default center: Coimbatore City, Tamil Nadu
const COIMBATORE_DEFAULT = { lat: 11.0168, lng: 76.9558 };

export function useGeolocation() {
  const [state, setState] = useState<GeoLocationState>({
    lat: COIMBATORE_DEFAULT.lat,
    lng: COIMBATORE_DEFAULT.lng,
    loading: false,
  });

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
        });
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Unable to retrieve location. Using Coimbatore center.",
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  }, []);

  return {
    ...state,
    getCurrentLocation,
    setDefaultCoimbatore: () =>
      setState({ lat: COIMBATORE_DEFAULT.lat, lng: COIMBATORE_DEFAULT.lng, loading: false }),
  };
}
