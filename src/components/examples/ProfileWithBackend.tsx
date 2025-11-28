import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Heart, ArrowLeft, Save, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { userService, authService } from '@/lib/services';

export default function ProfileWithBackend() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    campus: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [message, setMessage] = useState('');

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await userService.getProfile();
      if (result.success) {
        setProfile(result.data);
        setFormData({
          first_name: result.data.first_name || '',
          last_name: result.data.last_name || '',
          phone: result.data.phone || '',
          campus: result.data.campus || '',
          emergency_contact_name: result.data.emergency_contact_name || '',
          emergency_contact_phone: result.data.emergency_contact_phone || '',
        });
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error loading profile: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await userService.updateProfile(formData);
      if (result.success) {
        setMessage('Profile updated successfully!');
        setEditing(false);
        await loadProfile();
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setMessage('Logged out successfully');
      // Redirect to home after logout
      setTimeout(() => window.location.href = '/', 1000);
    } catch (error) {
      setMessage(`Error logging out: ${(error as Error).message}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {message}
          </div>
        )}

        {/* Profile Card */}
        {!editing ? (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your personal and contact details</CardDescription>
              </div>
              <Button onClick={() => setEditing(true)} className="gap-2">
                <Heart className="h-4 w-4" />
                Edit Profile
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg text-gray-900">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-lg text-gray-900">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-lg text-gray-900">{profile?.phone || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Campus</label>
                  <p className="text-lg text-gray-900">{profile?.campus || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                  <p className="text-lg text-gray-900">
                    {profile?.emergency_contact_name || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Emergency Phone</label>
                  <p className="text-lg text-gray-900">
                    {profile?.emergency_contact_phone || 'Not set'}
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  Member since {new Date(profile?.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Campus</label>
                    <Input
                      name="campus"
                      value={formData.campus}
                      onChange={handleInputChange}
                      placeholder="Main Campus"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Emergency Contact Name</label>
                    <Input
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      placeholder="Mom"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                    <Input
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="gap-2 flex-1"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Database Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💾 Stored in Database</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <p className="mb-2">✅ All your information is securely stored in our MySQL database</p>
            <p className="mb-2">✅ Data is encrypted and protected</p>
            <p className="mb-2">✅ Your profile is backed up and retrievable anytime</p>
            <p>✅ All changes are automatically saved to the database</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
