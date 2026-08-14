import { createContext, useContext } from "react";

export const SubscriptionsModalContext = createContext<{ open: () => void }>({ open: () => {} });

export const useSubscriptionsModal = () => useContext(SubscriptionsModalContext);
