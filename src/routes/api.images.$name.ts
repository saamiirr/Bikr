import { createFileRoute } from "@tanstack/react-router";

// Serves photos uploaded from the admin dashboard (stored in data/uploads).
export const Route = createFileRoute("/api/images/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { readImage } = await import("@/lib/store.server");
        const image = await readImage(params.name);
        if (!image) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(image.data), {
          headers: {
            "content-type": image.type,
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
