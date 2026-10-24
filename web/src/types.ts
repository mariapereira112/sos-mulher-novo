export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  gender?: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface Alert {
  id: number;
  userId: number;
  latitude?: number;
  longitude?: number;
  status: "pending" | "sms_sent" | "calling_cloud" | "resolved_by_contact" | "cancelled";
  timerDuration: number;
  createdAt: string;
}

export interface EmergencyContact {
  id: number;
  userId: number;
  name: string;
  phone: string;
  relationship: string;
  createdAt: string;
}

export interface CommunityPost {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Settings {
  id: number;
  userId: number;
  gpsEnabled: boolean;
  notificationsEnabled: boolean;
  cameraMicEnabled: boolean;
  discreteMode: boolean;
  biometricsEnabled: boolean;
  coercionCode?: string;
  sosTimer: string;
  photoUrl?: string;
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
}
