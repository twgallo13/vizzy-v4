import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, AlertCircle, Clock, CheckCircle, Send } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Activity {
  activityId: string;
  channel: string;
  status: 'draft' | 'approved' | 'exported';
  ownerUid: string;
  contentPacket: {
    subjectLine?: string;
    hashtags?: string[];
  };
}

interface User {
  uid: string;
  displayName: string;
}

interface CalendarProps {
  activities: Activity[];
  users: User[];
  permissions: {
    hasPerm: (perm: string) => boolean;
  };
  onExportToWrike?: () => void;
  onAddActivity?: () => void;
  exportErrors?: string[];
  onDismissErrors?: () => void;
}

interface DayData {
  dayName: string;
  date: number;
  activities: Activity[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function Calendar({ 
  activities, 
  users, 
  permissions, 
  onExportToWrike, 
  onAddActivity,
  exportErrors = [],
  onDismissErrors
}: CalendarProps) {
  const isMobile = useIsMobile();
  const [focusedDayIndex, setFocusedDayIndex] = useState<number>(0);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const getUserById = (uid: string) => users.find(u => u.uid === uid);
  
  const getActivityIcon = (channel: string) => {
    switch (channel) {
      case 'Email': return '📧';
      case 'Social': return '📱';
      case 'Banner': return '🎨';
      case 'Push': return '🔔';
      default: return '📄';
    }
  };

  // Organize activities by day (mock distribution)
  const dayData: DayData[] = DAYS.map((dayName, index) => ({
    dayName,
    date: 21 + index,
    activities: activities.filter((_, i) => i % 7 === index)
  }));

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const newIndex = Math.max(0, Math.min(6, focusedDayIndex + direction));
      setFocusedDayIndex(newIndex);
      dayRefs.current[newIndex]?.focus();
    }
  }, [focusedDayIndex]);

  useEffect(() => {
    // Focus the first day on mount for keyboard accessibility
    dayRefs.current[0]?.focus();
  }, []);

  if (isMobile) {
    return (
      <div className="space-y-4 overflow-hidden">
        <CalendarHeader 
          permissions={permissions}
          onExportToWrike={onExportToWrike}
          onAddActivity={onAddActivity}
        />
        
        {exportErrors.length > 0 && (
          <ErrorDisplay errors={exportErrors} onDismiss={onDismissErrors} />
        )}

        <Card>
          <CardContent className="p-4">
            {/* Mobile day headers - horizontal scroll */}
            <div className="overflow-x-auto scrollbar-hide mb-4">
              <div className="flex gap-3 min-w-max pb-2">
                {dayData.map((day, index) => (
                  <div key={day.dayName} className="flex-shrink-0 text-center min-w-20">
                    <h3 className="text-sm font-medium text-foreground">
                      {day.dayName.substring(0, 3)}
                    </h3>
                    <p className="text-xs text-muted-foreground">Oct {day.date}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mobile activity columns - horizontal scroll */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 min-w-max">
                {dayData.map((day, dayIndex) => (
                  <div
                    key={day.dayName}
                    ref={el => { dayRefs.current[dayIndex] = el; }}
                    className="flex-shrink-0 w-64 border border-border rounded-lg p-3 bg-muted/30 min-h-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    tabIndex={dayIndex === focusedDayIndex ? 0 : -1}
                    onKeyDown={handleKeyDown}
                    role="region"
                    aria-label={`${day.dayName}, October ${day.date} activities`}
                  >
                    <div className="space-y-2">
                      {day.activities.map((activity) => (
                        <ActivityCard 
                          key={activity.activityId} 
                          activity={activity} 
                          owner={getUserById(activity.ownerUid)}
                          getActivityIcon={getActivityIcon}
                          compact
                        />
                      ))}
                      {day.activities.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-8">
                          No activities
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CalendarHeader 
        permissions={permissions}
        onExportToWrike={onExportToWrike}
        onAddActivity={onAddActivity}
      />
      
      {exportErrors.length > 0 && (
        <ErrorDisplay errors={exportErrors} onDismiss={onDismissErrors} />
      )}

      <Card>
        <CardContent className="p-6">
          {/* Desktop day headers */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            {dayData.map((day) => (
              <div key={day.dayName} className="text-center">
                <h3 className="text-sm font-medium text-foreground">{day.dayName}</h3>
                <p className="text-xs text-muted-foreground">Oct {day.date}</p>
              </div>
            ))}
          </div>
          
          {/* Desktop activity grid */}
          <div className="grid grid-cols-7 gap-4 min-h-96">
            {dayData.map((day, dayIndex) => (
              <div
                key={day.dayName}
                ref={el => { dayRefs.current[dayIndex] = el; }}
                className="border border-border rounded-lg p-3 bg-muted/30 min-h-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                tabIndex={dayIndex === focusedDayIndex ? 0 : -1}
                onKeyDown={handleKeyDown}
                role="region"
                aria-label={`${day.dayName}, October ${day.date} activities`}
              >
                <div className="space-y-2">
                  {day.activities.map((activity) => (
                    <ActivityCard 
                      key={activity.activityId} 
                      activity={activity} 
                      owner={getUserById(activity.ownerUid)}
                      getActivityIcon={getActivityIcon}
                    />
                  ))}
                  {day.activities.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No activities
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CalendarHeader({ 
  permissions, 
  onExportToWrike, 
  onAddActivity 
}: {
  permissions: { hasPerm: (perm: string) => boolean };
  onExportToWrike?: () => void;
  onAddActivity?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campaign Planner</h1>
        <p className="text-sm text-muted-foreground">7-day campaign activity scheduler</p>
      </div>
      <div className="flex gap-2">
        {permissions.hasPerm('export:write') && onExportToWrike && (
          <Button variant="outline" onClick={onExportToWrike}>
            <Upload className="h-4 w-4 mr-2" />
            Export to Wrike
          </Button>
        )}
        {permissions.hasPerm('planner:write') && onAddActivity && (
          <Button onClick={onAddActivity}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        )}
      </div>
    </div>
  );
}

function ErrorDisplay({ errors, onDismiss }: { errors: string[]; onDismiss?: () => void }) {
  return (
    <Card className="border-destructive/50 bg-destructive/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-destructive mb-2">
              Export Blocked - wrikeName Validation Failed
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Export cannot proceed until all wrikeName issues are resolved.
            </p>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {error}
                </div>
              ))}
            </div>
            {onDismiss && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3" 
                onClick={onDismiss}
              >
                Acknowledge & Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityCard({ 
  activity, 
  owner, 
  getActivityIcon,
  compact = false 
}: {
  activity: Activity;
  owner?: User;
  getActivityIcon: (channel: string) => string;
  compact?: boolean;
}) {
  const getStatusIcon = () => {
    switch (activity.status) {
      case 'draft': return <Clock className={`${compact ? 'h-2 w-2' : 'h-3 w-3'} mr-1`} />;
      case 'approved': return <CheckCircle className={`${compact ? 'h-2 w-2' : 'h-3 w-3'} mr-1`} />;
      case 'exported': return <Send className={`${compact ? 'h-2 w-2' : 'h-3 w-3'} mr-1`} />;
      default: return null;
    }
  };

  const getStatusVariant = () => {
    switch (activity.status) {
      case 'draft': return 'secondary';
      case 'approved': return 'default';
      default: return 'outline';
    }
  };

  if (compact) {
    return (
      <Card className="p-2 bg-card border border-border cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" tabIndex={0}>
        <div className="space-y-2">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs" role="img" aria-label={`${activity.channel} channel`}>
              {getActivityIcon(activity.channel)}
            </span>
            <Badge variant="outline" className="text-xs h-5">
              {activity.channel}
            </Badge>
            <Badge variant={getStatusVariant() as any} className="text-xs h-5">
              {getStatusIcon()}
              {activity.status}
            </Badge>
          </div>
          <p className="text-xs font-medium leading-tight text-foreground">
            {activity.contentPacket.subjectLine || `${activity.channel} Activity`}
          </p>
          <p className="text-xs text-muted-foreground">
            {owner ? owner.displayName : 'Unassigned'}
          </p>
          {activity.contentPacket.hashtags && (
            <div className="flex flex-wrap gap-1">
              {activity.contentPacket.hashtags.slice(0, 2).map((tag, i) => (
                <span key={i} className="text-xs text-primary bg-primary/10 px-1 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 bg-card border border-border cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" tabIndex={0}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm" role="img" aria-label={`${activity.channel} channel`}>
            {getActivityIcon(activity.channel)}
          </span>
          <Badge variant="outline" className="text-xs">
            {activity.channel}
          </Badge>
          <Badge variant={getStatusVariant() as any} className="text-xs">
            {getStatusIcon()}
            {activity.status}
          </Badge>
        </div>
        <p className="text-sm font-medium text-foreground">
          {activity.contentPacket.subjectLine || `${activity.channel} Activity`}
        </p>
        <p className="text-xs text-muted-foreground">
          {owner ? owner.displayName : 'Unassigned'}
        </p>
        {activity.contentPacket.hashtags && (
          <div className="flex flex-wrap gap-1">
            {activity.contentPacket.hashtags.slice(0, 2).map((tag, i) => (
              <span key={i} className="text-xs text-primary bg-primary/10 px-1 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}