import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, MessageSquare, Bell, Loader2, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/context/ProfileContext";
import { useConversations } from "@/hooks/useConversations";
import { useNotifications } from "@/context/NotificationContext";
import UserAvatar from "@/components/UserAvatar";
import NotificationsPopover from "@/components/NotificationsPopover";
import { PreloadLink } from "@/components/PreloadLink";
import nsutLogo from "@/assets/nsut-logo.svg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRANCHES, CAMPUSES } from "@/constants/branches";
import { globalSearch } from "@/lib/api";

// Static titles for the desktop header. Routes not listed here (dynamic
// detail pages, etc.) simply render without a title until they're mapped.
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/alumni": "Directory",
  "/dashboard/chat": "Messages",
  "/dashboard/events": "Events",
  "/dashboard/queries": "Queries",
  "/dashboard/posts": "Posts",
  "/dashboard/posts/new": "Create Post",
  "/dashboard/giving": "Give",
  "/dashboard/profile": "Profile",
  "/dashboard/update-profile": "Account Settings",
  "/dashboard/connections": "Connections",
  "/dashboard/host-event": "Host Event",
};

const Header = () => {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname];
  const { profile } = useProfile();
  const { conversations } = useConversations();
  const { unreadCount: notificationUnreadCount } = useNotifications();

  const unreadCount = conversations.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ users: any[], posts: any[] }>({ users: [], posts: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<'people' | 'posts'>('people');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQueryRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Advanced people filters (mirrors the old mobile search panel)
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    batch: "",
    branch: "",
    campus: "",
    company: "",
    skills: [] as string[],
    connectionFilter: "all" as "all" | "connected" | "not_connected",
  });
  const [skillInput, setSkillInput] = useState("");

  // Auto-focus input when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search bar when switching routes
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults({ users: [], posts: [] });
    setShowFilters(false);
  }, [location.pathname]);

  // Close the search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    currentQueryRef.current = query;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (query.trim().length > 0) {
      setIsSearching(true);
      searchDebounceRef.current = setTimeout(async () => {
        if (currentQueryRef.current !== query) return;
        try {
          const results = await globalSearch(query, searchFilters);
          if (currentQueryRef.current === query) {
            setSearchResults(results);
          }
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          if (currentQueryRef.current === query) {
            setIsSearching(false);
          }
        }
      }, 50);
    } else {
      setSearchResults({ users: [], posts: [] });
      setIsSearching(false);
    }
  };

  // min-h-0 on the header is required: as a flex item in the layout's column
  // flex container, its automatic minimum size (min-height: auto) resolves to
  // the min-content height and overrides the height class, stretching the bar.
  return (
    <header className="flex items-center gap-2 md:gap-4 h-20 min-h-0 max-h-20 px-4 md:px-8 border-b border-border bg-card sticky top-0 z-30 shrink-0">
      {/* Brand mark — sidebar (which carries the same mark) is hidden below md */}
      <PreloadLink to="/dashboard" className="flex items-center gap-2 md:hidden shrink-0">
        <img src={nsutLogo} alt="NSUT Alumni" width={24} height={24} className="h-6 w-6" />
        <span className="font-bold text-sm tracking-wide whitespace-nowrap">
          <span className="text-primary">N</span>
          <span className="text-foreground">SUT</span>
          <span className="text-primary"> ALUM</span>
          <span className="text-foreground">NI</span>
        </span>
      </PreloadLink>

      {/* Page title — only rendered for routes mapped in PAGE_TITLES above */}
      {pageTitle && (
        <h2 className="hidden md:block text-headline-md text-foreground shrink-0 truncate">
          {pageTitle}
        </h2>
      )}

      <div className="flex-1 min-w-0" />

      {/* Search — collapses to a bare icon below `sm`; tapping/focusing it
          expands the input in place. Widened queries keep it expanded even
          on blur so the active search stays visible. */}
      <div
        ref={searchBoxRef}
        className={cn(
          "relative shrink-0 transition-all duration-200",
          isSearchOpen || searchQuery.trim().length > 0 ? "w-40" : "w-10",
          "sm:w-40 md:w-56 lg:w-64"
        )}
      >
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer sm:pointer-events-none"
          onClick={() => inputRef.current?.focus()}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onFocus={() => setIsSearchOpen(true)}
          onChange={handleSearchChange}
          className="w-full h-10 pl-9 pr-3 rounded-full border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}

        {/* Search results dropdown — carried over from the old mobile-only bar as-is;
            still dark themed and pending its own redesign pass. */}
        {isSearchOpen && ((searchResults.users.length > 0 || searchResults.posts.length > 0) || searchQuery.trim().length > 0) && (
          <div className="absolute top-full inset-x-0 -mx-4 md:mx-0 md:inset-x-auto md:right-0 md:left-auto md:w-[26rem] md:mt-2 z-40 bg-slate-900/95 backdrop-blur-md border-b md:border md:rounded-lg border-white/10 shadow-lg animate-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">

            {/* Tabs - Instagram style */}
            <div className="flex border-b border-white/10 bg-black/20">
              <button
                onClick={() => setSearchTab('people')}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors relative",
                  searchTab === 'people'
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300"
                )}
              >
                People ({searchResults.users.length})
                {searchTab === 'people' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
              <button
                onClick={() => setSearchTab('posts')}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors relative",
                  searchTab === 'posts'
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300"
                )}
              >
                Posts ({searchResults.posts.length})
                {searchTab === 'posts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            </div>

            {/* Filter Header - Only show for people tab */}
            {searchTab === 'people' && (
              <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">
                    {searchResults.users.length} result{searchResults.users.length !== 1 ? 's' : ''}
                  </span>
                  {(searchFilters.batch || searchFilters.branch || searchFilters.campus || searchFilters.company || searchFilters.skills.length > 0 || searchFilters.connectionFilter !== "all") && (
                    <span className="flex items-center gap-1 text-xs text-blue-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      filtered
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-7 px-2 text-xs hover:bg-transparent text-blue-400"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                  Filters
                </Button>
              </div>
            )}

            {/* Filter Panel */}
            {searchTab === 'people' && showFilters && (
              <div className="p-3 bg-black/30 border-b border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-white">Refine Results</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const emptyFilters = { batch: "", branch: "", campus: "", company: "", skills: [], connectionFilter: "all" as const };
                      setSearchFilters(emptyFilters);
                      setSkillInput("");
                      if (searchQuery.trim()) {
                        globalSearch(searchQuery, emptyFilters).then((results) => {
                          setSearchResults(results);
                        });
                      }
                    }}
                    className="h-5 px-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Reset
                  </Button>
                </div>

                {/* Row 1: Batch, Company */}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Batch (2020)"
                    value={searchFilters.batch}
                    onChange={(e) => {
                      const newFilters = { ...searchFilters, batch: e.target.value };
                      setSearchFilters(newFilters);
                      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                      searchDebounceRef.current = setTimeout(async () => {
                        const results = await globalSearch(searchQuery, newFilters);
                        setSearchResults(results);
                      }, 300);
                    }}
                    className="h-7 bg-black/30 border-white/10 text-xs text-white"
                  />
                  <Input
                    placeholder="Company"
                    value={searchFilters.company}
                    onChange={(e) => {
                      const newFilters = { ...searchFilters, company: e.target.value };
                      setSearchFilters(newFilters);
                      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                      searchDebounceRef.current = setTimeout(async () => {
                        const results = await globalSearch(searchQuery, newFilters);
                        setSearchResults(results);
                      }, 300);
                    }}
                    className="h-7 bg-black/30 border-white/10 text-xs text-white"
                  />
                </div>

                {/* Row 2: Branch, Campus */}
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={searchFilters.branch}
                    onValueChange={(val) => {
                      const newFilters = { ...searchFilters, branch: val === "all" ? "" : val };
                      setSearchFilters(newFilters);
                      globalSearch(searchQuery, newFilters).then((results) => {
                        setSearchResults(results);
                      });
                    }}
                  >
                    <SelectTrigger className="h-7 bg-black/30 border-white/10 text-xs text-white">
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white max-h-48">
                      <SelectItem value="all">All Branches</SelectItem>
                      {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select
                    value={searchFilters.campus}
                    onValueChange={(val) => {
                      const newFilters = { ...searchFilters, campus: val === "all" ? "" : val };
                      setSearchFilters(newFilters);
                      globalSearch(searchQuery, newFilters).then((results) => {
                        setSearchResults(results);
                      });
                    }}
                  >
                    <SelectTrigger className="h-7 bg-black/30 border-white/10 text-xs text-white">
                      <SelectValue placeholder="Campus" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="all">All Campuses</SelectItem>
                      {CAMPUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 3: Skills */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && skillInput.trim()) {
                        e.preventDefault();
                        const newSkills = [...searchFilters.skills, skillInput.trim()];
                        const newFilters = { ...searchFilters, skills: newSkills };
                        setSearchFilters(newFilters);
                        setSkillInput("");
                        globalSearch(searchQuery, newFilters).then((results) => {
                          setSearchResults(results);
                        });
                      }
                    }}
                    className="h-7 bg-black/30 border-white/10 text-xs text-white flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (skillInput.trim()) {
                        const newSkills = [...searchFilters.skills, skillInput.trim()];
                        const newFilters = { ...searchFilters, skills: newSkills };
                        setSearchFilters(newFilters);
                        setSkillInput("");
                        globalSearch(searchQuery, newFilters).then((results) => {
                          setSearchResults(results);
                        });
                      }
                    }}
                    className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-500"
                  >
                    Add
                  </Button>
                </div>
                {searchFilters.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {searchFilters.skills.map((skill, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs h-5 bg-white/10 text-gray-200 hover:bg-white/20 cursor-pointer"
                        onClick={() => {
                          const newSkills = searchFilters.skills.filter((_, idx) => idx !== i);
                          const newFilters = { ...searchFilters, skills: newSkills };
                          setSearchFilters(newFilters);
                          globalSearch(searchQuery, newFilters).then((results) => {
                            setSearchResults(results);
                          });
                        }}
                      >
                        {skill} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Row 4: Connection Status */}
                <div className="flex gap-1">
                  {(["all", "connected", "not_connected"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={searchFilters.connectionFilter === status ? "default" : "outline"}
                      onClick={() => {
                        const newFilters = { ...searchFilters, connectionFilter: status };
                        setSearchFilters(newFilters);
                        globalSearch(searchQuery, newFilters).then((results) => {
                          setSearchResults(results);
                        });
                      }}
                      className={`h-6 px-2 text-xs flex-1 ${searchFilters.connectionFilter === status
                        ? "bg-blue-600 text-white"
                        : "bg-transparent border-white/20 text-gray-400 hover:text-white"
                        }`}
                    >
                      {status === "all" ? "All" : status === "connected" ? "Connected" : "Not Connected"}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {/* Results List */}
            <div className="flex flex-col p-2 gap-1">
              {/* People Tab Results */}
              {searchTab === 'people' && (
                <>
                  {searchResults.users.length === 0 && searchQuery.trim().length > 0 && !isSearching && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      No people found. Try adjusting filters.
                    </div>
                  )}
                  {searchResults.users.map((result) => (
                    <Link
                      key={result._id}
                      to={`/dashboard/alumni/${result.user._id}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults({ users: [], posts: [] });
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="relative flex-shrink-0">
                        <UserAvatar
                          src={result.profile_picture}
                          name={result.user.name}
                          className="h-10 w-10 border border-slate-700"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-white truncate">
                          {result.user.name}
                        </span>
                        <span className="text-xs text-gray-400 truncate">
                          {result.batch} • {result.branch}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {searchResults.users.length >= 15 && (
                    <Link
                      to={`/dashboard/alumni?search=${encodeURIComponent(searchQuery)}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults({ users: [], posts: [] });
                      }}
                      className="p-3 text-center text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      View all results →
                    </Link>
                  )}
                </>
              )}

              {/* Posts Tab Results */}
              {searchTab === 'posts' && (
                <>
                  {searchResults.posts.length === 0 && searchQuery.trim().length > 0 && !isSearching && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      No posts found matching your search.
                    </div>
                  )}
                  {searchResults.posts.map((post: any) => (
                    <Link
                      key={post._id}
                      to={`/dashboard/posts/${post._id}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults({ users: [], posts: [] });
                      }}
                      className="flex flex-col gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          src={post.userId?.profile_picture}
                          name={post.userId?.name}
                          className="h-8 w-8 border border-slate-700"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-medium text-white truncate">
                            {post.userId?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-semibold text-white line-clamp-1">
                          {post.title}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Mobile: dedicated notifications page (bottom nav has no room for a popover) */}
        <Link
          to="/dashboard/notifications"
          className="md:hidden relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
        >
          <Bell className="h-5 w-5" />
          {notificationUnreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
          )}
        </Link>
        {/* Desktop: notification popover */}
        <div className="hidden md:block">
          <NotificationsPopover />
        </div>

        {/* Mobile: bottom nav has no messages entry, so keep it reachable here */}
        <Link
          to="/dashboard/chat"
          className="md:hidden relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
          )}
        </Link>

        {/* Desktop: avatar links straight to the profile (mobile reaches it via the bottom nav sheet) */}
        <Link to="/dashboard/profile" className="hidden md:block">
          <UserAvatar
            src={profile?.profile_picture}
            name={profile?.user?.name || "User"}
            size="sm"
            className="ring-2 ring-transparent hover:ring-primary transition-all"
          />
        </Link>
      </div>
    </header>
  );
};

export default Header;
