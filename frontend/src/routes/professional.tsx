import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/professional")({
  component: () => (
    <div className="bg-gradient-to-b from-soft to-background">
      <Outlet />
    </div>
  ),
});
