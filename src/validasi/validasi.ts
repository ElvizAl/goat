import { z } from "zod"

// Skema untuk membuat pengguna baru
export const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"), // Nama pengguna harus diisi
  email: z.string().email("Format email tidak valid"), // Memeriksa format email
  password: z.string().min(6, "Password harus memiliki setidaknya 6 karakter"), // Password minimal 6 karakter
  role: z.enum(["USER", "ADMIN"]).default("USER"), // Role pengguna (default adalah USER)
})

// Skema untuk memperbarui data pengguna
export const updateUserSchema = z.object({
  id: z.string(), // ID pengguna yang akan diperbarui
  name: z.string().min(1, "Nama wajib diisi").optional(), // Nama pengguna (opsional)
  email: z.string().email("Format email tidak valid").optional(), // Email pengguna (opsional)
  password: z.string().min(6, "Password harus memiliki setidaknya 6 karakter").optional(), // Password pengguna (opsional)
  role: z.enum(["USER", "ADMIN"]).optional(), // Role pengguna (opsional)
})

// Skema untuk login pengguna
export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"), // Memeriksa format email
  password: z.string().min(1, "Password wajib diisi"), // Password wajib diisi
})

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  userId: z.string(),
})

export const updateCustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Customer name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const customerSearchSchema = z.object({
  query: z.string().optional(),
  sortBy: z.enum(["name", "email", "createdAt", "totalOrders", "totalSpent"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export const createFruitSchema = z.object({
  name: z.string().min(1, "Fruit name is required"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  image: z.string().url("Invalid image URL").optional(),
})

export const updateFruitSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Fruit name is required").optional(),
  price: z.number().positive("Price must be positive").optional(),
  stock: z.number().int().min(0, "Stock cannot be negative").optional(),
  image: z.string().url("Invalid image URL").optional(),
})

export const fruitSearchSchema = z.object({
  query: z.string().optional(),
  sortBy: z.enum(["name", "price", "stock", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  inStock: z.boolean().optional(),
})

// New schema for image upload
export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB limit
      "File size must be less than 5MB",
    )
    .refine(
      (file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
      "File must be a valid image (JPEG, PNG, or WebP)",
    ),
})

export const orderItemSchema = z.object({
  fruitId: z.string(),
  quantity: z.number().int().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
})

export const createOrderSchema = z.object({
  customerId: z.string(),
  payment: z.enum(["CASH", "TRANSFER", "CREDIT_CARD", "DIGITAL_WALLET"]),
  userId: z.string().optional(),
  orderItems: z.array(orderItemSchema).min(1, "At least one item is required"),
})

export const updateOrderSchema = z.object({
  id: z.string(),
  status: z.enum(["PROCESSING", "COMPLETED", "CANCELLED"]).optional(),
  payment: z.enum(["CASH", "TRANSFER", "CREDIT_CARD", "DIGITAL_WALLET"]).optional(),
})

export const createPaymentSchema = z.object({
  orderId: z.string(),
  amountPaid: z.number().positive("Amount must be positive"),
  paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED"]).default("PENDING"),
})

export const updatePaymentSchema = z.object({
  id: z.string(),
  paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED"]),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>


export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>


export type CreateFruitInput = z.infer<typeof createFruitSchema>
export type UpdateFruitInput = z.infer<typeof updateFruitSchema>
export type FruitSearchInput = z.infer<typeof fruitSearchSchema>
export type ImageUploadInput = z.infer<typeof imageUploadSchema>


export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>


// Menyusun tipe data berdasarkan skema Zod
export type CreateUserInput = z.infer<typeof createUserSchema> // Tipe input untuk pembuatan pengguna
export type UpdateUserInput = z.infer<typeof updateUserSchema> // Tipe input untuk pembaruan pengguna
export type LoginInput = z.infer<typeof loginSchema> // Tipe input untuk login pengguna
