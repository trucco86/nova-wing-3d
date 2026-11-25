/** Exercise the public, visible menu path instead of clicking hidden legacy controls. */
export async function openMenu(page, destination = 'home') {
  const menu = page.locator('#menu');
  let screen = await menu.getAttribute('data-screen');
  if (screen === 'splash') {
    await page.locator('#pressStart').click();
    screen = 'home';
  }
  if (screen !== destination && screen !== 'home') {
    await page.locator('#menuBack').click();
    screen = 'home';
  }
  if (destination !== 'home' && screen === 'home') {
    await page
      .locator(
        {
          play: '#menuPlay',
          hangar: '#menuHangar',
          central: '#menuHub',
        }[destination],
      )
      .click();
  }
}
export async function clickMenu(page, selector, mode = 'click') {
  const destination =
    selector === '#prepareSquad'
      ? 'hangar'
      : ['#start', '#continue', '#watchIntro'].includes(selector)
        ? 'play'
        : 'central';
  await openMenu(page, destination);
  if (selector !== '#prepareSquad') await page.locator(selector)[mode]();
}

/** A normal campaign launch now requires accepting the interactive map before
 *  asserting HUD, combat, boost or mecha controls. Never click hidden elements.
 */
export async function confirmCampaignPreflight(page) {
  const map = page.locator('#campaignMap');
  if (await map.isVisible()) {
    await page.locator('#mapLaunch').click();
    await map.waitFor({ state: 'hidden' });
  }
}

/** Tests of gameplay, not the departure itself, use the public skip action.
 * Story skip and launch skip are separate actions. Never send combat input
 * until the launch has ended and the real HUD is available.
 */
export async function enterGameplayAfterLaunch(page) {
  const launch = page.locator('#launchSkip');
  if (await launch.isVisible()) await launch.click();
  await page.locator('body.in-mission:not(.launch-cinematic)').waitFor({ state: 'attached' });
}
