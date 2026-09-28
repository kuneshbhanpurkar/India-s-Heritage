import React, { useState } from 'react';
import { MediaItem } from '../types';

interface MediaModalProps {
  media: MediaItem | null;
  onClose: () => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({ media, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  if (!media) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-[#1c1b1b] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 bg-black/60 flex items-center justify-between border-b border-white/10 text-white">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[#a14009] text-[10px] font-bold uppercase tracking-wider">
              {media.badge}
            </span>
            <h3 className="font-serif text-base sm:text-lg font-bold truncate max-w-lg">
              {media.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Close viewer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Video Player Stage */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
          <img
            src={media.image}
            alt={media.title}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isPlaying ? 'opacity-85' : 'opacity-50'
            }`}
          />

          {/* Video Controls Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-black/80 via-transparent to-black/40">
            <div className="flex justify-between items-center text-xs text-white/80 font-mono">
              <span>Resolution: Ultra-HD 4K 60FPS</span>
              <span>Audio: Binaural Spatial Master</span>
            </div>

            {/* Central Play/Pause Trigger */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-[#a14009] hover:bg-[#843e1d] text-white flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
            </div>

            {/* Bottom scrubber and buttons */}
            <div className="flex flex-col gap-2">
              <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden cursor-pointer">
                <div
                  className={`bg-[#a14009] h-full ${isPlaying ? 'w-2/5 animate-pulse' : 'w-2/5'}`}
                ></div>
              </div>
              <div className="flex items-center justify-between text-white text-xs font-mono">
                <span>04:12 / {media.duration}</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="hover:text-[#ffe088] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">subtitles</span>
                    <span>Transcript</span>
                  </button>
                  <span className="text-[#ffe088]">{media.meta}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Media Details & Curatorial Note */}
        <div className="p-5 sm:p-6 bg-[#222121] text-white flex flex-col gap-3">
          <p className="text-sm text-neutral-300 leading-relaxed">{media.description}</p>

          {showTranscript && (
            <div className="p-3 bg-black/40 rounded-lg text-xs text-neutral-300 border border-white/10 font-sans">
              <strong className="block text-[#ffe088] mb-1 font-mono uppercase text-[10px]">
                Audio Commentary Transcript (National Digital Archives):
              </strong>
              "{media.description || `Standing before the monumental site of ${media.title}, we observe the verified historical documentation and architectural preservation recorded under the Dharohar National Registry.`}"
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-white/10 text-xs text-neutral-400">
            <span>Repository: {media.meta || 'National Heritage Photographic Archive'}</span>
            <button
              onClick={() => alert('Ultra-HD 4K Photogrammetric asset requested for download.')}
              className="text-[#ffe088] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download Digital Asset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
