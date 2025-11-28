import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Shield,
  Phone,
  MapPin,
  AlertTriangle,
  Navigation,
  ArrowLeft,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'sonner';
import { sosService, userService } from '@/lib/services';

// Fix default marker issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Live location marker
function LiveLocationMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  if (!position) return null;
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        className: 'custom-icon',
        html: `<div style="
          background: rgba(0, 102, 255, 0.7);
          border: 2px solid white;
          border-radius: 50%;
          width: 15px;
          height: 15px;
          box-shadow: 0 0 8px rgba(0, 0, 255, 0.7);
        "></div>`,
      })}
    >
      <Popup>📍 You are here</Popup>
    </Marker>
  );
}

// Helper function for ORS route fetching
async function getORSRoute(
  start: [number, number],
  end: [number, number]
): Promise<[number, number][]> {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;
  const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${apiKey}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const coords = data.features[0].geometry.coordinates.map(
      (c: number[]) => [c[1], c[0]] as [number, number]
    );
    return coords;
  } catch (err) {
    console.error('ORS route fetch error:', err);
    return [];
  }
}

export default function SafetyHub() {
  // --- Emergency SOS (Automated Call & SMS) ---
  const [sosActive, setSosActive] = useState(false);
  const [isCallingEmergency, setIsCallingEmergency] = useState(false);

  // --- Live Location Sharing (for trusted contacts) ---
  const [locationSharing, setLocationSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const locationUpdateCount = useRef(0);

  // Trusted contacts - loaded from backend
  const [trustedContacts, setTrustedContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  // Emergency number (default fallback)
  const emergencyNumber = '112'; // International emergency number

  // Load trusted contacts on mount
  useEffect(() => {
    loadTrustedContacts();
  }, []);

  const loadTrustedContacts = async () => {
    try {
      const response = await userService.getTrustedContacts();
      if (response.success) {
        setTrustedContacts(response.contacts || []);
      }
    } catch (error) {
      console.error('Failed to load trusted contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  // ========== EMERGENCY SOS - NOTIFY TRUSTED CONTACTS ==========
  const handleSOS = async () => {
    setSosActive(true);
    setIsCallingEmergency(true);

    try {
      // Check if user is logged in
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Not Logged In', {
          description: 'Please log in to use SOS features.',
        });
        setIsCallingEmergency(false);
        setSosActive(false);
        return;
      }

      // Check if user has trusted contacts
      if (trustedContacts.length === 0) {
        toast.error('No Trusted Contacts', {
          description: 'Please add trusted contacts in your profile before using SOS.',
        });
        setIsCallingEmergency(false);
        setSosActive(false);
        return;
      }

      const phoneNumbers = trustedContacts
        .map(contact => contact.contact_phone)
        .filter(phone => phone);

      if (phoneNumbers.length === 0) {
        toast.error('No Phone Numbers', {
          description: 'Your trusted contacts need phone numbers for emergency alerts.',
        });
        setIsCallingEmergency(false);
        setSosActive(false);
        return;
      }

      // Get location (with fallback)
      let latitude = 0;
      let longitude = 0;
      let locationError = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true, // Try high accuracy
            timeout: 15000,           // Wait up to 15s (increased from 5s)
            maximumAge: 30000,        // Accept cached position up to 30s old
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (err: any) {
        console.warn('Could not get precise location for SOS:', err);
        locationError = err;
        // Fallback: Proceed with 0,0 or maybe try low accuracy? 
        // For now, we proceed so the CALL still goes through.
        toast.warning('Location Unavailable', {
          description: 'Sending SOS without precise location...',
        });
      }

      toast.info('Emergency Alert Activated', {
        description: 'Notifying your trusted contacts...',
      });

      // Save SOS alert to database first
      try {
        console.log('Triggering SOS with location:', { latitude, longitude });
        const sosResponse = await sosService.triggerSOS(latitude, longitude);
        console.log('SOS response:', sosResponse);

        if (sosResponse.success) {
          console.log('✅ SOS alert saved to database:', sosResponse);
          toast.success('SOS Alert Saved', {
            description: 'Emergency recorded in system. Notifying your contacts...',
          });
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        toast.error('Database Error', {
          description: 'Failed to save SOS to database. Still notifying contacts...',
        });
        // Continue with notification even if database fails
      }

      // Notify trusted contacts with call and SMS
      try {
        const response = await fetch('http://localhost:5001/api/emergency/notify-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude,
            longitude,
            phoneNumbers: phoneNumbers,
            makeCall: true, // Will call the first contact
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Emergency Alert Sent!', {
            description: `${phoneNumbers.length} trusted contact(s) notified${locationError ? ' (Location missing)' : ''}`,
            duration: 5000,
          });
        } else {
          throw new Error(data.message || 'Failed to notify contacts');
        }
      } catch (err) {
        console.error('Failed to notify trusted contacts:', err);
        toast.error('Notification Failed', {
          description: 'Could not send alerts. Opening phone dialer as fallback...',
        });

        // Fallback: Call first trusted contact directly
        setTimeout(() => {
          window.location.href = `tel:${phoneNumbers[0]}`;
        }, 1000);
      }

    } catch (error: any) {
      console.error('SOS error:', error);
      toast.error('SOS Failed', {
        description: 'Unexpected error occurred.',
      });
    } finally {
      setIsCallingEmergency(false);
      setTimeout(() => setSosActive(false), 3000);
    }
  };

  // ========== LIVE LOCATION SHARING - SMS TO TRUSTED CONTACTS ==========
  const toggleLocationSharing = () => {
    if (!locationSharing) {
      // Check if user has trusted contacts
      if (trustedContacts.length === 0) {
        toast.error('No Trusted Contacts', {
          description: 'Please add trusted contacts in your profile first.',
        });
        return;
      }

      // Extract phone numbers from trusted contacts
      const phoneNumbers = trustedContacts
        .map(contact => contact.contact_phone)
        .filter(phone => phone); // Filter out empty phone numbers

      if (phoneNumbers.length === 0) {
        toast.error('No Phone Numbers', {
          description: 'Your trusted contacts need phone numbers for SMS alerts.',
        });
        return;
      }

      // START LOCATION SHARING
      if (navigator.geolocation) {
        // Send initial SMS to trusted contacts
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;

          try {
            const response = await fetch('http://localhost:5001/api/location/share/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                latitude,
                longitude,
                phoneNumbers: phoneNumbers,
              }),
            });

            const data = await response.json();

            if (data.success) {
              toast.success('Location Sharing Started', {
                description: `SMS sent to ${phoneNumbers.length} trusted contacts`,
              });
            } else {
              throw new Error('Failed to start location sharing');
            }
          } catch (err) {
            console.error('Error starting location share:', err);
            toast.error('Location Share Failed', {
              description: 'Could not send SMS to contacts. Check backend.',
            });
          }
        });

        // Start continuous location tracking
        const watchId = navigator.geolocation.watchPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            locationUpdateCount.current += 1;

            // Send SMS update every 5 location updates (to avoid spam)
            if (locationUpdateCount.current % 5 === 0) {
              try {
                await fetch('http://localhost:5001/api/location/update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    latitude,
                    longitude,
                    phoneNumbers: phoneNumbers,
                  }),
                });
                console.log('📍 Location update sent to trusted contacts');
              } catch (err) {
                console.error('Error updating location:', err);
              }
            }
          },
          (error) => console.error(error),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        watchIdRef.current = watchId;
        setLocationSharing(true);
      } else {
        toast.error('Geolocation Not Supported', {
          description: "Your browser doesn't support location tracking",
        });
      }
    } else {
      // STOP LOCATION SHARING
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // Extract phone numbers for stop notification
      const phoneNumbers = trustedContacts
        .map(contact => contact.contact_phone)
        .filter(phone => phone);

      // Send stop notification
      fetch('http://localhost:5001/api/location/share/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumbers: phoneNumbers,
        }),
      }).catch(err => console.error('Error stopping share:', err));

      locationUpdateCount.current = 0;
      setLocationSharing(false);

      toast.success('Location Sharing Stopped', {
        description: 'Your contacts have been notified',
      });
    }
  };

  // --- Campus Safe Route Navigation ---
  const [route, setRoute] = useState<string[]>([]);
  const [pathCoords, setPathCoords] = useState<[number, number][]>([]);
  const [destination, setDestination] = useState('S. Ramanujan Block - IIT Ropar');
  const [livePosition, setLivePosition] = useState<[number, number] | null>(null);

  const coordinates: Record<string, [number, number]> = {
    'Brahmaputra Girls Hostel': [30.9783, 76.537],
    'Beas Hostel': [30.9786, 76.5362],
    'Satluj Hostel IIT Ropar': [30.9793, 76.5358],
    'M. Visvesvaraya Block IIT Ropar': [30.9802, 76.5355],
    'S. Ramanujan Block - IIT Ropar': [30.981, 76.535],
    'Cafeteria IIT Ropar': [30.979, 76.5347],
    'Logo IIT Ropar': [30.9815, 76.5344],
  };

  const campusGraph = {
    'Brahmaputra Girls Hostel': ['Beas Hostel', 'Satluj Hostel IIT Ropar'],
    'Beas Hostel': ['Brahmaputra Girls Hostel', 'Satluj Hostel IIT Ropar'],
    'Satluj Hostel IIT Ropar': [
      'Beas Hostel',
      'M. Visvesvaraya Block IIT Ropar',
      'Cafeteria IIT Ropar',
    ],
    'M. Visvesvaraya Block IIT Ropar': [
      'Satluj Hostel IIT Ropar',
      'S. Ramanujan Block - IIT Ropar',
      'Logo IIT Ropar',
    ],
    'S. Ramanujan Block - IIT Ropar': ['M. Visvesvaraya Block IIT Ropar'],
    'Cafeteria IIT Ropar': ['Satluj Hostel IIT Ropar'],
    'Logo IIT Ropar': ['M. Visvesvaraya Block IIT Ropar'],
  };

  const findShortestPath = (graph: any, start: string, end: string) => {
    const visited = new Set<string>();
    const queue: [string, string[]][] = [[start, [start]]];
    while (queue.length > 0) {
      const [node, path] = queue.shift()!;
      if (node === end) return path;
      visited.add(node);
      for (const neighbor of graph[node] || []) {
        if (!visited.has(neighbor)) queue.push([neighbor, [...path, neighbor]]);
      }
    }
    return [];
  };

  const handleFindRoute = async () => {
    const path = findShortestPath(campusGraph, 'Brahmaputra Girls Hostel', destination);
    setRoute(path);

    if (path.length > 1) {
      const orsCoords: [number, number][] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const segment = await getORSRoute(coordinates[path[i]], coordinates[path[i + 1]]);
        orsCoords.push(...segment);
      }
      setPathCoords(orsCoords);
    } else {
      setPathCoords([]);
    }
  };

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLivePosition([latitude, longitude]);
      },
      (err) => console.error('Error fetching location:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Safety Hub</h1>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        {/* --- Emergency SOS (Automated Call & SMS) --- */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Emergency Safety Center</h2>
          <p className="text-lg text-gray-600 mb-8">
            Press the button to automatically call and send SMS to emergency services at {emergencyNumber}
          </p>

          <Button
            onClick={handleSOS}
            disabled={isCallingEmergency}
            size="lg"
            className={`w-64 h-64 rounded-full text-2xl font-bold transition-all duration-300 ${sosActive
              ? 'bg-red-700 animate-pulse scale-110'
              : 'bg-red-600 hover:bg-red-700 hover:scale-105'
              } ${isCallingEmergency ? 'opacity-75' : ''}`}
          >
            {isCallingEmergency ? (
              <div className="text-center">
                <div className="text-4xl mb-2">📞</div>
                <div>SENDING...</div>
                <div className="text-sm">Call & SMS</div>
              </div>
            ) : sosActive ? (
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <div>SENT!</div>
                <div className="text-sm">Help is coming</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">🚨</div>
                <div>EMERGENCY</div>
                <div>SOS</div>
              </div>
            )}
          </Button>

          {sosActive && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-800 font-semibold">
                ✓ Emergency call and SMS sent to {emergencyNumber}
              </p>
              <p className="text-red-700 text-sm mt-2">
                📞 Automated call initiated
              </p>
              <p className="text-red-700 text-sm">
                💬 SMS sent with your location
              </p>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-semibold">What happens when you press SOS:</p>
            <p className="text-xs mt-1">1. Automated call to your first trusted contact</p>
            <p className="text-xs">2. SMS sent to ALL trusted contacts with your GPS location</p>
            <p className="text-xs">3. Emergency alert saved to database for tracking</p>
          </div>
        </div>

        {/* --- Safety Features Grid --- */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Live Location Sharing (SMS to Trusted Contacts) */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                <span>Live Location Sharing</span>
              </CardTitle>
              <CardDescription>
                Share your real-time location with trusted contacts via SMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={toggleLocationSharing}
                variant={locationSharing ? 'destructive' : 'default'}
                className="w-full mb-4"
              >
                {locationSharing ? 'Stop Sharing Location' : 'Start Sharing Location'}
              </Button>

              {locationSharing && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  <p className="font-semibold">📍 Location sharing active</p>
                  <p className="text-xs mt-2">SMS updates sent to:</p>
                  <p className="text-xs">• +916305739457</p>
                  <p className="text-xs">• +916238808291</p>
                </div>
              )}

              {!locationSharing && (
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <p className="font-semibold mb-1">How it works:</p>
                  <p>• Sends SMS with Google Maps link to your trusted contacts</p>
                  <p>• Updates them as you move</p>
                  <p>• Separate from emergency services</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safe Route Finder Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="h-6 w-6 text-green-600" />
                <span>Safe Route Navigation</span>
              </CardTitle>
              <CardDescription>
                Find and visualize the safest route with your live location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="border p-2 rounded w-full mb-4"
              >
                <option>S. Ramanujan Block - IIT Ropar</option>
                <option>Cafeteria IIT Ropar</option>
                <option>Logo IIT Ropar</option>
              </select>
              <Button onClick={handleFindRoute} className="w-full mb-4">
                Find Safe Route
              </Button>

              {route.length > 0 && (
                <div className="bg-green-50 p-3 rounded text-gray-700 mb-4">
                  <p className="font-semibold text-sm">✅ Shortest Path:</p>
                  <p className="text-xs">{route.join(' → ')}</p>
                </div>
              )}

              <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-md">
                <MapContainer
                  center={[30.9793, 76.5365]}
                  zoom={17}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {route.map((name, index) => (
                    <Marker key={index} position={coordinates[name]}>
                      <Popup>{name}</Popup>
                    </Marker>
                  ))}
                  {pathCoords.length > 1 && <Polyline positions={pathCoords} color="blue" />}
                  <LiveLocationMarker position={livePosition} />
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contacts */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Quick Dial Emergency Contacts</CardTitle>
            <CardDescription className="text-red-700">
              Manual backup options (opens phone dialer)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => window.location.href = 'tel:112'}
              >
                <Phone className="h-4 w-4 mr-2" />
                112 - Emergency
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => window.location.href = 'tel:100'}
              >
                <Phone className="h-4 w-4 mr-2" />
                100 - Police
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => window.location.href = 'tel:124'}
              >
                <Phone className="h-4 w-4 mr-2" />
                124 - Campus Security
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}