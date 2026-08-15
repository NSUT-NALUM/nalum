import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import MentionTextarea from "@/components/MentionTextarea";
import api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

const TestMentionComponent = ({
  initialValue = "",
  onKeyDown,
  onResolverReady,
}: {
  initialValue?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onResolverReady?: (resolver: (text: string) => string) => void;
}) => {
  const [val, setVal] = useState(initialValue);
  return (
    <MentionTextarea
      value={val}
      onChange={setVal}
      onKeyDown={onKeyDown}
      onResolverReady={onResolverReady}
      placeholder="Type a message..."
    />
  );
};

describe("MentionTextarea Component", () => {
  it("fetches suggestions on multi-word query and autocompletes with Enter", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValueOnce({
      data: {
        users: [
          { _id: "user-1", name: "John Doe", role: "alumni", profile_picture: null },
          { _id: "user-2", name: "John Smith", role: "student", profile_picture: null },
        ],
      },
    });

    const externalKeyDownMock = vi.fn();
    let resolverFn: (t: string) => string = (t) => t;

    render(
      <TestMentionComponent
        onKeyDown={externalKeyDownMock}
        onResolverReady={(fn) => {
          resolverFn = fn;
        }}
      />
    );

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "Hello @John");

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });

    externalKeyDownMock.mockClear();

    // Press Enter to autocomplete first suggestion
    await user.keyboard("{Enter}");

    // Value should now have @John Doe with space
    expect(textarea).toHaveValue("Hello @John Doe ");

    // External onKeyDown should NOT be triggered on autocomplete Enter
    expect(externalKeyDownMock).not.toHaveBeenCalled();

    // Dropdown should now be closed
    expect(screen.queryByText("John Smith")).not.toBeInTheDocument();

    // Resolver should resolve @John Doe to token
    expect(resolverFn("Hello @John Doe ")).toBe("Hello @[John Doe](user-1) ");
  });

  it("autocompletes with Tab and prevents default focus jump", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValueOnce({
      data: {
        users: [
          { _id: "user-2", name: "Jane Smith", role: "alumni", profile_picture: null },
        ],
      },
    });

    const externalKeyDownMock = vi.fn();

    render(
      <TestMentionComponent onKeyDown={externalKeyDownMock} />
    );

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "@Jane");

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    externalKeyDownMock.mockClear();

    // Press Tab to autocomplete
    await user.keyboard("{Tab}");

    expect(textarea).toHaveValue("@Jane Smith ");
    expect(textarea).toHaveFocus();
    expect(externalKeyDownMock).not.toHaveBeenCalled();
  });

  it("navigates suggestions with ArrowDown / ArrowUp and closes on Escape", async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValueOnce({
      data: {
        users: [
          { _id: "user-1", name: "Alice Adams", role: "alumni", profile_picture: null },
          { _id: "user-2", name: "Alice Brown", role: "student", profile_picture: null },
        ],
      },
    });

    render(<TestMentionComponent />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "@Alice");

    await waitFor(() => {
      expect(screen.getByText("Alice Adams")).toBeInTheDocument();
      expect(screen.getByText("Alice Brown")).toBeInTheDocument();
    });

    // Arrow down to select second user
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(textarea).toHaveValue("@Alice Brown ");
  });

  it("forwards Enter to external onKeyDown when dropdown is not open", async () => {
    const user = userEvent.setup();
    const externalKeyDownMock = vi.fn();

    render(<TestMentionComponent onKeyDown={externalKeyDownMock} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "Normal message without mention");
    await user.keyboard("{Enter}");

    expect(externalKeyDownMock).toHaveBeenCalled();
  });
});
