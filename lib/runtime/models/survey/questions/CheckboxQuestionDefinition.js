import cuid from 'cuid';
import { List } from 'immutable';
import BaseQuestionDefinition from './BaseQuestionDefinition';
import OutputDefinition from './OutputDefinition';
import ItemDefinition from './ItemDefinition';

/** 設問定義：複数選択肢 */
export default class CheckboxQuestionDefinition extends BaseQuestionDefinition {
  static create() {
    return new CheckboxQuestionDefinition({
      _id: cuid(),
      dataType: 'Checkbox',
      items: List().push(ItemDefinition.create(0)),
    });
  }

  /** 出力に使用する名前を取得する */
  getOutputName(index, additionalInput) {
    const baseName = `${this.getId()}__value${index + 1}`;
    if (additionalInput) return `${baseName}__text`;
    return baseName;
  }

  /** 設問が出力する項目の一覧を返す */
  getOutputDefinitions(pageNo, questionNo) {
    let outputDefinitions = List();
    this.getItems().forEach((item) => {
      outputDefinitions = outputDefinitions.push(new OutputDefinition({
        _id: item.getId(),
        name: this.getOutputName(item.getIndex(), false),
        label: `${item.getPlainLabel()}`,
        outputType: 'checkbox',
        outputNo: BaseQuestionDefinition.createOutputNo(pageNo, questionNo, item.getIndex() + 1),
      }));
      // 追加入力分
      if (item.hasAdditionalInput()) {
        outputDefinitions = outputDefinitions.push(new OutputDefinition({
          _id: `${item.getId()}__text`,
          name: this.getOutputName(item.getIndex(), true),
          label: `${item.getPlainLabel()}の自由入力`,
          outputType: item.getAdditionalInputType(),
          outputNo: BaseQuestionDefinition.createOutputNo(pageNo, questionNo, item.getIndex() + 1, 'text'),
        }));
      }
    });
    return outputDefinitions;
  }
}