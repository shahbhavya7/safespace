import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { authService, userService, moodService } from '@/lib/services';
import { Heart } from 'lucide-react';

export default function AuthExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await authService.register(email, password, firstName);
      if (result.success) {
        setMessage('Registration successful! Token saved.');
        setEmail('');
        setPassword('');
        setFirstName('');
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setMessage('Login successful! Token saved.');
        setEmail('');
        setPassword('');
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Example</CardTitle>
        <CardDescription>
          {isRegistering ? 'Create a new account' : 'Sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <Input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
          </Button>
        </form>

        <Button
          variant="link"
          className="w-full mt-4"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </Button>

        {message && (
          <div className={`mt-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MoodLogExample() {
  const [moodLevel, setMoodLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const moodEmojis = {
    1: { emoji: '😢', label: 'Very Sad' },
    2: { emoji: '😟', label: 'Sad' },
    3: { emoji: '😐', label: 'Okay' },
    4: { emoji: '🙂', label: 'Good' },
    5: { emoji: '😊', label: 'Great' },
  };

  const handleSaveMood = async () => {
    setLoading(true);
    setMessage('');

    try {
      const mood = moodEmojis[moodLevel as keyof typeof moodEmojis];
      const result = await moodService.saveMoodLog(moodLevel, mood.emoji, mood.label, notes);
      
      if (result.success) {
        setMessage('Mood saved successfully!');
        setNotes('');
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-pink-600" />
          <span>Save Mood to Database</span>
        </CardTitle>
        <CardDescription>Your mood will be saved to the backend database</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-6xl mb-2">
            {moodEmojis[moodLevel as keyof typeof moodEmojis].emoji}
          </div>
          <p className="text-lg font-semibold">
            {moodEmojis[moodLevel as keyof typeof moodEmojis].label}
          </p>
        </div>

        <input
          type="range"
          min="1"
          max="5"
          value={moodLevel}
          onChange={(e) => setMoodLevel(parseInt(e.target.value))}
          className="w-full"
        />

        <Textarea
          placeholder="Add notes about your mood..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Button onClick={handleSaveMood} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Mood'}
        </Button>

        {message && (
          <div className={`p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
