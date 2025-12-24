'use client';

import PrivateRoute from "../component/PrivateRoute";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
   
    <PrivateRoute>
      {children}
    </PrivateRoute>
  );
}