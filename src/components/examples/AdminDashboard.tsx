import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/lib/services';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  hostel?: string;
  oauth_provider?: string;
  oauth_profile_image?: string;
  introduction?: string;
  preferences?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  mood_logs_count: number;
  sos_alerts_count: number;
  total_interactions: number;
  last_mood_log: string;
  created_at: string;
  updated_at: string;
}

interface UserDetail {
  user: User;
  mood_logs: any[];
  mood_logs_count: number;
  sos_alerts: any[];
  sos_alerts_count: number;
  trusted_contacts: any[];
  stats: {
    total_moods: number;
    total_sos: number;
    avg_mood: number;
  };
}

export default function AdminDashboard() {
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [moodAnalytics, setMoodAnalytics] = useState<any>(null);
  const [sosAnalytics, setSOSAnalytics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('users');

  // Auto-refresh effect - refresh every 5 seconds
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;

    const refreshInterval = setInterval(() => {
      loadDashboard();
      // Also refresh analytics if they're loaded
      if (moodAnalytics) loadMoodAnalytics();
      if (sosAnalytics) loadSOSAnalytics();
      setLastUpdate(new Date());
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, autoRefresh, moodAnalytics, sosAnalytics]);

  // Handle admin login
  const handleAdminLogin = () => {
    if (adminToken.trim()) {
      adminService.setAdminToken(adminToken);
      setIsAuthenticated(true);
      loadDashboard();
      setError(null);
    } else {
      setError('Please enter admin token');
    }
  };

  // Load dashboard data
  const loadDashboard = async () => {
    setIsLoading(true);
    console.log('🔵 Loading admin dashboard...');
    try {
      const [summaryRes, usersRes] = await Promise.all([
        adminService.getDashboardSummary(),
        adminService.getAllUsers(),
      ]);

      console.log('📊 Dashboard Summary Response:', summaryRes);
      console.log('👥 Users Response:', usersRes);

      if (summaryRes.success) {
        setSummary(summaryRes.summary);
        console.log('✅ Summary set:', summaryRes.summary);
      } else {
        console.error('❌ Summary failed:', summaryRes);
      }
      
      if (usersRes.success) {
        setUsers(usersRes.data);
        console.log('✅ Users set:', usersRes.data.length, 'users');
      } else {
        console.error('❌ Users failed:', usersRes);
      }
    } catch (err: any) {
      console.error('❌ Dashboard load error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user details
  const loadUserDetails = async (userId: number) => {
    setIsLoading(true);
    console.log('🔵 Loading user details for user ID:', userId);
    try {
      const res = await adminService.getUserDetails(userId);
      console.log('📊 User Details Response:', res);
      
      if (res.success) {
        setSelectedUser(res);
        setActiveTab('user-detail'); // Switch to user detail tab
        console.log('✅ Selected user set:', res);
        console.log('📞 Trusted contacts:', res.trusted_contacts);
        console.log('😊 Mood logs:', res.mood_logs);
        console.log('🆘 SOS alerts:', res.sos_alerts);
      } else {
        console.error('❌ User details failed:', res.message);
        setError(res.message);
      }
    } catch (err: any) {
      console.error('❌ User details error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };  // Load mood analytics
  const loadMoodAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getMoodAnalytics();
      if (res.success) {
        setMoodAnalytics(res);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load SOS analytics
  const loadSOSAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSOSAnalytics();
      if (res.success) {
        setSOSAnalytics(res);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>Enter admin token to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            <Input
              type="password"
              placeholder="Enter admin token"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <Button onClick={handleAdminLogin} className="w-full">
              Login as Admin
            </Button>
            <p className="text-xs text-gray-500">
              Demo token: <code className="bg-gray-100 px-2 py-1">admin_secret_token_12345</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">SafeSpace Admin Dashboard</h1>
            <p className="text-gray-600">Monitor users and their interactions</p>
            {autoRefresh && (
              <p className="text-xs text-green-600 mt-1">
                🟢 Auto-refreshing • Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
            >
              {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                loadDashboard();
                setLastUpdate(new Date());
              }}
              size="sm"
            >
              🔄 Refresh Now
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false);
                setAdminToken('');
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_users}</div>
                <p className="text-xs text-gray-500">Active today: {summary.active_users_today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Trusted Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.users_with_contacts || 0}</div>
                <p className="text-xs text-gray-500">{summary.total_contacts || 0} contacts total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Mood Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_mood_logs}</div>
                <p className="text-xs text-gray-500">Today: {summary.today_mood_logs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">SOS Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_sos_alerts}</div>
                <p className="text-xs text-red-500">Active: {summary.active_sos_alerts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Mood (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avg_mood_7days}/5</div>
                <p className={`text-xs ${parseFloat(summary.avg_mood_7days) >= 3 ? 'text-green-600' : 'text-orange-600'}`}>
                  {parseFloat(summary.avg_mood_7days) >= 3 ? '✓ Healthy' : '⚠ Needs attention'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="user-detail">User Details</TabsTrigger>
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
            <TabsTrigger value="moods">Mood Analytics</TabsTrigger>
            <TabsTrigger value="sos">SOS Analytics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View all registered users and their activities</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No users found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Auth Method</TableHead>
                          <TableHead>Interactions</TableHead>
                          <TableHead>Mood Logs</TableHead>
                          <TableHead>SOS</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.oauth_profile_image && (
                                  <img 
                                    src={user.oauth_profile_image} 
                                    alt={user.first_name}
                                    className="w-6 h-6 rounded-full"
                                  />
                                )}
                                {user.first_name} {user.last_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.oauth_provider ? (
                                <Badge variant="secondary">
                                  <img 
                                    src="https://www.google.com/favicon.ico" 
                                    alt="Google" 
                                    className="w-3 h-3 mr-1"
                                  />
                                  {user.oauth_provider}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Email</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">{user.total_interactions || 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.mood_logs_count}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">{user.sos_alerts_count}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadUserDetails(user.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Detail Tab */}
          <TabsContent value="user-detail">
            <Card>
              <CardHeader>
                <CardTitle>User Details & Interactions</CardTitle>
                <CardDescription>
                  {selectedUser
                    ? `${selectedUser.user.email} - ${selectedUser.stats.total_moods} mood logs, ${selectedUser.stats.total_sos} SOS alerts`
                    : 'Select a user from the Users tab to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <Tabs defaultValue="info" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="info">User Info</TabsTrigger>
                      <TabsTrigger value="moods">
                        Mood Logs ({selectedUser.mood_logs_count})
                      </TabsTrigger>
                      <TabsTrigger value="sos">
                        SOS Alerts ({selectedUser.sos_alerts_count})
                      </TabsTrigger>
                      <TabsTrigger value="contacts">Trusted Contacts</TabsTrigger>
                    </TabsList>

                    {/* User Info */}
                    <TabsContent value="info" className="space-y-4">
                      {/* Profile Header with Image */}
                      {selectedUser.user.oauth_profile_image && (
                        <div className="flex items-center gap-4 pb-4 border-b">
                          <img 
                            src={selectedUser.user.oauth_profile_image} 
                            alt={`${selectedUser.user.first_name} ${selectedUser.user.last_name}`}
                            className="w-20 h-20 rounded-full border-2 border-blue-500"
                          />
                          <div>
                            <h3 className="text-xl font-bold">
                              {selectedUser.user.first_name} {selectedUser.user.last_name}
                            </h3>
                            <p className="text-gray-600">{selectedUser.user.email}</p>
                            {selectedUser.user.oauth_provider && (
                              <Badge variant="secondary" className="mt-1">
                                <img 
                                  src="https://www.google.com/favicon.ico" 
                                  alt="Google" 
                                  className="w-3 h-3 mr-1 inline"
                                />
                                Google Account
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedUser.user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">
                            {selectedUser.user.first_name} {selectedUser.user.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{selectedUser.user.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="font-medium">
                            {new Date(selectedUser.user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Emergency Contact</p>
                          <p className="font-medium">{selectedUser.user.emergency_contact_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Emergency Phone</p>
                          <p className="font-medium">{selectedUser.user.emergency_contact_phone}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Profile Information</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Hostel</p>
                            <p className="font-medium">{selectedUser.user.hostel || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Auth Method</p>
                            <p className="font-medium">
                              {selectedUser.user.oauth_provider ? (
                                <Badge variant="secondary">Google OAuth</Badge>
                              ) : (
                                <Badge variant="outline">Email/Password</Badge>
                              )}
                            </p>
                          </div>
                        </div>
                        {selectedUser.user.introduction && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">Introduction</p>
                            <p className="text-sm">{selectedUser.user.introduction}</p>
                          </div>
                        )}
                        {selectedUser.user.preferences && selectedUser.user.preferences.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Preferences</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedUser.user.preferences.map((pref: string) => (
                                <Badge key={pref} variant="secondary">{pref}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Activity Statistics</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-blue-50 rounded">
                            <p className="text-sm text-gray-600">Total Mood Logs</p>
                            <p className="text-2xl font-bold">{selectedUser.stats.total_moods}</p>
                          </div>
                          <div className="p-3 bg-red-50 rounded">
                            <p className="text-sm text-gray-600">SOS Alerts</p>
                            <p className="text-2xl font-bold">{selectedUser.stats.total_sos}</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded">
                            <p className="text-sm text-gray-600">Average Mood</p>
                            <p className="text-2xl font-bold">{selectedUser.stats.avg_mood}/5</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Mood Logs */}
                    <TabsContent value="moods">
                      {selectedUser.mood_logs.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No mood logs yet</div>
                      ) : (
                        <div className="space-y-3">
                          {selectedUser.mood_logs.map((mood) => (
                            <div key={mood.id} className="p-3 border rounded">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{mood.mood_emoji}</span>
                                    <div>
                                      <p className="font-semibold">{mood.mood_label}</p>
                                      <p className="text-sm text-gray-600">
                                        Level: {mood.mood_level}/5
                                      </p>
                                    </div>
                                  </div>
                                  {mood.notes && <p className="text-sm mt-2">{mood.notes}</p>}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {new Date(mood.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* SOS Alerts */}
                    <TabsContent value="sos">
                      {selectedUser.sos_alerts.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No SOS alerts</div>
                      ) : (
                        <div className="space-y-3">
                          {selectedUser.sos_alerts.map((alert) => (
                            <div key={alert.id} className="p-3 border rounded border-red-200 bg-red-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🆘</span>
                                    <Badge
                                      variant={
                                        alert.status === 'active' ? 'destructive' : 'outline'
                                      }
                                    >
                                      {alert.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm">
                                    Location: {alert.latitude}, {alert.longitude}
                                  </p>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                  <p>{new Date(alert.created_at).toLocaleString()}</p>
                                  {alert.resolved_at && (
                                    <p className="text-green-600">
                                      Resolved: {new Date(alert.resolved_at).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Trusted Contacts */}
                    <TabsContent value="contacts">
                      {selectedUser.trusted_contacts.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No trusted contacts</div>
                      ) : (
                        <div className="space-y-3">
                          {selectedUser.trusted_contacts.map((contact: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded">
                              <p className="font-semibold">{contact.name}</p>
                              <p className="text-sm text-gray-600">{contact.email}</p>
                              <p className="text-sm text-gray-600">{contact.phone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a user from the Users tab to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mood Analytics Tab */}
          <TabsContent value="moods">
            <Card>
              <CardHeader>
                <CardTitle>Mood Analytics (Last 30 Days)</CardTitle>
                <CardDescription>Track mood trends across all users</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={loadMoodAnalytics} className="mb-4">
                  Load Analytics
                </Button>
                {moodAnalytics && (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-sm text-gray-600">Users with Logs</p>
                        <p className="text-2xl font-bold">
                          {moodAnalytics.stats.total_users_with_logs}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <p className="text-sm text-gray-600">Total Logs</p>
                        <p className="text-2xl font-bold">{moodAnalytics.stats.total_mood_logs}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded">
                        <p className="text-sm text-gray-600">Average Mood</p>
                        <p className="text-2xl font-bold">
                          {parseFloat(moodAnalytics.stats.overall_avg_mood).toFixed(2)}/5
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Avg Mood</TableHead>
                            <TableHead>Total Logs</TableHead>
                            <TableHead>Min</TableHead>
                            <TableHead>Max</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {moodAnalytics.analytics.map((day: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{day.date}</TableCell>
                              <TableCell>{parseFloat(day.avg_mood).toFixed(2)}</TableCell>
                              <TableCell>{day.total_logs}</TableCell>
                              <TableCell>{day.min_mood}</TableCell>
                              <TableCell>{day.max_mood}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SOS Analytics Tab */}
          <TabsContent value="sos">
            <Card>
              <CardHeader>
                <CardTitle>SOS Analytics</CardTitle>
                <CardDescription>Monitor emergency alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={loadSOSAnalytics} className="mb-4">
                  Load Analytics
                </Button>
                {sosAnalytics && (
                  <>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="p-3 bg-red-50 rounded">
                        <p className="text-sm text-gray-600">Total Alerts</p>
                        <p className="text-2xl font-bold">{sosAnalytics.stats.total_alerts}</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded">
                        <p className="text-sm text-gray-600">Active</p>
                        <p className="text-2xl font-bold">{sosAnalytics.stats.active_alerts}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <p className="text-sm text-gray-600">Resolved</p>
                        <p className="text-2xl font-bold">{sosAnalytics.stats.resolved_alerts}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-sm text-gray-600">Users Triggered</p>
                        <p className="text-2xl font-bold">
                          {sosAnalytics.stats.users_triggered_sos}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Resolved</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sosAnalytics.alerts.map((alert: any) => (
                            <TableRow key={alert.id}>
                              <TableCell className="font-medium">{alert.user_email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    alert.status === 'active' ? 'destructive' : 'outline'
                                  }
                                >
                                  {alert.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {alert.latitude}, {alert.longitude}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(alert.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-sm">
                                {alert.resolved_at
                                  ? new Date(alert.resolved_at).toLocaleString()
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Feed Tab - NEW */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Activity Feed</CardTitle>
                <CardDescription>Live stream of user interactions across SafeSpace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.slice(0, 10).map((user) => (
                    <div key={user.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {user.oauth_profile_image && (
                            <img 
                              src={user.oauth_profile_image} 
                              alt={user.first_name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-semibold">{user.first_name} {user.last_name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex gap-2 mt-2">
                              {user.mood_logs_count > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  💚 {user.mood_logs_count} mood logs
                                </Badge>
                              )}
                              {user.sos_alerts_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  🚨 {user.sos_alerts_count} SOS
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                📊 {user.total_interactions || 0} interactions
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Joined {new Date(user.created_at).toLocaleDateString()}</p>
                          {user.last_mood_log && (
                            <p className="text-xs text-green-600">
                              Last activity: {new Date(user.last_mood_log).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab - NEW */}
          <TabsContent value="insights">
            <div className="grid gap-4">
              {/* Trusted Contacts Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Safety Network Insights</CardTitle>
                  <CardDescription>Trusted contacts and safety feature adoption</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Users with Contacts</p>
                      <p className="text-3xl font-bold">{summary?.users_with_contacts || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {summary && summary.total_users > 0 
                          ? `${((summary.users_with_contacts / summary.total_users) * 100).toFixed(1)}% adoption`
                          : '0% adoption'}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Contacts Configured</p>
                      <p className="text-3xl font-bold">{summary?.total_contacts || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Avg {summary && summary.users_with_contacts > 0 
                          ? (summary.total_contacts / summary.users_with_contacts).toFixed(1) 
                          : '0'} per user
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Safety Feature Usage</p>
                      <p className="text-3xl font-bold">{summary?.total_sos_alerts || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Emergency activations</p>
                    </div>
                  </div>

                  {/* Mental Health Trends */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Mental Health Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Wellness Engagement</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{summary?.total_mood_logs || 0}</span>
                          <span className="text-sm text-gray-500">mood logs</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {summary?.today_mood_logs || 0} logged today
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Average Mood Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{summary?.avg_mood_7days || 0}</span>
                          <span className="text-sm text-gray-500">/ 5.0</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full ${
                              parseFloat(summary?.avg_mood_7days || 0) >= 4 ? 'bg-green-500' :
                              parseFloat(summary?.avg_mood_7days || 0) >= 3 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(parseFloat(summary?.avg_mood_7days || 0) / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Adoption */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-4">Feature Adoption Rates</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Trusted Contacts Setup</span>
                          <span className="font-medium">
                            {summary && summary.total_users > 0 
                              ? `${((summary.users_with_contacts / summary.total_users) * 100).toFixed(0)}%`
                              : '0%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${summary && summary.total_users > 0 
                                ? ((summary.users_with_contacts / summary.total_users) * 100) 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Mood Tracking Active Users</span>
                          <span className="font-medium">
                            {summary && summary.total_users > 0 
                              ? `${((users.filter(u => u.mood_logs_count > 0).length / summary.total_users) * 100).toFixed(0)}%`
                              : '0%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ 
                              width: `${summary && summary.total_users > 0 
                                ? ((users.filter(u => u.mood_logs_count > 0).length / summary.total_users) * 100) 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Google OAuth Adoption</span>
                          <span className="font-medium">
                            {summary && summary.total_users > 0 
                              ? `${((users.filter(u => u.oauth_provider).length / summary.total_users) * 100).toFixed(0)}%`
                              : '0%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ 
                              width: `${summary && summary.total_users > 0 
                                ? ((users.filter(u => u.oauth_provider).length / summary.total_users) * 100) 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Recommendations</h3>
                    <div className="space-y-2">
                      {summary && summary.users_with_contacts / summary.total_users < 0.5 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800">⚠️ Low Trusted Contacts Adoption</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Only {((summary.users_with_contacts / summary.total_users) * 100).toFixed(0)}% of users have configured trusted contacts. 
                            Consider sending reminders or tutorials.
                          </p>
                        </div>
                      )}
                      {summary && parseFloat(summary.avg_mood_7days) < 3 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800">🚨 Low Average Mood Detected</p>
                          <p className="text-xs text-red-700 mt-1">
                            Average mood is {summary.avg_mood_7days}/5.0. Consider promoting counseling services or wellness resources.
                          </p>
                        </div>
                      )}
                      {summary && summary.active_sos_alerts > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800">🆘 Active SOS Alerts</p>
                          <p className="text-xs text-red-700 mt-1">
                            There are {summary.active_sos_alerts} active SOS alerts that may need attention.
                          </p>
                        </div>
                      )}
                      {summary && summary.total_users > 0 && 
                       users.filter(u => u.mood_logs_count > 0).length / summary.total_users > 0.7 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-800">✅ High Wellness Engagement</p>
                          <p className="text-xs text-green-700 mt-1">
                            {((users.filter(u => u.mood_logs_count > 0).length / summary.total_users) * 100).toFixed(0)}% of users are actively tracking their mood. Great engagement!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
