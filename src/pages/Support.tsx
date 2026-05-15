import { useState, useEffect, useMemo, useRef } from "react";
import {
  MessageCircle, Send, CheckCircle2, X,
  User, Search, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  subscribeAllSupportMessages,
  replySupportMessage,
  closeSupportMessage,
  sendNotificationToUser,
  type SupportMessage,
} from "@/lib/supabase";
import { useDebounce, formatDateTime } from "@/lib/ui";

const statusColor: Record<string, string> = {
  open:    "text-amber-700 bg-amber-100",
  replied: "text-emerald-700 bg-emerald-100",
  closed:  "text-slate-500 bg-slate-100",
};

const statusLabel: Record<string, string> = {
  open:    "Open",
  replied: "Replied",
  closed:  "Closed",
};

export function Support() {
  const [msgs, setMsgs] = useState<SupportMessage[]>([]);
  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "replied" | "closed">("all");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSent, setNotifSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeAllSupportMessages(setMsgs);
    return unsub;
  }, []);

  // Keep selected in sync with live updates
  useEffect(() => {
    if (!selected) return;
    const fresh = msgs.find((m) => m.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [msgs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected]);

  const debouncedSearch = useDebounce(search, 300);

  const visible = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return msgs.filter((m) => {
      if (filter !== "all" && m.status !== filter) return false;
      if (!q) return true;
      return (
        m.user_name.toLowerCase().includes(q) ||
        m.user_email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [msgs, filter, debouncedSearch]);

  const stats = {
    total: msgs.length,
    open: msgs.filter((m) => m.status === "open").length,
    replied: msgs.filter((m) => m.status === "replied").length,
    closed: msgs.filter((m) => m.status === "closed").length,
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      await replySupportMessage(selected.id, replyText.trim());
      await sendNotificationToUser(selected.user_id, {
        title: "Support Reply",
        body: `Your message "${selected.subject}" has been answered.`,
        type: "support",
      });
      toast.success("Reply sent");
      setReplyText("");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!selected) return;
    try {
      await closeSupportMessage(selected.id);
      toast.success("Ticket closed");
    } catch { toast.error("Failed to close ticket"); }
  };

  const handleSendNotif = async () => {
    if (!selected || !notifTitle.trim() || !notifBody.trim()) return;
    setSendingNotif(true);
    try {
      await sendNotificationToUser(selected.user_id, {
        title: notifTitle.trim(),
        body: notifBody.trim(),
      });
      toast.success("Notification sent");
      setNotifSent(true);
      setNotifTitle("");
      setNotifBody("");
      setTimeout(() => setNotifSent(false), 3000);
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setSendingNotif(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Left: ticket list */}
      <div className={`w-full lg:max-w-sm border-r border-border/60 flex-col bg-white overflow-hidden ${selected ? "hidden lg:flex" : "flex"}`}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border/40 shrink-0">
          <h1 className="text-base font-extrabold text-foreground mb-3">Support Inbox</h1>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Total", value: stats.total, color: "text-slate-700" },
              { label: "Open", value: stats.open, color: "text-amber-700" },
              { label: "Replied", value: stats.replied, color: "text-emerald-700" },
              { label: "Closed", value: stats.closed, color: "text-slate-500" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border/60 text-xs bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {(["all", "open", "replied", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {visible.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No messages found</p>
            </div>
          )}
          {visible.map((m) => (
            <button
              key={m.id}
              onClick={() => { setSelected(m); setReplyText(""); }}
              className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${
                selected?.id === m.id ? "bg-primary/5 border-l-2 border-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-bold text-foreground truncate">{m.user_name}</p>
                <span className={`shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${statusColor[m.status]}`}>
                  {statusLabel[m.status]}
                </span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground truncate mb-0.5">{m.subject}</p>
              <p className="text-[11px] text-muted-foreground/70 truncate">{m.message}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                {formatDateTime(m.created_at)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: conversation detail */}
      {!selected ? (
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-muted/20 gap-3">
          <MessageCircle className="h-16 w-16 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-muted-foreground">Select a message to view</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
          {/* Ticket header */}
          <div className="px-5 py-3 border-b border-border/40 flex items-start justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-sm font-extrabold text-foreground">{selected.user_name}</p>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${statusColor[selected.status]}`}>
                  {statusLabel[selected.status]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{selected.user_email}</p>
              <p className="text-xs font-bold text-foreground mt-1">📋 {selected.subject}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {selected.status !== "closed" && (
                <Button size="sm" variant="outline" onClick={handleClose} className="text-xs h-7 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Close
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* User's original message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-sm font-bold text-blue-700">
                {selected.user_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-foreground">{selected.user_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTime(selected.created_at)}
                  </span>
                </div>
                <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground max-w-xl">
                  {selected.message}
                </div>
              </div>
            </div>

            {/* Admin reply (if exists) */}
            {selected.admin_reply && (
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-sm font-bold text-white">
                  A
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-row-reverse">
                    <span className="text-xs font-bold text-foreground">Admin</span>
                    {selected.replied_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateTime(selected.replied_at)}
                      </span>
                    )}
                  </div>
                  <div className="bg-primary/10 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-foreground max-w-xl">
                    {selected.admin_reply}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          {selected.status !== "closed" && (
            <div className="px-5 py-3 border-t border-border/40 bg-muted/20 space-y-3 shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply…"
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-xl border border-border/60 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 bg-white"
                />
                <Button
                  size="sm"
                  disabled={sending || !replyText.trim()}
                  onClick={handleReply}
                  className="h-auto px-3 gap-1.5 self-end"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending ? "Sending…" : "Reply"}
                </Button>
              </div>
            </div>
          )}

          {/* Send notification panel */}
          <div className="px-5 py-3 border-t border-border/30 bg-slate-50 shrink-0">
            <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Bell className="h-3 w-3" /> Send In-App Notification
            </p>
            <div className="flex gap-2">
              <input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Title"
                className="w-32 px-2.5 py-1.5 rounded-lg border border-border/60 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <input
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Message body…"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-border/60 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={sendingNotif || !notifTitle.trim() || !notifBody.trim()}
                onClick={handleSendNotif}
                className="text-xs h-8 gap-1 shrink-0"
              >
                {notifSent ? <><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Sent!</> : <><Bell className="h-3 w-3" /> Send</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
