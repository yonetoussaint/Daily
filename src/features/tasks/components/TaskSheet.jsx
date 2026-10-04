import { useState } from "react";
import { Button, ButtonGroup, Chip, Sheet, TextField } from "../../../design/components";
import { PRIORITIES, PRIORITY_META, ROOMS } from "../model";
import { useTasks } from "../TasksProvider";

/** Add / edit sheet. Mounted only while open, so its form state always starts fresh. */
export default function TaskSheet() {
  const { editor, closeEditor, actions, room: activeRoom } = useTasks();
  const item = editor.item;

  const [name, setName] = useState(item?.name ?? "");
  const [priority, setPriority] = useState(item?.priority ?? "Medium");
  const [room, setRoom] = useState(item?.room ?? (activeRoom !== "All" ? activeRoom : ROOMS[0].name));

  const submit = (e) => {
    e.preventDefault();
    const data = { name: name.trim(), priority, room };
    if (!data.name) return;
    closeEditor();
    item ? actions.update(item, data) : actions.create(data);
  };

  return (
    <Sheet title={item ? "Edit task" : "New task"} onClose={closeEditor}>
      <form onSubmit={submit} className="sheet-form">
        <TextField label="What needs doing?" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={120} autoComplete="off" />

        <fieldset className="sheet-section">
          <legend className="label-lg muted">Priority</legend>
          <ButtonGroup
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].short, hue: PRIORITY_META[p].hue, icon: (() => { const I = PRIORITY_META[p].icon; return <I size={18} />; })() }))}
          />
        </fieldset>

        <fieldset className="sheet-section">
          <legend className="label-lg muted">Room</legend>
          <div className="chip-wrap">
            {ROOMS.map((r) => {
              const Icon = r.icon;
              return (
                <Chip key={r.name} hue={r.hue} selected={room === r.name} icon={<Icon size={18} />} onClick={() => setRoom(r.name)}>
                  {r.name}
                </Chip>
              );
            })}
          </div>
        </fieldset>

        <div className="sheet-actions">
          <Button variant="text" onClick={closeEditor}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>{item ? "Save changes" : "Add task"}</Button>
        </div>
      </form>
    </Sheet>
  );
}
