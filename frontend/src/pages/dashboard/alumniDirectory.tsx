import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Search,
  Filter,
  X,
  Loader2,
} from "lucide-react";
import { useAlumniDirectory } from "@/hooks/useAlumniDirectory";
import { AlumniCard } from "@/components/alumni/AlumniCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SmartPagination } from "@/components/ui/pagination";
import { BRANCHES, CAMPUSES } from "@/constants/branches";
import UserAvatar from "@/components/UserAvatar";

const AlumniDirectory = () => {
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Modal state
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    alumni,
    isLoading,
    hasSearched,
    currentPage,
    totalPages,
    filters,
    skillInput,
    showClearButton,
    setSkillInput,
    handleFilterChange,
    handleAddSkill,
    handleRemoveSkill,
    handleSearch,
    handleClearResults,
    handlePageChange,
    handleConnect,
    getFilteredAlumni,
  } = useAlumniDirectory();

  // Calculate active modal filters count
  const activeFilterCount = [
    filters.campus && filters.campus !== "All Campuses",
    filters.company,
    filters.city,
    filters.country,
    filters.skills.length > 0,
    filters.connectionFilter !== "all",
    filters.roleFilter !== "all"
  ].filter(Boolean).length;

  // Clear modal filters
  const handleClearModalFilters = () => {
    handleFilterChange("campus", "All Campuses");
    handleFilterChange("company", "");
    handleFilterChange("city", "");
    handleFilterChange("country", "");

    // TODO: Verify if useAlumniDirectory exposes a way to fully clear skills.
    // If handleFilterChange("skills", []) is not supported, this might need tweaking.
    handleFilterChange("skills", []);

    handleFilterChange("connectionFilter", "all");
    handleFilterChange("roleFilter", "all");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-foreground">
      {/* Main Content */}
      <div className="container mx-auto">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Alumni Directory
            </h2>
            <p className="text-muted-foreground">
              Connect with fellow NSUT alumni from across batches and branches
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8">
            <div className="space-y-3">
              {/* Top Row: Search Bar */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={(e) =>
                      handleFilterChange("name", e.target.value)
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                  />

                  {/* Mobile Search Dropdown */}
                  {isSearchFocused && filters.name && (
                    <div className="md:hidden absolute top-full mt-2 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
                      {isLoading ? (
                        <div className="p-4 flex items-center justify-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Searching...
                        </div>
                      ) : alumni.length > 0 ? (
                        <div className="py-2">
                          {alumni.slice(0, 5).map((profile) => (
                            <div
                              key={profile._id}
                              onClick={() => navigate(`/dashboard/alumni/${profile.user._id}`)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors"
                            >
                              <UserAvatar
                                src={profile.profile_picture}
                                name={profile.user.name}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {profile.user.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {profile.batch} • {profile.branch}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div
                            onClick={() => {
                              setIsSearchFocused(false);
                            }}
                            className="px-4 py-2 text-center text-xs text-primary font-medium cursor-pointer border-t border-border hover:bg-accent"
                          >
                            View all {alumni.length} results
                          </div>
                        </div>
                      ) : hasSearched ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          No alumni found matching "{filters.name}"
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {showClearButton ? (
                  <Button
                    onClick={handleClearResults}
                    variant="outline"
                    size="icon"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent shrink-0 w-10 h-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSearch}
                    size="icon"
                    className="bg-primary hover:bg-primary-hover text-primary-foreground shrink-0 w-10 h-10"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Second Row: Inline Filters & Modal Trigger */}
              <div className="grid grid-cols-2 md:flex md:items-center gap-2">
                {/* Inline Batch */}
                <div className="w-full md:w-32 shrink-0">
                  <Input
                    id="batch-inline"
                    placeholder="Batch (e.g. 2020)"
                    value={filters.batch}
                    onChange={(e) =>
                      handleFilterChange("batch", e.target.value)
                    }
                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring h-10"
                  />
                </div>

                {/* Inline Branch */}
                <div className="w-full md:w-56 shrink-0 flex items-center gap-1">
                  <Select
                    value={filters.branch}
                    onValueChange={(value) =>
                      handleFilterChange("branch", value)
                    }
                  >
                    <SelectTrigger className="bg-background border-input text-foreground focus:ring-ring h-10">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      {BRANCHES.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filters.branch && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFilterChange("branch", "")}
                      className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Filter Modal Trigger using Dialog component */}
                <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="col-span-2 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-10 relative md:ml-auto w-full md:w-auto"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground hover:bg-primary px-1.5 py-0 min-w-[20px] flex items-center justify-center rounded-full">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>

                  {/* Filter Modal Overlay */}
                  <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto w-full p-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-foreground">Advanced Filters</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Campus Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="campus" className="text-foreground">
                            Campus
                          </Label>
                          <Select
                            value={filters.campus}
                            onValueChange={(value) =>
                              handleFilterChange("campus", value)
                            }
                          >
                            <SelectTrigger className="bg-background border-input text-foreground focus:ring-ring">
                              <SelectValue placeholder="All Campuses" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-foreground">
                              {CAMPUSES.map((campus) => (
                                <SelectItem key={campus} value={campus}>
                                  {campus}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {filters.campus && filters.campus !== "All Campuses" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFilterChange("campus", "All Campuses")}
                              className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                            >
                              Clear
                            </Button>
                          )}
                        </div>

                        {/* Company Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-foreground">
                            Company
                          </Label>
                          <Input
                            id="company"
                            placeholder="Search by company..."
                            value={filters.company}
                            onChange={(e) =>
                              handleFilterChange("company", e.target.value)
                            }
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                          />
                        </div>

                        {/* City Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-foreground">
                            City
                          </Label>
                          <Input
                            id="city"
                            placeholder="Search by city..."
                            value={filters.city}
                            onChange={(e) =>
                              handleFilterChange("city", e.target.value)
                            }
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                          />
                        </div>

                        {/* Country Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-foreground">
                            Country
                          </Label>
                          <Input
                            id="country"
                            placeholder="Search by country..."
                            value={filters.country}
                            onChange={(e) =>
                              handleFilterChange("country", e.target.value)
                            }
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                          />
                        </div>
                      </div>

                      {/* Skills Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="skills" className="text-foreground">
                          Skills
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="skills"
                            placeholder="Add skill to filter"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSkill();
                              }
                            }}
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                          />
                          <Button
                            type="button"
                            onClick={handleAddSkill}
                            variant="outline"
                            className="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            Add
                          </Button>
                        </div>
                        {filters.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {filters.skills.map((skill, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="gap-1 cursor-pointer bg-accent text-foreground hover:bg-accent/80 border border-border"
                                onClick={() => handleRemoveSkill(skill)}
                              >
                                {skill}
                                <X className="h-3 w-3" />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Connection Status Filter */}
                      <div className="space-y-3 pt-2">
                        <Label className="text-foreground block">
                          Connection Status
                        </Label>
                        <RadioGroup
                          value={filters.connectionFilter}
                          onValueChange={(value) =>
                            handleFilterChange("connectionFilter", value)
                          }
                          className="flex flex-col sm:flex-row gap-4 sm:gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="all"
                              id="connection-all"
                              className="border-border text-primary"
                            />
                            <Label
                              htmlFor="connection-all"
                              className="font-normal cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                              All
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="connected"
                              id="connection-connected"
                              className="border-border text-primary"
                            />
                            <Label
                              htmlFor="connection-connected"
                              className="font-normal cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                              Connected
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="not_connected"
                              id="connection-not-connected"
                              className="border-border text-primary"
                            />
                            <Label
                              htmlFor="connection-not-connected"
                              className="font-normal cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                              Not Connected
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* User Role Filter */}
                      <div className="space-y-3 pt-2">
                        <Label className="text-foreground block">
                          User Type
                        </Label>
                        <RadioGroup
                          value={filters.roleFilter}
                          onValueChange={(value) =>
                            handleFilterChange("roleFilter", value)
                          }
                          className="flex flex-col sm:flex-row gap-4 sm:gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="all"
                              id="role-all"
                              className="border-border text-primary"
                            />
                            <Label
                              htmlFor="role-all"
                              className="font-normal cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                              All
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="alumni"
                              id="role-alumni"
                              className="border-border text-primary"
                            />
                            <Label
                              htmlFor="role-alumni"
                              className="font-normal cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                              Alumni
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="student"
                              id="role-student"
                              className="border-border text-primary"
                            />
                            <Label
                              htmlFor="role-student"
                              className="font-normal cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                              Students
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center w-full gap-2 mt-4 pt-4 border-t border-border">
                      <Button
                        variant="ghost"
                        onClick={handleClearModalFilters}
                        className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
                      >
                        Clear Filters
                      </Button>
                      <Button
                        onClick={() => {
                          setFiltersOpen(false);
                          handleSearch();
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                      >
                        Apply Filters
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <EmptyState
              icon={
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              }
              title="Searching alumni..."
            />
          ) : !hasSearched ? (
            <EmptyState
              icon={
                <GraduationCap className="h-20 w-20 text-primary/30 mx-auto" />
              }
              title="Ready to Connect? 🎓"
              description="Use the search bar and filters above to find alumni"
            />
          ) : alumni.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12 text-muted-foreground mx-auto" />}
              title="No Results Found"
              description="We couldn't find any alumni matching your search."
              action={
                <Button
                  onClick={handleClearResults}
                  variant="outline"
                  className="mt-4 bg-background text-foreground border-border hover:bg-accent hover:text-foreground"
                >
                  Clear Search
                </Button>
              }
            />
          ) : (
            <>
              {(() => {
                const filteredAlumni = getFilteredAlumni();

                return (
                  <>
                    {filteredAlumni.length === 0 ? (
                      <EmptyState
                        icon="🔍"
                        title="No Results Found"
                        description="No alumni match your selected filters"
                        action={
                          <Button
                            onClick={handleClearResults}
                            variant="outline"
                            className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary bg-transparent"
                          >
                            Clear All Filters
                          </Button>
                        }
                      />
                    ) : (
                      <>
                        {/* Alumni Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 auto-rows-fr">
                          {filteredAlumni.map((alumnus) => (
                            <AlumniCard
                              key={alumnus._id}
                              alumni={alumnus}
                              onConnect={handleConnect}
                              onClick={() =>
                                navigate(
                                  `/dashboard/alumni/${alumnus.user._id}`
                                )
                              }
                            />
                          ))}
                        </div>

                        {/* Pagination */}
                        <div className="pb-24 md:pb-0">
                          <SmartPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                          />
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniDirectory;
