import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/posts/RichTextEditor";
import UserAvatar from "@/components/UserAvatar";
import { Image, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { BASE_URL } from "@/lib/constants";

export interface PostFormPost {
  _id: string;
  title: string;
  content: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profile_picture?: string;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface PostFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Provide to enter edit mode; omit for create mode */
  post?: PostFormPost | null;
  /** Override the default submit. Receives the full FormData (title, content, images). */
  customSubmit?: (formData: FormData) => Promise<void>;
  /** Optional user name shown in the modal header (pass from useProfile for alumni) */
  userName?: string;
  /** Optional user avatar shown in the modal header */
  userAvatar?: string;
}

const extractTitle = (text: string): string =>
  text.split("\n")[0].trim().substring(0, 100);

const PostFormModal = ({
  open,
  onClose,
  onSuccess,
  post = null,
  customSubmit,
  userName,
  userAvatar,
}: PostFormModalProps) => {
  const isEditMode = !!post;

  const [content, setContent] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate fields when a post is provided or modal opens
  useEffect(() => {
    if (open) {
      setContent(post?.content ?? "");
      setExistingImages(post?.images ?? []);
      setNewImages([]);
    }
  }, [open, post]);

  const handleClose = () => {
    setContent("");
    setExistingImages([]);
    setNewImages([]);
    onClose();
  };

  const totalImages = existingImages.length + newImages.length;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (totalImages + files.length > 2) {
      toast.error("You can only have a maximum of 2 images");
      return;
    }
    setNewImages((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}/uploads/posts/${imagePath}`;
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", extractTitle(content));
      formData.append("content", content);
      newImages.forEach((file) => formData.append("images", file));

      if (customSubmit) {
        await customSubmit(formData);
      } else if (isEditMode && post) {
        await api.put(`/posts/${post._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Post updated successfully!");
      } else {
        await api.post("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Post created successfully!");
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast.error(error.response?.data?.message || "Failed to save post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditMode ? "Edit post" : "Create a post"}
          </DialogTitle>
        </DialogHeader>

        {/* User info — only shown when caller provides it (alumni flow) */}
        {userName && (
          <div className="flex items-center gap-3 pt-1 pb-2">
            <UserAvatar src={userAvatar} name={userName} size="md" />
            <div>
              <h3 className="font-semibold text-lg text-white">{userName}</h3>
              <p className="text-sm text-gray-400">
                {isEditMode ? "Editing post" : "Posting to Alumni Network"}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={
              "What do you want to share?\n\nFirst line will appear as your post title..."
            }
            minHeight="200px"
          />

          {/* Image previews */}
          {(existingImages.length > 0 || newImages.length > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img
                    src={getImageUrl(image)}
                    alt={`Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    onClick={() =>
                      setExistingImages((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {newImages.map((file, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    onClick={() =>
                      setNewImages((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom row: Add photos + action buttons */}
          <div className="flex items-center gap-4">
            <div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={totalImages >= 2}
                className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
              >
                <Image className="h-4 w-4" />
                Add photos (max 2)
              </Button>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Post"
                    : "Create Post"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostFormModal;
