import { createFileRoute } from "@tanstack/react-router";
import { LabApp } from "@/lab/App";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <LabApp />;
}
