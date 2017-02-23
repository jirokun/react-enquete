import uuid from 'node-uuid';
import { List } from 'immutable';
import BaseQuestionDefinition from './BaseQuestionDefinition';
import OutputDefinition from './OutputDefinition';

/** 設問定義：複数選択肢 */
export default class CheckboxQuestionDefinition extends BaseQuestionDefinition {
  static create() {
    return new CheckboxQuestionDefinition({ _id: uuid.v4(), dataType: 'Checkbox' });
  }

  /** 設問が出力する項目の一覧を返す */
  getOutputDefinitions() {
    let outputDefinitions = List();
    this.getTransformedItems().forEach((item) => {
      const baseName = `${this.getId()}__value${item.getIndex() + 1}`;
      outputDefinitions = outputDefinitions.push(new OutputDefinition({
        _id: item.getId(),
        name: `${baseName}`,
        label: `${item.getPlainLabel()}`,
        outputType: 'checkbox',
        postfix: `${item.getIndex() + 1}`,
      }));
      // 追加入力分
      if (item.hasAdditionalInput()) {
        outputDefinitions = outputDefinitions.push(new OutputDefinition({
          _id: `${item.getId()}_text`,
          name: `${baseName}_text`,
          label: `${item.getPlainLabel()}の自由入力`,
          outputType: item.getAdditionalInputType(),
          postfix: `${item.getIndex() + 1}-text`,
        }));
      }
    });
    return outputDefinitions;
  }
}
