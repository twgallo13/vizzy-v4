import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Channel = 'Email' | 'Social' | 'Banner' | 'Push';
type ActivityStatus = 'draft' | 'approved' | 'exported';

export interface User {
  uid: string;
  displayName: string;
  wrikeName?: string;
}

export interface Activity {
  activityId: string;
  channel: Channel;
  status: ActivityStatus;
  ownerUid: string;
  contentPacket: {
    subjectLine?: string;
    hashtags?: string[];
    bannerUrl?: string;
  };
}

export interface Day {
  dayName: string;          // e.g., "Monday"
  date: string;             // ISO or human-readable
  activities: Activity[];
}

interface Permissions {
  hasPerm: (perm: string) => boolean;
}

interface CalendarProps {
  days: Day[];                                    // exactly 7
  usersById: Record<string, User>;
  permissions: Permissions;
  exportErrors?: string[];                        // wrikeName blockers, etc.
  onExportToWrike?: (period: 'week') => void;
  onAddActivity?: (dayName?: string) => void;
  onOpenActivity?: (activityId: string) => void;
}

function ChannelBadge({ channel }: { channel: Channel }) {
  return <Badge variant="outline" className="capitalize">{channel}</Badge>;
}

function StatusBadge({ status }: { status: ActivityStatus }) {
  const variant =
    status === 'approved' ? 'default' :
    status === 'exported' ? 'secondary' : 'outline';
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}

function ActivityCard({
  activity,
  owner,
  onOpen,
}: {
  activity: Activity;
  owner?: User;
  onOpen?: (id: string) => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(activity.activityId)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen?.(activity.activityId); }}
      className="p-3 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition"
      aria-label={`${activity.channel} ${activity.contentPacket.subjectLine ?? ''}`.trim()}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChannelBadge channel={activity.channel} />
          <StatusBadge status={activity.status} />
        </div>
        <div className="text-xs text-muted-foreground">
          {owner?.displayName ?? 'Unassigned'}
        </div>
      </div>

      {activity.contentPacket.subjectLine && (
        <p className="mt-2 text-sm font-medium text-foreground">
          {activity.contentPacket.subjectLine}
        </p>
      )}

      {activity.contentPacket.hashtags && activity.contentPacket.hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {activity.contentPacket.hashtags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-xs text-primary/80">#{tag}</span>
          ))}
        </div>
      )}
    </Card>
  );
}

function ErrorDisplay({ errors, onDismiss }: { errors: string[]; onDismiss?: () => void }) {
  if (!errors || errors.length === 0) return null;
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-medium text-destructive">Export blocked</p>
            <p className="text-sm text-muted-foreground">
              Some activities failed preflight (e.g., invalid Wrike assignee names). Fix these and try again:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
              {errors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
            {onDismiss && (
              <Button variant="outline" size="sm" className="mt-3" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Calendar({
  days,
  usersById,
  permissions,
  exportErrors = [],
  onExportToWrike,
  onAddActivity,
  onOpenActivity,
}: CalendarProps) {
  // Roving focus among day columns
  const dayRefs = useRef<HTMLDivElement[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const setRef = useCallback((el: HTMLDivElement | null, idx: number) => {
    if (el) dayRefs.current[idx] = el;
  }, []);

  useEffect(() => {
    dayRefs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  const canExport = permissions.hasPerm('export:write');
  const addLabel = 'Add Activity';
  const exportLabel = 'Export to Wrike';

  const handleKeyNav = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusedIndex((idx + 1) % days.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusedIndex((idx - 1 + days.length) % days.length);
    }
  };

  const header = useMemo(() => (
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-muted-foreground">7-day campaign planner</p>
      <div className="flex gap-2">
        {onAddActivity && (
          <Button variant="outline" onClick={() => onAddActivity?.()}>
            {addLabel}
          </Button>
        )}
        {onExportToWrike && (
          <Button
            onClick={() => onExportToWrike?.('week')}
            disabled={!canExport}
            title={!canExport ? 'You do not have permission to export' : exportLabel}
          >
            {exportLabel}
          </Button>
        )}
      </div>
    </div>
  ), [canExport, onAddActivity, onExportToWrike]);

  return (
    <div className="space-y-4">
      {header}

      {exportErrors.length > 0 && (
        <ErrorDisplay errors={exportErrors} />
      )}

      <Card>
        <CardContent className="p-4">
          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-7 gap-3">
            {days.map((day, dayIdx) => (
              <div key={day.dayName} className="min-h-[220px]">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="font-medium">{day.dayName}</p>
                  <span className="text-xs text-muted-foreground">{day.date}</span>
                </div>
                <div className="space-y-2">
                  {day.activities.length === 0 && (
                    <p className="text-xs text-muted-foreground">No activities</p>
                  )}
                  {day.activities.map((a) => (
                    <ActivityCard
                      key={a.activityId}
                      activity={a}
                      owner={usersById[a.ownerUid]}
                      onOpen={onOpenActivity}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile horizontal list */}
          <div className="md:hidden flex gap-3 overflow-x-auto">
            {days.map((day, dayIdx) => (
              <div
                key={day.dayName}
                ref={(el) => setRef(el, dayIdx)}
                tabIndex={dayIdx === focusedIndex ? 0 : -1}
                role="region"
                aria-label={`${day.dayName} ${day.date}`}
                onKeyDown={(e) => handleKeyNav(e, dayIdx)}
                className="min-w-[260px] outline-none focus:ring-2 focus:ring-ring rounded-lg border p-3"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <p className="font-medium">{day.dayName}</p>
                  <span className="text-xs text-muted-foreground">{day.date}</span>
                </div>
                <div className="space-y-2">
                  {day.activities.length === 0 && (
                    <p className="text-xs text-muted-foreground">No activities</p>
                  )}
                  {day.activities.map((a) => (
                    <ActivityCard
                      key={a.activityId}
                      activity={a}
                      owner={usersById[a.ownerUid]}
                      onOpen={onOpenActivity}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Calendar;
