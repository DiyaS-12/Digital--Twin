import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Index from "./pages/Index";
import SiteManagement from "./pages/SiteManagement";
import Auth from "./pages/Auth";
import Viewer from "./pages/Viewer";
import ModelsLibrary from "./pages/ModelsLibrary";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import SensorDataPage from "./pages/SensorData";
import Monitoring from "./pages/Monitoring";
import Analytics from "./pages/Analytics";
import AlertRules from "./pages/Alerts";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/sites" element={<ProtectedRoute><SiteManagement /></ProtectedRoute>} />
          <Route path="/viewer/:siteId" element={<ProtectedRoute><Viewer /></ProtectedRoute>} />
          <Route path="/models-library" element={<ProtectedRoute><ModelsLibrary /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/alerts" element={<AlertRules/>}/>
          <Route path="/settings" element={<Settings />}/>
          <Route path="/sensors" element={<SensorDataPage/>}/> 
          <Route path="/monitoring" element={<Monitoring/>}/>
          <Route path="analytics" element={<Analytics/>}/>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
