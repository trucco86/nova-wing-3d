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
    await page.locator({
      play: '#menuPlay',
      hangar: '#menuHangar',
      central: '#menuHub',
    }[destination]).click();
  }
}
export async function clickMenu(page, selector, mode = 'click') {
  const destination = selector === '#prepareSquad' ? 'hangar'
    : ['#start', '#continue', '#watchIntro'].includes(selector) ? 'play' : 'central';
  await openMenu(page, destination);
  if (selector !== '#prepareSquad') await page.locator(selector)[mode]();
}
