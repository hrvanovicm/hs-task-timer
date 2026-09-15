const List = {
  render() {
    const q = (listSearchEl.value || '').trim().toLowerCase();
    const showClosed = showClosedEl.checked;

    let items = combinedItems().filter((it) => {
      if (!showClosed && it.obj.closed) return false;
      if (q) {
        const hay = (it.obj.name + ' ' + (it.obj.deadline || '') + ' ' + (it.obj.branch || '') + ' ' + (it.obj.start || '')).toLowerCase();
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
    const closeBtn = o.closed
      ? '<button class="icon-btn" data-action="uncloseItem" data-kind="' + it.kind + '" data-id="' + escapeHtml(o.id) + '" title="Reopen">\u21bb</button>'
      : '<button class="icon-btn" data-action="closeItem" data-kind="' + it.kind + '" data-id="' + escapeHtml(o.id) + '" title="Close">\u2713</button>';
    const delBtn = '<button class="icon-btn" data-action="deleteItem" data-kind="' + it.kind + '" data-id="' + escapeHtml(o.id) + '" title="Delete">\u00d7</button>';
    const nameCls = (o.closed ? ' i-closed' : '') + (dl ? ' ' + dl : '');
    return (
      '<div class="item-row' + (o.closed ? ' closed' : '') + '" data-action="editItem" data-kind="' + it.kind + '" data-id="' + escapeHtml(o.id) + '">' +
        '<div class="item-line1">' +
          '<span class="i-name' + nameCls + '">' + escapeHtml(o.name) + '</span>' +
          '<span class="i-meta">' + kindLabel + '</span>' +
          closeBtn + delBtn +
        '</div>' +
        (sub ? '<div class="item-line2">' + escapeHtml(sub) + '</div>' : '') +
      '</div>'
    );
  },
};
