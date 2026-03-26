export type UserRole = 'user' | 'organizer' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
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
}

export interface PlanItem {
  task: string;
  completed: boolean;
  timeline?: string;
}

export interface BudgetItem {
  category: string;
  estimatedCost: number;
  actualCost?: number;
  priority: 'High' | 'Medium' | 'Low';
}

export interface Guest {
  name: string;
  email?: string;
  status: 'Invited' | 'Confirmed' | 'Declined' | 'Pending';
}
