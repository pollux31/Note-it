/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => NoteItPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  storageFolder: "/",
  storageFileName: "note-it-storage.md",
  defaultColor: "#ffeb3b"
};
var VIEW_TYPE_NOTE_IT = "note-it-view";
var NoteItPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.notes = [];
    this.currentMaxZIndex = 10;
  }
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("sticky-note", "Note-it", () => {
      this.activateView();
    });
    this.addCommand({
      id: "create-new-sticky-note",
      name: "Cr\xE9er une nouvelle note post-it",
      callback: () => {
        this.createNewNote();
      }
    });
    this.registerView(VIEW_TYPE_NOTE_IT, (leaf) => this.view = new NoteItView(leaf, this));
    this.addCommand({
      id: "open-note-it-view",
      name: "Ouvrir Note-it",
      callback: () => {
        this.activateView();
      }
    });
    this.loadNotes();
    this.addSettingTab(new NoteItSettingTab(this.app, this));
  }
  onunload() {
    this.saveNotes();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async createNewNote() {
    const id = Date.now().toString();
    const newNote = {
      id,
      title: "Nouvelle note",
      content: "Contenu de la note",
      position: {
        x: Math.floor(Math.random() * 300),
        y: Math.floor(Math.random() * 300)
      },
      color: this.settings.defaultColor,
      createdAt: Date.now(),
      zIndex: this.currentMaxZIndex
    };
    this.notes.push(newNote);
    this.currentMaxZIndex++;
    await this.saveNotes();
    this.refreshView();
    setTimeout(() => {
      const noteEl = document.querySelector(`.sticky-note[data-id="${id}"]`);
      if (noteEl) {
        noteEl.style.width = "200px";
        noteEl.style.height = "200px";
        localStorage.setItem(`note-it-size-${id}`, JSON.stringify({ width: 200, height: 200 }));
      }
    }, 50);
    new import_obsidian.Notice("Nouvelle note cr\xE9\xE9e!");
  }
  async saveNotes() {
    try {
      const storagePath = this.settings.storageFolder === "/" ? this.settings.storageFileName : `${this.settings.storageFolder}/${this.settings.storageFileName}`;
      const storageFile = this.app.vault.getAbstractFileByPath(storagePath);
      const content = `---
notes: ${JSON.stringify(this.notes)}
---
# Notes Post-it
Ce fichier contient les donn\xE9es de vos notes post-it. Ne pas modifier manuellement.
`;
      if (storageFile instanceof import_obsidian.TFile) {
        await this.app.vault.modify(storageFile, content);
      } else {
        const folder = this.app.vault.getAbstractFileByPath(this.settings.storageFolder);
        if (this.settings.storageFolder !== "/" && !(folder instanceof import_obsidian.TFolder)) {
          await this.app.vault.createFolder(this.settings.storageFolder);
        }
        await this.app.vault.create(storagePath, content);
      }
    } catch (error) {
      new import_obsidian.Notice(`Erreur lors de la sauvegarde des notes: ${error}`);
      console.error("Erreur lors de la sauvegarde des notes:", error);
    }
  }
  async loadNotes() {
    try {
      const storagePath = this.settings.storageFolder === "/" ? this.settings.storageFileName : `${this.settings.storageFolder}/${this.settings.storageFileName}`;
      const storageFile = this.app.vault.getAbstractFileByPath(storagePath);
      if (storageFile instanceof import_obsidian.TFile) {
        const content = await this.app.vault.read(storageFile);
        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (yamlMatch && yamlMatch[1]) {
          try {
            const yamlContent = yamlMatch[1];
            const notesMatch = yamlContent.match(/notes: (.*)/);
            if (notesMatch && notesMatch[1]) {
              this.notes = JSON.parse(notesMatch[1]);
              this.currentMaxZIndex = 10;
              this.notes.forEach((note) => {
                if (note.zIndex && note.zIndex > this.currentMaxZIndex) {
                  this.currentMaxZIndex = note.zIndex;
                }
              });
              this.refreshView();
            }
          } catch (e) {
            console.error("Erreur lors du parsing des notes:", e);
          }
        }
      }
    } catch (error) {
      console.log("Aucun fichier de stockage trouv\xE9 ou erreur de lecture:", error);
    }
  }
  async deleteNote(id) {
    this.notes = this.notes.filter((note) => note.id !== id);
    await this.saveNotes();
    this.refreshView();
    new import_obsidian.Notice("Note supprim\xE9e");
  }
  async updateNoteTitle(id, title) {
    const noteIndex = this.notes.findIndex((note) => note.id === id);
    if (noteIndex >= 0) {
      this.notes[noteIndex].title = title;
      await this.saveNotes();
    }
  }
  async updateNoteContent(id, content) {
    const noteIndex = this.notes.findIndex((note) => note.id === id);
    if (noteIndex >= 0) {
      this.notes[noteIndex].content = content;
      await this.saveNotes();
    }
  }
  async updateNotePosition(id, x, y) {
    const noteIndex = this.notes.findIndex((note) => note.id === id);
    if (noteIndex >= 0) {
      this.notes[noteIndex].position = { x, y };
      await this.saveNotes();
    }
  }
  async updateNoteColor(id, color) {
    const noteIndex = this.notes.findIndex((note) => note.id === id);
    if (noteIndex >= 0) {
      this.notes[noteIndex].color = color;
      await this.saveNotes();
      const noteEl = document.querySelector(`.sticky-note[data-id="${id}"]`);
      if (noteEl) {
        noteEl.style.backgroundColor = color;
      }
    }
  }
  async bringNoteToFront(id) {
    const noteIndex = this.notes.findIndex((note) => note.id === id);
    if (noteIndex >= 0) {
      this.currentMaxZIndex++;
      this.notes[noteIndex].zIndex = this.currentMaxZIndex;
      const noteEl = document.querySelector(`.sticky-note[data-id="${id}"]`);
      if (noteEl) {
        noteEl.style.zIndex = this.currentMaxZIndex.toString();
      }
      await this.saveNotes();
    }
  }
  refreshView() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_NOTE_IT).forEach((leaf) => {
      if (leaf.view instanceof NoteItView) {
        leaf.view.refresh();
      }
    });
  }
  async activateView() {
    const workspace = this.app.workspace;
    const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_NOTE_IT);
    if (existingLeaves.length > 0) {
      workspace.revealLeaf(existingLeaves[0]);
      return;
    }
    const leaf = workspace.getLeaf(true);
    if (leaf) {
      await leaf.setViewState({
        type: VIEW_TYPE_NOTE_IT,
        active: true
      });
    } else {
      new import_obsidian.Notice("Impossible de cr\xE9er la vue Note-it");
    }
  }
};
var NoteItView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_NOTE_IT;
  }
  getDisplayText() {
    return "Note-it";
  }
  getIcon() {
    return "sticky-note";
  }
  async onOpen() {
    const container = this.containerEl;
    container.empty();
    container.addClass("note-it-container");
    this.renderNotes(container);
  }
  async onClose() {
    this.containerEl.empty();
  }
  refresh() {
    const container = this.containerEl;
    container.empty();
    container.addClass("note-it-container");
    this.renderNotes(container);
  }
  renderNotes(container) {
    const header = container.createDiv({ cls: "notes-header" });
    header.createEl("h1", { text: "Notes Post-it" });
    const actionButtons = header.createDiv({ cls: "action-buttons" });
    const newNoteBtn = actionButtons.createEl("button", {
      text: "Nouvelle note",
      cls: "new-note-button"
    });
    newNoteBtn.addEventListener("click", () => {
      this.plugin.createNewNote();
    });
    const notesContainer = container.createDiv({ cls: "notes-container" });
    this.plugin.notes.forEach((note) => {
      this.renderNote(notesContainer, note);
    });
  }
  renderNote(container, note) {
    const noteEl = container.createDiv({ cls: "sticky-note" });
    noteEl.style.left = `${note.position.x}px`;
    noteEl.style.top = `${note.position.y}px`;
    noteEl.style.backgroundColor = note.color;
    if (note.zIndex) {
      noteEl.style.zIndex = note.zIndex.toString();
    }
    noteEl.setAttribute("data-id", note.id);
    noteEl.addEventListener("mousedown", () => {
      this.plugin.bringNoteToFront(note.id);
    });
    const headerEl = noteEl.createDiv({ cls: "note-header" });
    const titleEl = headerEl.createDiv({ cls: "note-title" });
    const titleInput = titleEl.createEl("input", {
      type: "text",
      attr: {
        placeholder: "Titre de la note"
      }
    });
    titleInput.value = note.title;
    const toolbar = headerEl.createDiv({ cls: "note-toolbar" });
    const colorBtn = toolbar.createEl("button", { cls: "color-btn" });
    colorBtn.innerHTML = "\u{1F3A8}";
    colorBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const colorPicker = new ColorPickerModal(this.plugin.app, note.color, (color) => {
        this.plugin.updateNoteColor(note.id, color);
      });
      colorPicker.open();
    });
    const deleteBtn = toolbar.createEl("button", { cls: "delete-btn" });
    deleteBtn.innerHTML = "\u274C";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.plugin.deleteNote(note.id);
    });
    titleInput.addEventListener("input", (e) => {
      const target = e.target;
      this.plugin.updateNoteTitle(note.id, target.value);
    });
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.toggleEditMode(noteEl, note, true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        titleInput.value = note.title;
        titleInput.blur();
      }
    });
    const contentEl = noteEl.createDiv({ cls: "note-content" });
    const renderedContentEl = contentEl.createDiv({ cls: "rendered-content" });
    renderedContentEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleEditMode(noteEl, note, true);
    });
    const textArea = contentEl.createEl("textarea", {
      attr: {
        placeholder: "Contenu de la note"
      },
      cls: "hidden"
    });
    textArea.value = note.content;
    this.renderMarkdown(note.content, renderedContentEl);
    textArea.addEventListener("input", (e) => {
      const target = e.target;
      this.plugin.updateNoteContent(note.id, target.value);
      this.renderMarkdown(target.value, renderedContentEl);
    });
    textArea.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        textArea.value = note.content;
        this.toggleEditMode(noteEl, note, false);
      }
    });
    textArea.addEventListener("blur", () => {
      this.toggleEditMode(noteEl, note, false);
    });
    this.makeNoteDraggable(noteEl, note);
    this.makeNoteResizable(noteEl, note);
  }
  toggleEditMode(noteEl, note, enterEditMode) {
    const textArea = noteEl.querySelector("textarea");
    const renderedContent = noteEl.querySelector(".rendered-content");
    const shouldEnterEditMode = enterEditMode !== void 0 ? enterEditMode : renderedContent.style.display !== "none";
    if (shouldEnterEditMode) {
      textArea.classList.remove("hidden");
      renderedContent.classList.add("hidden");
      textArea.focus();
    } else {
      textArea.classList.add("hidden");
      renderedContent.classList.remove("hidden");
      this.renderMarkdown(note.content, renderedContent);
    }
  }
  renderMarkdown(text, targetEl) {
    targetEl.empty();
    try {
      import_obsidian.MarkdownRenderer.renderMarkdown(text, targetEl, "", this.plugin);
      const allElements = targetEl.querySelectorAll("*");
      allElements.forEach((el) => {
        el.style.margin = "0";
        el.style.padding = "0";
      });
      const lists = targetEl.querySelectorAll("ul, ol");
      lists.forEach((list) => {
        list.style.paddingLeft = "1em";
        list.style.listStylePosition = "inside";
      });
    } catch (e) {
      targetEl.innerHTML = this.simpleMarkdownToHtml(text);
    }
  }
  simpleMarkdownToHtml(markdown) {
    let html = markdown.replace(/^# (.*?)$/m, "<h1>$1</h1>").replace(/^## (.*?)$/m, "<h2>$1</h2>").replace(/^### (.*?)$/m, "<h3>$1</h3>").replace(/^#### (.*?)$/m, "<h4>$1</h4>").replace(/^##### (.*?)$/m, "<h5>$1</h5>").replace(/^###### (.*?)$/m, "<h6>$1</h6>");
    html = html.replace(/^\* (.*?)$/m, "<li>$1</li>").replace(/^- (.*?)$/m, "<li>$1</li>").replace(/^[0-9]+\. (.*?)$/m, "<li>$1</li>");
    const ulRegex = /<li>(?![\d]+\.)(.*?)<\/li>/;
    const olRegex = /<li>[\d]+\.(.*?)<\/li>/;
    let ulMatches = html.match(new RegExp(ulRegex.source, "g"));
    if (ulMatches) {
      html = html.replace(new RegExp(ulMatches.join(""), "g"), `<ul>${ulMatches.join("")}</ul>`);
    }
    let olMatches = html.match(new RegExp(olRegex.source, "g"));
    if (olMatches) {
      html = html.replace(new RegExp(olMatches.join(""), "g"), `<ol>${olMatches.join("")}</ol>`);
    }
    const lines = html.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith("<h") && !line.startsWith("<ul") && !line.startsWith("<ol") && !line.startsWith("<li")) {
        lines[i] = `<p>${line}</p>`;
      }
    }
    html = lines.join("\n");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/__(.*?)__/g, "<strong>$1</strong>").replace(/_(.*?)_/g, "<em>$1</em>");
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">');
    html = html.replace(/```([^`]*?)```/g, "<pre><code>$1</code></pre>").replace(/`([^`]*?)`/g, "<code>$1</code>");
    return html;
  }
  makeNoteDraggable(noteEl, note) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    const header = noteEl.querySelector(".note-header");
    header.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT") {
        return;
      }
      isDragging = true;
      offsetX = e.clientX - note.position.x;
      offsetY = e.clientY - note.position.y;
      noteEl.addClass("dragging");
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging)
        return;
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      noteEl.style.left = `${newX}px`;
      noteEl.style.top = `${newY}px`;
    });
    document.addEventListener("mouseup", (e) => {
      if (!isDragging)
        return;
      isDragging = false;
      noteEl.removeClass("dragging");
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      this.plugin.updateNotePosition(note.id, newX, newY);
    });
  }
  makeNoteResizable(noteEl, note) {
    const resizeHandles = ["se", "sw", "ne", "nw", "n", "s", "e", "w"];
    resizeHandles.forEach((position) => {
      const handle = noteEl.createDiv({ cls: `resize-handle resize-${position}` });
      let startX;
      let startY;
      let startWidth;
      let startHeight;
      let startLeft;
      let startTop;
      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = noteEl.offsetWidth;
        startHeight = noteEl.offsetHeight;
        startLeft = note.position.x;
        startTop = note.position.y;
        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stopResize);
      });
      const resize = (e) => {
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        if (position.includes("e")) {
          newWidth = startWidth + (e.clientX - startX);
        } else if (position.includes("w")) {
          newWidth = startWidth - (e.clientX - startX);
          newLeft = startLeft + (e.clientX - startX);
        }
        if (position.includes("s")) {
          newHeight = startHeight + (e.clientY - startY);
        } else if (position.includes("n")) {
          newHeight = startHeight - (e.clientY - startY);
          newTop = startTop + (e.clientY - startY);
        }
        const minWidth = 150;
        const minHeight = 150;
        if (newWidth < minWidth) {
          if (position.includes("w")) {
            newLeft = startLeft + startWidth - minWidth;
          }
          newWidth = minWidth;
        }
        if (newHeight < minHeight) {
          if (position.includes("n")) {
            newTop = startTop + startHeight - minHeight;
          }
          newHeight = minHeight;
        }
        noteEl.style.width = `${newWidth}px`;
        noteEl.style.height = `${newHeight}px`;
        noteEl.style.left = `${newLeft}px`;
        noteEl.style.top = `${newTop}px`;
      };
      const stopResize = () => {
        document.removeEventListener("mousemove", resize);
        document.removeEventListener("mouseup", stopResize);
        const newLeft = parseInt(noteEl.style.left);
        const newTop = parseInt(noteEl.style.top);
        this.plugin.updateNotePosition(note.id, newLeft, newTop);
        const width = noteEl.offsetWidth;
        const height = noteEl.offsetHeight;
        localStorage.setItem(`note-it-size-${note.id}`, JSON.stringify({ width, height }));
      };
    });
    const savedSize = localStorage.getItem(`note-it-size-${note.id}`);
    if (savedSize) {
      try {
        const { width, height } = JSON.parse(savedSize);
        noteEl.style.width = `${width}px`;
        noteEl.style.height = `${height}px`;
      } catch (e) {
        console.error("Erreur lors de la restauration des dimensions:", e);
      }
    }
  }
  onEscapeKey() {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLTextAreaElement && activeElement.closest(".note-content")) {
      activeElement.blur();
    }
    return true;
  }
};
var ColorPickerModal = class extends import_obsidian.Modal {
  constructor(app, currentColor, onColorSelect) {
    super(app);
    this.currentColor = currentColor;
    this.onColorSelect = onColorSelect;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("color-picker-modal");
    contentEl.createEl("h2", { text: "Choisir une couleur" });
    const colorGrid = contentEl.createDiv({ cls: "color-grid" });
    const colors = [
      "#ffeb3b",
      "#ff9800",
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#03a9f4",
      "#00bcd4",
      "#009688",
      "#4caf50",
      "#8bc34a",
      "#cddc39",
      "#ffc107",
      "#795548",
      "#9e9e9e",
      "#607d8b"
    ];
    colors.forEach((color) => {
      const colorEl = colorGrid.createDiv({ cls: "color-option" });
      colorEl.style.backgroundColor = color;
      if (color === this.currentColor) {
        colorEl.addClass("selected");
      }
      colorEl.addEventListener("click", () => {
        this.onColorSelect(color);
        this.close();
      });
    });
    const customColorContainer = contentEl.createDiv({ cls: "custom-color-container" });
    customColorContainer.createEl("span", { text: "Personnalis\xE9: " });
    const colorInput = customColorContainer.createEl("input", { type: "color" });
    colorInput.value = this.currentColor;
    const applyBtn = customColorContainer.createEl("button", { text: "Appliquer" });
    applyBtn.addEventListener("click", () => {
      this.onColorSelect(colorInput.value);
      this.close();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var NoteItSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Param\xE8tres de Note-it" });
    new import_obsidian.Setting(containerEl).setName("Dossier de stockage").setDesc("Chemin du dossier pour stocker les notes post-it (ex: dossier/sous-dossier ou / pour la racine)").addText((text) => text.setPlaceholder("/").setValue(this.plugin.settings.storageFolder).onChange(async (value) => {
      const normalizedPath = value.endsWith("/") && value !== "/" ? value.slice(0, -1) : value;
      this.plugin.settings.storageFolder = normalizedPath;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Nom du fichier de stockage").setDesc("Nom du fichier pour stocker les notes post-it").addText((text) => text.setPlaceholder("note-it-storage.md").setValue(this.plugin.settings.storageFileName).onChange(async (value) => {
      this.plugin.settings.storageFileName = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Couleur par d\xE9faut").setDesc("Couleur par d\xE9faut pour les nouvelles notes").addColorPicker((color) => color.setValue(this.plugin.settings.defaultColor).onChange(async (value) => {
      this.plugin.settings.defaultColor = value;
      await this.plugin.saveSettings();
    }));
  }
};
