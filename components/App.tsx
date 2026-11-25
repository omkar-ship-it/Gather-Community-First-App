"use client";

import { AnimatePresence, MotionConfig, motion, useDragControls } from "framer-motion";
import { useState, useSyncExternalStore } from "react";
import { Store, useStore, type Screen } from "@/lib/store";
import Dial from "./Dial";
import Onboarding from "./Onboarding";
import { Meet, Moments, NudgeBanner, Sending } from "./Peaks";
import { Arrival, ChannelScreen, CommunityScreen, EventsScreen, PeopleScreen } from "./Community";
import MoveIn from "./MoveIn";
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
    case "community": return <CommunityScreen id={sc.id} />;
    case "people": return <PeopleScreen id={sc.id} groupId={sc.groupId} />;
    case "events": return <EventsScreen id={sc.id} />;
    case "channel": return <ChannelScreen id={sc.id} />;
    case "chat": return <ChatScreen thread={sc.thread} draft={sc.draft} />;
    case "person": return <PersonScreen id={sc.id} />;
    case "event": return <EventScreen id={sc.id} />;
    case "room": return <RoomScreen id={sc.id} />;
    case "movein": return <MoveIn id={sc.id} />;
    case "me": return <MeScreen />;
  }
}

/** Ways a screen can arrive: a community grows out of the card you touched, everything else slides over. */
function Layer({ sc, i, top, children }: { sc: Screen; i: number; top: boolean; children: React.ReactNode }) {
  const { act } = useStore();
  const controls = useDragControls();
  const [flung, setFlung] = useState(false);
  const f = sc.t === "community" ? sc.from : undefined;
  const closed = f ? { clipPath: `inset(${f.t}px ${f.r}px ${f.b}px ${f.l}px round 24px)`, opacity: 0.4 } : { x: "100%" };
  const open = f ? { clipPath: "inset(0px 0px 0px 0px round 0px)", opacity: 1, x: 0 } : { x: 0 };
  return (
    <motion.div
      className="absolute inset-0 bg-[var(--bg)]" style={{ zIndex: 30 + i }} inert={!top}
      initial={closed} animate={open} exit={flung || !f ? { x: "100%" } : { ...closed, opacity: 0, transition: { clipPath: { duration: 0.32, ease: EASE }, opacity: { duration: 0.18, delay: 0.16 } } }}
      transition={f ? { clipPath: { duration: 0.42, ease: EASE }, opacity: { duration: 0.2 }, x: SLIDE } : SLIDE}
      drag="x" dragListener={false} dragControls={controls} dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0, right: 1 }}
      onDragEnd={(_, d) => { if (d.offset.x > 110 || d.velocity.x > 500) { setFlung(true); act.pop(); } }}
    >
      {children}
      <span className="absolute bottom-24 left-0 top-20 z-40 w-3.5 touch-none" onPointerDown={(e) => controls.start(e)} aria-hidden="true" />
    </motion.div>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;
const SLIDE = { type: "spring", stiffness: 380, damping: 40 } as const;

function Phone() {
  const { s } = useStore();
  const depth = s.stack.length > 0;
  return (
    <MotionConfig reducedMotion="user">
      {s.me && s.auth === null && (
        <motion.div className="absolute inset-0" animate={{ scale: depth ? 0.94 : 1, opacity: depth ? 0.6 : 1 }} transition={{ duration: 0.36, ease: EASE }} inert={depth || s.dial || s.moments}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={s.tab} className="absolute inset-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {s.tab === "communities" ? <Home /> : s.tab === "messages" ? <Messages /> : <Events />}
            </motion.div>
          </AnimatePresence>
          <TabBar />
        </motion.div>
      )}
      <AnimatePresence>
        {s.stack.map((sc, i) => <Layer key={`${i}-${sc.t}-${JSON.stringify({ ...sc, draft: undefined, from: undefined })}`} sc={sc} i={i} top={i === s.stack.length - 1 && !s.arrival && !s.meet}>{view(sc)}</Layer>)}
      </AnimatePresence>
      {s.auth !== null && <Onboarding />}
      <AnimatePresence>{s.dial && <Dial />}</AnimatePresence>
      <AnimatePresence>{s.me && s.auth === null && s.arrival && !s.dial && <Arrival key={s.arrival.id} id={s.arrival.id} groupId={s.arrival.groupId} />}</AnimatePresence>
      <Moments />
      <Sheets />
      <Meet />
      <Sending />
      <NudgeBanner />
      <AnimatePresence>
        {s.toast && <motion.p role="status" className="pointer-events-none absolute inset-x-0 bottom-28 z-[60] mx-auto w-fit max-w-[84%] rounded-full bg-[var(--ink)] px-5 py-3 text-center text-[15px] font-medium text-white" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{s.toast}</motion.p>}
      </AnimatePresence>
    </MotionConfig>
  );
}
