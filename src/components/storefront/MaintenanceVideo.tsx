"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

type Props = {
  videoId: string;
  staticHero: React.ReactNode;
  hero: React.ReactNode;
};

type YTPlayer = {
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  destroy: () => void;
  getPlayerState: () => number;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: Record<string, unknown>
      ) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; UNSTARTED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function MaintenanceVideo({ videoId, staticHero, hero }: Props) {
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = () => {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            // Try unmuted first (user wants sound on). Browsers usually block
            // this — the fallback below catches it and falls back to muted
            // autoplay with a tap-for-sound prompt.
            try {
              e.target.unMute();
            } catch {}
            e.target.playVideo();
            setTimeout(() => {
              if (cancelled || !playerRef.current || !window.YT) return;
              const state = playerRef.current.getPlayerState();
              if (state !== window.YT.PlayerState.PLAYING) {
                playerRef.current.mute();
                setMuted(true);
                playerRef.current.playVideo();
              }
            }, 1200);
          },
          onStateChange: (e: { data: number }) => {
            if (!window.YT) return;
            if (e.data === window.YT.PlayerState.PLAYING) {
              setStarted(true);
            }
            if (e.data === window.YT.PlayerState.ENDED) {
              setEnded(true);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      init();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        init();
      };
    }

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {}
    };
  }, [videoId]);

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      playerRef.current.playVideo();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  };

  if (ended) {
    return <div className="animate-in fade-in duration-700">{staticHero}</div>;
  }

  return (
    <div className="animate-in fade-in duration-500 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {hero}
      <div className="w-full flex justify-center px-4 pt-8 pb-12">
        <div className="w-full max-w-3xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl bg-black">
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />
            {/* Transparent overlay blocks clicks on the YouTube iframe (disables all in-player controls) */}
            <div className="absolute inset-0" aria-hidden />
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="absolute z-10 bottom-4 right-4 h-11 w-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            {muted && started && (
              <button
                type="button"
                onClick={toggleMute}
                className="absolute z-10 top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 hover:bg-white text-black text-sm font-medium px-4 py-2 shadow-md transition-colors flex items-center gap-2"
              >
                <Volume2 className="h-4 w-4" />
                Tap for sound
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
