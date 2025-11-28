import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Calendar, Clock, User, ArrowLeft, Phone, Mail } from 'lucide-react';
import { useEffect } from 'react';

export default function CounselingBooking() {
  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
            <h1 className="text-xl font-semibold text-gray-900">Book Counseling Session</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Schedule Your Appointment</h2>
          <p className="text-lg text-gray-600">
            Book a confidential counseling session with our professional counselors
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendly Widget Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <span>Select Date & Time</span>
                </CardTitle>
                <CardDescription>Choose an available slot that works for you</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Calendly Inline Widget */}
                <div
                  className="calendly-inline-widget"
                  data-url="https://calendly.com/2023aib1005-iitrpr/30min"
                  style={{ minWidth: '320px', height: '700px' }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Information Sidebar */}
          <div className="space-y-6">
            {/* Session Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Session Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <p>Sessions are 50 minutes long</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <p>All sessions are completely confidential</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <p>Free for all enrolled students</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <p>Available Monday - Friday, 9 AM - 5 PM</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <p>Cancel or reschedule up to 24 hours in advance</p>
                </div>
              </CardContent>
            </Card>

            {/* What to Expect Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">What to Expect</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Before Your Session</h4>
                  <p>You'll receive a confirmation email with session details and a secure video link.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">During Your Session</h4>
                  <p>Meet one-on-one with a licensed counselor in a safe, judgment-free space.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">After Your Session</h4>
                  <p>You can book follow-up appointments or access additional resources.</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900 flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Need Help?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-purple-800">
                  <Phone className="h-4 w-4" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-purple-800">
                  <Mail className="h-4 w-4" />
                  <span>counseling@university.edu</span>
                </div>
                <p className="text-xs text-purple-700 mt-2">
                  Having trouble booking? Contact us and we'll help you schedule.
                </p>
              </CardContent>
            </Card>

            {/* Emergency Card */}
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800 text-sm">In Crisis?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => window.open('tel:988')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call 988 - Crisis Lifeline
                </Button>
                <p className="text-xs text-red-700 text-center">
                  Available 24/7 for immediate support
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Privacy Notice */}
        <Card className="mt-8 bg-gray-50">
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 text-center">
              <strong>Privacy Notice:</strong> Your information is protected under HIPAA and FERPA regulations. 
              All counseling sessions are confidential except in cases of imminent danger to yourself or others.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}