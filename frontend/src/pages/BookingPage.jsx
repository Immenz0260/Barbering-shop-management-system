import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const TIME_SLOTS = [                                                    
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",                        
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",     
];

function BookingPage() {
  // step controls which of the 3 screens is showing — same pattern as
  // the Figma reference (step === 1, 2, 3)
  const [step, setStep] = useState(1);

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState(null);
  const [customerType, setCustomerType] = useState(null);
  const [barberChoice, setBarberChoice] = useState(null);  
  const [date, setDate] = useState("");                    
  const [timeSlot, setTimeSlot] = useState("");  

   const { isAuthenticated } = useAuth();                          
  const navigate = useNavigate();                                 
  const [submitting, setSubmitting] = useState(false);            
  const [submitError, setSubmitError] = useState(null);           
  const [confirmedBooking, setConfirmedBooking] = useState(null); 

  // Fetch real data once, when the page first loads. Promise.all runs
  // both requests at the same time instead of one after another, so we
  // don't wait twice as long for no reason.
  useEffect(() => {
    async function fetchData() {
      const [servicesRes, barbersRes] = await Promise.all([
        api.get("/services/"),
        api.get("/barbers/"),
      ]);
      setServices(servicesRes.data);
      setBarbers(barbersRes.data);
      setLoading(false);
    }
    fetchData();
  }, []); // empty [] means "run once, right after the page loads"


   // If we land back here after a login redirect and there's a saved
  // draft, restore it and finish submitting automatically — the customer
  // already clicked "Confirm" once, no need to make them redo the form.
  useEffect(() => {                                                       
    if (!isAuthenticated || loading) return;

    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;

    const draft = JSON.parse(saved);
    localStorage.removeItem(DRAFT_KEY);

    setSelectedService(draft.selectedService);
    setBarberChoice(draft.barberChoice);
    setCustomerType(draft.customerType);
    setDate(draft.date);
    setTimeSlot(draft.timeSlot);
    setStep(3);

    submitBooking(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading])

  const canStep2 = !!selectedService && !!customerType;
  const canStep3 = !!barberChoice && !!date && !!timeSlot;

   // Key used to temporarily stash the booking in localStorage while the
  // customer goes off to log in — so we can finish submitting it
  // automatically once they're back, instead of making them redo the form.
  const DRAFT_KEY = "pendingBooking";                                    

  async function submitBooking(values) {                                 
    setSubmitError(null);
    setSubmitting(true);
    try {
      // "Any Available" isn't something the backend understands — it
      // needs a real barber_id. So when the customer picked "any", we
      // resolve it to an actual barber right before sending the request.
      const resolvedBarberId =
        values.barberChoice === "any"
          ? barbers[Math.floor(Math.random() * barbers.length)]?.id
          : values.barberChoice;

      const res = await api.post("/bookings/", {
        barber_id: resolvedBarberId,
        service_id: values.selectedService.id,
        customer_type: values.customerType,
        date: values.date,
        time_slot: values.timeSlot,
      });

      setConfirmedBooking(res.data);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirmClick() {                                        
    const values = { selectedService, barberChoice, customerType, date, timeSlot };

    if (!isAuthenticated) {
      // Not logged in — save the form as-is, send them to log in, and
      // the useEffect below will pick this back up once they return.
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      navigate("/login?redirect=/booking");
      return;
    }

    submitBooking(values);
  }

  if (loading) {
    return <div className="min-h-screen bg-background pt-20 text-center text-muted-foreground">Loading...</div>;
  }

  // NEW: once a booking is confirmed, show this instead of the stepped   {/* ← NEW block */}
  // form entirely — same pattern as the Figma reference's `if (confirmed)`
  if (confirmedBooking) {
    const barber = barbers.find((b) => b.id === confirmedBooking.barber_id);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-8">
            <span className="text-primary-foreground text-2xl">✓</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-5xl font-semibold mb-4">
            Confirmed.
          </h2>
          <p className="text-muted-foreground mb-8 text-sm">Your appointment has been booked successfully.</p>
          <div className="bg-card border border-border p-7 mb-8 text-left space-y-3.5">
            {[
              { label: "Service", value: selectedService?.name },
              { label: "Barber", value: barber?.barber_name || "Assigned barber" },
              { label: "Date", value: confirmedBooking.date },
              { label: "Time", value: confirmedBooking.time_slot },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3.5 flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }} className="font-medium text-primary">
                GHS {confirmedBooking.price_charged}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3.5 bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase hover:opacity-90 transition-opacity"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <p className="text-primary text-xs tracking-[0.3em] uppercase mb-3">ESARPS Premium Cuts</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-4xl md:text-5xl font-semibold">
            Book an Appointment
          </h1>
        </div>
      </div>

      {/* Step indicator */}
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 py-4 flex gap-8">
          {["Service", "Schedule", "Confirm"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 flex items-center justify-center text-xs font-medium transition-colors ${
                  step >= i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-semibold mb-8">
              Choose a Service
            </h2>
            <div className="space-y-2.5">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    // reset customer type if it no longer applies to the
                    // newly picked service (e.g. switching off a child-only service)
                    if (
                      (customerType === "adult" && !service.available_for_adult) ||
                      (customerType === "child" && !service.available_for_child)
                    ) {
                      setCustomerType(null);
                    }
                  }}
                  className={`w-full text-left p-6 border transition-all ${
                    selectedService?.id === service.id ? "border-primary bg-card" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <div className="font-medium mb-1.5">{service.name}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">{service.description}</div>
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace" }} className="text-primary font-medium text-sm text-right shrink-0">
                      {service.available_for_adult && <div>Adult: GHS {service.adult_price}</div>}
                      {service.available_for_child && <div>Child: GHS {service.child_price}</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedService && (
              <div className="mt-8">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Customer Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedService.available_for_adult && (
                    <button
                      onClick={() => setCustomerType("adult")}
                      className={`py-3.5 text-sm border transition-all ${
                        customerType === "adult" ? "border-primary bg-card" : "border-border hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      Adult — GHS {selectedService.adult_price}
                    </button>
                  )}
                  {selectedService.available_for_child && (
                    <button
                      onClick={() => setCustomerType("child")}
                      className={`py-3.5 text-sm border transition-all ${
                        customerType === "child" ? "border-primary bg-card" : "border-border hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      Child — GHS {selectedService.child_price}
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => canStep2 && setStep(2)}
              className={`w-full mt-8 py-4 text-xs tracking-[0.25em] uppercase transition-opacity ${
                canStep2 ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-semibold mb-8">
              Choose Your Barber & Time
            </h2>

            <div className="mb-9">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Select Barber</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setBarberChoice("any")}
                  className={`p-5 border text-center transition-all ${
                    barberChoice === "any" ? "border-primary bg-card" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="text-sm font-medium">Any Available</div>
                  <div className="text-xs text-muted-foreground mt-0.5">No preference</div>
                </button>
                {barbers.filter((b) => b.is_active).map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => setBarberChoice(barber.id)}
                    className={`p-5 border text-center transition-all ${
                      barberChoice === barber.id ? "border-primary bg-card" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-sm font-medium">{barber.barber_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{barber.specialty}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-9">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Select Date</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-card border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="mb-9">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Select Time</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    onClick={() => setTimeSlot(time)}
                    style={{ fontFamily: "'DM Mono', monospace" }}
                    className={`py-2.5 text-xs border transition-all ${
                      timeSlot === time ? "border-primary bg-card text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 border border-border text-xs tracking-[0.2em] uppercase hover:bg-card transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => canStep3 && setStep(3)}
                className={`flex-1 py-4 text-xs tracking-[0.25em] uppercase transition-opacity ${
                  canStep3 ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-semibold mb-8">
              Review & Confirm
            </h2>

            <div className="bg-card border border-border p-6 mb-8 space-y-3">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Booking Summary</p>
              {[
                {
                  label: "Service",
                  value: `${selectedService?.name} — GHS ${
                    customerType === "adult" ? selectedService?.adult_price : selectedService?.child_price
                  }`,
                },
                {
                  label: "Barber",
                  value:
                    barberChoice === "any"
                      ? "Any Available"
                      : barbers.find((b) => b.id === barberChoice)?.barber_name,
                },
                { label: "Customer Type", value: customerType },
                { label: "Date & Time", value: `${date} at ${timeSlot}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground mb-6">
                You'll be asked to log in to confirm — your booking details will be saved.
              </p>
            )}

            {submitError && <p className="text-sm text-red-400 mb-6">{submitError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 border border-border text-xs tracking-[0.2em] uppercase hover:bg-card transition-colors"
              >
                Back
              </button>
              <button
                disabled={submitting}
                onClick={handleConfirmClick}
                className="flex-1 py-4 bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Booking..." : isAuthenticated ? "Confirm Booking" : "Log In & Confirm"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default BookingPage;