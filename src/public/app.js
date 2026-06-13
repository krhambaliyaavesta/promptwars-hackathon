document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('plan-form');
  const scheduleSelect = document.getElementById('schedule-select');
  const customSchedule = document.getElementById('custom-schedule');
  const submitBtn = document.getElementById('submit-btn');
  const preferencesInput = document.getElementById('preferences');
  const chipBtns = document.querySelectorAll('.chip-btn');

  // Views
  const placeholderView = document.getElementById('placeholder-view');
  const loadingView = document.getElementById('loading-view');
  const resultsView = document.getElementById('results-view');

  // Result node hooks
  const budgetBadge = document.getElementById('budget-badge');
  const estimatedCost = document.getElementById('estimated-cost');
  const budgetExplanation = document.getElementById('budget-explanation');
  
  const specSchedule = document.getElementById('spec-schedule');
  const specBudget = document.getElementById('spec-budget');
  const specPreferences = document.getElementById('spec-preferences');

  const mealBreakfast = document.getElementById('meal-breakfast');
  const mealLunch = document.getElementById('meal-lunch');
  const mealDinner = document.getElementById('meal-dinner');

  const groceryCount = document.getElementById('grocery-count');
  const groceryListContainer = document.getElementById('grocery-list-container');
  const substitutionsContainer = document.getElementById('substitutions-container');

  // Toggle custom schedule textarea
  scheduleSelect.addEventListener('change', () => {
    if (scheduleSelect.value === 'custom') {
      customSchedule.classList.remove('hidden');
      customSchedule.setAttribute('required', 'true');
      customSchedule.focus();
    } else {
      customSchedule.classList.add('hidden');
      customSchedule.removeAttribute('required');
    }
  });

  // Handle chips clicks
  chipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-value');
      let currentVal = preferencesInput.value.trim();
      
      if (currentVal === '') {
        preferencesInput.value = val;
      } else if (!currentVal.toLowerCase().includes(val.toLowerCase())) {
        preferencesInput.value = `${currentVal}, ${val}`;
      }
      
      // Focus the input to let the user type more
      preferencesInput.focus();
    });
  });

  // Form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect schedule values
    let schedule = '';
    if (scheduleSelect.value === 'custom') {
      schedule = customSchedule.value.trim();
    } else {
      schedule = scheduleSelect.options[scheduleSelect.selectedIndex].text;
    }

    const budgetVal = parseFloat(document.getElementById('budget').value);
    const preferences = preferencesInput.value.trim() || 'No specific dietary restrictions';

    // Show loading skeleton, hide other panels
    placeholderView.classList.add('hidden');
    resultsView.classList.add('hidden');
    loadingView.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Synthesizing...</span>
    `;

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule,
          budget: budgetVal,
          preferences,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      renderCookingPlan(data, schedule, budgetVal, preferences);

      // Transition views
      loadingView.classList.add('hidden');
      resultsView.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      alert(`Synthesis Failed: ${err.message}`);
      
      // Restore states
      loadingView.classList.add('hidden');
      placeholderView.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Generate Cooking Plan</span>
        <span>⚡</span>
      `;
    }
  });

  // Render synthesized JSON plan
  function renderCookingPlan(data, schedule, budgetVal, preferences) {
    // 1. Render Specs Card
    specSchedule.textContent = schedule;
    specBudget.textContent = `$${budgetVal.toFixed(2)}`;
    specPreferences.textContent = preferences;

    // 2. Render Budget Feasibility Check
    const isFeasible = data.budgetFeasibility.isFeasible;
    estimatedCost.textContent = `$${data.budgetFeasibility.estimatedCost.toFixed(2)}`;
    budgetExplanation.textContent = data.budgetFeasibility.explanation;

    if (isFeasible) {
      budgetBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      budgetBadge.textContent = 'Within Budget';
    } else {
      budgetBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20';
      budgetBadge.textContent = 'Over Budget';
    }

    // 3. Render Meal Plan Recipes
    mealBreakfast.textContent = data.mealPlan.breakfast || 'Not specified';
    mealLunch.textContent = data.mealPlan.lunch || 'Not specified';
    mealDinner.textContent = data.mealPlan.dinner || 'Not specified';

    // 4. Render Grocery List
    groceryListContainer.innerHTML = '';
    const items = data.groceryList || [];
    groceryCount.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;

    if (items.length === 0) {
      groceryListContainer.innerHTML = `
        <li class="text-sm text-slate-400 text-center py-6">
          No groceries needed or specified.
        </li>
      `;
    } else {
      items.forEach((item, index) => {
        const id = `grocery-item-${index}`;
        const li = document.createElement('li');
        li.className = 'flex items-start space-x-3 py-1.5 border-b border-slate-900/40 last:border-0';
        li.innerHTML = `
          <input type="checkbox" id="${id}" class="checkbox-custom mt-1 h-4 w-4 rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950">
          <label for="${id}" class="text-sm text-slate-300 font-medium cursor-pointer select-none leading-relaxed">
            ${item}
          </label>
        `;
        groceryListContainer.appendChild(li);
      });
    }

    // 5. Render Ingredient Substitutions
    substitutionsContainer.innerHTML = '';
    const subs = data.substitutions || [];
    
    if (subs.length === 0) {
      substitutionsContainer.innerHTML = `
        <div class="text-sm text-slate-400 text-center py-6">
          No substitutions recommended.
        </div>
      `;
    } else {
      subs.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'bg-slate-950/40 border border-slate-900 rounded-xl p-4 space-y-2.5';
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400">Replace</span>
            <span class="text-xs font-semibold text-emerald-400">With</span>
          </div>
          <div class="flex items-center justify-between font-bold text-sm text-white">
            <span>${sub.original}</span>
            <span class="text-emerald-400">&rarr; ${sub.substitute}</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed italic border-t border-slate-900/60 pt-2">
            "${sub.reason}"
          </p>
        `;
        substitutionsContainer.appendChild(card);
      });
    }
  }
});
