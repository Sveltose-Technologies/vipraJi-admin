import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOTP from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UpdateProfile from "./pages/UpdateProfile";
import Dashboard from "./pages/Dashboard";
import ManageUsers from "./pages/ManageUsers";
import ManageStotram from "./pages/ManageStotram";
import ManageAarti from "./pages/ManageAarti";
import ManagePooja from "./pages/ManagePooja";
import ManagePoojaCategory from "./pages/ManagePoojaCategory";
import ManageStotramCategory from "./pages/ManageStotramCategory";
import ManageStotramSubCategory from "./pages/ManageStotramSubCategory";
import ManagePoojaSamagri from "./pages/ManagePoojaSamagri";
import ManageYajman from "./pages/ManageYajman";
import ManageAartiCategory from "./pages/ManageAartiCategory";
import ManageYajmanCategory from "./pages/ManageYajmanCategory";
import ManageSupportTickets from "./pages/ManageSupportTickets";
const ManageCommunity = React.lazy(() => import("./pages/ManageCommunity"));
import ManageSubscriptions from "./pages/ManageSubscriptions";
import ManageLegalContent from "./pages/ManageLegalContent";
import AdminLayout from "./components/AdminLayout";
import {
  createTermAndCondition,
  deleteTermAndCondition,
  getAllTermAndConditions,
  getTermAndConditionById,
  updateTermAndCondition,
} from "./api/termAndCondition";
import {
  createPrivacyPolicy,
  deletePrivacyPolicy,
  getAllPrivacyPolicies,
  getPrivacyPolicyById,
  updatePrivacyPolicy,
} from "./api/privacyPolicy";

const termAndConditionConfig = {
  label: "Terms and Conditions",
  queryKey: "termsAndConditions",
  collectionKey: "termsAndConditions",
  getAll: getAllTermAndConditions,
  getById: getTermAndConditionById,
  create: createTermAndCondition,
  update: updateTermAndCondition,
  remove: deleteTermAndCondition,
};

const privacyPolicyConfig = {
  label: "Privacy Policy",
  queryKey: "privacyPolicies",
  collectionKey: "privacyPolicies",
  getAll: getAllPrivacyPolicies,
  getById: getPrivacyPolicyById,
  create: createPrivacyPolicy,
  update: updatePrivacyPolicy,
  remove: deletePrivacyPolicy,
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin Routes wrapped in Layout */}
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route
              path="/manage-community"
              element={
                <React.Suspense
                  fallback={
                    <div className="page-content">Loading community...</div>
                  }
                >
                  <ManageCommunity />
                </React.Suspense>
              }
            />
            <Route path="/manage-pooja" element={<ManagePooja />} />
            <Route
              path="/manage-pooja-categories"
              element={<ManagePoojaCategory />}
            />
            <Route
              path="/manage-pooja-samagri"
              element={<ManagePoojaSamagri />}
            />
            <Route path="/manage-stotram" element={<ManageStotram />} />
            <Route
              path="/manage-stotram-categories"
              element={<ManageStotramCategory />}
            />
            <Route
              path="/manage-stotram-subcategories"
              element={<ManageStotramSubCategory />}
            />
            <Route path="/manage-aarti" element={<ManageAarti />} />
            <Route
              path="/manage-aarti-categories"
              element={<ManageAartiCategory />}
            />
            <Route path="/manage-yajman" element={<ManageYajman />} />
            <Route
              path="/manage-yajman-categories"
              element={<ManageYajmanCategory />}
            />
            <Route
              path="/manage-subscriptions"
              element={<ManageSubscriptions />}
            />
            <Route
              path="/manage-support-ticket-categories"
              element={<ManageSupportTickets />}
            />
            <Route
              path="/manage-terms-and-conditions"
              element={<ManageLegalContent config={termAndConditionConfig} />}
            />
            <Route
              path="/manage-privacy-policy"
              element={<ManageLegalContent config={privacyPolicyConfig} />}
            />
            <Route path="/update-profile" element={<UpdateProfile />} />
            <Route
              path="/settings"
              element={
                <div style={{ padding: "2rem" }}>
                  <h1>Settings</h1>
                  <p>Settings content here</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
