import { createContext, useContext } from "react";
import type { Profile } from "@/lib/api";

export type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export const ProfileContext = createContext<ProfileState>({
  profile: null,
  loading: true,
  error: null,
  refresh: () => {},
});

export function useProfile() {
  return useContext(ProfileContext);
}

/** Placeholder shown while the profile request is in flight. */
export const FALLBACK_PROFILE: Profile = {
  id: "",
  name: "there",
  shortName: "Loading...",
  role: "",
  email: "",
  phone: "",
  timezone: "",
  bio: "",
  skills: [],
  avatarUrl: null,
  pricePerSession: null,
  currency: "BDT",
  isPublished: false,
  initials: "--",
  username: "",
  dateOfBirth: "",
  yearsExperience: null,
  department: "",
  designation: "",
  nidNumber: "",
  languages: [],
  bloodGroup: "",
  gender: "",
  featureOnWebsite: false,
  addressLine1: "",
  addressLine2: "",
  country: "",
  city: "",
  state: "",
  postcode: "",
  appointmentType: "Online Consultation",
  onlineConsultEnabled: true,
  advanceBookingDays: null,
  appointmentDurationMinutes: 60,
  maxBookingsPerSlot: 1,
  education: [],
  awards: [],
  certifications: [],
};
