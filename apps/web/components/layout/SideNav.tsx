"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Layers } from "lucide-react";
import { FC, ReactNode } from "react";
import { AppPath } from "@/constants";

const NavButton: FC<{
  href: string;
  active: boolean;
  title: string;
  icon: ReactNode;
}> = ({ href, active, title, icon }) => (
  <Link href={href}>
    <Button
      variant={active ? "secondary" : "ghost"}
      size="icon"
      title={title}
      className="rounded-lg"
    >
      {icon}
    </Button>
  </Link>
);

export const SideNav = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col justify-between bg-muted border-r p-2">
      <div className="flex flex-col space-y-4">
        <NavButton
          href={AppPath.Chat}
          active={pathname.startsWith(AppPath.Chat)}
          title="Chat"
          icon={<MessageSquare className="h-6 w-6" />}
        />
        <NavButton
          href={AppPath.Stack}
          active={pathname.startsWith(AppPath.Stack)}
          title="Stack Management"
          icon={<Layers className="h-6 w-6" />}
        />
      </div>
    </nav>
  );
};
