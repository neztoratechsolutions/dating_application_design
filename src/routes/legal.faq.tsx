import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  created_by: number;
  status: boolean;
  created_at: string;
  updated_at: string;
}

function FaqPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null); // Tracks which FAQ is open

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/faqs/");
        if (!response.ok) throw new Error("Failed to fetch FAQs");
        const data = await response.json();
        
        // Filter only active FAQs
        const activeFaqs = data.filter((f: FAQItem) => f.status);
        setFaqs(activeFaqs);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  // Find the most recent updated date to display in the header
  const latestDate = faqs.length > 0 
    ? new Date(
        Math.max(...faqs.map(f => new Date(f.updated_at).getTime()))
      ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : "";

  return (
    <div className="max-w-none w-full">
      <h1 className="text-3xl font-bold mb-2">FAQ</h1>
      
      {loading ? (
        <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground mt-6">
          Loading FAQs...
        </div>
      ) : faqs.length === 0 ? (
        <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground mt-6">
          No FAQs available at the moment.
        </div>
      ) : (
        <>
          {latestDate && (
            <p className="text-xs text-muted-foreground mb-6 mt-1">
              Last updated {latestDate}
            </p>
          )}
          
          <div className="space-y-3 mt-4">
            {faqs.map((f) => (
              <div key={f.id} className="glass rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setOpen(open === f.id ? null : f.id)} 
                  className="w-full p-4 text-left font-medium text-sm flex justify-between items-center"
                >
                  <span className="pr-4">{f.question}</span>
                  <span className="text-muted-foreground text-lg leading-none">
                    {open === f.id ? "−" : "+"}
                  </span>
                </button>
                {open === f.id && (
                  <div 
                    className="px-4 pb-4 text-sm text-muted-foreground"
                    style={{ whiteSpace: "pre-line" }} // Renders \n as line breaks
                  >
                    {f.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/legal/faq")({
  component: FaqPage,
});