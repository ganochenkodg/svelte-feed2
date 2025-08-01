<script>
  import { onMount } from 'svelte';
  const backendEndpoint = 'http://localhost:3000'

  const themes = [
    'autumn',
    'bumblebee',
    'business',
    'caramellatte',
    'cmyk',
    'coffee',
    'corporate',
    'dark',
    'dim',
    'dracula',
    'fantasy',
    'forest',
    'garden',
    'light',
    'nord',
    'retro',
    'sunset',
    'valentine'
  ];

  let selectedTheme = 'autumn';
  let searchQuery = '';
  let content = '';
  let selectedColor = 'primary';
  let files = [];
  let posts = [];
  let fullPosts = [];
  let editId = null;
  let editContent = '';
  let previews = {};

  let colorFilters = {
    primary: true,
    secondary: true,
    accent: true,
    info: true,
    success: true,
    warning: true
  };
  const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning'];

  onMount(() => {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('theme='));

    if (cookie) {
      selectedTheme = cookie.split('=')[1];
    }
    fetchPosts();
  });

  $: {
    document.documentElement.setAttribute('data-theme', selectedTheme);
    posts = fullPosts.filter(post => colorFilters[post.color])
      .filter(post => post.content.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  function linkify(post) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = post.content.replace(replacePattern1, '<a class="link link-info" href="$1" target="_blank">$1</a>');

    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a class="link link-info" href="https://$2" target="_blank">$2</a>');

    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a class="link link-info" href="mailto:$1">$1</a>');

    return replacedText;
  }

  async function submitPost() {
    if (!content.trim()) return;
    try {
      const response = await fetch(`${backendEndpoint}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, color: selectedColor, files })
      });

      if (response.ok) {
        content = '';
        selectedColor = 'primary';
        fetchPosts();
      } else {
        console.error('Error:', await response.text());
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  }

  async function fetchPosts() {
    try {
      const response = await fetch(`${backendEndpoint}/posts`);
      if (response.ok) {
        fullPosts = await response.json();
      } else {
        console.error('Error:', await response.text());
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  }

  async function deletePost(id) {
    try {
      const response = await fetch(`${backendEndpoint}/posts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        posts = posts.filter(post => post.id !== id);
      } else {
        console.error('Error:', await response.text());
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  }

  function editPost(post) {
    editId = post.id;
    editContent = post.content;
  }

  function saveEdit(post) {
    post.content = editContent;
    updatePost(post);
    editId = null;
  }

  async function updatePost(post) {
    try {
      const response = await fetch(`${backendEndpoint}/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: post.content
        })
      });

      if (response.ok) {
        fetchPosts();
        previews[post.id] = undefined;
      } else {
        console.error('Error:', await response.text());
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  }

  function hasUrl(post) {
    let result = linkify(post).includes('href=');
    if (result) {
      loadPreview(post);
    }
    return result;
  }

  async function loadPreview(post) {
    const body = linkify(post);
    const url = body.substring(body.indexOf('href=') + 6, body.indexOf('target=') - 2);
    try {
      const response = await fetch(`${backendEndpoint}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({url: url })
      });

      if (response.ok) {
        let metadata = await response.json();
        previews[post.id] = {...metadata};
      } else {
        console.error('Error:', await response.text());
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  }

</script>

<div class="min-h-screen background">
  <nav class="w-full navbar bg-base-200/30 backdrop-blur-sm p-1 px-4 min-h-0 text-sm gap-4 flex-wrap border-b-2 border-primary shadow fixed top-0 left-0 z-50">
    <div class="flex gap-2">
      {#each Object.keys(colorFilters) as color}
        <input
          type="checkbox"
          bind:checked={colorFilters[color]}
          class={`checkbox checkbox-${color}`}
        />
      {/each}
    </div>
    <div class="flex-1 flex join">
      <input
        type="search"
        placeholder="Search..."
        bind:value={searchQuery}
        class="input input-sm input-bordered w-full min-w-64 join-item"
      />
      <button class="btn btn-sm btn-primary join-item shadow-none" on:click={() => searchQuery = ''}>
        Clear
      </button>
    </div>
    <div>
      <select class="select select-sm select-bordered" 
        bind:value={selectedTheme}
        on:change={() => {
          document.cookie = `theme=${selectedTheme}; path=/; max-age=31536000`;
        }}
        >
        {#each themes as theme}
          <option value={theme}>{theme}</option>
        {/each}
      </select>
    </div>
  </nav>

  <div class="hidden">
    bg-primary bg-secondary bg-accent bg-info bg-success bg-warning
    border-primary border-secondary border-accent border-info border-success border-warning
    text-primary-content text-secondary-content text-accent-content text-info-content text-success-content text-warning-content
    btn-primary btn-secondary btn-accent btn-info btn-success btn-warning
    radio-primary radio-secondary radio-accent radio-info radio-success radio-warning
    checkbox-primary checkbox-secondary checkbox-accent checkbox-info checkbox-success checkbox-warning
  </div>

  <div class="w-full max-w-3xl mx-auto px-2 mt-[3.5rem]">
    <div class={`card border-2 bg-base-200/30 backdrop-blur-sm border-${selectedColor} shadow-lg`}>
      <div class="card-body p-2 gap-2">
        <div class="join font-semibold">
          <span class={`join-item flex-1 px-4 py-2 bg-${selectedColor} text-xs text-${selectedColor}-content`}>
            What's new?
          </span>
        </div>
        <textarea
          class={`textarea w-full border border-${selectedColor} rounded p-2 min-h-[4rem]`}
          bind:value={content}
          placeholder="Write something..."
          rows="4"
        ></textarea>

        <div class="flex justify-between items-center flex-wrap gap-2">
          <div class="flex gap-2 flex-wrap">
            {#each colors as color}
              <input
                type="radio"
                name="color"
                class={`radio radio-${color}`}
                value={color}
                bind:group={selectedColor}
              />
            {/each}
          </div>

          <button class={`btn btn-sm btn-${selectedColor}`} on:click={submitPost}>
            Post
          </button>
        </div>
      </div>
    </div>
  </div>

  {#each posts as post}
    <div class="max-w-3xl mx-auto mt-4 px-2">
      <div class={`card border-2 border-${post.color} bg-base-200/30 backdrop-blur-sm shadow-lg`}>
        <div class="card-body p-2 gap-2">
          <div class="join font-semibold">
            <span class={`join-item flex-1 px-4 py-2 bg-${post.color} text-xs text-${post.color}-content`}>
              {new Date(post.created_at.replace(" ", "T") + "Z").toLocaleString()}
            </span>
            {#if editId === post.id}
            <button
              class="join-item btn btn-success btn-sm shadow-none"
              on:click={() => saveEdit(post)}
            >
              Save
            </button>
            {:else}
            <button
              class="join-item btn btn-warning btn-sm shadow-none"
              on:click={() => editPost(post)}
            >
              Edit
            </button>
            {/if}
            <button
              class="join-item btn btn-error btn-sm shadow-none"
              on:click={() => deletePost(post.id)}
            >
              Delete
            </button>
          </div>
          {#if editId === post.id}
          <textarea
            class={`textarea w-full border border-${post.color} rounded p-2 min-h-[4rem]`}
            bind:value={editContent}
            rows="4"
          ></textarea>
          {:else}
          <div class="whitespace-pre-wrap break-words p-2">
            {@html linkify(post)}
          </div>
          {#if hasUrl(post)}
            {#if previews[post.id]?.image}
              <div class={`card rounded overflow-hidden bg-base-100 border border-${post.color} mt-2`}>
                <a href={previews[post.id].url} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={previews[post.id].image} 
                    alt="preview" 
                    class="w-full object-cover" 
                    style={`max-height: 150px`}
                  />
                </a>
                <div class="p-2 text-sm">
                  <a 
                    href={previews[post.id].url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="link link-info"
                  >
                    {previews[post.id].title}
                  </a>
                </div>
              </div>
            {/if}
          {/if}
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>

