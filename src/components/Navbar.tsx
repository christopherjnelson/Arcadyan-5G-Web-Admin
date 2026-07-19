import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router";
import { useAuth } from "../hooks/useAuth";

const links = [
  { to: "/", label: "Signal" },
  { to: "/wifi", label: "WiFi" },
  { to: "/system", label: "System" },
];

function linkClasses({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-slate-700 text-amber-400"
      : "text-slate-300 hover:bg-slate-700 hover:text-white"
  }`;
}

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <Disclosure as="nav" className="bg-slate-950 shadow">
      {({ close }) => (
        <>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <NavLink to="/" className="text-lg font-bold text-amber-400">
              KVD Admin
            </NavLink>

            {user && (
              <div className="hidden gap-1 sm:flex">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end
                    className={linkClasses}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {user && (
                <NavLink
                  to="/login"
                  onClick={logout}
                  className="rounded-md px-3 py-2 text-sm font-medium text-amber-400 hover:bg-slate-700"
                >
                  Logout
                </NavLink>
              )}
              {user && (
                <DisclosureButton className="group rounded-md p-2 text-slate-300 hover:bg-slate-700 sm:hidden">
                  <span className="sr-only">Open menu</span>
                  <Menu className="h-5 w-5 group-data-[open]:hidden" />
                  <X className="hidden h-5 w-5 group-data-[open]:block" />
                </DisclosureButton>
              )}
            </div>
          </div>

          {user && (
            <DisclosurePanel className="border-t border-slate-800 sm:hidden">
              <div className="space-y-1 px-4 py-3">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end
                    onClick={() => close()}
                    className={(state) => `block ${linkClasses(state)}`}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </DisclosurePanel>
          )}
        </>
      )}
    </Disclosure>
  );
}
