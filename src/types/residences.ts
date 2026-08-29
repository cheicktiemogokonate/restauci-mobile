export type ResidencePaymentMethod = "mobile_money" | "card";
export type ResidenceReservationStatus =
  | "en_attente_paiement"
  | "confirmee"
  | "annulee";
export type ResidenceReservationTemporalStatus =
  | "a_venir"
  | "en_cours"
  | "terminee";

export interface ResidencePhoto {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface PublicResidence {
  id: string;
  slug: string;
  title: string;
  description: string;
  pricePerNightFcfa: number;
  maxGuests: number;
  city: string;
  country: string;
  firstPublishedAt: string;
  photos: ResidencePhoto[];
  bookability: {
    isBookable: boolean;
    blockers: string[];
  };
  placement: "promoted" | "organic";
  partnerBadgeEnabled: boolean;
  discoveryToken: string;
}

export interface ResidenceStayQuote {
  residenceId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNightFcfa: number;
  subtotalFcfa: number;
  totalFcfa: number;
  available: boolean;
  bookabilityBlockers: string[];
}

export interface ResidenceReservation {
  id: string;
  residenceId: string;
  residenceSlug: string;
  residenceTitle: string;
  residenceCity: string;
  residenceCoverUrl: string | null;
  partnerAccountId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  status: ResidenceReservationStatus;
  temporalStatus: ResidenceReservationTemporalStatus;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNightSnapshotFcfa: number;
  subtotalFcfa: number;
  totalFcfa: number;
  commissionRateBpsSnapshot: number;
  commissionAmountFcfa: number;
  paymentMethod: ResidencePaymentMethod;
  paymentStatus: "pending" | "confirmed" | "failed" | "cancelled";
  checkoutUrl: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}
