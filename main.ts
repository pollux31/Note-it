import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf, ItemView, TFolder, MarkdownRenderer } from 'obsidian';

// Interface pour les notes post-it
interface StickyNote {
	id: string;
	title: string;
	content: string;
	position: { x: number; y: number; };
	dimensions?: { width: number; height: number }; // Dimensions du post-it
	color: string;
	createdAt: number;
	zIndex?: number; // Nouvel attribut pour gérer l'ordre d'affichage
}

// Interface pour les paramètres du plugin
interface NoteItSettings {
	defaultColor: string;
}

const DEFAULT_SETTINGS: NoteItSettings = {
	defaultColor: '#ffeb3b'
}

const VIEW_TYPE_NOTE_IT = 'note-it-view';

export default class NoteItPlugin extends Plugin {
	settings: NoteItSettings;
	notes: StickyNote[] = [];
	currentMaxZIndex: number = 10; // Valeur de base pour le z-index maximum
	view: NoteItView;
	
	async onload() {
		await this.loadSettings();

		// Ajouter l'élément de ruban
		this.addRibbonIcon('sticky-note', 'Note-it', () => {
			this.activateView();
		});
		
		// Ajouter la commande pour créer une nouvelle note
		this.addCommand({
			id: 'create-new-sticky-note',
			name: 'Créer une nouvelle note post-it',
			callback: () => {
				this.createNewNote();
			}
		});

		// Enregistrer la vue personnalisée
		this.registerView(
			VIEW_TYPE_NOTE_IT,
			(leaf) => (this.view = new NoteItView(leaf, this))
		);
		
		// Ajouter la commande pour ouvrir la vue
		this.addCommand({
			id: 'open-note-it-view',
			name: 'Ouvrir Note-it',
			callback: () => {
				this.activateView();
			},
		});

		// Charger les notes existantes
		this.loadNotes();

		// Ajouter les paramètres
		this.addSettingTab(new NoteItSettingTab(this.app, this));
	}

