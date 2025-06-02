"use server"

import { prisma } from "@/db/prisma" // Mengimpor Prisma Client untuk berinteraksi dengan database
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type LoginInput,
} from "@/validasi/validasi" // Mengimpor skema validasi untuk pembuatan, pembaruan, dan login pengguna
import bcrypt from "bcryptjs" // Mengimpor bcrypt untuk mengenkripsi dan memverifikasi password
import { revalidatePath } from "next/cache" // Mengimpor revalidatePath untuk menyegarkan cache halaman di Next.js

// Mengimpor modul untuk menangani cookies dan navigasi
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { encrypt, decrypt } from "@/lib/encryption" // Mengimpor fungsi enkripsi dan dekripsi
interface User {
  id: string
  name: string
  email: string
  role: string
}

// Define the return type of the function
interface GetUserSessionResponse {
  success: boolean
  data?: User
  error?: string
}


// Fungsi untuk membuat pengguna baru
export async function createUser(data: CreateUserInput) {
  try {
    // Validasi data menggunakan skema Zod untuk memastikan data yang dikirim valid
    const validatedData = createUserSchema.parse(data)

    // Mengecek apakah pengguna dengan email yang sama sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return { error: "User with this email already exists" } // Jika sudah ada pengguna dengan email ini
    }

    // Mengenkripsi password sebelum menyimpannya di database
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Membuat pengguna baru di database dengan data yang sudah terverifikasi dan password yang terenkripsi
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Menyegarkan cache untuk halaman /users setelah pengguna berhasil dibuat
    revalidatePath("/users")
    return { success: true, data: user } // Mengembalikan data pengguna yang baru dibuat
  } catch (error) {
    console.error("Error creating user:", error)
    return { error: "Failed to create user" } // Menangani error jika pembuatan pengguna gagal
  }
}

// Fungsi untuk memperbarui data pengguna
export async function updateUser(data: UpdateUserInput) {
  try {
    // Validasi data yang diterima menggunakan skema Zod
    const validatedData = updateUserSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Jika ada password baru, enkripsi password sebelum memperbarui
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12)
    }

    // Memperbarui data pengguna di database berdasarkan ID
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    })

    // Menyegarkan cache halaman /users setelah pengguna berhasil diperbarui
    revalidatePath("/users")
    return { success: true, data: user } // Mengembalikan data pengguna yang telah diperbarui
  } catch (error) {
    console.error("Error updating user:", error)
    return { error: "Failed to update user" } // Menangani error jika pembaruan pengguna gagal
  }
}

// Fungsi untuk menghapus pengguna berdasarkan ID
export async function deleteUser(id: string) {
  try {
    // Menghapus pengguna dari database berdasarkan ID
    await prisma.user.delete({
      where: { id },
    })

    // Menyegarkan cache halaman /users setelah pengguna berhasil dihapus
    revalidatePath("/users")
    return { success: true } // Mengembalikan status sukses
  } catch (error) {
    console.error("Error deleting user:", error)
    return { error: "Failed to delete user" } // Menangani error jika penghapusan gagal
  }
}

// Fungsi untuk mengambil semua pengguna dari database
export async function getUsers() {
  try {
    // Mengambil data pengguna beserta jumlah pesanan dan pelanggan terkait
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" }, // Mengurutkan berdasarkan tanggal pembuatan terbaru
    })

    return { success: true, data: users } // Mengembalikan data pengguna
  } catch (error) {
    console.error("Error fetching users:", error)
    return { error: "Failed to fetch users" } // Menangani error jika pengambilan data pengguna gagal
  }
}

// Fungsi untuk mendapatkan data pengguna berdasarkan ID
export async function getUserById(id: string) {
  try {
    // Mengambil data pengguna berdasarkan ID
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Mengembalikan error jika pengguna tidak ditemukan
    if (!user) {
      return { error: "User not found" }
    }

    return { success: true, data: user } // Mengembalikan data pengguna
  } catch (error) {
    console.error("Error fetching user:", error)
    return { error: "Failed to fetch user" } // Menangani error jika pengambilan data pengguna gagal
  }
}

// Fungsi untuk membuat sesi pengguna setelah berhasil login
export async function createUserSession(user: { id: string; name: string; email: string; role: string }):Promise<{ success: boolean } | { error: string }> {
  try {
    // Membuat objek sesi yang berisi data pengguna
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Sesi berlaku selama 7 hari
    }

    // Mengenkripsi data sesi sebelum menyimpannya di cookies
    const encryptedSession = await encrypt(JSON.stringify(session))

    const cookieStore = await cookies();

    // Menyimpan sesi pengguna dalam cookie
    cookieStore.set({
      name: "user-session",
      value: encryptedSession,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Menggunakan secure cookie jika di production
      sameSite: "lax",
      path: "/",
      expires: session.expires,
    })

    return { success: true } // Mengembalikan status sukses
  } catch (error) {
    console.error("Error creating user session:", error)
    return { error: "Failed to create user session" } // Menangani error jika pembuatan sesi gagal
  }
}

