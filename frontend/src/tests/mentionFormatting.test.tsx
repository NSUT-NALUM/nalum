import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { renderMentions, parseFormattedText } from "@/lib/textFormatting";

const renderWithRouter = (ui: React.ReactNode) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("Mention and Text Formatting", () => {
  it("renders single-word structured legacy mention", () => {
    const nodes = renderMentions("Hello @[Alice](user-123)!");
    renderWithRouter(<div>{nodes}</div>);

    const link = screen.getByRole("link", { name: "@Alice" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dashboard/alumni/user-123");
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });

  it("renders multi-word structured mention with full name", () => {
    const nodes = renderMentions("Welcome @[John Doe](user-456) to the team");
    renderWithRouter(<div>{nodes}</div>);

    const link = screen.getByRole("link", { name: "@John Doe" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dashboard/alumni/user-456");
    expect(screen.getByText(/Welcome/)).toBeInTheDocument();
    expect(screen.getByText(/to the team/)).toBeInTheDocument();
  });

  it("renders distinct high-contrast bold white style for outgoing isOwn messages", () => {
    const nodes = renderMentions("Hey @[John Doe](user-456)!", true);
    renderWithRouter(<div>{nodes}</div>);

    const link = screen.getByRole("link", { name: "@John Doe" });
    expect(link).toHaveClass("text-white");
    expect(link).toHaveClass("font-bold");
    expect(link).not.toHaveClass("bg-white/20");
  });

  it("renders multi-word plain mention @First Last cleanly", () => {
    const nodes = renderMentions("Hey @Jane Doe, please review this!");
    renderWithRouter(<div>{nodes}</div>);

    expect(screen.getByText("@Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/Hey/)).toBeInTheDocument();
    expect(screen.getByText(/, please review this!/)).toBeInTheDocument();
  });

  it("handles multi-word plain mentions with hyphenated names", () => {
    const nodes = renderMentions("Thanks @Mary-Jane Watson!");
    renderWithRouter(<div>{nodes}</div>);

    expect(screen.getByText("@Mary-Jane Watson")).toBeInTheDocument();
  });

  it("parses multiple multi-word mentions in the same message", () => {
    const nodes = renderMentions("CC @John Doe and @Jane Smith for visibility.");
    renderWithRouter(<div>{nodes}</div>);

    expect(screen.getByText("@John Doe")).toBeInTheDocument();
    expect(screen.getByText("@Jane Smith")).toBeInTheDocument();
    expect(screen.getByText(/and/)).toBeInTheDocument();
  });

  it("parses formatted text including markdown and mentions", () => {
    const nodes = parseFormattedText("**Title**\nHello @[John Doe](user-1), check *this* out.");
    renderWithRouter(<div>{nodes}</div>);

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "@John Doe" })).toHaveAttribute("href", "/dashboard/alumni/user-1");
  });
});
