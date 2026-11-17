import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { WhyChoose } from "@/components/WhyChoose";
import { Featured } from "@/components/Featured";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { getProducts } from "@/lib/api/products.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bikr — Purity in Every Drop · Modern Arabian Luxury Perfumes" },
      { name: "description", content: "Discover Bikr — modern Arabian luxury fragrances crafted on immaculate alcohol for a cleaner, more refined scent experience." },
      { property: "og:title", content: "Bikr — Purity in Every Drop" },
      { property: "og:description", content: "Modern Arabian luxury perfumes, crafted on immaculate alcohol." },
    ],
  }),
  loader: () => getProducts(),
  component: Index,
});

function Index() {
  const products = Route.useLoaderData();
  return (
    <main className="bg-background text-foreground">
      <Navbar />
      <Hero />
      <About />
      <WhyChoose />
      <Featured products={products} />
      <Testimonials />
      <Footer />
    </main>
  );
}
