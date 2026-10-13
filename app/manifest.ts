import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ORBI",
    short_name: "ORBI",
    description: "Contador ORBI",
    start_url: "/",
    display: "standalone",
    background_color: "#08090b",
    theme_color: "#08090b",
    icons: [
      {
        src: "/icon.png",
        sizes: "536x535",
        type: "image/png",
      },
    ],
  };
}
