import React from 'react';
import { MediaItem } from '../types';

interface MediaModalProps {
  media: MediaItem | null;
  onClose: () => void;
}

function getEmbedUrl(url?: string): { isEmbed: boolean; embedUrl: string } {
  if (!url) return { isEmbed: false, embedUrl: '' };

  const trimmed = url.trim();

  // YouTube matchers
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,15})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      isEmbed: true,
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // Vimeo matcher
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      isEmbed: true,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  return { isEmbed: false, embedUrl: trimmed };
}

export const MediaModal: React.FC<MediaModalProps> = ({ media, onClose }) => {
  if (!media) return null;

  const rawVideoUrl = media.videoUrl || (media.category === 'Documentary Films' || media.badge === 'Video Record' ? media.image : undefined);
  const isVideo = Boolean(media.videoUrl || media.category === 'Documentary Films' || media.badge === 'Video Record');
  const embedInfo = isVideo && rawVideoUrl ? getEmbedUrl(rawVideoUrl) : { isEmbed: false, embedUrl: '' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#1c1b1b] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 bg-black/70 flex items-center justify-between border-b border-white/10 text-white">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[#a14009] text-[10px] font-bold uppercase tracking-wider">
              {media.badge || (isVideo ? 'Video Record' : 'Official Archive')}
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

        {/* Media Stage: Real Video Player / YouTube Embed / Image */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
          {isVideo && embedInfo.isEmbed ? (
            <iframe
              src={embedInfo.embedUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={media.title}
            />
          ) : isVideo && rawVideoUrl ? (
            <video
              src={rawVideoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
              poster={media.image || undefined}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={media.image}
              alt={media.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Media Details */}
        <div className="p-5 sm:p-6 bg-[#222121] text-white flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="uppercase tracking-widest font-semibold text-[#a14009]">{media.category}</span>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed">{media.description}</p>
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-white/10 text-xs text-neutral-400">
            <span>Repository: {media.meta || 'Official Heritage Archive'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
