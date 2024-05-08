import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import TopBar from "@/components/shared/TopBar";
import LeftSideBar from "@/components/shared/LeftSideBar";
import RightSideBar from "@/components/shared/RightSideBar";
import BottomBar from "@/components/shared/BottomBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Threads',
  description: 'DHAAGE',
}



function Header() {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", padding: 20 }}>
      <h1>My App</h1>
      <SignedIn>
        {/* Mount the UserButton component */}
        <UserButton />
      </SignedIn>
      <SignedOut>
        {/* Signed out users get sign in button */}
        <SignInButton/>
      </SignedOut>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
        {/* <Header /> */}
          <body className={inter.className}>
            <TopBar/>
              <main className="flex flex-row">
                <LeftSideBar/>
                  <section className="main-container">
                    <div className="w-full w-max-4xl">
                      {children}
                    </div>
                  </section>
                {/* <RightSideBar/> */}
              </main>
            <BottomBar/>
          </body>
      </ClerkProvider>
    </html>
  );
}
