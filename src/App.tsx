import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Calendar as CalendarIcon, Settings, MessageCircle, Plus, Upload, CheckCircle, Clock, Send, AlertCircle, BarChart3, Activity as ActivityIcon, Shield, Palette } from 'lucide-react';
import type { User, Store, Role, Tier } from '@/models/core';
import type { Activity } from '@/models/planner';
import { useInitialData } from '@/hooks/useInitialData';
import { useCurrentUserPermissions } from '@/hooks/usePermissions';
import { useAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { exportDayToWrike, downloadWrikeExport } from '@/lib/export-xlsx';
import { CsvImportDialog } from '@/components/stores/CsvImportDialog';
import { UserEditDialog } from '@/components/users/UserEditDialog';
import ChatDrawer from '@/components/chat/ChatDrawer';
import { Calendar } from '@/components/calendar/Calendar';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatusPanel } from '@/components/StatusPanel';

type View = 'dashboard' | 'planner' | 'settings-users' | 'settings-stores' | 'settings-theme' | 'settings-roles' | 'settings-status';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const { users, stores, roles, tiers, activities, setUsers, setStores, setActivities } = useInitialData();
  const { writeAuditLog } = useAuditLog();
  const isMobile = useIsMobile();
  
  // Mock current user - in production this would come from auth
  const currentUser = users?.[0] || null; // Use first user (Maggie, Admin) as current user
  const permissions = useCurrentUserPermissions(currentUser, roles || [], tiers || []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView users={users || []} stores={stores || []} activities={activities || []} />;
      case 'planner':
        return (
          <PlannerView 
            activities={activities || []} 
            users={users || []} 
            permissions={permissions}
          />
        );
      case 'settings-users':
        return <UsersView users={users || []} roles={roles || []} tiers={tiers || []} permissions={permissions} />;
      case 'settings-stores':
        return <StoresView stores={stores || []} permissions={permissions} />;
      case 'settings-roles':
        return <RolesAndTiersView roles={roles || []} tiers={tiers || []} permissions={permissions} />;
      case 'settings-theme':
        return <ThemeView permissions={permissions} />;
      case 'settings-status':
        return <StatusPanel />;
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
                <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-foreground`}>
                  {isMobile ? 'Vizzy' : 'Vizzy.app'}
                </span>
              </div>
              <div className={`${isMobile ? 'hidden' : 'flex'} items-center gap-1`}>
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
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Planner
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser && (
                <div className={`${isMobile ? 'hidden' : 'flex'} items-center gap-2 text-sm text-muted-foreground`}>
                  <span>{currentUser.displayName}</span>
                  <Badge variant="outline" className="text-xs">
                    {roles?.find(r => r.roleId === currentUser.roleId)?.name}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {tiers?.find(t => t.tierId === currentUser.tierId)?.name}
                  </Badge>
                </div>
              )}
              {!isMobile && (
                <Button variant="ghost" size="sm" onClick={() => setShowChatDrawer(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Vizzy
                </Button>
              )}
              <Button 
                variant={currentView.startsWith('settings') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('settings-users')}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isMobile ? '' : 'Settings'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className={`mx-auto max-w-7xl px-4 ${isMobile ? 'py-4' : 'py-8'} sm:px-6 lg:px-8`}>
        {/* Mobile Navigation Pills */}
        {isMobile && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className="flex-shrink-0"
            >
              Dashboard
            </Button>
            <Button
              variant={currentView === 'planner' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('planner')}
              className="flex-shrink-0"
            >
              Planner
            </Button>
            <Button
              variant={currentView.startsWith('settings') ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('settings-users')}
              className="flex-shrink-0"
            >
              Settings
            </Button>
          </div>
        )}
        
        {renderView()}
      </main>

      <ChatDrawer 
        open={showChatDrawer}
        onOpenChange={setShowChatDrawer}
        currentUser={currentUser}
        hasPerm={(perm: string) => permissions.hasPerm(perm)}
      />

      {/* Floating Action Button for Chat */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        onClick={() => setShowChatDrawer(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
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
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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

function PlannerView({ activities, users, permissions }: { 
  activities: Activity[], 
  users: User[], 
  permissions: ReturnType<typeof useCurrentUserPermissions>
}) {
  const [exportErrors, setExportErrors] = useState<string[]>([]);
  const { writeAuditLog } = useAuditLog();
  
  // Create usersById lookup
  const usersById = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.uid] = user;
      return acc;
    }, {} as Record<string, User>);
  }, [users]);
  
  // Create mock days structure for the calendar
  const days = useMemo(() => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDate = new Date();
    
    return dayNames.map((dayName, index) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - currentDate.getDay() + index + 1);
      
      // Distribute activities across the week for demo
      const dayActivities = activities.filter((_, activityIndex) => 
        activityIndex % 7 === index
      );
      
      return {
        dayName,
        date: date.toISOString().split('T')[0],
        activities: dayActivities
      };
    });
  }, [activities]);
  
  const handleExportToWrike = async (period: 'week') => {
    setExportErrors([]);
    
    // Create a mock week structure for the demo
    const mockDayCard = {
      date: new Date(),
      activities: activities.filter(a => a.status === 'approved')
    };
    
    // Try to export with strict preflight validation
    const result = exportDayToWrike('Current Week', mockDayCard, usersById);
    
    if (!result.success) {
      const allErrors = [...(result.errors || [])];
      
      // Add specific wrikeName validation errors
      if (result.invalidUsers) {
        allErrors.push(...result.invalidUsers);
      }
      
      setExportErrors(allErrors);
      
      // Log export failure with detailed information
      await writeAuditLog({
        userId: 'u_1', // Mock current user
        action: AUDIT_ACTIONS.EXPORT_FAILURE,
        targetId: 'current_week',
        source: 'ui',
        after: { 
          errors: result.errors, 
          invalidUsers: result.invalidUsers,
          offenderUIDs: mockDayCard.activities
            .map(a => usersById[a.ownerUid])
            .filter(u => u && u.wrikeName !== `${u.firstName} ${u.lastName}`)
            .map(u => u!.uid),
          totalActivities: mockDayCard.activities.length,
          timestamp: new Date().toISOString()
        }
      });
      
      return;
    }
    
    if (result.rows) {
      downloadWrikeExport('Current Week', result.rows);
      
      // Log successful export
      await writeAuditLog({
        userId: 'u_1', // Mock current user
        action: AUDIT_ACTIONS.PLANNER_ACTIVITY_EXPORTED,
        targetId: 'current_week',
        source: 'ui',
        after: { 
          exportedCount: result.rows.length,
          fileName: 'Current Week_wrike_export.xlsx',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
  
  const handleAddActivity = (dayName?: string) => {
    // Mock add activity functionality
    console.log('Add activity clicked for day:', dayName);
  };
  
  const handleOpenActivity = (activityId: string) => {
    // Mock open activity functionality
    console.log('Open activity:', activityId);
  };

  const handleDismissErrors = () => {
    setExportErrors([]);
  };

  // If we have export errors, show them at the top
  if (exportErrors.length > 0) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-destructive">Export Errors</h3>
            <Button variant="ghost" size="sm" onClick={handleDismissErrors}>
              Dismiss
            </Button>
          </div>
          <ul className="text-sm text-destructive space-y-1">
            {exportErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
        <Calendar
          days={days}
          usersById={usersById}
          permissions={{ hasPerm: permissions.hasPerm }}
          onExportToWrike={handleExportToWrike}
          onAddActivity={handleAddActivity}
          onOpenActivity={handleOpenActivity}
        />
      </div>
    );
  }

  return (
    <Calendar
      days={days}
      usersById={usersById}
      permissions={{ hasPerm: permissions.hasPerm }}
      onExportToWrike={handleExportToWrike}
      onAddActivity={handleAddActivity}
      onOpenActivity={handleOpenActivity}
    />
  );
}

function UsersView({ users, roles, tiers, permissions }: { 
  users: User[], 
  roles: Role[], 
  tiers: Tier[], 
  permissions: ReturnType<typeof useCurrentUserPermissions>
}) {
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { setUsers } = useInitialData();
  const { writeAuditLog } = useAuditLog();

  const handleSaveUser = async (userData: Partial<User>) => {
    if (editingUser) {
      // Edit existing user
      setUsers((currentUsers) => 
        (currentUsers || []).map(user => 
          user.uid === editingUser.uid ? { ...user, ...userData } : user
        )
      );
      
      await writeAuditLog({
        userId: 'u_1', // Mock current user
        action: AUDIT_ACTIONS.USER_UPDATED,
        targetId: editingUser.uid,
        source: 'ui',
        before: editingUser,
        after: { ...editingUser, ...userData }
      });
    } else {
      // Create new user
      const newUser = userData as User;
      setUsers((currentUsers) => [...(currentUsers || []), newUser]);
      
      await writeAuditLog({
        userId: 'u_1', // Mock current user
        action: AUDIT_ACTIONS.USER_CREATED,
        targetId: newUser.uid!,
        source: 'ui',
        after: newUser
      });
    }
    
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId: string) => {
    setUsers((currentUsers) => 
      (currentUsers || []).filter(user => user.uid !== userId)
    );
    
    await writeAuditLog({
      userId: 'u_1', // Mock current user
      action: AUDIT_ACTIONS.USER_DELETED,
      targetId: userId,
      source: 'ui'
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserDialog(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserDialog(true);
  };
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
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Tiers</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Users</h2>
              <p className="text-muted-foreground">Manage user accounts</p>
            </div>
            {permissions.canWrite('users') && (
              <Button onClick={handleAddUser}>
                <Users className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>{users.length} users across all roles and tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.uid} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => handleEditUser(user)}>
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
        
        <TabsContent value="roles">
          <RolesAndTiersView roles={roles || []} tiers={tiers || []} permissions={permissions} />
        </TabsContent>
        
        <TabsContent value="stores">
          <StoresView stores={[]} permissions={permissions} />
        </TabsContent>
        
        <TabsContent value="theme">
          <ThemeView permissions={permissions} />
        </TabsContent>
        
        <TabsContent value="status">
          <StatusPanel />
        </TabsContent>
      </Tabs>

      <UserEditDialog
        open={showUserDialog}
        onOpenChange={setShowUserDialog}
        user={editingUser}
        roles={roles}
        tiers={tiers}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
}

function StoresView({ stores, permissions }: { 
  stores: Store[], 
  permissions: ReturnType<typeof useCurrentUserPermissions>
}) {
  const actualStores = stores || [];
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { setStores } = useInitialData();
  const { writeAuditLog } = useAuditLog();

  const handleImport = async (newStores: Store[]) => {
    // Add imported stores to existing stores
    setStores((currentStores) => [...(currentStores || []), ...newStores]);
    
    // Log the import action
    await writeAuditLog({
      userId: 'u_1', // Mock current user
      action: AUDIT_ACTIONS.STORE_IMPORTED_SUMMARY,
      targetId: 'bulk_import',
      source: 'ui',
      after: { 
        importedCount: newStores.length,
        timestamp: new Date().toISOString()
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stores</h2>
          <p className="text-muted-foreground">Manage store locations and data</p>
        </div>
        <div className="flex gap-2">
          {permissions.canWrite('stores') && (
            <>
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Add Store
              </Button>
            </>
          )}
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

      <CsvImportDialog 
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
      />
    </div>
  );
}

function ThemeView({ permissions }: { 
  permissions: ReturnType<typeof useCurrentUserPermissions>
}) {
  if (!permissions.hasAnyPerm(['roles:write', 'tiers:write'])) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Theme & Branding</h2>
          <p className="text-muted-foreground text-red-600">Access denied: insufficient permissions</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You need Admin permissions to access theme settings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

function RolesAndTiersView({ roles, tiers, permissions }: { 
  roles: Role[], 
  tiers: Tier[], 
  permissions: ReturnType<typeof useCurrentUserPermissions>
}) {
  if (!permissions.hasAnyPerm(['roles:write', 'tiers:write', 'roles:read', 'tiers:read'])) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Roles & Tiers</h2>
          <p className="text-muted-foreground text-red-600">Access denied: insufficient permissions</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You need Admin permissions to access roles and tiers.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Roles & Tiers</h2>
        <p className="text-muted-foreground">Manage user roles and permission tiers</p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Functional permissions defining what users can do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.roleId} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground">{role.name}</h3>
                    <Badge variant="outline">{role.permissions.length} perms</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tiers</CardTitle>
            <CardDescription>Operational scope defining where users can act</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tiers.map((tier) => (
                <div key={tier.tierId} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground">{tier.name}</h3>
                    <Badge variant="outline">{tier.permissions.length} perms</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {tier.permissions.length > 0 ? (
                      tier.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No additional permissions</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>Effective permissions = Role ∪ Tier (union of both)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Example:</strong> A Manager (role) with Regional (tier) gets:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Role permissions: users:read, stores:write, planner:write, planner:approve, export:write, audit:read</li>
                <li>Tier permissions: export:write (already included)</li>
                <li><strong>Effective permissions:</strong> Union of both sets</li>
              </ul>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Your Current Effective Permissions:</h4>
              <div className="flex flex-wrap gap-1">
                {Array.from(permissions.effective).map((perm) => (
                  <Badge key={perm} variant="default" className="text-xs">
                    {perm}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total: {permissions.effective.size} permissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;