	onunload() {
		// Sauvegarder les notes avant de décharger le plugin
		this.saveNotes();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createNewNote() {
		const id = `note-${Date.now()}`;
		const note: StickyNote = {
			id: id,
			title: 'Nouvelle note',
			content: '', // Contenu vide par défaut
			position: {
				x: Math.floor(Math.random() * 300),
				y: Math.floor(Math.random() * 300)
			},
			dimensions: { width: 200, height: 200 }, // Dimensions par défaut
			color: this.settings.defaultColor,
			createdAt: Date.now(),
			zIndex: ++this.currentMaxZIndex
		};
		
		this.notes.push(note);
		await this.saveNotes();
		this.refreshView();
		
		// Rafraîchir la vue après un court délai pour permettre la sauvegarde
		setTimeout(() => {
			// Trouver l'élément de note nouvellement créé
			const noteEl = document.querySelector(`.sticky-note[data-id="${id}"]`) as HTMLElement;
			if (noteEl) {
				// Mettre le focus sur le titre et sélectionner tout le texte
				const titleInput = noteEl.querySelector('.note-title input') as HTMLInputElement;
				if (titleInput) {
					titleInput.focus();
					titleInput.select(); // Sélectionne tout le texte
				}
			}
		}, 50);
		
		return id;
	}

	async saveNotes() {
		try {
			// Formater les notes en JSON avec indentation pour une meilleure lisibilité
			const formattedNotes = JSON.stringify(this.notes, null, 2);
			
			// Utiliser l'API d'Obsidian pour accéder au système de fichiers
			const adapter = this.app.vault.adapter;
			
			// Chemin du fichier data.json dans le répertoire du plugin
			const dataPath = `${this.app.vault.configDir}/plugins/Note-it/data.json`;
			
			// Écrire les données dans le fichier
			await adapter.write(dataPath, formattedNotes);
		} catch (error) {
			new Notice(`Erreur lors de la sauvegarde des notes: ${error}`);
			console.error('Erreur lors de la sauvegarde des notes:', error);
		}
	}

	async loadNotes() {
		try {
			// Utiliser l'API d'Obsidian pour accéder au système de fichiers
			const adapter = this.app.vault.adapter;
			
			// Chemin du fichier data.json dans le répertoire du plugin
			const dataPath = `${this.app.vault.configDir}/plugins/Note-it/data.json`;
			
			// Vérifier si le fichier existe
			if (await adapter.exists(dataPath)) {
				// Lire le contenu du fichier
				const content = await adapter.read(dataPath);
				
				// Parser le JSON
				this.notes = JSON.parse(content);
				
				// Recalculer les zIndex en respectant l'ordre mais en commençant à 1
				this.normalizeZIndices();
				
				// Sauvegarder les notes avec les nouveaux zIndex
				await this.saveNotes();
				
				this.refreshView();
			}
		} catch (error) {
			console.log('Aucun fichier de stockage trouvé ou erreur de lecture:', error);
			// Pas d'erreur à afficher car c'est probablement la première utilisation
		}
	}

	/**
	 * Normalise les zIndex des notes en respectant l'ordre mais en commençant à 1
	 */
	normalizeZIndices() {
		// Trier les notes par zIndex croissant
		const sortedNotes = [...this.notes].sort((a, b) => {
			const zIndexA = a.zIndex || 0;
			const zIndexB = b.zIndex || 0;
			return zIndexA - zIndexB;
		});
		
		// Réattribuer les zIndex en commençant à 1 avec un incrément de 1
		sortedNotes.forEach((note, index) => {
			const originalNote = this.notes.find(n => n.id === note.id);
			if (originalNote) {
				originalNote.zIndex = index + 1;
			}
		});
		
		// Mettre à jour le zIndex maximum
		this.currentMaxZIndex = this.notes.length > 0 ? this.notes.length : 0;
	}

	async deleteNote(id: string) {
		this.notes = this.notes.filter(note => note.id !== id);
		await this.saveNotes();
		this.refreshView();
		new Notice('Note supprimée');
	}

	async updateNoteTitle(id: string, title: string) {
		const noteIndex = this.notes.findIndex(note => note.id === id);
		if (noteIndex >= 0) {
			this.notes[noteIndex].title = title;
			await this.saveNotes();
		}
	}

	async updateNoteContent(id: string, content: string) {
		const noteIndex = this.notes.findIndex(note => note.id === id);
		if (noteIndex >= 0) {
			this.notes[noteIndex].content = content;
			await this.saveNotes();
		}
	}

	async updateNotePosition(id: string, x: number, y: number) {
		const noteIndex = this.notes.findIndex(note => note.id === id);
		if (noteIndex >= 0) {
			this.notes[noteIndex].position = { x, y };
			await this.saveNotes();
		}
	}

	async updateNoteColor(id: string, color: string) {
		const noteIndex = this.notes.findIndex(note => note.id === id);
		if (noteIndex >= 0) {
			this.notes[noteIndex].color = color;
			await this.saveNotes();
			
			// Mettre à jour la couleur dans le DOM
			const noteEl = document.querySelector(`.sticky-note[data-id="${id}"]`) as HTMLElement;
			if (noteEl) {
				noteEl.style.backgroundColor = color;
			}
		}
	}

	async updateNoteDimensions(id: string, width: number, height: number) {
		const noteIndex = this.notes.findIndex(note => note.id === id);
		if (noteIndex >= 0) {
			this.notes[noteIndex].dimensions = { width, height };
			await this.saveNotes();
		}
	}

	async bringNoteToFront(id: string) {
		const noteIndex = this.notes.findIndex(note => note.id === id);
		if (noteIndex >= 0) {
			// Incrémenter le z-index maximum
			this.currentMaxZIndex++;
			
			// Mettre à jour le z-index de la note
			this.notes[noteIndex].zIndex = this.currentMaxZIndex;
			
			// Mettre à jour le z-index dans le DOM
			const noteEl = document.querySelector(`.sticky-note[data-id="${id}"]`) as HTMLElement;
			if (noteEl) {
				noteEl.style.zIndex = this.currentMaxZIndex.toString();
			}
			
			await this.saveNotes();
		}
	}

	refreshView() {
		// Rafraîchir la vue si elle est ouverte
		this.app.workspace.getLeavesOfType(VIEW_TYPE_NOTE_IT).forEach((leaf) => {
			if (leaf.view instanceof NoteItView) {
				leaf.view.refresh();
			}
		});
	}

	async activateView() {
		const workspace = this.app.workspace;
		
		// Vérifier si la vue est déjà ouverte
		const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_NOTE_IT);
		if (existingLeaves.length > 0) {
			workspace.revealLeaf(existingLeaves[0]);
			return;
		}

		// Ouvrir la vue dans un nouvel onglet
		const leaf = workspace.getLeaf(true);
		
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_NOTE_IT,
				active: true,
			});
		} else {
			new Notice('Impossible de créer la vue Note-it');
		}
	}
}

