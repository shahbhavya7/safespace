import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield, BookOpen, ArrowLeft, ExternalLink } from 'lucide-react';

export default function SelfHelpGuides() {
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
            <h1 className="text-xl font-semibold text-gray-900">Self-Help Guides</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Self-Help Resources
          </h2>
          <p className="text-lg text-gray-600">
            Educational resources and practical tools for your wellbeing
          </p>
        </div>

        {/* Educational Resources */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Educational Resources
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mental Health Articles</CardTitle>
                <CardDescription>
                  Learn about common mental health topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Understanding Anxiety</h4>
                    <p className="text-sm text-gray-600">
                      Learn about anxiety symptoms, causes, and coping strategies
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Managing Academic Stress</h4>
                    <p className="text-sm text-gray-600">
                      Tips for handling exam pressure and academic demands
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-gray-900">
                      Building Healthy Relationships
                    </h4>
                    <p className="text-sm text-gray-600">
                      Navigate social connections and communication skills
                    </p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Sleep & Mental Health</h4>
                    <p className="text-sm text-gray-600">
                      The connection between sleep quality and emotional wellbeing
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Practical Guides</CardTitle>
                <CardDescription>
                  Tools and techniques you can use today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Recognizing Warning Signs</h4>
                    <p className="text-sm text-gray-600">
                      When to seek professional help - red flags to watch for
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Coping Strategies Toolkit</h4>
                    <p className="text-sm text-gray-600">
                      Practical techniques for managing difficult emotions
                    </p>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Mindfulness for Beginners</h4>
                    <p className="text-sm text-gray-600">
                      Simple meditation and mindfulness practices
                    </p>
                  </div>
                  <div className="border-l-4 border-teal-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Work-Life Balance</h4>
                    <p className="text-sm text-gray-600">
                      Balancing academics, social life, and personal time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommended Apps & Tools */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Recommended Apps & Tools
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Headspace</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </CardTitle>
                <CardDescription>Meditation and mindfulness app</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Guided meditations, sleep stories, and mindfulness exercises
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('https://www.headspace.com', '_blank')}
                >
                  Visit Headspace
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Calm</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </CardTitle>
                <CardDescription>Sleep and relaxation app</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Sleep stories, breathing exercises, and relaxation techniques
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('https://www.calm.com', '_blank')}
                >
                  Visit Calm
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>MindShift</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </CardTitle>
                <CardDescription>Anxiety management app</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  CBT-based tools for managing anxiety and stress
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('https://www.anxietycanada.com/apps/mindshift-cbt', '_blank')}
                >
                  Visit MindShift
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Common questions about mental health and seeking help
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Is counseling confidential?
                </h4>
                <p className="text-gray-600">
                  Yes, all counseling sessions are completely confidential. Information
                  is only shared in cases where there's immediate danger to yourself or others.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  How do I know if I need professional help?
                </h4>
                <p className="text-gray-600">
                  If you're experiencing persistent sadness, anxiety, difficulty sleeping,
                  changes in appetite, or thoughts of self-harm, it's important to reach out
                  for professional support.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  What's the difference between counseling and therapy?
                </h4>
                <p className="text-gray-600">
                  Counseling typically focuses on specific issues and shorter-term support,
                  while therapy may involve longer-term treatment for more complex conditions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Are mental health services free for students?
                </h4>
                <p className="text-gray-600">
                  Most campus counseling services are free for enrolled students. Some services
                  may have limited sessions, but crisis support is always available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact Card */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">In Crisis? Get Help Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => window.open('tel:911')}
              >
                911 - Emergency Services
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => window.open('tel:988')}
              >
                988 - Crisis Lifeline
              </Button>
            </div>
            <p className="text-sm text-red-700 mt-4 text-center">
              If you're having thoughts of suicide or self-harm, please reach out immediately.
              Help is available 24/7.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
