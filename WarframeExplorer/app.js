const API_URL = "https://api.warframestat.us/warframes/";

document.addEventListener('DOMContentLoaded', () => {
  loadWarframes();
});

async function loadWarframes() {
  const app = document.getElementById('app');
  app.innerHTML = '<h1>Loading Warframes...</h1>';
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const warframes = await res.json();
    displayWarframes(warframes);
  } catch (e) {
    app.innerHTML = '<p>Failed to load data. Check the console for more details.</p>';
    console.error('Error fetching data:', e);
  }
}

function displayWarframes(data) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Warframe Explorer</h1>
    <div class="controls">
      <input type="text" id="search" placeholder="Search Warframes..." />
      <select id="sort">
        <option value="name">Sort by Name</option>
        <option value="health">Sort by Health</option>
        <option value="shield">Sort by Shield</option>
        <option value="armor">Sort by Armor</option>
        <option value="energy">Sort by Energy</option>
        <option value="speed">Sort by Speed</option>
      </select>
      <button id="theme-toggle">Toggle Theme</button>
      <button id="view-favorites">View Favorites</button>
    </div>
    <div id="warframe-list" class="grid"></div>
    <div id="modal" class="modal hidden">
      <div class="modal-content">
        <span id="close-modal" class="close">&times;</span>
        <div id="modal-body"></div>
      </div>
    </div>
  `;

  const list = document.getElementById('warframe-list');
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sort');
  const themeToggle = document.getElementById('theme-toggle');
  const viewFavoritesButton = document.getElementById('view-favorites');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  const closeModal = document.getElementById('close-modal');

  const render = (items) => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    list.innerHTML = items.map(wf => `
      <div class="card" data-name="${wf.name}">
        <img src="${wf.imageName ? `https://cdn.warframestat.us/img/${wf.imageName}` : 'placeholder.jpg'}" alt="${wf.name}" />
        <h2>${wf.name}</h2>
        <button data-name="${wf.name}" class="fav-btn">
          ${favorites.includes(wf.name) ? '⭐ Remove from Favorites' : '⭐ Add to Favorites'}
        </button>
      </div>
    `).join('');

    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', (e) => {
        const name = card.dataset.name;
        const warframe = items.find(wf => wf.name === name);
        showDetails(warframe);
      });
    });

    document.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Voorkom dat de kaart wordt geopend bij klikken op de favorietknop
        const name = e.target.dataset.name;
        saveFavorite(name);
        render(items); // Herlaad de lijst om de knopstatus bij te werken
      });
    });
  };

  const showDetails = (warframe) => {
    modalBody.innerHTML = `
      <h2>${warframe.name}</h2>
      <img src="${warframe.imageName ? `https://cdn.warframestat.us/img/${warframe.imageName}` : 'placeholder.jpg'}" alt="${warframe.name}" />
      <p>${warframe.description || 'No description available'}</p>
      <h3>Stats</h3>
      <ul>
        <li><strong>Health:</strong> ${warframe.health ?? 'N/A'}</li>
        <li><strong>Shield:</strong> ${warframe.shield ?? 'N/A'}</li>
        <li><strong>Armor:</strong> ${warframe.armor ?? 'N/A'}</li>
        <li><strong>Energy:</strong> ${(warframe.power ?? warframe.energy) ?? 'N/A'}</li>
        <li><strong>Speed:</strong> ${
          (typeof (warframe.sprintSpeed ?? warframe.speed) === 'number')
            ? (warframe.sprintSpeed ?? warframe.speed).toFixed(2)
            : ((warframe.sprintSpeed ?? warframe.speed) || 'N/A')
        }</li>
      </ul>
      <h3>Abilities</h3>
      <ul>
        ${warframe.abilities.map(ability => `
          <li>
            <strong>${ability.name}:</strong> ${ability.description}
          </li>
        `).join('')}
      </ul>
      ${warframe.helminthAbility ? `
        <h3>Helminth Ability</h3>
        <div>
          <p><strong>${warframe.helminthAbility.name}:</strong> ${warframe.helminthAbility.description}</p>
        </div>
      ` : ''}
    `;
    modal.classList.remove('hidden');
  };

  const showFavorites = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoriteWarframes = data.filter(wf => favorites.includes(wf.name));
    if (favoriteWarframes.length === 0) {
      alert('No favorites added yet!');
      return;
    }
    render(favoriteWarframes);
  };

  viewFavoritesButton.addEventListener('click', showFavorites);

  closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  render(data);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = data.filter(wf => wf.name.toLowerCase().includes(query));
    render(filtered);
  });

  sortSelect.addEventListener('change', (e) => {
    const sortBy = e.target.value;
    const sorted = [...data].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'health') return (b.health || 0) - (a.health || 0);
      if (sortBy === 'shield') return (b.shield || 0) - (a.shield || 0);
      if (sortBy === 'armor') return (b.armor || 0) - (a.armor || 0);
      if (sortBy === 'energy') return ((b.power ?? b.energy) || 0) - ((a.power ?? a.energy) || 0);
      if (sortBy === 'speed') return ((b.sprintSpeed ?? b.speed) || 0) - ((a.sprintSpeed ?? a.speed) || 0);
    });
    render(sorted);
  });

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Apply saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}

function saveFavorite(name) {
  let favs = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favs.includes(name)) {
    // Verwijder uit favorieten
    favs = favs.filter(fav => fav !== name);
    localStorage.setItem('favorites', JSON.stringify(favs));
    alert(`${name} removed from favorites!`);
  } else {
    // Voeg toe aan favorieten
    favs.push(name);
    localStorage.setItem('favorites', JSON.stringify(favs));
    alert(`${name} added to favorites!`);
  }
}