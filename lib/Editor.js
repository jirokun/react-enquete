/* eslint-env browser,jquery */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import EnqueteEditorApp from './editor/containers/EnqueteEditorApp';
import { configureStore } from './editor/store';
import { json2ImmutableState } from './runtime/store';
import ParsleyInit from './ParsleyInit';
import './editor/css/editor.scss';

/** Editorのエントリポイント */
export function Editor(el, json) {
  ParsleyInit();
  const initialState = json2ImmutableState(json);
  const store = configureStore(initialState);

  render(
    <Provider store={store}>
      <EnqueteEditorApp />
    </Provider>,
    el,
  );
}
