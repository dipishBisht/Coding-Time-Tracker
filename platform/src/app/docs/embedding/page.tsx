import CodeBlock from "@/components/docs/code-block";

export default function Embedding() {
  return (
    <div>
      <h1>Embedding Stats</h1>
      <p>Add your coding stats to your portfolio, blog, or any website.</p>

      <h2>React / Next.js</h2>
      <CodeBlock
        language="tsx"
        title="CodingStats.tsx"
        code={`import { useEffect, useState } from 'react';

export default function CodingStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('https://time-in-code.vercel.app/api/stats/YOUR_USER_ID')
      .then(r => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div>
      <h2>My Coding Stats</h2>
      <p>{Math.floor(stats.totalSeconds / 3600)} hours tracked</p>
      <p>{stats.totalDays} days active</p>
    </div>
  );
}`}
      />

      <h2>HTML / Vanilla JavaScript</h2>
      <CodeBlock
        language="html"
        title="index.html"
        code={`<div id="coding-stats"></div>
<script>
  fetch('https://time-in-code.vercel.app/api/stats/YOUR_USER_ID')
    .then(r => r.json())
    .then(stats => {
      document.getElementById('coding-stats').innerHTML = \`
        <h2>My Coding Stats</h2>
        <p>\${Math.floor(stats.totalSeconds / 3600)} hours tracked</p>
      \`;
    });
</script>`}
      />

      <h2>Vue</h2>
      <CodeBlock
        language="html"
        title="CodingStats.vue"
        code={`<template>
  <div v-if="stats">
    <h2>My Coding Stats</h2>
    <p>{{ Math.floor(stats.totalSeconds / 3600) }} hours tracked</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const stats = ref(null);

onMounted(async () => {
  const res = await fetch(
    'https://time-in-code.vercel.app/api/stats/YOUR_USER_ID'
  );
  stats.value = await res.json();
});
</script>`}
      />

      <h2>Svelte</h2>
      <CodeBlock
        language="html"
        title="CodingStats.svelte"
        code={`<script>
  import { onMount } from 'svelte';
  let stats = null;

  onMount(async () => {
    const res = await fetch(
      'https://time-in-code.vercel.app/api/stats/YOUR_USER_ID'
    );
    stats = await res.json();
  });
</script>

{#if stats}
  <div>
    <h2>My Coding Stats</h2>
    <p>{Math.floor(stats.totalSeconds / 3600)} hours tracked</p>
  </div>
{/if}`}
      />

      <div className="mt-8 p-6 rounded-xl border bg-muted/30">
        <h3>Tip</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Replace <code>YOUR_USER_ID</code> with your actual user ID. You can
          find it by running &quot;Coding Time: Show Today&apos;s Stats&quot; in
          VS Code.
        </p>
      </div>
    </div>
  );
}
