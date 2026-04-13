import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Gift,
  Shield,
} from "lucide-react";

const FAQS = [
  {
    question: "Why does DopeDeal charge ₹2?",
    answer: "The ₹2 helps us verify genuine users and prevent misuse. It's a small commitment that ensures real people get real rewards. Think of it as a trust fee that unlocks exclusive offers worth much more!",
  },
  {
    question: "How do I claim my reward?",
    answer: "After completing the quiz and WhatsApp verification, you'll be redirected to our offers page. Simply click on any offer to claim your reward. All rewards are digital and delivered instantly.",
  },
  {
    question: "Is my WhatsApp number safe?",
    answer: "Absolutely! We only use your number for verification and sending offers you've opted into. We never share your data with third parties without consent. Read our Privacy Policy for details.",
  },
  {
    question: "What if I don't receive my reward?",
    answer: "If you've completed all steps and haven't received your reward, please contact us via WhatsApp support. Our team will resolve your issue within 24 hours.",
  },
  {
    question: "Can I participate multiple times?",
    answer: "Each WhatsApp number can participate once per campaign. This ensures fair distribution of rewards among all participants.",
  },
];

const Support = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });

    setName("");
    setEmail("");
    setMessage("");
    setSubmitting(false);
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/919999999999?text=Hi, I need help with DopeDeal", "_blank");
  };

  return (
    <div className="min-h-screen bg-animated-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <span className="font-bold text-gradient-fire">DopeDeal Support</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Why ₹2 Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Why ₹2?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Verified Users Only</h3>
                <p className="text-sm text-muted-foreground">
                  The ₹2 fee helps us filter out bots and ensure only genuine users participate.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Real Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Your small commitment unlocks exclusive offers from top brands worth 10x-100x more!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contact Options */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-secondary transition-colors" onClick={openWhatsApp}>
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-10 h-10 text-secondary mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-1">WhatsApp Support</h3>
              <p className="text-sm text-muted-foreground">Get instant help on WhatsApp</p>
              <Button className="mt-4 btn-success">Chat Now</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-1">Email Support</h3>
              <p className="text-sm text-muted-foreground">support@dopedeal.in</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href="mailto:support@dopedeal.in">Send Email</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Textarea
                placeholder="How can we help you?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
              />
              <Button type="submit" className="w-full btn-fire" disabled={submitting}>
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 flex justify-center gap-6 text-sm">
          <Link to="/legal/terms" className="text-muted-foreground hover:text-primary">
            Terms
          </Link>
          <Link to="/legal/privacy" className="text-muted-foreground hover:text-primary">
            Privacy
          </Link>
          <Link to="/legal/disclaimer" className="text-muted-foreground hover:text-primary">
            Disclaimer
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Support;
