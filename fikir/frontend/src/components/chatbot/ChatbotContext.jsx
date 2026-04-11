import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ChatbotPageContext = createContext(null);

export function ChatbotProvider({ children }) {
  const [pageContext, setPageContextState] = useState({});

  const setPageContext = useCallback((next) => {
    setPageContextState(next && typeof next === 'object' ? next : {});
  }, []);

  const value = useMemo(() => ({ pageContext, setPageContext }), [pageContext, setPageContext]);

  return <ChatbotPageContext.Provider value={value}>{children}</ChatbotPageContext.Provider>;
}

export function useChatbotPageContext() {
  const ctx = useContext(ChatbotPageContext);
  if (!ctx) {
    throw new Error('useChatbotPageContext must be used within ChatbotProvider');
  }
  return ctx;
}
