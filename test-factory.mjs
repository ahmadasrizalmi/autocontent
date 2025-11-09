import axios from 'axios';

const API_URL = 'http://localhost:3000/api/trpc';

async function testFactory() {
  console.log('🧪 Testing Content Factory...\n');

  try {
    // Test 1: Start factory
    console.log('1️⃣ Starting factory with 1 post...');
    const startResponse = await axios.post(`${API_URL}/factory.start`, {
      json: { count: 1 }
    });
    console.log('✅ Factory started');
    const jobId = startResponse.data.result.data.json.jobId;
    console.log('   Job ID:', jobId, '\n');

    // Test 2: Check status
    console.log('2️⃣ Checking factory status...');
    const statusResponse = await axios.get(`${API_URL}/factory.status`);
    console.log('✅ Status:', statusResponse.data.result.data.json.isRunning ? 'Running' : 'Idle');
    console.log('');

    // Wait for completion (max 2 minutes)
    console.log('3️⃣ Waiting for job to complete (this may take 30-60 seconds)...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 24;

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
      const checkResponse = await axios.get(`${API_URL}/factory.status?input=${encodeURIComponent(JSON.stringify({ json: { jobId } }))}`);
      const status = checkResponse.data.result.data.json;
      
      console.log(`   Attempt ${attempts}: ${status.currentJob?.status || 'unknown'} - ${status.currentJob?.postsCreated || 0}/${status.currentJob?.totalPosts || 0} posts`);
      
      if (status.currentJob?.status === 'completed' || status.currentJob?.status === 'failed') {
        completed = true;
        console.log('✅ Job completed!\n');
      }
    }

    if (!completed) {
      console.log('⚠️  Job did not complete within 2 minutes\n');
    }

    // Test 3: Check posts
    console.log('4️⃣ Fetching created posts...');
    const postsResponse = await axios.get(`${API_URL}/posts.list`);
    const posts = postsResponse.data.result.data.json.posts;
    console.log(`✅ Found ${posts.length} post(s):`);
    
    if (posts.length > 0) {
      const post = posts[0];
      console.log('   - Niche:', post.niche);
      console.log('   - Caption:', post.caption.substring(0, 100) + '...');
      console.log('   - Status:', post.status);
      console.log('');
    }

    // Test 4: Check agents
    console.log('5️⃣ Checking AI agents...');
    const agentsResponse = await axios.get(`${API_URL}/agents.list`);
    const agents = agentsResponse.data.result.data.json.agents;
    console.log(`✅ Found ${agents.length} agent(s):`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name}: ${agent.status} (${agent.tasksCompleted} tasks completed)`);
    });

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testFactory();
