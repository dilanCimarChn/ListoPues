"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn, formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import type { Conversation, ConversationStatus } from "@/types"

const STATUS_LABEL: Record<ConversationStatus, string> = {
  ACTIVE: "Activa",
  RESOLVED: "Resuelta",
  ESCALATED: "Escalada",
}

const STATUS_VARIANT: Record<ConversationStatus, "success" | "muted" | "warning"> = {
  ACTIVE: "success",
  RESOLVED: "muted",
  ESCALATED: "warning",
}

export function ConversationsViewer({ conversations }: { conversations: Conversation[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(
    conversations[0]?.id ?? null
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  const selected = conversations.find((c) => c.id === selectedId) ?? null

  async function updateStatus(conversationId: string, status: ConversationStatus) {
    setSavingId(conversationId)
    try {
      await fetch("/api/conversaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, status }),
      })
      router.refresh()
    } finally {
      setSavingId(null)
    }
  }

  if (conversations.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-12 text-center text-sm text-text-muted">
        Aun no hay conversaciones. Cuando tus clientes escriban a LAIA apareceran aqui.
      </p>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-2">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={cn(
              "w-full rounded-xl border p-4 text-left transition-colors cursor-pointer",
              selectedId === c.id
                ? "border-primary/50 bg-primary/10"
                : "border-border bg-surface hover:bg-surface-light/40"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{c.clientPhone}</span>
              <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
            </div>
            <p className="mt-1 truncate text-xs text-text-muted">
              {c.messages[c.messages.length - 1]?.content ?? "Sin mensajes"}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">{formatDateTime(c.updatedAt)}</p>
          </button>
        ))}
      </div>

      <Card className="max-h-[70vh] overflow-hidden">
        <CardContent className="flex h-full flex-col p-0">
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div>
                  <p className="font-medium">{selected.clientPhone}</p>
                  <p className="text-xs text-text-muted">
                    {selected.messages.length} mensajes
                  </p>
                </div>
                <div className="flex gap-2">
                  {selected.status !== "RESOLVED" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={savingId === selected.id}
                      onClick={() => updateStatus(selected.id, "RESOLVED")}
                    >
                      Marcar resuelta
                    </Button>
                  )}
                  {selected.status === "ESCALATED" && (
                    <Button
                      size="sm"
                      loading={savingId === selected.id}
                      onClick={() => updateStatus(selected.id, "ACTIVE")}
                    >
                      Reactivar LAIA
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {selected.messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                      m.role === "user"
                        ? "bg-surface-light text-text-primary"
                        : "ml-auto bg-primary/15 text-text-primary"
                    )}
                  >
                    <p className="mb-1 text-[11px] font-medium text-text-muted">
                      {m.role === "user" ? "Cliente" : "LAIA"}
                    </p>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="p-8 text-center text-sm text-text-muted">
              Selecciona una conversacion.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
