import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Assessment from "@/pages/Assessment";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import Presets from "@/pages/Presets";
import Guided from "@/pages/Guided";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/assessment" component={Assessment} />
            <Route path="/presets" component={Presets} />
            <Route path="/guided" component={Guided} />
            <Route path="/about" component={About} />
            <Route path="/privacy" component={Privacy} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
