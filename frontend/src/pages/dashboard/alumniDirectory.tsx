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
  GraduationCap,
  Search,
  Filter,
  X,
  Loader2,
  ArrowLeft,
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
  const {
    alumni,
    isLoading,
    hasSearched,
    showFilters,
    currentPage,
    totalPages,
    filters,
    skillInput,
    showClearButton,
    setShowFilters,
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-100">
      {/* Main Content */}
      <div className="container mx-auto">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Alumni Directory
            </h2>
            <p className="text-gray-400">
              Connect with fellow NSUT alumni from across batches and branches
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
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
                      className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                    />

                    {/* Mobile Search Dropdown */}
                    {isSearchFocused && filters.name && (
                      <div className="md:hidden absolute top-full mt-2 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                        {isLoading ? (
                          <div className="p-4 flex items-center justify-center text-gray-400">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Searching...
                          </div>
                        ) : alumni.length > 0 ? (
                          <div className="py-2">
                            {alumni.slice(0, 5).map((profile) => (
                              <div
                                key={profile._id}
                                onClick={() => navigate(`/dashboard/alumni/${profile.user._id}`)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                              >
                                <UserAvatar
                                  src={profile.profile_picture}
                                  name={profile.user.name}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {profile.user.name}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {profile.batch} • {profile.branch}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div
                              onClick={() => {
                                setIsSearchFocused(false);
                                // The main grid will show all results
                              }}
                              className="px-4 py-2 text-center text-xs text-blue-400 font-medium cursor-pointer border-t border-white/5 hover:bg-white/5"
                            >
                              View all {alumni.length} results
                            </div>
                          </div>
                        ) : hasSearched ? (
                          <div className="p-4 text-center text-gray-400 text-sm">
                            No alumni found matching "{filters.name}"
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    size="icon"
                    className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white shrink-0 w-10 h-10 relative"
                  >
                    <Filter className="h-4 w-4" />
                    {(filters.batch ||
                      filters.branch ||
                      filters.campus ||
                      filters.company ||
                      filters.city ||
                      filters.country ||
                      filters.connectionFilter !== "all" ||
                      filters.roleFilter !== "all" ||
                      filters.skills.length > 0) && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-slate-900" />
                      )}
                  </Button>
                  {showClearButton ? (
                    <Button
                      onClick={handleClearResults}
                      variant="outline"
                      size="icon"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 bg-transparent shrink-0 w-10 h-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSearch}
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 w-10 h-10"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="border-t border-white/10 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Batch Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="batch" className="text-gray-300">
                          Batch
                        </Label>
                        <Input
                          id="batch"
                          placeholder="e.g., 2020"
                          value={filters.batch}
                          onChange={(e) =>
                            handleFilterChange("batch", e.target.value)
                          }
                          className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Branch Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="branch" className="text-gray-300">
                          Branch
                        </Label>
                        <Select
                          value={filters.branch}
                          onValueChange={(value) =>
                            handleFilterChange("branch", value)
                          }
                        >
                          <SelectTrigger className="bg-black/20 border-white/10 text-white focus:ring-blue-500/20">
                            <SelectValue placeholder="All Branches" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
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
                            size="sm"
                            onClick={() => handleFilterChange("branch", "")}
                            className="text-xs h-6 px-2 text-gray-400 hover:text-white"
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      {/* Campus Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="campus" className="text-gray-300">
                          Campus
                        </Label>
                        <Select
                          value={filters.campus}
                          onValueChange={(value) =>
                            handleFilterChange("campus", value)
                          }
                        >
                          <SelectTrigger className="bg-black/20 border-white/10 text-white focus:ring-blue-500/20">
                            <SelectValue placeholder="All Campuses" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            {CAMPUSES.map((campus) => (
                              <SelectItem key={campus} value={campus}>
                                {campus}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {filters.campus && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFilterChange("campus", "")}
                            className="text-xs h-6 px-2 text-gray-400 hover:text-white"
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      {/* Company Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-gray-300">
                          Company
                        </Label>
                        <Input
                          id="company"
                          placeholder="Search by company..."
                          value={filters.company}
                          onChange={(e) =>
                            handleFilterChange("company", e.target.value)
                          }
                          className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* City Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-gray-300">
                          City
                        </Label>
                        <Input
                          id="city"
                          placeholder="Search by city..."
                          value={filters.city}
                          onChange={(e) =>
                            handleFilterChange("city", e.target.value)
                          }
                          className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Country Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-gray-300">
                          Country
                        </Label>
                        <Input
                          id="country"
                          placeholder="Search by country..."
                          value={filters.country}
                          onChange={(e) =>
                            handleFilterChange("country", e.target.value)
                          }
                          className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    {/* Skills Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="skills" className="text-gray-300">
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
                          className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                        />
                        <Button
                          type="button"
                          onClick={handleAddSkill}
                          variant="outline"
                          className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
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
                              className="gap-1 cursor-pointer bg-white/10 text-gray-200 hover:bg-white/20 border border-white/10"
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
                    <div className="border-t border-white/10 pt-4">
                      <Label className="text-gray-300 block mb-3">
                        Connection Status
                      </Label>
                      <RadioGroup
                        value={filters.connectionFilter}
                        onValueChange={(value) =>
                          handleFilterChange("connectionFilter", value)
                        }
                      >
                        <div className="flex items-center gap-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="all"
                              id="connection-all"
                              className="border-white/30 text-blue-500"
                            />
                            <Label
                              htmlFor="connection-all"
                              className="font-normal cursor-pointer text-gray-300 hover:text-white"
                            >
                              All
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="connected"
                              id="connection-connected"
                              className="border-white/30 text-blue-500"
                            />
                            <Label
                              htmlFor="connection-connected"
                              className="font-normal cursor-pointer text-gray-300 hover:text-white"
                            >
                              Connected
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="not_connected"
                              id="connection-not-connected"
                              className="border-white/30 text-blue-500"
                            />
                            <Label
                              htmlFor="connection-not-connected"
                              className="font-normal cursor-pointer text-gray-300 hover:text-white"
                            >
                              Not Connected
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* User Role Filter */}
                    <div className="border-t border-white/10 pt-4">
                      <Label className="text-gray-300 block mb-3">
                        User Type
                      </Label>
                      <RadioGroup
                        value={filters.roleFilter}
                        onValueChange={(value) =>
                          handleFilterChange("roleFilter", value)
                        }
                      >
                        <div className="flex items-center gap-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="all"
                              id="role-all"
                              className="border-white/30 text-blue-500"
                            />
                            <Label
                              htmlFor="role-all"
                              className="font-normal cursor-pointer text-gray-300 hover:text-white"
                            >
                              All
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="alumni"
                              id="role-alumni"
                              className="border-white/30 text-blue-500"
                            />
                            <Label
                              htmlFor="role-alumni"
                              className="font-normal cursor-pointer text-gray-300 hover:text-white"
                            >
                              Alumni
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="student"
                              id="role-student"
                              className="border-white/30 text-blue-500"
                            />
                            <Label
                              htmlFor="role-student"
                              className="font-normal cursor-pointer text-gray-300 hover:text-white"
                            >
                              Students
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={handleClearResults}
                        className="border-white/10 bg-transparent text-gray-400 hover:bg-white/5 hover:text-white"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <EmptyState
              icon={
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
              }
              title="Searching alumni..."
            />
          ) : !hasSearched ? (
            <EmptyState
              icon={
                <GraduationCap className="h-20 w-20 text-blue-500/30 mx-auto" />
              }
              title="Ready to Connect? 🎓"
              description="Use the search bar and filters above to find alumni"
            />
          ) : alumni.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12 text-gray-400 mx-auto" />}
              title="No Results Found"
              description="We couldn't find any alumni matching your search."
              action={
                <Button
                  onClick={handleClearResults}
                  variant="outline"
                  className="mt-4 bg-white text-black border-white/20 hover:bg-gray-100 hover:text-black"
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
                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 bg-transparent"
                          >
                            Clear All Filters
                          </Button>
                        }
                      />
                    ) : (
                      <>
                        {/* 
                          Alumni Grid 
                          'auto-rows-fr' ensures all rows in the grid match the height of the tallest card on the page. 
                          This prevents uneven card heights across different rows when card content varies.
                        */}
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
                        <SmartPagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={handlePageChange}
                        />
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
