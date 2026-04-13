import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LegalPage {
  title: string;
  content: string;
  updated_at: string;
}

const Legal = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data, error } = await supabase
          .from("legal_pages")
          .select("title, content, updated_at")
          .eq("slug", slug)
          .eq("is_published", true)
          .single();

        if (error) throw error;
        setPage(data as LegalPage);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-4">The legal page you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      if (line.startsWith("# ")) {
        return <h1 key={index} className="text-3xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={index} className="text-2xl font-bold mt-4 mb-3">{line.substring(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={index} className="text-xl font-bold mt-3 mb-2">{line.substring(4)}</h3>;
      }
      if (line.startsWith("- ")) {
        return <li key={index} className="ml-6 mb-1">{line.substring(2)}</li>;
      }
      if (line.trim() === "") {
        return <br key={index} />;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <span className="font-bold text-gradient-fire">DopeDeal</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <article className="prose prose-invert max-w-none">
          {renderContent(page.content)}
        </article>
        
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          Last updated: {new Date(page.updated_at).toLocaleDateString()}
        </div>
      </main>

      {/* Footer Links */}
      <footer className="border-t border-border py-8">
        <div className="max-w-3xl mx-auto px-4 flex justify-center gap-6 text-sm">
          <Link to="/legal/terms" className="text-muted-foreground hover:text-primary">
            Terms & Conditions
          </Link>
          <Link to="/legal/privacy" className="text-muted-foreground hover:text-primary">
            Privacy Policy
          </Link>
          <Link to="/legal/disclaimer" className="text-muted-foreground hover:text-primary">
            Disclaimer
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Legal;
