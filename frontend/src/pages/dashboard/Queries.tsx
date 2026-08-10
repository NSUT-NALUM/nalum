import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import QueryRow, { QueryRecord } from "@/components/queries/QueryRow";
import { ImagePlus, Loader2, MessageSquare, Send, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import MentionTextarea from "@/components/MentionTextarea";
import { toast } from "sonner";

const TITLE_LIMIT = 50;
const CONTENT_LIMIT = 500;
const MAX_IMAGES = 2;

const QueryRowSkeleton = () => (
  <div className="space-y-3 rounded-card border border-border bg-card p-6 shadow-card">
    <Skeleton className="h-5 w-32 rounded-full" />
    <Skeleton className="h-6 w-2/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
);

const Queries = () => {
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const resolverRef = useRef<(t: string) => string>((t) => t);

  useEffect(() => {
    fetchMyQueries();
  }, []);

  const fetchMyQueries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/queries/my");
      setQueries(data.data || []);
    } catch (err: any) {
      console.error("Error fetching queries:", err);
      setError(err.response?.data?.message || "Failed to load your queries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedImages.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setSelectedImages([...selectedImages, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (title.length > TITLE_LIMIT) {
      toast.error(`Title must be ${TITLE_LIMIT} characters or less`);
      return;
    }

    if (content.length > CONTENT_LIMIT) {
      toast.error(`Content must be ${CONTENT_LIMIT} characters or less`);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", resolverRef.current(content));
      selectedImages.forEach((image) => {
        formData.append("images", image);
      });

      await api.post("/queries", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Query submitted successfully");
      setTitle("");
      setContent("");
      setSelectedImages([]);
      setImagePreviews([]);
      fetchMyQueries();
    } catch (err: any) {
      console.error("Error submitting query:", err);
      toast.error(err.response?.data?.message || "Failed to submit query");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
      <div className="mx-auto max-w-7xl pb-12">
        {/* Header */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="mb-2 text-headline-lg-mobile text-primary md:text-headline-xl">
            Queries
          </h1>
          <p className="text-body-lg text-muted-foreground">
            Ask the alumni office a question — track the response right here.
          </p>
        </div>

        {/* Submit Query Form */}
        <section className="rounded-card border border-border bg-card p-6 shadow-card">
          <h2 className="mb-5 border-b border-border pb-3 text-headline-md text-foreground">
            Ask a Query
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="query-title">
                  Title <span className="text-primary">*</span>
                </Label>
                <span className="text-label-sm text-muted-foreground">
                  {title.length}/{TITLE_LIMIT}
                </span>
              </div>
              <Input
                id="query-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief title for your query"
                maxLength={TITLE_LIMIT}
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="query-content">
                  Details <span className="text-primary">*</span>
                </Label>
                <span className="text-label-sm text-muted-foreground">
                  {content.length}/{CONTENT_LIMIT}
                </span>
              </div>
              <MentionTextarea
                id="query-content"
                value={content}
                onChange={setContent}
                onResolverReady={(fn) => {
                  resolverRef.current = fn;
                }}
                placeholder="Describe your query in detail... (type @ to mention someone)"
                maxLength={CONTENT_LIMIT}
                required
                style={{ minHeight: "96px" }}
              />
            </div>

            <div>
              <Label>
                Attach Photos{" "}
                <span className="font-normal text-muted-foreground">
                  (optional, up to {MAX_IMAGES})
                </span>
              </Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {selectedImages.length < MAX_IMAGES && (
                  <label
                    htmlFor="query-images"
                    className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-primary/30 bg-muted text-center transition-colors hover:border-primary/60 hover:bg-accent"
                  >
                    <ImagePlus className="h-5 w-5 text-primary" />
                    <span className="text-label-sm text-muted-foreground">
                      Add photo
                    </span>
                  </label>
                )}
              </div>
              <input
                id="query-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="sr-only"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 rounded-full bg-primary px-6 text-label-md text-primary-foreground hover:bg-primary-hover sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Query
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* User's Queries */}
        <div className="mt-10">
          <h2 className="mb-4 text-headline-md text-foreground">
            My Queries{" "}
            {queries.length > 0 && (
              <span className="text-muted-foreground">({queries.length})</span>
            )}
          </h2>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <QueryRowSkeleton />
              <QueryRowSkeleton />
            </div>
          ) : queries.length === 0 ? (
            <EmptyState
              icon={
                <MessageSquare className="mx-auto h-14 w-14 text-muted-foreground/50" />
              }
              title="No queries yet"
              description="Submit your first query using the form above — we'll show the response here once it's ready."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {queries.map((query, index) => (
                <QueryRow key={query._id} query={query} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Queries;
