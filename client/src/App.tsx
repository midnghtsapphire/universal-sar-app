import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NewOperation from "./pages/NewOperation";
import OperationDetail from "./pages/OperationDetail";
import Operations from "./pages/Operations";
import LiveMap from "./pages/LiveMap";
import Sightings from "./pages/Sightings";
import Teams from "./pages/Teams";
import Evidence from "./pages/Evidence";
import Analytics from "./pages/Analytics";
import SnowBridge from "./pages/SnowBridge";
import Docs from "./pages/Docs";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/operations/new"} component={NewOperation} />
      <Route path={"/operations/:id"} component={OperationDetail} />
      <Route path={"/operations"} component={Operations} />
      <Route path={"/map"} component={LiveMap} />
      <Route path={"/sightings"} component={Sightings} />
      <Route path={"/teams"} component={Teams} />
      <Route path={"/evidence"} component={Evidence} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/snow-bridge"} component={SnowBridge} />
      <Route path={"/docs"} component={Docs} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
