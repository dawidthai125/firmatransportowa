import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import { createCourseMessage } from '@/lib/domain/course-message'
import { appendCourseMessage, messagesForCourse } from '@/lib/domain/course-messages-store'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { cn } from '@/lib/utils'
import { MessageCircle, Send } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface CourseChatPanelProps {
  tenantId: string
  courseId: string
  authorName: string
  authorRole: 'owner' | 'dispatcher' | 'driver'
  readOnly?: boolean
}

export function CourseChatPanel({
  tenantId,
  courseId,
  authorName,
  authorRole,
  readOnly = false,
}: CourseChatPanelProps) {
  const [messages, setMessages] = useState(() => messagesForCourse(tenantId, courseId))
  const [text, setText] = useState('')

  const refresh = useCallback(() => {
    setMessages(messagesForCourse(tenantId, courseId))
  }, [tenantId, courseId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['course-messages'], refresh)

  function send() {
    const trimmed = text.trim()
    if (!trimmed) return
    const msg = createCourseMessage(courseId, authorName, authorRole, trimmed)
    appendCourseMessage(tenantId, msg)
    setMessages(messagesForCourse(tenantId, courseId))
    setText('')
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MessageCircle className="h-3.5 w-3.5" />
        Czat przy kursie
      </p>
      <div className="max-h-40 space-y-2 overflow-y-auto text-sm">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground">Brak wiadomości — napisz do dyspozytora.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'rounded-md px-2 py-1.5',
                m.authorRole === 'driver' ? 'bg-primary/10' : 'bg-muted/60',
              )}
            >
              <p className="text-[10px] font-medium text-muted-foreground">
                {m.authorName} · {new Date(m.createdAt).toLocaleString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p>{m.text}</p>
            </div>
          ))
        )}
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            value={text}
            placeholder="Wiadomość…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <Button size="icon" onClick={send} aria-label="Wyślij">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
