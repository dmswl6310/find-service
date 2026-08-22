import { Suspense } from "react";
import { notFound } from "next/navigation";
import DesignLabClient from "./DesignLabClient";
import { isDesignLabEnabled } from "@/lib/designLab";

export default function DesignLabPage() {
  if (!isDesignLabEnabled(process.env.NODE_ENV)) notFound();

  return (
    <Suspense fallback={null}>
      <DesignLabClient />
    </Suspense>
  );
}
