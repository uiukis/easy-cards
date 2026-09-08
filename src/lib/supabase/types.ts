export type UserRole = "cto" | "admin" | "staff" | "customer";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  favorite_pokemon: string | null;
  created_at: string;
};

export type Card = {
  id: string;
  name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  description: string | null;
  condition: string | null;
  status: "available" | "in_auction" | "sold";
  tcg_api_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CardFinance = {
  id: string;
  card_id: string;
  final_price: number | null;
  delivery_method: "maos" | "dominaria" | null;
  dominaria_fee: number | null;
  buyer_id: string | null;
  buyer_name: string | null;
  sold_at: string | null;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
};

export type Announcement = {
  id: string;
  message: string;
  active: boolean;
  created_at: string;
};

export type EventSettings = {
  id: boolean;
  title: string;
  event_date: string | null;
  place: string | null;
  tag: string | null;
  banner_enabled: boolean;
  banner_message: string | null;
  form_url: string | null;
  updated_at: string;
};

export type Supporter = {
  id: string;
  name: string;
  instagram: string | null;
  image_url: string | null;
  tier: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type BinderCard = {
  id: string;
  user_id: string;
  tcg_api_id: string | null;
  name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string;
  position: number;
  created_at: string;
};
