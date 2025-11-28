import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Heart, BookOpen, Phone, User, MapPin, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { userService, authService } from '@/lib/services';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    // Send activity heartbeat if user is logged in
    const sendHeartbeat = async () => {
      if (authService.isAuthenticated()) {
        try {
          await userService.updateLastActive();
        } catch (e) {
          console.error('Failed to update activity:', e);
        }
      }
    };

    // Send heartbeat immediately
    sendHeartbeat();

    // Send heartbeat every 60 seconds
    const heartbeatInterval = setInterval(sendHeartbeat, 60000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/safety" className="text-gray-700 hover:text-blue-600 transition-colors">Safety Hub</Link>
              <Link to="/wellness" className="text-gray-700 hover:text-blue-600 transition-colors">Wellness Hub</Link>
              <Link to="/resources" className="text-gray-700 hover:text-blue-600 transition-colors">Resources</Link>
              <Link to="/security" className="text-gray-700 hover:text-blue-600 transition-colors">Security</Link>
              <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">Profile</Link>
              
              {user ? (
                <div className="flex items-center space-x-4 ml-4">
                  <Link to="/profile" className="flex items-center space-x-2 hover:opacity-80">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_picture} alt={user.first_name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </span>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 ml-4">
                  <Link to="/login">
                    <Button variant="outline" size="sm">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          {user && (
            <div className="mb-6 inline-block">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3">
                <p className="text-lg text-blue-900">
                  👋 Welcome back, <span className="font-bold">{user.first_name}!</span>
                </p>
              </div>
            </div>
          )}
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Safety & Wellness
            <span className="block text-blue-600">Matters</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            SafeSpace is your comprehensive platform for student safety, mental health support, and wellness resources. 
            Get help when you need it, access professional support, and prioritize your well-being.
          </p>
          
          {/* Emergency SOS Button */}
          <Link to="/safety">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-semibold mb-8">
              🚨 Emergency SOS
            </Button>
          </Link>
        </div>

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Link to="/wellness" className="group">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle>Stress Relief</CardTitle>
                <CardDescription>Guided breathing & mindfulness</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/self_guidance" className="group">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle>Self-Help Guides</CardTitle>
                <CardDescription>Educational resources & tips</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/resources" className="group">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <User className="h-12 w-12 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle>Counseling Session</CardTitle>
                <CardDescription>Book professional support</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/security" className="group">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Phone className="h-12 w-12 text-red-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle>Crisis Helpline</CardTitle>
                <CardDescription>24/7 emergency contacts</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Personas Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">How SafeSpace Helps You</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Safety First</h3>
              <p className="text-gray-600">
                Emergency SOS, live location sharing, safe route navigation, and campus security contacts 
                to keep you protected 24/7.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mental Wellness</h3>
              <p className="text-gray-600">
                Mood tracking, guided breathing exercises, mindfulness sessions, and coping strategies 
                for stress, anxiety, and academic pressure.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Professional Support</h3>
              <p className="text-gray-600">
                Direct access to campus counselors, appointment booking, educational resources, 
                and 24/7 crisis helplines when you need professional help.
              </p>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span>Safety Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• One-tap emergency SOS button</li>
                <li>• Live location sharing with trusted contacts</li>
                <li>• Safe route navigation across campus</li>
                <li>• Hazard reporting system</li>
                <li>• Campus security directory</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-green-600" />
                <span>Wellness Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Daily mood tracking & journaling</li>
                <li>• Guided breathing exercises</li>
                <li>• Mindfulness & meditation sessions</li>
                <li>• Sleep tips & healthy routines</li>
                <li>• Positive affirmations & coping strategies</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="text-xl font-bold">SafeSpace</span>
          </div>
          <p className="text-gray-400">Your safety and wellness matter. We're here to help, 24/7.</p>
        </div>
      </footer>
    </div>
  );
}