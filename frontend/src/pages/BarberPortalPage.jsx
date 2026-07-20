import { useState, useEffect } from "react";
import { Scissors, LogOut, DollarSign, Calendar, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function BarberPortalPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState({ start_date: "", end_date: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);          
  const [cancellingId, setCancellingId] = useState(null);       
  const [cancelReason, setCancelReason] = useState("");  
  const [myCustomers, setMyCustomers] = useState([]);              
  const [customerSearch, setCustomerSearch] = useState("");        
  const [loadingCustomers, setLoadingCustomers] = useState(false); 
  const [showCustomers, setShowCustomers] = useState(false);  
  const [sortByVisits, setSortByVisits] = useState(false);  


  // Refetch stats whenever the date range changes. Bookings/services are
  // fetched separately since /bookings/ doesn't support date filtering yet
  // -> we're only date-filtering the stat cards, not the appointment list.
  useEffect(() => {
    async function fetchStats() {
      const params = {};
      if (dateRange.start_date) params.start_date = dateRange.start_date;
      if (dateRange.end_date) params.end_date = dateRange.end_date;

      const res = await api.get("/dashboard/my-stats", { params });
      setStats(res.data);
    }
    fetchStats();
  }, [dateRange]);

  // Bookings + services only need to load once, on first render.
  useEffect(() => {
    async function fetchData() {
      const [bookingsRes, servicesRes] = await Promise.all([
        api.get("/bookings/"),
        api.get("/services/"),
      ]);
      setBookings(bookingsRes.data);
      setServices(servicesRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  function handleExit() {
    logout();
    navigate("/");
  }

  // GET /bookings/ only gives us service_id, not the service's name — so
  // we look it up from the services list we fetched separately.
  function getServiceName(serviceId) {
    return services.find((s) => s.id === serviceId)?.name || "Unknown service";
  }

  async function updateBookingStatus(bookingId, status, reason = null) {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status,
        cancellation_reason: reason,
      });
      // Update just this one booking in place, rather than re-fetching
      // the whole list — faster, and avoids a loading flicker.
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status, cancellation_reason: reason } : b)));
      setCancellingId(null);
      setCancelReason("");
    } finally {
      setUpdatingId(null);
    }
  }

  async function fetchMyCustomers(search = "") {
    setLoadingCustomers(true);
    const res = await api.get("/dashboard/my-customers", {
      params: search ? { search } : {},
    });
    setMyCustomers(res.data.customers);
    setLoadingCustomers(false);
  }

  if (loading || !stats) {
    return <div className="min-h-screen bg-background pt-20 text-center text-muted-foreground">Loading...</div>;
  }

