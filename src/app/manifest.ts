import type { MetadataRoute } from "next";
import { APP_VERSION } from "@/lib/appVersion";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Controle de faltas PRME HMS",
    short_name: "Faltas PRME",
    description: "Controle de faltas e reposicoes dos residentes do PRME HMS",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      {
        src: `/icon.png?v=${APP_VERSION}`,
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icon.png?v=${APP_VERSION}`,
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `/apple-icon.png?v=${APP_VERSION}`,
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}