import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import heroImage from "../assets/hero.jpg";

function LandingPage() {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const servicesRes = await api.get("/services/");
        const barbersRes = await api.get("/barbers/");

        setServices(servicesRes.data);
        setBarbers(barbersRes.data);
      } catch (err) {
        setError("Failed to load shop information. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (error) return <div>{error}</div>;

  return (
    <div>
      {/* Hero Section */}
<section className="relative min-h-screen flex items-end pb-24 overflow-hidden">
  {/* ↑ CHANGED: added "relative" and "overflow-hidden", removed "pt-32 px-6" (moved px-6 down to inner div) */}

  {/* ← ADD THIS WHOLE BLOCK: the background image + gradient overlay */}
  <div className="absolute inset-0">
    <img
      src={heroImage}
      alt="Barbershop interior"
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
  </div>

  <div className="relative max-w-6xl mx-auto w-full px-6">
    {/* ↑ CHANGED: added "relative" and "px-6" here (since we removed px-6 from the section tag above) */}

    <p className="text-primary text-xs tracking-[0.35em] uppercase mb-5">
      Premium Cuts — Est. 2024
    </p>

    <h1
      style={{ fontFamily: "'Playfair Display', serif" }}
      className="text-6xl md:text-9xl font-semibold leading-[0.95] mb-8 max-w-3xl"
    >
      {/* ↑ FIXED: mb-70 → mb-8, max-w-1xl → max-w-3xl */}
      The Art of
      <br />
      <em className="not-italic font-normal">Precision.</em>
    </h1>

    <p className="text-muted-foreground text-lg max-w-sm mb-10 leading-relaxed">
      Where traditional craft meets modern style. Walk in looking good,
      walk out looking exceptional.
    </p>

    <div className="flex flex-wrap gap-4">
      <Link
        to="/booking"
        className="px-8 py-3.5 bg-primary text-primary-foreground text-sm tracking-[0.25em] uppercase hover:opacity-90 transition-opacity"
      >
        Book an Appointment
      </Link>

      <a
        href="#services"
        className="px-8 py-3.5 border border-border text-foreground text-sm tracking-[0.25em] uppercase hover:bg-card transition-colors"
      >
        Our Services
      </a>
    </div>
  </div>
</section>

{/* Services section: grid of cards, "What We Offer" label + heading pattern repeats across sections */}
<section id="services" className="max-w-6xl mx-auto px-6 py-24">
  <div className="mb-16">
    <p className="text-primary text-xs tracking-[0.3em] uppercase mb-3">What We Offer</p>
    <h2
      style={{ fontFamily: "'Playfair Display', serif" }}
      className="text-5xl font-semibold"
    >
      Services
    </h2>
  </div>

  {/* gap-px + bg-border creates thin hairline dividers between cards, since each card sits on the border color */}
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
    {services.map((service) => (
      <div key={service.id} className="bg-card border border-border p-8 hover:bg-secondary transition-colors">
        <div className="flex justify-between items-start mb-4">
          <h3
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-xl font-medium leading-tight max-w-[180px]"
          >
            {service.name}
          </h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed mb-5">
          {service.description}
        </p>
        <div className="flex items-center gap-4 text-sm">
          {service.available_for_adult &&(
            <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-primary font-medium">
              Adult: GHS {service.adult_price}
            </span>
          )}

          {service.available_for_child &&(
            <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-primary font-medium">
              Child: GHS {service.child_price}
            </span>
          )}
        </div>
      </div>
    ))}
  </div>

  <div className="mt-10 flex justify-end">
    <Link
      to="/booking"
      className="px-8 py-3.5 bg-primary text-primary-foreground text-sm tracking-[0.25em] uppercase hover:opacity-90 transition-opacity"
    >
      Book a Service
    </Link>
  </div>
</section>
    </div>
  );
}

export default LandingPage;