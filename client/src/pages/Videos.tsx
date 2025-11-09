import { useState } from "react";
import { VideoGenerator } from "@/components/VideoGenerator";
import { VideoProgress } from "@/components/VideoProgress";
import { VideoGallery } from "@/components/VideoGallery";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Sparkles, Library, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Videos() {
  const [activeVideoIds, setActiveVideoIds] = useState<string[]>([]);

  const handleVideoGenerated = (videoId: string) => {
    setActiveVideoIds(prev => [...prev, videoId]);
  };

  const handleVideoComplete = (videoId: string) => {
    // Remove from active list after a delay
    setTimeout(() => {
      setActiveVideoIds(prev => prev.filter(id => id !== videoId));
    }, 3000);
  };

  const handleVideoCancel = (videoId: string) => {
    setActiveVideoIds(prev => prev.filter(id => id !== videoId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Video Studio
                </h1>
                <p className="text-slate-400 mt-1">Create multi-angle story videos with AI</p>
              </div>
            </div>
            
            <Link href="/">
              <Button variant="outline" className="gap-2 bg-slate-800/50 border-slate-600 hover:bg-slate-700">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="generate" className="data-[state=active]:bg-purple-500/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-purple-500/20">
              <Library className="w-4 h-4 mr-2" />
              Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {/* Generator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VideoGenerator onVideoGenerated={handleVideoGenerated} />

              {/* Info Card */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Describe Your Video</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Write a detailed prompt describing the story, scenes, and atmosphere you want
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">AI Creates Storyboard</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Our AI breaks down your prompt into multiple scenes with different camera angles
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Generate Each Scene</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Each scene is generated with cinematic quality and appropriate camera work
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Combine & Deliver</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Scenes are seamlessly combined into a complete video story
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-purple-300">
                    <strong>✨ Pro Tips:</strong> Use descriptive language, mention specific actions, 
                    lighting conditions, and emotions. The more detailed your prompt, the better the result!
                  </p>
                </div>
              </Card>
            </div>

            {/* Active Generation Progress */}
            {activeVideoIds.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Active Generations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeVideoIds.map(videoId => (
                    <VideoProgress
                      key={videoId}
                      videoId={videoId}
                      onComplete={() => handleVideoComplete(videoId)}
                      onCancel={() => handleVideoCancel(videoId)}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery">
            <VideoGallery />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
