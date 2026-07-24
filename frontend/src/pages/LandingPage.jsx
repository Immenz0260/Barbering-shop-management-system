import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import heroImage from "../assets/hero.jpg";
import aboutImage from "../assets/logo.png";


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
<section className="relative min-h-screen flex items-end pt-28 pb-24 overflow-hidden">
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
      className="text-4xl sm:text-6xl md:text-9xl font-semibold leading-[0.95] mb-8 max-w-3xl"
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
      
      <Link
        to="/signup"
        className="px-8 py-3.5 border border-border text-foreground text-sm tracking-[0.25em] uppercase hover:bg-card transition-colors"
      >
        Create Account
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

{/* Barbers section: photo cards for each team member */}
<section className="max-w-6xl mx-auto px-6 py-24">
  <div className="mb-16">
    <p className="text-primary text-xs tracking-[0.3em] uppercase mb-3">The Team</p>
    <h2
      style ={{ fontFamily: "'Playfair Display', serif" }}
      className="text-5xl font-semibold"
    >
      Our Barbers
    </h2>
  </div>

  <div className="grid md:grid-cols-3 gap-8">
    {barbers.map((barber)=>(
      <div key={barber.id} className="bg-card border border-border p-8">
        <h3
          style={{ fontFamily: "'Playfair Display', serif"}}
          className="text-xl font-medium mb-2"
      >
        {barber.barber_name}
      </h3>
      <p className="text-primary text-sm mb-3">{barber.specialty}</p>
      <p className="text-muted-foreground text-sm leading-relaxed">{barber.bio}</p>
    </div>
    ))}
  </div>
</section>

{/* About section: two-column story + image, with a small stat "badge" overlapping the image */}
<section className="bg-card border-y border-border">
  <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
    <div>
      <p className="text-primary text-xs tracking-[0.3em] uppercase mb-4">Our Story</p>
      <h2
        style={{ fontFamily: "'Playfair Display', serif" }}
        className="text-4xl md:text-5xl font-semibold mb-7 leading-tight"
      >
        Barbering as a
        <br />
        <em className="not-italic font-normal">calling, not a trade.</em>
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4 text-sm">
        ESARPS Premium Cuts was founded on the belief that every client deserves precision,
        care, and a genuine craft experience — not just a quick trim.
      </p>
      <p className="text-muted-foreground leading-relaxed mb-10 text-sm">
        Our barbers combine traditional technique with modern style, treating every
        appointment as a consultation, not just a cut.
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-px bg-primary" />
        <span className="text-sm text-muted-foreground italic">
          Walk-ins welcome, appointments preferred
        </span>
      </div>
    </div>

    <div className="relative">
      <div className="bg-muted h-[420px] overflow-hidden">
        <img src={aboutImage} alt="Barbershop" className="w-full h-full object-cover" />
      </div>
    </div>
  </div>
</section>

{/* Hours/Location + CTA card: two columns, informational left, action-driven right */}
<section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16">
  <div>
    <p className="text-primary text-xs tracking-[0.3em] uppercase mb-4">Find Us</p>
    <h2
      style={{ fontFamily: "'Playfair Display', serif" }}
      className="text-3xl font-semibold mb-10"
    >
      Location &amp; Hours
    </h2>

    <div className="space-y-5 mb-10">
      <div>
        <div className="font-medium text-sm">Sunyani, Ghana</div>
        <div className="text-muted-foreground text-sm">Your shop's street address here</div>
      </div>
      <div>
        <div className="font-medium text-sm">Your Phone Number</div>
        <div className="text-muted-foreground text-sm">Call or text to confirm on:</div>
        <div className="text-muted-foreground text-sm">0596451537 / 0206451524</div>
      </div>
    </div>

    <div className="border-t border-border">
      {[
        { day: "Monday – Friday", hours: "9:00 AM – 7:00 PM" },
        { day: "Saturday", hours: "Closed" },
        { day: "Sunday", hours: "8:00 AM – 6:00 PM" },
      ].map((h) => (
        <div key={h.day} className="flex justify-between py-3.5 border-b border-border text-sm">
          <span className="text-muted-foreground">{h.day}</span>
          <span style={{ fontFamily: "'DM Mono', monospace" }}>{h.hours}</span>
        </div>
      ))}
    </div>
  </div>

  <div className="flex flex-col justify-center">
    <div className="bg-card border border-border p-10 text-center">
      <h3
        style={{ fontFamily: "'Playfair Display', serif" }}
        className="text-2xl font-semibold mb-3"
      >
        Ready for a fresh cut?
      </h3>
      <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
        Book your appointment online and skip the wait.
      </p>
      <Link
        to="/booking"
        className="block w-full py-4 bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase hover:opacity-90 transition-opacity"
      >
        Book Now
      </Link>
    </div>
  </div>
</section>

{/* Footer: logo, copyright, quick link */}
<footer className="border-t border-border bg-card">
  <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
    <span
      style={{ fontFamily: "'Playfair Display', serif" }}
      className="text-lg font-semibold tracking-wider"
    >
      ESARPS PREMIUM CUTS
    </span>
    <p className="text-muted-foreground text-xs">© 2026 ESARPS Premium Cuts. All rights reserved.</p>
    <Link
      to="/login"
      className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-[0.2em] uppercase"
    >
      Owner Login
    </Link>
  </div>
</footer>

    </div>
  );
}

export default LandingPage;