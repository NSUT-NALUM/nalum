import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PostMarkdown from "@/components/posts/PostMarkdown";

const renderWithRouter = (ui: React.ReactNode) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("PostMarkdown Multi-Word Mentions", () => {
  it("renders structured tokens @[John Doe](userId) as profile links", () => {
    renderWithRouter(
      <PostMarkdown content="Great work @[John Doe](user-999) on the project!" />
    );

    const link = screen.getByRole("link", { name: "@John Doe" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dashboard/alumni/user-999");
  });

  it("renders bare multi-word mentions @John Doe as unified interactive mention link", () => {
    renderWithRouter(
      <PostMarkdown content="Kudos to @John Doe for leading the effort." />
    );

    const mention = screen.getByText("@John Doe");
    expect(mention).toBeInTheDocument();
    expect(screen.getByText(/Kudos to/)).toBeInTheDocument();
    expect(screen.getByText(/for leading the effort/)).toBeInTheDocument();
  });

  it("does not treat email addresses as mentions", () => {
    renderWithRouter(
      <PostMarkdown content="Contact me at user@example.com for inquiries." />
    );

    expect(screen.queryByText("@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Contact me at/)).toBeInTheDocument();
  });

  it("handles multi-word mentions adjacent to trailing punctuation", () => {
    renderWithRouter(
      <PostMarkdown content="Special thanks to @Jane Smith! Also @Bob Dylan." />
    );

    expect(screen.getByText("@Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("@Bob Dylan")).toBeInTheDocument();
  });
});
