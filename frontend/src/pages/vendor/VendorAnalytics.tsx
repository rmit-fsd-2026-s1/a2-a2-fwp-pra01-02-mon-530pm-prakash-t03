/**
 * VENDOR ANALYTICS DASHBOARD PAGE
 * 
 * Purpose: Computes and visualizes booking statistics for venues managed by the logged-in vendor.
 * Includes interactive filters for time perspectives (This Week, This Month, Last Month, All Time).
 * 
 * Features:
 * 1. Timeline Zoom Buttons (This Week, This Month, Last Month, All Time)
 * 2. Bar Chart: Hirers' tallies for a selected venue managed by the vendor (with dropdown)
 * 3. Stacked Bar Chart: Combined total of all hirers' tallies across all venues managed
 * 4. Pie Chart: Most and least active hirers based on booking frequency in the period
 * 5. Line Chart: Venue utilization trend line over time
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Frontend Dev Server:
 *   npm run dev
 * - Build Frontend bundle:
 *   npm run build
 * - Run Frontend Unit Tests:
 *   npm run test
 */

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../utils/api'
import type { Venue, Application } from '../../types'

type TimePerspective = 'week' | 'month' | 'last_month' | 'all';

export default function VendorAnalytics() {
  const { currentUser } = useAuth();
  
  // Data States
  const [venues, setVenues] = useState<Venue[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [timePerspective, setTimePerspective] = useState<TimePerspective>('all');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  // Colour Palette
  const chartColours = ["#5C6B45", "#2C3E50", "#E74C3C", "#3498DB", "#9B59B6", "#F1C40F", "#1ABC9C", "#E67E22"];

  // Fetch Venues and Applications (Bookings) on Mount
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    Promise.all([api.getVenues(), api.getApplications()])
      .then(([venuesRes, appsRes]) => {
        // Filter venues managed by the current vendor
        const vendorOwnedVenues = venuesRes.filter(v => v.vendorId === currentUser.id);
        setVenues(vendorOwnedVenues);
        
        // Filter applications for the vendor's venues
        const vendorApps = appsRes.filter(app => vendorOwnedVenues.some(v => v.id === app.venueId));
        setApplications(vendorApps);

        // Pre-select first venue for venue-specific chart
        if (vendorOwnedVenues.length > 0) {
          setSelectedVenueId(vendorOwnedVenues[0].id);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load analytics data:", err);
        setError("Could not load analytics statistics. Please try again later.");
        setLoading(false);
      });
  }, [currentUser]);

  // 1. Helper to Filter Bookings by Time Range
  const timeFilteredApprovedApps = useMemo(() => {
    const approvedApps = applications.filter(app => app.status === 'approved');
    
    const now = new Date();
    // Get start of today (local time midnight)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return approvedApps.filter(app => {
      if (!app.eventDate) return false;
      const dateParts = app.eventDate.split('-');
      if (dateParts.length !== 3) return false;
      
      // Construct date from eventDate YYYY-MM-DD
      const appDate = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
      if (isNaN(appDate.getTime())) return false;

      if (timePerspective === 'week') {
        // Current calendar week (Monday to Sunday)
        const currentDay = today.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        return appDate >= monday && appDate <= sunday;
      }

      if (timePerspective === 'month') {
        // Current month
        return appDate.getFullYear() === today.getFullYear() && appDate.getMonth() === today.getMonth();
      }

      if (timePerspective === 'last_month') {
        // Last month
        const currentMonth = today.getMonth();
        const lastMonthYear = currentMonth === 0 ? today.getFullYear() - 1 : today.getFullYear();
        const lastMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
        return appDate.getFullYear() === lastMonthYear && appDate.getMonth() === lastMonthIndex;
      }

      return true; // 'all'
    });
  }, [applications, timePerspective]);

  // 2. Data Calculation for Chart 1: Bar Chart per Selected Venue
  const venueSpecificBarData = useMemo(() => {
    if (!selectedVenueId) return [];
    
    // Filter bookings for the selected venue in this time perspective
    const venueApps = timeFilteredApprovedApps.filter(app => app.venueId === selectedVenueId);
    
    const hirerBookingCounts: Record<string, number> = {};
    venueApps.forEach(app => {
      const name = app.hirerName || 'Unknown Hirer';
      hirerBookingCounts[name] = (hirerBookingCounts[name] || 0) + 1;
    });

    return Object.entries(hirerBookingCounts).map(([name, count]) => ({
      name,
      bookings: count
    })).sort((a, b) => b.bookings - a.bookings);
  }, [timeFilteredApprovedApps, selectedVenueId]);

  // 3. Data Calculation for Chart 2: Stacked Bar Chart across all managed venues
  const combinedStackedBarData = useMemo(() => {
    const venueNames = venues.map(v => v.name);
    
    const hirerVenueMap: Record<string, Record<string, number>> = {};
    
    timeFilteredApprovedApps.forEach(app => {
      const hirerName = app.hirerName || 'Unknown Hirer';
      const venueName = app.venueName || 'Unknown Venue';
      
      if (!hirerVenueMap[hirerName]) {
        hirerVenueMap[hirerName] = {};
      }
      hirerVenueMap[hirerName][venueName] = (hirerVenueMap[hirerName][venueName] || 0) + 1;
    });

    return Object.entries(hirerVenueMap).map(([hirerName, venueCounts]) => {
      const row: any = { name: hirerName };
      venueNames.forEach(vName => {
        row[vName] = venueCounts[vName] || 0;
      });
      return row;
    });
  }, [timeFilteredApprovedApps, venues]);

  // 4. Data Calculation for Chart 3: Pie Chart of Most and Least Active Hirers
  const mostLeastActivePieData = useMemo(() => {
    const hirerTotals: Record<string, number> = {};
    timeFilteredApprovedApps.forEach(app => {
      const name = app.hirerName || 'Unknown Hirer';
      hirerTotals[name] = (hirerTotals[name] || 0) + 1;
    });

    const entries = Object.entries(hirerTotals);
    if (entries.length === 0) return [];

    const maxCount = Math.max(...entries.map(e => e[1]));
    const minCount = Math.min(...entries.map(e => e[1]));

    const mostActiveEntries = entries.filter(e => e[1] === maxCount);

    if (maxCount === minCount) {
      // If everyone has the same amount of bookings, show them all as active
      return mostActiveEntries.map(([name, count]) => ({
        name: `Active: ${name}`,
        value: count
      }));
    }

    const leastActiveEntries = entries.filter(e => e[1] === minCount);

    return [
      ...mostActiveEntries.map(([name, count]) => ({
        name: `Most Active: ${name}`,
        value: count
      })),
      ...leastActiveEntries.map(([name, count]) => ({
        name: `Least Active: ${name}`,
        value: count
      }))
    ];
  }, [timeFilteredApprovedApps]);

  // 5. Data Calculation for Chart 4: Line Chart (Venue Utilization over time)
  const utilizationLineData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timePerspective === 'week') {
      // Monday to Sunday days
      const currentDay = today.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);

      const dataPoints = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const yyyymmdd = d.toISOString().split('T')[0];
        const bookingsCount = timeFilteredApprovedApps.filter(app => app.eventDate === yyyymmdd).length;
        dataPoints.push({ name: label, utilization: bookingsCount });
      }
      return dataPoints;
    }

    if (timePerspective === 'month') {
      // Days in current month
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysCount = new Date(year, month + 1, 0).getDate();

      const dataPoints = [];
      for (let i = 1; i <= daysCount; i++) {
        const label = `${i}`;
        const yyyymmdd = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const bookingsCount = timeFilteredApprovedApps.filter(app => app.eventDate === yyyymmdd).length;
        dataPoints.push({ name: label, utilization: bookingsCount });
      }
      return dataPoints;
    }

    if (timePerspective === 'last_month') {
      // Days in last month
      const currentMonth = today.getMonth();
      const lastMonthYear = currentMonth === 0 ? today.getFullYear() - 1 : today.getFullYear();
      const lastMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
      const daysCount = new Date(lastMonthYear, lastMonthIndex + 1, 0).getDate();

      const dataPoints = [];
      for (let i = 1; i <= daysCount; i++) {
        const label = `${i}`;
        const yyyymmdd = `${lastMonthYear}-${String(lastMonthIndex + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const bookingsCount = timeFilteredApprovedApps.filter(app => app.eventDate === yyyymmdd).length;
        dataPoints.push({ name: label, utilization: bookingsCount });
      }
      return dataPoints;
    }

    // 'all' perspective: group by YYYY-MM
    const monthlyGroups: Record<string, number> = {};
    
    // Seed last 6 months to ensure a nice line trend even with sparse data
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyGroups[key] = 0;
    }

    timeFilteredApprovedApps.forEach(app => {
      if (app.eventDate) {
        const key = app.eventDate.substring(0, 7); // 'YYYY-MM'
        monthlyGroups[key] = (monthlyGroups[key] || 0) + 1;
      }
    });

    return Object.entries(monthlyGroups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => {
        const [yr, mo] = key.split('-');
        const dateObj = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return { name: label, utilization: count };
      });
  }, [timeFilteredApprovedApps, timePerspective]);

  // Loading & Error Fallbacks
  if (loading) {
    return <p className="text-center text-muted" style={{ padding: '3rem' }}>Processing database statistics...</p>;
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ margin: '2rem 0' }}>
        <span className="material-icons">error</span>
        {error}
      </div>
    );
  }

  // Summary statistics for display cards
  const uniqueHirersCount = new Set(timeFilteredApprovedApps.map(app => app.hirerId)).size;
  const totalBookingsCount = timeFilteredApprovedApps.length;
  const activeVenuesCount = new Set(timeFilteredApprovedApps.map(app => app.venueId)).size;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.35rem' }}>Interactive Vendor Analytics</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Zoom in and out of your venue statistics using timelines.
          </p>
        </div>

        {/* Time Perspective Selector (Zoom functionality) */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--r)', padding: '0.25rem', border: '1px solid var(--border)' }}>
          {(['week', 'month', 'last_month', 'all'] as const).map(p => (
            <button
              key={p}
              className={`btn btn-sm ${timePerspective === p ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                borderRadius: 'calc(var(--r) - 2px)',
                padding: '0.35rem 0.85rem',
                fontSize: '0.85rem',
                boxShadow: timePerspective === p ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                background: timePerspective === p ? 'var(--olive)' : 'transparent',
                borderColor: timePerspective === p ? 'var(--olive)' : 'transparent',
                color: timePerspective === p ? '#fff' : 'var(--text-2)'
              }}
              onClick={() => setTimePerspective(p)}
            >
              {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === 'last_month' ? 'Last Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(92,107,69,0.15)', color: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons">event_available</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Approved Bookings</div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--charcoal)' }}>{totalBookingsCount}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(44,62,80,0.15)', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons">domain</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Active Venues</div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--charcoal)' }}>{activeVenuesCount} / {venues.length}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(231,76,60,0.15)', color: '#E74C3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons">people</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Unique Hirers</div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--charcoal)' }}>{uniqueHirersCount}</h3>
          </div>
        </div>
      </div>

      {totalBookingsCount === 0 ? (
        <div className="card">
          <div className="card-body text-center" style={{ padding: '3.5rem' }}>
            <span className="material-icons" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>
              insert_chart_outlined
            </span>
            <h4>No Analytics Available</h4>
            <p style={{ maxWidth: 460, margin: '0 auto' }}>
              There are no approved bookings during the selected timeframe ({timePerspective === 'week' ? 'this week' : timePerspective === 'month' ? 'this month' : timePerspective === 'last_month' ? 'last month' : 'all time'}). Make sure your venue has bookings and they have been approved!
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Line Chart: Utilization over time */}
          <div className="card">
            <div className="card-header">
              <h4>
                <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>trending_up</span>
                Venue Utilization over Time (Bookings Count)
              </h4>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={utilizationLineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.85rem' }} />
                  <Line type="monotone" dataKey="utilization" stroke="var(--olive)" strokeWidth={2.5} activeDot={{ r: 6 }} name="Bookings" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            
            {/* Chart 1: Hirers' tallies for each venue (venue dropdown selector) */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4>
                  <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>bar_chart</span>
                  Hirers' Bookings per Venue
                </h4>
                
                {venues.length > 0 && (
                  <select
                    className="form-select"
                    style={{ width: 'auto', minWidth: 160, padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                    value={selectedVenueId}
                    onChange={e => setSelectedVenueId(e.target.value)}
                  >
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="card-body">
                {venueSpecificBarData.length === 0 ? (
                  <p className="text-muted text-center" style={{ padding: '3rem' }}>No bookings for this venue in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={venueSpecificBarData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.85rem' }} />
                      <Bar dataKey="bookings" fill="var(--olive)" radius={[4, 4, 0, 0]} name="Bookings Count" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Stacked Bar Chart */}
            <div className="card">
              <div className="card-header">
                <h4>
                  <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>stacked_bar_chart</span>
                  Combined Booking Tallies (Stacked per Venue)
                </h4>
              </div>
              <div className="card-body">
                {combinedStackedBarData.length === 0 ? (
                  <p className="text-muted text-center" style={{ padding: '3rem' }}>No combined booking data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={combinedStackedBarData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.85rem' }} />
                      <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                      {venues.map((v, i) => (
                        <Bar
                          key={v.id}
                          dataKey={v.name}
                          stackId="venueStack"
                          fill={chartColours[i % chartColours.length]}
                          radius={[0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Pie Chart Section: Most and least active hirers */}
          <div className="card" style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}>
            <div className="card-header">
              <h4>
                <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>pie_chart</span>
                Most and Least Active Hirers
              </h4>
            </div>
            <div className="card-body">
              {mostLeastActivePieData.length === 0 ? (
                <p className="text-muted text-center" style={{ padding: '3rem' }}>No activity data found.</p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
                  <ResponsiveContainer width="60%" height={260} minWidth={240}>
                    <PieChart>
                      <Pie
                        data={mostLeastActivePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ value }) => `${value}`}
                      >
                        {mostLeastActivePieData.map((_, index) => (
                          <Cell key={index} fill={index === 0 ? 'var(--olive)' : 'var(--charcoal)'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} bookings`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend / Info panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 160 }}>
                    {mostLeastActivePieData.map((item, idx) => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ width: 12, height: 12, borderRadius: '3px', background: idx === 0 ? 'var(--olive)' : 'var(--charcoal)', display: 'inline-block' }}></span>
                        <div>
                          <strong>{item.value} bookings</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
