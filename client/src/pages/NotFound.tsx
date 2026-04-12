import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
      <Music className="h-12 w-12 text-muted-foreground/40" />
      <h1 className="font-display text-3xl font-medium text-foreground">Page not found</h1>
      <p className="text-muted-foreground max-w-sm">The page you're looking for doesn't exist.</p>
      <Link href="/">
        <Button className="mt-2">Go Home</Button>
      </Link>
    </div>
  );
}
