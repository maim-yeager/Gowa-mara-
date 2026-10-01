import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  goBack: () => void;
  params: { [key: string]: string };
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const extractParams = (path: string): { [key: string]: string } => {
    const params: { [key: string]: string } = {};
    const parts = path.split('/').filter(Boolean);
    
    // /post/:postId or /p/:postId
    if ((parts[0] === 'post' || parts[0] === 'p') && parts[1]) {
      params.postId = parts[1];
    }
    // /profile/:username or /u/:username
    if ((parts[0] === 'profile' || parts[0] === 'u') && parts[1]) {
      params.username = parts[1];
    }
    // /chat/:chatId
    if (parts[0] === 'chat' && parts[1]) {
      params.chatId = parts[1];
    }
    // /admin/user/:userId
    if (parts[0] === 'admin' && parts[1] === 'user' && parts[2]) {
      params.userId = parts[2];
    }
    // /admin/post/:postId
    if (parts[0] === 'admin' && parts[1] === 'post' && parts[2]) {
      params.postId = parts[2];
    }

    return params;
  };

  const [params, setParams] = useState<{ [key: string]: string }>(() => extractParams(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);
      setParams(extractParams(path));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    setParams(extractParams(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/home');
    }
  }, [navigate]);

  return (
    <RouterContext.Provider value={{ currentPath, navigate, goBack, params }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
