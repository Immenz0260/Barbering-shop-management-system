import { useState, useEffect } from "react";
import { Scissors, LogOut, Users, DollarSign, Calendar, TrendingUp, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
];

function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);

  const [walkInForm, setWalkInForm] = useState({
    customer_name: "",
    customer_phone: "",
    service_id: "",
    barber_id: "",
    customer_type: "adult",
    date: new Date().toISOString().split("T")[0],
    time_slot: "",
  });
  const [walkInSuccess, setWalkInSuccess] = useState(false);
  const [walkInError, setWalkInError] = useState(null);
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);
  const [customers, setCustomers] = useState([]);          
  const [customerSearch, setCustomerSearch] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false); 
  const [allBarbers, setAllBarbers] = useState([]);               
  const [barberForm, setBarberForm] = useState({                  
    full_name: "",
    email: "",
    password: "",
    phone: "",
    specialty: "",
    bio: "",
  });
  const [barberFormError, setBarberFormError] = useState(null);   
  const [barberFormSuccess, setBarberFormSuccess] = useState(false);
  const [submittingBarber, setSubmittingBarber] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState(null);   
  const [editForm, setEditForm] = useState({});                    
  const [editError, setEditError] = useState(null);                
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [allServices, setAllServices] = useState([]);              
  const [serviceForm, setServiceForm] = useState({                 
    name: "", adult_price: "", child_price: "", duration_minutes: "",
    description: "", available_for_adult: true, available_for_child: true,
  });
  const [serviceFormError, setServiceFormError] = useState(null);  
  const [serviceFormSuccess, setServiceFormSuccess] = useState(false); 
  const [submittingService, setSubmittingService] = useState(false); 
  const [editingServiceId, setEditingServiceId] = useState(null);   
  const [serviceEditForm, setServiceEditForm] = useState({});       
  const [submittingServiceEdit, setSubmittingServiceEdit] = useState(false); 

  // Fetch summary stats + services + barbers together when the page loads.
  useEffect(() => {
    async function fetchData() {
      const [summaryRes, servicesRes, barbersRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/services/"),
        api.get("/barbers/"),
      ]);
      setSummary(summaryRes.data);
      setServices(servicesRes.data);
      setBarbers(barbersRes.data.filter((b) => b.is_active));
      setLoading(false);
    }
    fetchData();
  }, []);

  function handleExit() {
    logout();
    navigate("/");
  }

  async function handleWalkInSubmit(e) {
    e.preventDefault();
    setWalkInError(null);
    setSubmittingWalkIn(true);
    try {
      await api.post("/bookings/walk-in", {
        barber_id: Number(walkInForm.barber_id),
        service_id: Number(walkInForm.service_id),
        customer_name: walkInForm.customer_name,
        customer_phone: walkInForm.customer_phone,
        customer_type: walkInForm.customer_type,
        date: walkInForm.date,
        time_slot: walkInForm.time_slot,
      });
      setWalkInForm({
        customer_name: "",
        customer_phone: "",
        service_id: "",
        barber_id: "",
        customer_type: "adult",
        date: new Date().toISOString().split("T")[0],
        time_slot: "",
      });
      setWalkInSuccess(true);
      setTimeout(() => setWalkInSuccess(false), 3000);
    } catch (err) {
      setWalkInError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setSubmittingWalkIn(false);
    }
  }

