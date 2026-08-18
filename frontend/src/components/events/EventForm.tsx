import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Phone,
  Mail,
  Globe,
  Users,
  ImagePlus,
  Info,
  Gavel,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MentionTextarea from "@/components/MentionTextarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/constants/eventTypes";
import { EventRecord } from "@/lib/events";
import { trackFormSubmit, trackEvent } from "@/lib/analytics";

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

const currentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
};

// Phone fields accept digits plus the punctuation real numbers are written
// with — everything else (letters especially) is dropped as the user types.
const sanitizePhone = (value: string) => value.replace(/[^\d+\-()\s]/g, "");

const FormSection = ({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-card border border-border bg-card p-6 shadow-card">
    <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-3">
      <h2 className="text-headline-md text-foreground">{title}</h2>
      {aside}
    </div>
    {children}
  </section>
);

const RequiredMark = () => <span className="text-primary"> *</span>;

interface EventFormProps {
  mode: "create" | "edit";
  /** The record being edited. Required when mode is "edit". */
  event?: EventRecord;
}

// The full-page event form, shared by "Host an Event" and "Edit Event" so both
// flows stay identical apart from their copy and submit target.
export const EventForm = ({ mode, event }: EventFormProps) => {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(
    event?.image_url ? `${BASE_URL}${event.image_url}` : ""
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const descriptionResolverRef = useRef<(t: string) => string>((t) => t);

  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    event_date: event?.event_date ? event.event_date.split("T")[0] : "",
    event_time: event?.event_time || "",
    location: event?.location || "",
    event_type: event?.event_type || "other",
    registration_link: event?.registration_link || "",
    max_participants: event?.max_participants?.toString() || "",
    contact_phone: event?.contact_info?.phone || "",
    contact_email: event?.contact_info?.email || user?.email || "",
    contact_website: event?.contact_info?.website || "",
  });

  const handleInputChange = (field: string, value: string) => {
    if (field === "event_date" && value === todayISO()) {
      if (formData.event_time && formData.event_time < currentTime()) {
        toast.error("Event time cannot be in the past");
        setFormData((prev) => ({ ...prev, event_time: "" }));
      }
    }
    if (field === "event_time") {
      if (formData.event_date === todayISO() && value < currentTime()) {
        toast.error("Event time cannot be in the past");
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview("");
    setImageFile(null);
    const fileInput = document.getElementById("event-banner") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Event title is required");
      return false;
    }
    if (!formData.description.trim()) {
      toast.error("Event description is required");
      return false;
    }
    if (!formData.event_date) {
      toast.error("Event date is required");
      return false;
    }

    const selected = new Date(formData.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    if (selected < today) {
      toast.error("Event date cannot be in the past");
      return false;
    }

    if (!formData.event_time) {
      toast.error("Event time is required");
      return false;
    }
    if (
      formData.event_date === todayISO() &&
      formData.event_time < currentTime()
    ) {
      toast.error("Event time cannot be in the past");
      return false;
    }
    if (!formData.location.trim()) {
      toast.error("Event location is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append(
        "description",
        descriptionResolverRef.current(formData.description)
      );
      payload.append("event_date", formData.event_date);
      payload.append("event_time", formData.event_time);
      payload.append("location", formData.location);
      payload.append("event_type", formData.event_type);
      payload.append("registration_link", formData.registration_link);
      if (formData.max_participants)
        payload.append("max_participants", formData.max_participants);
      payload.append(
        "contact_info",
        JSON.stringify({
          phone: formData.contact_phone,
          email: formData.contact_email,
          website: formData.contact_website,
        })
      );
      if (imageFile) payload.append("event_image", imageFile);

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      };

      if (isEdit && event) {
        await api.put(`/events/update/${event._id}`, payload, { headers });
        toast.success("Event updated", {
          description: "Your changes have been submitted for approval.",
        });
      } else {
        await api.post("/events/create", payload, { headers });
        toast.success("Event submitted", {
          description: "Your event is now awaiting admin approval.",
        });
        trackFormSubmit("host_event_form", { event_type: formData.event_type });
      }

      navigate("/dashboard/events?tab=my");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ||
        (isEdit ? "Failed to update event" : "Failed to create event");
      if (!isEdit) trackEvent("host_event_error", { error_message: message });
      toast.error("Error", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={isEdit ? "/dashboard/events?tab=my" : "/dashboard/events"}
          className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEdit ? "Back to My Events" : "Back to Events"}
        </Link>
        <h1 className="mb-2 text-headline-lg-mobile text-primary md:text-headline-xl">
          {isEdit ? "Edit Event" : "Host an Event"}
        </h1>
        <p className="text-body-lg text-muted-foreground">
          {isEdit
            ? "Update your event details and resubmit them for approval."
            : "Share opportunities, reunions, and networking gatherings with your fellow alumni."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form column */}
        <div className="space-y-6 lg:col-span-2">
          <FormSection
            title="Event Banner"
            aside={
              <span className="flex items-center gap-1.5 text-label-sm text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                Recommended size: 1200x400
              </span>
            }
          >
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Event banner preview"
                  className="h-56 w-full rounded-lg border border-border object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Remove banner"
                  onClick={removeImage}
                  className="absolute right-3 top-3 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="event-banner"
                className="flex h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-muted transition-colors hover:border-primary/60 hover:bg-accent"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-card">
                  <ImagePlus className="h-5 w-5 text-primary" />
                </span>
                <span className="text-label-md text-foreground">
                  Upload an image
                </span>
                <span className="text-label-sm text-muted-foreground">
                  PNG, JPG, GIF up to 5MB
                </span>
              </label>
            )}
            <Input
              id="event-banner"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="sr-only"
            />
            {isEdit && imagePreview && (
              <p className="mt-3 text-label-sm text-muted-foreground">
                Upload a new image to replace the current banner.
              </p>
            )}
          </FormSection>

          <FormSection title="Basic Information">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">
                  Event Title
                  <RequiredMark />
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Annual Tech Alumni Gala"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="event_type">
                  Event Type
                  <RequiredMark />
                </Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => handleInputChange("event_type", value)}
                >
                  <SelectTrigger id="event_type" className="mt-1.5">
                    <SelectValue placeholder="Select category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {EVENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">
                  Description
                  <RequiredMark />
                </Label>
                <MentionTextarea
                  id="description"
                  placeholder="Detail what attendees can expect — type @ to mention someone"
                  value={formData.description}
                  onChange={(v) => handleInputChange("description", v)}
                  onResolverReady={(fn) => {
                    descriptionResolverRef.current = fn;
                  }}
                  className="mt-1.5"
                  style={{ minHeight: "140px" }}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Location & Time">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="event_date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                    <RequiredMark />
                  </Label>
                  <Input
                    id="event_date"
                    type="date"
                    min={todayISO()}
                    value={formData.event_date}
                    onChange={(e) =>
                      handleInputChange("event_date", e.target.value)
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="event_time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                    <RequiredMark />
                  </Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) =>
                      handleInputChange("event_time", e.target.value)
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Venue Address
                  <RequiredMark />
                </Label>
                <Input
                  id="location"
                  placeholder="Enter physical location or virtual meeting link"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Registration">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label
                  htmlFor="registration_link"
                  className="flex items-center gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  Registration Link
                </Label>
                <Input
                  id="registration_link"
                  placeholder="https://forms.google.com/…"
                  value={formData.registration_link}
                  onChange={(e) =>
                    handleInputChange("registration_link", e.target.value)
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label
                  htmlFor="max_participants"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Max Participants
                </Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  value={formData.max_participants}
                  onChange={(e) =>
                    handleInputChange("max_participants", e.target.value)
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Organizer Contact">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label
                    htmlFor="contact_email"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="Where attendees should reach you"
                    value={formData.contact_email}
                    onChange={(e) =>
                      handleInputChange("contact_email", e.target.value)
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="contact_phone"
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="Digits only, with country code"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      handleInputChange(
                        "contact_phone",
                        sanitizePhone(e.target.value)
                      )
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="contact_website"
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Event Website (Optional)
                </Label>
                <Input
                  id="contact_website"
                  placeholder="https://"
                  value={formData.contact_website}
                  onChange={(e) =>
                    handleInputChange("contact_website", e.target.value)
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </FormSection>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
            <div className="h-1 bg-primary" />
            <div className="space-y-4 p-6">
              <h2 className="flex items-center gap-2 text-headline-md text-foreground">
                <Gavel className="h-5 w-5 text-primary" />
                Publication Guidelines
              </h2>
              <p className="text-body-sm text-muted-foreground">
                {isEdit
                  ? "Edited events return to the review queue, so your changes stay hidden until an administrator approves them again."
                  : "Your event submission is the first step in connecting our community. To maintain the standards of the NSUT alumni network, all events undergo a formal review by the administration team."}
              </p>
              <p className="text-body-sm text-muted-foreground">
                You will receive a notification once your event is approved for
                public visibility.
              </p>
              <p className="rounded-lg bg-muted p-4 text-body-sm text-muted-foreground">
                If refinements are needed, our team will provide specific feedback
                on your <strong className="font-semibold">My Events</strong> page.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full gap-2 bg-primary text-label-md text-primary-foreground hover:bg-primary-hover"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                {isEdit ? "Resubmit for Approval" : "Submit for Approval"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() =>
              navigate(isEdit ? "/dashboard/events?tab=my" : "/dashboard/events")
            }
            className="h-11 w-full text-label-md"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};
