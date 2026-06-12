import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "@/context/app-context";
import { AuthContextProvider } from "@/context/auth-context";
import { ToastProvider } from "@/context/toast-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthContextProvider>
      <AppContextProvider>
        <ToastProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ToastProvider>
      </AppContextProvider>
    </AuthContextProvider>
  );
}