async function fetchCustomers(search = "") {
    setLoadingCustomers(true);
    const res = await api.get("/dashboard/customers-list", {
      params: search ? { search } : {},
    });
    setCustomers(res.data.customers);
    setLoadingCustomers(false);
  }

  async function fetchAllBarbers() {
    const res = await api.get("/barbers/all");
    setAllBarbers(res.data);
  }

  async function handleCreateBarber(e) {
    e.preventDefault();
    setBarberFormError(null);
    setSubmittingBarber(true);
    try {
      await api.post("/users/staff/create-barber", barberForm);
      setBarberForm({ full_name: "", email: "", password: "", phone: "", specialty: "", bio: "" });
      setBarberFormSuccess(true);
      setTimeout(() => setBarberFormSuccess(false), 3000);
      fetchAllBarbers(); // refresh the list to show the new barber immediately
    } catch (err) {
      setBarberFormError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setSubmittingBarber(false);
    }
  }

  async function handleToggleActive(barberId) {
    await api.patch(`/barbers/${barberId}/toggle-active`);
    fetchAllBarbers(); // refresh so the toggled state shows immediately
  }

  function startEditing(barber) {
    setEditingBarberId(barber.id);
    setEditError(null);
    setEditForm({
      full_name: barber.barber_name,
      phone: barber.phone || "",
      specialty: barber.specialty || "",
      bio: barber.bio || "",
    });
  }

  async function handleUpdateBarber(e, barberId) {
    e.preventDefault();
    setEditError(null);
    setSubmittingEdit(true);
    try {
      await api.patch(`/barbers/${barberId}`, editForm);
      setEditingBarberId(null);
      fetchAllBarbers(); // refresh so the card shows the saved changes
    } catch (err) {
      setEditError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setSubmittingEdit(false);
    }
  }

  async function fetchAllServices() {
    const res = await api.get("/services/all");
    setAllServices(res.data);
  }

  async function handleCreateService(e) {
    e.preventDefault();
    setServiceFormError(null);
    setSubmittingService(true);
    try {
      await api.post("/services/", {
        ...serviceForm,
        adult_price: Number(serviceForm.adult_price),
        child_price: Number(serviceForm.child_price),
        duration_minutes: Number(serviceForm.duration_minutes),
      });
      setServiceForm({
        name: "", adult_price: "", child_price: "", duration_minutes: "",
        description: "", available_for_adult: true, available_for_child: true,
      });
      setServiceFormSuccess(true);
      setTimeout(() => setServiceFormSuccess(false), 3000);
      fetchAllServices();
    } catch (err) {
      setServiceFormError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setSubmittingService(false);
    }
  }

  function startEditingService(service) {
    setEditingServiceId(service.id);
    setServiceEditForm({
      name: service.name,
      adult_price: service.adult_price,
      child_price: service.child_price,
      duration_minutes: service.duration_minutes,
      description: service.description || "",
      available_for_adult: service.available_for_adult,
      available_for_child: service.available_for_child,
    });
  }

  async function handleUpdateService(e, serviceId) {
    e.preventDefault();
    setSubmittingServiceEdit(true);
    try {
      await api.patch(`/services/${serviceId}`, {
        ...serviceEditForm,
        adult_price: Number(serviceEditForm.adult_price),
        child_price: Number(serviceEditForm.child_price),
        duration_minutes: Number(serviceEditForm.duration_minutes),
      });
      setEditingServiceId(null);
      fetchAllServices();
    } finally {
      setSubmittingServiceEdit(false);
    }
  }

  async function handleToggleServiceActive(serviceId) {
    await api.patch(`/services/${serviceId}/toggle-active`);
    fetchAllServices();
  }


  if (loading) {
    return <div className="min-h-screen bg-background pt-20 text-center text-muted-foreground">Loading...</div>;
  }

  const stats = [
    { label: "Total Bookings", value: summary.total_bookings, icon: Calendar, sub: `${summary.pending_count} pending` },
    { label: "Total Revenue", value: `GHS ${summary.total_revenue}`, icon: DollarSign, sub: "From completed bookings" },
    { label: "Completed", value: summary.completed_count, icon: TrendingUp, sub: `${summary.cancelled_count} cancelled` },
    { label: "Online vs Walk-In", value: `${summary.online_count} / ${summary.walk_in_count}`, icon: Users, sub: "Online / Walk-in" },
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
            Owner Dashboard
          </span>
        </div>
        <button onClick={handleExit} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut size={13} />
          Exit
        </button>
      </header>

      <div className="border-b border-border bg-card px-6 flex gap-0 shrink-0 overflow-x-aut">
        {[
          ["overview", "Overview"],
          ["walkin", "Walk-In Entry"],
          ["clients", "All Clients"],
          ["barbers", "Barbers"],
          ["services", "Services"],
        ].map(([tab, label]) => (
           <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "clients" && customers.length === 0) {
                fetchCustomers();
              }

              if (tab === "barbers" && allBarbers.length === 0) {  
                fetchAllBarbers();                                   
              }

              if (tab === "services" && allServices.length === 0) {  
                fetchAllServices();                                    
              }  
            }}
            className={`px-5 py-4 text-xs tracking-[0.15em] uppercase border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-card border border-border p-6">
                  <div className="flex items-start justify-between mb-5">
                    <span className="text-xs text-muted-foreground tracking-[0.15em] uppercase leading-tight max-w-[100px]">
                      {stat.label}
                    </span>
                    <stat.icon size={14} className="text-primary shrink-0" />
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-semibold mb-1.5">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}


        {activeTab === "walkin" && (
          <div className="max-w-lg">
            <div className="mb-10">
              <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-4xl font-semibold mb-3">
                Walk-In Entry
              </h2>
              <p className="text-muted-foreground text-sm">Record a walk-in client and add them to today's list.</p>
            </div>

            {walkInSuccess && (
              <div className="bg-primary/10 border border-primary/30 px-5 py-4 mb-7 flex items-center gap-2.5 text-sm">
                <Check size={15} className="text-primary shrink-0" />
                <span>Client added successfully.</span>
              </div>
            )}

            {walkInError && <p className="text-sm text-red-400 mb-6">{walkInError}</p>}

            <form onSubmit={handleWalkInSubmit} className="bg-card border border-border p-8 space-y-6">
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Smith"
                  value={walkInForm.customer_name}
                  onChange={(e) => setWalkInForm({ ...walkInForm, customer_name: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="024 123 4567"
                  value={walkInForm.customer_phone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, customer_phone: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Service</label>
                <select
                  required
                  value={walkInForm.service_id}
                  onChange={(e) => setWalkInForm({ ...walkInForm, service_id: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select a service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Customer Type</label>
                <select
                  value={walkInForm.customer_type}
                  onChange={(e) => setWalkInForm({ ...walkInForm, customer_type: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="adult">Adult</option>
                  <option value="child">Child</option>
                </select>
              </div>

              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Assigned Barber</label>
                <select
                  required
                  value={walkInForm.barber_id}
                  onChange={(e) => setWalkInForm({ ...walkInForm, barber_id: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select a barber</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>{b.barber_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Time Slot</label>
                <select
                  required
                  value={walkInForm.time_slot}
                  onChange={(e) => setWalkInForm({ ...walkInForm, time_slot: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select a time</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingWalkIn}
                className="w-full py-4 bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={15} />
                {submittingWalkIn ? "Adding..." : "Add Walk-In Client"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "clients" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-4xl font-semibold mb-1">
                  Client Records
                </h2>
                <p className="text-muted-foreground text-sm">{customers.length} clients found</p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search by name or phone..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                fetchCustomers(e.target.value);
              }}
              className="w-full bg-card border border-border px-4 py-3 mb-6 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
            />

            {loadingCustomers ? (
              <p className="text-muted-foreground text-sm">Searching...</p>
            ) : (
              <div className="bg-card border border-border overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-border">
                    {["Name", "Phone", "Email", "Visits", "Total Spent"].map((h) => (
                      <div
                        key={h}
                        className={`text-xs tracking-[0.15em] uppercase text-muted-foreground ${
                          h === "Name" ? "col-span-3" : h === "Email" ? "col-span-3" : "col-span-2"
                        }`}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  {customers.map((c, i) => (
                    <div
                      key={c.phone}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-secondary transition-colors items-center ${
                        i < customers.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                          {c.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium truncate">{c.name}</span>
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {c.phone}
                      </div>
                      <div className="col-span-3 text-sm text-muted-foreground truncate">
                        {c.email || "—"}
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

        {activeTab === "barbers" && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-semibold mb-8">
              Manage Barbers
            </h2>

            {/* Existing barbers list */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
{allBarbers.map((barber) =>
                editingBarberId === barber.id ? (
                  <form
                    key={barber.id}
                    onSubmit={(e) => handleUpdateBarber(e, barber.id)}
                    className="bg-card border border-primary p-5 space-y-3"
                  >
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Full name"
                      className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Phone"
                      className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={editForm.specialty}
                      onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                      placeholder="Specialty"
                      className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Bio"
                      className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:border-primary"
                    />
                    {editError && <p className="text-xs text-red-400">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingEdit}
                        className="flex-1 py-2 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase hover:opacity-90 disabled:opacity-50"
                      >
                        {submittingEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBarberId(null)}
                        className="flex-1 py-2 border border-border text-xs tracking-[0.15em] uppercase hover:bg-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div key={barber.id} className="bg-card border border-border p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium">{barber.barber_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{barber.specialty || "No specialty set"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {barber.phone || "No phone set"}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 tracking-wider uppercase shrink-0 ${
                          barber.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {barber.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <button
                        onClick={() => startEditing(barber)}
                        className="text-xs tracking-[0.15em] uppercase text-primary hover:opacity-80 transition-opacity"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(barber.id)}
                        className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {barber.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Create new barber form */}
            <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-medium mb-6">
              Add New Barber
            </h3>

            {barberFormSuccess && (
              <div className="bg-primary/10 border border-primary/30 px-5 py-4 mb-6 flex items-center gap-2.5 text-sm">
                <Check size={15} className="text-primary shrink-0" />
                <span>Barber account created successfully.</span>
              </div>
            )}
            {barberFormError && <p className="text-sm text-red-400 mb-6">{barberFormError}</p>}

            <form onSubmit={handleCreateBarber} className="bg-card border border-border p-8 space-y-5 max-w-lg">
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={barberForm.full_name}
                  onChange={(e) => setBarberForm({ ...barberForm, full_name: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={barberForm.email}
                  onChange={(e) => setBarberForm({ ...barberForm, email: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={barberForm.password}
                  onChange={(e) => setBarberForm({ ...barberForm, password: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={barberForm.phone}
                  onChange={(e) => setBarberForm({ ...barberForm, phone: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Fades and Line-ups"
                  value={barberForm.specialty}
                  onChange={(e) => setBarberForm({ ...barberForm, specialty: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Bio</label>
                <textarea
                  rows={3}
                  value={barberForm.bio}
                  onChange={(e) => setBarberForm({ ...barberForm, bio: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground resize-none focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submittingBarber}
                className="w-full py-4 bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submittingBarber ? "Creating..." : "Create Barber Account"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "services" && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-semibold mb-8">
              Manage Services
            </h2>

            {/* Existing services list */}
            <div className="space-y-3 mb-12">
              {allServices.map((service) =>
                editingServiceId === service.id ? (
                  <form
                    key={service.id}
                    onSubmit={(e) => handleUpdateService(e, service.id)}
                    className="bg-card border border-primary p-5 space-y-3"
                  >
                    <input
                      type="text"
                      value={serviceEditForm.name}
                      onChange={(e) => setServiceEditForm({ ...serviceEditForm, name: e.target.value })}
                      placeholder="Service name"
                      className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={serviceEditForm.adult_price}
                        onChange={(e) => setServiceEditForm({ ...serviceEditForm, adult_price: e.target.value })}
                        placeholder="Adult price"
                        className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        value={serviceEditForm.child_price}
                        onChange={(e) => setServiceEditForm({ ...serviceEditForm, child_price: e.target.value })}
                        placeholder="Child price"
                        className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <input
                      type="number"
                      value={serviceEditForm.duration_minutes}
                      onChange={(e) => setServiceEditForm({ ...serviceEditForm, duration_minutes: e.target.value })}
                      placeholder="Duration (minutes)"
                      className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                    <textarea
                      rows={2}
                      value={serviceEditForm.description}
                      onChange={(e) => setServiceEditForm({ ...serviceEditForm, description: e.target.value })}
                      placeholder="Description"
                      className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:border-primary"
                    />
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={serviceEditForm.available_for_adult}
                          onChange={(e) => setServiceEditForm({ ...serviceEditForm, available_for_adult: e.target.checked })}
                        />
                        Available for Adult
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={serviceEditForm.available_for_child}
                          onChange={(e) => setServiceEditForm({ ...serviceEditForm, available_for_child: e.target.checked })}
                        />
                        Available for Child
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingServiceEdit}
                        className="flex-1 py-2 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase hover:opacity-90 disabled:opacity-50"
                      >
                        {submittingServiceEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingServiceId(null)}
                        className="flex-1 py-2 border border-border text-xs tracking-[0.15em] uppercase hover:bg-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div key={service.id} className="bg-card border border-border p-5 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium">{service.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 tracking-wider uppercase ${
                            service.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {service.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{service.description}</div>
                      <div
                        style={{ fontFamily: "'DM Mono', monospace" }}
                        className="text-xs text-primary mt-2 flex gap-4"
                      >
                        {service.available_for_adult && <span>Adult: GHS {service.adult_price}</span>}
                        {service.available_for_child && <span>Child: GHS {service.child_price}</span>}
                        <span className="text-muted-foreground">{service.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="flex gap-4 shrink-0 ml-4">
                      <button
                        onClick={() => startEditingService(service)}
                        className="text-xs tracking-[0.15em] uppercase text-primary hover:opacity-80 transition-opacity"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleServiceActive(service.id)}
                        className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {service.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Create new service form */}
            <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-medium mb-6">
              Add New Service
            </h3>

            {serviceFormSuccess && (
              <div className="bg-primary/10 border border-primary/30 px-5 py-4 mb-6 flex items-center gap-2.5 text-sm">
                <Check size={15} className="text-primary shrink-0" />
                <span>Service created successfully.</span>
              </div>
            )}
            {serviceFormError && <p className="text-sm text-red-400 mb-6">{serviceFormError}</p>}

            <form onSubmit={handleCreateService} className="bg-card border border-border p-8 space-y-5 max-w-lg">
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Service Name *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Adult Price (GHS) *</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.adult_price}
                    onChange={(e) => setServiceForm({ ...serviceForm, adult_price: e.target.value })}
                    className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Child Price (GHS) *</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.child_price}
                    onChange={(e) => setServiceForm({ ...serviceForm, child_price: e.target.value })}
                    className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Duration (minutes) *</label>
                <input
                  type="number"
                  required
                  value={serviceForm.duration_minutes}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Description</label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full bg-background border border-border px-4 py-3 text-foreground resize-none focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={serviceForm.available_for_adult}
                    onChange={(e) => setServiceForm({ ...serviceForm, available_for_adult: e.target.checked })}
                  />
                  Available for Adult
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={serviceForm.available_for_child}
                    onChange={(e) => setServiceForm({ ...serviceForm, available_for_child: e.target.checked })}
                  />
                  Available for Child
                </label>
              </div>
              <button
                type="submit"
                disabled={submittingService}
                className="w-full py-4 bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submittingService ? "Creating..." : "Create Service"}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

export default DashboardPage;