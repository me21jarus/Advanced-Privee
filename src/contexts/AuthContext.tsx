import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("securechat_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem("securechat_user");
      }
    }
    setIsLoading(false);
  }, []);

  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(
        localStorage.getItem("securechat_users") || "[]",
      );
      const userExists = existingUsers.find((u: any) => u.email === email);

      if (userExists) {
        throw new Error("User with this email already exists");
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        createdAt: new Date().toISOString(),
      };

      // Save user data (in real app, this would be hashed)
      const userWithPassword = { ...newUser, password };
      existingUsers.push(userWithPassword);
      localStorage.setItem("securechat_users", JSON.stringify(existingUsers));

      // Set current session
      localStorage.setItem("securechat_user", JSON.stringify(newUser));
      setUser(newUser);

      return true;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const existingUsers = JSON.parse(
        localStorage.getItem("securechat_users") || "[]",
      );
      const foundUser = existingUsers.find(
        (u: any) => u.email === email && u.password === password,
      );

      if (!foundUser) {
        throw new Error("Invalid email or password");
      }

      // Remove password from user object for session
      const { password: _, ...userWithoutPassword } = foundUser;

      localStorage.setItem(
        "securechat_user",
        JSON.stringify(userWithoutPassword),
      );
      setUser(userWithoutPassword);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("securechat_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
