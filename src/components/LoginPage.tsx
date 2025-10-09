import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Moon, Sun } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import logo from 'figma:asset/d37108ff06015dcbcdb272cec41a1cfc0b3b3dfd.png';

type UserRole = 'Admin' | 'Reviewer' | 'QC';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function LoginPage({ onLogin, theme, onToggleTheme }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Reviewer');
  const [resetEmail, setResetEmail] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation
    if (email && password) {
      onLogin(selectedRole);
    }
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
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[#012F66] dark:text-white">
                Sign in as
              </Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger className="bg-white dark:bg-[#3a3a3a] border-[#D0D5DD] dark:border-[#4a4a4a] dark:text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reviewer">Reviewer</SelectItem>
                  <SelectItem value="QC">QC (Quality Control)</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#012F66] dark:text-white">
                  Password
                </Label>
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-[#0292DC] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a]">
                    <DialogHeader>
                      <DialogTitle className="text-[#012F66] dark:text-white">
                        Reset Password
                      </DialogTitle>
                      <DialogDescription className="text-[#80989A] dark:text-[#a0a0a0]">
                        Enter your email address and we'll send you a link to reset your password.
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
                          Check your email for instructions to reset your password.
                        </p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-[#D0D5DD] dark:bg-[#3a3a3a] dark:border-[#4a4a4a] dark:text-white dark:placeholder:text-[#80989A]"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0292DC] hover:bg-[#012F66] text-white"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}