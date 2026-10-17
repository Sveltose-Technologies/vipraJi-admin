import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MdPerson, MdLibraryBooks, MdMusicNote, MdCardMembership, MdGroup,
  MdShoppingBasket, MdMenuBook, MdCategory, MdForum, MdConfirmationNumber,
  MdNotificationsActive
} from 'react-icons/md';

import { getAllUsers } from '../api/auth';
import { getAllSubscriptions } from '../api/subscription';
import { getAllPoojas } from '../api/pooja';
import { getAllAartis } from '../api/aarti';
import { getAllYajmanEntries } from '../api/yajmanEntry';
import { getAllPoojaSamagri } from '../api/poojaSamagri';
import { getAllStotramCategories } from '../api/stotramCategory';
import { getAllCommunityPosts } from '../api/communityPost';
import { getAllSupportTickets } from '../api/supportTicket';
import { getAllNotifications } from '../api/notification';

const Dashboard = () => {
  const [counts, setCounts] = useState({
    users: 0,
    subscriptions: 0,
    poojas: 0,
    aartis: 0,
    yajmans: 0,
    poojaSamagri: 0,
    stotrams: 0,
    community: 0,
    supportTickets: 0,
    notifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [
          usersRes, subsRes, poojaRes, aartiRes, yajmanRes, 
          samagriRes, stotramRes, communityRes, ticketsRes, notifsRes
        ] = await Promise.allSettled([
          getAllUsers(),
          getAllSubscriptions(),
          getAllPoojas(),
          getAllAartis(),
          getAllYajmanEntries(),
          getAllPoojaSamagri(),
          getAllStotramCategories(),
          getAllCommunityPosts(),
          getAllSupportTickets(),
          getAllNotifications()
        ]);

        const getCount = (res) => {
          if (res.status === 'fulfilled' && res.value) {
            const v = res.value;
            // Check for total count field first
            if (typeof v.total === 'number') return v.total;
            if (typeof v.count === 'number') return v.count;
            // The API might return the array directly or wrap it in a specific key.
            // Check for common backend array keys to safely extract the count.
            const arr = v.auths || v.users || v.subscriptions || v.poojas || v.aartis ||
              v.yajmans || v.samagri || v.categories || v.posts || v.tickets ||
              v.notifications || v.data || v.result || v;
            return Array.isArray(arr) ? arr.length : 0;
          }
          return 0;
        };

        setCounts({
          users: getCount(usersRes),
          subscriptions: getCount(subsRes),
          poojas: getCount(poojaRes),
          aartis: getCount(aartiRes),
          yajmans: getCount(yajmanRes),
          poojaSamagri: getCount(samagriRes),
          stotrams: getCount(stotramRes),
          community: getCount(communityRes),
          supportTickets: getCount(ticketsRes),
          notifications: getCount(notifsRes),
        });
      } catch (err) {
        console.error("Failed to fetch dashboard counts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const gridItems = [
    { title: "Total Users", icon: <MdPerson size={20} />, link: "/manage-users", color: "var(--primary-color)", count: counts.users },
    { title: "Notifications", icon: <MdNotificationsActive size={20} />, link: "/manage-notifications", color: "var(--primary-color)", count: counts.notifications },
    { title: "Total Pooja", icon: <MdLibraryBooks size={20} />, link: "/manage-pooja", color: "var(--primary-color)", count: counts.poojas },
    { title: "Pooja Samagri", icon: <MdShoppingBasket size={20} />, link: "/manage-pooja-samagri", color: "var(--primary-color)", count: counts.poojaSamagri },
    { title: "Total Stotram", icon: <MdMenuBook size={20} />, link: "/manage-stotram", color: "var(--primary-color)", count: counts.stotrams },
    { title: "Manage Aarti", icon: <MdMusicNote size={20} />, link: "/manage-aarti", color: "var(--primary-color)", count: counts.aartis },
    { title: "Manage Yajman", icon: <MdGroup size={20} />, link: "/manage-yajman", color: "var(--primary-color)", count: counts.yajmans },
    { title: "Community Posts", icon: <MdForum size={20} />, link: "/manage-community", color: "var(--primary-color)", count: counts.community },
    { title: "Subscriptions", icon: <MdCardMembership size={20} />, link: "/manage-subscriptions", color: "var(--primary-color)", count: counts.subscriptions },
    { title: "Support Tickets", icon: <MdConfirmationNumber size={20} />, link: "/manage-support-ticket-categories", color: "var(--primary-color)", count: counts.supportTickets },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.1rem 0' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.4rem', margin: 0 }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Welcome back! Here's a snapshot of your platform today.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.85rem',
      }}>
        {gridItems.map((item, idx) => (
          <Link key={idx} to={item.link} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '14px 16px',
              position: 'relative',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
              border: '1px solid #EAECEF',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '115px'
            }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(0, 0, 0, 0.08)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)';
              }}
            >
              {/* Top Row: Title & Compact Icon */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                  {item.title}
                </span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(155, 42, 31, 0.08)',
                  color: 'var(--vipra-color, #9B2A1F)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
              </div>

              {/* Middle section: Big Number */}
              <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '0.6rem' }}>
                {loading ? (
                  <span style={{ opacity: 0.3, fontSize: '0.9rem' }}>...</span>
                ) : (
                  item.count.toLocaleString()
                )}
              </div>

              {/* Bottom section: Subtitle & link */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Click to manage</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', fontWeight: 600 }}>Manage &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
