import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, User, Phone, Mail, MapPin, ArrowLeft, Edit, Save, Heart, ShieldCheck, LogOut, Users, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { userService } from '@/lib/services';

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreferencesSetup, setShowPreferencesSetup] = useState(false);
  const [trustedContacts, setTrustedContacts] = useState<any[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [profile, setProfile] = useState({
    id: 0,
    name: '',
    first_name: '',
    last_name: '',
    hostel: '',
    phone: '',
    email: '',
    introduction: '',
    profile_picture: '',
    oauth_provider: '',
    preferences: [] as string[]
  });

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      toast.error('Not Logged In', {
        description: 'Please log in to view your profile'
      });
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setProfile({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        hostel: user.hostel || '',
        phone: user.phone || '',
        email: user.email || '',
        introduction: user.introduction || '',
        profile_picture: user.profile_picture || '',
        oauth_provider: user.oauth_provider || '',
        preferences: user.preferences || []
      });

      // Show preferences setup if this is a new Google OAuth user with no preferences
      if (user.oauth_provider === 'google' && (!user.preferences || user.preferences.length === 0)) {
        setShowPreferencesSetup(true);
      }

      // Load trusted contacts
      loadTrustedContacts();
    } catch (e) {
      console.error('Failed to parse user data:', e);
      navigate('/login');
    }
  }, [navigate]);

  const loadTrustedContacts = async () => {
    try {
      const response = await userService.getTrustedContacts();
      if (response.success) {
        setTrustedContacts(response.contacts || []);
      }
    } catch (error) {
      console.error('Failed to load trusted contacts:', error);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Missing Information', {
        description: 'Please provide at least name and phone number'
      });
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Not Logged In', {
        description: 'Please log in to add trusted contacts'
      });
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const response = await userService.addTrustedContact(
        newContact.name,
        newContact.email,
        newContact.phone
      );

      if (response.success) {
        toast.success('Contact Added!', {
          description: `${newContact.name} has been added to your trusted contacts`
        });
        setNewContact({ name: '', email: '', phone: '' });
        setShowAddContact(false);
        loadTrustedContacts();
      } else {
        throw new Error(response.message || 'Failed to add contact');
      }
    } catch (error: any) {
      console.error('Add contact error:', error);
      toast.error('Failed to Add Contact', {
        description: error.message || 'Could not add trusted contact. Please try logging in again.'
      });
      
      // If authentication error, redirect to login
      if (error.message && error.message.includes('authentication')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: number, contactName: string) => {
    if (!confirm(`Are you sure you want to remove ${contactName} from your trusted contacts?`)) {
      return;
    }

    try {
      const response = await apiCall('user.php?action=delete-contact', {
        method: 'POST',
        body: { contact_id: contactId }
      });

      if (response.success) {
        toast.success('Contact Removed', {
          description: `${contactName} has been removed from your trusted contacts`
        });
        loadTrustedContacts();
      } else {
        throw new Error(response.message || 'Failed to delete contact');
      }
    } catch (error: any) {
      toast.error('Failed to Remove Contact', {
        description: error.message || 'Could not remove trusted contact'
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('user.php?action=update', {
        method: 'POST',
        body: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          hostel: profile.hostel,
          phone: profile.phone,
          introduction: profile.introduction,
          preferences: profile.preferences
        }
      });

      if (response.success) {
        // Update localStorage
        const updatedUser = {
          ...JSON.parse(localStorage.getItem('user') || '{}'),
          first_name: profile.first_name,
          last_name: profile.last_name,
          hostel: profile.hostel,
          phone: profile.phone,
          introduction: profile.introduction,
          preferences: profile.preferences
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        toast.success('Profile Updated', {
          description: 'Your profile has been saved successfully'
        });
        setIsEditing(false);
        setShowPreferencesSetup(false);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error('Update Failed', {
        description: error.message || 'Could not save your profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (preference: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter(p => p !== preference)
        : [...prev.preferences, preference]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    toast.success('Logged Out', {
      description: 'You have been logged out successfully'
    });
    navigate('/');
  };

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    return profile.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
            </Link>
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">User Profile</h1>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message for New Google Users */}
        {showPreferencesSetup && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900">
                🎉 Welcome to SafeSpace, {profile.first_name}!
              </CardTitle>
              <CardDescription className="text-base text-blue-700">
                Let's personalize your experience. Tell us more about yourself and select your preferences below.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={profile.profile_picture} alt={profile.name} />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-3xl text-gray-900">
              {profile.name || profile.email}
            </CardTitle>
            {profile.oauth_provider && (
              <Badge variant="secondary" className="mt-2">
                <img 
                  src={`https://www.google.com/favicon.ico`} 
                  alt="Google" 
                  className="w-4 h-4 mr-2"
                />
                Connected with Google
              </Badge>
            )}
            {profile.hostel && (
              <CardDescription className="text-lg flex items-center justify-center space-x-2 mt-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span>{profile.hostel}</span>
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <User className="h-6 w-6 text-blue-600" />
                <span>Contact Information</span>
              </span>
              {!showPreferencesSetup && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={isLoading}
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  {isEditing || showPreferencesSetup ? (
                    <Input
                      id="first_name"
                      value={profile.first_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value, name: `${e.target.value} ${prev.last_name}` }))}
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{profile.first_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  {isEditing || showPreferencesSetup ? (
                    <Input
                      id="last_name"
                      value={profile.last_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value, name: `${prev.first_name} ${e.target.value}` }))}
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{profile.last_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="hostel">Hostel Name</Label>
                  {isEditing || showPreferencesSetup ? (
                    <Input
                      id="hostel"
                      value={profile.hostel}
                      onChange={(e) => setProfile(prev => ({ ...prev, hostel: e.target.value }))}
                      placeholder="e.g., Brahmaputra Hostel"
                    />
                  ) : (
                    <p className="text-lg text-gray-700">{profile.hostel || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing || showPreferencesSetup ? (
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91-9876543210"
                    />
                  ) : profile.phone ? (
                    <Button
                      variant="link"
                      className="p-0 h-auto text-lg text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(`tel:${profile.phone}`)}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {profile.phone}
                    </Button>
                  ) : (
                    <p className="text-lg text-gray-500">Not set</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-lg text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(`mailto:${profile.email}`)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {profile.email}
                    </Button>
                    {profile.oauth_provider === 'google' && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About Me</CardTitle>
            <CardDescription>Tell us a bit about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing || showPreferencesSetup ? (
              <Textarea
                value={profile.introduction}
                onChange={(e) => setProfile(prev => ({ ...prev, introduction: e.target.value }))}
                rows={4}
                placeholder="Share something about yourself - your interests, academic goals, or what brings you to SafeSpace..."
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {profile.introduction || 'No introduction yet. Click "Edit Profile" to add one!'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trusted Contacts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-purple-600" />
                <span>Trusted Emergency Contacts</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddContact(!showAddContact)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </CardTitle>
            <CardDescription>
              These contacts will be notified when you trigger an emergency SOS alert
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add Contact Form */}
            {showAddContact && (
              <Card className="mb-4 bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="contact_name">Name *</Label>
                      <Input
                        id="contact_name"
                        value={newContact.name}
                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Phone Number *</Label>
                      <Input
                        id="contact_phone"
                        value={newContact.phone}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91-9876543210"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">Email (Optional)</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddContact(false);
                        setNewContact({ name: '', email: '', phone: '' });
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddContact} disabled={isLoading}>
                      {isLoading ? 'Adding...' : 'Add Contact'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contacts List */}
            {trustedContacts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-2">No Trusted Contacts Yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Add emergency contacts who will be notified during SOS alerts
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowAddContact(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Contact
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {trustedContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 rounded-full p-3">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{contact.contact_name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {contact.contact_phone}
                          </span>
                          {contact.contact_email && (
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {contact.contact_email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`tel:${contact.contact_phone}`)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteContact(contact.id, contact.contact_name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SafeSpace Preferences */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-pink-600" />
              <span>SafeSpace Preferences</span>
            </CardTitle>
            <CardDescription>
              {showPreferencesSetup 
                ? "Select what matters most to you - this helps us personalize your experience"
                : "Your selected focus areas in SafeSpace"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(isEditing || showPreferencesSetup) && (
                <p className="text-sm text-gray-600 mb-4">
                  Click to select/deselect your preferences:
                </p>
              )}
              
              <div className="flex flex-wrap gap-3">
                <Badge
                  variant={profile.preferences.includes('Safety') ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                    profile.preferences.includes('Safety')
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'hover:bg-blue-50'
                  } ${(isEditing || showPreferencesSetup) ? '' : 'cursor-default'}`}
                  onClick={() => (isEditing || showPreferencesSetup) && togglePreference('Safety')}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Safety & Security
                </Badge>
                
                <Badge
                  variant={profile.preferences.includes('Mental Health') ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                    profile.preferences.includes('Mental Health')
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'hover:bg-green-50'
                  } ${(isEditing || showPreferencesSetup) ? '' : 'cursor-default'}`}
                  onClick={() => (isEditing || showPreferencesSetup) && togglePreference('Mental Health')}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Mental Health & Wellness
                </Badge>
                
                <Badge
                  variant={profile.preferences.includes('Academic Support') ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                    profile.preferences.includes('Academic Support')
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'hover:bg-purple-50'
                  } ${(isEditing || showPreferencesSetup) ? '' : 'cursor-default'}`}
                  onClick={() => (isEditing || showPreferencesSetup) && togglePreference('Academic Support')}
                >
                  📚 Academic Support
                </Badge>
                
                <Badge
                  variant={profile.preferences.includes('Peer Support') ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                    profile.preferences.includes('Peer Support')
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'hover:bg-orange-50'
                  } ${(isEditing || showPreferencesSetup) ? '' : 'cursor-default'}`}
                  onClick={() => (isEditing || showPreferencesSetup) && togglePreference('Peer Support')}
                >
                  👥 Peer Support
                </Badge>
              </div>

              {!isEditing && !showPreferencesSetup && profile.preferences.length === 0 && (
                <p className="text-gray-500 italic">No preferences selected. Click "Edit Profile" to add some!</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {(isEditing || showPreferencesSetup) ? (
            <>
              <Button onClick={handleSave} size="lg" className="px-8" disabled={isLoading}>
                <Save className="h-5 w-5 mr-2" />
                {isLoading ? 'Saving...' : (showPreferencesSetup ? 'Complete Setup' : 'Save Changes')}
              </Button>
              {!showPreferencesSetup && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  size="lg"
                  className="px-8"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              size="lg"
              className="px-8"
            >
              <Edit className="h-5 w-5 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/safety">
                <Button variant="outline" className="w-full">
                  🚨 Emergency SOS
                </Button>
              </Link>
              <Link to="/wellness">
                <Button variant="outline" className="w-full">
                  💚 Check Wellness Hub
                </Button>
              </Link>
              <Link to="/resources">
                <Button variant="outline" className="w-full">
                  📚 Browse Resources
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}