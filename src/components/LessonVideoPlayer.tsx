import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, User, MonitorPlay, XCircle } from 'lucide-react';
import { LessonVideo, VideoScene } from '../types';
import { Button, Card } from './ui';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface LessonVideoPlayerProps {
  video: LessonVideo;
  onClose?: () => void;
}

export function LessonVideoPlayer({ video, onClose }: LessonVideoPlayerProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const scenes = Array.isArray(video.scenes) ? video.scenes : [];
  const currentScene = scenes[currentSceneIndex];
  const hasScenes = scenes.length > 0;
  const isFinalVideo = !!video.finalVideoUrl;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  useEffect(() => {
    if (!isFinalVideo && isPlaying && hasScenes && currentScene?.audioUrl) {
      const audio = new Audio(currentScene.audioUrl);
      audioRef.current = audio;
      audio.play().catch(err => {
        console.error("Audio playback failed:", err);
        setTimeout(() => {
           if (currentSceneIndex < scenes.length - 1) {
            setCurrentSceneIndex(prev => prev + 1);
          } else {
            setIsPlaying(false);
          }
        }, 3000);
      });
      
      audio.onended = () => {
        if (currentSceneIndex < scenes.length - 1) {
          setCurrentSceneIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      };

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [isPlaying, currentSceneIndex, currentScene?.audioUrl, scenes.length, isFinalVideo]);

  const togglePlay = () => {
    if (isFinalVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-6xl aspect-video bg-gray-900 overflow-hidden relative border-none shadow-2xl">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>

        {/* Video Content Area */}
        <div className="absolute inset-0 flex">
          {isFinalVideo ? (
            <video 
              ref={videoRef}
              src={video.finalVideoUrl}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              controls={false}
            />
          ) : (
            <>
              {/* Visual Area */}
              <div className="flex-1 relative bg-indigo-950/20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScene.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center p-12"
                  >
                    {currentScene.visualUrl ? (
                      <img 
                        src={currentScene.visualUrl} 
                        alt={currentScene.title}
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-900/30 rounded-2xl flex items-center justify-center border-4 border-dashed border-indigo-500/30">
                        <MonitorPlay className="w-24 h-24 text-indigo-400/50" />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* On-Screen Text Overlay */}
                <div className="absolute bottom-12 left-12 right-12 z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentScene.id + '-text'}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex flex-wrap gap-3"
                    >
                      {currentScene.onScreenText.map((text, i) => (
                        <div 
                          key={i}
                          className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 text-white text-2xl font-black shadow-xl"
                        >
                          {text}
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Avatar Overlay (if enabled) */}
              {video.avatarSettings.enabled && (
                <div className={cn(
                  "absolute z-20 transition-all duration-500",
                  video.avatarSettings.placement === 'Corner' ? "bottom-8 right-8 w-64 aspect-square" :
                  video.avatarSettings.placement === 'Full Screen' ? "inset-0" :
                  "right-0 top-0 bottom-0 w-1/3"
                )}>
                  <div className="w-full h-full bg-indigo-600/20 backdrop-blur-sm border-4 border-white/20 rounded-2xl overflow-hidden flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent" />
                    <User className="w-1/2 h-1/2 text-white/50" />
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="text-white font-black text-sm uppercase tracking-widest bg-indigo-600 px-3 py-1 rounded-full">
                        {video.avatarSettings.style}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/90 to-transparent flex items-center px-8 gap-6 z-30">
          <Button
            size="lg"
            variant="ghost"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-white text-black hover:bg-gray-200"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </Button>

          {!isFinalVideo && (
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-black text-white/50 uppercase tracking-widest">
                <span className="truncate max-w-[300px]">{currentScene.title}</span>
                <span>Scene {currentSceneIndex + 1} of {scenes.length}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500"
                  initial={false}
                  animate={{ width: `${((currentSceneIndex + 1) / scenes.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {isFinalVideo && (
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
               <div 
                className="h-full bg-indigo-500 transition-all duration-100"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          )}

          {!isFinalVideo && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentSceneIndex === 0}
                onClick={() => setCurrentSceneIndex(prev => prev - 1)}
                className="text-white hover:bg-white/10"
              >
                <SkipBack className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentSceneIndex === scenes.length - 1}
                onClick={() => setCurrentSceneIndex(prev => prev + 1)}
                className="text-white hover:bg-white/10"
              >
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
