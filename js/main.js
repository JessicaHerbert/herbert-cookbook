// === Tag Filtering ===
const tagFilters = document.getElementById('tagFilters');
const recipeList = document.getElementById('recipeList');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('search');

if (tagFilters) {
  tagFilters.addEventListener('click', function(e) {
    const pill = e.target.closest('.tag-pill');
    if (!pill) return;

    // Update active state
    tagFilters.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    filterRecipes();
  });
}

// === Search ===
if (searchInput) {
  searchInput.addEventListener('input', filterRecipes);
}

function filterRecipes() {
  if (!recipeList) return;

  const activeTag = tagFilters
    ? tagFilters.querySelector('.tag-pill.active')?.dataset.tag || 'all'
    : 'all';
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const rows = recipeList.querySelectorAll('.recipe-row');
  let visibleCount = 0;

  rows.forEach(row => {
    const name = row.dataset.name || '';
    const tags = row.dataset.tags || '';

    const matchesTag = activeTag === 'all' || tags.split(',').includes(activeTag);
    const matchesSearch = !searchTerm || name.includes(searchTerm) || tags.includes(searchTerm);

    const visible = matchesTag && matchesSearch;
    row.style.display = visible ? '' : 'none';
    if (visible) visibleCount++;
  });

  if (noResults) {
    noResults.style.display = visibleCount === 0 ? '' : 'none';
  }
}

// === Share ===
function shareRecipe() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const toast = document.getElementById('shareToast');
    if (toast) {
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2000);
    }
  });
}

// Make shareRecipe available globally
window.shareRecipe = shareRecipe;
