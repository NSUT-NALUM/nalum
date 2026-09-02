import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostCard from "@/components/posts/PostCard";
import api from "@/lib/api";
import { PostRecord } from "@/lib/posts";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/hooks/useTrackPostView", () => ({
  useTrackPostView: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: { post: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const post = (likes: string[]): PostRecord => ({
  _id: "post-1",
  title: "A post",
  content: "Post body",
  userId: { _id: "author-1", name: "Author" },
  likes,
  commentCount: 0,
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
});

const renderCard = (queryClient: QueryClient, value: PostRecord) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PostCard post={value} context="feed" />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("post likes", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("synchronizes the liked state when a refreshed post payload arrives", async () => {
    const queryClient = new QueryClient();
    const view = renderCard(queryClient, post([]));

    expect(screen.getByRole("button", { name: "Upvote post" })).toBeInTheDocument();

    view.rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PostCard post={post(["user-1"])} context="feed" />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("button", { name: "Remove upvote" }),
    ).toBeInTheDocument();
  });

  it("invalidates cached post lists after the server confirms a like", async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, liked: true, likes: ["user-1"] },
    });
    renderCard(queryClient, post([]));

    fireEvent.click(screen.getByRole("button", { name: "Upvote post" }));

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["posts"] });
    });
    expect(screen.getByRole("button", { name: "Remove upvote" })).toBeInTheDocument();
  });
});
