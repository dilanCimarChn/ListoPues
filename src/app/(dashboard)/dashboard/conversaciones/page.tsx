import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { ConversationsViewer } from "@/components/dashboard/ConversationsViewer"
import type { ChatMessage, Conversation } from "@/types"

export default async function ConversacionesPage() {
  const business = await requireBusiness(true)

  const conversations = await prisma.conversation.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: "desc" },
  })

  const serialized: Conversation[] = conversations.map((c) => ({
    id: c.id,
    clientPhone: c.clientPhone,
    messages: (c.messages as unknown as ChatMessage[]) ?? [],
    assignedTo: c.assignedTo,
    status: c.status,
    businessId: c.businessId,
    updatedAt: c.updatedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conversaciones</h1>
        <p className="text-sm text-text-muted">
          Historial de chats entre LAIA y tus clientes
        </p>
      </div>

      <ConversationsViewer conversations={serialized} />
    </div>
  )
}
