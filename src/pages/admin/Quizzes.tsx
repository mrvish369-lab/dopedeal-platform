import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createQuiz, updateQuiz, deleteQuiz, QuizData } from "@/lib/admin";
import { Plus, HelpCircle, Trash2, Edit, Eye, EyeOff, Search, Gift, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { QuizCampaignEditor } from "@/components/admin/QuizCampaignEditor";

const CATEGORIES = [
  { value: "bollywood", label: "Bollywood 🎬" },
  { value: "social_media", label: "Social Media 📱" },
  { value: "cricket", label: "Cricket / IPL 🏏" },
  { value: "sports", label: "Sports ⚽" },
  { value: "tech", label: "Technology 💻" },
  { value: "music", label: "Music 🎵" },
  { value: "food", label: "Food 🍕" },
  { value: "general", label: "General Knowledge 📚" },
];

interface Campaign {
  id: string;
  name: string;
  slug: string;
  template_type: string;
  goodie_title: string;
  goodie_emoji: string;
  status: string;
  created_at: string;
}

interface Quiz {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct_option: number | null;
  is_active: boolean;
  display_order: number;
}

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCampaignEditorOpen, setIsCampaignEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState({
    category: "bollywood",
    question: "",
    options: ["", "", "", ""],
    is_active: true,
    display_order: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState("campaigns");
  const { toast } = useToast();

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("category")
      .order("display_order");

    if (!error && data) {
      setQuizzes(
        data.map((q) => ({
          ...q,
          options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        })) as Quiz[]
      );
    }
    setIsLoading(false);
  };

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("quiz_campaigns")
      .select("id, name, slug, template_type, goodie_title, goodie_emoji, status, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCampaigns(data as Campaign[]);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchCampaigns();
  }, []);

  const copyLink = (slug: string) => {
    // Use production domain for campaign links
    const url = `https://dopedeal.store/start?campaign=${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Campaign link copied to clipboard" });
  };

  const handleCreate = async () => {
    if (!formData.question || formData.options.some((o) => !o.trim())) {
      toast({
        title: "Error",
        description: "Question and all options are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    if (editingQuiz) {
      const success = await updateQuiz(editingQuiz.id, {
        category: formData.category,
        question: formData.question,
        options: formData.options,
        is_active: formData.is_active,
        display_order: formData.display_order,
      });

      if (success) {
        toast({ title: "Updated", description: "Quiz question updated" });
        setEditingQuiz(null);
      }
    } else {
      const success = await createQuiz({
        category: formData.category,
        question: formData.question,
        options: formData.options,
        is_active: formData.is_active,
        display_order: formData.display_order,
      });

      if (success) {
        toast({ title: "Created", description: "New quiz question added" });
      }
    }

    setIsCreateOpen(false);
    setFormData({
      category: "bollywood",
      question: "",
      options: ["", "", "", ""],
      is_active: true,
      display_order: 0,
    });
    fetchQuizzes();
    setIsSubmitting(false);
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    const success = await deleteQuiz(quizId);
    if (success) {
      toast({ title: "Deleted", description: "Question removed" });
      fetchQuizzes();
    }
  };

  const handleToggleActive = async (quiz: Quiz) => {
    const success = await updateQuiz(quiz.id, { is_active: !quiz.is_active });
    if (success) {
      toast({
        title: quiz.is_active ? "Disabled" : "Enabled",
        description: `Question ${quiz.is_active ? "hidden" : "shown"} to users`,
      });
      fetchQuizzes();
    }
  };

  const openEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      category: quiz.category,
      question: quiz.question,
      options: quiz.options,
      is_active: quiz.is_active,
      display_order: quiz.display_order,
    });
    setIsCreateOpen(true);
  };

  // Filter by category and search
  const filteredQuizzes = quizzes.filter((q) => {
    const matchesCategory = selectedCategory === "all" || q.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.options.some(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const {
    paginatedItems: paginatedQuizzes,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    startIndex,
    endIndex,
    resetPage,
  } = usePagination(filteredQuizzes, { pageSize });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [selectedCategory, searchQuery]);

  const groupedQuizzes = paginatedQuizzes.reduce((acc, quiz) => {
    if (!acc[quiz.category]) acc[quiz.category] = [];
    acc[quiz.category].push(quiz);
    return acc;
  }, {} as Record<string, Quiz[]>);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quiz Manager</h1>
            <p className="text-muted-foreground">Manage campaigns and quiz questions</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="campaigns" className="gap-2">
              <Gift className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Questions
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex justify-end">
              <Button className="btn-fire gap-2" onClick={() => { setEditingCampaign(null); setIsCampaignEditorOpen(true); }}>
                <Plus className="w-5 h-5" />
                New Campaign
              </Button>
            </div>

            {campaigns.length > 0 ? (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                        {campaign.goodie_emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">/{campaign.slug} • {campaign.goodie_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-1 text-xs rounded-full", campaign.status === "active" ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground")}>
                        {campaign.status}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => copyLink(campaign.slug)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(`/start?campaign=${campaign.slug}`, "_blank")}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCampaign(campaign as any); setIsCampaignEditorOpen(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Campaigns Yet</h3>
                <p className="text-muted-foreground mb-6">Create your first quiz campaign to get started</p>
                <Button onClick={() => setIsCampaignEditorOpen(true)} className="btn-fire gap-2">
                  <Plus className="w-5 h-5" />
                  Create Campaign
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog
              open={isCreateOpen}
              onOpenChange={(open) => {
                setIsCreateOpen(open);
                if (!open) setEditingQuiz(null);
              }}
            >
              <DialogTrigger asChild>
                <Button className="btn-fire gap-2">
                  <Plus className="w-5 h-5" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuiz ? "Edit Question" : "Add New Question"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Textarea
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter your question..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Options (4 required)</Label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index] = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                      }
                      min={0}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                  </div>

                  <Button
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    className="w-full btn-fire"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingQuiz
                      ? "Update Question"
                      : "Add Question"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Questions by Category */}
        {Object.entries(groupedQuizzes).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedQuizzes).map(([category, categoryQuizzes]) => (
              <div key={category}>
                <h2 className="text-xl font-bold text-foreground mb-4 capitalize">
                  {category.replace("_", " ")} ({categoryQuizzes.length})
                </h2>
                <div className="space-y-3">
                  {categoryQuizzes.map((quiz, index) => (
                    <div
                      key={quiz.id}
                      className={cn(
                        "bg-card border border-border rounded-xl p-4 transition-all",
                        !quiz.is_active && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {startIndex + index}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-foreground mb-2">{quiz.question}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {quiz.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded"
                                >
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(quiz)}
                          >
                            {quiz.is_active ? (
                              <Eye className="w-4 h-4 text-secondary" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(quiz)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(quiz.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pagination */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onNextPage={nextPage}
              onPrevPage={prevPage}
              onFirstPage={firstPage}
              onLastPage={lastPage}
              onPageSizeChange={setPageSize}
              pageSize={pageSize}
            />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Questions Yet</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== "all" 
                ? "No questions match your filters" 
                : "Add your first quiz question to get started"}
            </p>
            {!searchQuery && selectedCategory === "all" && (
              <Button onClick={() => setIsCreateOpen(true)} className="btn-fire gap-2">
                <Plus className="w-5 h-5" />
                Add Question
              </Button>
            )}
          </div>
        )}
          </TabsContent>
        </Tabs>

        {/* Campaign Editor Modal */}
        <QuizCampaignEditor
          campaign={editingCampaign as any}
          open={isCampaignEditorOpen}
          onOpenChange={setIsCampaignEditorOpen}
          onSaved={fetchCampaigns}
        />
      </div>
    </AdminLayout>
  );
}
