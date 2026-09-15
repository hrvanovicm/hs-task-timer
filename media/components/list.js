const List = {
  render() {
    const q = (listSearchEl.value || '').trim().toLowerCase();
    const showClosed = showClosedEl.checked;

    let items = combinedItems().filter((it) => {
      if (!showClosed && it.obj.closed) return false;
      if (q) {
        const hay = (it.obj.name + ' ' + (it.obj.deadline || '') + ' ' + (it.obj.branch || '') + ' ' + (it.obj.start || '') + ' ' + (Array.isArray(it.obj.tags) ? it.obj.tags.join(' ') : '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    items = sortByDeadline(items);

    if (items.length === 0) {
      listItemsEl.innerHTML = '<div class="empty">Nothing here.</div>';
      return;
    }

    listItemsEl.innerHTML = items.map((it) => this.rowHtml(it)).join('');
  },

  rowHtml(it) {
    const o = it.obj;
    const dl = it.kind === 'task' ? deadlineClass(o.deadline) : '';
    const kindLabel = it.kind === 'task' ? 'task' : 'meeting';
    const sub = itemSubLine(it);
    const badges = tagBadgesHtml(o.tags);
    const urlBtn = o.url
      ? '<button class="icon-btn" data-action="openUrl" data-url="' + escapeHtml(o.url) + '" title="Open ' + escapeHtml(o.url) + '">\u2197</button>'
      : '';
    const closeBtn = o.closed
      ? '<button class="icon-btn" data-action="uncloseItem" data-kind="' + it.kind + '" data-id="' + escapeHtml(o.id) + '" title="Reopen">\u21bb</button>'
      : '<button class="icon-btn" data-action="closeItem" data-kind="' + it.kind + '" data-id="' + escapeHtml(o.id) + '" title="Close">\u2713</button>';
    const delBtn = '<button class="icon-btn" data-action="deleteItem" data-kind="' + it.kind + '" data-id="' + escapeHtml(o.id) + '" title="Delete">\u00d7</button>';
    const nameCls = (o.closed ? ' i-closed' : '') + (dl ? ' ' + dl : '');
    const line2 = badges || sub
      ? '<div class="item-line2">' + badges + (sub ? '<span class="i-sub">' + escapeHtml(sub) + '</span>' : '') + '</div>'
      : '';
    return (
      '<div class="item-row' + (o.closed ? ' closed' : '') + '" data-action="editItem" data-kind="' + it.kind + '" data-id="' + escapeHtml(o.id) + '" title="' + escapeHtml(itemTooltip(o)) + '">' +
        '<div class="item-line1">' +
          '<span class="i-name' + nameCls + '">' + escapeHtml(o.name) + '</span>' +
          '<span class="i-meta">' + kindLabel + '</span>' +
          urlBtn + closeBtn + delBtn +
        '</div>' +
        line2 +
      '</div>'
    );
  },
};
