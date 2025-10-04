import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Calendar, Settings, MessageCircle, Plus, Upload, CheckCircle, Clock, Send } from 'lucide-react';
import type { User, Store, Role, Tier } from '@/models/core';
import type { Activity } from '@/models/planner';

type View = 'dashboard' | 'planner' | 'settings-users' | 'settings-stores' | 'settings-theme';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [users] = useKV<User[]>('users', []);
  const [stores] = useKV<Store[]>('stores', []);
  const [roles] = useKV<Role[]>('roles', []);
  const [tiers] = useKV<Tier[]>('tiers', []);
  const [activities] = useKV<Activity[]>('activities', []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView users={users || []} stores={stores || []} activities={activities || []} />;
      case 'planner':
        return <PlannerView activities={activities || []} users={users || []} />;
      case 'settings-users':
        return <UsersView users={users || []} roles={roles || []} tiers={tiers || []} />;
      case 'settings-stores':
        return <StoresView stores={stores || []} />;
      case 'settings-theme':
        return <ThemeView />;
      default:
        return <DashboardView users={users || []} stores={stores || []} activities={activities || []} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-primary"></div>
                <span className="text-xl font-bold text-foreground">Vizzy.app</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <Button 
                  variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant={currentView === 'planner' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('planner')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Planner
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Vizzy
              </Button>
              <Button 
                variant={currentView.startsWith('settings') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('settings-users')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {renderView()}
      </main>
    </div>
  );
}

function DashboardView({ users, stores, activities }: { 
  users: User[], 
  stores: Store[], 
  activities: Activity[] 
}) {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const openStores = stores.filter(s => s.status === 'open').length;
  const draftActivities = activities.filter(a => a.status === 'draft').length;
  const approvedActivities = activities.filter(a => a.status === 'approved').length;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Marketing campaign planning and execution platform</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedActivities}</div>
            <p className="text-xs text-muted-foreground">{draftActivities} drafts pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Across all roles</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Stores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openStores}</div>
            <p className="text-xs text-muted-foreground">Out of {stores.length} total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export Status</CardTitle>
            <Badge variant="secondary">Ready</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">wrikeName validation</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest campaign activities by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.slice(0, 3).map((activity) => (
                <div key={activity.activityId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="font-medium text-sm">{activity.contentPacket.subjectLine || `${activity.channel} Activity`}</p>
                      <p className="text-xs text-muted-foreground">{activity.channel}</p>
                    </div>
                  </div>
                  <Badge variant={
                    activity.status === 'draft' ? 'secondary' : 
                    activity.status === 'approved' ? 'default' : 'outline'
                  }>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Key operational metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">wrikeName Compliance</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">100%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Export</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">2 hours ago</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audit Logs</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PlannerView({ activities, users }: { activities: Activity[], users: User[] }) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaign Planner</h1>
          <p className="text-muted-foreground">7-day campaign activity scheduler</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Export to Wrike
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
              <div key={day} className="text-center">
                <h3 className="font-semibold text-sm text-foreground">{day}</h3>
                <p className="text-xs text-muted-foreground">Oct {21 + index}</p>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-4 min-h-96">
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <div key={dayIndex} className="border border-border rounded-md p-2 bg-muted/20 min-h-80">
                <div className="space-y-2">
                  {activities
                    .filter((_, i) => i % 7 === dayIndex) // Distribute activities across days for demo
                    .map((activity) => {
                      const owner = getUserById(activity.ownerUid);
                      return (
                        <Card key={activity.activityId} className="p-3 bg-card border border-border cursor-pointer hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">{getActivityIcon(activity.channel)}</span>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                            >
                              {activity.channel}
                            </Badge>
                            <Badge 
                              variant={
                                activity.status === 'draft' ? 'secondary' : 
                                activity.status === 'approved' ? 'default' : 'outline'
                              }
                              className="text-xs"
                            >
                              {activity.status === 'draft' && <Clock className="h-3 w-3 mr-1" />}
                              {activity.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {activity.status === 'exported' && <Send className="h-3 w-3 mr-1" />}
                              {activity.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">
                            {activity.contentPacket.subjectLine || `${activity.channel} Activity`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {owner ? owner.displayName : 'Unassigned'}
                          </p>
                          {activity.contentPacket.hashtags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {activity.contentPacket.hashtags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-xs text-primary bg-primary/10 px-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersView({ users, roles, tiers }: { users: User[], roles: Role[], tiers: Tier[] }) {
  const getRoleName = (roleId: string) => roles.find(r => r.roleId === roleId)?.name || roleId;
  const getTierName = (tierId: string) => tiers.find(t => t.tierId === tierId)?.name || tierId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage users, roles, and system configuration</p>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Users & Roles</h2>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>{users.length} users across all roles and tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.uid} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">wrikeName: {user.wrikeName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getRoleName(user.roleId)}</Badge>
                      <Badge variant="secondary">{getTierName(user.tierId)}</Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status}
                      </Badge>
                      {user.mfaEnabled && (
                        <Badge variant="outline" className="text-xs">MFA</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stores">
          <StoresView stores={[]} />
        </TabsContent>
        
        <TabsContent value="theme">
          <ThemeView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StoresView({ stores }: { stores: Store[] }) {
  const [storeData] = useKV<Store[]>('stores', []);
  const actualStores = stores.length > 0 ? stores : (storeData || []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stores</h2>
          <p className="text-muted-foreground">Manage store locations and data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button>
            <Building2 className="h-4 w-4 mr-2" />
            Add Store
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Store Locations</CardTitle>
          <CardDescription>{actualStores?.length || 0} stores across multiple regions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actualStores?.map((store) => (
              <div key={store.storeId} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">#{store.storeNumber} {store.name}</p>
                    <p className="text-sm text-muted-foreground">{store.city}, {store.state} {store.zip}</p>
                    <p className="text-xs text-muted-foreground">{store.address1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{store.storeType}</Badge>
                  <Badge variant={
                    store.status === 'open' ? 'default' : 
                    store.status === 'comingSoon' ? 'secondary' : 'destructive'
                  }>
                    {store.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ThemeView() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Theme & Branding</h2>
        <p className="text-muted-foreground">Customize the application appearance</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>Professional blue-green palette with warm orange accents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 w-full rounded-lg bg-primary"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">Deep Blue</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 w-full rounded-lg bg-secondary"></div>
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground">Slate Gray</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 w-full rounded-lg bg-accent"></div>
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">Warm Orange</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 w-full rounded-lg bg-muted border border-border"></div>
              <p className="text-sm font-medium">Muted</p>
              <p className="text-xs text-muted-foreground">Light Gray</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Inter font family with clear hierarchy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Heading 1 (32px Bold)</h1>
              <p className="text-sm text-muted-foreground">Used for page titles</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-1">Heading 2 (24px Semibold)</h2>
              <p className="text-sm text-muted-foreground">Used for section headers</p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-1">Heading 3 (20px Medium)</h3>
              <p className="text-sm text-muted-foreground">Used for subsections</p>
            </div>
            <div>
              <p className="text-base mb-1">Body Text (16px Regular)</p>
              <p className="text-sm text-muted-foreground">Primary content text</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;