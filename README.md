# 📬 Facebook Message Automation Bot

This is a Playwright automation script to log into Facebook using a saved Chrome user profile and send predefined messages to specific user profiles.

## 🚀 Features

- Logs in using a persistent Chrome profile
- Auto-fills credentials if needed (from `.env` or fallback)
- Navigates to specific Facebook profiles
- Sends predefined messages to single or multiple users
- Uses robust selectors with fallback for high success rate
- Detailed logging for debugging and monitoring
- Support for JSON configuration for multiple users

## 📋 Prerequisites

- Node.js (version 18 or higher)
- pnpm package manager
- Chrome browser installed

## 🛠️ Installation

1. Clone or download this project
2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file with your Facebook credentials:
```env
FB_EMAIL=your-email@example.com
FB_PASSWORD=your-password
```

## 📖 Usage

### Single User (Backwards Compatible)

Run the automation with the default single user:

```bash
pnpm run test:single
```

Or using the direct playwright command:
```bash
npx playwright test send-message.spec.ts --project=chromium
```

### Multiple Users from JSON File

1. Create a JSON file with the users and messages you want to send:

```json
[
  {
    "userUrl": "https://www.facebook.com/user.profile.1",
    "message": "Salut ! Comment ça va ?"
  },
  {
    "userUrl": "https://www.facebook.com/user.profile.2", 
    "message": "Bonjour, j'espère que tu vas bien !"
  },
  {
    "userUrl": "https://www.facebook.com/user.profile.3",
    "message": "Hello! How are you doing?"
  }
]
```

2. Run the automation with your JSON file:

**Using environment variable:**
```bash
$env:USERS_JSON_FILE="path/to/your/users.json"; npx playwright test send-message.spec.ts --project=chromium
```

**Using the npm script (with users.json in the root directory):**
```bash
pnpm run test:multi
```

**Using cross-env for cross-platform compatibility:**
```bash
npx cross-env USERS_JSON_FILE="users.json" playwright test send-message.spec.ts --project=chromium
```

## 📁 JSON File Format

The JSON file must be an array of objects with the following structure:

```json
[
  {
    "userUrl": "https://www.facebook.com/profile.url",
    "message": "Your message text here"
  }
]
```

**Required properties:**
- `userUrl`: The complete Facebook profile URL
- `message`: The message text to send

## 🔧 Configuration

### Environment Variables

- `FB_EMAIL`: Your Facebook email address
- `FB_PASSWORD`: Your Facebook password  
- `USERS_JSON_FILE`: Path to the JSON file containing users and messages (optional)

### Example Files

- `users.example.json`: Example JSON file showing the correct format
- `.env`: Environment variables file (create this with your credentials)

## 🚨 Important Notes

- **Rate Limiting**: The script includes a 5-second delay between messages to avoid Facebook's rate limiting
- **Login Persistence**: Uses Chrome profile persistence, so you may only need to log in once
- **Error Handling**: If one user fails, the script continues with the next user
- **Backwards Compatibility**: The script works exactly as before when no JSON file is provided

## 🔍 Troubleshooting

### Common Issues

1. **"Bouton Message non trouvé"**: The profile doesn't allow direct messages or the selectors need updating
2. **"Zone de texte non trouvée"**: Facebook's UI has changed, selectors may need updating
3. **Login failures**: Check your credentials in the `.env` file
4. **JSON parsing errors**: Verify your JSON file format matches the required structure

### Debug Mode

The script provides detailed console output showing:
- Number of users loaded from JSON
- Current user being processed
- Success/failure for each message
- Final summary of results

## 📊 Output Example

```
🚀 Début de l'automatisation pour 3 utilisateur(s)
✅ Déjà connecté à Facebook

📤 Envoi 1/3 - https://www.facebook.com/user.profile.1
📄 Profil chargé
🔘 Bouton Message cliqué
✍️ Message saisi: Salut ! Comment ça va ?
✅ Message envoyé !
✅ Message envoyé avec succès à l'utilisateur 1
⏳ Attente avant le prochain message...

📤 Envoi 2/3 - https://www.facebook.com/user.profile.2
...

🎉 Processus terminé - 3 utilisateur(s) traité(s)
```

## 🛡️ Development Guidelines

This project follows strict backwards compatibility guidelines. All existing functionality is preserved while adding new features.