// Vue personnalisée pour afficher les notes post-it
class NoteItView extends ItemView {
	plugin: NoteItPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: NoteItPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_NOTE_IT;
	}

	getDisplayText(): string {
		return 'Note-it';
	}

	getIcon(): string {
		return 'sticky-note';
	}

	async onOpen() {
		const container = this.containerEl;
		container.empty();
		container.addClass('note-it-container');

		this.renderNotes(container);
	}

	async onClose() {
		// Nettoyage
		this.containerEl.empty();
	}

	refresh() {
		const container = this.containerEl;
		container.empty();
		container.addClass('note-it-container');
		this.renderNotes(container);
	}

	renderNotes(container: HTMLElement) {
		// Créer un en-tête pour la page
		const header = container.createDiv({ cls: 'notes-header' });
		header.createEl('h1', { text: 'Notes Post-it' });
		
		// Conteneur pour les boutons d'action
		const actionButtons = header.createDiv({ cls: 'action-buttons' });
		
		// Ajouter un bouton pour créer une nouvelle note
		const newNoteBtn = actionButtons.createEl('button', { 
			text: 'Nouvelle note',
			cls: 'new-note-button' 
		});
		newNoteBtn.addEventListener('click', () => {
			this.plugin.createNewNote();
		});
		
		// Créer un conteneur pour les notes
		const notesContainer = container.createDiv({ cls: 'notes-container' });
		
		// Afficher toutes les notes
		this.plugin.notes.forEach(note => {
			this.renderNote(notesContainer, note);
		});
	}

	renderNote(container: HTMLElement, note: StickyNote) {
		const noteEl = container.createDiv({ cls: 'sticky-note' });
		
		// Appliquer la position, la couleur et le z-index
		noteEl.style.left = `${note.position.x}px`;
		noteEl.style.top = `${note.position.y}px`;
		noteEl.style.backgroundColor = note.color;
		if (note.zIndex) {
			noteEl.style.zIndex = note.zIndex.toString();
		}
		
		// Appliquer les dimensions si elles existent
		if (note.dimensions) {
			noteEl.style.width = `${note.dimensions.width}px`;
			noteEl.style.height = `${note.dimensions.height}px`;
		} else {
			// Dimensions par défaut
			noteEl.style.width = '200px';
			noteEl.style.height = '200px';
		}
		
		noteEl.setAttribute('data-id', note.id);
		
		// Ajouter un gestionnaire de clic pour mettre la note au premier plan
		noteEl.addEventListener('mousedown', () => {
			(this.plugin as NoteItPlugin).bringNoteToFront(note.id);
		});

		// En-tête de la note (titre + toolbar)
		const headerEl = noteEl.createDiv({ cls: 'note-header' });
		
		// Titre de la note (maintenant dans l'en-tête)
		const titleEl = headerEl.createDiv({ cls: 'note-title' });
		
		// Poignée de déplacement à gauche du titre
		const dragHandleEl = titleEl.createDiv({ cls: 'note-drag-handle' });
		
		const titleInput = titleEl.createEl('input', { 
			type: 'text',
			attr: {
				placeholder: 'Titre de la note'
			}
		});
		titleInput.value = note.title;
		
		// Barre d'outils de la note (maintenant dans l'en-tête)
		const toolbar = headerEl.createDiv({ cls: 'note-toolbar' });
		
		// Bouton de couleur
		const colorBtn = toolbar.createEl('button', { cls: 'color-btn' });
		colorBtn.innerHTML = '🎨';
		colorBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			const colorPicker = new ColorPickerModal(this.plugin.app, note.color, (color) => {
				(this.plugin as NoteItPlugin).updateNoteColor(note.id, color);
			});
			colorPicker.open();
		});

		// Bouton de suppression
		const deleteBtn = toolbar.createEl('button', { cls: 'delete-btn' });
		deleteBtn.innerHTML = '❌';
		deleteBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			(this.plugin as NoteItPlugin).deleteNote(note.id);
		});
		
		// Gérer les événements du titre
		titleInput.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			(this.plugin as NoteItPlugin).updateNoteTitle(note.id, target.value);
		});
		
		// Gérer la touche Entrée pour passer au contenu
		titleInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				// Passer au contenu de la note
				this.toggleEditMode(noteEl, note, true);
			} else if (e.key === 'Escape') {
				e.preventDefault();
				// Annuler l'édition en cours en restaurant la valeur précédente
				titleInput.value = note.title;
				titleInput.blur();
			}
		});

		// Contenu de la note
		const contentEl = noteEl.createDiv({ cls: 'note-content' });
		
		// Créer le conteneur pour l'affichage du markdown rendu
		const renderedContentEl = contentEl.createDiv({ cls: 'rendered-content' });
		
		// Ajouter un gestionnaire de clic pour passer en mode édition
		renderedContentEl.addEventListener('click', (e) => {
			e.stopPropagation();
			this.toggleEditMode(noteEl, note, true);
		});
		
		// Créer le textarea pour l'édition (caché par défaut)
		const textArea = contentEl.createEl('textarea', {
			attr: {
				placeholder: 'Contenu de la note'
			},
			cls: 'hidden'
		});
		textArea.value = note.content;
		
		// Rendre le contenu markdown
		this.renderMarkdown(note.content, renderedContentEl);
		
		// Gérer les événements du contenu
		textArea.addEventListener('input', (e) => {
			const target = e.target as HTMLTextAreaElement;
			(this.plugin as NoteItPlugin).updateNoteContent(note.id, target.value);
			
			// Mettre à jour le contenu rendu en temps réel
			this.renderMarkdown(target.value, renderedContentEl);
		});
		
		// Gérer la touche Échap pour annuler l'édition
		textArea.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				// Annuler l'édition en cours en restaurant la valeur précédente
				textArea.value = note.content;
				this.toggleEditMode(noteEl, note, false);
			}
		});
		
		// Gérer la perte de focus pour quitter le mode édition
		textArea.addEventListener('blur', () => {
			this.toggleEditMode(noteEl, note, false);
		});

		// Rendre la note déplaçable uniquement par la poignée
		this.makeNoteDraggable(dragHandleEl, noteEl, note);
		
		// Ajouter les poignées de redimensionnement
		this.makeNoteResizable(noteEl, note);
	}

	/**
	 * Bascule entre le mode édition et le mode affichage
	 */
	toggleEditMode(noteEl: HTMLElement, note: StickyNote, enterEditMode?: boolean) {
		const textArea = noteEl.querySelector('textarea') as HTMLTextAreaElement;
		const renderedContent = noteEl.querySelector('.rendered-content') as HTMLElement;
		
		// Si enterEditMode est défini, forcer le mode correspondant
		const shouldEnterEditMode = enterEditMode !== undefined ? enterEditMode : renderedContent.style.display !== 'none';
		
		if (shouldEnterEditMode) {
			// Passer en mode édition
			textArea.classList.remove('hidden');
			renderedContent.classList.add('hidden');
			textArea.focus();
		} else {
			// Passer en mode affichage
			textArea.classList.add('hidden');
			renderedContent.classList.remove('hidden');
			
			// Mettre à jour le contenu rendu
			this.renderMarkdown(note.content, renderedContent);
		}
	}
	
	/**
	 * Rend le contenu markdown dans l'élément cible
	 */
	renderMarkdown(text: string, targetEl: HTMLElement) {
		// Vider le conteneur
		targetEl.empty();
		
		// Essayer d'utiliser le renderer Markdown d'Obsidian si disponible
		try {
			// Utiliser MarkdownRenderer d'Obsidian
			MarkdownRenderer.renderMarkdown(text, targetEl, '', this.plugin);
			
			// Supprimer les marges et paddings des éléments générés
			const allElements = targetEl.querySelectorAll('*');
			allElements.forEach((el) => {
				(el as HTMLElement).style.margin = '0';
				(el as HTMLElement).style.padding = '0';
			});
			
			// Ajuster les listes
			const lists = targetEl.querySelectorAll('ul, ol');
			lists.forEach((list) => {
				(list as HTMLElement).style.paddingLeft = '1em';
				(list as HTMLElement).style.listStylePosition = 'inside';
			});
		} catch (e) {
			// Fallback à un parser markdown simple
			targetEl.innerHTML = this.simpleMarkdownToHtml(text);
		}
	}
	
	/**
	 * Rend le contenu markdown en HTML simple
	 * Cette fonction est une implémentation basique pour le rendu Markdown
	 */
	simpleMarkdownToHtml(markdown: string): string {
		// Convertir les titres
		let html = markdown
			.replace(/^# (.*?)$/m, '<h1>$1</h1>')
			.replace(/^## (.*?)$/m, '<h2>$1</h2>')
			.replace(/^### (.*?)$/m, '<h3>$1</h3>')
			.replace(/^#### (.*?)$/m, '<h4>$1</h4>')
			.replace(/^##### (.*?)$/m, '<h5>$1</h5>')
			.replace(/^###### (.*?)$/m, '<h6>$1</h6>');
		
		// Convertir les listes
		html = html
			.replace(/^\* (.*?)$/m, '<li>$1</li>')
			.replace(/^- (.*?)$/m, '<li>$1</li>')
			.replace(/^[0-9]+\. (.*?)$/m, '<li>$1</li>');
		
		// Entourer les listes avec <ul> ou <ol>
		const ulRegex = /<li>(?![\d]+\.)(.*?)<\/li>/;
		const olRegex = /<li>[\d]+\.(.*?)<\/li>/;
		
		let ulMatches = html.match(new RegExp(ulRegex.source, 'g'));
		if (ulMatches) {
			html = html.replace(
				new RegExp(ulMatches.join(''), 'g'),
				`<ul>${ulMatches.join('')}</ul>`
			);
		}
		
		let olMatches = html.match(new RegExp(olRegex.source, 'g'));
		if (olMatches) {
			html = html.replace(
				new RegExp(olMatches.join(''), 'g'),
				`<ol>${olMatches.join('')}</ol>`
			);
		}
		
		// Convertir les paragraphes (lignes non vides qui ne sont pas des titres ou des listes)
		const lines = html.split('\n');
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (line && !line.startsWith('<h') && !line.startsWith('<ul') && !line.startsWith('<ol') && !line.startsWith('<li')) {
				lines[i] = `<p>${line}</p>`;
			}
		}
		html = lines.join('\n');
		
		// Convertir le texte en gras et en italique
		html = html
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/__(.*?)__/g, '<strong>$1</strong>')
			.replace(/_(.*?)_/g, '<em>$1</em>');
		
		// Convertir les liens
		html = html
			.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
		
		// Convertir les images
		html = html
			.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">');
		
		// Convertir les blocs de code
		html = html
			.replace(/```([^`]*?)```/g, '<pre><code>$1</code></pre>')
			.replace(/`([^`]*?)`/g, '<code>$1</code>');
		
		return html;
	}

	makeNoteDraggable(dragHandleEl: HTMLElement, noteEl: HTMLElement, note: StickyNote) {
		let isDragging = false;
		let startX = 0;
		let startY = 0;
		let startLeft = 0;
		let startTop = 0;
		
		// Gestionnaire pour commencer le déplacement
		const startDrag = (e: MouseEvent) => {
			// Ignorer les clics sur les boutons ou les champs de saisie
			if (
				e.target instanceof HTMLButtonElement ||
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}
			
			isDragging = true;
			startX = e.clientX;
			startY = e.clientY;
			startLeft = parseInt(noteEl.style.left) || 0;
			startTop = parseInt(noteEl.style.top) || 0;
			
			// Ajouter les gestionnaires d'événements pour le déplacement
			document.addEventListener('mousemove', drag);
			document.addEventListener('mouseup', stopDrag);
			
			// Empêcher la sélection de texte pendant le déplacement
			e.preventDefault();
		};
		
		// Gestionnaire pour le déplacement
		const drag = (e: MouseEvent) => {
			if (!isDragging) return;
			
			const deltaX = e.clientX - startX;
			const deltaY = e.clientY - startY;
			
			const newLeft = startLeft + deltaX;
			const newTop = startTop + deltaY;
			
			noteEl.style.left = `${newLeft}px`;
			noteEl.style.top = `${newTop}px`;
		};
		
		// Gestionnaire pour arrêter le déplacement
		const stopDrag = () => {
			if (!isDragging) return;
			
			isDragging = false;
			
			// Supprimer les gestionnaires d'événements
			document.removeEventListener('mousemove', drag);
			document.removeEventListener('mouseup', stopDrag);
			
			// Mettre à jour la position dans les données
			const newLeft = parseInt(noteEl.style.left);
			const newTop = parseInt(noteEl.style.top);
			(this.plugin as NoteItPlugin).updateNotePosition(note.id, newLeft, newTop);
		};
		
		// Attacher le gestionnaire d'événement mousedown à la poignée de déplacement
		dragHandleEl.addEventListener('mousedown', startDrag);
	}
	
	makeNoteResizable(noteEl: HTMLElement, note: StickyNote) {
		// Créer les poignées de redimensionnement
		const resizeHandles = ['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w'];
		
		resizeHandles.forEach(position => {
			const handle = noteEl.createDiv({ cls: `resize-handle resize-${position}` });
			
			let startX: number;
			let startY: number;
			let startWidth: number;
			let startHeight: number;
			let startLeft: number;
			let startTop: number;
			
			handle.addEventListener('mousedown', (e) => {
				e.preventDefault();
				e.stopPropagation();
				
				startX = e.clientX;
				startY = e.clientY;
				startWidth = noteEl.offsetWidth;
				startHeight = noteEl.offsetHeight;
				startLeft = note.position.x;
				startTop = note.position.y;
				
				document.addEventListener('mousemove', resize);
				document.addEventListener('mouseup', stopResize);
			});
			
			const resize = (e: MouseEvent) => {
				let newWidth = startWidth;
				let newHeight = startHeight;
				let newLeft = startLeft;
				let newTop = startTop;
				
				// Calcul selon la position de la poignée
				if (position.includes('e')) {
					newWidth = startWidth + (e.clientX - startX);
				} else if (position.includes('w')) {
					newWidth = startWidth - (e.clientX - startX);
					newLeft = startLeft + (e.clientX - startX);
				}
				
				if (position.includes('s')) {
					newHeight = startHeight + (e.clientY - startY);
				} else if (position.includes('n')) {
					newHeight = startHeight - (e.clientY - startY);
					newTop = startTop + (e.clientY - startY);
				}
				
				// Limites minimales
				const minWidth = 150;
				const minHeight = 25; // Juste un peu plus que la hauteur du titre (environ 22px)
				
				if (newWidth < minWidth) {
					if (position.includes('w')) {
						newLeft = startLeft + startWidth - minWidth;
					}
					newWidth = minWidth;
				}
				
				if (newHeight < minHeight) {
					if (position.includes('n')) {
						newTop = startTop + startHeight - minHeight;
					}
					newHeight = minHeight;
				}
				
				// Appliquer les nouvelles dimensions
				noteEl.style.width = `${newWidth}px`;
				noteEl.style.height = `${newHeight}px`;
				noteEl.style.left = `${newLeft}px`;
				noteEl.style.top = `${newTop}px`;
			};
			
			const stopResize = () => {
				document.removeEventListener('mousemove', resize);
				document.removeEventListener('mouseup', stopResize);
				
				// Mettre à jour la position dans les données
				const newLeft = parseInt(noteEl.style.left);
				const newTop = parseInt(noteEl.style.top);
				(this.plugin as NoteItPlugin).updateNotePosition(note.id, newLeft, newTop);
				
				// Stocker les dimensions dans l'objet note et sauvegarder
				const width = noteEl.offsetWidth;
				const height = noteEl.offsetHeight;
				(this.plugin as NoteItPlugin).updateNoteDimensions(note.id, width, height);
			};
		});
		
		// Appliquer les dimensions sauvegardées si elles existent
		if (note.dimensions) {
			noteEl.style.width = `${note.dimensions.width}px`;
			noteEl.style.height = `${note.dimensions.height}px`;
		}
	}

	// Surcharger la méthode onEscapeKey pour empêcher la fermeture de la vue
	onEscapeKey(): boolean {
		// Vérifier si un textarea est actif (mode édition)
		const activeElement = document.activeElement;
		if (activeElement instanceof HTMLTextAreaElement && 
			activeElement.closest('.note-content')) {
			// Simuler un événement blur pour quitter le mode édition
			activeElement.blur();
		}
		
		// Retourner true indique que nous avons géré l'événement
		// et que le comportement par défaut ne doit pas être exécuté
		return true;
	}

}

// Modal pour sélectionner une couleur
class ColorPickerModal extends Modal {
	currentColor: string;
	onColorSelect: (color: string) => void;

	constructor(app: App, currentColor: string, onColorSelect: (color: string) => void) {
		super(app);
		this.currentColor = currentColor;
		this.onColorSelect = onColorSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('color-picker-modal');

		contentEl.createEl('h2', { text: 'Choisir une couleur' });

		const colorGrid = contentEl.createDiv({ cls: 'color-grid' });
		
		const colors = [
			'#ffeb3b', // Jaune
			'#ff9800', // Orange
			'#f44336', // Rouge
			'#e91e63', // Rose
			'#9c27b0', // Violet
			'#673ab7', // Indigo
			'#3f51b5', // Bleu
			'#2196f3', // Bleu clair
			'#03a9f4', // Bleu ciel
			'#00bcd4', // Cyan
			'#009688', // Teal
			'#4caf50', // Vert
			'#8bc34a', // Vert clair
			'#cddc39', // Lime
			'#ffc107', // Ambre
			'#795548', // Marron
			'#9e9e9e', // Gris
			'#607d8b'  // Bleu gris
		];

		colors.forEach(color => {
			const colorEl = colorGrid.createDiv({ cls: 'color-option' });
			colorEl.style.backgroundColor = color;
			
			if (color === this.currentColor) {
				colorEl.addClass('selected');
			}
			
			colorEl.addEventListener('click', () => {
				// Appliquer la couleur sélectionnée
				this.onColorSelect(color);
				this.close();
			});
		});

		// Option personnalisée avec input color
		const customColorContainer = contentEl.createDiv({ cls: 'custom-color-container' });
		customColorContainer.createEl('span', { text: 'Personnalisé: ' });
		
		const colorInput = customColorContainer.createEl('input', { type: 'color' });
		colorInput.value = this.currentColor;
		
		const applyBtn = customColorContainer.createEl('button', { text: 'Appliquer' });
		applyBtn.addEventListener('click', () => {
			// Appliquer la couleur personnalisée
			this.onColorSelect(colorInput.value);
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Onglet de paramètres
class NoteItSettingTab extends PluginSettingTab {
	plugin: NoteItPlugin;

	constructor(app: App, plugin: NoteItPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Paramètres de Note-it' });

		new Setting(containerEl)
			.setName('Couleur par défaut')
			.setDesc('Couleur par défaut pour les nouvelles notes')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.defaultColor)
				.onChange(async (value) => {
					this.plugin.settings.defaultColor = value;
					await this.plugin.saveSettings();
				}));
	}
}
