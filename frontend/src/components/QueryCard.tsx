import { useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { checkIsOwner } from "@/lib/utils";

interface Query {
  _id: string;
  title: string;
  content: string;
  userId: string;
  images: string[];
  status: "pending" | "viewed" | "responded";
  answer?: string;
  createdAt: string;
  updatedAt: string;
}

interface QueryCardProps {
  query: Query;
  onDelete?: (id: string) => void;
}

const QueryCard = ({ query, onDelete }: QueryCardProps) => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isOwner = checkIsOwner(
    user?.id,
    query.userId
  );
  const canDelete = isOwner || user?.role === "admin";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/10 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              {query.title}
            </h3>
            <p className="text-sm text-gray-400">
              {formatDate(query.createdAt)}
            </p>
          </div>
          {canDelete && (
            <button
              onClick={() => onDelete?.(query._id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-gray-300 mb-4 whitespace-pre-wrap">
          {query.content}
        </p>

        {/* Images */}
        {query.images && query.images.length > 0 && (
          <div
            className={`grid gap-2 mb-4 ${
              query.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {query.images.map((image, index) => (
              <img
                key={index}
                src={`${BASE_URL}/uploads/queries/${image}`}
                alt={`Query image ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() =>
                  setSelectedImage(`${BASE_URL}/uploads/queries/${image}`)
                }
              />
            ))}
          </div>
        )}

        {/* Admin Response */}
        {query.status === "responded" && query.answer && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">
                Admin Response
              </span>
            </div>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">
              {query.answer}
            </p>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
};

export default QueryCard;
