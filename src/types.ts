export type UserRole = 'user' | 'organizer' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
  points?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  price: number;
  organizerId: string;
  capacity: number;
  bookedCount: number;
  images: string[];
  tags: string[];
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
  pricePerHour: number;
  description: string;
  images: string[];
  themeCompatibility: string[];
  isHotel?: boolean;
  isOpenAir?: boolean;
}

export interface Hotel extends Venue {
  stars: number;
  roomCount: number;
  amenities: string[];
}

export interface Booking {
  id: string;
  userId: string;
  eventId?: string;
  venueId?: string;
  eventTitle?: string;
  venue?: string;
  location?: string;
  seatType?: string;
  addFood?: boolean;
  type: 'ticket' | 'venue' | 'plan';
  status: 'confirmed' | 'pending' | 'cancelled';
  totalAmount: number;
  date: string;
  details?: any;
  participantIds?: string[];
  createdAt?: string;
}

export interface PlanItem {
  task: string;
  completed: boolean;
  timeline?: string;
}

export interface CateringPlateDetail {
  type: 'Veg' | 'Non-Veg' | 'Kids' | 'Adults' | 'Aged';
  count: number;
  costPerPlate: number;
}

export interface BudgetItem {
  category: string;
  estimatedCost: number;
  actualCost?: number;
  priority: 'High' | 'Medium' | 'Low';
  cateringDetails?: CateringPlateDetail[];
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'Pending' | 'Invited' | 'Attending' | 'Declined';
  invitedAt?: string;
  wantsScavenger?: boolean;
}

export interface ScavengerMission {
  id: string;
  mission: string;
  description: string;
  points: number;
  completed?: boolean;
}

export interface ScavengerSubmission {
  id: string;
  eventId: string;
  missionId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  proofType: 'image' | 'text';
  proofValue: string;
  pointsAwarded: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userPhoto?: string;
  totalPoints: number;
  completedCount: number;
}
