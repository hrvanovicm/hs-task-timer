const BranchAutocomplete = {
  field(value) {
    return (
      '<div class="combobox relative">' +
        '<div class="flex items-center gap-1">' +
          '<input id="f-branch" type="text" autocomplete="off" placeholder="Select branch..." class="flex-1"' +
            (value ? ' value="' + escapeHtml(value) + '"' : '') + ' />' +
          '<button type="button" class="icon-btn" title="Clear branch">×</button>' +
        '</div>' +
        '<div class="combo-list absolute left-0 right-0 top-full z-20 mt-0.5 hidden max-h-[200px] overflow-y-auto rounded-[2px] border border-edge bg-input"></div>' +
      '</div>'
    );
  },

  bind() {
    const input = document.getElementById('f-branch');
    if (!input) return;
    const wrapper = input.closest('.combobox');
    const list = wrapper.querySelector('.combo-list');
    const clear = wrapper.querySelector('button');

    function render(q) {
      const query = (q || '').trim().toLowerCase();
      const matches = branches.filter((b) => !query || b.toLowerCase().indexOf(query) !== -1);
      list.innerHTML = '';
      if (matches.length === 0) {
        const div = document.createElement('div');
        div.className = 'combo-option head';
        div.textContent = 'No branches';
        list.appendChild(div);
      } else {
        for (const b of matches) {
          const div = document.createElement('div');
          div.className = 'combo-option';
          div.textContent = b;
          div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.value = b;
            list.classList.add('hidden');
          });
          list.appendChild(div);
        }
      }
      list.classList.remove('hidden');
    }

    input.addEventListener('focus', () => render(input.value));
    input.addEventListener('input', () => render(input.value));
    input.addEventListener('blur', () => setTimeout(() => list.classList.add('hidden'), 150));
    clear.addEventListener('click', () => {
      input.value = '';
      list.classList.add('hidden');
      input.focus();
    });
  },
};
