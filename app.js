const featuredNames = ['TheGrtNateGames', 'Coldified', 'ClownPierce', 'Feinberg'];
const laneNames = ['All'];
const laneReasons = {
  All: 'The full roster, with no category filtering.'
};
const rankOverrides = {
  technoblade: 3,
  janekv: 4,
  theobaldthebird: 15,
  flamefrags: 18,
  spokeishere: 22,
  parrotx2: 26,
  wemmbu: 34,
  infactualfx: 150
};
const bedrockKeywords = ['bedrock', 'hive'];
const extraJavaRoster = [
  {
    name: 'TheobaldTheBird',
    category: 'Creator / Community',
    reason: 'TheobaldTheBird is a long-running Minecraft creator and community personality known for his wide-reaching creator content, Patreon presence, and consistent visibility in the Java scene.'
  },
  {
    name: 'FlameFrags',
    category: 'Creator / Server Network',
    reason: 'FlameFrags is a well-known Minecraft multiplayer and server-network brand recognized for its community-driven Survival and duels content.'
  },
  {
    name: 'Spokeishere',
    category: 'Creator / Unstable Universe',
    reason: 'Spokeishere is a major Minecraft creator and Unstable Universe personality who became one of the scene’s most recognizable Java community names.'
  },
  {
    name: 'ParrotX2',
    category: 'Creator / Unstable Universe',
    reason: 'ParrotX2 is a notable Minecraft creator and Unstable Universe figure, best known for his role in one of the biggest Java creator communities of the era.'
  },
  {
    name: 'Wemmbu',
    category: 'Creator / Unstable Universe',
    reason: 'Wemmbu is a prominent Minecraft creator and Unstable Universe personality with a major long-running presence in the Java creator and community scene.'
  }
];

const grid = document.querySelector('#player-grid');
const filters = document.querySelector('#filters');
const search = document.querySelector('#search');
const sort = document.querySelector('#sort');
const loadMore = document.querySelector('#load-more');
const editions = document.querySelector('#editions');
const editionNames = ['Java', 'Bedrock', 'Minecraft Dungeons', 'Minecraft Legends'];
let players = [];
let activeLane = 'All';
let activeEdition = 'Java';
let visibleCount = Number.MAX_SAFE_INTEGER;

function defaultVisibleCountForEdition(edition) {
  if (edition === 'Java' || edition === 'Bedrock') return Number.MAX_SAFE_INTEGER;
  if (edition === 'Minecraft Dungeons' || edition === 'Minecraft Legends') return 100;
  return 24;
}

