import { test, chromium, Page, BrowserContext, Locator } from '@playwright/test';
import path from 'path';

interface LoginCredentials {
  email: string;
  password: string;
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
      await page.goto('https://www.facebook.com/rado.nomenjanahary.161');
      console.log('📄 Profil chargé');
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

async function sendMessageIfLoggedIn(page: Page): Promise<void> {
  const messageButton = await findVisibleElement(page, SELECTORS.messageButton);
  if (!messageButton) {
    console.log('❌ Bouton Message non trouvé sur ce profil');
    console.log('💡 Ce profil ne permet peut-être pas les messages directs');
    return;
  }

  await messageButton.click();
  console.log('🔘 Bouton Message cliqué');
  
  await page.waitForTimeout(2000);
  
  const textArea = await findVisibleElement(page, SELECTORS.textArea, 3000);
  if (!textArea) {
    console.log('❌ Zone de texte non trouvée');
    return;
  }

  // Uncomment and modify the message as needed
  // await textArea.fill('test message');
  // console.log('✍️ Message saisi');
  
  await page.waitForTimeout(1000);
  
  const sendButton = await findVisibleElement(page, SELECTORS.sendButton);
  if (sendButton) {
    await sendButton.click();
    console.log('✅ Message envoyé !');
  } else {
    console.log('❌ Bouton Envoyer non trouvé - essai avec Entrée...');
    await textArea.press('Enter');
    console.log('⌨️ Touche Entrée pressée');
  }
}

async function sendMessageToProfile(page: Page): Promise<void> {
  if (!(await isUserLoggedIn(page))) {
    console.log('❌ Utilisateur non connecté');
    return;
  }

  console.log('💬 Tentative d\'envoi de message...');
  
  try {
    await sendMessageIfLoggedIn(page);
  } catch (error) {
    console.log('❌ Erreur lors de l\'envoi du message:', (error as Error).message);
  }
  
  await page.waitForTimeout(3000);
}

async function sendQuickMessageIfAlreadyLoggedIn(page: Page): Promise<void> {
  console.log('✅ Déjà connecté à Facebook');
  await page.getByRole('button', { name: 'Message', exact: true }).click();
  await page.getByRole('textbox', { name: 'Message' }).fill('test 49 lines');
  await page.getByRole('button', { name: 'Press Enter to send' }).click();
}

test('Ouvrir Facebook avec profil existant et connexion auto', async () => {
  const credentials = await getCredentials();
  const browser = await createBrowserContext();
  const page = browser.pages()[0] || await browser.newPage();

  await page.goto('https://www.facebook.com/rado.nomenjanahary.161');

  const loggedIn = await isUserLoggedIn(page);
  
  if (loggedIn) {
    await sendQuickMessageIfAlreadyLoggedIn(page);
  } else {
    const loginSuccess = await performLogin(page, credentials);
    if (!loginSuccess) {
      await browser.close();
      return;
    }
  }
  
  await sendMessageToProfile(page);
  await browser.close();
});