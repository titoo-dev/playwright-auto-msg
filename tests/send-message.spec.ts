import { test, chromium, Page, BrowserContext, Locator, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { exec } from 'child_process';

// Load environment variables
dotenv.config();

interface LoginCredentials {
  email: string;
  password: string;
}

interface UserMessage {
  userUrl: string;
  message: string;
}

interface MessageSelectors {
  messageButton: string[];
  textArea: string[];
  sendButton: string[];
}

const SELECTORS: MessageSelectors = {
  messageButton: [
    '[aria-label="Message"]',
    '[data-testid="profile_timeline_intro_card"] [role="button"]:has-text("Message")',
    'a[href*="/messages/"]:has-text("Message")',
    '[role="button"]:has-text("Message")',
    '[aria-label="Envoyer un message"]'
  ],
  textArea: [
    '[data-testid="message-composer-input"]',
    '[contenteditable="true"][data-testid*="message"]',
    '[aria-label*="message" i][contenteditable="true"]',
    '[placeholder*="message" i]',
    '[data-text="true"]'
  ],
  sendButton: [
    '[data-testid="send-button"]',
    '[aria-label="Send" i]',
    '[aria-label="Envoyer"]',
    'button:has-text("Send")',
    'button:has-text("Envoyer")',
    '[type="submit"]'
  ]
};

async function createBrowserContext(): Promise<BrowserContext> {
  const userDataDir = path.join(__dirname, 'chrome-profile');
  return await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
  });
}

async function getCredentials(): Promise<LoginCredentials> {
  return {
    email: process.env.FB_EMAIL || 'example@gmail.com',
    password: process.env.FB_PASSWORD || 'password123'
  };
}

async function getUsersFromJson(): Promise<UserMessage[]> {
  const jsonFilePath = process.env.USERS_JSON_FILE;
  
  if (!jsonFilePath) {
    // Fallback to single user for backwards compatibility
    return [{
      userUrl: 'https://www.facebook.com/rado.nomenjanahary.161',
      message: 'test 49 lines'
    }];
  }

  try {
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    const users: UserMessage[] = JSON.parse(jsonContent);
    
    if (!Array.isArray(users)) {
      throw new Error('Le fichier JSON doit contenir un tableau d\'objets');
    }

    // Validate JSON structure
    for (const user of users) {
      if (!user.userUrl || !user.message) {
        throw new Error('Chaque objet doit avoir les propriétés "userUrl" et "message"');
      }
    }

    console.log(`📄 ${users.length} utilisateur(s) chargé(s) depuis ${jsonFilePath}`);
    return users;
  } catch (error) {
    console.error('❌ Erreur lors du chargement du fichier JSON:', (error as Error).message);
    throw error;
  }
}

async function isUserLoggedIn(page: Page): Promise<boolean> {
  return await page.locator('[data-testid="royal_login_form"]').count() === 0;
}

async function findVisibleElement(page: Page, selectors: string[], timeout = 2000): Promise<Locator | null> {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout })) {
        console.log(`📍 Element found with selector: ${selector}`);
        return element;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function performLogin(page: Page, credentials: LoginCredentials): Promise<boolean> {
  console.log('🔐 Connexion en cours...');
  
  try {
    await page.waitForSelector('#email', { timeout: 5000 });
    
    await page.fill('#email', credentials.email);
    console.log('📧 Email saisi');
    
    await page.fill('#pass', credentials.password);
    console.log('🔑 Mot de passe saisi');
    
    await page.click('[name="login"]');
    console.log('🚀 Tentative de connexion...');
    
    await Promise.race([
      page.waitForURL('**/facebook.com/**', { timeout: 10000 }),
      page.waitForSelector('[data-testid="royal_login_form"]', { timeout: 10000 })
    ]);
    
    const loginSuccessful = await isUserLoggedIn(page);
      if (loginSuccessful) {
      console.log('✅ Connexion réussie !');
      return true;
    } else {
      console.log('❌ Échec de connexion - vérifiez vos identifiants');
      
      const errorMessage = await page.locator('[data-testid="royal_login_form"] [role="alert"]')
        .textContent()
        .catch(() => null);
      
      if (errorMessage) {
        console.log('💬 Message d\'erreur:', errorMessage);
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la connexion:', (error as Error).message);
    return false;
  }
}

async function sendMessageToProfile(page: Page, userMessage: UserMessage): Promise<void> {
  
  console.log(`💬 Tentative d'envoi de message à: ${userMessage.userUrl}`);
  
  try {
    await page.goto(userMessage.userUrl);
    console.log('📄 Profil chargé');
    
    await page.waitForURL(userMessage.userUrl, { timeout: 10000 });
    await sendQuickMessageIfAlreadyLoggedIn(page, userMessage.message);

    await page.waitForTimeout(2000); // Wait for message to send
  } catch (error) {
    console.log('❌ Erreur lors de l\'envoi du message:', (error as Error).message);
  }
}

async function sendQuickMessageIfAlreadyLoggedIn(page: Page, message: string = 'test 49 lines'): Promise<void> {
  await page.getByRole('button', { name: 'Message', exact: true }).click();
  await page.getByRole('textbox', { name: 'Message' }).fill(message);
  await page.getByRole('button', { name: 'Press Enter to send' }).click();
}

test('Ouvrir Facebook avec profil existant et connexion auto', async () => {
  const credentials = await getCredentials();
  const users = await getUsersFromJson();
  const browser = await createBrowserContext();
  const page = browser.pages()[0] || await browser.newPage();

  console.log(`🚀 Début de l'automatisation pour ${users.length} utilisateur(s)`);

  try {
    // Check if already logged in by going to Facebook first
    await page.goto('https://www.facebook.com');
    const loggedIn = await isUserLoggedIn(page);
    
    if (!loggedIn) {
      console.log('🔐 Connexion nécessaire...');
      const loginSuccess = await performLogin(page, credentials);
      if (!loginSuccess) {
        console.log('❌ Impossible de se connecter - arrêt du processus');
        await browser.close();
        return;
      }
    } else {
      console.log('✅ Déjà connecté à Facebook');
    }

    // Send messages to all users
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n📤 Envoi ${i + 1}/${users.length} - ${user.userUrl}`);
      
      try {
        await sendMessageToProfile(page, user);
        console.log(`✅ Message envoyé avec succès à l'utilisateur ${i + 1}`);
        
        // Wait between messages to avoid rate limiting
        if (i < users.length - 1) {
          console.log('⏳ Attente avant le prochain message...');
          await page.getByRole('button', { name: 'Close chat' }).click();
        }
      } catch (error) {
        console.log(`❌ Erreur pour l'utilisateur ${i + 1}:`, (error as Error).message);
        // Continue with next user even if one fails
      }
    }

    console.log(`\n🎉 Processus terminé - ${users.length} utilisateur(s) traité(s)`);

  } catch (error) {
    console.log('❌ Erreur générale:', (error as Error).message);
  } finally {
    await browser.close();
  }
});