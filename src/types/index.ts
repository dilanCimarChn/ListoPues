export type Plan = "LITE" | "PRO"

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"

export type SaleStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED"

export type ConversationStatus = "ACTIVE" | "RESOLVED" | "ESCALATED"

export interface Business {
  id: string
  slug: string
  name: string
  description: string | null
  logo: string | null
  whatsapp: string
  primaryColor: string
  currency: string
  active: boolean
  plan: Plan
  domain: string | null
}

export interface Category {
  id: string
  name: string
  businessId: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  stock: number
  available: boolean
  featured: boolean
  businessId: string
  categoryId: string | null
  category?: Category | null
}

export interface Appointment {
  id: string
  clientName: string
  clientPhone: string
  date: string
  service: string
  status: AppointmentStatus
  notes: string | null
  businessId: string
}

export interface SaleItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface Sale {
  id: string
  clientName: string
  clientPhone: string
  total: number
  status: SaleStatus
  receiptUrl: string | null
  items: SaleItem[]
  businessId: string
  createdAt: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  clientPhone: string
  messages: ChatMessage[]
  assignedTo: string | null
  status: ConversationStatus
  businessId: string
  updatedAt: string
  createdAt: string
}

export interface FAQ {
  question: string
  answer: string
}

export interface AIContext {
  id: string
  businessId: string
  systemPrompt: string
  tone: string
  faqs: FAQ[]
}

// --- Carrito ---

export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  businessSlug: string
}

// --- WhatsApp ---

export interface WhatsAppOrderPayload {
  businessName: string
  whatsappNumber: string
  currency: string
  items: CartItem[]
  paid?: boolean
}

// --- API responses ---

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface StorefrontData {
  business: Business
  products: Product[]
  categories: Category[]
}

// --- Limites por plan ---

export interface PlanLimits {
  products: number
  label: string
}
