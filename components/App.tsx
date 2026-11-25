"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { pretty } from "@/lib/ids";
import { Store, useStore, type Screen } from "@/lib/store";
import Dial from "./Dial";
import Onboarding from "./Onboarding";
import { ChatScreen, CommunityScreen, EventScreen, MeScreen, PersonScreen, RoomScreen } from "./Screens";
import Sheets from "./Sheets";
import { Events, Home, Messages, TabBar } from "./Tabs";

const never = () => () => {};

/** Client-only: the prototype's clock starts when you open it. */
export default function App() {
  const ready = useSyncExternalStore(never, () => true, () => false);
  return (
    <main className="stage">
      <div className="device">{ready && <Store><Phone /></Store>}</div>
      <aside id="guide" className="hidden min-[980px]:block"><Guide /></aside>
    </main>
  );
}

function view(sc: Screen) {
  switch (sc.t) {
    case "community": return <CommunityScreen id={sc.id} initial={sc.tab} />;
    case "chat": return <ChatScreen thread={sc.thread} draft={sc.draft} />;
    case "person": return <PersonScreen id={sc.id} />;
    case "event": return <EventScreen id={sc.id} />;
    case "room": return <RoomScreen id={sc.id} />;
    case "me": return <MeScreen />;
  }
}

function Phone() {
  const { s } = useStore();
  return (
    <MotionConfig reducedMotion="user">
      {s.me && s.auth === null && (
        <div className="absolute inset-0" inert={s.stack.length > 0 || s.dial}>
          {s.tab === "communities" ? <Home /> : s.tab === "messages" ? <Messages /> : <Events />}
          <TabBar />
        </div>
      )}
      <AnimatePresence>
        {s.stack.map((sc, i) => (
          <motion.div key={`${i}-${JSON.stringify({ ...sc, tab: undefined, draft: undefined })}`} className="absolute inset-0 z-30 bg-[var(--bg)]" inert={i < s.stack.length - 1} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}>
            {view(sc)}
          </motion.div>
        ))}
      </AnimatePresence>
      {s.auth !== null && <Onboarding />}
      <AnimatePresence>{s.dial && <Dial />}</AnimatePresence>
      <Sheets />
      <AnimatePresence>
        {s.toast && <motion.p role="status" className="pointer-events-none absolute inset-x-0 bottom-28 z-[60] mx-auto w-fit max-w-[84%] rounded-full bg-[var(--ink)] px-5 py-3 text-center text-[15px] font-medium text-white" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{s.toast}</motion.p>}
      </AnimatePresence>
    </MotionConfig>
  );
}

/** Beside the phone on a desktop: what to dial. */
function Guide() {
  const rows: [string, string][] = [["992104", "A live event room, closing in minutes"], ["804219", "HSR Founders Circle"], ["846112", "Board Game Basement, not joined yet"], ["871503", "A community where a host says yes"], ["731806", "The Fundraising group"], ["31904472", "Rohan, who writes first cheques"], ["22847619", "Sara, who's raising"]];
  return (
    <div className="max-w-[300px]">
      <h2 className="text-[19px] font-semibold tracking-[-0.01em]">Try dialling</h2>
      <p className="mt-1 text-[15px] leading-snug text-[var(--soft)]">Open Enter an ID and type one of these. Your keyboard works too.</p>
      <ul className="mt-4">
        {rows.map(([d, l]) => <li key={d} className="border-t border-[#d6cad2] py-3"><span className="digits block text-[18px]">{pretty(d)}</span><span className="text-[14.5px] text-[var(--soft)]">{l}</span></li>)}
      </ul>
      <p className="mt-2 text-[14.5px] leading-snug text-[var(--soft)]">The first digit says what it is: 2 to 5 a person, 7 a group, 8 a community, 9 a room.</p>
    </div>
  );
}
