import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AudioPlayerProps {
  audioUrl: string;
  trackName?: string;
}

const WaveBars = ({ playing }: { playing: boolean }) => (
  <div className="flex items-end gap-0.5 h-8" aria-hidden>
    {[1, 1.5, 2, 1.7, 1.2, 1.8, 1.4, 1, 1.6].map((delay, i) => (
      <span
        key={i}
        className="wave-bar"
        style={{
          height: `${20 + i * 3}%`,
          animationDuration: playing ? `${0.8 + delay * 0.2}s` : "0s",
          animationPlayState: playing ? "running" : "paused",
          animationDelay: `${i * 0.07}s`,
          opacity: playing ? 1 : 0.3,
          transition: "opacity 0.3s ease",
        }}
      />
    ))}
  </div>
);

const formatTime = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function AudioPlayer({ audioUrl, trackName = "Your Therapeutic Track" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const handleSeek = ([v]: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = v;
    setCurrentTime(v);
  };

  const handleVolume = ([v]: number[]) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
    if (v > 0) setMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    setMuted(next);
    audioRef.current.volume = next ? 0 : volume / 100;
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play();
    setPlaying(true);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "melodymatrix-track.wav";
    a.click();
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-6 space-y-4">
        <audio ref={audioRef} src={audioUrl} preload="auto" />

        {/* Track info + visualizer */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Now Playing</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{trackName}</p>
          </div>
          <WaveBars playing={playing} />
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
            aria-label="Seek position"
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={toggle}
              size="icon"
              className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 shadow-md animate-pulse-ring"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            <Button
              onClick={restart}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 flex-1 max-w-36">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[muted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolume}
              className="cursor-pointer"
              aria-label="Volume"
            />
          </div>

          <Button
            onClick={download}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
