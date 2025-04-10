# Note-it

Un plugin Obsidian pour créer et gérer des notes post-it dans votre espace de travail.

## Fonctionnalités

- **Notes post-it interactives** : Créez des notes flottantes qui restent visibles pendant que vous travaillez
- **Formatage Markdown** : Le contenu des notes prend en charge le formatage Markdown
- **Personnalisation** : Changez la couleur des notes selon vos préférences
- **Interaction intuitive** : 
  - Cliquez sur le contenu pour éditer
  - Cliquez ailleurs pour quitter le mode édition
  - Déplacez les notes en les faisant glisser
  - Redimensionnez les notes avec les poignées aux coins et bords

## Utilisation

1. Cliquez sur l'icône de post-it dans la barre latérale ou utilisez la commande "Ouvrir Note-it"
2. Cliquez sur le bouton "+" pour créer une nouvelle note
3. Saisissez un titre et un contenu pour votre note
4. Utilisez le bouton de couleur (🎨) pour changer la couleur de la note
5. Déplacez la note en la faisant glisser par son en-tête
6. Redimensionnez la note en utilisant les poignées sur les bords et les coins
7. Supprimez une note avec le bouton de suppression (❌)

## Formatage Markdown

Le contenu des notes prend en charge la syntaxe Markdown standard :

- **Titres** : `# Titre`, `## Sous-titre`, etc.
- **Formatage de texte** : `*italique*`, `**gras**`, `~~barré~~`
- **Listes** : 
  ```
  - Élément 1
  - Élément 2
    - Sous-élément
  ```
- **Liens** : `[texte du lien](URL)`
- **Images** : `![texte alternatif](URL de l'image)`
- **Code** : \`code inline\` ou blocs de code avec \```

## Stockage des données

Les notes sont stockées dans un fichier Markdown dans votre coffre Obsidian :
- Emplacement par défaut : `note-it-storage.md` à la racine de votre coffre
- Format : YAML front matter contenant les données des notes

## Paramètres

Vous pouvez configurer :
- Le dossier de stockage des notes
- Le nom du fichier de stockage
- La couleur par défaut des nouvelles notes

## Installation

1. Téléchargez les fichiers du plugin
2. Placez-les dans le dossier `.obsidian/plugins/Note-it/` de votre coffre Obsidian
3. Activez le plugin dans les paramètres d'Obsidian

## Développement

Ce plugin est développé en TypeScript et utilise l'API d'Obsidian.

Pour construire le plugin :
```bash
npm install
npm run build
```

## Licence

[MIT](LICENSE)
