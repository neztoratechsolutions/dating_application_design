import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  is_active: boolean;
}

const TICKET_CATEGORIES = [
  "Account", "Payment", "KYC", "Chat", "Call", "Withdrawal", "Report User", "Other",
];
const TICKET_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const Route = createFileRoute("/app/help")({ component: Help });

function Help() {
  const [open, setOpen] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(TICKET_CATEGORIES[0]);
  const [priority, setPriority] = useState("Medium");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const authState = useAuth() as any;

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/help-support/`);
        if (!response.ok) throw new Error("Failed to fetch FAQs");
        const data = await response.json();
        setFaqs(data);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      // Extract user_id from auth state
      const userId = authState?.user?.id || authState?.user?.user_id || authState?.user_id;

      if (!userId) {
        throw new Error("User ID not found. Please login again.");
      }

      const response = await fetch(`${API_BASE_URL}/support/tickets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId, // Backend now uses this to find the user
          subject: subject.trim(),
          category: category,
          priority: priority,
          message: message.trim(),
          attachment: attachment.trim() || null,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.detail || responseData?.message || "Failed to submit ticket");
      }

      const ticketId = responseData?.data?.ticket_id || "N/A";

      setFeedbackMsg({
        type: "success",
        text: `Support ticket created successfully! Your Ticket ID is ${ticketId}. Our team will get back to you soon.`,
      });

      // Reset form
      setSubject("");
      setCategory(TICKET_CATEGORIES[0]);
      setPriority("Medium");
      setMessage("");
      setAttachment("");
      setShowForm(false);

    } catch (error: any) {
      console.error("Support ticket error:", error);
      setFeedbackMsg({
        type: "error",
        text: error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Help & Support" subtitle="We're here to help" />

      <div className="space-y-2 mb-6">
        {loading ? (
          <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
            Loading FAQs...
          </div>
        ) : faqs.length === 0 ? (
          <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
            No FAQs available at the moment.
          </div>
        ) : (
          faqs.map((f, i) => (
            <div key={f.id} className="glass rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full p-4 text-left font-medium text-sm flex justify-between items-center"
              >
                {f.question}
                <span className="ml-2">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <div className="px-4 pb-4 text-xs text-muted-foreground">{f.answer}</div>
              )}
            </div>
          ))
        )}
      </div>

      {feedbackMsg && (
        <div className={`mb-4 p-3 rounded-xl text-xs text-center border ${
          feedbackMsg.type === "success"
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {feedbackMsg.text}
        </div>
      )}

      <div className="glass-strong rounded-2xl p-5 text-center">
        {!showForm ? (
          <>
            <p className="text-sm font-medium mb-1">Still need help?</p>
            <p className="text-xs text-muted-foreground mb-4">Reach us at support@velora.live</p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold shadow-glow"
            >
              Contact Support
            </button>
          </>
        ) : (
          <div className="text-left">
            <p className="text-sm font-medium mb-4 text-center">Open a Support Ticket</p>
            
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly describe the issue"
                className="w-full p-3 text-sm bg-input text-foreground rounded-xl border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 text-sm bg-input text-foreground rounded-xl border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {TICKET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-input text-foreground">{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-3 text-sm bg-input text-foreground rounded-xl border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {TICKET_PRIORITIES.map((pri) => (
                    <option key={pri} value={pri} className="bg-input text-foreground">{pri}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                className="w-full h-28 p-3 text-sm bg-input text-foreground rounded-xl resize-none border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Attachment URL (Optional)</label>
              <input
                type="text"
                value={attachment}
                onChange={(e) => setAttachment(e.target.value)}
                placeholder="https://link-to-your-file.com/image.jpg"
                className="w-full p-3 text-sm bg-input text-foreground rounded-xl border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold bg-muted/30"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!subject.trim() || !message.trim() || submitting}
                className="flex-1 rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold shadow-glow disabled:opacity-50 disabled:shadow-none"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}