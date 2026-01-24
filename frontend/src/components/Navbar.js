import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Music, Moon, Sun, User, LogOut, Home, Library, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const { user, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRoleSwitch = async () => {
    const currentRole = user.role;
    const newRole = currentRole === 'artist' ? 'user' : 'artist';
    
    // Si on passe en mode artist et qu'on n'a pas encore de nom d'artiste
    if (newRole === 'artist' && !user.artist_name) {
      const artistName = prompt('Entrez votre nom d\'artiste:');
      if (!artistName) return;
      await switchRole(artistName);
    } else {
      // Sinon, switch direct sans demander
      await switchRole(newRole === 'artist' ? user.artist_name : null);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid="navbar-logo-link">
            <Music className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">Pandore</span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <Link to="/browse" data-testid="navbar-browse-link">
                  <Button variant="ghost" className="rounded-full" data-testid="browse-button">
                    <Home className="w-4 h-4 mr-2" />
                    Découvrir
                  </Button>
                </Link>
                
                <Link to="/library" data-testid="navbar-library-link">
                  <Button variant="ghost" className="rounded-full" data-testid="library-button">
                    <Library className="w-4 h-4 mr-2" />
                    Bibliothèque
                  </Button>
                </Link>

                <Link to="/playlists" data-testid="navbar-playlists-link">
                  <Button variant="ghost" className="rounded-full" data-testid="playlists-button">
                    <Music className="w-4 h-4 mr-2" />
                    Playlists
                  </Button>
                </Link>

                {user.role === 'artist' && (
                  <Link to="/artist-dashboard" data-testid="navbar-dashboard-link">
                    <Button variant="ghost" className="rounded-full" data-testid="artist-dashboard-button">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              data-testid="theme-toggle-button"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-1" data-testid="user-menu-trigger">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar>
                      <AvatarImage src={user.picture} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleRoleSwitch} data-testid="role-switch-button">
                    <User className="w-4 h-4 mr-2" />
                    <span className="flex-1">Mode {user.role === 'artist' ? 'Auditeur' : 'Artiste'}</span>
                    <Badge variant={user.role === 'artist' ? 'default' : 'secondary'}>
                      {user.role === 'artist' ? 'Artiste' : 'User'}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" data-testid="login-link">
                <Button className="rounded-full" data-testid="login-button">Connexion</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;