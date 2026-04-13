import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useOfferBlocks, useInvalidateAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  GripVertical,
  Trash2,
  Edit,
  Image,
  MousePointer,
  FileText,
  Video,
  Eye,
  EyeOff,
} from "lucide-react";
import { OfferBlockEditor } from "@/components/admin/OfferBlockEditor";
import type { Json } from "@/integrations/supabase/types";

interface OfferBlock {
  id: string;
  block_type: string;
  title: string | null;
  subtitle: string | null;
  content_json: Json;
  position: number;
  status: string;
  target_categories: string[];
  target_cities: string[];
}

const BLOCK_TYPES = [
  { type: "banner", label: "Large Banner", icon: Image },
  { type: "button", label: "Action Button", icon: MousePointer },
  { type: "course", label: "Course/PDF", icon: FileText },
  { type: "video", label: "Video Block", icon: Video },
];

const OfferBuilder = () => {
  const { data: blocks = [], isLoading } = useOfferBlocks();
  const { invalidateBlocks } = useInvalidateAdminData();
  const [editingBlock, setEditingBlock] = useState<OfferBlock | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [newBlockType, setNewBlockType] = useState<string | null>(null);
  const { toast } = useToast();

  const addBlock = (type: string) => {
    setNewBlockType(type);
    setEditingBlock(null);
    setShowEditor(true);
  };

  const editBlock = (block: OfferBlock) => {
    setEditingBlock({
      ...block,
      content_json: block.content_json as Json,
    });
    setNewBlockType(null);
    setShowEditor(true);
  };

  const toggleBlockStatus = async (block: OfferBlock) => {
    try {
      const newStatus = block.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("offer_blocks")
        .update({ status: newStatus })
        .eq("id", block.id);

      if (error) throw error;

      invalidateBlocks();
      toast({
        title: "Success",
        description: `Block ${newStatus === "active" ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update block status",
        variant: "destructive",
      });
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm("Are you sure you want to delete this block?")) return;

    try {
      const { error } = await supabase
        .from("offer_blocks")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      invalidateBlocks();
      toast({ title: "Success", description: "Block deleted" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete block",
        variant: "destructive",
      });
    }
  };

  const moveBlock = async (blockId: string, direction: "up" | "down") => {
    const currentIndex = blocks.findIndex((b) => b.id === blockId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === blocks.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newBlocks = [...blocks];
    [newBlocks[currentIndex], newBlocks[newIndex]] = [
      newBlocks[newIndex],
      newBlocks[currentIndex],
    ];

    // Update positions
    const updates = newBlocks.map((block, index) => ({
      id: block.id,
      position: index,
    }));

    try {
      for (const update of updates) {
        await supabase
          .from("offer_blocks")
          .update({ position: update.position })
          .eq("id", update.id);
      }

      invalidateBlocks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder blocks",
        variant: "destructive",
      });
    }
  };

  const handleSaveBlock = async (blockData: {
    title: string | null;
    subtitle: string | null;
    content_json: Record<string, unknown>;
    target_categories: string[];
    status: string;
  }) => {
    try {
      const dataToSave = {
        title: blockData.title,
        subtitle: blockData.subtitle,
        content_json: blockData.content_json as Json,
        target_categories: blockData.target_categories,
        status: blockData.status,
      };

      if (editingBlock) {
        const { error } = await supabase
          .from("offer_blocks")
          .update(dataToSave)
          .eq("id", editingBlock.id);

        if (error) throw error;
        toast({ title: "Success", description: "Block updated" });
      } else {
        const { error } = await supabase.from("offer_blocks").insert([{
          ...dataToSave,
          block_type: newBlockType!,
          position: blocks.length,
        }]);

        if (error) throw error;
        toast({ title: "Success", description: "Block created" });
      }

      setShowEditor(false);
      setEditingBlock(null);
      setNewBlockType(null);
      invalidateBlocks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save block",
        variant: "destructive",
      });
    }
  };

  const getBlockIcon = (type: string) => {
    const blockType = BLOCK_TYPES.find((b) => b.type === type);
    return blockType?.icon || Image;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
            <h1 className="text-2xl font-bold text-foreground">
              Offer Page Builder
            </h1>
            <p className="text-muted-foreground">
              Manage banners, buttons, and content blocks
            </p>
          </div>
        </div>

        {/* Add New Block */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Block</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BLOCK_TYPES.map((blockType) => {
                const Icon = blockType.icon;
                return (
                  <Button
                    key={blockType.type}
                    variant="outline"
                    className="h-24 flex-col gap-2"
                    onClick={() => addBlock(blockType.type)}
                  >
                    <Icon className="w-8 h-8" />
                    <span>{blockType.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Block List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            {blocks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No blocks created yet.</p>
                <p className="text-sm mt-1">
                  Add your first block using the buttons above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map((block, index) => {
                  const Icon = getBlockIcon(block.block_type);
                  return (
                    <div
                      key={block.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border ${
                        block.status === "active"
                          ? "border-border bg-card"
                          : "border-border/50 bg-muted/20 opacity-60"
                      }`}
                    >
                      <div className="cursor-grab">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {block.title || `Untitled ${block.block_type}`}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {block.block_type} • Position {index + 1}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveBlock(block.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveBlock(block.id, "down")}
                          disabled={index === blocks.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleBlockStatus(block as OfferBlock)}
                        >
                          {block.status === "active" ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editBlock(block as OfferBlock)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBlock(block.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Block Editor Dialog */}
      {showEditor && (
        <OfferBlockEditor
          block={editingBlock}
          blockType={newBlockType || editingBlock?.block_type || "banner"}
          onSave={handleSaveBlock}
          onClose={() => {
            setShowEditor(false);
            setEditingBlock(null);
            setNewBlockType(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default OfferBuilder;
