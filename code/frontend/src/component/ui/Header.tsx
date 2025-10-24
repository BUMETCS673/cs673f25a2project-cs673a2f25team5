/*

 AI-generated code:  0%

 Human code: 0%

framework-generated code: 100% (functions: Disclosure, DisclosureButton, DisclosurePanel, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, Link, usePathname, FaBars, FaTimes) from tailwindcss/ui

*/
"use client";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Header() {
  const pathname = usePathname();
  return (
    <Disclosure
      as="nav"
      className="relative bg-white shadow-sm dark:bg-black dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:bottom-0 dark:after:h-px dark:after:bg-white/10"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-amber-600 focus:outline-hidden focus:ring-inset dark:hover:bg-white/5 dark:hover:text-white dark:focus:ring-white">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <FaBars
                aria-hidden="true"
                className="block size-6 group-data-open:hidden"
              />
              <FaTimes
                aria-hidden="true"
                className="hidden size-6 group-data-open:block"
              />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <h1 className="text-2xl font-bold hover:text-amber-600 hover:scale-105 transition-all duration-300">
                Kickaas
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* Current: "border-amber-600 dark:border-amber-500 text-gray-900 dark:text-white", Default: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white" */}
              <Link
                href="/"
                className={`inline-flex items-center border-b-2 ${
                  pathname === "/"
                    ? "border-amber-600 px-1 pt-1 text-sm font-medium text-gray-900 dark:border-amber-500 dark:text-white"
                    : "border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
                }`}
              >
                Home
              </Link>
              <Link
                href="/events"
                className={`inline-flex items-center border-b-2 ${
                  pathname === "/events"
                    ? "border-amber-600 px-1 pt-1 text-sm font-medium text-gray-900 dark:border-amber-500 dark:text-white"
                    : "border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
                }`}
              >
                Events
              </Link>
              <Link
                href="/create-events"
                className={`inline-flex items-center border-b-2 ${
                  pathname === "/create-events"
                    ? "border-amber-600 px-1 pt-1 text-sm font-medium text-gray-900 dark:border-amber-500 dark:text-white"
                    : "border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
                }`}
              >
                Create Event
              </Link>
              <Link
                href="/profile"
                className={`inline-flex items-center border-b-2 ${
                  pathname === "/profile"
                    ? "border-amber-600 px-1 pt-1 text-sm font-medium text-gray-900 dark:border-amber-500 dark:text-white"
                    : "border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
                }`}
              >
                Profile
              </Link>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Profile dropdown */}
            <SignedOut>
              <SignInButton />
              <SignUpButton>
                <button className="bg-amber-400 mx-2 text-black hover:bg-amber-300 hover:scale-105 transition-all duration-300 rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 pt-2 pb-4">
          {/* Current: "bg-amber-50 dark:bg-amber-600/10 border-amber-600 text-amber-700 dark:border-amber-500 dark:bg-amber-600/10 dark:text-amber-400", Default: "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5 dark:hover:text-white" */}
          <DisclosureButton
            as="a"
            href="/"
            className="block border-l-4 border-amber-600 bg-amber-50 py-2 pr-4 pl-3 text-base font-medium text-amber-700 dark:border-amber-500 dark:bg-amber-600/10 dark:text-amber-400"
          >
            Home
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/events"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Events
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/create-events"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Create Event
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/profile"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Profile
          </DisclosureButton>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
