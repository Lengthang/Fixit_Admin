// "use client";

// // Layout for every authenticated admin page.
// // The (dashboard) folder is a "route group" — the parentheses mean it
// // groups routes under one layout WITHOUT adding a URL segment. So
// // /providers, /disputes, etc. all render inside this shell.

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { auth } from "@/lib/api";
// import Sidebar from "@/components/Sidebar";

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const [ready, setReady] = useState(false);

//   // Guard: no token → bounce to /login. Runs on the client after mount
//   // because localStorage isn't available during server render.
//   useEffect(() => {
//     if (!auth.token) {
//       router.replace("/login");
//     } else {
//       setReady(true);
//     }
//   }, [router]);

//   if (!ready) return null;

//   return (
//     <div className="relative min-h-screen">
//       <Sidebar />
//       <main className="ml-60 px-10 py-8">{children}</main>
//     </div>
//   );
// }
"use client";

import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <main className="ml-60 px-10 py-8">{children}</main>
    </div>
  );
}