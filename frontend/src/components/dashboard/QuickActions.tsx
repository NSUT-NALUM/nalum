import {
  CalendarPlus,
  HandCoins,
  HelpCircle,
  LucideIcon,
  PenSquare,
  UserPen,
  Users,
} from "lucide-react";
import { PreloadLink } from "@/components/PreloadLink";
import { useAuth } from "@/context/AuthContext";

interface QuickAction {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Two of the four tiles are capability-dependent: only alumni may host events,
// and only alumni/admins may publish posts. Rather than leave gaps — or send
// students to a page that turns them away — the grid substitutes an action
// they can actually take, so it is always four tiles wide.
const actionsFor = (role?: string): QuickAction[] => {
  const canHost = role === "alumni";
  const canPost = role === "alumni" || role === "admin";

  return [
    { to: "/dashboard/update-profile", label: "Update Profile", icon: UserPen },
    { to: "/dashboard/giving", label: "Make a Donation", icon: HandCoins },
    canHost
      ? { to: "/dashboard/host-event", label: "Host an Event", icon: CalendarPlus }
      : { to: "/dashboard/alumni", label: "Browse Directory", icon: Users },
    canPost
      ? { to: "/dashboard/posts/new", label: "Create Post", icon: PenSquare }
      : { to: "/dashboard/queries", label: "Ask a Query", icon: HelpCircle },
  ];
};

export const QuickActions = () => {
  const { user } = useAuth();
  const actions = actionsFor(user?.role);

  return (
    <section>
      <h2 className="mb-3 text-headline-md text-foreground">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map(({ to, label, icon: Icon }) => (
          <PreloadLink
            key={to}
            to={to}
            className="group flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-card p-4 text-center shadow-card transition-colors hover:border-primary hover:bg-surface-low"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary-subtle">
              <Icon className="h-5 w-5 text-primary" />
            </span>
            <span className="text-label-md text-foreground">{label}</span>
          </PreloadLink>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;
