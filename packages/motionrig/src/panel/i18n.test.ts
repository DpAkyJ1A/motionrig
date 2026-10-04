import { beforeEach, describe, expect, it } from 'vitest';
import { configure, rig } from '../index';
import { $, clean, host } from '../test/panel';
import { open } from './index';

beforeEach(() => {
  clean();
});

describe('i18n', () => {
  it('en applies labels: live / on next play / after reload', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    rig('b', { x: 1 }, { applies: 'replay' });
    rig('c', { x: 1 }, { applies: 'reload' });
    const labels = ['a', 'b', 'c'].map((id) => {
      open(id);
      return $('.applies')!.textContent;
    });
    expect(labels).toEqual(['live', 'on next play', 'after reload']);
  });

  it('config.locale picks the ru table; config.messages overrides single strings', () => {
    configure({ enabled: true, locale: 'ru', messages: { copyCode: 'Копировать' } });
    rig('a', { x: 1 }, { applies: 'replay' });
    open('a');
    expect($('.applies')!.textContent).toBe('при следующем проигрывании');
    expect($('[data-act="copy"]')!.textContent).toBe('Копировать');
    expect($('[data-act="reset-all"]')!.textContent).toBe('Сбросить всё');
    expect($('[data-act="reset-tab"]')!.textContent).toBe('Сбросить таб');
    expect($('.search input')!.getAttribute('aria-label')).toBe('Поиск');
    $<HTMLButtonElement>('[data-act="reset-all"]')!.click();
    expect($('[data-act="reset-all"]')!.textContent).toBe('Ещё раз — сбросить всё');
  });

  it('ru: Copy code is short enough for the footer', () => {
    configure({ enabled: true, locale: 'ru' });
    rig('a', { x: 1 });
    open('a');
    expect($('[data-act="copy"]')!.textContent).toBe('Копировать');
  });

  it('strings are re-read on each open, so a later configure({ locale }) takes effect', () => {
    configure({ enabled: true });
    rig('a', { x: 1 });
    open('a');
    const search = $<HTMLInputElement>('.search input')!;
    search.value = 'a';
    search.dispatchEvent(new Event('input'));
    $('[data-act="collapse"]')!.click();
    configure({ locale: 'ru' });
    open('a');
    expect($('[data-act="copy"]')!.textContent).toBe('Копировать');
    expect($('[data-act="share"]')!.getAttribute('aria-label')).toBe('Ссылка — все правки');
    expect($('[data-act="collapse"]')!.getAttribute('aria-label')).toBe('Свернуть');
    expect($<HTMLInputElement>('.search input')!.value).toBe('a');
    expect($('.panel')!.getAttribute('aria-label')).toBe('Панель motionrig');
    expect(host()!.hasAttribute('open')).toBe(true);
    $('[data-act="collapse"]')!.click();
    expect($('.ring')!.getAttribute('aria-label')).toBe('Открыть motionrig');
  });
});
