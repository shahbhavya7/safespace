import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Phone, MapPin, ArrowLeft, Building } from 'lucide-react';

export default function SecurityDirectory() {
  const securityContacts = [
    {
      building: 'CS Block',
      guardName: 'Rajesh Kumar',
      phone: '+91-9876543210',
      location: 'Computer Science Building, Ground Floor'
    },
    {
      building: 'EE Block',
      guardName: 'Suresh Sharma',
      phone: '+91-9876543211',
      location: 'Electrical Engineering Building, Main Entrance'
    },
    {
      building: 'Mechanical Block',
      guardName: 'Amit Singh',
      phone: '+91-9876543212',
      location: 'Mechanical Engineering Building, Security Desk'
    },
    {
      building: 'Chemical Block',
      guardName: 'Vikram Patel',
      phone: '+91-9876543213',
      location: 'Chemical Engineering Building, Front Gate'
    },
    {
      building: 'SAB (Student Activity Building)',
      guardName: 'Raman Gupta',
      phone: '+91-9876543214',
      location: 'Student Activity Building, Reception'
    },
    {
      building: 'LHC (Lecture Hall Complex)',
      guardName: 'Deepak Verma',
      phone: '+91-9876543215',
      location: 'Lecture Hall Complex, Main Entrance'
    },
    {
      building: 'Brahmaputra Hostel',
      guardName: 'Mohan Das',
      phone: '+91-9876543216',
      location: 'Brahmaputra Hostel, Warden Office'
    },
    {
      building: 'Raavi Hostel',
      guardName: 'Kiran Joshi',
      phone: '+91-9876543217',
      location: 'Raavi Hostel, Ground Floor Security'
    },
    {
      building: 'Beas Hostel',
      guardName: 'Sandeep Yadav',
      phone: '+91-9876543218',
      location: 'Beas Hostel, Main Gate'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Security Directory</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Campus Security Contacts</h2>
          <p className="text-lg text-gray-600">
            Quick access to security guards across all campus buildings and hostels
          </p>
        </div>

        {/* Emergency Contacts Banner */}
        <Card className="bg-red-50 border-red-200 mb-8">
          <CardHeader>
            <CardTitle className="text-red-800 text-center">Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => window.open('tel:911')}
              >
                <Phone className="h-4 w-4 mr-2" />
                911 - Emergency
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open('tel:+91-1234567890')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Campus Security Control
              </Button>
              <Link to="/safety">
                <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-100">
                  🚨 Emergency SOS
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Guards Directory */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityContacts.map((contact, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-6 w-6 text-blue-600" />
                  <span>{contact.building}</span>
                </CardTitle>
                <CardDescription className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{contact.location}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Security Guard</p>
                    <p className="font-semibold text-gray-900">{contact.guardName}</p>
                  </div>
                  
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(`tel:${contact.phone}`)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call {contact.phone}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Security Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Security Hours</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Academic Buildings: 6:00 AM - 10:00 PM</li>
                  <li>• Hostels: 24/7 Security Coverage</li>
                  <li>• Main Campus Gates: 24/7 Monitoring</li>
                  <li>• Emergency Response: Always Available</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What to Report</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Suspicious activity or individuals</li>
                  <li>• Safety hazards or broken lighting</li>
                  <li>• Lost or found items</li>
                  <li>• Any emergency situations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}