"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn, formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import type { Appointment, AppointmentStatus } from "@/types"

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
}

const STATUS_VARIANT: Record<AppointmentStatus, "warning" | "success" | "error" | "muted"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "error",
  COMPLETED: "muted",
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]

export function AppointmentsCalendar({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      const key = new Date(a.date).toISOString().slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return map
  }, [appointments])

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Lunes = 0
  const offset = (firstDay.getDay() + 6) % 7

  function dayKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else setMonth(month - 1)
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else setMonth(month + 1)
  }

  async function updateStatus(appointmentId: string, status: AppointmentStatus) {
    setSavingId(appointmentId)
    try {
      await fetch("/api/citas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status }),
      })
      router.refresh()
    } finally {
      setSavingId(null)
    }
  }

  const selected = selectedDay ? byDay.get(selectedDay) ?? [] : []
  const upcoming = appointments
    .filter((a) => new Date(a.date) >= new Date() && a.status !== "CANCELLED")
    .slice(0, 8)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                Anterior
              </Button>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                Siguiente
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-text-muted">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 font-medium">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const key = dayKey(day)
              const count = byDay.get(key)?.length ?? 0
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-colors cursor-pointer",
                    selectedDay === key
                      ? "border-primary bg-primary/15 text-primary"
                      : isToday
                        ? "border-accent/50 text-accent"
                        : "border-transparent hover:bg-surface-light/40"
                  )}
                >
                  <span>{day}</span>
                  {count > 0 && (
                    <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-slate-950">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-semibold">
          {selectedDay ? `Citas del ${selectedDay}` : "Proximas citas"}
        </h2>
        {(selectedDay ? selected : upcoming).length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-text-muted">
            No hay citas {selectedDay ? "este dia" : "proximas"}.
          </p>
        ) : (
          (selectedDay ? selected : upcoming).map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.clientName}</p>
                    <p className="text-sm text-text-muted">{a.service}</p>
                    <p className="text-xs text-text-muted">{formatDateTime(a.date)}</p>
                    {a.notes && <p className="mt-1 text-xs text-text-muted">Nota: {a.notes}</p>}
                  </div>
                  <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                </div>
                {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                  <div className="flex flex-wrap gap-2">
                    {a.status === "PENDING" && (
                      <Button
                        size="sm"
                        loading={savingId === a.id}
                        onClick={() => updateStatus(a.id, "CONFIRMED")}
                      >
                        Confirmar
                      </Button>
                    )}
                    {a.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={savingId === a.id}
                        onClick={() => updateStatus(a.id, "COMPLETED")}
                      >
                        Completar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      loading={savingId === a.id}
                      onClick={() => updateStatus(a.id, "CANCELLED")}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