// Fungsi untuk mendapatkan sesi pengguna dari cookies
export async function getUserSession(): Promise<GetUserSessionResponse> {
  try {
    // Mengambil cookie sesi
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("user-session")

    if (!sessionCookie) {
      return { success: false, error: "No session found" } // Jika cookie sesi tidak ada
    }

    // Mendekripsi data sesi yang disimpan dalam cookie
    const decryptedSession = await decrypt(sessionCookie.value)
    const session = JSON.parse(decryptedSession)

    // Mengecek apakah sesi sudah kedaluwarsa
    if (new Date(session.expires) < new Date()) {
      await deleteUserSession() // Menghapus sesi jika kedaluwarsa
      return { success: false, error: "Session expired" }
    }

    // Mengambil data pengguna yang terhubung dengan sesi tersebut dari database
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      await deleteUserSession() // Menghapus sesi jika pengguna tidak ditemukan
      return { success: false, error: "User not found" }
    }

    // Mengembalikan data pengguna yang terhubung dengan sesi jika berhasil
    return { success: true, data: user }

  } catch (error) {
    console.error("Error getting user session:", error)
    return { success: false, error: "Failed to get user session" } // Menangani error jika pengambilan sesi gagal
  }
}


// Fungsi untuk menghapus sesi pengguna dari cookies
export async function deleteUserSession():Promise<{ success: boolean } | { error: string }> {
  try {
    // Menghapus cookie sesi
    const cookieStore = await cookies()
    cookieStore.delete("user-session")
    return { success: true } // Mengembalikan status sukses
  } catch (error) {
    console.error("Error deleting user session:", error)
    return { error: "Failed to delete user session" } // Menangani error jika penghapusan sesi gagal
  }
}

// Fungsi untuk mengautentikasi pengguna berdasarkan kredensial login
export async function authenticateUser(data: LoginInput) {
  try {
    const validatedData = loginSchema.parse(data)

    // Mencari pengguna berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      return { error: "Invalid credentials" } // Jika pengguna tidak ditemukan
    }

    // Memeriksa apakah password yang dimasukkan cocok dengan yang ada di database
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)

    if (!isPasswordValid) {
      return { error: "Invalid credentials" } // Jika password tidak valid
    }

    // Membuat sesi untuk pengguna setelah berhasil login
    await createUserSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }
  } catch (error) {
    console.error("Error authenticating user:", error)
    return { error: "Authentication failed" } // Menangani error jika autentikasi gagal
  }
}

// Fungsi untuk melakukan login dan mengarahkan ke halaman tertentu setelah berhasil
export async function login(data: LoginInput) {
  const result = await authenticateUser(data)

  if (result.success) {
    // Mengecek peran pengguna dan mengarahkan ke halaman yang sesuai
    const userRole = result.data.role;
    if (userRole === "ADMIN") {
      // Pengguna dengan peran ADMIN diarahkan ke dashboard
      redirect("/dashboard");
    } else if (userRole === "USER") {
      // Pengguna dengan peran USER diarahkan ke halaman utama
      redirect("/profile");
    }
  }

  return result
}

// Fungsi untuk logout dan mengarahkan ke halaman login setelah logout
export async function logout(redirectTo = "/login") {
  await deleteUserSession()
  redirect(redirectTo) // Arahkan pengguna ke halaman login setelah logout
}

// Fungsi untuk memverifikasi apakah pengguna sudah terautentikasi dan memiliki peran yang sesuai
export async function requireAuth(requiredRole?: "USER" | "ADMIN") {
  const session = await getUserSession()

  if (!session.success) {
    redirect("/login") // Arahkan ke halaman login jika pengguna belum terautentikasi
    return // Pastikan ada return jika sesi tidak berhasil
  }

  // Periksa jika session.data ada
  const user = session.data

  if (!user) {
    redirect("/login") // Jika tidak ada data pengguna, arahkan ke login
    return
  }

  // Mengecek apakah pengguna memiliki peran yang sesuai dengan yang dibutuhkan
  if (requiredRole && user.role !== requiredRole) {
    redirect("/unauthorized") // Arahkan ke halaman unauthorized jika peran tidak sesuai
    return
  }

  return user // Mengembalikan data pengguna yang terautentikasi
}
