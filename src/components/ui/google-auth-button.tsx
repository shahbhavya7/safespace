import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '@/lib/api';

interface GoogleAuthButtonProps {
  onSuccess: (token: string, user: any) => void;
  mode?: 'login' | 'register';
}

export default function GoogleAuthButton({ onSuccess, mode = 'login' }: GoogleAuthButtonProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // Send Google credential to backend
      const response = await apiCall('oauth.php', {
        method: 'POST',
        requiresAuth: false,
        body: {
          credential: credentialResponse.credential
        }
      });

      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        toast({
          title: "✅ Success!",
          description: response.message,
        });

        // If new user needs profile setup, redirect to profile page
        if (response.needs_profile_setup) {
          toast({
            title: "👋 Welcome to SafeSpace!",
            description: "Let's set up your profile",
          });
          navigate('/profile');
        } else {
          // Existing user, call parent success handler
          onSuccess(response.token, response.user);
          //navigate('/'); // Ensure redirect to main page after login
        }
      } else {
        throw new Error(response.message || 'Google authentication failed');
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: "❌ Authentication Failed",
        description: error.message || 'Failed to authenticate with Google',
        variant: "destructive",
      });
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "❌ Google Login Failed",
      description: "Could not authenticate with Google. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        size="large"
        text={mode === 'login' ? 'signin_with' : 'signup_with'}
        shape="rectangular"
        theme="outline"
        width="100%"
      />
    </div>
  );
}