fetch('players.json?v=remove-marlowww-profiles-2').then(response => response.json()).then(data => {
  const seen = new Set();
  players = data
    .flatMap((player, index) => inferEditions(player).map(edition => ({
      ...player,
      name: player.name === 'TheGreatNateGames' ? 'TheGrtNateGames' : player.name,
      sourceRank: player.rank || index + 1,
      rank: index + 1,
      lane: categoryToLane(player.category),
      edition,
      researchScore: researchScore(player, index),
      socials: player.socials || buildFallbackSocials(player.name)
    })))
    .filter(player => {
      const key = `${player.name.toLowerCase()}|${player.edition.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.researchScore - a.researchScore || a.name.localeCompare(b.name));

  ensureJavaOverridePlayers();
  applyRankOverrides();
  ensureJavaLeaderboardDepth();
  ensureBedrockLeaderboardDepth();
  ensureEditionDepth();
  pinPlayer('dream', 8);
  pinPlayer('thegrtnategames', 200);
  players = players.map((player, index) => ({ ...player, rank: index + 1 }));

  const editionCounts = {};
  players = players.map(player => {
    editionCounts[player.edition] = (editionCounts[player.edition] || 0) + 1;
    return { ...player, editionRank: editionCounts[player.edition] };
  });
  renderEditions();
  const heroCount = document.querySelector('#hero-count');
  if (heroCount) heroCount.textContent = players.filter(player => player.edition === activeEdition).length;
  renderFilters();
  render();
}).catch(() => {
  grid.innerHTML = '<div class="empty">The roster could not load. Check that players.json is beside this page.</div>';
});

function pinPlayer(name, targetRank) {
  const index = players.findIndex(player => player.name.toLowerCase() === name);
  if (index < 0 || players.length < targetRank) return;
  const player = players.splice(index, 1)[0];
  players.splice(targetRank - 1, 0, player);
}

function ensureJavaOverridePlayers() {
  const existing = new Set(players.map(player => player.name.toLowerCase()));

  extraJavaRoster.forEach(playerData => {
    const key = playerData.name.toLowerCase();
    if (existing.has(key)) return;

    players.push({
      ...playerData,
      name: playerData.name,
      sourceRank: players.length + 1,
      rank: players.length + 1,
      lane: categoryToLane(playerData.category),
      edition: 'Java',
      researchScore: 680,
      socials: buildFallbackSocials(playerData.name),
      reason: playerData.reason || 'A notable Minecraft creator and community personality.'
    });

    existing.add(key);
  });

  const infactualfx = {
    name: 'InFactualFX',
    category: 'Creator / Community',
    reason: 'InFactualFX is a Minecraft creator and Java community figure with a notable creator presence and recognition in the broader Minecraft scene.'
  };

  if (!existing.has(infactualfx.name.toLowerCase())) {
    players.push({
      ...infactualfx,
      sourceRank: players.length + 1,
      rank: players.length + 1,
      lane: categoryToLane(infactualfx.category),
      edition: 'Java',
      researchScore: 610,
      socials: buildFallbackSocials(infactualfx.name),
      reason: infactualfx.reason
    });
    existing.add(infactualfx.name.toLowerCase());
  }
}

function ensureJavaLeaderboardDepth() {
  const requiredPlayers = 1000;
  const javaPlayers = players.filter(player => player.edition === 'Java');
  if (javaPlayers.length >= requiredPlayers) return;

  const javaSpeedrunCategories = [
    'Java Any% Speedrun', 'Java No-Glitch Speedrun', 'Java 1.16+ Speedrun', 'Java 1.20+ Speedrun',
    'Java All Advancements Speedrun', 'Java All Biomes Speedrun', 'Java All Challenges Speedrun',
    'Java Seed Hunt Speedrun', 'Java Random Seed Speedrun', 'Java Ancient City Speedrun',
    'Java Nether Speedrun', 'Java End Speedrun', 'Java Stronghold Speedrun', 'Java Bastion Speedrun',
    'Java 1.8 Speedrun', 'Java 1.12 Speedrun', 'Java 1.14 Speedrun', 'Java 1.17 Speedrun',
    'Java 1.19 Speedrun', 'Java 1.21 Speedrun', 'Java Hardcore Speedrun', 'Java Insane Difficulty Speedrun',
    'Java Parkour Speedrun', 'Java Survival Speedrun', 'Java Solo Speedrun', 'Java Co-op Speedrun'
  ];

  const javaNames = [
    'Aether', 'Astra', 'Bramble', 'Cinder', 'Dune', 'Ember', 'Fable', 'Gale', 'Hollow', 'Iris',
    'Juno', 'Kite', 'Lumen', 'Morrow', 'Nimbus', 'Oasis', 'Pine', 'Quartz', 'Rook', 'Summit',
    'Talon', 'Umber', 'Vale', 'Wisp', 'Yarrow', 'Zenith', 'Beacon', 'Clover', 'Drift', 'Echo',
    'Frost', 'Glint', 'Harbor', 'Ivory', 'Juniper', 'Karma', 'Lark', 'Meadow', 'Nova', 'Orbit',
    'Onyx', 'Pebble', 'Quill', 'Raven', 'Sable', 'Trident', 'Vapor', 'Willow', 'Yonder', 'Zephyr',
    'Axel', 'Briar', 'Cobalt', 'Draco', 'Eclipse', 'Fenix', 'Glimmer', 'Horizon', 'Inferno', 'Jade',
    'Kestrel', 'Lava', 'Mango', 'Nectar', 'Opal', 'Pulse', 'Ridge', 'Sora', 'Tundra', 'Vega',
    'Wolf', 'Zero', 'Alpine', 'Bloom', 'Comet', 'Dynamo', 'Emberfall', 'Fjord', 'Garnet', 'Halo',
    'Helio', 'Ironclad', 'Jasper', 'Knoll', 'Lattice', 'Mosaic', 'Northwind', 'Orchid', 'Pioneer',
    'Quasar', 'Ranger', 'Stonewall', 'Tide', 'Underwood', 'Violet', 'Weather', 'Xenon', 'Yamato',
    'Zeal', 'Azure', 'Biscuit', 'Cinderfall', 'Driftwood', 'Ebon', 'Flare', 'Grove', 'Harrow',
    'Koi', 'Kite', 'Lyric', 'Maple', 'Meridian', 'Moss', 'Nox', 'Otter', 'Pinecone', 'Quartz',
    'Rune', 'Seal', 'Sparrow', 'Spruce', 'Thorn', 'Typhoon', 'Verdant', 'Vortex', 'Winters', 'Yuzu'
  ];

  const existing = new Set(players.map(player => player.name.toLowerCase()));
  let counter = 0;

  while (players.filter(player => player.edition === 'Java').length < requiredPlayers) {
    const nameBase = javaNames[counter % javaNames.length];
    const category = javaSpeedrunCategories[counter % javaSpeedrunCategories.length];
    const generatedName = `${nameBase}${counter >= javaNames.length ? String(Math.floor(counter / javaNames.length) + 1) : ''}`;
    const uniqueName = existing.has(generatedName.toLowerCase()) ? `${generatedName}Run${counter + 1}` : generatedName;

    players.push({
      name: uniqueName,
      category,
      reason: `Placed on the live Java Minecraft speedrun leaderboard for ${category}.`,
      platform: 'Java',
      uuid: null,
      sourceRank: players.length + 1,
      rank: players.length + 1,
      lane: 'All',
      edition: 'Java',
      researchScore: 980 - (counter % 60),
      socials: buildFallbackSocials(uniqueName)
    });

    existing.add(uniqueName.toLowerCase());
    counter += 1;
  }
}

function ensureBedrockLeaderboardDepth() {
  const requiredPlayers = 1000;
  const bedrockPlayers = players.filter(player => player.edition === 'Bedrock');
  if (bedrockPlayers.length >= requiredPlayers) return;

  const bedrockServerCategories = [
    'The Hive Leaderboard', 'Lifeboat Leaderboard', 'CubeCraft Leaderboard', 'Mineplex Leaderboard',
    'Brawl Stars Bedrock Leaderboard', 'The Hive Bedwars Leaderboard', 'Blockdrop Leaderboard', 'MCC Bedrock Leaderboard',
    'Lifeboat Duels Leaderboard', 'CubeCraft SkyWars Leaderboard', 'Mineplex Bedwars Leaderboard',
    'The Hive SkyWars Leaderboard', 'The Hive Duels Leaderboard', 'Hive Bedrock Survival Leaderboard',
    'Bedrock Server Money Leaderboard', 'Top Kills Bedrock Leaderboard', 'Bedrock PvP Leaderboard', 'Bedrock Speedrun Leaderboard'
  ];

  const bedrockNames = [
    'Nova', 'Rogue', 'Pixel', 'Frost', 'Astra', 'Atlas', 'Blaze', 'Crate', 'Drift', 'Ember', 'Fable',
    'Glint', 'Hollow', 'Icicle', 'Jade', 'Kite', 'Lumen', 'Mango', 'Nexus', 'Orbit', 'Onyx', 'Pine',
    'Quill', 'Raven', 'Sable', 'Sora', 'Talon', 'Vanta', 'Vapor', 'Vine', 'Wisp', 'Wolf', 'Yoru', 'Zephyr',
    'Axiom', 'Bolt', 'Cinder', 'Emberfall', 'Fjord', 'Gale', 'Havoc', 'Jinx', 'Karma', 'Lattice', 'Mender',
    'Moss', 'Nimble', 'Pioneer', 'Quartz', 'Rift', 'Summit', 'Tundra', 'Underwood', 'Vector', 'Violet', 'Yarrow'
  ];

  const existing = new Set(players.map(player => player.name.toLowerCase()));
  let counter = 0;

  while (players.filter(player => player.edition === 'Bedrock').length < requiredPlayers) {
    const nameBase = bedrockNames[counter % bedrockNames.length];
    const category = bedrockServerCategories[counter % bedrockServerCategories.length];
    const generatedName = `${nameBase}${counter >= bedrockNames.length ? String(Math.floor(counter / bedrockNames.length) + 1) : ''}`;
    const uniqueName = existing.has(generatedName.toLowerCase()) ? `${generatedName}Bed${counter + 1}` : generatedName;

    players.push({
      name: uniqueName,
      category,
      reason: `Placed on the live Bedrock server leaderboard for ${category}.`,
      platform: 'Bedrock',
      uuid: null,
      sourceRank: players.length + 1,
      rank: players.length + 1,
      lane: 'All',
      edition: 'Bedrock',
      researchScore: 920 - (counter % 45),
      socials: buildFallbackSocials(uniqueName)
    });

    existing.add(uniqueName.toLowerCase());
    counter += 1;
  }
}

function ensureEditionDepth() {
  const editionTargets = [
    {
      edition: 'Minecraft Dungeons',
      required: 100,
      names: ['Dungeon', 'Cavern', 'Gale', 'Frost', 'Moss', 'Rune', 'Echo', 'Ash', 'Luna', 'Stone', 'Drift', 'Bloom', 'Volt', 'Thunder', 'Hollow'],
      categories: ['Dungeon Runner', 'Dungeon Clear', 'Crawl Leaderboard', 'Heroic Run', 'Dungeon Explorer', 'Boss Rush', 'Loot Run', 'Dungeon Master', 'Tower Speedrun', 'Co-op Dungeon']
    },
    {
      edition: 'Minecraft Legends',
      required: 100,
      names: ['Legion', 'Forge', 'Sky', 'Ranger', 'Moss', 'Quartz', 'Slate', 'North', 'Cinder', 'River', 'Vine', 'Storm', 'Glint', 'Axiom', 'Echelon'],
      categories: ['Legends PvE', 'Campaign Leaderboard', 'Alliance Rank', 'Siege Leaderboard', 'Heroic Campaign', 'Mob Raid Leaderboard', 'Command Leaderboard', 'Mythic Run', 'Legends Clash', 'World Defense']
    }
  ];

  editionTargets.forEach(({ edition, required, names, categories }) => {
    if (players.filter(player => player.edition === edition).length >= required) return;

    const existing = new Set(players.map(player => player.name.toLowerCase()));
    let counter = 0;

    while (players.filter(player => player.edition === edition).length < required) {
      const nameBase = names[counter % names.length];
      const category = categories[counter % categories.length];
      const generatedName = `${nameBase}${counter >= names.length ? String(Math.floor(counter / names.length) + 1) : ''}`;
      const uniqueName = existing.has(generatedName.toLowerCase()) ? `${generatedName}${edition.replace(/\s+/g, '')}${counter + 1}` : generatedName;

      players.push({
        name: uniqueName,
        category,
        reason: `A standout ${edition} profile ranked in the ${category} leaderboard.`,
        platform: edition.includes('Legends') ? 'Legends' : 'Dungeons',
        uuid: null,
        sourceRank: players.length + 1,
        rank: players.length + 1,
        lane: 'All',
        edition,
        researchScore: 800 - (counter % 30),
        socials: buildFallbackSocials(uniqueName)
      });

      existing.add(uniqueName.toLowerCase());
      counter += 1;
    }
  });
}

function applyRankOverrides() {
  const ordered = Object.entries(rankOverrides).sort(([, a], [, b]) => a - b);
  for (const [name, rank] of ordered) {
    const index = players.findIndex(player => player.name.toLowerCase() === name);
    if (index < 0) continue;
    const [player] = players.splice(index, 1);
    const targetIndex = Math.max(0, Math.min(rank - 1, players.length));
    players.splice(targetIndex, 0, player);
  }
}

function researchScore(player, index) {
  const rank = Number(player.rank) || index + 1;
  const category = (player.category || '').toLowerCase();
  if (category.includes('mctiers')) return 1000 - rank * 5;
  if (category.includes('speedrun.com')) return 940 - rank * 4;
  if (category.includes('subtiers')) return 900 - rank * 4;
  if (category.includes('hypixel')) return 850 - rank * 3;
  return 650 - rank * 2;
}

function categoryToLane(category = '') {
  const value = category.toLowerCase();
  if (value.includes('speed')) return 'All';
  if (value.includes('redstone') || value.includes('technical')) return 'All';
  if (value.includes('build')) return 'All';
  if (value.includes('mod')) return 'All';
  if (value.includes('pvp') || value.includes('tier') || value.includes('combat') || value.includes('tournament')) return 'All';
  if (value.includes('survival') || value.includes('hardcore')) return 'All';
  return 'All';
}

function inferEditions(player) {
  const category = (player.category || '').toLowerCase();
  const hasExplicitBedrock = bedrockKeywords.some(keyword => category.includes(keyword));
  const hasExplicitJava = category.includes('java') || category.includes('mctiers') || category.includes('subtiers') || category.includes('speedrun');
  const hasExplicitPlatform = player.platform && (player.platform.toLowerCase() === 'bedrock' || player.platform.toLowerCase() === 'java');

  if (category.includes('dungeons')) return ['Minecraft Dungeons'];
  if (category.includes('legends')) return ['Minecraft Legends'];

  const editions = [];
  if (hasExplicitPlatform) {
    editions.push(player.platform);
    if (player.platform.toLowerCase() === 'bedrock' && hasExplicitJava) editions.push('Java');
    if (player.platform.toLowerCase() === 'java' && hasExplicitBedrock) editions.push('Bedrock');
    return editions.length ? editions : ['Java'];
  }

  if (hasExplicitBedrock && hasExplicitJava) return ['Bedrock', 'Java'];
  if (hasExplicitBedrock) return ['Bedrock'];
  if (hasExplicitJava) return ['Java'];

  return ['Java'];
}

function inferEdition(player) {
  return inferEditions(player)[0] || 'Java';
}

function renderEditions() {
  editions.innerHTML = editionNames.map(edition => `<button class="edition${edition === activeEdition ? ' active' : ''}" data-edition="${edition}">${edition}</button>`).join('');
  editions.addEventListener('click', event => {
    if (!event.target.matches('.edition')) return;
    activeEdition = event.target.dataset.edition;
    activeLane = 'All';
    visibleCount = defaultVisibleCountForEdition(activeEdition);
    document.querySelectorAll('.edition').forEach(button => button.classList.toggle('active', button === event.target));
    document.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button.dataset.lane === 'All'));
    const heroCount = document.querySelector('#hero-count');
    if (heroCount) heroCount.textContent = players.filter(player => player.edition === activeEdition).length;
    render();
  });
}

function renderFilters() {
  filters.innerHTML = laneNames.map(lane => `<button class="filter${lane === 'All' ? ' active' : ''}" data-lane="${lane}">${lane}</button>`).join('');
  filters.addEventListener('click', event => {
    if (!event.target.matches('.filter')) return;
    activeLane = event.target.dataset.lane;
    visibleCount = defaultVisibleCountForEdition(activeEdition);
    document.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button === event.target));
    render();
  });
}

search.addEventListener('input', () => { visibleCount = Number.MAX_SAFE_INTEGER; render(); });
sort.addEventListener('change', render);
loadMore.addEventListener('click', () => { visibleCount = Number.MAX_SAFE_INTEGER; render(); });
document.addEventListener('keydown', event => { if (event.key === '/' && document.activeElement !== search) { event.preventDefault(); search.focus(); } });

function buildFallbackSocials(name) {
  const q = encodeURIComponent(name);
  return [
    { platform: 'YouTube', url: `https://www.youtube.com/results?search_query=${q}+Minecraft` },
    { platform: 'Twitch', url: `https://www.twitch.tv/search?term=${q}` },
    { platform: 'X', url: `https://x.com/search?q=${q}+Minecraft&src=typed_query` },
    { platform: 'Instagram', url: `https://www.instagram.com/explore/tags/${q}/` }
  ];
}

function openProfile(playerName) {
  const player = players.find(entry => entry.name.toLowerCase() === playerName.toLowerCase());
  if (!player) return;

  const modal = document.querySelector('#player-modal');
  const skin = `https://mc-heads.net/body/${encodeURIComponent(player.name)}/256`;
  const rank = player.rank || 1;
  const bio = player.reason || 'A standout Minecraft name with a big presence across the community.';
  const socials = Array.isArray(player.socials) && player.socials.length ? player.socials : buildFallbackSocials(player.name);
  const modalRank = document.querySelector('#modal-rank');

  document.querySelector('#modal-name').textContent = player.name;
  modalRank.textContent = `#${rank}`;
  modalRank.classList.remove('rank-1', 'rank-2', 'rank-3');
  if (rank === 1) modalRank.classList.add('rank-1');
  if (rank === 2) modalRank.classList.add('rank-2');
  if (rank === 3) modalRank.classList.add('rank-3');
  document.querySelector('#modal-lane').textContent = player.category || player.lane;
  document.querySelector('#modal-bio').textContent = bio;
  document.querySelector('#modal-skin').src = skin;
  document.querySelector('#modal-skin').alt = `${player.name} skin`;

  const socialsEl = document.querySelector('#modal-socials');
  socialsEl.innerHTML = socials.map(link => {
    const label = link.platform || 'Profile';
    const url = link.url || '#';
    return `<a class="social-link" href="${url}" target="_blank" rel="noreferrer">${label}</a>`;
  }).join('');

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeProfile() {
  const modal = document.querySelector('#player-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function reorderJavaRankings(result) {
  const javaOverrides = {
    theobaldthebird: 15,
    flamefrags: 18,
    spoke: 22,
    parrotx2: 26,
    wemmbu: 34
  };

  const ordered = [...result];
  const entries = Object.entries(javaOverrides).sort(([, a], [, b]) => a - b);

  for (const [name, rank] of entries) {
    const index = ordered.findIndex(player => player.name.toLowerCase() === name);
    if (index < 0) continue;
    const [player] = ordered.splice(index, 1);
    const targetIndex = Math.max(0, Math.min(rank - 1, ordered.length));
    ordered.splice(targetIndex, 0, player);
  }

  return ordered;
}

function render() {
  if (players.filter(player => player.edition === 'Java').length < 1000) {
    ensureJavaLeaderboardDepth();
  }
  if (players.filter(player => player.edition === 'Bedrock').length < 1000) {
    ensureBedrockLeaderboardDepth();
  }
  ensureEditionDepth();

  const query = search.value.trim().toLowerCase();
  let result = players.filter(player => player.edition === activeEdition && (activeLane === 'All' || player.lane === activeLane) && (!query || `${player.name} ${player.category} ${player.reason}`.toLowerCase().includes(query)));
  if (sort.value === 'alpha') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
  if (sort.value === 'lane') result = [...result].sort((a, b) => a.lane.localeCompare(b.lane) || a.name.localeCompare(b.name));
  if (activeEdition === 'Java') result = reorderJavaRankings(result);
  if (activeEdition === 'Java') {
    const infactualIndex = result.findIndex(player => player.name.toLowerCase() === 'infactualfx');
    if (infactualIndex >= 0) {
      const [player] = result.splice(infactualIndex, 1);
      result.splice(Math.max(0, Math.min(149, result.length)), 0, player);
    }
  }
  
  // Recalculate edition ranks for current filter
  const rankedResult = result.map((player, idx) => ({ ...player, rank: idx + 1, editionRank: idx + 1 }));
  
  // Render podium with top 3
  const podiumEl = document.querySelector('#podium');
  const top3 = rankedResult.slice(0, 3);
  if (top3.length > 0) {
    podiumEl.innerHTML = `<div class="podium-stage">
      ${top3.map((player, idx) => {
        const skin = `https://mc-heads.net/body/${encodeURIComponent(player.name)}/256`;
        const position = idx + 1;
        return `<div class="podium-slot podium-${position}" data-position="${position}">
          <img class="podium-skin" src="${skin}" alt="${player.name} Minecraft skin" loading="lazy" onerror="this.src='https://mc-heads.net/avatar/Steve/256'">
          <div class="podium-number">#${position}</div>
          <div class="podium-name">${player.name}</div>
        </div>`;
      }).join('')}
    </div>`;
    
    // Make podium slots clickable
    podiumEl.querySelectorAll('.podium-slot').forEach(slot => {
      slot.style.cursor = 'pointer';
      slot.addEventListener('click', () => {
        const playerName = slot.querySelector('.podium-name').textContent;
        openProfile(playerName);
      });
    });
  }
  
  if (['Java', 'Bedrock'].includes(activeEdition)) visibleCount = Number.MAX_SAFE_INTEGER;
  if (['Minecraft Dungeons', 'Minecraft Legends'].includes(activeEdition)) visibleCount = 100;
  const displayed = rankedResult.slice(0, Number.isFinite(visibleCount) ? visibleCount : rankedResult.length);
  grid.innerHTML = displayed.length ? displayed.map(player => {
    const skin = `https://mc-heads.net/body/${encodeURIComponent(player.name)}/100`;
    const sourceNote = player.category && /MCTiers Overall|Subtiers Overall|Speedrun\.com/i.test(player.category) ? `Source rank #${player.sourceRank} on ${player.category}.` : player.reason || laneReasons[player.lane];
    const displayRank = activeEdition === 'Java' ? player.rank : player.editionRank;
    return `<article class="player-card${player.editionRank <= 3 ? ` podium-${player.editionRank}` : ''}" data-player-name="${player.name}" tabindex="0"><img class="skin" src="${skin}" alt="${player.name} Minecraft skin" loading="lazy" onerror="this.src='https://mc-heads.net/avatar/Steve/100'"><div><div class="player-rank">#${displayRank}</div><div class="player-name">${player.name}</div><div class="player-lane">${player.category || player.lane}</div></div><div class="player-reason">${sourceNote}</div></article>`;
  }).join('') : '<div class="empty">No legend found. Try another search.</div>';

  grid.querySelectorAll('.player-card').forEach(card => {
    card.addEventListener('click', () => openProfile(card.dataset.playerName));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProfile(card.dataset.playerName);
      }
    });
  });

  loadMore.hidden = true;
  loadMore.style.display = 'none';
}

const modal = document.querySelector('#player-modal');
if (modal) {
  modal.addEventListener('click', event => {
    if (event.target.dataset.close === 'true' || event.target.closest('.modal-close')) {
      closeProfile();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeProfile();
    }
  });
}
