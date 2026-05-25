import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/nurseos-logo.png"
          alt="NurseOS"
          width={40}
          height={40}
          className="w-10 h-10 rounded-lg animate-pulse"
          priority
        />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    </div>
  );
}
