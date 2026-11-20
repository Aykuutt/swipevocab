// LiveKit odasına yalnızca sesle bağlanır ve odanın durumunu izler.
import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";

/**
 * status: connecting | connected | ended | error
 * error: "mic_denied" | "connect_failed"
 */
export function useVoiceRoom({ url, token }) {
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState(null);
  const [partnerHere, setPartnerHere] = useState(false);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const [speaking, setSpeaking] = useState({ me: false, partner: false });
  const [muted, setMuted] = useState(false);
  const [needsAudioStart, setNeedsAudioStart] = useState(false);
  const roomRef = useRef(null);

  useEffect(() => {
    if (!url || !token) return;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;
    const audioEls = new Set();
    let cancelled = false;

    const syncPartner = () => setPartnerHere(room.remoteParticipants.size > 0);

    room
      .on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio) return;
        const el = track.attach();
        el.style.display = "none";
        document.body.appendChild(el);
        audioEls.add(el);
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => {
          el.remove();
          audioEls.delete(el);
        });
      })
      .on(RoomEvent.ParticipantConnected, () => {
        syncPartner();
        setPartnerLeft(false);
      })
      .on(RoomEvent.ParticipantDisconnected, () => {
        syncPartner();
        if (room.remoteParticipants.size === 0) setPartnerLeft(true);
      })
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const me = room.localParticipant.identity;
        setSpeaking({
          me: speakers.some((p) => p.identity === me),
          partner: speakers.some((p) => p.identity !== me),
        });
      })
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setNeedsAudioStart(!room.canPlaybackAudio))
      .on(RoomEvent.Disconnected, () => {
        if (!cancelled) setStatus("ended");
      });

    (async () => {
      try {
        await room.connect(url, token);
        if (cancelled) return;
        syncPartner();
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch {
          if (!cancelled) {
            setError("mic_denied");
            setStatus("error");
          }
          return;
        }
        setNeedsAudioStart(!room.canPlaybackAudio);
        setStatus("connected");
      } catch {
        if (!cancelled) {
          setError("connect_failed");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      room.disconnect();
      audioEls.forEach((el) => el.remove());
      roomRef.current = null;
    };
  }, [url, token]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  }, [muted]);

  const startAudio = useCallback(async () => {
    await roomRef.current?.startAudio();
    setNeedsAudioStart(false);
  }, []);

  const leave = useCallback(() => roomRef.current?.disconnect(), []);

  return { status, error, partnerHere, partnerLeft, speaking, muted, toggleMute, needsAudioStart, startAudio, leave };
}
