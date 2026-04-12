import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import { ApiKeyProvider } from "@/components/ApiKeyModal";
import Home from "@/pages/Home";
import Assessment from "@/pages/Assessment";
import Journal from "@/pages/Journal";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiKeyProvider>
      <Router hook={useHashLocation}>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/assessment" component={Assessment} />
            <Route path="/journal" component={Journal} />
            <Route path="/about" component={About} />
            <Route path="/privacy" component={Privacy} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Router>
      </ApiKeyProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
