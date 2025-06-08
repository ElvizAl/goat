"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { createUser, updateUser } from "@/actions/user-actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUserSchema, updateUserSchema } from "@/validasi/validasi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type FormState = {
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
    role?: string[]
    _form?: string[]
  }
  success?: boolean
}

interface UserFormProps {
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
  isEditing?: boolean
}

export function UserForm({ user, isEditing = false }: UserFormProps) {
  const router = useRouter()
  const [formState, setFormState] = useState<FormState>({})
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<string>(user?.role || "USER")

  async function onSubmit(formData: FormData) {
    setIsLoading(true)
    setFormState({})

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      if (isEditing && user) {
        // Validasi form data untuk update
        const updateData: any = { id: user.id }

        if (name) updateData.name = name
        if (email) updateData.email = email
        if (password && password.trim() !== "") updateData.password = password
        updateData.role = role

        // Validasi dengan Zod
        updateUserSchema.parse(updateData)

        // Submit form data untuk update
        const result = await updateUser(updateData)

        if (result.success) {
          setFormState({ success: true })
          router.push("/dashboard/users")
          router.refresh()
        } else {
          setFormState({ errors: { _form: [result.error || "Gagal mengupdate pengguna"] } })
        }
      } else {
        // Validasi form data untuk create
        // Validasi dengan Zod
        createUserSchema.parse({ name, email, password, role })

        // Submit form data untuk create
        const result = await createUser({ name, email, password, role: role as "USER" | "ADMIN" })

        if (result.success) {
          setFormState({ success: true })
          router.push("/dashboard/users")
          router.refresh()
        } else {
          setFormState({ errors: { _form: [result.error || "Gagal membuat pengguna"] } })
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors
        setFormState({ errors })
      } else {
        setFormState({ errors: { _form: ["Sesuatu telah salah. Silakan coba lagi."] } })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Pengguna" : "Tambah Pengguna Baru"}</CardTitle>
          <CardDescription>
            {isEditing ? "Edit informasi pengguna yang sudah ada" : "Masukkan informasi untuk membuat pengguna baru"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit}>
            {formState.errors?._form && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formState.errors._form.join(", ")}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" name="name" placeholder="Nama Pengguna" defaultValue={user?.name || ""} />
                {formState.errors?.name && <p className="text-sm text-red-500">{formState.errors.name.join(", ")}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3 mt-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  defaultValue={user?.email || ""}
                />
                {formState.errors?.email && <p className="text-sm text-red-500">{formState.errors.email.join(", ")}</p>}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password {isEditing && "(Kosongkan jika tidak ingin mengubah)"}</Label>
                </div>
                <Input id="password" type="password" name="password" />
                {formState.errors?.password && (
                  <p className="text-sm text-red-500">{formState.errors.password.join(", ")}</p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="role">Role</Label>
                <Select name="role" value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
                {formState.errors?.role && <p className="text-sm text-red-500">{formState.errors.role.join(", ")}</p>}
              </div>
              <div className="flex flex-col gap-3 mt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? isEditing
                      ? "Menyimpan..."
                      : "Membuat..."
                    : isEditing
                      ? "Simpan Perubahan"
                      : "Buat Pengguna"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
