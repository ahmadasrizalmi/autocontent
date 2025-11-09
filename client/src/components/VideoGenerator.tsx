import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Video, Loader2, Sparkles, RefreshCw } from "lucide-react";

interface VideoGeneratorProps {
  onVideoGenerated?: (videoId: string) => void;
}

export function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [niche, setNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [mood, setMood] = useState<string>("");
  const [sceneCount, setSceneCount] = useState([3]);
  const [duration, setDuration] = useState([30]);
  const [useAutoGenerate, setUseAutoGenerate] = useState(false);

  // Fetch available niches
  const { data: nichesData } = trpc.videoPrompter.getNiches.useQuery();
  const niches = nichesData?.niches || [];

  // Generate prompt mutation
  const generatePromptMutation = trpc.videoPrompter.generate.useMutation({
    onSuccess: (data) => {
      setPrompt(data.prompt);
      setSceneCount([data.suggestedScenes]);
      setDuration([data.suggestedDuration]);
      toast.success("Prompt generated! You can edit it before generating the video.");
    },
    onError: (error) => {
      toast.error(`Failed to generate prompt: ${error.message}`);
    }
  });

  // Generate video mutation
  const generateMutation = trpc.video.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Video generation started!");
      setPrompt("");
      setNiche("");
      setTopic("");
      setMood("");
      if (onVideoGenerated) {
        onVideoGenerated(data.videoId);
      }
    },
    onError: (error) => {
      toast.error(`Failed to start video generation: ${error.message}`);
    }
  });

  const handleGeneratePrompt = () => {
    if (!niche) {
      toast.error("Please select a niche first");
      return;
    }

    generatePromptMutation.mutate({
      niche,
      topic: topic.trim() || undefined,
      mood: mood as any || undefined,
    });
  };

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
        {/* Auto-Generate Toggle */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-300">AI Prompt Generator</p>
            <p className="text-xs text-slate-400">Let AI create the perfect prompt for you</p>
          </div>
          <Button
            variant={useAutoGenerate ? "default" : "outline"}
            size="sm"
            onClick={() => setUseAutoGenerate(!useAutoGenerate)}
            className={useAutoGenerate ? "bg-purple-500 hover:bg-purple-600" : ""}
          >
            {useAutoGenerate ? "Enabled" : "Enable"}
          </Button>
        </div>

        {/* Auto-Generate Section */}
        {useAutoGenerate && (
          <div className="space-y-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
            <div className="space-y-2">
              <Label htmlFor="niche" className="text-slate-300">
                Niche *
              </Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select a niche..." />
                </SelectTrigger>
                <SelectContent>
                  {niches.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic" className="text-slate-300">
                Topic (Optional)
              </Label>
              <Input
                id="topic"
                placeholder="e.g., smartphone review, pasta recipe, morning routine..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                disabled={generatePromptMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood" className="text-slate-300">
                Mood (Optional)
              </Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select mood..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGeneratePrompt}
                disabled={!niche || generatePromptMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {generatePromptMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Prompt
                  </>
                )}
              </Button>
              {prompt && (
                <Button
                  onClick={handleGeneratePrompt}
                  disabled={!niche || generatePromptMutation.isPending}
                  variant="outline"
                  className="border-slate-600"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Manual Niche Input (when auto-generate is off) */}
        {!useAutoGenerate && (
          <div className="space-y-2">
            <Label htmlFor="niche-manual" className="text-slate-300">
              Niche (Optional)
            </Label>
            <Input
              id="niche-manual"
              placeholder="e.g., Travel, Lifestyle, Nature"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              disabled={generateMutation.isPending}
            />
          </div>
        )}

        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-slate-300">
            Video Prompt *
          </Label>
          <Textarea
            id="prompt"
            placeholder="Describe the video you want to create... (e.g., 'A person walking through a beautiful forest at sunset, discovering a hidden waterfall. Audio: Birds chirping, gentle footsteps, soft orchestral music')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            disabled={generateMutation.isPending}
          />
        </div>

        {/* Scene Count Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Number of Scenes</Label>
            <span className="text-sm text-purple-400 font-medium">{sceneCount[0]} scenes</span>
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
            <span className="text-sm text-purple-400 font-medium">{duration[0]} seconds</span>
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
          disabled={!prompt.trim() || generateMutation.isPending}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Video className="w-5 h-5 mr-2" />
              Generate Video
            </>
          )}
        </Button>

        {/* Tip */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-300">
            <strong>💡 Tip:</strong> Be specific in your prompt. Describe the scene, actions, 
            camera movements, and atmosphere. {useAutoGenerate ? "The AI will enhance your concept with professional details." : "The AI will create multiple camera angles automatically based on your scene count."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
