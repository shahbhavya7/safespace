import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import SafetyHub from './pages/SafetyHub';
import WellnessHub from './pages/WellnessHub';
import Resources from './pages/Resources';
import SecurityDirectory from './pages/SecurityDirectory';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import SelfHelpGuides from './pages/self_help_guides';
import NotFound from './pages/NotFound';
import ChatbotAssistant from './components/ChatbotAssistant';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/safety" element={<SafetyHub />} />
          <Route path="/wellness" element={<WellnessHub />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/self_guidance" element={<SelfHelpGuides />} />
          <Route path="/security" element={<SecurityDirectory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* Chatbot Assistant - Available on all pages */}
        <ChatbotAssistant />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;