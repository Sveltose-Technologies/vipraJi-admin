import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MdPerson, MdLibraryBooks, MdMusicNote, MdCardMembership, MdGroup,
  MdShoppingBasket, MdMenuBook, MdCategory, MdForum, MdConfirmationNumber
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [
          usersRes, subsRes, poojaRes, aartiRes, yajmanRes, 
          samagriRes, stotramRes, communityRes, ticketsRes
        ] = await Promise.allSettled([
          getAllUsers(),
          getAllSubscriptions(),
          getAllPoojas(),
          getAllAartis(),
          getAllYajmanEntries(),
          getAllPoojaSamagri(),
          getAllStotramCategories(),
          getAllCommunityPosts(),
          getAllSupportTickets()
        ]);

        const getCount = (res) => {
          if (res.status === 'fulfilled' && res.value) {
            const v = res.value;
            // The API might return the array directly or wrap it in a specific key.
            // Check for common backend array keys to safely extract the count.
            const arr = v.auths || v.users || v.subscriptions || v.poojas || v.aartis ||
              v.yajmans || v.samagri || v.categories || v.posts || v.tickets ||
              v.data || v.result || v;
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
    { title: "Total Users", icon: <MdPerson size={48} />, link: "/manage-users", color: "var(--primary-color)", count: counts.users },
    { title: "Total Pooja", icon: <MdLibraryBooks size={48} />, link: "/manage-pooja", color: "var(--primary-color)", count: counts.poojas },
    { title: "Pooja Samagri", icon: <MdShoppingBasket size={48} />, link: "/manage-pooja-samagri", color: "var(--primary-color)", count: counts.poojaSamagri },
    { title: "Total Stotram", icon: <MdMenuBook size={48} />, link: "/manage-stotram", color: "var(--primary-color)", count: counts.stotrams },
    { title: "Manage Aarti", icon: <MdMusicNote size={48} />, link: "/manage-aarti", color: "var(--primary-color)", count: counts.aartis },
    { title: "Manage Yajman", icon: <MdGroup size={48} />, link: "/manage-yajman", color: "var(--primary-color)", count: counts.yajmans },
    { title: "Community Posts", icon: <MdForum size={48} />, link: "/manage-community", color: "var(--primary-color)", count: counts.community },
    { title: "Subscriptions", icon: <MdCardMembership size={48} />, link: "/manage-subscriptions", color: "var(--primary-color)", count: counts.subscriptions },
    { title: "Support Tickets", icon: <MdConfirmationNumber size={48} />, link: "/manage-support-ticket-categories", color: "var(--primary-color)", count: counts.supportTickets },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.1rem 0' }}>
      <div style={{ marginBottom: '1.2rem' }}>
        <h1 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '2rem' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem' }}>
          Welcome back! Here's a snapshot of your platform today.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
      }}>
        {gridItems.map((item, idx) => (
          <Link key={idx} to={item.link} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '160px'
            }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              {/* Title Top Left */}
              <div style={{ fontSize: '1.1rem', color: '#6B7280', fontWeight: 500, marginBottom: '1.5rem' }}>
                {item.title}
              </div>

              {/* Middle section: Icon and Big Number */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, marginBottom: '1.5rem' }}>
                <div style={{ color: 'var(--primary-color)', opacity: 0.9 }}>
                  {item.icon}
                </div>

                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {loading ? (
                    <span style={{ opacity: 0.3, fontSize: '1rem' }}>...</span>
                  ) : (
                    item.count.toLocaleString()
                  )}
                </div>
              </div>

              {/* Bottom section: Subtitle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Click to manage</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary-color)', fontWeight: 600 }}>Manage Data &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
