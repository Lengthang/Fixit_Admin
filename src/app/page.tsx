// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { auth } from "@/lib/api";

// export default function Home() {
//   const router = useRouter();
//   useEffect(() => {
//     router.replace(auth.token ? "/providers" : "/login");
//   }, [router]);
//   return null;
// }
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}