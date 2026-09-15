const Form = {
  enter(view) {
    tabCurrentEl.classList.add('hidden');
    tabListEl.classList.add('hidden');
    VIEWS.forEach((v) => {
      if (v === view) v.classList.remove('hidden');
      else { v.classList.add('hidden'); v.innerHTML = ''; }
    });
  },

  field(label, control, hint) {
    return '<div class="field"><label>' + label + '</label>' + control + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
  },

  input(id, value, opts = {}) {
    let attrs = ' id="' + id + '" type="' + (opts.type || 'text') + '"';
    if (opts.list) attrs += ' list="' + opts.list + '"';
    if (opts.placeholder) attrs += ' placeholder="' + escapeHtml(opts.placeholder) + '"';
    if (opts.min != null) attrs += ' min="' + opts.min + '"';
    if (opts.step != null) attrs += ' step="' + opts.step + '"';
    if (value) attrs += ' value="' + escapeHtml(value) + '"';
    return '<input' + attrs + ' />';
  },

  textarea(id, value) {
    return '<textarea id="' + id + '">' + escapeHtml(value == null ? '' : value) + '</textarea>';
  },

  select(id, options) {
    return '<select id="' + id + '">' + options + '</select>';
  },

  read(id) {
    return document.getElementById(id).value;
  },

  render(view, title, body, buttons) {
    this.enter(view);
    view.innerHTML =
      '<div class="detail-title">' + escapeHtml(title) + '</div>' +
      body +
      '<div class="form-actions">' +
        buttons.map((b) => '<button id="' + b.id + '" class="' + (b.cls || '') + '">' + b.label + '</button>').join('') +
      '</div>';
    for (const b of buttons) {
      document.getElementById(b.id).addEventListener('click', b.onClick);
    }
  },
};
