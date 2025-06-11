import ContactSection from "@/components/sections/contact-section";
import FeaturedProducts from "@/components/sections/featured-product";
import HeroSection from "@/components/sections/hero-sections";
import TestimonialSection from "@/components/sections/testimonial-card";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturedProducts />
      <TestimonialSection />
      <ContactSection />
    </div>
  );
}