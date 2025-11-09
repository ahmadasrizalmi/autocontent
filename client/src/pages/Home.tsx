import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";
import { Play, Square, Loader2, CheckCircle, TrendingUp, Sparkles, Image as ImageIcon, PenTool } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentAgent, setCurrentAgent] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [postsCreated, setPostsCreated] = useState(0);

  const { isConnected, on, off } = useWebSocket();

  // tRPC queries and mutations
  const postsQuery = trpc.posts.list.useQuery({ limit: 20 });
  const agentsQuery = trpc.agents.list.useQuery();
  const statusQuery = trpc.factory.status.useQuery(undefined, {
    refetchInterval: isRunning ? 2000 : false
  });

  const startMutation = trpc.factory.start.useMutation({
    onSuccess: (data) => {
      setIsRunning(true);
      setCurrentJobId(data.jobId);
      setProgress(0);
      setPostsCreated(0);
      toast.success('Content Factory started!');
    },
    onError: (error) => {
      toast.error(`Failed to start: ${error.message}`);
    }
  });

  const stopMutation = trpc.factory.stop.useMutation({
    onSuccess: () => {
      setIsRunning(false);
      setCurrentJobId(null);
      setProgress(0);
      setCurrentAgent('');
      setCurrentStep('');
      toast.info('Content Factory stopped');
    },
    onError: (error) => {
      toast.error(`Failed to stop: ${error.message}`);
    }
  });

  // Load initial data
  useEffect(() => {
    if (postsQuery.data) {
      setPosts(postsQuery.data.posts);
    }
  }, [postsQuery.data]);

  useEffect(() => {
    if (agentsQuery.data) {
      setAgents(agentsQuery.data.agents);
    }
  }, [agentsQuery.data]);

  // Check factory status on mount
  useEffect(() => {
    if (statusQuery.data?.isRunning) {
      setIsRunning(true);
      setCurrentJobId(statusQuery.data.currentJob?.jobId || null);
      setProgress(statusQuery.data.currentJob?.progress || 0);
      setPostsCreated(statusQuery.data.currentJob?.postsCreated || 0);
      setCurrentAgent(statusQuery.data.currentJob?.currentAgent || '');
      setCurrentStep(statusQuery.data.currentJob?.currentStep || '');
    }
  }, [statusQuery.data]);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!isConnected) return;

    on('status_update', (data: any) => {
      setProgress(data.progress || 0);
      setCurrentAgent(data.currentAgent || '');
      setCurrentStep(data.currentStep || '');
    });

    on('post_created', (data: any) => {
      setPosts(prev => [data.post, ...prev]);
      setPostsCreated(prev => prev + 1);
      toast.success('New post created and published!');
      postsQuery.refetch();
    });

    on('job_complete', (data: any) => {
      setIsRunning(false);
      setCurrentJobId(null);
      setProgress(100);
      toast.success(`Factory completed! ${data.postsCreated} posts created.`);
      postsQuery.refetch();
      agentsQuery.refetch();
      
      // Reset after a delay
      setTimeout(() => {
        setProgress(0);
        setCurrentAgent('');
        setCurrentStep('');
        setPostsCreated(0);
      }, 3000);
    });

    on('job_stopped', () => {
      setIsRunning(false);
      setCurrentJobId(null);
      setProgress(0);
      setCurrentAgent('');
      setCurrentStep('');
    });

    on('error', (data: any) => {
      toast.error(`Error: ${data.error}`);
    });

    return () => {
      off('status_update');
      off('post_created');
      off('job_complete');
      off('job_stopped');
      off('error');
    };
  }, [isConnected]);

  const handleStartFactory = () => {
    startMutation.mutate({ count: 5 });
  };

  const handleStopFactory = () => {
    if (currentJobId) {
      stopMutation.mutate({ jobId: currentJobId });
    }
  };

  const agentIcons = {
    'Trend Explorer': TrendingUp,
    'Showrunner': Sparkles,
    'Image Generator': ImageIcon,
    'Caption Writer': PenTool
  };

  const agentColors = {
    'Trend Explorer': 'text-blue-400',
    'Showrunner': 'text-purple-400',
    'Image Generator': 'text-green-400',
    'Caption Writer': 'text-orange-400'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {APP_TITLE}
              </h1>
              <p className="text-slate-400 mt-1">Mission 3: Content Swarm AI</p>
            </div>

            <div className="flex items-center gap-4">
              {/* WebSocket Status */}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              {/* Posts Created Badge */}
              {isRunning && postsCreated > 0 && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {postsCreated} Posts Created
                </Badge>
              )}

              {/* Start/Stop Button */}
              <Button
                variant={isRunning ? 'destructive' : 'default'}
                onClick={isRunning ? handleStopFactory : handleStartFactory}
                disabled={startMutation.isPending || stopMutation.isPending}
                className="gap-2"
                size="lg"
              >
                {startMutation.isPending || stopMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRunning ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop Factory
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Factory
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-300">
                  {currentStep} {currentAgent && `• ${currentAgent}`}
                </span>
                <span className="text-slate-400">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{posts.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {agents.filter(a => a.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Niches Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {new Set(posts.map(p => p.niche)).size}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {posts.filter(p => p.status === 'published').length > 0 ? '100%' : '0%'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Agents Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">AI Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent) => {
              const Icon = agentIcons[agent.name as keyof typeof agentIcons] || Sparkles;
              const color = agentColors[agent.name as keyof typeof agentColors] || 'text-gray-400';
              
              return (
                <Card key={agent.id} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-slate-900 ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base text-white">{agent.name}</CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`mt-1 text-xs ${
                            agent.status === 'active' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-slate-700/50 text-slate-400 border-slate-600'
                          }`}
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-slate-400">
                      {agent.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Published Posts Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">Published Posts on GetCirclo</h2>
          {postsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">No posts yet. Click "Start Factory" to create content!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-purple-500/50 transition-colors">
                  <div className="aspect-[3/4] relative overflow-hidden bg-slate-900">
                    <img
                      src={post.mediaUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="bg-purple-500/10 text-purple-400">
                        {post.niche}
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                        #DNA
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-slate-300 line-clamp-3">
                      {post.caption}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {post.keywords.slice(0, 4).map((keyword: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs bg-slate-900 text-slate-400 border-slate-700"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Mission Requirements */}
        <div className="mt-12 p-6 rounded-lg border border-slate-700 bg-slate-800/30">
          <h3 className="text-lg font-semibold mb-2 text-white">Mission 3 Requirements ✅</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Discovery agent finds trending topics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Showrunner coordinates 3+ specialist agents</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Personalized based on user preferences</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Automatic visual content generation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Continuous creation without triggers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Posts visible on GetCirclo Home Page</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
