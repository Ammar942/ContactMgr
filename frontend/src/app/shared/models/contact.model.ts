export interface Contact {
  _id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lockedBy?: { _id: string; username: string } | null;
  lockedAt?: string | null;
}
