import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Video, Download, Play, Clock, Film } from "lucide-react";
import { toast } from "sonner";

interface VideoItem {
  id: number;
  videoId: string;
  niche: string;
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  status: string;
  createdAt: Date;
  scenes?: any[];
}

export function VideoGallery() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const { isConnected, on, off } = useWebSocket();

  const videosQuery = trpc.video.list.useQuery(
    { limit: 20 },
    {
      refetchInterval: 5000
    }
  );

  useEffect(() => {
    if (videosQuery.data) {
      setVideos(videosQuery.data.videos as VideoItem[]);
    }
  }, [videosQuery.data]);

  // Setup WebSocket listeners for new videos
  useEffect(() => {
    if (!isConnected) return;

    on('video_completed', (data: any) => {
      toast.success("New video completed!");
      videosQuery.refetch();
    });

    return () => {
      off('video_completed');
    };
  }, [isConnected, videosQuery]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-green-500/10 text-green-400 border-green-500/20",
      processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      failed: "bg-red-500/10 text-red-400 border-red-500/20",
      cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/20"
    };

    return (
      <Badge variant="outline" className={variants[status] || variants.pending}>
        {status}
      </Badge>
    );
  };

  const handleDownload = (videoUrl: string, videoId: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video-${videoId}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  if (videos.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-slate-900/50 mb-4">
              <Video className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No videos yet</h3>
            <p className="text-sm text-slate-500">
              Generate your first video to see it here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Generated Videos</h2>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
          {videos.length} Total
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card key={video.id} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm text-white truncate">
                    {video.niche}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {video.prompt}
                  </CardDescription>
                </div>
                {getStatusBadge(video.status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Video Preview */}
              {video.videoUrl && video.status === 'completed' ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900">
                  <video
                    src={video.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster={video.thumbnailUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                  <Film className="w-12 h-12 text-slate-600" />
                  {video.status === 'processing' && (
                    <div className="absolute inset-0 bg-purple-500/10 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-purple-400">Generating...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Video Info */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{video.duration || 30}s</span>
                </div>
                {video.scenes && (
                  <div className="flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    <span>{video.scenes.length} scenes</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {video.videoUrl && video.status === 'completed' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-slate-900/50 border-slate-600 hover:bg-slate-900 hover:border-purple-500"
                    onClick={() => window.open(video.videoUrl, '_blank')}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-slate-900/50 border-slate-600 hover:bg-slate-900 hover:border-purple-500"
                    onClick={() => handleDownload(video.videoUrl!, video.videoId)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-slate-500 text-center">
                {new Date(video.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
