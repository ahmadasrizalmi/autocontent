import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Video, Loader2, Sparkles } from "lucide-react";

interface VideoGeneratorProps {
  onVideoGenerated?: (videoId: string) => void;
}

export function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [niche, setNiche] = useState("");
  const [sceneCount, setSceneCount] = useState([3]);
  const [duration, setDuration] = useState([30]);

  const generateMutation = trpc.video.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Video generation started!");
      setPrompt("");
      setNiche("");
      if (onVideoGenerated) {
        onVideoGenerated(data.videoId);
      }
    },
    onError: (error) => {
      toast.error(`Failed to start video generation: ${error.message}`);
    }
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a video prompt");
      return;
    }

    generateMutation.mutate({
      prompt: prompt.trim(),
      niche: niche.trim() || undefined,
      sceneCount: sceneCount[0],
      totalDuration: duration[0]
    });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Generate Video</CardTitle>
            <CardDescription className="text-slate-400">
              Create multi-angle story videos with AI
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-slate-300">
            Video Prompt *
          </Label>
          <Textarea
            id="prompt"
            placeholder="Describe the video you want to create... (e.g., 'A person walking through a beautiful forest at sunset, discovering a hidden waterfall')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            disabled={generateMutation.isPending}
          />
        </div>

        {/* Niche Input */}
        <div className="space-y-2">
          <Label htmlFor="niche" className="text-slate-300">
            Niche (Optional)
          </Label>
          <Input
            id="niche"
            placeholder="e.g., Travel, Lifestyle, Nature"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            disabled={generateMutation.isPending}
          />
        </div>

        {/* Scene Count Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Number of Scenes</Label>
            <span className="text-sm font-medium text-purple-400">{sceneCount[0]} scenes</span>
          </div>
          <Slider
            value={sceneCount}
            onValueChange={setSceneCount}
            min={1}
            max={5}
            step={1}
            className="w-full"
            disabled={generateMutation.isPending}
          />
          <p className="text-xs text-slate-500">
            More scenes = more camera angles and story depth
          </p>
        </div>

        {/* Duration Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Total Duration</Label>
            <span className="text-sm font-medium text-purple-400">{duration[0]} seconds</span>
          </div>
          <Slider
            value={duration}
            onValueChange={setDuration}
            min={15}
            max={60}
            step={5}
            className="w-full"
            disabled={generateMutation.isPending}
          />
          <p className="text-xs text-slate-500">
            Recommended: 30 seconds for optimal quality
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
          size="lg"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting Generation...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Video
            </>
          )}
        </Button>

        {/* Info */}
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">💡 Tip:</strong> Be specific in your prompt. 
            Describe the scene, actions, camera movements, and atmosphere. 
            The AI will create multiple camera angles automatically based on your scene count.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
