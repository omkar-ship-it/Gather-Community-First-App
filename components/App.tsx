"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { Store, useStore, type Screen } from "@/lib/store";
import Dial from "./Dial";
import Onboarding from "./Onboarding";
import { Arrival, ChannelScreen, CommunityScreen, GroupScreen } from "./Community";
import { ChatScreen, EventScreen, MeScreen, PersonScreen, RoomScreen } from "./Screens";
import Sheets from "./Sheets";
import { Events, Home, Messages, TabBar } from "./Tabs";

const never = () => () => {};

/** Client-only: the prototype's clock starts when you open it. */
export default function App() {
  const ready = useSyncExternalStore(never, () => true, () => false);
  return (
    <main className="stage">
      <div className="device">{ready && <Store><Phone /></Store>}</div>
    </main>
  );
}

function view(sc: Screen) {
  switch (sc.t) {
    case "community": return <CommunityScreen id={sc.id} initial={sc.tab} />;
    case "channel": return <ChannelScreen id={sc.id} />;
    case "chat": return sc.thread.startsWith("g:") ? <GroupScreen id={sc.thread.slice(2)} initial={sc.tab} /> : <ChatScreen thread={sc.thread} draft={sc.draft} />;
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
          <motion.div key={`${i}-${JSON.stringify({ ...sc, tab: sc.t === "chat" ? sc.tab : undefined, draft: undefined })}`} className="absolute inset-0 z-30 bg-[var(--bg)]" inert={i < s.stack.length - 1} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}>
            {view(sc)}
          </motion.div>
        ))}
      </AnimatePresence>
      {s.auth !== null && <Onboarding />}
      <AnimatePresence>{s.dial && <Dial />}</AnimatePresence>
      <AnimatePresence>{s.me && s.auth === null && s.arrival && !s.dial && <Arrival key={s.arrival.id} id={s.arrival.id} groupId={s.arrival.groupId} />}</AnimatePresence>
      <Sheets />
      <AnimatePresence>
        {s.toast && <motion.p role="status" className="pointer-events-none absolute inset-x-0 bottom-28 z-[60] mx-auto w-fit max-w-[84%] rounded-full bg-[var(--ink)] px-5 py-3 text-center text-[15px] font-medium text-white" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{s.toast}</motion.p>}
      </AnimatePresence>
    </MotionConfig>
  );
}
