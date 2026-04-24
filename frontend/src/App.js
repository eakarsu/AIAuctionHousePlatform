import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ConsignorsPage from './pages/ConsignorsPage';
import ItemsPage from './pages/ItemsPage';
import AuctionsPage from './pages/AuctionsPage';
import BiddersPage from './pages/BiddersPage';
import LiveAuctionsPage from './pages/LiveAuctionsPage';
import InvoicesPage from './pages/InvoicesPage';
import ShippingPage from './pages/ShippingPage';
import ConditionsPage from './pages/ConditionsPage';
import StoragePage from './pages/StoragePage';
import CompliancePage from './pages/CompliancePage';
import ReportsPage from './pages/ReportsPage';
import LotDescriptionPage from './pages/ai/LotDescriptionPage';
import ValuationPage from './pages/ai/ValuationPage';
import AuthenticityPage from './pages/ai/AuthenticityPage';
import MarketingPage from './pages/ai/MarketingPage';
import BuyerMatchingPage from './pages/ai/BuyerMatchingPage';
import MarketTrendsPage from './pages/ai/MarketTrendsPage';
import PhotographyPage from './pages/PhotographyPage';
import CatalogPage from './pages/CatalogPage';
import CampaignsPage from './pages/CampaignsPage';
import PaymentsPage from './pages/PaymentsPage';
import UnsoldLotsPage from './pages/UnsoldLotsPage';
import AppraisalsPage from './pages/AppraisalsPage';
import EstatesPage from './pages/EstatesPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/consignors" element={<ProtectedRoute><ConsignorsPage /></ProtectedRoute>} />
      <Route path="/items" element={<ProtectedRoute><ItemsPage /></ProtectedRoute>} />
      <Route path="/auctions" element={<ProtectedRoute><AuctionsPage /></ProtectedRoute>} />
      <Route path="/bidders" element={<ProtectedRoute><BiddersPage /></ProtectedRoute>} />
      <Route path="/live-auctions" element={<ProtectedRoute><LiveAuctionsPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/shipping" element={<ProtectedRoute><ShippingPage /></ProtectedRoute>} />
      <Route path="/conditions" element={<ProtectedRoute><ConditionsPage /></ProtectedRoute>} />
      <Route path="/storage" element={<ProtectedRoute><StoragePage /></ProtectedRoute>} />
      <Route path="/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/ai/lot-description" element={<ProtectedRoute><LotDescriptionPage /></ProtectedRoute>} />
      <Route path="/ai/valuation" element={<ProtectedRoute><ValuationPage /></ProtectedRoute>} />
      <Route path="/ai/authenticity" element={<ProtectedRoute><AuthenticityPage /></ProtectedRoute>} />
      <Route path="/ai/marketing" element={<ProtectedRoute><MarketingPage /></ProtectedRoute>} />
      <Route path="/ai/buyer-matching" element={<ProtectedRoute><BuyerMatchingPage /></ProtectedRoute>} />
      <Route path="/ai/market-trends" element={<ProtectedRoute><MarketTrendsPage /></ProtectedRoute>} />
      <Route path="/photography" element={<ProtectedRoute><PhotographyPage /></ProtectedRoute>} />
      <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
      <Route path="/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
      <Route path="/unsold-lots" element={<ProtectedRoute><UnsoldLotsPage /></ProtectedRoute>} />
      <Route path="/appraisals" element={<ProtectedRoute><AppraisalsPage /></ProtectedRoute>} />
      <Route path="/estates" element={<ProtectedRoute><EstatesPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
