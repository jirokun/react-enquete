/* eslint-env browser,jquery */
import 'babel-polyfill';
import 'classlist-polyfill';
import Raven from 'raven-js';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import EnqueteEditorApp from './editor/containers/EnqueteEditorApp';
import { configureStore } from './editor/store';
import SurveyDesignerState from './runtime/models/SurveyDesignerState';
import ParsleyWrapper from './ParsleyWrapper';
import { RequiredBrowserNoticeForEditor } from './browserRequirements';
import { isIELowerEquals } from './browserUtils';
import './editor/tinymce_plugins/reference';
import './editor/tinymce_plugins/imageManager';
import './editor/css/editor.scss';

function setInitialCssUrls(initialState) {
  if (initialState.getSurvey().hasCssUrls()) {
    return initialState;
  }

  if (initialState.getOptions().hasCssOptions()) {
    const cssUrls = initialState.getOptions().getCssOptions().first().get('urls');
    return initialState.update('survey', survey => survey.updateCssUrls(cssUrls));
  }

  return initialState;
}

/** 編集画面のエントリポイント */
export function Editor(el, json) {
  if (isIELowerEquals(10)) {
    render(<RequiredBrowserNoticeForEditor />, el);
    return;
  }

  if (json.options.sentryInitFn) {
    json.options.sentryInitFn(Raven);
  }

  // デフォルトのオプション
  const defaultOptions = {
    visibilityConditionDisabled: true,
    disableTransformQuestion: true,
  };

  json.options = Object.assign(defaultOptions, json.options);
  if (ENV.RUNTIME_CSS_URL != null) {
    json.options.cssOptions.unshift({ title: 'ENV設定値', urls: ENV.RUNTIME_CSS_URL.split(/,/) });
  }


  new ParsleyWrapper(el);
  let initialState = SurveyDesignerState.createFromJson(json);
  if (initialState.getSurvey().getNodes().size === 0) {
    // nodesがない場合には初期データを追加する
    initialState = initialState.update('survey', survey => survey.addNode(0, 'page').addNode(1, 'finisher'));
  }
  initialState = setInitialCssUrls(initialState);
  const store = configureStore(initialState);

  render(
    <Provider store={store}>
      <EnqueteEditorApp />
    </Provider>,
    el,
  );
}
