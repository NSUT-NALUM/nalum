import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import PostCard from "./PostCard";
import EditPostModal from "./EditPostModal";
import { Loader2, AlertCircle, PenSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SmartPagination } from "@/components/ui/pagination";
import { toast } from "sonner";

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
}

interface PostsFeedProps {
  refreshTrigger?: number;
  searchQuery?: string;
}

const PostsFeed = ({
  refreshTrigger = 0,
  searchQuery = "",
}: PostsFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let endpoint = `/posts?page=${currentPage}&limit=5`;
      if (searchQuery.trim()) {
        endpoint = `/posts/search?query=${encodeURIComponent(searchQuery)}`;
      }

      const { data } = await api.get(endpoint);

      const sortByAdmin = (arr: Post[]) =>
        [...arr].sort((a, b) =>
          a.userId.role === 'admin' && b.userId.role !== 'admin' ? -1 : 1,
        );

      if (searchQuery.trim()) {
        // Search results structure might be different or just a list
        const postsData = Array.isArray(data.data)
          ? data.data
          : data.data.posts;
        setPosts(sortByAdmin(postsData));
        setTotalPages(1); // Hide pagination for search results
      } else {
        // Normal feed with pagination
        setPosts(sortByAdmin(data.data.posts));
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshTrigger]);

  const handleEdit = (post: Post) => {
    setSelectedPost(post);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter((post) => post._id !== postId));
      toast.success("Post deleted successfully");
    } catch (err: any) {
      console.error("Error deleting post:", err);
      toast.error(err.response?.data?.message || "Failed to delete post");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-xl p-6 h-64 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex flex-col">
        <div className="max-h-[600px] overflow-y-auto p-6 min-h-[400px] flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
              <PenSquare className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {searchQuery ? "No results found" : "No posts yet"}
              </h3>
              <p className="text-gray-400">
                {searchQuery
                  ? `We couldn't find any posts matching "${searchQuery}"`
                  : "Start sharing with the community!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}

      {!searchQuery && totalPages > 1 && (
        <div className="mt-4">
          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <EditPostModal
        open={isEditModalOpen}
        post={selectedPost}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPost(null);
        }}
        onPostUpdated={fetchPosts}
      />
    </div>
  );
};

export default PostsFeed;
