import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Team, UserRole } from '../types';
import { HacksprintStore } from '../lib/store';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  team: Team | null;
  isLoading: boolean;
  loginAsOrganizer: (email?: string) => void;
  loginAsParticipant: (name: string) => void;
  quickDemoLogin: (asRole: UserRole) => void;
  logout: () => void;
  createTeam: (name: string, passCode: string) => Team;
  joinTeam: (passCode: string) => { success: boolean; error?: string };
  refreshTeam: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'hacksprint_auth_user';
const AUTH_TEAM_ID_KEY = 'hacksprint_auth_team_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted session
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      const storedTeamId = localStorage.getItem(AUTH_TEAM_ID_KEY);

      if (storedUser) {
        const parsed = JSON.parse(storedUser) as UserProfile;
        setUser(parsed);

        if (storedTeamId) {
          const t = HacksprintStore.getTeam(storedTeamId);
          if (t) setTeam(t);
        }
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen to store updates for team state
  useEffect(() => {
    const unsubscribe = HacksprintStore.subscribe(() => {
      if (team) {
        const fresh = HacksprintStore.getTeam(team.id);
        if (fresh) {
          setTeam(fresh);
        }
      }
    });
    return unsubscribe;
  }, [team?.id]);

  const loginAsOrganizer = (email = 'organizer@hacksprint.dev') => {
    const orgUser: UserProfile = {
      uid: 'org-admin-1',
      email,
      displayName: 'Hackathon Lead Organizer',
      role: 'organizer',
      createdAt: Date.now()
    };
    setUser(orgUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(orgUser));
  };

  const loginAsParticipant = (name: string) => {
    const participantUser: UserProfile = {
      uid: `user-${Date.now().toString(36)}`,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@hacksprint.dev`,
      displayName: name || 'Agent Hunter',
      role: 'participant',
      createdAt: Date.now()
    };
    setUser(participantUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(participantUser));
  };

  const quickDemoLogin = (asRole: UserRole) => {
    if (asRole === 'organizer') {
      loginAsOrganizer();
    } else {
      loginAsParticipant('CipherGhost');
      // Auto-assign to default team if available
      const teams = HacksprintStore.getTeams();
      if (teams.length > 0) {
        setTeam(teams[0]);
        localStorage.setItem(AUTH_TEAM_ID_KEY, teams[0].id);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setTeam(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TEAM_ID_KEY);
  };

  const createTeam = (name: string, passCode: string): Team => {
    if (!user) throw new Error('Must be logged in');
    const newTeam = HacksprintStore.createTeam(name, passCode, 'hunt-cyber-matrix', user.uid);
    setTeam(newTeam);
    localStorage.setItem(AUTH_TEAM_ID_KEY, newTeam.id);
    return newTeam;
  };

  const joinTeam = (passCode: string): { success: boolean; error?: string } => {
    if (!user) return { success: false, error: 'User not authenticated' };
    const joined = HacksprintStore.joinTeamByCode('hunt-cyber-matrix', passCode, user.uid);
    if (!joined) {
      return { success: false, error: 'Invalid Team Passcode. Check with your squad!' };
    }
    setTeam(joined);
    localStorage.setItem(AUTH_TEAM_ID_KEY, joined.id);
    return { success: true };
  };

  const refreshTeam = () => {
    if (team) {
      const refreshed = HacksprintStore.getTeam(team.id);
      if (refreshed) setTeam(refreshed);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        team,
        isLoading,
        loginAsOrganizer,
        loginAsParticipant,
        quickDemoLogin,
        logout,
        createTeam,
        joinTeam,
        refreshTeam,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
