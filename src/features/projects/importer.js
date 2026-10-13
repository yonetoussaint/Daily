import { AREAS, STATUSES, uid } from "./model";

/* ── Paste-in JSON import for folder trees ───────────────────────────────────
 * Turns JSON (typically written by an AI) into folders + tasks for one project.
 * Everything is added inside the folder you have open (or the top level).
 */

/** Prompt the user can hand to an AI so it answers in the format `parseTreeJson` expects. */
export const AI_PROMPT = `Plan a folder tree of tasks for: <DESCRIBE YOUR PROJECT HERE>

Reply with ONLY valid JSON (no markdown code fences, no commentary) in exactly this shape:

{
  "folders": [
    {
      "name": "Folder name",
      "tasks": [
        { "title": "Task title", "area": "tech", "status": "todo", "due": "2026-12-31", "details": "Optional notes" }
      ],
      "folders": [
        { "name": "Sub-folder", "tasks": [ { "title": "Another task" } ], "folders": [] }
      ]
    }
  ],
  "tasks": [
    { "title": "A task at the top level" }
  ]
}

Rules:
- "folders" can nest as deep as needed. Each folder has a "name", and optional "tasks" and "folders".
- A task needs a "title". Everything else is optional.
- "area" is one of: ${AREAS.map((a) => `"${a.id}"`).join(", ")}. Default "product".
- "status" is one of: ${STATUSES.map((s) => `"${s.id}"`).join(", ")}. Default "todo".
- "due" is a date as "YYYY-MM-DD", or leave it out.
- A task can also be just a string, which becomes its title.
- Keep folder names under 60 characters and task titles short.
- Make sure the JSON is valid: double quotes, no trailing commas, and escape any double quote inside a string as \\".`;

const MAX_NAME = 60;
const MAX_TITLE = 120;
const MAX_DETAILS = 2000;
const MAX_DEPTH = 30;

const str = (v, max) => (typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, max) : "");
const list = (v, at, key) => {
  if (v == null) return [];
  if (!Array.isArray(v)) throw new Error(`${at}: "${key}" must be a list.`);
  return v;
};

function toTask(t, at) {
  if (typeof t === "string") {
    const title = str(t, MAX_TITLE);
    if (!title) throw new Error(`${at} is empty.`);
    return { title, area: "product", status: "todo", due: "", details: "" };
  }
  if (!t || typeof t !== "object" || Array.isArray(t)) throw new Error(`${at} must be an object with a "title".`);
  const title = str(t.title ?? t.name, MAX_TITLE);
  if (!title) throw new Error(`${at} needs a "title".`);
  const area = AREAS.some((a) => a.id === String(t.area).toLowerCase()) ? String(t.area).toLowerCase() : "product";
  const rawStatus = String(t.status ?? "").toLowerCase().replace(/[\s_-]/g, "");
  const status = rawStatus === "done" || rawStatus === "completed" ? "done" : rawStatus === "doing" || rawStatus === "inprogress" ? "doing" : "todo";
  const due = typeof t.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.due.trim()) ? t.due.trim() : "";
  return { title, area, status, due, details: str(t.details ?? t.notes ?? t.description, MAX_DETAILS) };
}

/** One folder node: { name, tasks?, folders? } (also accepts "children" holding folders and/or tasks). */
function toFolder(f, at, depth) {
  if (depth > MAX_DEPTH) throw new Error(`${at} is nested too deeply (more than ${MAX_DEPTH} levels).`);
  if (typeof f === "string") return { name: str(f, MAX_NAME) || "Folder", folders: [], tasks: [] };
  if (!f || typeof f !== "object" || Array.isArray(f)) throw new Error(`${at} must be an object with a "name".`);
  const name = str(f.name ?? f.title, MAX_NAME);
  if (!name) throw new Error(`${at} needs a "name".`);
  const { folders, tasks } = toNode(f, `Folder “${name}”`, depth + 1);
  return { name, folders, tasks };
}

/** A node holding folders and tasks, in the several shapes an AI may produce. */
function toNode(node, at, depth) {
  const folders = list(node.folders ?? node.dirs ?? node.directories, at, "folders").map((f, i) => toFolder(f, `${at}, folder ${i + 1}`, depth));
  const tasks = list(node.tasks ?? node.files ?? node.items, at, "tasks").map((t, i) => toTask(t, `${at}, task ${i + 1}`));
  // "children": a mixed list — entries with a name/children/folders/tasks are folders, the rest are tasks
  for (const [i, c] of list(node.children, at, "children").entries()) {
    const isFolder = c && typeof c === "object" && !Array.isArray(c) && ("children" in c || "folders" in c || "tasks" in c || ("name" in c && !("title" in c)));
    if (isFolder) folders.push(toFolder(c, `${at}, child ${i + 1}`, depth));
    else tasks.push(toTask(c, `${at}, child ${i + 1}`));
  }
  return { folders, tasks };
}

/** Pull the JSON out of whatever was pasted: tolerate ```json fences and text around them. */
function extractJson(text) {
  let s = text.trim().replace(/^﻿/, "");
  const fence = s.match(/```(?:json)?\s*\n?([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  if (!/^[[{]/.test(s)) {
    const start = s.search(/[[{]/);
    const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
    if (start !== -1 && end > start) s = s.slice(start, end + 1);
  }
  return s;
}

/**
 * Parse pasted JSON into a tree `{ folders: [{ name, folders, tasks }], tasks: [...] }`.
 * Accepts { folders, tasks }, a single folder { name, ... }, or a plain list of folders/tasks.
 * Throws an Error with a readable message.
 */
export function parseTreeJson(text) {
  if (!text || !text.trim()) throw new Error("Paste some JSON first.");
  let data;
  try {
    data = JSON.parse(extractJson(text));
  } catch (e) {
    throw new Error(`That isn’t valid JSON (${e.message.replace(/^JSON\.parse: /, "")}). Ask the AI to reply with valid JSON only.`);
  }
  if (data === null || typeof data !== "object") throw new Error("The JSON must be an object or a list.");

  let root;
  if (Array.isArray(data)) root = { children: data };
  else if ("name" in data || "title" in data) root = { folders: [data] }; // one named folder
  else root = data;

  const tree = toNode(root, "The tree", 0);
  if (!tree.folders.length && !tree.tasks.length) throw new Error("No folders or tasks found in that JSON.");
  return tree;
}

/** Count what a parsed tree holds. */
export function countTree(tree) {
  let folders = 0;
  let tasks = tree.tasks.length;
  const walk = (list) => list.forEach((f) => { folders++; tasks += f.tasks.length; walk(f.folders); });
  walk(tree.folders);
  return { folders, tasks };
}

/** Turn a parsed tree into flat records with fresh ids, placed under `parentId`. Parents come before their children. */
export function buildTree(tree, parentId = null) {
  const folders = [];
  const tasks = [];
  const addTasks = (list, folderId) => list.forEach((t) => tasks.push({ id: uid("tk"), milestoneId: null, ...t, folderId }));
  const walk = (list, parent) => list.forEach((f) => {
    const id = uid("fd");
    folders.push({ id, name: f.name, parentId: parent });
    addTasks(f.tasks, id);
    walk(f.folders, id);
  });
  addTasks(tree.tasks, parentId);
  walk(tree.folders, parentId);
  return { folders, tasks };
}
