import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Gavel,
  Info,
  Loader2,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import MarkdownEditor, {
  MarkdownEditorHandle,
} from "@/components/posts/MarkdownEditor";
import TagInput, { MAX_TAGS } from "@/components/posts/TagInput";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getPostImageUrl } from "@/lib/posts";
import { apiErrorMessage, cn } from "@/lib/utils";
import { trackEvent, trackFormSubmit } from "@/lib/analytics";

const MAX_IMAGES = 2;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const Card = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-card border border-border bg-card p-6 shadow-card">
    {title && <h2 className="mb-4 text-headline-md text-foreground">{title}</h2>}
    {children}
  </section>
);

interface PostEditorProps {
  mode: "create" | "edit";
}

// Create and edit share one page: the only differences are where the initial
// values come from and which verb the save uses.
export default function PostEditor({ mode }: PostEditorProps) {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<MarkdownEditorHandle>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const canPost = user?.role === "alumni" || user?.role === "admin";

  useEffect(() => {
    if (mode !== "edit" || !postId) return;

    setLoading(true);
    api
      .get(`/posts/${postId}`)
      .then((res) => {
        if (!res.data.success) {
          setLoadError(res.data.message || "Post not found");
          return;
        }
        const post = res.data.data;
        if (post.userId?._id !== user?.id) {
          setLoadError("You can only edit your own posts.");
          return;
        }
        setTitle(post.title || "");
        setContent(post.content || "");
        setTags(post.tags || []);
        setExistingImages(post.images || []);
      })
      .catch((error) => {
        console.error("Error loading post:", error);
        setLoadError(apiErrorMessage(error, "Failed to load post"));
      })
      .finally(() => setLoading(false));
  }, [mode, postId, user?.id]);

  // Object URLs are only valid while the file is in state.
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const totalImages = existingImages.length + files.length;

  // Body references are positional: attachment:1 is the first image the post
  // carries, which is existing images first and then this session's uploads —
  // the same order the server stores them in.
  const attachmentUrls = [...existingImages.map(getPostImageUrl), ...previews];

  const insertAttachment = (index: number) => {
    editorRef.current?.insertAtCursor(`![Image ${index + 1}](attachment:${index + 1})`);
    toast.success("Image reference added to the body");
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;

    const accepted: File[] = [];
    for (const file of Array.from(incoming)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} isn't an image`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name} is larger than 5MB`);
        continue;
      }
      if (totalImages + accepted.length >= MAX_IMAGES) {
        toast.error(`You can attach up to ${MAX_IMAGES} images`);
        break;
      }
      accepted.push(file);
    }

    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = "A headline is required.";
    if (!content.trim()) nextErrors.content = "Write something before publishing.";
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      toast.error("Fill in the highlighted fields");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content);
      formData.append("tags", JSON.stringify(tags));
      files.forEach((file) => formData.append("images", file));

      if (mode === "edit") {
        formData.append("existing_images", JSON.stringify(existingImages));
        await api.put(`/posts/${postId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Post updated — it will reappear once reviewed");
        trackFormSubmit("edit_post", { has_images: totalImages > 0 });
      } else {
        await api.post("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Post submitted for review");
        trackFormSubmit("create_post", { has_images: totalImages > 0 });
      }

      navigate("/dashboard/posts?tab=my");
    } catch (error) {
      console.error("Error saving post:", error);
      trackEvent(mode === "edit" ? "edit_post_error" : "create_post_error");
      toast.error(apiErrorMessage(error, "Failed to save post"));
    } finally {
      setSaving(false);
    }
  };

  if (!canPost) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <EmptyState
          icon={<Info className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title="Posting is alumni-only for now"
          description="Publishing to the community feed will open up to students in a future release."
          action={
            <Link to="/dashboard/posts">
              <Button className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover">
                <ArrowLeft className="h-4 w-4" />
                Back to Posts
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <EmptyState
          icon={<Info className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title="Can't edit this post"
          description={loadError}
          action={
            <Link to="/dashboard/posts?tab=my">
              <Button className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover">
                <ArrowLeft className="h-4 w-4" />
                Back to My Posts
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
      <div className="mx-auto max-w-7xl pb-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to="/dashboard/posts"
              className="mb-2 inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Posts
            </Link>
            <h1 className="text-headline-lg-mobile text-primary md:text-headline-xl">
              {mode === "edit" ? "Edit Post" : "Create Post"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
              className="rounded-full border-border px-5 text-label-md text-muted-foreground hover:border-primary hover:text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="gap-2 rounded-full bg-primary px-6 text-label-md text-primary-foreground hover:bg-primary-hover"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Resubmit Post" : "Publish Post"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Composer */}
          <div className="space-y-6 lg:col-span-2">
            <Card title="Post Headline">
              <input
                type="text"
                value={title}
                maxLength={120}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="Give your post a compelling title…"
                className={cn(
                  "h-12 w-full rounded-lg border bg-card px-4 text-body-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                  errors.title
                    ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                    : "border-input focus:border-primary focus:ring-ring"
                )}
              />
              {errors.title && (
                <p
                  id="title-error"
                  className="mt-2 flex items-center gap-1.5 text-body-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errors.title}
                </p>
              )}

              <div
                className={cn(
                  "mt-4 rounded-lg",
                  errors.content && "ring-2 ring-destructive/40"
                )}
              >
                <MarkdownEditor
                  ref={editorRef}
                  value={content}
                  attachments={attachmentUrls}
                  onChange={(next) => {
                    setContent(next);
                    if (errors.content)
                      setErrors((prev) => ({ ...prev, content: undefined }));
                  }}
                />
              </div>
              {errors.content && (
                <p className="mt-2 flex items-center gap-1.5 text-body-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errors.content}
                </p>
              )}
            </Card>

            <Card title="Media">
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  addFiles(event.dataTransfer.files);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  dragging
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                } ${totalImages >= MAX_IMAGES ? "pointer-events-none opacity-50" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => addFiles(event.target.files)}
                />
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                </span>
                <span className="text-label-md text-foreground">
                  Click to upload or drag and drop
                </span>
                <span className="mt-1 text-body-sm text-muted-foreground">
                  PNG, JPG, GIF or WEBP — up to 5MB, {MAX_IMAGES} images max
                </span>
              </label>

              {totalImages > 0 && (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {attachmentUrls.map((url, index) => {
                      const isExisting = index < existingImages.length;
                      return (
                        <figure key={url} className="relative">
                          <img
                            src={url}
                            alt={`Attachment ${index + 1}`}
                            className="h-40 w-full rounded-lg border border-border object-cover"
                          />

                          <span className="absolute left-2 top-2 rounded-full bg-surface-inverse/80 px-2 py-0.5 text-label-sm text-surface-inverse-foreground">
                            Image {index + 1}
                          </span>

                          <button
                            type="button"
                            aria-label={`Remove image ${index + 1}`}
                            onClick={() =>
                              isExisting
                                ? setExistingImages((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                : setFiles((prev) =>
                                    prev.filter(
                                      (_, i) => i !== index - existingImages.length
                                    )
                                  )
                            }
                            className="absolute right-2 top-2 rounded-full bg-surface-inverse/80 p-1.5 text-surface-inverse-foreground transition-colors hover:bg-surface-inverse"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => insertAttachment(index)}
                            className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full bg-card/95 py-1.5 text-label-sm text-primary shadow-card transition-colors hover:bg-card"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Insert in body
                          </button>
                        </figure>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-body-sm text-muted-foreground">
                    Attachments appear under the post by default. “Insert in body”
                    drops a reference at your cursor so the image renders inline
                    instead. References are positional, so if you remove an image
                    afterwards, check Preview to confirm they still point where
                    you expect.
                  </p>
                </>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card title="Tags">
              <p className="mb-4 text-body-sm text-muted-foreground">
                Relevant tags help your post reach the right audience and surface
                it in related discussions across the network. Add up to {MAX_TAGS}.
              </p>
              <TagInput value={tags} onChange={setTags} />
            </Card>

            <section className="rounded-card border border-border bg-accent p-6">
              <h2 className="mb-3 flex items-center gap-2 text-headline-md text-primary">
                <Gavel className="h-5 w-5" />
                Community Guidelines
              </h2>
              <p className="text-body-sm text-muted-foreground">
                Keep it professional. Posts using offensive language, or promoting
                a product or service outright, are removed during review — reframe
                promotional material as a case study or lesson learned. Repeat
                violations can cost you posting privileges.
              </p>
            </section>

            <section className="rounded-card border border-border bg-card p-6 shadow-card">
              <h2 className="mb-3 flex items-center gap-2 text-headline-md text-foreground">
                <Info className="h-5 w-5 text-muted-foreground" />
                Before you publish
              </h2>
              <ul className="space-y-2 text-body-sm text-muted-foreground">
                <li>• Every post is reviewed by an administrator before it goes live.</li>
                <li>• Markdown is supported — headings, lists, quotes and links.</li>
                <li>• Type @ in the body to mention another alum.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
