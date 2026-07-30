import { z } from 'zod';
export const tenantPaymentSchema = z.object({
  tenant: z.string().min(1, 'Tenant name is required'),
  property: z.string().min(1, 'Property is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  method: z.literal('Mobile Money', { errorMap: () => ({ message: 'Only Mobile Money is accepted' }) }),
  chargeType: z.enum(['Rent', 'Service Charge', 'Deposit', 'Other'], { errorMap: () => ({ message: 'Select a charge type' }) }),
  reference: z.string().optional()
});
export const maintenanceRequestSchema = z.object({
  property: z.string().min(1, 'Property is required'),
  issue: z.string().min(5, 'Describe the issue (min 5 characters)'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical'], { errorMap: () => ({ message: 'Select a priority' }) })
});
export const propertySchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters'),
  type: z.enum(['Building', 'Villa', 'Land', 'Apartment'], { errorMap: () => ({ message: 'Select property type' }) }),
  propertyType: z.enum(['For Sale', 'For Rent'], { errorMap: () => ({ message: 'Select sale/rent' }) }),
  rent: z.coerce.number().min(0, 'Price must be 0 or more'),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional()
});
export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Must be a valid email'),
  phone: z.string().min(8, 'Phone must be at least 8 digits'),
  property: z.string().min(1, 'Property is required'),
  amount: z.coerce.number().min(0).optional(),
  status: z.string().optional()
});
export const expenseSchema = z.object({
  scope: z.enum(['Building', 'Agency'], { errorMap: () => ({ message: 'Select expense scope' }) }),
  building: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  notes: z.string().optional(),
  owner: z.string().optional(),
  requestedBy: z.string().optional()
});
export const leaseSchema = z.object({
  contractTitle: z.string().min(1, 'Contract title is required'),
  tenant: z.string().min(1, 'Tenant is required'),
  property: z.string().min(1, 'Property is required'),
  landlord: z.string().min(1, 'Landlord is required'),
  leaseType: z.enum(['Residential', 'Commercial', 'Seasonnier'], { errorMap: () => ({ message: 'Select lease type' }) }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  rent: z.coerce.number().positive('Rent must be positive')
});
export const companySchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  email: z.string().email('Must be a valid email'),
  phone: z.string().min(8, 'Phone is required'),
  address: z.string().optional(),
  licenseNumber: z.string().optional(),
  description: z.string().optional()
});
export const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Must be a valid email'),
  role: z.string().min(1, 'Role is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  company: z.string().optional()
});
export const loginSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required')
});
export const workOrderSchema = z.object({
  property: z.string().min(1, 'Property is required'),
  type: z.string().min(1, 'Type is required'),
  priority: z.enum(['Low', 'Medium', 'High'], { errorMap: () => ({ message: 'Select priority' }) }),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  amount: z.coerce.number().min(0).optional()
});
export const reminderSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200, 'Subject too long'),
  date: z.string().min(1, 'Date is required'),
  channel: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional()
});
export const visitSchema = z.object({
  property: z.string().min(1, 'Property is required'),
  client: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Must be a valid email'),
  clientPhone: z.string().min(8, 'Phone must be at least 8 digits'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional()
});
export const quoteSchema = z.object({
  property: z.string().min(1, 'Property is required'),
  issue: z.string().min(3, 'Issue description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  recipient: z.string().min(1, 'Recipient is required')
});
export type TenantPaymentFormData = z.infer<typeof tenantPaymentSchema>;
export type MaintenanceRequestFormData = z.infer<typeof maintenanceRequestSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type LeaseFormData = z.infer<typeof leaseSchema>;
export type CompanyFormData = z.infer<typeof companySchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
export type ReminderFormData = z.infer<typeof reminderSchema>;
export type VisitFormData = z.infer<typeof visitSchema>;
export type QuoteFormData = z.infer<typeof quoteSchema>;
