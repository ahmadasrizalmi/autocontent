import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";
import { X, CheckCircle, Film, Clapperboard } from "lucide-react";
import { toast } from "sonner";

interface VideoProgressProps {
  videoId: string;
  onComplete?: (videoUrl: string) => void;
  onCancel?: () => void;
}

export function VideoProgress({ videoId, onComplete, onCancel }: VideoProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [currentScene, setCurrentScene] = useState(0);
  const [totalScenes, setTotalScenes] = useState(0);
  const [status, setStatus] = useState("processing");

  const { isConnected, on, off } = useWebSocket();

  // Query video status
  const statusQuery = trpc.video.status.useQuery(
    { videoId },
    {
      refetchInterval: 3000,
      enabled: status === "processing" || status === "pending"
    }
  );

  const cancelMutation = trpc.video.cancel.useMutation({
    onSuccess: () => {
      toast.info("Video generation cancelled");
      if (onCancel) onCancel();
    },
    onError: (error) => {
      toast.error(`Failed to cancel: ${error.message}`);
    }
  });

  // Update from query
  useEffect(() => {
    if (statusQuery.data) {
      setProgress(statusQuery.data.progress);
      setStatus(statusQuery.data.status);
      setCurrentScene(statusQuery.data.currentScene || 0);
      setTotalScenes(statusQuery.data.totalScenes || 0);

      if (statusQuery.data.status === "completed" && statusQuery.data.videoUrl) {
        if (onComplete) {
          onComplete(statusQuery.data.videoUrl);
        }
      }
    }
  }, [statusQuery.data, onComplete]);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!isConnected) return;

    on('video_generation_started', (data: any) => {
      if (data.videoId === videoId) {
        setProgress(data.progress || 0);
        setCurrentStep(data.currentStep || "Starting...");
      }
    });

    on('video_storyboard_created', (data: any) => {
      if (data.videoId === videoId) {
        setProgress(data.progress || 20);
        setCurrentStep("Storyboard created");
        setTotalScenes(data.storyboard?.scenes?.length || 0);
      }
    });

    on('video_scene_processing', (data: any) => {
      if (data.videoId === videoId) {
        setProgress(data.progress || 0);
        setCurrentStep(`Generating scene ${data.currentScene}/${data.totalScenes}`);
        setCurrentScene(data.currentScene || 0);
        setTotalScenes(data.totalScenes || 0);
      }
    });

    on('video_scene_completed', (data: any) => {
      if (data.videoId === videoId) {
        setProgress(data.progress || 0);
        toast.success(`Scene ${data.sceneNumber}/${data.totalScenes} completed`);
      }
    });

    on('video_combining_scenes', (data: any) => {
      if (data.videoId === videoId) {
        setProgress(data.progress || 85);
        setCurrentStep("Combining scenes");
      }
    });

    on('video_completed', (data: any) => {
      if (data.videoId === videoId) {
        setProgress(100);
        setStatus("completed");
        setCurrentStep("Completed!");
        toast.success("Video generation completed!");
        
        if (onComplete && data.videoUrl) {
          onComplete(data.videoUrl);
        }
      }
    });

    on('video_failed', (data: any) => {
      if (data.videoId === videoId) {
        setStatus("failed");
        setCurrentStep("Failed");
        toast.error(`Video generation failed: ${data.error}`);
      }
    });

    on('video_cancelled', (data: any) => {
      if (data.videoId === videoId) {
        setStatus("cancelled");
        setCurrentStep("Cancelled");
      }
    });

    return () => {
      off('video_generation_started');
      off('video_storyboard_created');
      off('video_scene_processing');
      off('video_scene_completed');
      off('video_combining_scenes');
      off('video_completed');
      off('video_failed');
      off('video_cancelled');
    };
  }, [isConnected, videoId, onComplete]);

  const handleCancel = () => {
    cancelMutation.mutate({ videoId });
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "cancelled":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Film className="w-4 h-4 animate-pulse" />;
      default:
        return <Clapperboard className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              {getStatusIcon()}
            </div>
            <div>
              <CardTitle className="text-base text-white">Video Generation</CardTitle>
              <p className="text-sm text-slate-400 mt-1">ID: {videoId.slice(0, 8)}...</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor()}>
              {status}
            </Badge>
            
            {(status === "processing" || status === "pending") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="text-slate-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">{currentStep || "Initializing..."}</span>
            <span className="text-slate-400">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Scene Progress */}
        {totalScenes > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
            <span className="text-sm text-slate-400">Scenes Progress</span>
            <span className="text-sm font-medium text-purple-400">
              {currentScene - 1}/{totalScenes} completed
            </span>
          </div>
        )}

        {/* Estimated Time */}
        {status === "processing" && (
          <p className="text-xs text-slate-500 text-center">
            This may take 3-5 minutes depending on video length and complexity
          </p>
        )}
      </CardContent>
    </Card>
  );
}
