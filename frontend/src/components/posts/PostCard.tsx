import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Clock, Edit, Trash2, AlertCircle, ChevronLeft, ChevronRight, X, Flag } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import api from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import { useProfile } from "@/context/ProfileContext";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ReportDialog from "@/components/reports/ReportDialog";
import { parseFormattedText } from "@/lib/textFormatting";

interface Post {
  _id: string;
  title: string;
  content: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    profile_picture?: string;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
  status?: string;
  rejection_reason?: string;
}

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  showStatus?: boolean;
  showRejectionReason?: boolean;
}

const PostCard = ({
  post,
  onEdit,
  onDelete,
  showStatus,
  showRejectionReason,
}: PostCardProps) => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const isAuthor = profile?.user?._id === post.userId._id;
  const isAdminPost = post.userId.role === "admin";
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAdminQueryMessage, setShowAdminQueryMessage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdminPost) {
      setShowAdminQueryMessage((prev) => !prev);
      return;
    }
    navigate(`/dashboard/alumni/${post.userId._id}`);
  };

  useEffect(() => {
    if (contentRef.current && !isExpanded) {
      setIsTruncated(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    }
  }, [post.content, isExpanded]);

  useEffect(() => {
    const checkReportStatus = async () => {
      if (!isAuthor) {
        try {
          const { data } = await api.get(`/reports/post/${post._id}/check`);
          setHasReported(data.hasReported);
        } catch (error) {
          console.error("Error checking report status:", error);
        }
      }
    };
    checkReportStatus();
  }, [post._id, isAuthor]);

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}/uploads/posts/${imagePath}`;
  };

  const getStatusBadge = () => {
    if (!showStatus || !post.status) return null;

    const statusConfig = {
      pending: {
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        text: "Pending Review",
      },
      approved: {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        text: "Approved",
      },
      rejected: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        text: "Rejected",
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

  const handlePostClick = () => {
    if (isReportDialogOpen) return;
    navigate(`/dashboard/posts/${post._id}`);
  };


  return (
    <div
      className={`relative bg-white/5 backdrop-blur-md rounded-xl p-6 hover:bg-white/10 transition duration-200 cursor-pointer ${
        isAdminPost ? "border-2 border-yellow-400/70" : "border border-white/10"
      }`}
      onClick={handlePostClick}
    >
      {/* Action buttons in top-right */}
      <div className="absolute top-4 right-4 flex gap-2">
        {isAuthor ? (
          <>
            {post.status !== "rejected" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(post);
                }}
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors"
                title="Edit Post"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation();onDelete?.(post._id); }}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
              title="Delete Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); !hasReported && setIsReportDialogOpen(true)}}
                  className={`p-2 rounded-full transition-colors ${
                    hasReported
                      ? "text-red-500 cursor-not-allowed"
                      : "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  }`}
                  title={hasReported ? "Already reported" : "Report Post"}
                  disabled={hasReported}
                >
                  <Flag className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              {hasReported && (
                <TooltipContent>
                  <p>Already reported</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          onClick={handleUserClick}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <UserAvatar
            src={post.userId.profile_picture}
            name={post.userId.name}
            size="md"
          />
        </div>
        <div>
          <h3
            onClick={handleUserClick}
            className={`font-semibold cursor-pointer hover:text-blue-400 transition-colors ${ isAdminPost ? "text-yellow-400" : "text-white" }`}
          >
            {post.userId.name}
          </h3>
          <div className="flex items-center text-xs text-gray-400 gap-1">
            <Clock className="h-3 w-3" />
            <span>
              updated{" "}
              {formatDistanceToNow(new Date(post.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
      
      {isAdminPost && showAdminQueryMessage && (
        <div
          className="mb-4 rounded-lg border border-yellow-400/50 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200 shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          Got any queries for the admin? Use the Queries page on the side bar.
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        {showRejectionReason &&
          post.status === "rejected" &&
          post.rejection_reason && (
            <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <span className="font-semibold">Rejection Reason:</span>{" "}
                {post.rejection_reason}
              </AlertDescription>
            </Alert>
          )}
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
        <div>
          <div
            ref={contentRef}
            className={`text-gray-300 break-words leading-relaxed space-y-1 ${!isExpanded ? "line-clamp-4" : ""
            }`}
          >
            {parseFormattedText(post.content)}
          </div>
          {isTruncated && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer transition-colors inline mt-1"
            >
              ...more
            </button>
          )}
          {isExpanded && isTruncated && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer transition-colors mt-2 block"
            >
              see less
            </button>
          )}
        </div>
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="mt-4 relative">
          {/* Progress Indicators - Only show if multiple images */}
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

          {/* Image Container - Single image display */}
          <div
            className="relative overflow-hidden rounded-lg border border-white/10 group cursor-pointer"
            onClick={handleImageClick}
          >
            <img
              src={getImageUrl(post.images[currentImageIndex])}
              alt={`Post image ${currentImageIndex + 1} of ${
                post.images.length
              }`}
              className="w-full h-auto max-h-[600px] object-contain transition-transform duration-500 group-hover:scale-105"
            />

            {/* Navigation Arrows - Only show if multiple images */}
            {post.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPreviousImage();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextImage();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image Counter - Only show if multiple images */}
            {post.images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                {currentImageIndex + 1} / {post.images.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enlarged Image Modal using Dialog */}
      {selectedImage && post.images && post.images.length > 0 && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-none">
            {/* Close Button - TOP RIGHT */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-50"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Progress Indicators - TOP CENTER */}
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

            {/* Image Container */}
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              <img
                src={getImageUrl(post.images[currentImageIndex])}
                alt={`Post image ${currentImageIndex + 1} of ${
                  post.images.length
                }`}
                className="max-w-full max-h-full object-contain"
              />

              {/* Navigation Arrows */}
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

              {/* Image Counter */}
              {post.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {post.images.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Report Dialog */}
    <div onClick={(e) => e.stopPropagation()}>
      <ReportDialog
        postId={post._id}
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onReportSubmitted={() => setHasReported(true)}
      />
    </div>
    </div>
  );
};

export default PostCard;
