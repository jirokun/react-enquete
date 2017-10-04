import { Record } from 'immutable';
import { SURVEY_NOT_MODIFIED } from '../../../constants/states';
import { TAB_QUESTIONS } from '../../../constants/editor';

export const ViewSettingRecord = Record({
  flowPane: true,
  editorPane: true,
  previewPane: true,
  showAllJsEditor: false,
  saveSurveyStatus: SURVEY_NOT_MODIFIED,
  selectedPageEditorTab: TAB_QUESTIONS,
  allJavaScriptSavedAt: null,
  showMenuConfig: false,
});

/** editorのviewの定義 */
export default class ViewSetting extends ViewSettingRecord {
  getFlowPane() {
    return this.get('flowPane');
  }

  getEditorPane() {
    return this.get('editorPane');
  }

  getPreviewPane() {
    return this.get('previewPane');
  }

  getSaveSurveyStatus() {
    return this.get('saveSurveyStatus');
  }

  getSelectedPageEditorTab() {
    return this.get('selectedPageEditorTab');
  }

  getShowAllJsEditor() {
    return this.get('showAllJsEditor');
  }

  getAllJavaScriptSavedAt() {
    return this.get('allJavaScriptSavedAt');
  }

  getShowMenuConfig() {
    return this.get('showMenuConfig');
  }

  // ---------------------- 更新系 --------------------------
  /** 属性値を変更する */
  updateViewAttribute(attribute, value) {
    return this.set(attribute, value);
  }

  /** surveyの保存リクエスト状態を更新する */
  updateSaveSurveyStatus(saveStatus) {
    return this.set('saveSurveyStatus', saveStatus);
  }

  /** pageEditorの選択しているタブを変更する */
  updateSelectedPageEditorTab(eventKey) {
    return this.set('selectedPageEditorTab', eventKey);
  }

  updateShowAllJsEditorAndSetNullToSavedAt(value) {
    return this.merge({
      showAllJsEditor: value,
      allJavaScriptSavedAt: null,
    });
  }
}
