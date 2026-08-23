import { useState, useRef, useEffect } from "react";
import { LucideIcon, ChevronLeft, ChevronRight, X, AlertCircle, AlertTriangle, Eye } from "lucide-react";
import { BASE_URL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";

export interface Post {
  _id: string;
  title: string;
  content: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    profile_picture?: string;
  } | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
  status: string;
  rejection_reason?: string;
  report_count?: number;
  view_count?: number;
}

interface PostCardAdminProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  primaryButtonIcon: LucideIcon;
  secondaryButtonIcon: LucideIcon;
  isHighlighted?: boolean;
}

const PostCardAdmin = ({
  post,
  onEdit,
  onDelete,
  primaryButtonLabel,
  secondaryButtonLabel,
  primaryButtonIcon: PrimaryIcon,
  secondaryButtonIcon: SecondaryIcon,
  isHighlighted = false,
}: PostCardAdminProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && !isExpanded) {
      setIsTruncated(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    }
  }, [post.content, isExpanded]);

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}/uploads/posts/${imagePath}`;
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
        text: "pending",
      },
      approved: {
        color: "bg-green-500/20 text-green-600 border-green-500/30",
        text: "approved",
      },
      rejected: {
        color: "bg-red-500/20 text-red-600 border-red-500/30",
        text: "rejected",
      },
    };

    const config = statusConfig[post.status as keyof typeof statusConfig];
    if (!config) return null;

    return <Badge className={`${config.color} border`}>{config.text}</Badge>;
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === post.images.length - 1 ? 0 : prev + 1
    );
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? post.images.length - 1 : prev - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleImageClick = () => {
    setSelectedImage(getImageUrl(post.images[currentImageIndex]));
  };

  const reportCount = post.report_count ?? 0;

  const getReportStyles = () => {
    if (reportCount === 0) {
      return "text-gray-600";
    } else if (reportCount >= 1 && reportCount <= 4) {
      return "bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium";
    } else {
      return "bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium";
    }
  };

  return (
    <>
      <div id={`post-${post._id}`} className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-300 ${isHighlighted? "border-4 border-blue-500 animate-blink-twice": "border border-gray-200"}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{post.title}</h2>
            {getStatusBadge()}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(post)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              <PrimaryIcon size={16} className="mr-1" />
              {primaryButtonLabel}
            </Button>
            <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                <SecondaryIcon size={16} className="mr-1" />
                {secondaryButtonLabel}
              </Button>
          </div>
        </div>

        <DeleteConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            isDeleting={isDeleting}
            title="Delete this post?"
            description="This action cannot be undone. This will permanently delete the post."
            onConfirm={async () => {
              try {
                setIsDeleting(true);
                await onDelete(post);
                setIsDeleteDialogOpen(false);
              } finally {
                setIsDeleting(false);
              }
            }}
          />

        {post.status === "rejected" && post.rejection_reason && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="ml-2 text-red-700">
              <span className="font-semibold">Rejection Reason:</span>{" "}
              {post.rejection_reason}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <div
            ref={contentRef}
            className={`text-gray-700 whitespace-pre-wrap break-words leading-relaxed ${
              !isExpanded ? "line-clamp-4" : ""
            }`}
          >
            {post.content}
          </div>
          {isTruncated && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors inline mt-1"
            >
              ...more
            </button>
          )}
          {isExpanded && isTruncated && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors mt-2 block"
            >
              see less
            </button>
          )}
        </div>

        {post.images && post.images.length > 0 && (
          <div className="mb-4 relative">
            {post.images.length > 1 && (
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 flex gap-1.5">
                {post.images.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`h-0.5 rounded-full cursor-pointer transition-all duration-300 ${
                      index === currentImageIndex
                        ? "bg-white w-8"
                        : "bg-white/50 w-8 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}

            <div
              className="relative overflow-hidden rounded-lg border border-gray-200 group cursor-pointer"
              onClick={handleImageClick}
            >
              <img
                src={getImageUrl(post.images[currentImageIndex])}
                alt={`Post image ${currentImageIndex + 1} of ${
                  post.images.length
                }`}
                className="w-full h-auto max-h-[500px] object-contain transition-transform duration-500 group-hover:scale-105"
              />

              {post.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPreviousImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {post.images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  {currentImageIndex + 1} / {post.images.length}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 text-sm text-gray-600 pt-4 border-t border-gray-200">
          <div>
            <span className="font-medium text-gray-700">Author:</span>{" "}
            {post.userId?.name ?? "Unknown user"}
          </div>
          <div>
            <span className="font-medium text-gray-700">Created:</span>{" "}
            {new Date(post.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-gray-700">Views:</span>{" "}
            <span className="font-semibold text-blue-600">{post.view_count || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Reports:</span>{" "}
            <span className={getReportStyles()}>{reportCount}</span>
          </div>
        </div>
      </div>

      {selectedImage && post.images && post.images.length > 0 && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-none">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-50"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {post.images.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
                {post.images.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`h-1 rounded-full cursor-pointer transition-all duration-300 ${
                      index === currentImageIndex
                        ? "bg-white w-12"
                        : "bg-white/50 w-12 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="relative w-full h-[90vh] flex items-center justify-center">
              <img
                src={getImageUrl(post.images[currentImageIndex])}
                alt={`Post image ${currentImageIndex + 1} of ${
                  post.images.length
                }`}
                className="max-w-full max-h-full object-contain"
              />

              {post.images.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={goToNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {post.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {post.images.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PostCardAdmin;
