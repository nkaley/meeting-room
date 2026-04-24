export type UserRole = 'ADMIN' | 'USER';

export type Me = {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
};

export type Office = {
  id: string;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
};

export type Room = {
  id: string;
  officeId: string;
  office?: { id: string; name: string };
  name: string;
  floor?: string | null;
  capacity?: number | null;
  description?: string | null;
  isBookable: boolean;
  isActive: boolean;
};

export type Booking = {
  id: string;
  roomId: string;
  userId: string;
  startAt: string;
  endAt: string;
  description: string;
  room?: {
    id: string;
    name: string;
    office?: { id: string; name: string };
  };
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};
