import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Heart, ArrowLeft, Play, Pause } from 'lucide-react';
import { useState, useEffect } from 'react';
import { moodService } from '@/lib/services';
import { toast } from 'sonner';

export default function WellnessHub() {
  const [currentMood, setCurrentMood] = useState([5]);
  const [moodNote, setMoodNote] = useState('');
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('inhale');
  const [breathingCount, setBreathingCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const moodEmojis = {
    1: { emoji: '😢', label: 'Very Sad', color: 'text-red-500' },
    2: { emoji: '😟', label: 'Sad', color: 'text-orange-500' },
    3: { emoji: '😐', label: 'Okay', color: 'text-yellow-500' },
    4: { emoji: '🙂', label: 'Good', color: 'text-green-500' },
    5: { emoji: '😊', label: 'Great', color: 'text-blue-500' },
  };

  const getCurrentMoodData = () => {
    const mood = Math.round(currentMood[0]);
    return moodEmojis[mood as keyof typeof moodEmojis] || moodEmojis[5];
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathingCount(prev => {
          const newCount = prev + 1;
          if (newCount % 8 === 0) {
            setBreathingPhase(breathingPhase === 'inhale' ? 'exhale' : 'inhale');
          }
          return newCount;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase]);

  const toggleBreathing = () => {
    setBreathingActive(!breathingActive);
    if (!breathingActive) {
      setBreathingCount(0);
      setBreathingPhase('inhale');
    }
  };

  const saveMoodLog = async () => {
    setIsSaving(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Not Logged In', {
          description: 'Please log in to save your mood.',
        });
        setIsSaving(false);
        return;
      }

      const moodData = getCurrentMoodData();
      const moodLevel = Math.round(currentMood[0]);
      
      console.log('Saving mood:', { moodLevel, emoji: moodData.emoji, label: moodData.label, notes: moodNote });
      
      const response = await moodService.saveMoodLog(
        moodLevel,
        moodData.emoji,
        moodData.label,
        moodNote || undefined
      );

      console.log('Mood save response:', response);

      if (response.success) {
        toast.success('Mood Saved!', {
          description: `Your ${moodData.label} mood has been logged successfully.`,
        });
        setMoodNote('');
        setCurrentMood([5]); // Reset to default
      } else {
        throw new Error(response.message || 'Failed to save mood');
      }
    } catch (error: any) {
      console.error('Error saving mood:', error);
      toast.error('Error Saving Mood', {
        description: error.message || 'Please try again later. Make sure you are logged in.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SafeSpace</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Wellness Hub</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Wellness Matters</h2>
          <p className="text-lg text-gray-600">
            Take care of your mental health with our wellness tools and exercises
          </p>
        </div>

        {/* Mood Tracker */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-pink-600" />
              <span>Daily Mood Tracker</span>
            </CardTitle>
            <CardDescription>
              How are you feeling today? Track your mood and add notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className={`text-6xl mb-2 ${getCurrentMoodData().color}`}>
                {getCurrentMoodData().emoji}
              </div>
              <p className="text-xl font-semibold text-gray-700">
                {getCurrentMoodData().label}
              </p>
            </div>
            
            <div className="mb-6">
              <Slider
                value={currentMood}
                onValueChange={setCurrentMood}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>Very Sad</span>
                <span>Sad</span>
                <span>Okay</span>
                <span>Good</span>
                <span>Great</span>
              </div>
            </div>

            <Textarea
              placeholder="Add a note about your mood (optional)..."
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              className="mb-4"
            />

            <Button onClick={saveMoodLog} className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Mood Log'}
            </Button>
          </CardContent>
        </Card>

        {/* Breathing Exercise */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <span>Guided Breathing Exercise</span>
            </CardTitle>
            <CardDescription>
              4-4-4-4 breathing technique to reduce stress and anxiety
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className={`w-32 h-32 mx-auto rounded-full border-4 border-blue-500 flex items-center justify-center transition-all duration-500 ${
                breathingActive 
                  ? (breathingPhase === 'inhale' ? 'scale-110 bg-blue-100' : 'scale-90 bg-blue-50')
                  : 'bg-gray-50'
              }`}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {breathingActive ? (breathingPhase === 'inhale' ? 'Inhale' : 'Exhale') : 'Ready'}
                  </div>
                  {breathingActive && (
                    <div className="text-sm text-gray-600">
                      {Math.floor(breathingCount / 8) + 1} cycles
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <Button
                onClick={toggleBreathing}
                size="lg"
                className="w-full"
              >
                {breathingActive ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Stop Breathing Exercise
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Breathing Exercise
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-gray-600 text-center">
              <p className="mb-2">Follow the circle: Inhale as it grows, exhale as it shrinks</p>
              <p>Inhale for 4 seconds → Hold for 4 → Exhale for 4 → Hold for 4</p>
            </div>
          </CardContent>
        </Card>

        {/* Wellness Tools Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Mindfulness Sessions</CardTitle>
              <CardDescription>Short meditation practices for stress relief</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  🧘‍♀️ 5-Minute Mindfulness
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🌅 Morning Meditation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🌙 Evening Relaxation
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Positive Affirmations</CardTitle>
              <CardDescription>Daily reminders and coping strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  💪 Daily Affirmations
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🎯 Coping Strategies
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  📚 Study Stress Tips
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Sleep & Wellness</CardTitle>
              <CardDescription>Healthy routines for better rest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  😴 Sleep Tips
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🌙 Bedtime Routine
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  ⏰ Sleep Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Stress Management</CardTitle>
              <CardDescription>Tools for academic and social pressure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  📖 Exam Stress Relief
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  👥 Social Anxiety Help
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  ⚖️ Life Balance Tips
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Resources */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Need More Support?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/resources">
                <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                  📚 Browse Resources
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => window.open('tel:988')}
              >
                📞 Crisis Helpline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}