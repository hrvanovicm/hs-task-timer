const Tabs = {
  active: 'current',

  render() {
    const current = this.active === 'current';
    tabCurrentBtn.classList.toggle('active', current);
    tabListBtn.classList.toggle('active', !current);
    tabCurrentEl.classList.toggle('hidden', !current);
    tabListEl.classList.toggle('hidden', current);
  },

  renderCurrent() {
    Tracker.render();
    Due.render();
    Sections.render();
    Stats.render();
  },

  show(tab) {
    this.active = tab;
    this.render();
    Tracker.hideComboList();
    VIEWS.forEach((v) => v.classList.add('hidden'));
    if (tab === 'current') this.renderCurrent();
    else List.render();
  },

  showCurrent() { this.show('current'); },
  showList() { this.show('list'); },
};
