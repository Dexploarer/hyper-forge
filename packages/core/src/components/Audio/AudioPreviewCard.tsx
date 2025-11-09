import { Play, Pause, Download, Volume2 } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../common'
import type { GeneratedAudio } from '@/types/audio'

interface AudioPreviewCardProps {
  audio: GeneratedAudio
}

export const AudioPreviewCard: React.FC<AudioPreviewCardProps> = ({ audio }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return

    const updateTime = () => setCurrentTime(audioEl.currentTime)
    const updateDuration = () => setDuration(audioEl.duration)
    const handleEnded = () => setIsPlaying(false)

    audioEl.addEventListener('timeupdate', updateTime)
    audioEl.addEventListener('loadedmetadata', updateDuration)
    audioEl.addEventListener('ended', handleEnded)

    return () => {
      audioEl.removeEventListener('timeupdate', updateTime)
      audioEl.removeEventListener('loadedmetadata', updateDuration)
      audioEl.removeEventListener('ended', handleEnded)
    }
  }, [audio.audioUrl])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = audio.audioUrl
    link.download = `${audio.name}.mp3`
    link.click()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-primary/5 border-border-primary shadow-lg">
      <CardHeader>
        <CardTitle>{audio.name}</CardTitle>
        <CardDescription className="capitalize">{audio.type} Generation</CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Waveform Placeholder */}
        <div className="h-24 bg-bg-tertiary rounded-lg flex items-center justify-center border border-border-primary">
          <div className="flex items-end gap-1 h-16">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="w-2 bg-primary/40 rounded-t transition-all"
                style={{
                  height: `${Math.sin(i * 0.5) * 30 + 40}%`,
                  opacity: i / 32 < currentTime / duration ? 1 : 0.3
                }}
              />
            ))}
          </div>
        </div>

        {/* Audio Controls */}
        <div className="space-y-4">
          {/* Play/Pause & Download */}
          <div className="flex items-center gap-3">
            <Button
              onClick={togglePlayPause}
              variant="primary"
              className="w-12 h-12 rounded-full p-0 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            {/* Time Display */}
            <div className="flex-1 space-y-2">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <Button
              onClick={handleDownload}
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-text-tertiary" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1"
            />
            <span className="text-xs text-text-tertiary w-12 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-border-primary">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Metadata</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(audio.metadata).map(([key, value]) => (
              <div key={key}>
                <span className="text-text-tertiary capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span className="text-text-primary ml-2">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audio.audioUrl}
          preload="metadata"
        />
      </CardContent>
    </Card>
  )
}
