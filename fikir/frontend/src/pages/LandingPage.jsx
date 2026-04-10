import Hero from '../components/Hero.jsx';
import FeaturesShowcase from '../components/FeaturesShowcase.jsx';
import Testimonials from '../components/Testimonials.jsx';
import FAQ from '../components/FAQ.jsx';
import Footer from '../components/Footer.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <FeaturesShowcase />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}
