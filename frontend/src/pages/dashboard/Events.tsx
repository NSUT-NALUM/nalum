import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import io from "socket.io-client";
import {
  Calendar,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Heart,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Event {
  _id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: string;
  image_url?: string;
  registration_link?: string;
  max_participants?: number;
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  likes: number;
  creator_name: string;
  creator_email: string;
  createdAt: string;
}

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [mostLikedEvents, setMostLikedEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [likedEvents, setLikedEvents] = useState<Set<string>>(new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch most liked events for carousel
  const fetchMostLikedEvents = async () => {
    try {
      const response = await api.get("/events/most-liked?limit=5");
      if (response.data.success) {
        setMostLikedEvents(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching most liked events:", error);
    }
  };

  // Fetch events with pagination
  const fetchEvents = async (page = 1, type = "all") => {
    try {
      setLoading(true);
      const response = await api.get(
        `/events/approved?page=${page}&limit=9&event_type=${type}`
      );

      if (response.data.success) {
        setEvents(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's liked events
  const fetchLikedEvents = async () => {
    try {
      const response = await api.get("/events/my/liked");
      if (response.data.success) {
        setLikedEvents(new Set(response.data.data));
      }
    } catch (error) {
      console.error("Error fetching liked events:", error);
    }
  };

  useEffect(() => {
    fetchMostLikedEvents();
    fetchEvents(currentPage, filterType);
    fetchLikedEvents();
  }, [currentPage, filterType]);

  // Socket.io listener for real-time event approvals
  useEffect(() => {
    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('event:approved', (data) => {
      console.log('New event approved:', data);
      // Fetch latest events to show the newly approved one
      fetchEvents(currentPage, filterType);
      fetchMostLikedEvents();
      toast.success(`New event "${data.title}" is now available!`);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentPage, filterType]);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (mostLikedEvents.length === 0) return;

    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % mostLikedEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [mostLikedEvents.length]);

  const handleLike = async (eventId: string) => {
    try {
      const response = await api.post(`/events/${eventId}/like`);

      if (response.data.success) {
        const { liked, likes } = response.data;

        // Update liked events set
        setLikedEvents((prev) => {
          const newSet = new Set(prev);
          if (liked) {
            newSet.add(eventId);
          } else {
            newSet.delete(eventId);
          }
          return newSet;
        });

        // Update event likes count in both lists
        setEvents((prev) =>
          prev.map((event) =>
            event._id === eventId ? { ...event, likes } : event
          )
        );
        setMostLikedEvents((prev) =>
          prev.map((event) =>
            event._id === eventId ? { ...event, likes } : event
          )
        );

        // Re-fetch most liked events to update carousel order
        fetchMostLikedEvents();

        toast.success(liked ? "Event liked!" : "Like removed");
      }
    } catch (error) {
      console.error("Error liking event:", error);
      toast.error("Failed to like event");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const ensureUrlProtocol = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card
      onClick={() => {
        setSelectedEvent(event);
        setIsModalOpen(true);
      }}
      className="overflow-hidden hover:border-white/20 transition-all bg-white/5 border-white/10 backdrop-blur-md flex flex-col h-full cursor-pointer"
    >
      <div className="h-48 overflow-hidden bg-gray-800/50">
        {event.image_url ? (
          <img
            src={`${BASE_URL}${event.image_url}`}
            alt={event.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-white/30" />
          </div>
        )}
      </div>
      <CardContent className="p-6 flex flex-col flex-grow">
        {/* Top Content Area */}
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-white line-clamp-2">
              {event.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(event._id);
              }}
              className="shrink-0 hover:bg-white/10"
            >
              <Heart
                className={`h-5 w-5 ${likedEvents.has(event._id)
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400"
                  }`}
              />
              <span className="ml-1 text-sm text-gray-300">{event.likes}</span>
            </Button>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(event.event_date)} at {event.event_time}
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <MapPin className="h-4 w-4 mr-2" />
              {event.location}
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Users className="h-4 w-4 mr-2" />
              {event.max_participants ? `Max ${event.max_participants} participants` : 'No limit'}
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-4 line-clamp-1">
            {event.description}
          </p>
        </div>

        {/* Bottom Fixed Area */}
        <div className="mt-auto space-y-3">
          <div className="border-t border-white/10 pt-4 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Contact Info:</p>
            <div className="flex flex-wrap gap-2 min-h-[24px]">
              {event.contact_info?.email && (
                <a
                  href={`mailto:${event.contact_info.email}`}
                  className="flex items-center text-xs text-blue-400 hover:underline"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  {event.contact_info.email}
                </a>
              )}
              {event.contact_info?.phone && (
                <a
                  href={`tel:${event.contact_info.phone}`}
                  className="flex items-center text-xs text-blue-400 hover:underline"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  {event.contact_info.phone}
                </a>
              )}
              {event.contact_info?.website && (
                <a
                  href={ensureUrlProtocol(event.contact_info.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-blue-400 hover:underline"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Website
                </a>
              )}
            </div>
          </div>

          {event.registration_link && (
            <div>
              <a
                href={ensureUrlProtocol(event.registration_link)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Register Now
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Hosted by {event.creator_name}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <h1 className="text-4xl font-bold text-white mb-2">
          Alumni Events
        </h1>
        <p className="text-gray-400">
          Discover and participate in events hosted by our alumni community
        </p>
      </div>

      {/* Carousel - Most Liked Events */}
      {mostLikedEvents.length > 0 && (
        <div className="relative">
          <h2 className="text-2xl font-bold text-white mb-4">
            Most Liked Events
          </h2>
          <div className="px-4 md:px-8">
            <div
              onClick={() => {
                setSelectedEvent(mostLikedEvents[carouselIndex]);
                setIsModalOpen(true);
              }}
              className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md cursor-pointer hover:border-white/20 transition-all"
            >
              <div className="md:flex h-96">
                <div className="md:w-1/2 h-full bg-gray-800/50 flex items-center justify-center">
                  {mostLikedEvents[carouselIndex]?.image_url ? (
                    <img
                      src={`${BASE_URL}${mostLikedEvents[carouselIndex].image_url}`}
                      alt={mostLikedEvents[carouselIndex].title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <Calendar className="h-24 w-24 text-white/30" />
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 h-full p-8 flex flex-col justify-between">
                  <div className="space-y-3 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-white leading-tight" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {mostLikedEvents[carouselIndex]?.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {mostLikedEvents[carouselIndex]?.description}
                    </p>
                  </div>
                  <div className="space-y-2 flex-shrink-0 mb-8">
                    <div className="flex items-center text-gray-300 text-sm">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{formatDate(mostLikedEvents[carouselIndex]?.event_date)}{" "}
                        at {mostLikedEvents[carouselIndex]?.event_time}</span>
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{mostLikedEvents[carouselIndex]?.location}</span>
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                      <Heart className="h-4 w-4 mr-2 fill-red-500 text-red-500 flex-shrink-0" />
                      {mostLikedEvents[carouselIndex]?.likes} likes
                    </div>
                  </div>
                </div>
              </div>

              {/* Carousel Navigation */}
              <div className="absolute bottom-4 right-4 flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                {mostLikedEvents[carouselIndex]?.registration_link && (
                  <a
                    href={ensureUrlProtocol(mostLikedEvents[carouselIndex].registration_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm">
                      Register Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCarouselIndex(
                      (prev) =>
                        (prev - 1 + mostLikedEvents.length) %
                        mostLikedEvents.length
                    )
                  }
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCarouselIndex((prev) => (prev + 1) % mostLikedEvents.length)
                  }
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Carousel Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {mostLikedEvents.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`h-2 rounded-full transition-all ${idx === carouselIndex
                      ? "bg-blue-500 w-8"
                      : "bg-gray-500 w-2"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">All Events</h2>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white focus:border-blue-500/50">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            <SelectItem value="all" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">All Events</SelectItem>
            <SelectItem value="workshop" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Workshops</SelectItem>
            <SelectItem value="seminar" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Seminars</SelectItem>
            <SelectItem value="networking" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Networking</SelectItem>
            <SelectItem value="social" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Social</SelectItem>
            <SelectItem value="career" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Career</SelectItem>
            <SelectItem value="other" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="h-16 w-16 mx-auto text-gray-500 mb-4" />
          <p className="text-xl text-gray-400">No events found</p>
          <p className="text-sm text-gray-500 mt-2">
            Check back later for upcoming events
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-white/10 hover:bg-white/10 text-gray-300 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "border-white/10 hover:bg-white/10 text-gray-300"
                      }
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="border-white/10 hover:bg-white/10 text-gray-300 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Event Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Event Image */}
                {selectedEvent.image_url ? (
                  <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-800/50">
                    <img
                      src={`${BASE_URL}${selectedEvent.image_url}`}
                      alt={selectedEvent.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Calendar className="h-24 w-24 text-white/30" />
                  </div>
                )}

                {/* Event Type Badge */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium">
                    {selectedEvent.event_type}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Heart className={`h-4 w-4 ${likedEvents.has(selectedEvent._id) ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-sm">{selectedEvent.likes} likes</span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 text-gray-300">
                    <Calendar className="h-5 w-5 mt-0.5 text-emerald-400" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                      <p className="font-medium">{formatDate(selectedEvent.event_date)}</p>
                      <p className="text-sm">{selectedEvent.event_time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-gray-300">
                    <MapPin className="h-5 w-5 mt-0.5 text-orange-400" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="font-medium">{selectedEvent.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-gray-300">
                    <Users className="h-5 w-5 mt-0.5 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Participants</p>
                      <p className="font-medium">
                        {selectedEvent.max_participants ? `Max ${selectedEvent.max_participants} participants` : 'No limit'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-gray-300">
                    <Clock className="h-5 w-5 mt-0.5 text-blue-400" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created</p>
                      <p className="font-medium">{formatDate(selectedEvent.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{selectedEvent.description}</p>
                </div>

                {/* Host Information */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Host Information</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      <span className="text-gray-500">Hosted by:</span> {selectedEvent.creator_name}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">Email:</span>{' '}
                      <a href={`mailto:${selectedEvent.creator_email}`} className="text-blue-400 hover:underline">
                        {selectedEvent.creator_email}
                      </a>
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                {(selectedEvent.contact_info?.email || selectedEvent.contact_info?.phone || selectedEvent.contact_info?.website) && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      {selectedEvent.contact_info?.email && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="h-4 w-4 text-blue-400" />
                          <a href={`mailto:${selectedEvent.contact_info.email}`} className="text-blue-400 hover:underline">
                            {selectedEvent.contact_info.email}
                          </a>
                        </div>
                      )}
                      {selectedEvent.contact_info?.phone && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="h-4 w-4 text-green-400" />
                          <a href={`tel:${selectedEvent.contact_info.phone}`} className="text-blue-400 hover:underline">
                            {selectedEvent.contact_info.phone}
                          </a>
                        </div>
                      )}
                      {selectedEvent.contact_info?.website && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Globe className="h-4 w-4 text-purple-400" />
                          <a
                            href={ensureUrlProtocol(selectedEvent.contact_info.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {selectedEvent.contact_info.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Registration Button */}
                {selectedEvent.registration_link && (
                  <div className="border-t border-white/10 pt-4">
                    <a
                      href={ensureUrlProtocol(selectedEvent.registration_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                        Register for this Event
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile Floating Action Button for Alumni to Host Event */}
      {user?.role === "alumni" && (
        <Link to="/dashboard/host-event" className="md:hidden fixed bottom-20 right-4 z-30">
          <Button className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl flex items-center justify-center p-0">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </div>
  );
}
