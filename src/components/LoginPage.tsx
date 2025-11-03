import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Moon, Sun, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import logo from 'figma:asset/d37108ff06015dcbcdb272cec41a1cfc0b3b3dfd.png';

interface LoginPageProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function LoginPage({ theme, onToggleTheme }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [pwd, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const { login, isLoading, loginError, clearLoginError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    
    if (!email || !pwd) {
      return;
    }

    await login(email, pwd);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetEmail) {
      // Simulate sending reset email
      setResetSent(true);
      setTimeout(() => {
        setResetDialogOpen(false);
        setResetSent(false);
        setResetEmail('');
      }, 3000);
    }
  };


  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg p-8 relative">
          {/* Theme Toggle */}
          {onToggleTheme && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="absolute top-4 right-4 text-[#80989A] hover:text-[#012F66] dark:text-[#80989A] dark:hover:text-white"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          )}
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="MedPro" className="h-12" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[#012F66] dark:text-white mb-2">Validation Portal</h1>
            <p className="text-[#80989A] dark:text-[#a0a0a0]">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {loginError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{loginError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#012F66] dark:text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[#D0D5DD] dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white dark:placeholder:text-[#80989A]"
              />
            </div>

            <div className="space-y-2">
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="pwd" className="text-[#012F66] dark:text-white">
                  Password
                </Label>
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-[#0292DC] hover:underline cursor-pointer"
                    >
                      Forgot pwd?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a]">
                    <DialogHeader>
                      <DialogTitle className="text-[#012F66] dark:text-white">
                        Reset Password
                      </DialogTitle>
                      <DialogDescription className="text-[#80989A] dark:text-[#a0a0a0]">
                        Enter your email address and we'll send you a link to reset your pwd.
                      </DialogDescription>
                    </DialogHeader>
                    {!resetSent ? (
                      <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email" className="text-[#012F66] dark:text-white">
                            Email Address
                          </Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="you@example.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            className="border-[#D0D5DD] dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white dark:placeholder:text-[#80989A]"
                          />
                        </div>
                        <div className="flex gap-3 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setResetDialogOpen(false);
                              setResetEmail('');
                            }}
                            className="border-[#D0D5DD] text-[#012F66] hover:bg-[#F9FAFB] dark:border-[#4a4a4a] dark:text-white dark:hover:bg-[#3a3a3a]"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-[#0292DC] hover:bg-[#012F66] text-white"
                          >
                            Send Reset Link
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="py-6 text-center">
                        <div className="w-12 h-12 bg-[#4ECDC4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-6 h-6 text-[#4ECDC4]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <p className="text-[#012F66] dark:text-white mb-2">
                          Reset link sent!
                        </p>
                        <p className="text-[#80989A] dark:text-[#a0a0a0]">
                          Check your email for instructions to reset your pwd.
                        </p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div> */}
              <Input
                id="pwd"
                type="password"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-[#D0D5DD] dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white dark:placeholder:text-[#80989A]"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0292DC] hover:bg-[#012F66] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}