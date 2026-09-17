const KIND_CAP = { task: 'Task', meeting: 'Meeting' };

const ItemForm = {
  render(kind, item, backTo) {
    const Cap = KIND_CAP[kind];
    const edit = !!item;
    const back = () => (backTo === 'current' ? Tabs.showCurrent() : Tabs.showList());

    const buttons = edit ? [
      { id: 'delete', cls: 'danger', label: 'Delete', onClick: () => { post({ type: 'delete' + Cap, id: item.id }); back(); } },
      { id: 'toggle', cls: 'secondary', label: item.closed ? 'Reopen' : 'Close', onClick: () => { post({ type: 'set' + Cap + 'Closed', id: item.id, closed: !item.closed }); back(); } },
    ] : [];
    buttons.push({ id: 'cancel', cls: 'secondary', label: 'Cancel', onClick: back });
    buttons.push({ id: 'save', label: edit ? 'Save' : 'Add', onClick: save });

    Form.render(newView, (edit ? 'Edit ' : 'Add ') + kind, this.fields(kind, item), buttons);
    if (kind === 'task') BranchAutocomplete.bind();

    function save() {
      const data = ItemForm.readFields(kind);
      if (!data.name) { document.getElementById('f-name').focus(); return; }
      if (edit) post({ type: 'update' + Cap, id: item.id, patch: data });
      else post({ type: 'add' + Cap, ...data });
      back();
    }
  },

  fields(kind, item) {
    const v = (key, def = '') => (item ? item[key] : def) ?? '';
    const tagsValue = item && Array.isArray(item.tags) ? item.tags.join(', ') : '';
    if (kind === 'task') {
      return (
        Form.field('Title', Form.input('f-name', v('name'), { placeholder: 'Title' })) +
        Form.field('Branch', BranchAutocomplete.field(v('branch'))) +
        Form.field('Deadline', Form.input('f-deadline', v('deadline'), { type: 'date' })) +
        Form.field('Estimate', Form.input('f-estimate', v('estimate'), { placeholder: 'e.g. 2d 8h 30m' })) +
        Form.field('Tags', Form.input('f-tags', tagsValue, { placeholder: 'comma, separated' })) +
        Form.field('URL', Form.input('f-url', v('url'), { placeholder: 'https://' })) +
        Form.field('Description', Form.textarea('f-notes', v('notes')))
      );
    }
    return (
      Form.field('Title', Form.input('f-name', v('name'), { placeholder: 'Title' })) +
      Form.field('Date & time', Form.input('f-start', v('start'), { type: 'datetime-local' })) +
      Form.field('Tags', Form.input('f-tags', tagsValue, { placeholder: 'comma, separated' })) +
      Form.field('URL', Form.input('f-url', v('url'), { placeholder: 'https://' })) +
      Form.field('Description', Form.textarea('f-notes', v('notes')))
    );
  },

  readFields(kind) {
    const name = Form.read('f-name').trim();
    if (kind === 'task') {
      return {
        name,
        branch: Form.read('f-branch').trim() || null,
        deadline: Form.read('f-deadline') || null,
        estimate: Form.read('f-estimate') || null,
        tags: parseTags(Form.read('f-tags')),
        url: Form.read('f-url').trim() || null,
        notes: Form.read('f-notes') || null,
      };
    }
    return {
      name,
      start: Form.read('f-start'),
      tags: parseTags(Form.read('f-tags')),
      url: Form.read('f-url').trim() || null,
      notes: Form.read('f-notes') || null,
    };
  },

  task() { this.render('task'); },
  meeting() { this.render('meeting'); },

  editTask(id, backTo) {
    const task = tasks.find((t) => t.id === id);
    if (task) this.render('task', task, backTo);
  },

  editMeeting(id, backTo) {
    const meeting = meetings.find((m) => m.id === id);
    if (meeting) this.render('meeting', meeting, backTo);
  },
};
