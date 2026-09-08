export type UserRole = "owner" | "staff" | "customer";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
};

export type Card = {
  id: string;
  name: string;
  set_name: string | null;
  image_url: string | null;
  description: string | null;
  condition: string | null;
  starting_price: number | null;
  status: "available" | "in_auction" | "sold";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
