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

export type PressMention = {
  id: string;
  title: string;
  outlet: string;
  outlet_instagram: string | null;
  journalist: string | null;
  journalist_instagram: string | null;
  url: string;
  image_url: string | null;
  published_date: string | null;
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
