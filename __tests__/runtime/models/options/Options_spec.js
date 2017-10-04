/* eslint-env jest */
import { List } from 'immutable';
import Option from '../../../../lib/runtime/models/options/Options';
import CssOption from '../../../../lib/runtime/models/options/CssOption';

describe('Option', () => {
  describe('getShowDetailUrl', () => {
    it('詳細プレビューのURLを取得できる', () => {
      const option = new Option({showDetailUrl: 'http://example.com'});
      expect(option.getShowDetailUrl(false)).toBe('http://example.com');
      expect(option.getShowDetailUrl(true)).toBe('http://example.com?env=development');
    });
  });

  describe('getCssOptionIdByUrls', () => {
    it('マッチするURLがある場合、対応するcssOptionを返す', () => {
      const cssOption1 = CssOption.create('title1', List.of('a.css', 'b.css'), List.of('c.css', 'd.css'));
      const cssOption2 = CssOption.create('title2', List.of('e.css', 'f.css'), List.of('g.css', 'h.css'));
      const cssOptions = List.of(cssOption1, cssOption2);
      const option = new Option({ cssOptions });
      expect(option.getCssOptionIdByUrls(List.of('a.css', 'b.css'), List.of('c.css', 'd.css'))).toBe(cssOption1.getId());
    });

    it('マッチするURLがない場合、対応するcssOptionを返す', () => {
      const cssOption1 = CssOption.create('title1', List.of('a.css', 'b.css'), List.of('c.css', 'd.css'));
      const cssOption2 = CssOption.create('title2', List.of('e.css', 'f.css'), List.of('g.css', 'h.css'));
      const cssOptions = List.of(cssOption1, cssOption2);
      const option = new Option({ cssOptions });
      expect(option.getCssOptionIdByUrls(List.of('a.css', 'b.css'), List.of('c.css', 'i.css'))).toBeNull();
    });
  });

  describe('getCssOptionById', () => {
    it('マッチするURLがある場合、対応するcssOptionを返す', () => {
      const cssOption1 = CssOption.create('title1', List.of('a.css', 'b.css'), List.of('c.css', 'd.css'));
      const cssOption2 = CssOption.create('title2', List.of('e.css', 'f.css'), List.of('g.css', 'h.css'));
      const cssOptions = List.of(cssOption1, cssOption2);
      const option = new Option({ cssOptions });
      expect(option.getCssOptionById(cssOption1.getId())).toBe(cssOption1);
    });

    it('マッチするURLがない場合、対応するcssOptionを返す', () => {
      const cssOption1 = CssOption.create('title1', List.of('a.css', 'b.css'), List.of('c.css', 'd.css'));
      const cssOption2 = CssOption.create('title2', List.of('e.css', 'f.css'), List.of('g.css', 'h.css'));
      const cssOptions = List.of(cssOption1, cssOption2);
      const option = new Option({ cssOptions });
      expect(option.getCssOptionById('hoge')).toBeNull();
    });
  });

  describe('hasCssOptions', () => {
    it('CssOptionが存在する場合、trueを返す', () => {
      const cssOption1 = CssOption.create('title1', List.of('a.css', 'b.css'), List.of('c.css', 'd.css'));
      const cssOption2 = CssOption.create('title2', List.of('e.css', 'f.css'), List.of('g.css', 'h.css'));
      const cssOptions = List.of(cssOption1, cssOption2);
      const option = new Option({ cssOptions });
      expect(option.hasCssOptions()).toBeTruthy();
    });

    it('CssOptionが存在しない場合、trueを返す', () => {
      const cssOptions = new List();
      const option = new Option({ cssOptions });
      expect(option.hasCssOptions()).toBeFalsy();
    });
  });
});
