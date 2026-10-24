import { useEffect, useRef } from "react";

const STORAGE_PREFIX = "swipevocab:";
const PROFILE_ID_KEY = "swipevocab:profileId";
const LOCAL_STATE_EVENT = "swipevocab:state-changed";
const RESTORE_EVENT = "swipevocab:restore";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getProfileId() {
  let id = window.localStorage.getItem(PROFILE_ID_KEY);
  if (!UUID_RE.test(id || "")) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(PROFILE_ID_KEY, id);
  }
  return id;
}

function readLocalState() {
  const state = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(STORAGE_PREFIX) || key === PROFILE_ID_KEY) continue;
    try {
      state[key.slice(STORAGE_PREFIX.length)] = JSON.parse(window.localStorage.getItem(key));
    } catch {
      // Ignore corrupt local values and let the app keep its default.
    }
  }
  return state;
}

function writeRemoteStateLocally(state) {
  for (const [key, value] of Object.entries(state)) {
    if (!key || key === "profileId") continue;
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch {
      // Existing local state remains available if browser storage is full.
    }
  }
  window.dispatchEvent(new CustomEvent(RESTORE_EVENT, { detail: state }));
}

export function useRemoteProgressSync(profile) {
  const profileRef = useRef(profile);
  const profileIdRef = useRef(null);
  const readyRef = useRef(false);
  const suppressUntilRef = useRef(0);
  const timerRef = useRef(null);
  profileRef.current = profile;

  useEffect(() => {
    const profileId = getProfileId();
    profileIdRef.current = profileId;
    let cancelled = false;

    const save = async () => {
      if (!readyRef.current || Date.now() < suppressUntilRef.current) return;
      try {
        await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            profile: profileRef.current,
            state: readLocalState(),
          }),
        });
      } catch {
        // Keep the app usable offline; the next local change retries the sync.
      }
    };

    const scheduleSave = () => {
      if (!readyRef.current || Date.now() < suppressUntilRef.current) return;
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(save, 900);
    };

    const onLocalStateChanged = () => scheduleSave();
    window.addEventListener(LOCAL_STATE_EVENT, onLocalStateChanged);

    async function hydrate() {
      try {
        const response = await fetch(`/api/progress?profileId=${encodeURIComponent(profileId)}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const remote = await response.json();
          if (remote.state && typeof remote.state === "object" && !Array.isArray(remote.state)) {
            suppressUntilRef.current = Date.now() + 1500;
            writeRemoteStateLocally(remote.state);
          }
        }
      } catch {
        // Vercel can be offline or the local SQL tunnel can be stopped.
      }

      if (cancelled) return;
      readyRef.current = true;
      window.setTimeout(scheduleSave, 1600);
    }

    void hydrate();
    return () => {
      cancelled = true;
      window.clearTimeout(timerRef.current);
      window.removeEventListener(LOCAL_STATE_EVENT, onLocalStateChanged);
    };
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    window.dispatchEvent(new Event(LOCAL_STATE_EVENT));
  }, [profile.displayName, profile.learningGoal, profile.placementLevel]);
}
