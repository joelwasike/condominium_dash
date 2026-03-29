// User types
export interface User {
  id: number;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  status: string;
  profilePictureURL?: string;
  lastLogin?: string;
}

export type UserRole =
  | 'tenant'
  | 'landlord'
  | 'salesmanager'
  | 'accounting'
  | 'admin'
  | 'technician'
  | 'superadmin'
  | 'agency_director'
  | 'commercial';

// Property types
export interface Property {
  id: number;
  address: string;
  type: 'Building' | 'Villa' | 'Land' | 'Apartment';
  propertyType: 'For Sale' | 'For Rent';
  buildingType?: string;
  status: string;
  tenant?: string;
  rent: number;
  numberOfUnits: number;
  filledUnits: number;
  bedrooms: number;
  bathrooms: number;
  urgency: string;
  company: string;
  landlordID?: number;
  images: string;
  city: string;
  neighborhood: string;
  typeR: string;
  superficie: number;
  documents: string;
  extra: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyUnit {
  id: number;
  propertyID: number;
  propertyType: string;
  unitNumber: string;
  status: 'Vacant' | 'Occupied';
  tenant?: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  company: string;
  features: string;
  picture: string;
  enterDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Payment types
export interface TenantPayment {
  id: number;
  tenant: string;
  property: string;
  amount: number;
  commission: number;
  method: string;
  chargeType: string;
  date: string;
  status: string;
  receiptNumber?: string;
  receiptURL?: string;
  documentURL?: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandlordPayment {
  id: number;
  landlord: string;
  building: string;
  netAmount: number;
  commission: number;
  date: string;
  status: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Client/Tenant types
export interface Client {
  id: number;
  name: string;
  property: string;
  unitNumber?: string;
  status: string;
  lastPayment?: string;
  amount: number;
  phone: string;
  email: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Maintenance types
export interface Maintenance {
  id: number;
  property: string;
  tenant: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  assigned: string;
  date: string;
  estimatedHours: number;
  estimatedCost: number;
  quoteGenerated: boolean;
  archived: boolean;
  archivedAt?: string;
  workStartDate?: string;
  workEndDate?: string;
  completedAt?: string;
  photos: string;
  quotationURL?: string;
  invoiceURL?: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Quote types
export interface Quote {
  id: number;
  maintenanceID: number;
  property: string;
  issue: string;
  amount: number;
  recipient: string;
  date: string;
  status: string;
  validatedBy: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Document types
export interface Document {
  id: number;
  tenant: string;
  property: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  url: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  followUpCount: number;
  lastFollowUpAt?: string;
  sentToUtility: boolean;
  utilitySentAt?: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Lease types
export interface Lease {
  id: number;
  contractTitle: string;
  tenant: string;
  property: string;
  landlord: string;
  leaseType: 'Residential' | 'Commercial' | 'Seasonnier';
  startDate: string;
  endDate: string;
  rent: number;
  status: string;
  documentURL?: string;
  generatedAt?: string;
  generatedBy?: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Expense types
export interface Expense {
  id: number;
  scope: 'Building' | 'Agency';
  building: string;
  category: string;
  owner: string;
  requestedBy: string;
  amount: number;
  date: string;
  notes: string;
  documentURL?: string;
  receiptURL?: string;
  accountID?: number;
  company: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory types
export interface Inventory {
  id: number;
  property: string;
  type: string;
  tenant: string;
  scheduledAt?: string;
  date: string;
  inspector: string;
  reportURL?: string;
  status: string;
  reportData: string;
  notes: string;
  photos: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Company types
export interface Company {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber?: string;
  description?: string;
  status: string;
  subscriptionStatus: 'pending' | 'completed' | 'expired';
  deactivationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Listing types
export interface Listing {
  id: number;
  address: string;
  type: string;
  propertyType: string;
  buildingType?: string;
  bedrooms: number;
  bathrooms: number;
  price: string;
  description: string;
  status: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Visit types
export interface Visit {
  id: number;
  property: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  notes: string;
  status: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Alert types
export interface Alert {
  id: number;
  type: string;
  urgency: string;
  title: string;
  message: string;
  property: string;
  tenant?: string;
  amount?: number;
  status: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Reminder types
export interface Reminder {
  id: number;
  subject: string;
  date: string;
  channel: string;
  status: string;
  createdBy?: string;
  assignedTo?: string;
  description?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
}

// WorkOrder types
export interface WorkOrder {
  id: number;
  property: string;
  type: string;
  status: string;
  priority: string;
  description: string;
  assignedTo?: string;
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: number;
  userID: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Error
export interface APIError {
  code: string;
  message: string;
  details?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// Cashier types
export interface CashierAccount {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
  company: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashierTransaction {
  id: number;
  accountID: number;
  type: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  relatedPaymentID?: number;
  company: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Security Deposit types
export interface SecurityDeposit {
  id: number;
  tenant: string;
  property: string;
  leaseID?: number;
  tenantType: string;
  amount: number;
  monthlyRent: number;
  monthsMultiplier: number;
  type: string;
  status: string;
  paymentMethod: string;
  reference: string;
  refundMethod?: string;
  refundAccount?: string;
  refundedAt?: string;
  company: string;
  createdBy: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Employee types
export interface Employee {
  id: number;
  name: string;
  role: string;
  building: string;
  phone: string;
  email: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface Message {
  id: number;
  fromUserID: number;
  toUserID: number;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// Transfer types
export interface TransferPaymentRequest {
  id: number;
  tenant: string;
  property: string;
  currentClient: string;
  currentClientYears: number;
  newClient: string;
  recipientIDCardNumber: string;
  recipientEntryDate: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  relationship: string;
  reason: string;
  files: string;
  status: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}
