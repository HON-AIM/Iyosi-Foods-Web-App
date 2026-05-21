"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import DropdownMenu from "./DropdownMenu";
import type { NavItemConfig } from "@/config/navConfig";

interface NavItemProps {
  item: NavItemConfig;
  isOpen: boolean;
  onOpen: (label: string) => void;
  onClose: () => void;
}

export default function NavItem({ item, isOpen, onOpen, onClose }: NavItemProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = !!item.children?.length;

  const isActive =
    pathname === item.href ||
    (hasChildren && item.children!.some((child) => pathname.startsWith(child.href)));

  const dropdownId = `dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

  const handleMouseEnter = useCallback(() => {
    if (hasChildren) {
      setIsHovered(true);
      onOpen(item.label);
    }
  }, [hasChildren, onOpen, item.label]);

  const handleMouseLeave = useCallback(() => {
    if (hasChildren) {
      setIsHovered(false);
      onClose();
    }
  }, [hasChildren, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!hasChildren) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        isOpen ? onClose() : onOpen(item.label);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    },
    [hasChildren, isOpen, onClose, onOpen, item.label]
  );

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={item.href}
        className={`nav-link flex items-center gap-1 px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide transition-colors duration-200 rounded-lg ${
          isActive
            ? "text-primary-600"
            : "text-surface-700 hover:text-primary-600 hover:bg-surface-50"
        } ${isOpen ? "text-primary-600 bg-surface-50" : ""}`}
        onKeyDown={handleKeyDown}
        aria-haspopup={hasChildren ? "true" : undefined}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-controls={hasChildren ? dropdownId : undefined}
      >
        {item.label}
        {hasChildren && (
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </Link>

      {/* Active indicator line */}
      {isActive && (
        <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary-600 rounded-full" />
      )}

      {/* Desktop dropdown */}
      {hasChildren && (
        <div
          className={`absolute left-0 pt-1 z-50 transition-all duration-200 ease-out ${
            isHovered
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <DropdownMenu items={item.children!} id={dropdownId} />
        </div>
      )}
    </div>
  );
}
