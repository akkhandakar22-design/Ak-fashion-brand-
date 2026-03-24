export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role?: 'admin' | 'user';
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  image: string;
  media?: string;
  stock: number;
  is_featured: boolean;
  is_trending: boolean;
  rating: number;
  reviews_count: number;
  has_free_delivery?: boolean;
  has_return_policy?: boolean;
  has_warranty?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  user_name?: string;
  phone?: string;
  total_price: number;
  status: string;
  payment_method: string;
  address: string;
  created_at: string;
  estimated_delivery?: string;
  items?: {
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    name: string;
    image: string;
  }[];
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  images?: string[];
  created_at: string;
}
