import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/help")({ component: Help });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  is_active: boolean;
};

function Help() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/help-support/`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Only show active FAQs to customers
            const activeFaqs = data.filter((f: FaqItem) => f.is_active);
            setFaqs(activeFaqs);
            // Open the first FAQ by default if it exists
            if (activeFaqs.length > 0) setOpen(activeFaqs[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <div>
      <PageHeader title="Help & Support" subtitle="We're here to help" />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          No FAQs available right now.
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {faqs.map((f) => (
            <div key={f.id} className="glass rounded-2xl overflow-hidden">
              <button 
                onClick={() => setOpen(open === f.id ? null : f.id)} 
                className="w-full p-4 text-left font-medium text-sm flex justify-between items-center"
              >
                {f.question} 
                <span className="text-xl leading-none">{open === f.id ? "−" : "+"}</span>
              </button>
              {open === f.id && (
                <div className="px-4 pb-4 text-xs text-muted-foreground">
                  {f.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="glass-strong rounded-2xl p-5 text-center">
        <p className="text-sm font-medium mb-1">Still need help?</p>
        <p className="text-xs text-muted-foreground mb-4">Reach us at neztoratechsolutions@gmail.com</p>
        <button className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold shadow-glow">Contact Support</button>
      </div>
    </div>
  );
}