const statCards = [
    {
      label: "Total Bookings",
      value: stats.total_bookings,
      icon: Calendar,
      sub: `${stats.pending_count} pending · ${stats.completed_count} completed · ${stats.cancelled_count} cancelled`,
    },
    { label: "Total Revenue", value: `GHS ${stats.total_revenue}`, icon: DollarSign, sub: "From completed bookings" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Scissors size={16} className="text-primary" />
            <span style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-semibold tracking-wider">
              ESARPS
            </span>
          </div>
          <span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted tracking-widest uppercase">
            {stats.barber_name}
          </span>
        </div>
        <button onClick={handleExit} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut size={13} />
          Exit
        </button>
      </header>

      <main className="flex-1 px-6 py-8 max-w-4xl w-full mx-auto">
        {/* Date range toggle */}
        <div className="flex flex-wrap items-end gap-4 mb-8">
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">From</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">To</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          {(dateRange.start_date || dateRange.end_date) && (
            <button
              onClick={() => setDateRange({ start_date: "", end_date: "" })}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear (show all-time)
            </button>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-card border border-border p-6">
              <div className="flex items-start justify-between mb-5">
                <span className="text-xs text-muted-foreground tracking-[0.15em] uppercase">{stat.label}</span>
                <stat.icon size={14} className="text-primary shrink-0" />
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-semibold">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Appointments list */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-semibold">
            My Appointments
          </h2>
          <div className="flex gap-2">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs tracking-[0.1em] uppercase border transition-colors ${
                  statusFilter === status
                    ? "border-primary bg-card text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {bookings
            .filter((b) => statusFilter === "all" || b.status === statusFilter)
            .map((booking) => (
            <div key={booking.id} className="bg-card border border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium mb-1">{getServiceName(booking.service_id)}</div>
                  <div className="text-sm text-muted-foreground">
                    {booking.customer_name} — {booking.date} at {booking.time_slot}
                  </div>
                </div>
             <div className="text-right shrink-0 ml-4">
                  <span
                    className={`text-xs px-2 py-0.5 tracking-wider uppercase ${
                      booking.status === "completed"
                        ? "bg-primary/10 text-primary"
                        : booking.status === "cancelled"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {booking.status}
                  </span>
                  <div style={{ fontFamily: "'DM Mono', monospace" }} className="text-xs text-muted-foreground mt-1.5">
                    GHS {booking.price_charged}
                  </div>
                </div>
              </div>

              {/* Action buttons — only offer actions that make sense for
                  the current status. A completed/cancelled booking has
                  nothing left to do. */}
              {booking.status === "pending" && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-border">
                  <button
                    disabled={updatingId === booking.id}
                    onClick={() => updateBookingStatus(booking.id, "confirmed")}
                    className="text-xs tracking-[0.15em] uppercase text-primary hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setCancellingId(booking.id)}
                    className="text-xs tracking-[0.15em] uppercase text-red-400 hover:opacity-80 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {booking.status === "confirmed" && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-border">
                  <button
                    disabled={updatingId === booking.id}
                    onClick={() => updateBookingStatus(booking.id, "completed")}
                    className="text-xs tracking-[0.15em] uppercase text-primary hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => setCancellingId(booking.id)}
                    className="text-xs tracking-[0.15em] uppercase text-red-400 hover:opacity-80 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Cancel-reason input — only shows for the one booking
                  currently being cancelled, not all of them at once */}
              {cancellingId === booking.id && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Reason for cancellation..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={!cancelReason.trim() || updatingId === booking.id}
                      onClick={() => updateBookingStatus(booking.id, "cancelled", cancelReason)}
                      className="px-4 py-1.5 bg-red-500/10 text-red-400 text-xs tracking-[0.15em] uppercase hover:bg-red-500/20 transition-colors disabled:opacity-40"
                    >
                      Confirm Cancellation
                    </button>
                    <button
                      onClick={() => { setCancellingId(null); setCancelReason(""); }}
                      className="px-4 py-1.5 border border-border text-xs tracking-[0.15em] uppercase hover:bg-secondary"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {booking.status === "cancelled" && booking.cancellation_reason && (
                <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border text-xs text-red-400">
                  <XCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{booking.cancellation_reason}</span>
                </div>
              )}
            </div>
          ))}

          <div className="mt-12">
          <button
            onClick={() => {
              const next = !showCustomers;
              setShowCustomers(next);
              if (next && myCustomers.length === 0) {
                fetchMyCustomers();
              }
            }}
            className="text-sm text-primary tracking-[0.1em] uppercase hover:opacity-80 transition-opacity mb-6"
          >
            {showCustomers ? "Hide My Customers" : "View My Customers"}
          </button>

          {showCustomers && (
            <div>
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  fetchMyCustomers(e.target.value);
                }}
                className="w-full bg-card border border-border px-4 py-3 mb-6 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={() => setSortByVisits(!sortByVisits)}
                className={`text-xs tracking-[0.15em] uppercase mb-6 px-3 py-1.5 border transition-colors ${
                  sortByVisits ? "border-primary text-primary bg-card" : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                Sort by Most Visits {sortByVisits ? "✓" : ""}
              </button>

              {loadingCustomers ? (
                <p className="text-muted-foreground text-sm">Searching...</p>
              ) : (
                <div className="bg-card border border-border overflow-x-auto">
                  <div className="min-w-[520px]">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-border">
                      {["Name", "Phone", "Visits", "Total Spent"].map((h) => (
                        <div
                          key={h}
                          className={`text-xs tracking-[0.15em] uppercase text-muted-foreground ${
                            h === "Name" ? "col-span-5" : "col-span-2"
                          }`}
                        >
                          {h}
                        </div>
                      ))}
                    </div>
                    {[...myCustomers]
                      .sort((a, b) => (sortByVisits ? b.total_visits - a.total_visits : 0))
                      .map((c, i) => (
                      <div
                        key={c.phone}
                        className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${
                          i < myCustomers.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-sm font-medium truncate">{c.name}</span>
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {c.phone}
                        </div>
                        <div className="col-span-2 text-sm">{c.total_visits}</div>
                        <div className="col-span-2 text-sm text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                          GHS {c.total_spent}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        </div>
      </main>
    </div>
  );
}

export default BarberPortalPage;